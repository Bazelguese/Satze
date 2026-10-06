// Corte Rossa · «Fiammata» (ingresso): la carta compare come una sagoma completamente nera,
// con appena un filo di brace sul contorno; resta lì un istante, poi una fiammata la
// attraversa e brucia via il nero, rivelando la carta. «Ciò che vedi, lo diventi.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uThreshold;
uniform float uBand;
uniform float uFlame;
uniform float uRim;
uniform float uShow;
uniform float uFlash;
uniform float uHeatOut;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  vec2 P = vec2(p.x * uAspect, p.y);

  // la sagoma affiora dal buio come fumo che si addensa
  float n = fbm(P * 4.0 + vec2(0.0, -uTime * 0.3));
  float show = smoothstep(n - 0.25, n + 0.05, uShow * 1.3);

  // contorno della sagoma (dall'alpha della carta): un filo di brace che pulsa
  float r = 0.012;
  float m = min(min(cardAt(p + vec2(r / uAspect, 0.0)).a, cardAt(p - vec2(r / uAspect, 0.0)).a),
                min(cardAt(p + vec2(0.0, r)).a, cardAt(p - vec2(0.0, r)).a));
  float rim = clamp(tex.a - m, 0.0, 1.0);
  float pulse = 0.65 + 0.35 * sin(uTime * 7.0 + n * 6.0);

  // fronte della fiammata: dietro c'è la carta, davanti ancora il nero
  float d = uThreshold - sweepN(p);
  float W = uBand;
  float revealed = smoothstep(W * 0.55, W * 0.75, d);
  float flame = smoothstep(-0.004, 0.004, d) * (1.0 - smoothstep(W * 0.4, W * 0.6, d));
  float embersB = smoothstep(W * 0.35, W * 0.55, d) * (1.0 - revealed);
  float heat = (1.0 - smoothstep(W * 0.75, W * 2.8, d)) * revealed * uHeatOut;

  vec3 black = vec3(0.012, 0.004, 0.006);
  vec3 col = black * tex.a;
  col += mix(uColor, vec3(1.0, 0.55, 0.25), 0.25) * rim * uRim * pulse * (1.0 - revealed) * tex.a;
  // lampo d'innesco su tutta la sagoma
  col += mix(uColor, vec3(1.0, 0.7, 0.4), 0.5) * uFlash * (0.35 + 0.65 * n) * (1.0 - revealed) * tex.a;
  // la carta che emerge, ancora rovente vicino al fronte
  vec3 card = tex.rgb + mix(uColor, vec3(1.0, 0.75, 0.4), 0.4) * heat * 0.8 * tex.a;
  col = mix(col, card, revealed);
  col = mix(col, mix(uColor * 0.5, vec3(1.0, 0.45, 0.12), 0.6) * tex.a, embersB);
  float flick = 0.85 + 0.3 * noise(P * 30.0 + vec2(0.0, uTime * 9.0));
  vec3 fire = mix(mix(uColor, vec3(1.0, 0.35, 0.05), 0.5), vec3(1.0, 0.9, 0.55), clamp(d / max(W * 0.4, 1e-3), 0.0, 1.0)) * flick;
  col = mix(col, min(fire, vec3(1.0)) * tex.a, flame * uFlame);
  float a = tex.a * max(show, revealed);
  gl_FragColor = outColor(col * max(show, revealed), a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);

/** Soglia del fronte: parte all'innesco e brucia tutto il nero entro la fine. */
function threshold(t, params) {
  const k = Math.max(0, Math.min(1, (t - params.ignite) / Math.max(0.98 - params.ignite, 1e-3)));
  return -0.02 + (1.04 + params.band) * ease(k);
}

export const corteFiammataEffect = {
  id: 'corte-fiammata',
  army: 'Corte Rossa',
  role: 'entry',
  label: 'Fiammata',
  kind: 'in',
  description: 'La carta compare come una sagoma completamente nera; una fiammata la attraversa e la rivela.',
  defaults: {
    durationMs: 2600,
    color: '#f8504f',
    appear: 0.22,
    ignite: 0.45,
    band: 0.16,
    flame: 1,
    rim: 0.9,
    flash: 1,
    heat: 1,
    burst: 140,
    embers: 110,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3.5,
    sweepAmount: 0.4,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.4, right: m * 0.4, top: m * 0.55, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uThreshold', 'uBand', 'uFlame', 'uRim', 'uShow', 'uFlash', 'uHeatOut'],
    sweep: sweepOf,
    maxEmbers: 800,
    bind: (gl, u, { params, progress: t }) => {
      const ig = params.ignite;
      gl.uniform1f(u.uThreshold, threshold(t, params));
      gl.uniform1f(u.uBand, params.band);
      gl.uniform1f(u.uFlame, params.flame);
      // il contorno di brace si ravviva poco prima dell'innesco
      gl.uniform1f(u.uRim, params.rim * (0.5 + 0.8 * Math.max(0, Math.min(1, (t - ig * 0.6) / (ig * 0.4)))));
      gl.uniform1f(u.uShow, Math.min(1, t / Math.max(params.appear, 0.02)));
      gl.uniform1f(u.uFlash, params.flash * Math.exp(-Math.pow((t - ig - 0.01) / 0.03, 2)));
      gl.uniform1f(u.uHeatOut, params.heat * (1 - ease(Math.max(0, Math.min(1, (t - 0.86) / 0.14)))));
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      const spawnEmber = (x, y, strong) => {
        const [cx, cy] = toCanvasUv(rect, x, y);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * (strong ? 2.6 : 1.2);
        const sp = strong ? 0.12 + Math.random() * 0.3 : 0.03 + Math.random() * 0.08;
        env.embers.spawn(cx, cy, {
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.5 + Math.random() * 0.9,
          size: 1 + Math.random() * (strong ? 3 : 2.2),
          heat: 0.5 + Math.random() * 0.5,
        });
      };
      // fiammata d'innesco: una vampata di faville da tutta la sagoma
      if (prev < params.ignite && t >= params.ignite && t - prev < 0.3) {
        for (let i = 0; i < params.burst; i += 1) spawnEmber(Math.random(), Math.random(), true);
      }
      const T = threshold(t, params);
      const burning = t > params.ignite && t < 0.98 && !state.done ? 1 : 0;
      const n = env.clock(params.embers * burning, state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => {
          const d = T - sweepAt(env, aspect, x, y);
          return d >= 0 && d <= params.band * 0.6;
        });
        if (pt) spawnEmber(pt[0], pt[1], false);
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['appear', 'Comparsa sagoma', 0.02, 0.4, 0.01],
    ['ignite', 'Innesco fiammata', 0.15, 0.8, 0.01],
    ['band', 'Fascia fiamma', 0.04, 0.35, 0.005],
    ['flame', 'Fiamma', 0, 1.5, 0.01],
    ['rim', 'Brace sul contorno', 0, 2, 0.01],
    ['flash', 'Lampo innesco', 0, 2, 0.01],
    ['heat', 'Calore residuo', 0, 2, 0.01],
    ['burst', 'Vampata (faville)', 0, 400, 1],
    ['embers', 'Faville / s', 0, 300, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    fiammata: { label: 'Fiammata', params: {} },
    vampata: { label: 'Vampata', params: { durationMs: 1800, ignite: 0.38, band: 0.24, flash: 1.6, burst: 260 } },
    attesa: { label: 'Lunga attesa', params: { durationMs: 3400, appear: 0.15, ignite: 0.6 } },
  },
};
