// «Foto» di un elemento DOM su canvas, da usare come texture della bruciatura.
// html-to-image incorpora arte (<img>), canvas interni e font web usati dall'elemento:
// senza, un SVG foreignObject perderebbe immagini e Chakra Petch.

import { toCanvas, getFontEmbedCSS } from 'html-to-image';

/**
 * Proprietà che non cambiano l'aspetto di una foto statica (animazioni, transizioni, scroll,
 * interazione, impaginazione) o che duplicano le fisiche (logiche block/inline, sempre in
 * orizzontale qui). html-to-image copia ogni proprietà calcolata su ogni elemento clonato:
 * togliendo queste la foto resta identica al pixel e costa meno al thread principale.
 */
const SKIP_STYLE_RE =
  /^(animation|transition|scroll|overscroll|view-timeline|view-transition|timeline|trigger|anchor|position-(anchor|area|try|visibility)|interest|caret|column-rule|row-rule|rule-overlap|math-|ruby-|-webkit-ruby|text-emphasis|hyphenate|scrollbar|-webkit-user|break-|contain-intrinsic-(block|inline)|border-(block|inline)-|border-(start|end)-(start|end)-radius|inset-(block|inline)|margin-(block|inline)|padding-(block|inline)|(min-|max-)?(block|inline)-size$|overflow-(block|inline)$|corner-(start|end))/;
const SKIP_STYLE = new Set([
  'interactivity', 'cursor', 'pointer-events', 'user-select', 'touch-action', 'resize', 'speak',
  'app-region', 'window-drag', 'will-change', '-webkit-tap-highlight-color', 'field-sizing',
  'reading-flow', 'reading-order', 'print-color-adjust', 'forced-color-adjust', 'accent-color',
  'buffered-rendering', 'orphans', 'widows', 'initial-letter', 'overlay', 'dynamic-range-limit',
  'overflow-anchor', 'interpolate-size', 'container-name', 'scroll-marker-group', 'scroll-target-group',
  'text-fit', '-webkit-user-drag', '-webkit-user-modify', 'caption-side', 'empty-cells', '-webkit-locale',
  '-webkit-rtl-ordering', 'text-size-adjust', 'flex-line-count', 'column-height', 'column-wrap', 'border-shape',
]);

let snapshotStyleProps = null;
function snapshotStyleProperties() {
  if (!snapshotStyleProps) {
    snapshotStyleProps = Array.from(window.getComputedStyle(document.documentElement)).filter(
      (name) => !SKIP_STYLE.has(name) && !SKIP_STYLE_RE.test(name)
    );
  }
  return snapshotStyleProps;
}

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
    includeStyleProperties: snapshotStyleProperties(),
  });
}

/**
 * Foto preparate in anticipo, condivise tra componenti: la chiave descrive tutto ciò che
 * cambia l'aspetto del contenuto (chi la usa deve garantirlo). Chi poi monta lo stesso
 * contenuto con la stessa chiave riusa la foto invece di scattarla nel momento critico.
 */
const sharedSnapshots = new Map();
const SHARED_SNAPSHOT_LIMIT = 24;
/** Per i test: con window.__satzeFxDebug le foto preparate e i riusi diventano ispezionabili. */
const sharedStats = { hit: 0, miss: 0, missKeys: [] };
if (typeof window !== 'undefined' && window.__satzeFxDebug === true) {
  window.__satzeSharedSnapshots = {
    map: sharedSnapshots,
    stats: sharedStats,
    capture: (node) => captureElementToCanvas(node),
  };
}

function sharedKeyOf(key) {
  return `${key}|dpr${typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}`;
}

/** Foto condivisa (Promise del canvas) per questa chiave, o null. */
export function getSharedSnapshot(key) {
  if (key == null) return null;
  const found = sharedSnapshots.get(sharedKeyOf(key)) || null;
  sharedStats[found ? 'hit' : 'miss'] += 1;
  if (!found && window.__satzeSharedSnapshots) {
    sharedStats.missKeys.push({ key, phase: document.documentElement.dataset.satzePhase, at: Math.round(performance.now()) });
  }
  return found;
}

export function hasSharedSnapshot(key) {
  return key != null && sharedSnapshots.has(sharedKeyOf(key));
}

/** Toglie una foto condivisa (es. scattata su un nodo smontato a metà). */
export function discardSharedSnapshot(key) {
  if (key != null) sharedSnapshots.delete(sharedKeyOf(key));
}

/** Scatta (una volta sola per chiave) e conserva la foto di `node`. */
export function precaptureElement(key, node, opts = {}) {
  const k = sharedKeyOf(key);
  const existing = sharedSnapshots.get(k);
  if (existing) return existing;
  const promise = captureElementToCanvas(node, opts);
  sharedSnapshots.set(k, promise);
  promise.catch(() => {
    if (sharedSnapshots.get(k) === promise) sharedSnapshots.delete(k);
  });
  // le più vecchie escono per prime (Map conserva l'ordine d'inserimento)
  while (sharedSnapshots.size > SHARED_SNAPSHOT_LIMIT) {
    sharedSnapshots.delete(sharedSnapshots.keys().next().value);
  }
  return promise;
}
