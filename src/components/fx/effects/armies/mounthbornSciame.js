// Mounthborn (Nati dalla Bocca) · «Sciame» (ingresso): una nube di insetti arriva ronzando
// da ogni parte e si posa a chiazze; dove si posa, la carta c'è. Quando la carta è
// completa lo sciame si alza e se ne va. «La Fame ci chiama. La Fame ci guida.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt } from './common.js';
import { hashJs } from '../../fxNoise.js';

const FRAG = `${QUAD_HEADER}
uniform float uPatch;
uniform float uSpan;
uniform float uCrawl;

float landTime(vec2 cellId, vec2 c) {
  vec2 uv = clamp(vec2(c.x / uAspect, c.y), 0.0, 1.0);
  return 0.12 + sweepN(uv) * uSpan + (hash(cellId + 9.1) - 0.5) * 0.08;
}

/** Distanza (con segno) dalla chiazza posata più vicina: < 0 = la carta c'è; .y = da quanto. */
vec2 landed(vec2 P, float cs, float layer) {
  vec2 id = floor(P / cs);
  float best = 1e3;
  float since = -1.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cid = id + vec2(float(i), float(j));
      vec2 jitter = vec2(hash(cid + layer), hash(cid + layer + 4.7)) - 0.5;
      vec2 c = (cid + 0.5 + jitter * 0.6) * cs;
      float tl = landTime(cid + layer, c) + layer * 0.002;
      float grow = smoothstep(tl, tl + 0.08, uProgress);
      float r = cs * 1.15 * grow * step(0.001, grow);
      // bordo brulicante, non un cerchio netto
      float crawlEdge = (noise(P * 60.0 + layer + uTime * 3.0) - 0.5) * cs * 0.4;
      float d = length(P - c) - r + crawlEdge;
      if (d < best) { best = d; since = uProgress - tl; }
    }
  }
  return vec2(best, since);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  vec2 L1 = landed(P, uPatch, 0.0);
  vec2 L2 = landed(P + uPatch * 0.37, uPatch * 0.55, 17.0);
  vec2 L = L1.x < L2.x ? L1 : L2;
  float full = smoothstep(0.9, 0.97, uProgress);
  float vis = max(1.0 - smoothstep(-0.003, 0.003, L.x), full);
  // appena posata la chiazza è ancora scura di corpi che brulicano, poi si schiarisce
  float fresh = (1.0 - smoothstep(0.0, 0.25, max(L.y, 0.0))) * (1.0 - full);
  float bugs = smoothstep(0.45, 0.7, noise(P * 22.0 + vec2(uTime * 2.3, -uTime * 1.7)));
  float crawl = fresh * mix(0.45, 0.9, bugs) * uCrawl;
  vec3 chitin = vec3(0.07, 0.06, 0.03) + uColor * 0.12 * step(0.75, noise(P * 90.0 + uTime));
  vec3 col = mix(tex.rgb, chitin * tex.a, crawl);
  // un filo di bava sul bordo delle chiazze
  float rim = (1.0 - smoothstep(0.0, 0.01, abs(L.x))) * (1.0 - full);
  col += mix(uColor, vec3(1.0), 0.3) * rim * 0.35 * tex.a;
  gl_FragColor = outColor(col * vis, tex.a * vis);
}
`;

const CHITIN = [
  [0.07, 0.06, 0.04],
  [0.12, 0.1, 0.05],
  [0.2, 0.17, 0.07],
];

