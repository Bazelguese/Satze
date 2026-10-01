/**
 * Snapshot DOM → object URL (PNG). Preferire `minimalCss` per carte P4 (stili inline).
 */

const cache = new Map();

/** Utility usate da CardReworkP4 — evita di serializzare tutto Tailwind. */
const MINIMAL_CARD_CSS = `
.relative{position:relative}
.absolute{position:absolute}
.inset-0{top:0;right:0;bottom:0;left:0}
.left-0{left:0}.right-0{right:0}
.overflow-hidden{overflow:hidden}
.select-none{user-select:none;-webkit-user-select:none}
.pointer-events-none{pointer-events:none}
.flex{display:flex}
.items-center{align-items:center}
.items-baseline{align-items:baseline}
.justify-center{justify-content:center}
.justify-between{justify-content:space-between}
.w-full{width:100%}
.h-\\[52px\\]{height:52px}
.z-\\[4\\]{z-index:4}
.z-\\[1\\]{z-index:1}
.min-w-0{min-width:0}
.gap-2{gap:0.5rem}
.gap-3{gap:0.75rem}
.pb-2{padding-bottom:0.5rem}
.mb-2{margin-bottom:0.5rem}
.-mx-2\\.5{margin-left:-0.625rem;margin-right:-0.625rem}
.px-2\\.5{padding-left:0.625rem;padding-right:0.625rem}
.min-h-\\[1\\.375rem\\]{min-height:1.375rem}
.text-right{text-align:right}
.block{display:block}
`;

function cacheKey(id, w, h) {
  return `${id}|${w}x${h}`;
}

export function getBakedCardUrl(id, w, h) {
  return cache.get(cacheKey(id, w, h)) || null;
}

export function rememberBakedCardUrl(id, w, h, url) {
  const key = cacheKey(id, w, h);
  const prev = cache.get(key);
  if (prev && prev !== url) URL.revokeObjectURL(prev);
  cache.set(key, url);
}

function collectAccessibleCss() {
  let css = '';
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (let i = 0; i < rules.length; i += 1) {
        css += `${rules[i].cssText}\n`;
      }
    } catch {
      /* fogli cross-origin */
    }
  }
  return css;
}

/**
 * @param {HTMLElement} node
 * @param {{ width?: number, height?: number, pixelRatio?: number, minimalCss?: boolean }} [opts]
 * @returns {Promise<string>} object URL
 */
export async function bakeDomNodeToObjectUrl(node, opts = {}) {
  if (!node) throw new Error('bake: missing node');
  const rect = node.getBoundingClientRect();
  const width = Math.max(1, Math.round(opts.width || rect.width));
  const height = Math.max(1, Math.round(opts.height || rect.height));
  const pixelRatio = Math.min(2, Math.max(1, opts.pixelRatio || Math.min(2, window.devicePixelRatio || 1)));

  await document.fonts.ready;
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return img.decode?.().catch(() => {}) || Promise.resolve();
    }),
  );

  const clone = node.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  }

  const cssText = opts.minimalCss ? MINIMAL_CARD_CSS : collectAccessibleCss();
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;background:transparent">
      <style>${cssText.replace(/]]>/g, ']]\\>')}</style>
      ${serialized}
    </div>
  </foreignObject>
</svg>`;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = svgUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('bake: no 2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('bake: toBlob failed'))), 'image/png');
    });
    return URL.createObjectURL(pngBlob);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
