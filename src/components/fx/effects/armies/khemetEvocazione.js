// Khemet · «Evocazione» (ingresso): ai piedi della carta si traccia un cerchio di rune, visto
// di scorcio sul terreno; si accende e solleva una colonna di luce in cui la carta prende
// forma dal basso, prima come un mosaico di rune incandescenti e poi nitida. Warlock
// gotico-egizi: il rito prima della forza.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uDraw;
uniform float uCircle;
uniform float uPillar;
uniform float uForm;
uniform float uRadius;
uniform float uSpin;

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}

/** Runa inventata: quattro tratti fra i punti di una griglia 3×3. */
float rune(vec2 uv, float id, float w) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  float d = 1e3;
  for (int k = 0; k < 4; k++) {
    float h1 = hash(vec2(id, float(k) * 7.13));
    float h2 = hash(vec2(id + 3.3, float(k) * 1.71));
    vec2 a = vec2(floor(h1 * 3.0), floor(fract(h1 * 7.0) * 3.0)) * 0.34 + 0.16;
    vec2 b = vec2(floor(h2 * 3.0), floor(fract(h2 * 5.0) * 3.0)) * 0.34 + 0.16;
    d = min(d, segDist(uv, a, b));
  }
  return 1.0 - smoothstep(w, w * 2.0, d);
}

