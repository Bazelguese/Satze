// Geometria della schermata di scelta delle Eminenze (EminenceChoicePortal.jsx).

/** Portale a riposo (come Battlefield: PORTAL_RX / PORTAL_RY) e aperto, stesse proporzioni. */
export const CHOICE_PORTAL_CLOSED = { rx: 58, ry: 78 };
export const CHOICE_PORTAL_OPEN = { rx: 277, ry: 372 };
export const CHOICE_PORTAL_FALLBACK_CENTER = { x: 960, y: 498 };
/** Risposte: distanza dalla ghiera e spessore della placca (px di scena). */
export const PLATE_GAP = 12;
export const PLATE_T = 62;

const OPEN = CHOICE_PORTAL_OPEN;

/** Ampiezza complessiva (gradi) dell'arco delle risposte, per numero di risposte. */
export function answerSpan(count) {
  return count <= 1 ? 46 : count === 2 ? 100 : count === 3 ? 132 : 152;
}

/**
 * Punto sull'ellisse (rx, ry) all'angolo `deg`, spostato di `off` lungo la normale:
 * così le placche hanno spessore costante e capi perpendicolari alla ghiera.
 */
export function ellipsePoint(rx, ry, deg, off = 0) {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  const nx = c / rx;
  const ny = s / ry;
  const len = Math.hypot(nx, ny) || 1;
  return [c * rx + (nx / len) * off, s * ry + (ny / len) * off];
}

function arcLine(rx, ry, from, to, off, steps = 24) {
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const [x, y] = ellipsePoint(rx, ry, from + ((to - from) * i) / steps, off);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** Geometria delle placche: la prima a sinistra, l'ultima a destra, lungo il fondo dell'ovale. */
export function answerPlates(count, { rx = OPEN.rx, ry = OPEN.ry, gap = PLATE_GAP, thick = PLATE_T } = {}) {
  const span = answerSpan(count);
  const seg = span / Math.max(1, count);
  const start = 90 + span / 2;
  const pad = 2.2;
  return Array.from({ length: count }, (_, i) => {
    const from = start - i * seg - pad;
    const to = start - (i + 1) * seg + pad;
    let shape = arcLine(rx, ry, from, to, gap);
    for (let j = 24; j >= 0; j -= 1) {
      const [x, y] = ellipsePoint(rx, ry, from + ((to - from) * j) / 24, gap + thick);
      shape += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const mid = (from + to) / 2;
    // lunghezza utile per l'etichetta, a metà spessore (un margine ai capi)
    let length = 0;
    let prev = ellipsePoint(rx, ry, from, gap + thick / 2);
    for (let j = 1; j <= 24; j += 1) {
      const next = ellipsePoint(rx, ry, from + ((to - from) * j) / 24, gap + thick / 2);
      length += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
      prev = next;
    }
    return {
      length: length * 0.86,
      shape: `${shape}Z`,
      label: (ratio) => arcLine(rx, ry, from, to, gap + thick * ratio),
      gloss: arcLine(rx, ry, from - 0.6, to + 0.6, gap + 6),
      push: [Math.cos((mid * Math.PI) / 180) * 6, Math.sin((mid * Math.PI) / 180) * 6],
    };
  });
}

