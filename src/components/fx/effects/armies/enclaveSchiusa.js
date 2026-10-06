// L'Enclave delle Scaglie · «Schiusa» (ingresso): compare un uovo di drago dal guscio a
// scaglie; dondola, si incrina con crepe incandescenti, e si schiude: i pezzi di guscio
// saltano via e dentro, in un lampo di calore, c'è la carta. I coboldi vogliono diventare Draghi.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { mulberry } from '../../pieces.js';

const FRAG = `${QUAD_HEADER}
uniform float uShow;
uniform float uRock;
uniform float uCrack;
uniform float uHatch;
uniform float uGlow;
uniform float uScale;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  // l'uovo dondola sulla sua base
  vec2 base = vec2(0.0, 0.62);
  vec2 E = rot2(P - base, -uRock) + base;
  E /= max(uScale, 0.05);
  vec2 er = vec2(0.5 * uAspect + 0.17, 0.72);
  // uovo: più largo in basso
  vec2 eq = E / er;
  eq.x /= 1.0 - 0.12 * eq.y;
  float egg = length(eq);
  float inEgg = 1.0 - smoothstep(0.985, 1.0, egg);

  // guscio a scaglie
  vec2 S = vec2(E.x, E.y) * 11.0;
  float row = floor(S.y);
  vec2 g = vec2(S.x + mod(row, 2.0) * 0.5, S.y);
  vec2 cell = fract(g) - vec2(0.5, 0.2);
  float scale = length(cell * vec2(1.0, 0.9));
  float scaleEdge = smoothstep(0.42, 0.55, scale);
  vec3 shellBase = mix(uColor * 0.55, vec3(0.32, 0.18, 0.08), 0.45);
  vec3 shell = shellBase * (0.75 + 0.35 * (1.0 - cell.y)) * (1.0 - scaleEdge * 0.45);
  shell += vec3(1.0, 0.85, 0.6) * pow(max(0.0, 1.0 - length(eq - vec2(-0.35, -0.45)) * 1.8), 3.0) * 0.35;

  // crepe: bordi di celle (Voronoi) che si allungano dal punto in cima
  vec2 vg = E * 5.0;
  vec2 vi = floor(vg);
  float d1 = 9.0;
  float d2 = 9.0;
  vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = vec2(hash(vi + o), hash(vi + o + 5.3));
      float d = length(vi + o + h - vg);
      if (d < d1) { d2 = d1; d1 = d; id = vi + o; } else if (d < d2) { d2 = d; }
    }
  }
  float fromTop = length(E - vec2(0.0, -0.55));
  float crackLine = (1.0 - smoothstep(0.03, 0.08, d2 - d1)) * (1.0 - smoothstep(uCrack * 1.6 - 0.15, uCrack * 1.6, fromTop));
  vec3 hot = mix(uColor, vec3(1.0, 0.92, 0.7), 0.5);
  // schiusa: ogni pezzo di guscio salta via in un istante diverso (dall'alto)
  float pieceT = 0.15 + hash(id + 3.3) * 0.35 + clamp(fromTop * 0.35, 0.0, 0.5);
  float gone = step(pieceT, uHatch);
  float shellA = inEgg * (1.0 - gone) * uShow;

  // dentro: la carta, nel calore della schiusa
  vec4 tex = cardAt(p);
  float inside = step(0.001, uHatch);
  vec3 card = tex.rgb + hot * uGlow * tex.a * 0.8;
  vec3 col = card * inside * (1.0 - shellA);
  float a = tex.a * inside * (1.0 - shellA);
  vec3 sh = shell + hot * crackLine * 1.4;
  col += sh * shellA;
  a = max(a, shellA);
  // luce dalle crepe sopra il guscio
  col += hot * crackLine * shellA * 0.3;
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const enclaveSchiusaEffect = {
  id: 'enclave-schiusa',
  army: "L'Enclave delle Scaglie",
  role: 'entry',
  label: 'Schiusa',
  kind: 'in',
  description: 'Un uovo di drago dondola, si incrina con crepe incandescenti e si schiude rivelando la carta.',
  defaults: {
    durationMs: 2900,
    color: '#fb912d',
    appear: 0.1,
    crackStart: 0.25,
    hatch: 0.58,
    rock: 0.08,
    shards: 90,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.4, right: m * 0.4, top: m * 0.35, bottom: m * 0.3 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uShow', 'uRock', 'uCrack', 'uHatch', 'uGlow', 'uScale'],
    maxFlakes: 600,
    bind: (gl, u, { params, progress: t, time }) => {
      const show = ease(clamp01(t / Math.max(params.appear, 0.02)));
      gl.uniform1f(u.uShow, show);
      gl.uniform1f(u.uScale, 0.85 + 0.15 * show);
      // dondola sempre più forte finché non si schiude
      const c = params.crackStart;
      const build = clamp01((t - c * 0.5) / Math.max(params.hatch - c * 0.5, 0.05));
      gl.uniform1f(u.uRock, t < params.hatch ? Math.sin(time * (8 + build * 14)) * params.rock * build : 0);
      gl.uniform1f(u.uCrack, ease(clamp01((t - c) / Math.max(params.hatch - c, 0.05))));
      const h = clamp01((t - params.hatch) / 0.2);
      gl.uniform1f(u.uHatch, h > 0 ? 0.001 + h : 0);
      gl.uniform1f(u.uGlow, h > 0 ? (1 - ease(clamp01((t - params.hatch) / Math.max(0.95 - params.hatch, 0.05)))) : 0);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      if (prev < params.hatch && t >= params.hatch && t - prev < 0.3) {
        const rand = mulberry(7);
        const shell = env.color.map((c, i) => c * 0.5 + [0.32, 0.18, 0.08][i] * 0.5);
        for (let i = 0; i < params.shards; i += 1) {
          const a = -Math.PI / 2 + (rand() - 0.5) * 3.4;
          const sp = 0.15 + Math.random() * 0.45;
          const [cx, cy] = toCanvasUv(rect, 0.5 + Math.cos(a) * 0.3, 0.45 + Math.sin(a) * 0.4);
          env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.7 + Math.random() * 0.6, size: 5 + Math.random() * 9, color: shell.map((c) => c * (0.7 + Math.random() * 0.5)), shape: 4, gravity: 1.2, drag: 0.5 });
        }
        for (let i = 0; i < 60; i += 1) {
          const a = Math.random() * Math.PI * 2;
          const sp = 0.1 + Math.random() * 0.3;
          const [cx, cy] = toCanvasUv(rect, 0.5, 0.45);
          env.embers.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.5, size: 1 + Math.random() * 2.5, heat: 0.8 + Math.random() * 0.2 });
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['appear', 'Comparsa uovo', 0.02, 0.3, 0.01],
    ['crackStart', 'Prime crepe', 0.05, 0.6, 0.01],
    ['hatch', 'Schiusa', 0.2, 0.8, 0.01],
    ['rock', 'Dondolio', 0, 0.25, 0.005],
    ['shards', 'Pezzi di guscio', 0, 250, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    schiusa: { label: 'Schiusa', params: {} },
    draghetto: { label: 'Uovo irrequieto', params: { durationMs: 3400, crackStart: 0.18, hatch: 0.66, rock: 0.16, shards: 160 } },
  },
};
