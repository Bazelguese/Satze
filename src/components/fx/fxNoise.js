// Rumore e «campo di avanzamento» condivisi dagli effetti: stessa formula in GLSL
// (per lo shader) e in JS (per sapere dove nascono faville e granelli, o in che ordine
// si staccano). Le operazioni critiche in JS passano da float32 per restare allineate
// alla GPU.

/** Direzioni comuni da cui parte un effetto che avanza sull'elemento. */
export const SWEEP_DIRECTIONS = {
  bottom: 'Dal basso',
  top: "Dall'alto",
  left: 'Da sinistra',
  right: 'Da destra',
  center: 'Dal centro',
  point: 'Da un punto',
  scatter: 'Sparso',
};

/** Vettore di avanzamento (uv, y giù) e modalità shader per una direzione. */
export function sweepDirection(direction) {
  switch (direction) {
    case 'top':
      return { mode: 0, dir: [0, 1] };
    case 'left':
      return { mode: 0, dir: [1, 0] };
    case 'right':
      return { mode: 0, dir: [-1, 0] };
    case 'center':
      return { mode: 1, dir: [0, 0], origin: [0.5, 0.5] };
    case 'point':
      return { mode: 1, dir: [0, 0] };
    case 'scatter':
      return { mode: 2, dir: [0, 0] };
    case 'bottom':
    default:
      return { mode: 0, dir: [0, -1] };
  }
}

export const NOISE_GLSL = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amp *= 0.5;
  }
  return v / 0.9375;
}
`;

/**
 * Campo base 0-1 (circa): dove è basso l'effetto arriva prima.
 * Richiede le uniform dichiarate qui sotto; p in uv dell'elemento (y giù).
 */
export const SWEEP_GLSL = `
uniform vec2 uDir;
uniform float uMode;
uniform vec2 uOrigin;
uniform float uAspect;
uniform float uSeed;
uniform float uSweepScale;
uniform float uSweepAmount;

float sweepBase(vec2 p) {
  vec2 q = vec2(p.x * uAspect, p.y);
  float d;
  if (uMode < 0.5) {
    float ext = abs(uDir.x) + abs(uDir.y);
    d = dot(p - 0.5, uDir) / max(ext, 1e-4) + 0.5;
  } else if (uMode < 1.5) {
    vec2 o = uOrigin;
    float m = max(
      max(length(vec2(o.x * uAspect, o.y)), length(vec2((1.0 - o.x) * uAspect, o.y))),
      max(length(vec2(o.x * uAspect, 1.0 - o.y)), length(vec2((1.0 - o.x) * uAspect, 1.0 - o.y)))
    );
    d = length(vec2((p.x - o.x) * uAspect, p.y - o.y)) / max(m, 1e-4);
  } else {
    d = 0.5;
  }
  float n = fbm(q * uSweepScale + vec2(mod(uSeed * 7.31, 61.0), mod(uSeed * 3.17, 53.0)));
  float amount = uMode > 1.5 ? 1.0 : uSweepAmount;
  return mix(d, n, amount);
}
`;

/** Imposta le uniform di SWEEP_GLSL. `sweep` = { direction, originX, originY, seed, scale, amount }. */
export function setSweepUniforms(gl, u, sweep, aspect) {
  const info = sweepDirection(sweep.direction);
  const origin = info.origin || [sweep.originX, sweep.originY];
  gl.uniform2f(u.uDir, info.dir[0], info.dir[1]);
  gl.uniform1f(u.uMode, info.mode);
  gl.uniform2f(u.uOrigin, origin[0], origin[1]);
  gl.uniform1f(u.uAspect, aspect);
  gl.uniform1f(u.uSeed, sweep.seed);
  gl.uniform1f(u.uSweepScale, sweep.scale);
  gl.uniform1f(u.uSweepAmount, sweep.amount);
}

export const SWEEP_UNIFORMS = ['uDir', 'uMode', 'uOrigin', 'uAspect', 'uSeed', 'uSweepScale', 'uSweepAmount'];

// --- versione JS ---

const f32 = Math.fround;
const fract = (x) => x - Math.floor(x);

export function hashJs(x, y) {
  let px = fract(f32(x * 123.34));
  let py = fract(f32(y * 456.21));
  const d = f32(f32(px * f32(px + 45.32)) + f32(py * f32(py + 45.32)));
  px = f32(px + d);
  py = f32(py + d);
  return fract(f32(px * py));
}

export function noiseJs(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hashJs(ix, iy);
  const b = hashJs(ix + 1, iy);
  const c = hashJs(ix, iy + 1);
  const d = hashJs(ix + 1, iy + 1);
  const top = a + (b - a) * ux;
  const bottom = c + (d - c) * ux;
  return top + (bottom - top) * uy;
}

export function fbmJs(x, y) {
  let v = 0;
  let amp = 0.5;
  for (let i = 0; i < 4; i += 1) {
    v += amp * noiseJs(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.2;
    amp *= 0.5;
  }
  return v / 0.9375;
}

/** Stesso calcolo di sweepBase nello shader. */
export function sweepBaseAt(px, py, sweep, aspect) {
  const info = sweepDirection(sweep.direction);
  let d;
  if (info.mode === 0) {
    const [dx, dy] = info.dir;
    const ext = Math.abs(dx) + Math.abs(dy);
    d = ((px - 0.5) * dx + (py - 0.5) * dy) / Math.max(ext, 1e-4) + 0.5;
  } else if (info.mode === 1) {
    const [ox, oy] = info.origin || [sweep.originX, sweep.originY];
    const m = Math.max(
      Math.hypot(ox * aspect, oy),
      Math.hypot((1 - ox) * aspect, oy),
      Math.hypot(ox * aspect, 1 - oy),
      Math.hypot((1 - ox) * aspect, 1 - oy),
    );
    d = Math.hypot((px - ox) * aspect, py - oy) / Math.max(m, 1e-4);
  } else {
    d = 0.5;
  }
  const sx = (sweep.seed * 7.31) % 61;
  const sy = (sweep.seed * 3.17) % 53;
  const n = fbmJs(px * aspect * sweep.scale + sx, py * sweep.scale + sy);
  const amount = info.mode === 2 ? 1 : sweep.amount;
  return d + (n - d) * amount;
}

/** Minimo e massimo di sweepBase sull'elemento, campionati su griglia (con piccolo margine). */
export function measureSweepRange(sweep, aspect) {
  let min = Infinity;
  let max = -Infinity;
  const nx = 28;
  const ny = 40;
  for (let iy = 0; iy <= ny; iy += 1) {
    for (let ix = 0; ix <= nx; ix += 1) {
      const v = sweepBaseAt(ix / nx, iy / ny, sweep, aspect);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min: min - 0.015, max: max + 0.015 };
}

/** Cache di measureSweepRange: si ricalcola solo quando cambiano i parametri del campo. */
export function createSweepRangeCache() {
  let cache = { key: '', min: 0, max: 1 };
  return (sweep, aspect) => {
    const key = [sweep.direction, sweep.originX, sweep.originY, sweep.seed, sweep.scale, sweep.amount, aspect.toFixed(4)].join('|');
    if (cache.key !== key) cache = { key, ...measureSweepRange(sweep, aspect) };
    return cache;
  };
}
