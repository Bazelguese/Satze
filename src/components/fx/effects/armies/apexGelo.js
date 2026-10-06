// Apex · «Gelo» (ingresso): una raffica di neve turbina; dall'alto scende la carta chiusa in
// un blocco di ghiaccio della Crosta Bianca, tocca terra, il ghiaccio si incrina, si spacca
// in schegge e la brina si scioglie dal centro. «Ridevi quando ci scegliesti.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uDrop;
uniform float uIce;
uniform float uCrack;
uniform float uThaw;
uniform float uShatter;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  // la carta (col suo blocco) scende dall'alto
  vec2 q = p + vec2(0.0, uDrop);
  vec4 tex = cardAt(q) * uIce;
  vec2 Q = vec2(q.x * uAspect, q.y);
  vec3 iceTint = mix(vec3(0.78, 0.9, 1.0), uColor, 0.25);

  // blocco di ghiaccio: un po' più grande della carta, bordi smussati
  float m = 0.035;
  vec2 c = abs(Q - vec2(uAspect * 0.5, 0.5)) - vec2(uAspect * 0.5 + m, 0.5 + m) + 0.03;
  float box = length(max(c, 0.0)) + min(max(c.x, c.y), 0.0) - 0.03;
  float block = (1.0 - smoothstep(-0.004, 0.004, box)) * uIce;

  // incrinature: bordi di celle di Voronoi che si diramano dal punto d'impatto (in basso)
  vec2 g = Q * 6.0;
  vec2 gi = floor(g);
  float d1 = 9.0;
  float d2 = 9.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = vec2(hash(gi + o), hash(gi + o + 5.3));
      float d = length(gi + o + h - g);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  float crackLine = 1.0 - smoothstep(0.02, 0.06, d2 - d1);
  float fromImpact = length(Q - vec2(uAspect * 0.5, 1.0));
  float cracks = crackLine * (1.0 - smoothstep(uCrack * 1.4 - 0.1, uCrack * 1.4, fromImpact));

  // il ghiaccio si stacca a celle (schegge) dopo lo schianto
  float cellT = hash(gi + 11.0) * 0.5 + fromImpact * 0.4;
  float gone = step(cellT, uShatter);
  block *= 1.0 - gone;

  // brina sulla carta, che si scioglie dal centro verso i bordi
  float frostN = fbm(Q * 9.0);
  float centerD = length((Q - vec2(uAspect * 0.5, 0.5)) * vec2(1.0, 0.8));
  float frost = (1.0 - smoothstep(uThaw - 0.1, uThaw, centerD + (frostN - 0.5) * 0.15)) ;
  frost = 1.0 - frost;
  frost *= step(0.001, uIce + uThaw) * (1.0 - smoothstep(0.98, 1.0, uThaw));
  float lum = dot(tex.rgb, vec3(0.3, 0.59, 0.11));
  vec3 frosted = mix(vec3(lum) * vec3(0.7, 0.85, 1.0), iceTint, 0.35 + 0.4 * frostN) * tex.a;
  vec3 col = mix(tex.rgb, frosted, frost * 0.85);

  // sopra: il ghiaccio, traslucido, con riflessi e incrinature bianche
  float hl = smoothstep(0.55, 0.9, noise(vec2(Q.x * 3.0 + Q.y * 6.0, 1.0)));
  vec3 iceCol = iceTint * (0.35 + 0.25 * frostN) + vec3(1.0) * (hl * 0.35 + cracks * 0.9);
  float iceA = block * (0.55 + 0.35 * frostN + cracks * 0.4);
  float cardA = tex.a;
  vec3 outC = col * (1.0 - iceA) + iceCol * iceA;
  float a = max(cardA, iceA);
  gl_FragColor = outColor(outC, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const apexGeloEffect = {
  id: 'apex-gelo',
  army: 'Apex',
  role: 'entry',
  label: 'Gelo',
  kind: 'in',
  description: 'Una raffica di neve; la carta scende chiusa nel ghiaccio, che si incrina, si spacca e lascia sciogliere la brina.',
  defaults: {
    durationMs: 2800,
    color: '#d5ecf9',
    drop: 0.6,
    land: 0.38,
    crackTime: 0.12,
    shatter: 0.2,
    snow: 260,
    shards: 90,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.55, right: m * 0.55, top: m * 0.8, bottom: m * 0.35 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uDrop', 'uIce', 'uCrack', 'uThaw', 'uShatter'],
    maxFlakes: 1400,
    bind: (gl, u, { params, progress: t }) => {
      const L = params.land;
      // scende accelerando (cade), poi un piccolo rimbalzo all'impatto
      const k = clamp01(t / Math.max(L, 0.05));
      const fall = (1 - k * k) * params.drop;
      const since = t - L;
      const bounce = since > 0 ? Math.sin(since * 60) * Math.exp(-since / 0.03) * 0.012 : 0;
      gl.uniform1f(u.uDrop, fall + bounce);
      gl.uniform1f(u.uIce, ease(clamp01(t / 0.08)));
      gl.uniform1f(u.uCrack, ease(clamp01(since / Math.max(params.crackTime, 0.02))));
      const sh0 = L + params.crackTime;
      gl.uniform1f(u.uShatter, ease(clamp01((t - sh0) / Math.max(params.shatter, 0.02))));
      gl.uniform1f(u.uThaw, ease(clamp01((t - sh0) / Math.max(0.97 - sh0, 0.05))) * 1.1);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      // raffica di neve che turbina attorno alla carta
      const blow = t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.snow * blow, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [sx, sy] = toCanvasUv(rect, -0.6 - Math.random() * 0.3, -0.5 + Math.random() * 1.6);
        const g = 0.85 + Math.random() * 0.15;
        env.flakes.spawn(sx, sy, {
          vx: 0.35 + Math.random() * 0.35,
          vy: 0.04 + Math.random() * 0.1,
          life: 1.2 + Math.random() * 1,
          size: 1.5 + Math.random() * 3,
          color: [g, g, 1],
          shape: 2,
          spin: 0,
          gravity: 0.05,
          drag: 0.2,
          extra: { ph: Math.random() * 6.28 },
        });
      }
      // schegge di ghiaccio allo schianto
      const sh0 = params.land + params.crackTime;
      if (prev < sh0 && t >= sh0 && t - prev < 0.3) {
        for (let i = 0; i < params.shards; i += 1) {
          const [cx, cy] = toCanvasUv(rect, Math.random(), 0.3 + Math.random() * 0.75);
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.8;
          const sp = 0.1 + Math.random() * 0.35;
          const g = 0.8 + Math.random() * 0.2;
          env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 + Math.random() * 0.6, size: 4 + Math.random() * 7, color: [g * 0.85, g * 0.95, 1], shape: 4, gravity: 1.4, drag: 0.4 });
        }
      }
      env.flakes.step(state.dt, (fl, dt) => {
        if (fl.ph != null) {
          // fiocchi: vortice leggero
          fl.vy += Math.sin(fl.age * 5 + fl.ph) * 0.25 * dt;
        } else {
          fl.vy += fl.gravity * dt;
        }
        const k = Math.exp(-fl.drag * dt);
        fl.vx *= k;
        fl.vy *= k;
        fl.x += fl.vx * dt;
        fl.y += fl.vy * dt;
      });
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['drop', 'Altezza discesa', 0, 1.2, 0.01],
    ['land', 'Impatto', 0.1, 0.6, 0.01],
    ['crackTime', 'Incrinatura', 0.02, 0.3, 0.01],
    ['shatter', 'Distacco schegge', 0.02, 0.4, 0.01],
    ['snow', 'Neve / s', 0, 600, 1],
    ['shards', 'Schegge', 0, 250, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    gelo: { label: 'Gelo', params: {} },
    bufera: { label: 'Bufera', params: { durationMs: 3200, drop: 0.9, snow: 520, shards: 160 } },
  },
};
