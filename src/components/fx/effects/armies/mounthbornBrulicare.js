// Mounthborn (Nati dalla Bocca) · «Brulicare» (ingresso): il terreno si spacca ai piedi della
// carta e ne escono insetti a fiotti; la carta sale dalla fenditura in mezzo a loro, coperta
// di corpi che brulicano e poi scappano via. «Quando li vedi, è troppo tardi.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uRise;
uniform float uCrack;
uniform float uCover;
uniform float uShake;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2(p.x * uAspect, p.y);
  // fenditura nel terreno, lungo il piede della carta
  float gy = 1.0;
  float jag = (noise(vec2(P.x * 18.0, 3.3)) - 0.5) * 0.02;
  float halfW = (0.5 * uAspect + 0.12) * uCrack;
  float along = (1.0 - smoothstep(halfW * 0.85, halfW + 1e-4, abs(P.x - uAspect * 0.5))) * step(1e-4, uCrack);
  float gap = 0.012 * along + 1e-4;
  float fissure = (1.0 - smoothstep(gap * 0.4, gap, abs(p.y - gy - jag))) * along;
  float glow = exp(-abs(p.y - gy - jag) / 0.02) * along * 0.6;

  // la carta sale: fino a dove è uscita dalla fenditura
  vec2 src = p - vec2(sin(uTime * 55.0) * uShake, 1.0 - uRise);
  // finché sale, sotto la fenditura non si vede (a fine salita niente taglio)
  vec4 tex = cardAt(src) * step(p.y, mix(gy + jag * 0.5, 2.0, step(0.999, uRise)));
  // corpi che brulicano sulla carta, più fitti sulla parte appena uscita
  float fromBase = clamp((gy - p.y) / max(uRise, 1e-3), 0.0, 1.0);
  float bugs = smoothstep(0.5, 0.68, noise(P * 26.0 + vec2(uTime * 1.4, uTime * 3.0)));
  float cov = uCover * bugs * (1.0 - smoothstep(0.0, 0.8, 1.0 - fromBase));
  vec3 chitin = vec3(0.08, 0.07, 0.03) + uColor * 0.18 * step(0.7, noise(P * 80.0 + uTime * 2.0));
  vec3 col = mix(tex.rgb, chitin * tex.a, cov);
  // terra scura sulla carta che emerge, che si scrolla salendo
  col *= 1.0 - 0.4 * uCover * (1.0 - fromBase);

  vec3 dirt = vec3(0.05, 0.04, 0.03);
  vec3 outC = col * (1.0 - fissure) + dirt * fissure + mix(uColor, vec3(0.5, 0.4, 0.1), 0.5) * glow * 0.25 * (1.0 - tex.a);
  float a = max(tex.a, max(fissure, glow * 0.25));
  gl_FragColor = outColor(outC, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const CHITIN = [
  [0.07, 0.06, 0.04],
  [0.12, 0.1, 0.05],
  [0.2, 0.17, 0.07],
];

export const mounthbornBrulicareEffect = {
  id: 'mounthborn-brulicare',
  army: 'Mounthborn',
  role: 'entry',
  label: 'Brulicare',
  kind: 'in',
  description: 'Il terreno si spacca, ne escono insetti a fiotti e la carta sale dalla fenditura in mezzo a loro.',
  defaults: {
    durationMs: 2800,
    color: '#c9e238',
    crack: 0.18,
    riseStart: 0.25,
    cover: 1,
    shake: 0.003,
    swarm: 260,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.55, right: m * 0.55, top: m * 0.5, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRise', 'uCrack', 'uCover', 'uShake'],
    maxFlakes: 1200,
    bind: (gl, u, { params, progress: t }) => {
      const k = clamp01((t - params.riseStart) / Math.max(0.85 - params.riseStart, 0.05));
      // sale a strattoni: un'onda sopra la curva morbida
      const rise = ease(k) + Math.sin(k * Math.PI * 5) * 0.02 * (1 - k) * k;
      gl.uniform1f(u.uRise, Math.min(1, Math.max(0, rise)));
      gl.uniform1f(u.uCrack, ease(clamp01(t / Math.max(params.crack, 0.02))) * (1 - ease(clamp01((t - 0.88) / 0.12))));
      gl.uniform1f(u.uCover, params.cover * (1 - ease(clamp01((t - 0.7) / 0.25))));
      gl.uniform1f(u.uShake, params.shake * (k > 0 && k < 1 ? 1 : 0));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // fiotti di insetti dalla fenditura, che si spargono sul terreno e salgono sulla carta
      const on = t > params.crack * 0.5 && t < 0.8 && !state.done ? 1 : 0;
      const n = env.clock(params.swarm * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const x = 0.5 + (Math.random() - 0.5) * 1.15;
        const [sx, sy] = toCanvasUv(rect, x, 1);
        const shade = CHITIN[Math.floor(Math.random() * CHITIN.length)];
        const tint = Math.random() < 0.3 ? env.color.map((c, k) => c * 0.7 + shade[k]) : shade;
        const up = Math.random() < 0.55;
        const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : (Math.random() < 0.5 ? Math.PI : 0) + (Math.random() - 0.5) * 0.5;
        const sp = 0.08 + Math.random() * 0.18;
        env.flakes.spawn(sx, sy, {
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.7 + Math.random() * 0.8,
          size: 4 + Math.random() * 3.5,
          color: tint,
          shape: 1,
          spin: 0,
          angle: a + Math.PI / 2,
          flutter: 30 + Math.random() * 30,
          fadeIn: 0.05,
          gravity: 0,
          drag: 0,
          extra: { wig: Math.random() * 6.28 },
        });
      }
      env.flakes.step(state.dt, (fl, dt) => {
        // zampettano a zig-zag
        fl.wig += dt * 18;
        const turn = Math.sin(fl.wig) * 2.2 * dt;
        const c = Math.cos(turn);
        const s = Math.sin(turn);
        const vx = fl.vx * c - fl.vy * s;
        const vy = fl.vx * s + fl.vy * c;
        fl.vx = vx;
        fl.vy = vy;
        fl.x += fl.vx * dt;
        fl.y += fl.vy * dt;
        fl.angle = Math.atan2(fl.vy, fl.vx) + Math.PI / 2;
      });
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['crack', 'Apertura fenditura', 0.02, 0.5, 0.01],
    ['riseStart', 'Inizio salita', 0.05, 0.6, 0.01],
    ['cover', 'Corpi sulla carta', 0, 1.5, 0.01],
    ['shake', 'Tremito', 0, 0.01, 0.0005],
    ['swarm', 'Insetti / s', 0, 600, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    brulicare: { label: 'Brulicare', params: {} },
    frenesia: { label: 'Frenesia', params: { durationMs: 2000, crack: 0.12, riseStart: 0.18, swarm: 480, shake: 0.006 } },
  },
};
