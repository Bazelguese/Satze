// Ratti della Megera · «Pozza» (ingresso): una pozza di veleno verde sale e prende la forma
// della carta, ribolle, poi si ritira verso il basso lasciando colature che scivolano giù e
// una patina umida che si asciuga. Dalla superficie salgono fumi tossici.
// «Corrompere. Consumare. Aspettare.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uFill;
uniform float uLevel;
uniform float uDrip;
uniform float uDripCols;
uniform float uBubbles;
uniform float uWet;
uniform float uWetBand;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  vec3 neon = mix(uColor, vec3(0.75, 1.0, 0.35), 0.45);

  // superficie ondosa della pozza
  float wave = (noise(vec2(P.x * 9.0 + uTime * 1.2, uTime * 0.7)) - 0.5) * 0.025;
  // colature: dove il veleno resta indietro scivolando giù
  float dr = pow(noise(vec2(p.x * uDripCols, 7.3)), 3.0) * uDrip;
  float level = uLevel + wave - dr;
  float filled = smoothstep(1.0 - uFill - 0.01, 1.0 - uFill + 0.01, p.y + wave);
  float liquid = smoothstep(level - 0.006, level + 0.006, p.y) * filled;

  // veleno: liquido denso e lucido, più scuro in profondità, con riflessi che scorrono
  float depth = clamp((p.y - level) * 3.0, 0.0, 1.0);
  float caust = fbm(P * 5.0 + vec2(uTime * 0.25, -uTime * 0.4));
  vec3 acid = mix(neon * 0.85, neon * 0.3, depth) * (0.75 + 0.5 * caust);
  // bolle piccole e rade: un anello chiaro che si gonfia e scoppia
  vec2 bc = P * 22.0 + vec2(0.0, uTime * 1.4);
  vec2 bi = floor(bc);
  vec2 bf = fract(bc) - 0.5 - (vec2(hash(bi), hash(bi + 3.1)) - 0.5) * 0.5;
  float life = fract(uTime * 0.7 + hash(bi + 7.7));
  float br = 0.08 + 0.22 * life;
  float ring = (1.0 - smoothstep(0.02, 0.05, abs(length(bf) - br))) * step(0.72, hash(bi + 1.9)) * (1.0 - life) * uBubbles;
  acid += mix(neon, vec3(1.0), 0.6) * ring * 0.7;
  float men = exp(-abs(p.y - level) / 0.008) * liquid;
  acid += mix(neon, vec3(1.0), 0.5) * men * 0.8;
  // traspare appena la carta sotto il veleno, quando è poco profondo
  acid = mix(acid, acid * 0.6 + tex.rgb / max(tex.a, 1e-3) * 0.35, (1.0 - depth) * 0.6);

  // carta appena scoperta: bagnata, verdastra e lucida, poi asciutta
  float since = level - p.y;
  float wet = (1.0 - smoothstep(0.0, uWetBand, since)) * uWet * (1.0 - liquid);
  float streak = smoothstep(0.55, 0.9, noise(vec2(P.x * 26.0, P.y * 3.0 - uTime * 0.6)));
  vec3 card = tex.rgb * (1.0 - wet * 0.35) + neon * wet * 0.28 * tex.a + vec3(1.0) * streak * wet * 0.35 * tex.a;

  vec3 col = mix(card, acid * tex.a, liquid);
  // visibile dove c'è veleno o dove è già stata scoperta; prima che la pozza salga, niente
  float visible = max(liquid, smoothstep(0.0, 0.01, since));
  gl_FragColor = outColor(col * visible, tex.a * visible);
}
`;

const ease = (k) => k * k * (3 - 2 * k);

function levelAt(t, params) {
  const k = Math.max(0, Math.min(1, (t - params.drain) / Math.max(0.95 - params.drain, 1e-3)));
  // dall'alto (0) a oltre il fondo, colature comprese
  return -0.03 + (1.06 + params.drip) * ease(k);
}

export const rattiPozzaEffect = {
  id: 'ratti-pozza',
  army: 'Ratti della Megera',
  role: 'entry',
  label: 'Pozza',
  kind: 'in',
  description: 'Una pozza di veleno prende la forma della carta, ribolle e si ritira lasciandola bagnata.',
  defaults: {
    durationMs: 2700,
    color: '#40ad60',
    fill: 0.16,
    drain: 0.32,
    drip: 0.22,
    dripCols: 9,
    bubbles: 1,
    wet: 1,
    wetBand: 0.25,
    fumes: 70,
    drops: 30,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.3, right: m * 0.3, top: m * 0.5, bottom: m * 0.45 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uFill', 'uLevel', 'uDrip', 'uDripCols', 'uBubbles', 'uWet', 'uWetBand'],
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uFill, ease(Math.max(0, Math.min(1, t / Math.max(params.fill, 0.02)))) * 1.05);
      gl.uniform1f(u.uLevel, levelAt(t, params));
      gl.uniform1f(u.uDrip, params.drip * Math.min(1, Math.max(0, (t - params.drain) / 0.1)));
      gl.uniform1f(u.uDripCols, params.dripCols);
      gl.uniform1f(u.uBubbles, params.bubbles);
      // la patina si asciuga del tutto prima della fine
      gl.uniform1f(u.uWet, params.wet * (1 - ease(Math.max(0, Math.min(1, (t - 0.85) / 0.15)))));
      gl.uniform1f(u.uWetBand, params.wetBand);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const neon = env.color.map((c, i) => c * 0.55 + [0.75, 1, 0.35][i] * 0.45);
      const L = levelAt(t, params);
      const live = !state.done && t < 0.96 ? 1 : 0;
      // fumi tossici che salgono dalla superficie
      const n = env.clock(params.fumes * live, state.dt);
      for (let i = 0; i < n; i += 1) {
        const y = Math.max(0, Math.min(1, t < params.drain ? 1 - Math.min(1, t / params.fill) : L));
        if (y >= 1) break;
        const [cx, cy] = toCanvasUv(rect, Math.random(), y);
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.02, vy: -(0.02 + Math.random() * 0.05), life: 0.8 + Math.random() * 1.2, size: 2 + Math.random() * 3.5, heat: 0.15 + Math.random() * 0.3, rise: 0.02, alpha: 0.55 });
      }
      // gocce che cadono dal fondo mentre la pozza scola via
      const draining = L > 0.4 && t < 0.95 && !state.done ? 1 : 0;
      const d = env.clock2(params.drops * draining, state.dt);
      for (let i = 0; i < d; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.05 + Math.random() * 0.9, 1);
        env.flakes.spawn(cx, cy, { vx: 0, vy: 0.02, life: 0.5 + Math.random() * 0.4, size: 2.5 + Math.random() * 3, color: neon, shape: 2, spin: 0, gravity: 1.6, drag: 0.2 });
      }
      env.embers.step(state.dt);
      env.flakes.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['fill', 'Salita pozza', 0.02, 0.4, 0.01],
    ['drain', 'Inizio ritiro', 0.1, 0.7, 0.01],
    ['drip', 'Colature', 0, 0.5, 0.01],
    ['dripCols', 'Colonne colature', 2, 24, 1],
    ['bubbles', 'Bolle', 0, 2, 0.01],
    ['wet', 'Patina bagnata', 0, 2, 0.01],
    ['wetBand', 'Asciugatura', 0.05, 0.6, 0.01],
    ['fumes', 'Fumi / s', 0, 300, 1],
    ['drops', 'Gocce / s', 0, 150, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    pozza: { label: 'Pozza', params: {} },
    fogna: { label: 'Dalla fogna', params: { durationMs: 3300, fill: 0.25, drain: 0.45, drip: 0.35, fumes: 140, drops: 60 } },
  },
};