export const mounthbornSciameEffect = {
  id: 'mounthborn-sciame',
  army: 'Mounthborn',
  role: 'entry',
  label: 'Sciame',
  kind: 'in',
  description: 'Una nube di insetti si posa a chiazze e compone la carta, poi si alza e se ne va.',
  defaults: {
    durationMs: 3000,
    color: '#c9e238',
    patch: 0.09,
    span: 0.6,
    crawl: 1,
    swarm: 220,
    buzz: 1,
    direction: 'scatter',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 2.5,
    sweepAmount: 0.7,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.6, right: m * 0.6, top: m * 0.55, bottom: m * 0.4 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uPatch', 'uSpan', 'uCrawl'],
    sweep: sweepOf,
    needsPixels: true,
    maxFlakes: 1100,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uPatch, params.patch);
      gl.uniform1f(u.uSpan, params.span);
      gl.uniform1f(u.uCrawl, params.crawl);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const cs = params.patch;
      // elenco delle chiazze grandi (stessa griglia e formula dello shader)
      const key = [cs, params.span, aspect.toFixed(4), env.range.min, env.range.max, JSON.stringify(env.sweep)].join('|');
      if (env.memo.key !== key) {
        const list = [];
        const nx = Math.ceil(aspect / cs);
        const ny = Math.ceil(1 / cs);
        for (let j = 0; j < ny; j += 1) {
          for (let i = 0; i < nx; i += 1) {
            const cx = (i + 0.5 + (hashJs(i, j) - 0.5) * 0.6) * cs;
            const cy = (j + 0.5 + (hashJs(i + 4.7, j + 4.7) - 0.5) * 0.6) * cs;
            const u = Math.min(1, Math.max(0, cx / aspect));
            const v = Math.min(1, Math.max(0, cy));
            if (env.pixels && env.pixels.at(u, v)[3] < 0.2) continue;
            list.push({ u, v, tl: 0.12 + sweepAt(env, aspect, u, v) * params.span + (hashJs(i + 9.1, j + 9.1) - 0.5) * 0.08 });
          }
        }
        env.memo = { key, list };
      }
      const t = state.progress;
      // gli insetti arrivano poco prima che la chiazza si posi
      const soon = env.memo.list.filter((b) => t > b.tl - 0.12 && t < b.tl + 0.02);
      const rate = params.swarm * (state.done || t > 0.85 ? 0 : 1) * (soon.length ? 1 : 0.15);
      const n = env.clock(rate, state.dt);
      for (let i = 0; i < n; i += 1) {
        const b = soon.length ? soon[Math.floor(Math.random() * soon.length)] : { u: Math.random(), v: Math.random() };
        const a0 = Math.random() * Math.PI * 2;
        const [sx, sy] = toCanvasUv(rect, b.u + Math.cos(a0) * 0.75, b.v + Math.sin(a0) * 0.6);
        const shade = CHITIN[Math.floor(Math.random() * CHITIN.length)];
        const tint = Math.random() < 0.35 ? env.color.map((c, k) => c * 0.7 + shade[k]) : shade;
        const [tx, ty] = toCanvasUv(rect, b.u + (Math.random() - 0.5) * 0.08, b.v + (Math.random() - 0.5) * 0.06);
        env.flakes.spawn(sx, sy, {
          life: 1.1 + Math.random() * 0.8,
          size: 4.5 + Math.random() * 3.5,
          color: tint,
          shape: 1,
          spin: 0,
          angle: a0 + Math.PI / 2,
          flutter: 40 + Math.random() * 30,
          fadeIn: 0.08,
          gravity: 0,
          drag: 0,
          extra: { tx, ty, leave: 0.62 + Math.random() * 0.2 },
        });
      }
      env.flakes.step(state.dt, (fl, dt) => {
        const k = fl.age / fl.life;
        const jx = (Math.random() - 0.5) * 0.6 * params.buzz;
        const jy = (Math.random() - 0.5) * 0.6 * params.buzz;
        let ax = (fl.tx - fl.x) * 14 + jx;
        let ay = (fl.ty - fl.y) * 14 + jy;
        if (k > fl.leave) {
          // si alza e se ne va
          ax = (fl.x - fl.tx) * 6 + jx;
          ay = -1 + jy;
        }
        fl.vx = (fl.vx + ax * dt) * Math.exp(-4 * dt);
        fl.vy = (fl.vy + ay * dt) * Math.exp(-4 * dt);
        fl.x += fl.vx * dt;
        fl.y += fl.vy * dt;
        fl.angle = Math.atan2(fl.vy, fl.vx) + Math.PI / 2;
      });
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['patch', 'Misura chiazze', 0.03, 0.18, 0.001],
    ['span', 'Durata posa', 0.2, 0.75, 0.01],
    ['crawl', 'Brulicare', 0, 1.5, 0.01],
    ['swarm', 'Sciame / s', 0, 500, 1],
    ['buzz', 'Ronzio', 0, 3, 0.01],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    sciame: { label: 'Sciame', params: {} },
    nube: { label: 'Nube nera', params: { durationMs: 2200, patch: 0.06, span: 0.5, swarm: 420, buzz: 1.6 } },
  },
};
