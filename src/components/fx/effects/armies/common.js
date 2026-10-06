// Utilità condivise dagli effetti delle armate.

import { SWEEP_DIRECTIONS, sweepBaseAt } from '../../fxNoise.js';

export { SWEEP_DIRECTIONS };

/** Parametri del campo di avanzamento dagli usuali sweepScale/sweepAmount/direction/origin/seed. */
export function sweepOf(params) {
  return {
    direction: params.direction ?? 'scatter',
    originX: params.originX ?? 0.5,
    originY: params.originY ?? 0.5,
    seed: params.seed ?? 0,
    scale: params.sweepScale ?? 3,
    amount: params.sweepAmount ?? 0.5,
  };
}

/** Campo normalizzato 0-1 in un punto (come sweepN nello shader). */
export function sweepAt(env, aspect, x, y) {
  const r = env.range;
  return Math.max(0, Math.min(1, (sweepBaseAt(x, y, env.sweep, aspect) - r.min) / Math.max(r.max - r.min, 1e-4)));
}

/** Punto casuale (uv elemento) per cui `test(x, y)` è vero, o null. */
export function samplePoint(test, tries = 14) {
  for (let i = 0; i < tries; i += 1) {
    const x = Math.random();
    const y = Math.random();
    if (test(x, y)) return [x, y];
  }
  return null;
}

/** Altezza dell'elemento in px CSS (per dimensionare particelle sulla carta). */
export function cardHeightPx(state, canvas) {
  return (state.rect[3] * canvas.height) / state.dpr;
}

/** Margini larghi per effetti che escono dalla carta (raggi, onde, coriandoli). */
export const widePadding = (w, h) => {
  const m = Math.max(w, h);
  return { left: m * 0.6, right: m * 0.6, top: m * 0.6, bottom: m * 0.45 };
};

export const smoothstepJs = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
