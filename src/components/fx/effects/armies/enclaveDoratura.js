// L'Enclave delle Scaglie · «Doratura» (ingresso): la carta compare coperta da un velo di
// foglia d'oro, che si consuma in scaglie sottili e irregolari scoprendo la carta sotto,
// con qualche luccichio. «Ogni corona rubata ci avvicina al cielo.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uLeafIn;
uniform float uWear;
uniform float uFlake;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  // scaglie sottili: celle irregolari (Voronoi), ognuna si stacca nel suo istante
  vec2 g = P / uFlake;
  vec2 gi = floor(g);
  float d1 = 9.0;
  float d2 = 9.0;
  vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = vec2(hash(gi + o), hash(gi + o + 5.3));
      float d = length(gi + o + h - g);
      if (d < d1) { d2 = d1; d1 = d; id = gi + o; } else if (d < d2) { d2 = d; }
    }
  }
  vec2 cu = clamp(vec2((id.x + 0.5) * uFlake / uAspect, (id.y + 0.5) * uFlake), 0.0, 1.0);
  float tOff = sweepN(cu) * 0.82 + hash(id + 2.2) * 0.18;
  float off = step(tOff, uWear);
  float near = smoothstep(tOff - 0.08, tOff, uWear) * (1.0 - off);

  // foglia d'oro: metallica, con grinze sottili e un riflesso che scorre
  float crink = fbm(P * 26.0 + id);
  vec3 gold = mix(uColor, vec3(1.0, 0.84, 0.42), 0.6);
  float sheen = 0.5 + 0.5 * sin((P.x + P.y) * 6.0 - uTime * 1.5 + crink * 2.0);
  vec3 leaf = gold * (0.55 + 0.35 * crink + 0.3 * sheen);
  // il disegno traspare appena in rilievo sotto la foglia
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  leaf *= 0.8 + 0.3 * l;
  // la scaglia che sta per staccarsi si solleva: bordo chiaro e ombra
  float edge = 1.0 - smoothstep(0.0, 0.06, d2 - d1);
  leaf += vec3(1.0, 0.95, 0.8) * edge * near * 0.6;
  leaf *= 1.0 - edge * 0.25;
  vec3 col = mix(leaf * tex.a * uLeafIn, tex.rgb, off);
  float a = tex.a * max(uLeafIn, off);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const enclaveDoraturaEffect = {
  id: 'enclave-doratura',
  army: "L'Enclave delle Scaglie",
  role: 'entry',
  label: 'Doratura',
  kind: 'in',
  description: "La carta compare coperta di foglia d'oro, che si consuma in scaglie sottili scoprendola, con qualche luccichio.",
  defaults: {
    durationMs: 2600,
    color: '#fb912d',
    leafIn: 0.12,
    wearStart: 0.25,
    flakeSize: 0.035,
    flecks: 70,
    glints: 16,
    direction: 'scatter',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 2.5,
    sweepAmount: 0.8,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.25, right: m * 0.25, top: m * 0.2, bottom: m * 0.45 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uLeafIn', 'uWear', 'uFlake'],
    sweep: sweepOf,
    maxFlakes: 600,
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uLeafIn, ease(clamp01(t / Math.max(params.leafIn, 0.02))));
      gl.uniform1f(u.uWear, clamp01((t - params.wearStart) / Math.max(0.92 - params.wearStart, 0.05)) * 1.01);
      gl.uniform1f(u.uFlake, params.flakeSize);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const wear = clamp01((t - params.wearStart) / Math.max(0.92 - params.wearStart, 0.05));
      const on = wear > 0 && wear < 1 && !state.done ? 1 : 0;
      const gold = env.color.map((c, i) => c * 0.4 + [1, 0.84, 0.42][i] * 0.6);
      // scagliette d'oro che si staccano e cadono piano
      const n = env.clock(params.flecks * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => Math.abs(sweepAt(env, aspect, x, y) * 0.82 + 0.09 - wear) < 0.06);
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        env.flakes.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.04, vy: 0.01, life: 0.9 + Math.random() * 0.8, size: 2.5 + Math.random() * 3, color: gold.map((c) => c * (0.8 + Math.random() * 0.3)), shape: 4, gravity: 0.25, drag: 1.2, flutter: 8 + Math.random() * 8 });
      }
      // qualche luccichio
      const g = env.clock2(params.glints * on, state.dt);
      for (let i = 0; i < g; i += 1) {
        const [cx, cy] = toCanvasUv(rect, Math.random(), Math.random());
        env.embers.spawn(cx, cy, { vx: 0, vy: 0, life: 0.2 + Math.random() * 0.3, size: 2 + Math.random() * 2, heat: 1, rise: 0 });
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['leafIn', "Comparsa dell'oro", 0.02, 0.4, 0.01],
    ['wearStart', 'Inizio consumo', 0.05, 0.6, 0.01],
    ['flakeSize', 'Misura scaglie', 0.015, 0.1, 0.001],
    ['flecks', 'Scagliette / s', 0, 300, 1],
    ['glints', 'Luccichii / s', 0, 100, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    doratura: { label: 'Doratura', params: {} },
    reliquia: { label: 'Reliquia antica', params: { durationMs: 3400, wearStart: 0.35, flakeSize: 0.025, flecks: 140 } },
  },
};
