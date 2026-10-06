// Figli dell'Orizzonte · «Nebula» (ingresso): stelle arrivano da ogni parte e si raccolgono
// nella sagoma della carta; la carta prende forma come una nube della Nebula, vorticante e
// nei suoi colori, poi si posa e torna nitida. «La Domanda cerca ancora una risposta.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uWarp;
uniform float uSwirl;
uniform float uChroma;
uniform float uNebula;
uniform float uEdgeGlow;
uniform float uEdgeW;
uniform float uForm;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  // quanto la carta è ancora «nube»: 1 all'inizio, 0 quando si è posata
  float cloud = 1.0 - smoothstep(0.42, 0.97, t);
  float w = uWarp * cloud;
  vec2 q = p * 3.0;
  vec2 flow = vec2(fbm(q + vec2(uTime * uSwirl * 0.3, 0.0)) - 0.5, fbm(q + vec2(5.2, 1.3) - vec2(0.0, uTime * uSwirl * 0.3)) - 0.5);
  vec2 c = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  c = rot2(c, -w * 7.0 * (1.0 - clamp(length(c) * 1.4, 0.0, 1.0)));
  vec2 pw = vec2(c.x / uAspect, c.y) + 0.5 + flow * w * 2.0;
  float ch = uChroma * cloud;
  vec4 tr = cardAt(pw + vec2(ch, 0.0));
  vec4 tg = cardAt(pw);
  vec4 tb = cardAt(pw - vec2(ch, 0.0));
  float a0 = max(tg.a, max(tr.a, tb.a));
  vec3 rgb = vec3(tr.r, tg.g, tb.b);

  // tavolozza della Nebula che sbiadisce mentre la carta si posa
  float l = dot(rgb, vec3(0.3, 0.59, 0.11)) / max(a0, 1e-3);
  vec3 hi = mix(vec3(1.0, 0.45, 0.9), vec3(0.6, 0.95, 1.0), fbm(pw * 4.0 + uTime * 0.2));
  vec3 neb = mix(mix(vec3(0.05, 0.02, 0.15), uColor, smoothstep(0.0, 0.5, l)), hi, smoothstep(0.55, 1.0, l));
  float nebAmt = uNebula * (1.0 - smoothstep(0.5, 0.98, t));
  vec3 col = mix(rgb, neb * a0, nebAmt);

  // la sagoma si riempie dove le stelle si sono raccolte (fronte morbido e luminoso)
  float s = sweepN(p);
  float T = mix(-uEdgeW, 1.0 + uEdgeW, smoothstep(0.06, uForm, t));
  float d = T - s;
  float formed = smoothstep(0.0, uEdgeW, d);
  // velo di nube davanti al fronte: la sagoma si intuisce prima di esserci
  float veil = smoothstep(-uEdgeW * 3.0, 0.0, d) * (1.0 - formed) * smoothstep(0.35, 0.75, fbm(pw * 6.0 + uTime * 0.4));
  float glowLife = 1.0 - smoothstep(uForm, uForm + 0.15, t);
  float edge = exp(-abs(d) / max(uEdgeW * 0.6, 1e-3)) * glowLife * step(0.001, t);
  vec3 star = mix(uColor, vec3(1.0), 0.45);
  vec3 outC = col * formed + neb * a0 * veil * 0.45 + star * edge * uEdgeGlow * a0 * 0.6;
  float a = max(a0 * formed, a0 * (veil * 0.45 + edge * uEdgeGlow * 0.5));
  gl_FragColor = outColor(outC, a);
}
`;

export const figliNebulaEffect = {
  id: 'figli-nebula',
  army: "Figli dell'Orizzonte",
  role: 'entry',
  label: 'Nebula',
  kind: 'in',
  description: 'Le stelle si raccolgono nella sagoma della carta, che prende forma come una nube della Nebula e poi si posa.',
  defaults: {
    durationMs: 2600,
    color: '#a288fb',
    warp: 0.14,
    swirl: 1.2,
    chroma: 0.014,
    nebula: 0.9,
    edgeGlow: 1.4,
    edgeWidth: 0.1,
    form: 0.55,
    stars: 140,
    direction: 'center',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.7,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.5, right: m * 0.5, top: m * 0.4, bottom: m * 0.35 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uWarp', 'uSwirl', 'uChroma', 'uNebula', 'uEdgeGlow', 'uEdgeW', 'uForm'],
    sweep: sweepOf,
    maxEmbers: 700,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uWarp, params.warp);
      gl.uniform1f(u.uSwirl, params.swirl);
      gl.uniform1f(u.uChroma, params.chroma);
      gl.uniform1f(u.uNebula, params.nebula);
      gl.uniform1f(u.uEdgeGlow, params.edgeGlow);
      gl.uniform1f(u.uEdgeW, params.edgeWidth);
      gl.uniform1f(u.uForm, Math.max(0.15, Math.min(0.9, params.form)));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // le stelle partono fuori dalla carta e arrivano mentre la sagoma si riempie
      const on = t < params.form * 0.95 && !state.done ? 1 : 0;
      const n = env.clock(params.stars * on * Math.max(state.active, 0.6), state.dt);
      for (let i = 0; i < n; i += 1) {
        const tx = 0.05 + Math.random() * 0.9;
        const ty = 0.05 + Math.random() * 0.9;
        const a = Math.random() * Math.PI * 2;
        const r = 0.75 + Math.random() * 0.5;
        const [sx, sy] = toCanvasUv(rect, 0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r * 0.8);
        const [ex, ey] = toCanvasUv(rect, tx, ty);
        env.embers.spawn(sx, sy, {
          life: 0.7 + Math.random() * 0.6,
          size: 1 + Math.random() * 2.4,
          heat: 0.5 + Math.random() * 0.5,
          rise: 0,
          extra: { sx, sy, ex, ey, curl: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.8) },
        });
      }
      env.embers.step(state.dt, (e) => {
        const k = e.age / e.life;
        const ease = 1 - (1 - k) * (1 - k) * (1 - k);
        // arrivo a spirale: la deviazione laterale si spegne avvicinandosi
        const dx = e.ex - e.sx;
        const dy = e.ey - e.sy;
        const side = Math.sin(ease * Math.PI) * 0.25 * e.curl * (1 - ease);
        e.x = e.sx + dx * ease - dy * side;
        e.y = e.sy + dy * ease + dx * side;
        e.heat = 0.55 + 0.45 * Math.sin(e.age * 11 + e.sway);
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['form', 'Fine raccolta', 0.15, 0.9, 0.01],
    ['warp', 'Vortice nube', 0, 0.4, 0.005],
    ['swirl', 'Moto nube', 0, 4, 0.05],
    ['chroma', 'Aberrazione', 0, 0.05, 0.001],
    ['nebula', 'Tavolozza Nebula', 0, 1, 0.01],
    ['edgeGlow', 'Fronte luminoso', 0, 3, 0.01],
    ['edgeWidth', 'Spessore fronte', 0.02, 0.3, 0.005],
    ['stars', 'Stelle / s', 0, 400, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    nebula: { label: 'Nebula', params: {} },
    risposta: { label: 'Una risposta', params: { durationMs: 1700, form: 0.45, warp: 0.25, swirl: 2.4, stars: 260, edgeGlow: 2 } },
  },
};
