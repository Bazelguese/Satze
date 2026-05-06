/**
 * Precarica tutte le risorse grafiche del gioco all'avvio.
 * Evita rallentamenti quando si passa da una sezione all'altra.
 */
import { ALL_BATTLEFIELDS } from '../data/battlefields';
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
  const full = path.startsWith('/')
    ? `${base}${path.slice(1)}`
    : path.startsWith('./') && (base === './' || base === '.')
      ? path
      : `${base}${path}`;
  return full.replace(/\/+/g, '/').replace(/\.\/\.\//g, './');
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
 * Restituisce l'array di tutti gli URL da precaricare
 */
export function getAssetUrls() {
  const urls = new Set();

  // GIF menu principale (path relativi per Electron)
  urls.add(resolveUrl('./menu-bg-war.gif'));

  // Immagini campi di battaglia
  ALL_BATTLEFIELDS.forEach((f) => {
    if (f.bgImage) urls.add(resolveUrl(f.bgImage));
  });

  // Sfondi armate
  Object.values(ARMY_GIFS).forEach((path) => {
    if (path) urls.add(resolveUrl(path));
  });

  // Bandiere menu (path relativi per Electron)
  for (let i = 1; i <= 7; i++) {
    urls.add(resolveUrl(`./flag-mode-${i}.gif`));
  }

  // Sfondi pannelli Log e FC
  urls.add(resolveUrl('/Immagini_bg/CampoLOG_bg.png'));
  urls.add(resolveUrl('/Immagini_bg/CampoFC_bg.png'));

  return [...urls].filter(Boolean);
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
