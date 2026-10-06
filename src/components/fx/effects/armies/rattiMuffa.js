// Ratti della Megera · «Muffa» (ingresso): una muffa verde-nera si allarga a chiazze nella
// sagoma della carta, intessuta di filamenti di micelio; poi si ritira e lascia la carta.
// Per un attimo vi brilla il Marchio, un livido a forma di labbra, che subito svanisce.
// «Non lancia maledizioni. È la maledizione.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uGrow;
uniform float uRecede;
uniform float uMark;
uniform float uLipSize;

/** Labbra (coordinate locali, larghezza ±1). */
float lips(vec2 m) {
  float x = m.x;
  float w = max(0.0, 1.0 - x * x);
  float mid = 0.05 * w - 0.02;
  float top = -0.42 * pow(w, 0.8) + 0.16 * exp(-x * x / 0.02) * w;
  float bot = 0.48 * pow(w, 0.9);
  float inside = step(top, m.y) * step(m.y, bot) * step(abs(x), 1.0);
  return inside * (1.0 - 0.7 * exp(-abs(m.y - mid) / 0.03));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  // chiazze: la muffa compare dove il rumore è sotto la soglia di crescita
  float blot = fbm(P * 3.2 + 2.0);
  float grown = smoothstep(blot - 0.03, blot + 0.03, uGrow * 1.25 - 0.1);
  // si ritira seguendo un altro disegno, a macchie che si restringono
  float rec = fbm(P * 2.6 + 11.0);
  float gone = smoothstep(rec - 0.03, rec + 0.03, uRecede * 1.25 - 0.1);
  // micelio: filamenti fitti, chiari sul bordo della chiazza
  float fil = 1.0 - smoothstep(0.0, 0.035, abs(fbm(P * 22.0) - 0.5));
  float fil2 = 1.0 - smoothstep(0.0, 0.03, abs(fbm(P * 40.0 + 3.0) - 0.5));
  float rimG = (1.0 - smoothstep(0.0, 0.06, abs(uGrow * 1.25 - 0.1 - blot))) * (1.0 - gone);
  float rimR = (1.0 - smoothstep(0.0, 0.05, abs(uRecede * 1.25 - 0.1 - rec))) * step(0.001, uRecede);
  vec3 neon = mix(uColor, vec3(0.7, 1.0, 0.45), 0.35);
  vec3 mold = vec3(0.03, 0.06, 0.03) + uColor * 0.18 * fbm(P * 9.0) + neon * (fil * 0.35 + fil2 * 0.2);
  mold += neon * (rimG + rimR) * 0.35 * (0.5 + fil);

  float moldA = grown * (1.0 - gone);
  vec3 col = tex.rgb * gone + mold * tex.a * moldA;
  float a = tex.a * max(gone, moldA);
  // il Marchio: un livido a forma di labbra che si accende e svanisce sulla carta
  vec2 m = (P - vec2(0.5 * uAspect, 0.42)) / vec2(uLipSize, uLipSize * 0.9);
  float lip = lips(m) * uMark * gone;
  col = mix(col, neon * 0.7 * tex.a, lip * 0.55);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const rattiMuffaEffect = {
  id: 'ratti-muffa',
  army: 'Ratti della Megera',
  role: 'entry',
  label: 'Muffa',
  kind: 'in',
  description: 'Una muffa verde-nera si allarga a chiazze nella sagoma della carta e ritirandosi la lascia; il Marchio brilla un attimo e svanisce.',
  defaults: {
    durationMs: 2800,
    color: '#40ad60',
    growEnd: 0.38,
    recedeStart: 0.42,
    lipSize: 0.08,
    mark: 0.8,
    spores: 40,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => ({ left: w * 0.2, right: w * 0.2, top: h * 0.25, bottom: h * 0.1 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uGrow', 'uRecede', 'uMark', 'uLipSize'],
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uGrow, ease(clamp01(t / Math.max(params.growEnd, 0.05))));
      gl.uniform1f(u.uRecede, ease(clamp01((t - params.recedeStart) / Math.max(0.9 - params.recedeStart, 0.05))));
      // il Marchio affiora quando la muffa se n'è andata e svanisce prima della fine
      const k = clamp01((t - 0.72) / 0.25);
      gl.uniform1f(u.uMark, params.mark * Math.sin(k * Math.PI));
      gl.uniform1f(u.uLipSize, params.lipSize);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // spore che salgono piano dalla muffa
      const on = t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.spores * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, Math.random(), Math.random());
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.015, vy: -0.015 - Math.random() * 0.02, life: 0.8 + Math.random() * 0.8, size: 1 + Math.random() * 1.6, heat: 0.3 + Math.random() * 0.4, rise: 0.005 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['growEnd', 'Crescita muffa', 0.1, 0.6, 0.01],
    ['recedeStart', 'Ritiro muffa', 0.2, 0.75, 0.01],
    ['lipSize', 'Misura del Marchio', 0.03, 0.2, 0.005],
    ['mark', 'Intensità Marchio', 0, 1.5, 0.01],
    ['spores', 'Spore / s', 0, 150, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    muffa: { label: 'Muffa', params: {} },
    marcita: { label: 'Marcescenza lenta', params: { durationMs: 3600, growEnd: 0.45, recedeStart: 0.5, mark: 1 } },
  },
};
