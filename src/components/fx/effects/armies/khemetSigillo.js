// Khemet · «Sigillo» (sconfitta inflitta): un cerchio magico di anelli e rune si disegna
// attorno alla carta, le rune si incidono sulla carta, poi il cerchio si stringe e la
// risucchia ruotando nel sigillo centrale, che lampeggia e si spegne.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { widePadding, smoothstepJs } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uRadius;
uniform float uRunes;
uniform float uEngrave;
uniform float uSpin;
uniform float uGlow;

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
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  float r = length(P);
  float a = (atan(P.y, P.x + 1e-6) + 3.14159265) / 6.2831853; // 0-1

  float draw = smoothstep(0.02, 0.24, t);                 // il cerchio si traccia
  float k = smoothstep(0.5, 0.86, t);                     // il cerchio si stringe
  float fadeAll = 1.0 - smoothstep(0.9, 1.0, t);
  float s = 1.0 - 0.86 * k;
  float R1 = uRadius * s;
  float R2 = uRadius * 0.8 * s;
  float R3 = uRadius * 0.55 * s;
  vec3 light = mix(uColor, vec3(1.0), 0.45);

  // anelli tracciati in senso orario
  float arc = step(a, draw);
  float rings = (ringLine(r, R1, 0.004) + ringLine(r, R2, 0.003) * 0.8 + ringLine(r, R3, 0.0025) * 0.6) * arc;

  // fasce di rune che ruotano in versi opposti
  float n1 = 28.0;
  float a1 = fract(a + t * uSpin * 0.25);
  float band1 = rune(vec2(fract(a1 * n1), (r - R2) / max(R1 - R2, 1e-4)) * vec2(1.0, 1.0), floor(a1 * n1) + 1.0, 0.045);
  float n2 = 18.0;
  float a2 = fract(a - t * uSpin * 0.35);
  float band2 = rune(vec2(fract(a2 * n2), (r - R3) / max(R2 - R3, 1e-4)), floor(a2 * n2) + 50.0, 0.05);
  float runes = (band1 + band2 * 0.8) * step(a, draw * 1.02) * uRunes;
  float circleA = (rings + runes) * uGlow * fadeAll;

  // la carta, risucchiata e ruotata verso il centro
  float ang = k * k * 3.14159 * 1.6;
  vec2 Pc = rot2(P, -ang) / max(s * (1.0 - 0.15 * k), 1e-3);
  vec2 uvc = vec2(Pc.x / uAspect, Pc.y) + 0.5;
  vec4 tex = cardAt(uvc) * (1.0 - smoothstep(0.82, 0.9, t));
  // rune incise sulla carta, accese una a una
  vec2 grid = vec2(7.0, 10.0);
  vec2 gc = floor(uvc * grid);
  vec2 guv = fract(uvc * grid);
  float te = 0.14 + hash(gc + 1.7) * 0.32;
  float on = smoothstep(te, te + 0.04, t) * step(0.35, hash(gc + 5.3));
  float engr = rune(guv * 1.25 - 0.125, gc.x * 11.0 + gc.y * 37.0, 0.05) * on * uEngrave;
  vec3 col = tex.rgb * (1.0 - 0.35 * smoothstep(0.1, 0.5, t)) + light * engr * tex.a * (0.7 + 0.3 * sin(uTime * 6.0 + gc.x));

  // sigillo finale: lampo e una grande runa che si spegne
  float flash = exp(-sq((t - 0.86) / 0.03)) * exp(-r / 0.12);
  float sigil = rune(P / 0.5 + 0.5, 777.0, 0.03) * smoothstep(0.84, 0.88, t) * (1.0 - smoothstep(0.9, 1.0, t));
  vec3 outC = col + light * (circleA + sigil * 1.4) * (1.0 - tex.a) + vec3(1.0) * flash;
  float alpha = max(tex.a, min(1.0, circleA + sigil * 1.2 + flash));
  gl_FragColor = outColor(outC, alpha);
}
`;

export const khemetSigilloEffect = {
  id: 'khemet-sigillo',
  army: 'Khemet',
  role: 'defeat',
  label: 'Sigillo',
  kind: 'out',
  description: 'Un cerchio di rune incide la carta e la risucchia in un sigillo.',
  defaults: {
    durationMs: 2600,
    color: '#26c4e8',
    radius: 0.62,
    runes: 1,
    engrave: 1,
    spin: 1,
    glow: 1.1,
    motes: 70,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const p = widePadding(w, h);
    const m = Math.max(w, h);
    return { left: Math.max(p.left, m * 0.5), right: Math.max(p.right, m * 0.5), top: m * 0.3, bottom: m * 0.3 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRadius', 'uRunes', 'uEngrave', 'uSpin', 'uGlow'],
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uRadius, params.radius);
      gl.uniform1f(u.uRunes, params.runes);
      gl.uniform1f(u.uEngrave, params.engrave);
      gl.uniform1f(u.uSpin, params.spin);
      gl.uniform1f(u.uGlow, params.glow);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const k = smoothstepJs(0.5, 0.86, t);
      const R = params.radius * (1 - 0.86 * k);
      // scintille che corrono sugli anelli e cadono verso il centro mentre si stringe
      const on = t > 0.05 && t < 0.88 && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const x = 0.5 + (Math.cos(a) * R) / aspect;
        const y = 0.5 + Math.sin(a) * R;
        const [cx, cy] = toCanvasUv(rect, x, y);
        const [ox, oy] = toCanvasUv(rect, 0.5, 0.5);
        env.embers.spawn(cx, cy, {
          vx: (ox - cx) * (0.4 + k * 1.5),
          vy: (oy - cy) * (0.4 + k * 1.5),
          life: 0.4 + Math.random() * 0.5,
          size: 1 + Math.random() * 2,
          heat: 0.7,
          rise: 0,
        });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['radius', 'Raggio del cerchio', 0.4, 0.9, 0.01],
    ['runes', 'Rune del cerchio', 0, 2, 0.01],
    ['engrave', 'Rune sulla carta', 0, 2, 0.01],
    ['spin', 'Rotazione', 0, 4, 0.05],
    ['glow', 'Luce', 0, 2.5, 0.01],
    ['motes', 'Scintille / s', 0, 300, 1],
  ],
  colorParams: [],
  presets: {
    sigillo: { label: 'Sigillo', params: {} },
    giudizio: { label: 'Giudizio', params: { durationMs: 1700, radius: 0.75, runes: 1.6, engrave: 1.6, spin: 2.4, glow: 1.6, motes: 160 } },
  },
};
