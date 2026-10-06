// Calibri Pesanti · «Saldatura» (ingresso): la carta compare come una lastra di ferro grezzo,
// scura; una linea incandescente la percorre come una saldatura e dietro di sé lascia la
// carta, che si raffredda dal rosso ai suoi colori, tra poche scintille.
// «Acciaio. Inerzia. Sopravvivenza.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uIron;
uniform float uThreshold;
uniform float uBand;
uniform float uCool;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  // ferro grezzo: grigio scuro martellato, con il disegno appena in rilievo
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  float ham = fbm(P * 18.0);
  vec3 iron = vec3(0.09, 0.09, 0.1) + vec3(0.12, 0.12, 0.13) * l + vec3(0.06) * (ham - 0.5);
  // la saldatura: dietro (d > 0) c'è la carta, ancora calda vicino alla linea
  float d = uThreshold - sweepN(p);
  float W = uBand;
  float done = smoothstep(0.0, W * 0.3, d);
  float core = exp(-abs(d) / (W * 0.18));
  float halo = exp(-abs(d) / (W * 0.8));
  float heat = (1.0 - smoothstep(0.0, uCool, d)) * done;
  vec3 hot = mix(vec3(0.6, 0.08, 0.0), vec3(1.0, 0.55, 0.12), heat);
  vec3 card = tex.rgb + hot * heat * 0.8 * tex.a;
  vec3 col = mix(iron * tex.a * uIron, card, done);
  col += vec3(1.0, 0.95, 0.85) * core * tex.a + vec3(1.0, 0.5, 0.1) * halo * 0.35 * tex.a;
  float a = tex.a * max(uIron, done);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function threshold(t, p) {
  const k = clamp01((t - p.weldStart) / Math.max(p.weldEnd - p.weldStart, 0.05));
  return -p.band + (1.0 + p.band * 2 + p.cool) * k;
}

export const calibriSaldaturaEffect = {
  id: 'calibri-saldatura',
  army: 'Calibri Pesanti',
  role: 'entry',
  label: 'Saldatura',
  kind: 'in',
  description: 'La carta compare come ferro grezzo; una linea incandescente la percorre come una saldatura e lascia la carta, che si raffredda.',
  defaults: {
    durationMs: 2600,
    color: '#a9a294',
    ironIn: 0.1,
    weldStart: 0.15,
    weldEnd: 0.9,
    band: 0.05,
    cool: 0.3,
    sparks: 70,
    direction: 'top',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.12,
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
    uniforms: ['uIron', 'uThreshold', 'uBand', 'uCool'],
    sweep: sweepOf,
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uIron, ease(clamp01(t / Math.max(params.ironIn, 0.02))));
      gl.uniform1f(u.uThreshold, threshold(t, params));
      gl.uniform1f(u.uBand, params.band);
      gl.uniform1f(u.uCool, params.cool);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const T = threshold(t, params);
      const on = t > params.weldStart && T < 1 && !state.done ? 1 : 0;
      const n = env.clock(params.sparks * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => Math.abs(T - sweepAt(env, aspect, x, y)) < params.band * 0.4);
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 0.08 + Math.random() * 0.22;
        env.embers.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.4, size: 1 + Math.random() * 1.6, heat: 0.8 + Math.random() * 0.2 });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 1 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['ironIn', 'Comparsa del ferro', 0.02, 0.3, 0.01],
    ['weldStart', 'Inizio saldatura', 0.05, 0.5, 0.01],
    ['weldEnd', 'Fine saldatura', 0.5, 0.97, 0.01],
    ['band', 'Spessore linea', 0.01, 0.15, 0.005],
    ['cool', 'Scia calda', 0.05, 0.6, 0.01],
    ['sparks', 'Scintille / s', 0, 250, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    saldatura: { label: 'Saldatura', params: {} },
    fiamma: { label: 'Cannello rapido', params: { durationMs: 1800, band: 0.035, cool: 0.2, sparks: 140 } },
  },
};
