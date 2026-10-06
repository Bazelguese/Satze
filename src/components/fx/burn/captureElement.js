// «Foto» di un elemento DOM su canvas, da usare come texture della bruciatura.
// html-to-image incorpora arte (<img>), canvas interni e font web usati dall'elemento:
// senza, un SVG foreignObject perderebbe immagini e Chakra Petch.

import { toCanvas, getFontEmbedCSS } from 'html-to-image';

/** CSS dei font già incorporati in base64, per famiglia: le foto successive non riscaricano. */
const fontCssCache = new Map();

/** Famiglie di font usate nel sottoalbero (stessa chiave con cui html-to-image filtra). */
function fontKeyOf(node) {
  const families = new Set();
  const walk = (el) => {
    if (!(el instanceof Element)) return;
    const ff = getComputedStyle(el).fontFamily;
    if (ff) families.add(ff);
    for (const child of el.children) walk(child);
  };
  walk(node);
  return [...families].sort().join('|') || 'default';
}

/**
 * Le arti delle carte sono <img loading="lazy">: fuori schermo non partono e la carta
 * mostra il segnaposto «?». Le forza in eager, le attende (con tetto) e lascia a React
 * due frame per sostituire il segnaposto con l'immagine.
 */
async function waitForImages(node, timeoutMs = 4000) {
  const pending = Array.from(node.querySelectorAll('img')).filter((img) => !(img.complete && img.naturalWidth > 0));
  if (!pending.length) return;
  pending.forEach((img) => {
    if (img.loading === 'lazy') img.loading = 'eager';
  });
  const loaded = Promise.all(
    pending.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
    ),
  );
  await Promise.race([loaded, new Promise((r) => setTimeout(r, timeoutMs))]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/**
 * @param {HTMLElement} node elemento da fotografare (senza transform proprio)
 * @param {{ pixelRatio?: number }} [opts]
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function captureElementToCanvas(node, opts = {}) {
  if (!node) throw new Error('capture: elemento mancante');
  const rect = node.getBoundingClientRect();
  const width = Math.max(1, Math.round(node.offsetWidth || rect.width));
  const height = Math.max(1, Math.round(node.offsetHeight || rect.height));
  const pixelRatio = Math.min(3, Math.max(1, opts.pixelRatio || Math.min(2, window.devicePixelRatio || 1)));

  await document.fonts?.ready;
  await waitForImages(node);

  const key = fontKeyOf(node);
  let fontEmbedCSS = fontCssCache.get(key);
  if (fontEmbedCSS == null) {
    try {
      fontEmbedCSS = await getFontEmbedCSS(node);
    } catch (err) {
      console.warn('[burn] font non incorporati, uso i fallback', err);
      fontEmbedCSS = '';
    }
    fontCssCache.set(key, fontEmbedCSS);
  }

  return toCanvas(node, {
    width,
    height,
    pixelRatio,
    fontEmbedCSS,
    // la foto è dell'elemento a riposo: niente transform del nodo radice e piena opacità
    // (il contenuto può essere già nascosto da una bruciatura precedente)
    style: { transform: 'none', margin: '0', opacity: '1', transition: 'none' },
    cacheBust: false,
  });
}