float ringLine(float r, float R, float w) {
  return exp(-sq((r - R) / w));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  vec3 light = mix(uColor, vec3(1.0), 0.45);

  // cerchio sul terreno, di scorcio (ellisse) ai piedi della carta
  vec2 G = vec2((p.x - 0.5) * uAspect, (p.y - 1.0) / 0.3);
  float r = length(G);
  float a = (atan(G.y, G.x + 1e-6) + 3.14159265) / 6.2831853;
  float R1 = uRadius;
  float R2 = uRadius * 0.78;
  float R3 = uRadius * 0.5;
  float arc = step(a, uDraw);
  float rings = (ringLine(r, R1, 0.012) + ringLine(r, R2, 0.009) * 0.8 + ringLine(r, R3, 0.008) * 0.6) * arc;
  float a1 = fract(a + t * uSpin * 0.2);
  float band = rune(vec2(fract(a1 * 22.0), (r - R2) / max(R1 - R2, 1e-4)), floor(a1 * 22.0) + 1.0, 0.05);
  float a2 = fract(a - t * uSpin * 0.3);
  float band2 = rune(vec2(fract(a2 * 14.0), (r - R3) / max(R2 - R3, 1e-4)), floor(a2 * 14.0) + 40.0, 0.06);
  // stella a sei punte inscritta
  float star = 0.0;
  for (int k = 0; k < 6; k++) {
    float ang = float(k) * 1.0471976;
    vec2 A = vec2(cos(ang), sin(ang)) * R3;
    vec2 B = vec2(cos(ang + 2.0943951), sin(ang + 2.0943951)) * R3;
    star = max(star, 1.0 - smoothstep(0.006, 0.014, segDist(G, A, B)));
  }
  float circle = (rings + (band + band2 * 0.8) * step(a, uDraw * 1.02) + star * smoothstep(0.7, 1.0, uDraw)) * uCircle;

  // colonna di luce che sale dal cerchio, larga quanto la carta
  float px = abs(p.x - 0.5) * uAspect;
  float colW = 0.5 * uAspect * 1.05;
  float beam = (1.0 - smoothstep(colW * 0.75, colW, px)) * smoothstep(-0.4, 1.0, p.y) * step(p.y, 1.0 + 0.02);
  float streaks = 0.6 + 0.4 * noise(vec2(p.x * 40.0, p.y * 2.0 - uTime * 3.0));
  float pillar = beam * streaks * uPillar;

  // la carta prende forma dal basso: celle-runa incandescenti, poi la carta
  vec4 tex = cardAt(p);
  vec2 grid = vec2(9.0, 13.0);
  vec2 gc = floor(p * grid);
  vec2 guv = fract(p * grid);
  float rowT = (1.0 - (gc.y + 0.5) / grid.y) * 0.75 + hash(gc + 2.1) * 0.25;
  float lit = smoothstep(rowT, rowT + 0.08, uForm);            // la runa della cella si accende
  float solid = smoothstep(rowT + 0.12, rowT + 0.3, uForm);    // poi diventa carta
  float glyph = rune(guv * 1.3 - 0.15, gc.x * 13.0 + gc.y * 7.0, 0.06);
  vec3 col = tex.rgb * solid + light * glyph * lit * (1.0 - solid) * 1.4 * tex.a;
  col += light * lit * (1.0 - solid) * 0.18 * tex.a;
  float cardA = tex.a * max(solid, lit * (glyph * 0.9 + 0.25) * (1.0 - solid));

  vec3 outC = col + light * (circle + pillar * 0.35) * (1.0 - cardA) + light * pillar * 0.12 * cardA;
  float alpha = max(cardA, min(1.0, circle + pillar * 0.3));
  gl_FragColor = outColor(outC, alpha);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const khemetEvocazioneEffect = {
  id: 'khemet-evocazione',
  army: 'Khemet',
  role: 'entry',
  label: 'Evocazione',
  kind: 'in',
  description: 'Un cerchio di rune si traccia sul terreno, solleva una colonna di luce e la carta prende forma da un mosaico di rune.',
  defaults: {
    durationMs: 3000,
    color: '#26c4e8',
    draw: 0.26,
    formStart: 0.36,
    radius: 0.62,
    spin: 1,
    pillar: 1,
    motes: 70,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.5, right: m * 0.5, top: m * 0.35, bottom: m * 0.35 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uDraw', 'uCircle', 'uPillar', 'uForm', 'uRadius', 'uSpin'],
    bind: (gl, u, { params, progress: t }) => {
      const fade = 1 - ease(clamp01((t - 0.82) / 0.16));
      gl.uniform1f(u.uDraw, ease(clamp01(t / Math.max(params.draw, 0.02))));
      gl.uniform1f(u.uCircle, ease(clamp01(t / 0.05)) * fade * (1 + 0.6 * Math.exp(-Math.pow((t - params.draw - 0.03) / 0.04, 2))));
      gl.uniform1f(u.uPillar, params.pillar * ease(clamp01((t - params.draw) / 0.12)) * fade);
      // forma: 0 → 1.3 così anche le ultime celle diventano carta prima della fine
      gl.uniform1f(u.uForm, 1.32 * ease(clamp01((t - params.formStart) / Math.max(0.94 - params.formStart, 0.05))));
      gl.uniform1f(u.uRadius, params.radius);
      gl.uniform1f(u.uSpin, params.spin);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // pulviscolo che sale nella colonna
      const on = t > params.draw && t < 0.9 && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.05 + Math.random() * 0.9, 1 + Math.random() * 0.05);
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.01, vy: -(0.1 + Math.random() * 0.2), life: 0.8 + Math.random() * 0.8, size: 1 + Math.random() * 2, heat: 0.5 + Math.random() * 0.5, rise: 0 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['draw', 'Tracciatura cerchio', 0.05, 0.5, 0.01],
    ['formStart', 'Inizio forma', 0.1, 0.7, 0.01],
    ['radius', 'Raggio cerchio', 0.35, 0.9, 0.01],
    ['spin', 'Rotazione rune', 0, 4, 0.05],
    ['pillar', 'Colonna di luce', 0, 2, 0.01],
    ['motes', 'Pulviscolo / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    evocazione: { label: 'Evocazione', params: {} },
    rito: { label: 'Rito lungo', params: { durationMs: 3800, draw: 0.35, formStart: 0.45, spin: 1.8, pillar: 1.4, motes: 140 } },
  },
};
