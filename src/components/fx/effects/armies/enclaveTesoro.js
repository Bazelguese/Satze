// L'Enclave delle Scaglie · «Tesoro» (ingresso): una pioggia d'oro si posa scaglia dopo
// scaglia, dal basso, componendo la sagoma della carta in scaglie dorate; poi, a ondata,
// ogni scaglia si gira dall'oro alla carta. «Ogni corona rubata ci avvicina al cielo.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, cardHeightPx } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uRows;
uniform float uGold;
uniform float uSeams;
uniform float uShine;
uniform float uPile;
uniform float uFlipStart;
uniform float uFlip;
uniform float uEndFade;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  float ch = 1.0 / uRows;
  float cw = ch * 1.15;
  vec2 P = vec2(p.x * uAspect, p.y);
  float row = floor(P.y / ch);
  float shift = mod(row, 2.0) * 0.5 * cw;
  float col = floor((P.x + shift) / cw);
  vec2 origin = vec2(col * cw - shift, row * ch);
  vec2 local = (P - origin) / vec2(cw, ch);
  vec2 centerUv = vec2((origin.x + cw * 0.5) / uAspect, origin.y + ch * 0.5);
  float jit = hash(vec2(col, row)) - 0.5;
  float s = clamp(sweepN(clamp(centerUv, 0.0, 1.0)) + jit * 0.08, 0.0, 1.0);

  // 1) la scaglia si posa: compare con un piccolo rimbalzo
  float tLand = s * uPile;
  float land = clamp((t - tLand) / 0.05, 0.0, 1.0);
  if (land <= 0.0) { gl_FragColor = vec4(0.0); return; }
  float pop = 1.0 + 0.35 * (1.0 - land) * (1.0 - land);
  vec2 lc = (local - vec2(0.5, 0.45)) * pop + vec2(0.5, 0.45);

  // 2) il giro: dall'oro alla faccia della carta
  float tFlip = uFlipStart + s * (0.98 - uFlip - uFlipStart);
  float f = clamp((t - tFlip) / uFlip, 0.0, 1.0);
  float ang = f * 3.14159;
  float w = max(abs(cos(ang)), 0.02);
  float lx = (lc.x - 0.5) / w + 0.5;
  if (lx < 0.0 || lx > 1.0 || lc.y < 0.0 || lc.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec2 lp = vec2(lx, lc.y);
  vec2 src = vec2((origin.x + lp.x * cw) / uAspect, origin.y + lp.y * ch);
  vec4 tex = cardAt(src);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  float shape = length((lp - vec2(0.5, 0.3)) * vec2(1.0, 0.85));
  vec3 col3;
  if (f >= 0.5) {
    // faccia: la carta, con le giunture che spariscono alla fine
    float seam = smoothstep(0.62, 0.72, shape) * uSeams * uEndFade;
    col3 = tex.rgb * (1.0 - seam * 0.5);
    col3 += mix(uColor, vec3(1.0), 0.5) * smoothstep(0.58, 0.7, shape) * (1.0 - f) * 2.0 * tex.a * uEndFade;
  } else {
    // dorso d'oro
    vec3 gold = mix(uColor, vec3(1.0, 0.82, 0.36), uGold);
    float inside = 1.0 - smoothstep(0.64, 0.7, shape);
    float hl = (1.0 - smoothstep(0.0, 0.42, length(lp - vec2(0.36, 0.26)))) * uShine;
    float glint = exp(-sq((t - tLand - 0.03) / 0.02)) * 0.8;
    float rimL = smoothstep(0.5, 0.64, shape) * inside;
    vec3 back = gold * (0.5 + 0.5 * (1.0 - lp.y)) * (1.0 - rimL * 0.35) + vec3(1.0, 0.95, 0.82) * (hl * 0.6 + glint);
    col3 = mix(gold * 0.22, back, inside) * tex.a;
  }
  col3 *= 0.55 + 0.45 * w;
  gl_FragColor = outColor(col3, tex.a);
}
`;

export const enclaveTesoroEffect = {
  id: 'enclave-tesoro',
  army: "L'Enclave delle Scaglie",
  role: 'entry',
  label: 'Tesoro',
  kind: 'in',
  description: "Una pioggia d'oro compone la carta in scaglie dorate, che poi si girano mostrando la carta.",
  defaults: {
    durationMs: 2800,
    color: '#fb912d',
    rows: 11,
    pile: 0.4,
    flipStart: 0.45,
    flip: 0.12,
    gold: 0.7,
    seams: 0.6,
    shine: 1,
    rain: 120,
    glints: 40,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.25,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.3, right: m * 0.3, top: m * 0.75, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRows', 'uGold', 'uSeams', 'uShine', 'uPile', 'uFlipStart', 'uFlip', 'uEndFade'],
    sweep: sweepOf,
    maxFlakes: 900,
    bind: (gl, u, { params, progress }) => {
      gl.uniform1f(u.uRows, Math.round(params.rows));
      gl.uniform1f(u.uGold, params.gold);
      gl.uniform1f(u.uSeams, params.seams);
      gl.uniform1f(u.uShine, params.shine);
      gl.uniform1f(u.uPile, Math.max(0.05, Math.min(0.7, params.pile)));
      gl.uniform1f(u.uFlipStart, Math.max(params.pile * 0.5, Math.min(0.8, params.flipStart)));
      gl.uniform1f(u.uFlip, Math.max(0.03, Math.min(0.3, params.flip)));
      const k = Math.max(0, Math.min(1, (progress - 0.9) / 0.1));
      gl.uniform1f(u.uEndFade, 1 - k * k * (3 - 2 * k));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const gold = env.color.map((c, i) => c * 0.4 + [1, 0.82, 0.36][i] * 0.6);
      const px = cardHeightPx(state, env.canvas) / Math.round(params.rows);
      // pioggia di monete e scaglie che cade sulla sagoma mentre si compone
      const raining = t < params.pile + 0.05 && !state.done ? 1 : 0;
      const n = env.clock(params.rain * raining, state.dt);
      for (let i = 0; i < n; i += 1) {
        const x = Math.random();
        // cade fino a dove la pila sta crescendo (dal basso: 1 - quota della pila)
        const top = Math.max(0, 1 - t / Math.max(params.pile, 0.05));
        const yEnd = top + Math.random() * (1 - top) * 0.3;
        const [sx, sy] = toCanvasUv(rect, x, -0.25 - Math.random() * 0.4);
        const [, ey] = toCanvasUv(rect, x, yEnd);
        const vy = 0.9 + Math.random() * 0.4;
        env.flakes.spawn(sx, sy, {
          vx: (Math.random() - 0.5) * 0.02,
          vy,
          life: Math.max(0.1, (ey - sy) / vy),
          size: px * (0.35 + Math.random() * 0.35),
          color: gold.map((c) => c * (0.75 + Math.random() * 0.35)),
          shape: Math.random() < 0.7 ? 2 : 4,
          spin: (Math.random() - 0.5) * 10,
          gravity: 0,
          drag: 0,
          flutter: 10 + Math.random() * 10,
        });
      }
      // luccichii mentre le scaglie si girano
      const flipping = t > params.flipStart && t < 0.97 && !state.done ? 1 : 0;
      const g = env.clock2(params.glints * flipping, state.dt);
      for (let i = 0; i < g; i += 1) {
        const [cx, cy] = toCanvasUv(rect, Math.random(), Math.random());
        env.embers.spawn(cx, cy, { vx: 0, vy: -0.01, life: 0.25 + Math.random() * 0.35, size: 1.5 + Math.random() * 2.5, heat: 1, rise: 0 });
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['rows', 'File di scaglie', 5, 20, 1],
    ['pile', 'Fine pioggia', 0.05, 0.7, 0.01],
    ['flipStart', 'Inizio giro', 0.1, 0.8, 0.01],
    ['flip', 'Durata giro', 0.03, 0.3, 0.005],
    ['gold', 'Oro', 0, 1, 0.01],
    ['seams', 'Giunture', 0, 1, 0.01],
    ['shine', 'Riflesso', 0, 2, 0.01],
    ['rain', 'Pioggia / s', 0, 400, 1],
    ['glints', 'Luccichii / s', 0, 200, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    tesoro: { label: 'Tesoro', params: {} },
    reliquia: { label: 'Reliquia', params: { durationMs: 3400, rows: 8, pile: 0.5, flipStart: 0.6, flip: 0.16, rain: 200, glints: 80 } },
  },
};
