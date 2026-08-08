/**
 * Fusione accenti d'armata in oklch (mazzi misti).
 * Sostituisce la media RGB pesata: quella spegne il croma quando le tinte
 * sono lontane (rosso + cobalto → viola slavato). Qui L è media pesata,
 * la tinta è la media circolare pesata (quindi ancorata all'armata dominante)
 * e il croma resta vicino al più saturo dei due accenti.
 */

const srgbToLin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const linToSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);

export function hexToOklch(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  const [R, G, B] = [1, 2, 3].map((i) => srgbToLin(parseInt(m[i], 16) / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const mm = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const a = 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s;
  return {
    L: 0.2104542553 * l + 0.7936177850 * mm - 0.0040720468 * s,
    C: Math.hypot(a, b),
    h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

/** oklch → hex, con riduzione di croma se il colore esce dalla gamma sRGB. */
export function oklchToHex(L, C, h) {
  let c = C;
  for (let i = 0; i < 24; i++) {
    const r = (h * Math.PI) / 180;
    const rgb = oklabToRgb(L, c * Math.cos(r), c * Math.sin(r));
    if (rgb.every((v) => v >= -0.0015 && v <= 1.0015)) {
      return (
        '#' +
        rgb
          .map((v) => Math.round(Math.min(255, Math.max(0, linToSrgb(v) * 255))).toString(16).padStart(2, '0'))
          .join('')
      );
    }
    c *= 0.94;
  }
  return '#' + [L, L, L].map(() => Math.round(Math.min(255, Math.max(0, linToSrgb(L) * 255))).toString(16).padStart(2, '0')).join('');
}

/**
 * Fonde N accenti pesati.
 * @param {Array<{ accent: string, weight: number }>} parts
 * @returns {string|null} hex
 */
export function blendAccentsOklch(parts) {
  const items = (parts || [])
    .map((p) => ({ c: hexToOklch(p.accent), w: p.weight || 0 }))
    .filter((p) => p.c && p.w > 0);
  if (items.length === 0) return null;
  if (items.length === 1) return oklchToHex(items[0].c.L, items[0].c.C, items[0].c.h);

  const total = items.reduce((s, p) => s + p.w, 0);
  let L = 0, x = 0, y = 0, meanC = 0, maxC = 0;
  for (const { c, w } of items) {
    const k = w / total;
    L += c.L * k;
    meanC += c.C * k;
    maxC = Math.max(maxC, c.C);
    // il croma pesa nella media circolare: un neutro (Apex, Calibri) non deve
    // trascinare la tinta della coppia
    const vw = k * Math.max(c.C, 0.02);
    x += Math.cos((c.h * Math.PI) / 180) * vw;
    y += Math.sin((c.h * Math.PI) / 180) * vw;
  }
  const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const C = maxC * 0.88 + meanC * 0.12;
  return oklchToHex(L, C, h);
}
