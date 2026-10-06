// Calibri Pesanti · «Forgia» (ingresso): compare lo stampo d'acciaio della carta, vuoto; un
// getto di metallo fuso cade dall'alto e lo riempie dal basso, incandescente. Poi la colata
// si raffredda dai bordi verso il centro, tra sbuffi di vapore, e il metallo diventa la carta.
// «Acciaio. Inerzia. Sopravvivenza.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uMold;
uniform float uLevel;
uniform float uCool;
uniform float uPour;
uniform float uStreamX;

vec3 heatColor(float h) {
  // dal rosso cupo al bianco
  vec3 c = mix(vec3(0.35, 0.03, 0.0), vec3(1.0, 0.35, 0.05), smoothstep(0.0, 0.4, h));
  c = mix(c, vec3(1.0, 0.75, 0.3), smoothstep(0.4, 0.75, h));
  return mix(c, vec3(1.0, 0.97, 0.88), smoothstep(0.75, 1.0, h));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  vec2 P = vec2(p.x * uAspect, p.y);

  // getto di metallo che cade dall'alto fino alla superficie della colata
  float sx = abs(P.x - uStreamX * uAspect + sin(P.y * 30.0 + uTime * 20.0) * 0.004);
  float stream = (1.0 - smoothstep(0.012, 0.02, sx)) * step(p.y, 1.0 - uLevel + 0.01) * uPour;
  vec3 streamCol = heatColor(0.95);

  if (tex.a < 0.002) {
    gl_FragColor = outColor(streamCol * stream, stream);
    return;
  }

  // lo stampo: acciaio scuro con il bordo in rilievo (dall'alpha della carta)
  float r = 0.018;
  float m = min(min(cardAt(p + vec2(r / uAspect, 0.0)).a, cardAt(p - vec2(r / uAspect, 0.0)).a), min(cardAt(p + vec2(0.0, r)).a, cardAt(p - vec2(0.0, r)).a));
  float rim = clamp(tex.a - m, 0.0, 1.0);
  vec3 mold = vec3(0.07, 0.07, 0.08) + vec3(0.25, 0.26, 0.28) * rim * (0.6 + 0.4 * noise(P * 40.0));

  // colata: sale dal basso con una superficie ondosa
  float surf = 1.0 - uLevel + (noise(vec2(P.x * 14.0, uTime * 2.0)) - 0.5) * 0.015;
  float filled = smoothstep(surf - 0.004, surf + 0.004, p.y);
  // raffreddamento: dai bordi verso il centro, frastagliato
  vec2 cq = (p - 0.5) * vec2(uAspect, 1.0);
  float fromEdge = 0.5 - max(abs(cq.x) / uAspect, abs(cq.y));
  float coolF = fromEdge * 2.0 + (fbm(P * 6.0) - 0.5) * 0.35;
  float heat = clamp((coolF - (uCool * 1.5 - 0.3)) / 0.35, 0.0, 1.0);
  heat = mix(1.0, heat, step(0.001, uCool));
  // metallo: incandescente, poi acciaio, poi i colori della carta
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 steel = vec3(l) * vec3(0.8, 0.84, 0.9) + 0.06;
  float toCard = 1.0 - smoothstep(0.0, 0.25, heat);
  vec3 metal = mix(steel, tex.rgb / max(tex.a, 1e-3), toCard * smoothstep(0.0, 1.0, uCool * 1.2));
  metal = mix(metal, heatColor(heat) + vec3(0.1) * noise(P * 50.0 + uTime), smoothstep(0.05, 0.4, heat));
  // pelle che si increspa sulla colata ancora calda
  metal += vec3(1.0, 0.8, 0.5) * smoothstep(0.6, 0.8, noise(P * 22.0 + vec2(0.0, uTime))) * 0.25 * smoothstep(0.5, 1.0, heat);
  float menisc = exp(-abs(p.y - surf) / 0.006) * (1.0 - step(0.999, uLevel));

  vec3 col = mix(mold * uMold, metal, filled) + heatColor(1.0) * menisc * 0.8;
  float a = tex.a * max(uMold, filled);
  col = col * tex.a;
  col = mix(col, streamCol, stream);
  a = max(a, stream);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const calibriForgiaEffect = {
  id: 'calibri-forgia',
  army: 'Calibri Pesanti',
  role: 'entry',
  label: 'Forgia',
  kind: 'in',
  description: 'Metallo fuso riempie lo stampo della carta, poi si raffredda dai bordi e diventa la carta.',
  defaults: {
    durationMs: 2900,
    color: '#a9a294',
    mold: 0.1,
    pourStart: 0.1,
    pourEnd: 0.5,
    sparks: 120,
    steam: 40,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.3, right: m * 0.3, top: m * 0.75, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uMold', 'uLevel', 'uCool', 'uPour', 'uStreamX'],
    maxEmbers: 800,
    bind: (gl, u, { params, progress: t, time }) => {
      const { pourStart: a, pourEnd: b } = params;
      gl.uniform1f(u.uMold, ease(clamp01(t / Math.max(params.mold, 0.02))));
      gl.uniform1f(u.uLevel, ease(clamp01((t - a - 0.04) / Math.max(b - a, 0.05))) * 1.03);
      gl.uniform1f(u.uCool, ease(clamp01((t - b) / Math.max(0.96 - b, 0.05))));
      gl.uniform1f(u.uPour, clamp01((t - a) / 0.04) * (1 - clamp01((t - b) / 0.05)));
      gl.uniform1f(u.uStreamX, 0.5 + Math.sin(time * 1.7) * 0.06);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const { pourStart: a, pourEnd: b } = params;
      const level = ease(clamp01((t - a - 0.04) / Math.max(b - a, 0.05)));
      // scintille dove il getto colpisce la colata
      const pouring = t > a && t < b && !state.done ? 1 : 0;
      const n = env.clock(params.sparks * pouring, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 0.12, 1 - level);
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 0.1 + Math.random() * 0.3;
        env.embers.spawn(cx, cy, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.3 + Math.random() * 0.5, size: 1 + Math.random() * 2, heat: 0.8 + Math.random() * 0.2, extra: { spark: 1 } });
      }
      // vapore mentre si raffredda
      const cooling = t > b && t < 0.92 && !state.done ? 1 : 0;
      const s = env.clock2(params.steam * cooling, state.dt);
      for (let i = 0; i < s; i += 1) {
        const [cx, cy] = toCanvasUv(rect, Math.random(), Math.random());
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.02, vy: -0.03 - Math.random() * 0.04, life: 0.8 + Math.random() * 0.8, size: 4 + Math.random() * 5, heat: 0.02, rise: 0.02, alpha: 0.35 });
      }
      env.embers.step(state.dt, (e, dt) => {
        if (e.spark) e.vy += 0.9 * dt;
        else e.vy -= e.rise * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['mold', 'Comparsa stampo', 0.02, 0.3, 0.01],
    ['pourStart', 'Inizio colata', 0, 0.4, 0.01],
    ['pourEnd', 'Fine colata', 0.2, 0.8, 0.01],
    ['sparks', 'Scintille / s', 0, 400, 1],
    ['steam', 'Vapore / s', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    forgia: { label: 'Forgia', params: {} },
    altoforno: { label: 'Altoforno', params: { durationMs: 3600, pourEnd: 0.55, sparks: 260, steam: 90 } },
  },
};
