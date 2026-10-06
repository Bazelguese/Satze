// Orathai · «Fioritura» (ingresso): dal basso salgono tralci verdi carichi di gemme; le gemme
// si gonfiano e sbocciano in fiori, e dove un fiore si apre c'è la carta. Poi i petali si
// staccano e volano via, e resta la carta. Gli Orathai sono alberi umanoidi: il bosco che
// cresce dopo ogni vittoria.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uVines;
uniform float uBloom;
uniform float uCell;
uniform float uPetalFade;

/** Fiore a cinque petali di raggio R (coordinate locali): .x dentro, .y cuore, .z venatura. */
vec3 flower(vec2 m, float R, float rot) {
  float r = length(m);
  float a = atan(m.y, m.x) + rot;
  float petal = R * (0.62 + 0.38 * pow(abs(cos(a * 2.5)), 0.8));
  float inside = 1.0 - smoothstep(petal - 0.004, petal + 0.004, r);
  float heart = 1.0 - smoothstep(R * 0.16, R * 0.2, r);
  float vein = (1.0 - smoothstep(0.0, 0.06, abs(sin(a * 2.5)))) * inside;
  return vec3(inside, heart, vein);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  vec2 P = vec2(p.x * uAspect, p.y);
  vec3 teal = uColor;
  vec3 pink = vec3(1.0, 0.72, 0.85);

  // tralci che salgono dal basso, ondeggiando
  float vine = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float x0 = (fi + 0.5) / 5.0 * uAspect + (hash(vec2(fi, 3.0)) - 0.5) * 0.08;
    float x = x0 + sin(P.y * (6.0 + fi) + fi * 2.0) * 0.05;
    float reach = 1.0 - uVines * (1.05 + hash(vec2(fi, 9.0)) * 0.2);
    vine = max(vine, (1.0 - smoothstep(0.004, 0.009, abs(P.x - x))) * step(reach, P.y));
  }

  // fiori su una griglia sfalsata: ognuno sboccia nel suo istante (dal basso verso l'alto)
  float cs = uCell;
  vec2 g = P / cs;
  float shown = 0.0;
  float petalA = 0.0;
  vec3 petalCol = vec3(0.0);
  float bud = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cid = floor(g) + vec2(float(i), float(j));
      vec2 c = (cid + 0.5 + (vec2(hash(cid), hash(cid + 4.1)) - 0.5) * 0.5) * cs;
      float tb = (1.0 - clamp(c.y, 0.0, 1.0)) * 0.6 + hash(cid + 7.3) * 0.25;
      float k = clamp((uBloom - tb) / 0.15, 0.0, 1.0);
      vec2 m = P - c;
      float rot = hash(cid + 1.1) * 6.28;
      // gemma chiusa prima di sbocciare
      float budR = cs * 0.18 * smoothstep(-0.12, 0.0, uBloom - tb);
      bud = max(bud, (1.0 - smoothstep(budR - 0.003, budR + 0.003, length(m))) * (1.0 - k));
      // il fiore si apre: dentro c'è la carta; i petali restano sul bordo e poi volano via
      vec3 f = flower(m, cs * 1.25 * k, rot);
      shown = max(shown, f.x * step(0.001, k));
      float ring = f.x * (1.0 - flower(m, cs * 1.25 * k * 0.72, rot).x);
      float pa = ring * (1.0 - smoothstep(0.6, 1.0, k)) * uPetalFade;
      if (pa > petalA) {
        petalA = pa;
        petalCol = mix(mix(teal, pink, hash(cid + 2.2) * 0.7), vec3(1.0), 0.25) * (0.8 + 0.2 * f.z);
      }
    }
  }
  // a fine fioritura la carta è tutta scoperta
  shown = max(shown, smoothstep(0.9, 0.97, uBloom));

  vec3 col = tex.rgb * shown;
  float a = tex.a * shown;
  vec3 green = vec3(0.15, 0.38, 0.12);
  float vA = vine * (1.0 - shown) * tex.a * uPetalFade;
  col = col * (1.0 - vA) + green * vA;
  a = max(a, vA);
  float bA = bud * tex.a * uPetalFade;
  col = col * (1.0 - bA) + mix(green, teal, 0.5) * bA;
  a = max(a, bA);
  float pA = petalA * tex.a;
  col = col * (1.0 - pA) + petalCol * pA;
  a = max(a, pA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const orathaiFiorituraEffect = {
  id: 'orathai-fioritura',
  army: 'Orathai',
  role: 'entry',
  label: 'Fioritura',
  kind: 'in',
  description: 'Tralci carichi di gemme salgono dal basso; i fiori sbocciano e dove si aprono c\'è la carta, poi i petali volano via.',
  defaults: {
    durationMs: 3000,
    color: '#5ad4bc',
    vines: 0.25,
    bloomStart: 0.15,
    flowerSize: 0.11,
    petals: 120,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.4, right: m * 0.4, top: m * 0.45, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uVines', 'uBloom', 'uCell', 'uPetalFade'],
    needsPixels: true,
    maxFlakes: 900,
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uVines, ease(clamp01(t / Math.max(params.vines, 0.02))));
      gl.uniform1f(u.uBloom, clamp01((t - params.bloomStart) / Math.max(0.92 - params.bloomStart, 0.05)));
      gl.uniform1f(u.uCell, params.flowerSize);
      gl.uniform1f(u.uPetalFade, 1 - ease(clamp01((t - 0.86) / 0.12)));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const bloom = clamp01((t - params.bloomStart) / Math.max(0.92 - params.bloomStart, 0.05));
      // petali che si staccano dove i fiori stanno sbocciando (fronte dal basso)
      const on = bloom > 0.05 && bloom < 1 && !state.done ? 1 : 0;
      const n = env.clock(params.petals * on, state.dt);
      const teal = env.color;
      const pink = [1, 0.72, 0.85];
      for (let i = 0; i < n; i += 1) {
        const y = Math.max(0, Math.min(1, 1 - (bloom - 0.15) / 0.6 + (Math.random() - 0.5) * 0.2));
        const x = Math.random();
        if (env.pixels && env.pixels.at(x, y)[3] < 0.2) continue;
        const [cx, cy] = toCanvasUv(rect, x, y);
        const mixK = Math.random();
        const col = teal.map((c, k) => (c * (1 - mixK) + pink[k] * mixK) * 0.75 + 0.25);
        env.flakes.spawn(cx, cy, { vx: 0.03 + Math.random() * 0.08, vy: -0.04 - Math.random() * 0.06, life: 1.2 + Math.random(), size: 5 + Math.random() * 5, color: col, shape: 1, gravity: 0.06, drag: 0.9, flutter: 5 + Math.random() * 5 });
      }
      env.flakes.step(state.dt, (f, dt) => {
        f.vy += f.gravity * dt;
        f.vx += Math.sin(f.age * 3 + f.phase) * 0.05 * dt;
        const kk = Math.exp(-f.drag * dt);
        f.vx *= kk;
        f.vy *= kk;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['vines', 'Crescita tralci', 0.02, 0.5, 0.01],
    ['bloomStart', 'Inizio fioritura', 0.05, 0.5, 0.01],
    ['flowerSize', 'Misura fiori', 0.05, 0.25, 0.005],
    ['petals', 'Petali / s', 0, 400, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    fioritura: { label: 'Fioritura', params: {} },
    primavera: { label: 'Primavera', params: { durationMs: 3800, flowerSize: 0.08, petals: 240 } },
  },
};
