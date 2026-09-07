/**
 * Precarica le risorse grafiche all'avvio (boot generale).
 *
 * Include: sfondi armate, pannelli HUD, logo, arte agenti/tipi, dorsi,
 * eminenze, miniature campi. Gli sfondi campo a piena risoluzione
 * (~260MB in public/campi_bg/) restano on-demand a inizio partita.
 */
import { ARMY_GIFS } from '../data/armies';
import { AGENT_IMAGE_PATHS, CARD_IMAGE_PATHS, getNascenteStageImageUrl, markImageUrlPreloaded } from '../data/images';
import { ALL_BATTLEFIELDS } from '../data/battlefields';
import { EMINENCES } from '../data/eminences';
import { getEminenceArtUrl, EMINENCE_ART_FALLBACK } from '../data/eminenceArt';
import { CARD_BACK_IMAGES } from './cardBackPicker';
import { BRAND_LOGO_SRC } from '../theme/hudOratorioPalette';

function getBaseUrl() {
  return typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL != null
    ? import.meta.env.BASE_URL
    : '/';
}

function resolveUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('data:')) return null; // base64, non preload
  const base = getBaseUrl();
  // Path già relativi (./) per Electron: usa così com'è se base è ./
  // In browser (base `/`) normalizza `./campi_bg/...` → `/campi_bg/...`
  let full;
  if (path.startsWith('/')) {
    full = `${base}${path.slice(1)}`;
  } else if (path.startsWith('./') && (base === './' || base === '.')) {
    full = path;
  } else if (path.startsWith('./')) {
    full = `${base}${path.slice(2)}`;
  } else {
    full = `${base}${path}`;
  }
  return full.replace(/\/+/g, '/').replace(/\.\/\.\//g, './');
}

/** URL asset in public/ — funziona in browser e in Electron (base ./). */
export function resolvePublicAssetUrl(path) {
  return resolveUrl(path);
}

/**
 * Variante ridotta di uno sfondo campo (public/campi_bg/thumbs/, generata da
 * `npm run thumbs`). Da usare dove il campo è disegnato in miniatura: un
 * 3376×1440 costa ~18,5 MB di memoria GPU anche in un chip alto 30 px.
 */
export function resolveFieldThumbUrl(path) {
  if (!path || typeof path !== 'string') return null;
  const slash = path.lastIndexOf('/');
  if (slash < 0) return resolveUrl(path);
  return resolveUrl(`${path.slice(0, slash)}/thumbs${path.slice(slash)}`);
}

function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new Image();
    const done = () => {
      markImageUrlPreloaded(url);
      resolve();
    };
    img.onload = () => {
      // decode() forza la decompressione ora, non al primo paint in gioco
      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = () => resolve(); // Non bloccare su errori (file mancanti ok)
    img.src = url;
  });
}

/**
 * Catalogo URL del boot generale (tutto tranne i full-bleed campi).
 */
export function getAssetUrls() {
  const urls = new Set();

  Object.values(ARMY_GIFS).forEach((path) => {
    if (path) urls.add(resolveUrl(path));
  });

  urls.add(resolveUrl('/Immagini_bg/CampoLOG_bg.webp'));
  urls.add(resolveUrl('/Immagini_bg/CampoFC_bg.webp'));

  if (BRAND_LOGO_SRC) urls.add(BRAND_LOGO_SRC);

  Object.values(AGENT_IMAGE_PATHS).forEach((path) => {
    if (path) urls.add(path);
  });
  Object.values(CARD_IMAGE_PATHS).forEach((path) => {
    if (path) urls.add(path);
  });
  for (let i = 0; i <= 3; i += 1) {
    urls.add(getNascenteStageImageUrl(i));
  }

  CARD_BACK_IMAGES.forEach((path) => {
    if (path) urls.add(path);
  });

  urls.add(EMINENCE_ART_FALLBACK);
  Object.values(EMINENCES).forEach((em) => {
    const url = getEminenceArtUrl(em);
    if (url) urls.add(url);
  });

  // Miniature tabellone: leggere, usate ovunque; full-res solo a inizio partita
  if (Array.isArray(ALL_BATTLEFIELDS)) {
    ALL_BATTLEFIELDS.forEach((field) => {
      const thumb = resolveFieldThumbUrl(field?.bgImage);
      if (thumb) urls.add(thumb);
    });
  }

  return [...urls].filter(Boolean);
}

/**
 * Precarica gli sfondi dei campi passati (tipicamente i campi estratti
 * per la partita corrente). Opzionale onProgress(loaded, total, percent).
 */
export async function preloadBattlefieldImages(fields, onProgress) {
  if (!Array.isArray(fields)) {
    onProgress?.(0, 0, 100);
    return;
  }

  const thumbs = [...new Set(fields.map((f) => resolveFieldThumbUrl(f?.bgImage)).filter(Boolean))];
  const full = [...new Set(fields.map((f) => resolveUrl(f?.bgImage)).filter(Boolean))];
  const urls = [...thumbs, ...full];
  const total = urls.length || 1;
  let loaded = 0;
  const report = () => {
    loaded += 1;
    onProgress?.(loaded, total, Math.round((loaded / total) * 100));
  };

  // Miniature subito (parallele)
  await Promise.all(thumbs.map((url) => preloadImage(url).then(report)));

  // Full-res a coppie: evita spike di decode GPU
  for (let i = 0; i < full.length; i += 2) {
    await Promise.all(full.slice(i, i + 2).map((url) => preloadImage(url).then(report)));
  }

  onProgress?.(total, total, 100);
}

async function waitForFonts() {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Precarica tutte le risorse del boot e invoca onProgress(loaded, total, percent).
 * Ritorna una Promise che si risolve quando il caricamento è completo.
 */
export async function preloadAllAssets(onProgress) {
  const urls = getAssetUrls();
  const total = urls.length;

  if (total === 0) {
    await waitForFonts();
    onProgress?.(0, 0, 100);
    return;
  }

  let loaded = 0;
  const report = () => {
    loaded += 1;
    const percent = Math.round((loaded / total) * 100);
    onProgress?.(loaded, total, percent);
  };

  // Batch ampi ma limitati: più parallelo = boot più corto senza saturare HTTP/2
  const BATCH = 16;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    await Promise.all(batch.map((url) => preloadImage(url).then(report)));
  }

  await waitForFonts();
  onProgress?.(loaded, total, 100);
}
