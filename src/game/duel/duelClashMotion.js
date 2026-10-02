// Regia dello scontro (fase 4) dal mockup «Satze Duello»: carica, impatto con rinculo,
// lo sconfitto sbalzato via, il vincitore che torna al suo posto, zoom e scossa della camera,
// lame di luce, scintille, lampo e titolo. Solo presentazione: tutto in funzione di t (0-1).

/** Distanza oltre l'ancora che le carte percorrono fino al contatto (px, scala scena). */
export const CLASH_CONTACT_PX = 200;
/** Quota dello scontro in cui partono i proiettili sui PV: il titolo lascia la scena. */
export const CLASH_TITLE_OUT = 0.88;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function ss(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function ease(u) { const x = clamp(u, 0, 1); return 1 - Math.pow(1 - x, 3); }
function easeIn(u) { const x = clamp(u, 0, 1); return x * x; }
/** Ritorno con un poco di rimbalzo (sbalzo dello sconfitto). */
function back(u) { const x = clamp(u, 0, 1); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

/**
 * Tempo dello scontro rallentato attorno all'impatto: corsa (0-0.52), quasi fermo
 * all'impatto (0.52-0.572), poi il seguito.
 */
export function warpClashTime(u) {
  if (u < 0.52) return u * (0.55 / 0.52);
  if (u < 0.572) return 0.55 + (u - 0.52) * (0.01 / 0.052);
  return 0.56 + (u - 0.572) * (0.44 / 0.428);
}

/**
 * Moto delle carte (offset dall'ancora, scala, rotazione, opacità) e intensità dell'impatto.
 * @param {number} aw tempo già deformato (warpClashTime)
 * @param {{ winner: 'player'|'enemy'|'draw', start: number, baseScale: number, contact?: number }} cfg
 */
export function clashCardMotion(aw, { winner, start, baseScale, contact = CLASH_CONTACT_PX }) {
  const wind = ss(0.04, 0.2, aw) * (1 - ss(0.22, 0.32, aw));
  const rush = easeIn(ss(0.24, 0.55, aw));
  const impact = ss(0.55, 0.575, aw) * (1 - ss(0.66, 0.86, aw));
  const kb = back(ss(0.575, 0.9, aw));
  const kbx = ease(ss(0.575, 0.88, aw));
  const settle = ease(ss(0.6, 0.95, aw));
  const recoil = ss(0.55, 0.57, aw) * (1 - ss(0.57, 0.64, aw));
  const out = { impact, settle, wind, rush };
  ['enemy', 'player'].forEach((side) => {
    const sg = side === 'player' ? 1 : -1;
    const base = start + wind * 34 - rush * (start + contact);
    if (winner === side) {
      // il vincitore torna alla sua postazione e lascia libero il centro
      out[side] = {
        x: sg * (base + recoil * 26 + settle * (contact + start)),
        y: -wind * 6,
        scale: baseScale * (1 + rush * 0.2 + wind * 0.04 - settle * 0.08),
        rot: sg * (wind * 3 - rush * 5 * (1 - settle)),
        opacity: 1,
      };
    } else {
      // lo sconfitto (o entrambi in pareggio) viene sbalzato via ruotando
      out[side] = {
        x: sg * (base + kbx * (contact + start + 20)),
        y: kb * 18,
        scale: baseScale * (1 + rush * 0.2 - kb * 0.2),
        rot: sg * (wind * 3 - rush * 5 + kb * 26),
        opacity: 1 - kb * 0.25,
      };
    }
  });
  return out;
}

/**
 * Camera dello scontro: zoom verso le carte nell'impatto, scossa, bande cinema più alte.
 * @param {number} u tempo lineare 0-1 della fase 4
 * @param {number} aw tempo deformato
 * @param {number} impact intensità dell'impatto (clashCardMotion)
 * @param {number} cardCenterDy scarto verticale del centro carte dal centro scena (px)
 */
export function clashCamera(u, aw, impact, cardCenterDy = 0) {
  const zoom = ss(0.26, 0.55, aw) * (1 - ss(0.64, 0.9, aw));
  const scale = 1 + zoom * 0.42;
  const shake = impact * 16;
  return {
    zoom,
    scale,
    x: Math.sin(u * 260) * shake,
    y: -zoom * cardCenterDy * scale + Math.cos(u * 210) * shake,
    bars: 44 * zoom,
  };
}

/** Lame di luce, scintille, lampo, stemma e titolo nel tempo deformato. */
export function clashImpactFx(aw, impact, settle) {
  const slashOn = ss(0.55, 0.556, aw) * (1 - ss(0.59, 0.7, aw));
  return {
    slashOn,
    slashReveal: [ss(0.55, 0.562, aw), ss(0.554, 0.566, aw)],
    sparks: clamp((aw - 0.553) / 0.3, 0, 1),
    flash: ss(0.53, 0.56, aw) * (1 - ss(0.58, 0.66, aw)),
    sigil: (impact * 0.95 + settle * 0.35) * (1 - ss(0.74, 1, aw)) * 0.7,
    sigilScale: 0.4 + (impact + settle * 0.5) * 1.4,
    sigilRot: (impact + settle * 0.3) * 25,
    title: settle > 0.1 ? ss(0.65, 0.78, aw) : 0,
    titleScale: ss(0.65, 0.85, aw),
  };
}

/** Pseudo-casuale stabile per le scintille. */
export function clashRnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
