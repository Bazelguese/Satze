// Mounthborn (Nati dalla Bocca) · «Fame» (sconfitta inflitta): uno sciame di insetti si
// riversa sulla carta e la divora morso dopo morso, lasciando bordi smerlati e rosicchiati,
// poi si alza e se ne va. «La Fame ci chiama. La Fame ci guida. La Fame ci nutre.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt } from './common.js';
import { hashJs } from '../../fxNoise.js';

const FRAG = `${QUAD_HEADER}
uniform float uBite;
uniform float uRim;

/** Istante del morso di una cella (stessa formula del JS). */
float biteTime(vec2 cellId, vec2 c) {
  vec2 uv = clamp(vec2(c.x / uAspect, c.y), 0.0, 1.0);
  return 0.1 + sweepN(uv) * 0.78 + (hash(cellId + 9.1) - 0.5) * 0.08;
}

/** Distanza (con segno) dal bordo del morso più vicino: < 0 = mangiato. */
float bitten(vec2 P, float cs, float layer) {
  vec2 id = floor(P / cs);
  float best = 1e3;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cid = id + vec2(float(i), float(j));
      vec2 jitter = vec2(hash(cid + layer), hash(cid + layer + 4.7)) - 0.5;
      vec2 c = (cid + 0.5 + jitter * 0.6) * cs;
      float tb = biteTime(cid + layer, c) + layer * 0.03;
      float grow = smoothstep(tb, tb + 0.07, uProgress);
      float r = cs * mix(0.0, 1.1, grow) * step(0.001, grow);
      // bordo rosicchiato, non un cerchio netto
      float chew = (noise(P * 70.0 + layer) - 0.5) * cs * 0.35;
      best = min(best, length(P - c) - r + chew);
    }
  }
  return best;
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  float cs = uBite;
  // morsi grandi e, attorno, morsetti più piccoli che smerlano il bordo
  float d = min(bitten(P, cs, 0.0), bitten(P + cs * 0.37, cs * 0.5, 17.0));
  float alive = smoothstep(-0.002, 0.002, d) * (1.0 - smoothstep(0.92, 0.99, uProgress));
  // bordo rosicchiato: scuro, con un riflesso verde sulla chitina e la bava
  float rim = (1.0 - smoothstep(0.0, 0.012, d)) * alive * uRim;
  float glint = step(0.7, noise(P * 120.0)) * rim;
  vec3 col = tex.rgb * (1.0 - rim * 0.75) + vec3(0.12, 0.08, 0.03) * rim * 0.4 * tex.a + mix(uColor, vec3(1.0), 0.2) * glint * 0.6 * tex.a;
  // ombra dello sciame che brulica sulla carta
  float crawl = smoothstep(0.55, 0.75, noise(P * 14.0 + vec2(uTime * 1.6, -uTime))) * smoothstep(0.08, 0.2, uProgress) * (1.0 - smoothstep(0.85, 0.95, uProgress));
  col *= 1.0 - crawl * 0.35;
  gl_FragColor = outColor(col * alive, tex.a * alive);
}
`;

const CHITIN = [
  [0.07, 0.06, 0.04],
  [0.12, 0.1, 0.05],
  [0.2, 0.17, 0.07],
];

export const mounthbornFameEffect = {
  id: 'mounthborn-fame',
  army: 'Mounthborn',
  role: 'defeat',
  label: 'Fame',
  kind: 'out',
  description: 'Uno sciame cieco di fame si riversa sulla carta e la divora morso dopo morso.',
  defaults: {
    durationMs: 2800,
    color: '#c9e238',
    biteSize: 0.06,
    rim: 1,
    swarm: 160,
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
    return { left: m * 0.55, right: m * 0.55, top: m * 0.5, bottom: m * 0.35 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uBite', 'uRim'],
    sweep: sweepOf,
    needsPixels: true,
    maxFlakes: 900,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uBite, params.biteSize);
      gl.uniform1f(u.uRim, params.rim);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const cs = params.biteSize;
      // elenco dei morsi grandi (stessa griglia e formula dello shader)
      const key = [cs, aspect.toFixed(4), env.range.min, env.range.max, JSON.stringify(env.sweep)].join('|');
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
            list.push({ u, v, tb: 0.1 + sweepAt(env, aspect, u, v) * 0.78 + (hashJs(i + 9.1, j + 9.1) - 0.5) * 0.08 });
          }
        }
        env.memo = { key, list };
      }
      const t = state.progress;
      // insetti che ronzano dove si sta mordendo
      const active = env.memo.list.filter((b) => t > b.tb - 0.04 && t < b.tb + 0.08);
      const rate = params.swarm * state.active * (state.done ? 0 : 1) * (active.length ? 1 : 0.2);
      const n = env.clock(rate, state.dt);
      for (let i = 0; i < n; i += 1) {
        const b = active.length ? active[Math.floor(Math.random() * active.length)] : { u: Math.random(), v: Math.random() };
        // arrivano da fuori della carta e si posano sul morso
        const a0 = Math.random() * Math.PI * 2;
        const [tx, ty] = toCanvasUv(rect, b.u, b.v);
        const [sx, sy] = toCanvasUv(rect, b.u + Math.cos(a0) * 0.5, b.v + Math.sin(a0) * 0.4);
        const shade = CHITIN[Math.floor(Math.random() * CHITIN.length)];
        const tint = Math.random() < 0.4 ? env.color.map((c, k) => c * 0.7 + shade[k]) : shade;
        env.flakes.spawn(sx, sy, {
          life: 0.7 + Math.random() * 0.6,
          size: 4.5 + Math.random() * 3.5,
          color: tint,
          shape: 1,
          spin: 0,
          angle: a0 + Math.PI / 2,
          flutter: 40 + Math.random() * 30,
          fadeIn: 0.05,
          gravity: 0,
          drag: 0,
        });
      }
      env.flakes.step(state.dt, (fl, dt) => {
        // ogni insetto punta a un morso, ci ronza attorno e poi riparte
        if (fl.tx == null) {
          const b = active.length ? active[Math.floor(Math.random() * active.length)] : { u: Math.random(), v: Math.random() };
          [fl.tx, fl.ty] = toCanvasUv(rect, b.u + (Math.random() - 0.5) * 0.08, b.v + (Math.random() - 0.5) * 0.06);
          fl.leave = 0.55 + Math.random() * 0.25;
        }
        const k = fl.age / fl.life;
        const leaving = k > fl.leave;
        const jx = (Math.random() - 0.5) * 0.6 * params.buzz;
        const jy = (Math.random() - 0.5) * 0.6 * params.buzz;
        let ax = (fl.tx - fl.x) * 14 + jx;
        let ay = (fl.ty - fl.y) * 14 + jy;
        if (leaving) {
          ax = (fl.x - fl.tx) * 8 + jx;
          ay = -0.8 + jy;
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
    ['biteSize', 'Misura morsi', 0.025, 0.15, 0.001],
    ['rim', 'Bordo rosicchiato', 0, 1.5, 0.01],
    ['swarm', 'Sciame / s', 0, 400, 1],
    ['buzz', 'Ronzio', 0, 3, 0.01],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    fame: { label: 'Fame', params: {} },
    divorante: { label: 'Sciame divorante', params: { durationMs: 1800, biteSize: 0.045, swarm: 320, buzz: 1.6 } },
  },
};
