// Figli dell'Orizzonte · «Costellazione» (ingresso): la carta compare prima come una
// costellazione di stelle sui suoi contorni e sulle linee del disegno; poi si riempie dei
// colori della Nebula, che si spandono come inchiostro nell'acqua, e infine torna nitida.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uStars;
uniform float uInk;
uniform float uSettle;
uniform float uGrid;

float lum(vec2 q) {
  vec4 c = cardAt(q);
  return dot(c.rgb, vec3(0.3, 0.59, 0.11)) + (1.0 - c.a) * 0.0;
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  vec3 neb1 = uColor;
  vec3 neb2 = vec3(1.0, 0.5, 0.9);
  vec3 neb3 = vec3(0.55, 0.95, 1.0);

  // stelle: una per cella, accese dove passano i contorni (bordo della carta o del disegno)
  vec2 g = P * uGrid;
  float star = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cid = floor(g) + vec2(float(i), float(j));
      vec2 sp = (cid + 0.2 + 0.6 * vec2(hash(cid), hash(cid + 3.7))) / uGrid;
      vec2 su = vec2(sp.x / uAspect, sp.y);
      if (su.x < 0.0 || su.x > 1.0 || su.y < 0.0 || su.y > 1.0) continue;
      float border = 1.0 - smoothstep(0.02, 0.045, min(min(su.x, 1.0 - su.x) * uAspect, min(su.y, 1.0 - su.y)));
      float e = 0.012;
      float edge = abs(lum(su + vec2(e, 0.0)) - lum(su - vec2(e, 0.0))) + abs(lum(su + vec2(0.0, e)) - lum(su - vec2(0.0, e)));
      float on = max(border, smoothstep(0.25, 0.5, edge)) * step(0.15, hash(cid + 9.1));
      float tOn = hash(cid + 5.5) * 0.85;
      float lit = smoothstep(tOn, tOn + 0.15, uStars) * on;
      float d = length(P - sp);
      float tw = 0.7 + 0.3 * sin(uTime * 7.0 + hash(cid) * 30.0);
      star = max(star, lit * tw * (exp(-d / 0.004) + 0.35 * exp(-d / 0.012)));
    }
  }

  // inchiostro della Nebula: si spande da alcuni punti, con fili d'inchiostro irregolari
  vec2 w = P + (vec2(fbm(P * 4.0 + 1.3), fbm(P * 4.0 + 7.1)) - 0.5) * 0.18;
  float dmin = 9.0;
  for (int k = 0; k < 4; k++) {
    vec2 s = vec2(hash(vec2(float(k), 2.0)) * uAspect, 0.15 + hash(vec2(float(k), 4.0)) * 0.7);
    dmin = min(dmin, length(w - s) * (0.8 + 0.4 * hash(vec2(float(k), 8.0))));
  }
  float front = uInk * 0.95 - dmin;
  float filled = smoothstep(-0.01, 0.03, front);
  // appena raggiunta è nei colori della Nebula, poi torna ai suoi (uSettle)
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 neb = mix(mix(vec3(0.05, 0.02, 0.14), neb1, smoothstep(0.0, 0.5, l)), mix(neb2, neb3, fbm(w * 5.0)), smoothstep(0.55, 1.0, l));
  float tint = (1.0 - smoothstep(0.0, 0.3, front)) * 0.5 + 0.5;
  vec3 col = mix(tex.rgb, neb * tex.a, (1.0 - uSettle) * tint) * filled;
  float a = tex.a * filled;
  // bordo dell'inchiostro, più chiaro
  float rim = exp(-abs(front) / 0.02) * step(0.001, uInk) * (1.0 - uSettle);
  col += mix(neb1, vec3(1.0), 0.4) * rim * 0.35 * tex.a;
  a = max(a, rim * 0.35 * tex.a);
  // le stelle restano sopra finché l'inchiostro non le copre
  float sA = min(1.0, star) * (1.0 - filled * 0.85) * (1.0 - uSettle);
  col += mix(neb3, vec3(1.0), 0.6) * sA;
  a = max(a, sA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const figliCostellazioneEffect = {
  id: 'figli-costellazione',
  army: "Figli dell'Orizzonte",
  role: 'entry',
  label: 'Costellazione',
  kind: 'in',
  description: "La carta compare come una costellazione sui suoi contorni, si riempie dei colori della Nebula come inchiostro nell'acqua, poi torna nitida.",
  defaults: {
    durationMs: 2800,
    color: '#a288fb',
    starTime: 0.3,
    inkStart: 0.22,
    inkEnd: 0.78,
    density: 26,
    motes: 30,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => ({ left: w * 0.15, right: w * 0.15, top: h * 0.15, bottom: h * 0.15 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uStars', 'uInk', 'uSettle', 'uGrid'],
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uStars, clamp01(t / Math.max(params.starTime, 0.05)));
      // 0.85 basta a raggiungere ogni punto dal seme più vicino (con i fili d'inchiostro)
      gl.uniform1f(u.uInk, ease(clamp01((t - params.inkStart) / Math.max(params.inkEnd - params.inkStart, 0.05))) * 0.85);
      gl.uniform1f(u.uSettle, ease(clamp01((t - params.inkEnd + 0.1) / Math.max(0.97 - params.inkEnd + 0.1, 0.05))));
      gl.uniform1f(u.uGrid, params.density);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const on = t < params.inkEnd && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, Math.random(), Math.random());
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.01, vy: -0.005, life: 0.6 + Math.random() * 0.6, size: 1 + Math.random() * 1.5, heat: 0.6 + Math.random() * 0.4, rise: 0 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['starTime', 'Accensione stelle', 0.05, 0.5, 0.01],
    ['inkStart', 'Inizio inchiostro', 0.05, 0.6, 0.01],
    ['inkEnd', 'Fine inchiostro', 0.4, 0.9, 0.01],
    ['density', 'Fitto delle stelle', 10, 50, 1],
    ['motes', 'Scintille / s', 0, 150, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    costellazione: { label: 'Costellazione', params: {} },
    lenta: { label: 'Notte lenta', params: { durationMs: 3600, starTime: 0.4, inkStart: 0.35, inkEnd: 0.85 } },
  },
};
