// Orathai · «Linfa» (ingresso): venature di linfa verde-acqua risalgono la carta dal basso,
// ramificate come radici; i colori della carta la riempiono seguendo le venature, che poi si
// spengono. Cade qualche foglia. Gli Orathai sono creature lignee.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uFront;
uniform float uSpread;
uniform float uVeinW;
uniform float uGlow;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  // venature: linee di livello di un rumore stirato in verticale (crescono come radici)
  vec2 Q = vec2(P.x * 1.6, P.y * 0.7) + (vec2(fbm(P * 3.0), fbm(P * 3.0 + 5.0)) - 0.5) * 0.25;
  float n = abs(fbm(Q * 5.0) - 0.5);
  float n2 = abs(fbm(Q * 11.0 + 3.3) - 0.5);
  // fronte di crescita (dal basso) e da quanto tempo è passato qui
  float since = uFront - sweepN(p);
  float reached = smoothstep(0.0, 0.02, since);
  float vein = (1.0 - smoothstep(uVeinW * 0.5, uVeinW, n)) * reached;
  float twig = (1.0 - smoothstep(uVeinW * 0.25, uVeinW * 0.5, n2)) * smoothstep(0.03, 0.08, since);
  // riempimento: i colori si allargano dalle venature
  float r = max(since, 0.0) * uSpread;
  float filled = (1.0 - smoothstep(r - 0.02, r + 0.02, min(n, n2 * 1.4))) * reached;
  vec3 sap = mix(uColor, vec3(0.85, 1.0, 0.95), 0.35);
  vec3 col = tex.rgb * filled;
  float a = tex.a * filled;
  // la linfa luminosa, più viva appena arrivata
  float fresh = 1.0 - smoothstep(0.0, 0.35, since);
  float vA = max(vein, twig * 0.6) * uGlow * (0.35 + 0.5 * fresh) * tex.a;
  col = col * (1.0 - vA) + sap * vA;
  a = max(a, vA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const orathaiLinfaEffect = {
  id: 'orathai-linfa',
  army: 'Orathai',
  role: 'entry',
  label: 'Linfa',
  kind: 'in',
  description: 'Venature di linfa risalgono la carta come radici e i colori la riempiono seguendole; cade qualche foglia.',
  defaults: {
    durationMs: 2800,
    color: '#5ad4bc',
    growEnd: 0.6,
    spread: 1.4,
    veinWidth: 0.012,
    leaves: 14,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.45,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.2, right: m * 0.3, top: m * 0.15, bottom: m * 0.4 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uFront', 'uSpread', 'uVeinW', 'uGlow'],
    sweep: sweepOf,
    bind: (gl, u, { params, progress: t }) => {
      // il fronte arriva in cima a growEnd e continua oltre perché il riempimento finisca
      const g = Math.max(0.1, params.growEnd);
      gl.uniform1f(u.uFront, (t / g) * 1.02 + Math.max(0, t - g) * 0.8);
      gl.uniform1f(u.uSpread, params.spread);
      gl.uniform1f(u.uVeinW, params.veinWidth);
      gl.uniform1f(u.uGlow, 1 - ease(clamp01((t - 0.78) / 0.2)));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const on = t > 0.2 && t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.leaves * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.1 + Math.random() * 0.8, Math.random() * 0.6);
        const g = Math.random();
        env.flakes.spawn(cx, cy, { vx: 0.02 + Math.random() * 0.04, vy: 0.01, life: 1.4 + Math.random(), size: 5 + Math.random() * 4, color: g < 0.5 ? [0.16, 0.34, 0.12] : env.color.map((c) => c * 0.7), shape: 1, gravity: 0.08, drag: 1, flutter: 4 + Math.random() * 4 });
      }
      env.flakes.step(state.dt, (f, dt) => {
        f.vy += f.gravity * dt;
        f.vx += Math.sin(f.age * 3 + f.phase) * 0.05 * dt;
        const kk = Math.exp(-f.drag * dt);
        f.vx *= kk;
        f.vy *= kk;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['growEnd', 'Salita venature', 0.2, 0.85, 0.01],
    ['spread', 'Riempimento', 0.4, 4, 0.05],
    ['veinWidth', 'Spessore venature', 0.01, 0.08, 0.001],
    ['leaves', 'Foglie / s', 0, 80, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    linfa: { label: 'Linfa', params: {} },
    radici: { label: 'Radici profonde', params: { durationMs: 3400, growEnd: 0.7, spread: 1, veinWidth: 0.018 } },
  },
};
