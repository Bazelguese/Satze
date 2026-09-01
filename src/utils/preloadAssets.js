/**
 * Precarica le risorse grafiche essenziali del menu all'avvio.
 * Gli sfondi dei campi di battaglia (public/campi_bg/, ~260MB) NON vengono
 * precaricati qui: si caricano on-demand a inizio partita con
 * preloadBattlefieldImages(), che riceve solo i campi estratti.
 */
import { ARMY_GIFS } from '../data/armies';

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
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Non bloccare su errori
    img.src = url;
  });
}

/**
 * Restituisce l'array degli URL essenziali da precaricare all'avvio (solo menu).
 */
export function getAssetUrls() {
  const urls = new Set();

  // Sfondi armate (usati nel menu di selezione armata e nella mano)
  Object.values(ARMY_GIFS).forEach((path) => {
    if (path) urls.add(resolveUrl(path));
  });

  // Sfondi pannelli Log e FC
  urls.add(resolveUrl('/Immagini_bg/CampoLOG_bg.webp'));
  urls.add(resolveUrl('/Immagini_bg/CampoFC_bg.webp'));

  return [...urls].filter(Boolean);
}

/**
 * Precarica gli sfondi dei campi passati (tipicamente i campi estratti
 * per la partita corrente). Fire-and-forget: non blocca il flusso di gioco.
 */
export async function preloadBattlefieldImages(fields) {
  if (!Array.isArray(fields)) return;

  // Prima le miniature del tabellone: sono ~20 kB l'una e servono subito.
  const thumbs = [...new Set(fields.map((f) => resolveFieldThumbUrl(f?.bgImage)).filter(Boolean))];
  await Promise.all(thumbs.map(preloadImage));

  // Poi gli sfondi a piena risoluzione, a coppie: caricarli tutti insieme
  // satura decode e memoria GPU proprio mentre parte la partita.
  const full = [...new Set(fields.map((f) => resolveUrl(f?.bgImage)).filter(Boolean))];
  for (let i = 0; i < full.length; i += 2) {
    await Promise.all(full.slice(i, i + 2).map(preloadImage));
  }
}

/**
 * Precarica tutte le risorse e invoca onProgress(loaded, total, percent).
 * Ritorna una Promise che si risolve quando il caricamento è completo.
 */
export async function preloadAllAssets(onProgress) {
  const urls = getAssetUrls();
  const total = urls.length;

  if (total === 0) {
    onProgress?.(0, 0, 100);
    return;
  }

  let loaded = 0;
  const report = () => {
    loaded++;
    const percent = Math.round((loaded / total) * 100);
    onProgress?.(loaded, total, percent);
  };

  // Precarica in batch per non sovraccaricare la rete
  const BATCH = 8;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    await Promise.all(batch.map((url) => preloadImage(url).then(report)));
  }

  onProgress?.(loaded, total, 100);
}
