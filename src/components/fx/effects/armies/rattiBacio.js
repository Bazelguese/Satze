// Ratti della Megera · «Bacio» (ingresso): come in una fiaba rovesciata, nel buio compare un
// bacio: il Marchio della Megera, due labbra verdi luminose. Pulsa come un cuore, poi dal
// bacio la carta si allarga, preceduta da venature verdognole, tra pulviscolo fatato e malato.
// Resta un attimo il livido a forma di labbra, poi svanisce.
// «Non lancia maledizioni. È la maledizione.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform vec2 uKiss;
uniform float uLips;
uniform float uBeat;
uniform float uSpread;
uniform float uMark;
uniform float uLipSize;

/** Labbra (coordinate locali, larghezza ±1): .x dentro, .y riga della bocca, .z riflesso. */
vec3 lips(vec2 m) {
  float x = m.x;
  float w = max(0.0, 1.0 - x * x);
  float mid = 0.05 * w - 0.02;                         // riga della bocca, appena curva
  float top = -0.42 * pow(w, 0.8) + 0.16 * exp(-x * x / 0.02) * w; // arco di Cupido
  float bot = 0.48 * pow(w, 0.9);
  float upper = step(top, m.y) * step(m.y, mid);
  float lower = step(mid, m.y) * step(m.y, bot);
  float inside = (upper + lower) * step(abs(x), 1.0);
  float seam = exp(-abs(m.y - mid) / 0.02) * inside;
  float shine = exp(-length((m - vec2(-0.2, bot * 0.55)) / vec2(0.25, 0.06))) * lower;
  return vec3(inside, seam, shine);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2(p.x * uAspect, p.y);
  vec2 K = vec2(uKiss.x * uAspect, uKiss.y);
  vec3 neon = mix(uColor, vec3(0.7, 1.0, 0.45), 0.4);
  vec3 violet = vec3(0.55, 0.3, 0.7);

  // il bacio: labbra luminose che pulsano
  float sz = uLipSize * (1.0 + 0.08 * uBeat);
  vec2 m = (P - K) / vec2(sz, sz * 0.9);
  vec3 L = lips(m);
  float soft = 1.0 - smoothstep(0.0, 1.0, length(m / vec2(1.3, 0.9)));

  // la carta si allarga dal bacio, con un bordo di venature
  vec4 tex = cardAt(p);
  float d = length((P - K) * vec2(1.0, 0.85));
  float edgeN = (fbm(P * 8.0) - 0.5) * 0.12;
  float front = uSpread - d + edgeN;
  float shown = smoothstep(0.0, 0.03, front);
  float veinsBand = smoothstep(-0.12, 0.0, front) * (1.0 - shown);
  float veins = (1.0 - smoothstep(0.0, 0.03, abs(fbm(P * 12.0 + 4.0) - 0.5))) * veinsBand;
  // carta appena raggiunta: un velo malato che si dissolve
  float fresh = (1.0 - smoothstep(0.0, 0.18, front)) * shown;
  vec3 card = tex.rgb * (1.0 - fresh * 0.4) + neon * fresh * 0.3 * tex.a;

  vec3 col = card * shown;
  float a = tex.a * shown;
  col += mix(neon, violet, 0.3) * veins * tex.a;
  a = max(a, veins * tex.a * 0.9);
  // il livido a forma di labbra (il Marchio): splende, poi resta impresso e svanisce
  float lipA = L.x * max(uLips, uMark);
  vec3 lipCol = neon * (0.65 + 0.35 * uBeat) * (1.0 - L.y * 0.6) + vec3(1.0) * L.z * 0.5;
  lipCol = mix(lipCol, neon * 0.45, (1.0 - uLips) * step(0.001, uMark)); // da luce a livido
  col = mix(col, lipCol * max(a, lipA), lipA * mix(1.0, 0.55, step(0.001, uMark) * (1.0 - uLips)));
  a = max(a, lipA);
  // alone attorno al bacio
  float halo = soft * uLips * (0.25 + 0.25 * uBeat);
  col += neon * halo * (1.0 - a);
  a = max(a, halo * 0.6);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const rattiBacioEffect = {
  id: 'ratti-bacio',
  army: 'Ratti della Megera',
  role: 'entry',
  label: 'Bacio',
  kind: 'in',
  description: 'Compare il Marchio della Megera, un bacio di labbra verdi che pulsa; dal bacio la carta si allarga tra venature e pulviscolo.',
  defaults: {
    durationMs: 3000,
    color: '#40ad60',
    lipSize: 0.17,
    kissX: 0.5,
    kissY: 0.42,
    beats: 2,
    spreadStart: 0.4,
    dust: 90,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.35, bottom: m * 0.3 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uKiss', 'uLips', 'uBeat', 'uSpread', 'uMark', 'uLipSize'],
    bind: (gl, u, { params, progress: t, aspect }) => {
      const s0 = params.spreadStart;
      gl.uniform2f(u.uKiss, params.kissX, params.kissY);
      gl.uniform1f(u.uLipSize, params.lipSize);
      // il bacio si posa (un piccolo schiocco), batte, poi si spegne in livido
      const lipsOn = ease(clamp01(t / 0.08)) * (1 - ease(clamp01((t - s0) / 0.25)));
      gl.uniform1f(u.uLips, lipsOn);
      const beatK = clamp01((t - 0.08) / Math.max(s0 - 0.08, 0.05));
      const beat = t > 0.08 && t < s0 + 0.05 ? Math.pow(Math.max(0, Math.sin(beatK * Math.PI * Math.max(1, Math.round(params.beats)))), 6) : 0;
      gl.uniform1f(u.uBeat, beat);
      const far = Math.hypot(Math.max(params.kissX, 1 - params.kissX) * aspect, Math.max(params.kissY, 1 - params.kissY)) + 0.2;
      gl.uniform1f(u.uSpread, ease(clamp01((t - s0) / Math.max(0.88 - s0, 0.05))) * far);
      gl.uniform1f(u.uMark, t > s0 ? 1 - ease(clamp01((t - 0.72) / 0.24)) : 0);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // pulviscolo fatato ma malato: verde acido e viola, che gira attorno al bacio
      const on = t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.dust * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.25 + Math.random() * 0.45;
        const [cx, cy] = toCanvasUv(rect, params.kissX + Math.cos(a) * r, params.kissY + Math.sin(a) * r * 0.8);
        env.embers.spawn(cx, cy, {
          vx: -Math.sin(a) * 0.05,
          vy: Math.cos(a) * 0.04 - 0.01,
          life: 0.8 + Math.random() * 1,
          size: 1 + Math.random() * 2.2,
          heat: Math.random() < 0.7 ? 0.6 + Math.random() * 0.4 : 0.1,
          rise: 0,
        });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.heat = Math.max(0.05, Math.min(1, e.heat + Math.sin(e.age * 13 + e.sway) * 0.05));
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['lipSize', 'Misura labbra', 0.05, 0.3, 0.005],
    ['kissX', 'Bacio X', 0.15, 0.85, 0.01],
    ['kissY', 'Bacio Y', 0.15, 0.85, 0.01],
    ['beats', 'Battiti', 1, 4, 1],
    ['spreadStart', 'La carta si allarga', 0.15, 0.7, 0.01],
    ['dust', 'Pulviscolo / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    bacio: { label: 'Bacio', params: {} },
    marchio: { label: 'Marchio', params: { durationMs: 3600, lipSize: 0.17, beats: 3, spreadStart: 0.5, dust: 150 } },
  },
};
