// Figli dell'Orizzonte · «Occhio» (ingresso): nel buio si apre una fessura di luce; è un occhio
// della Nebula, con l'iride nei suoi colori. Si spalanca, la pupilla si dilata e dentro la
// pupilla c'è la carta, che riempie lo sguardo; poi l'occhio si chiude dietro di lei.
// «La Domanda cerca ancora una risposta.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uOpen;
uniform float uPupil;
uniform float uEye;
uniform vec2 uLook;
uniform float uIrisR;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  float W = uAspect * 0.5 + 0.22;
  float x = P.x / W;
  // apertura a mandorla: due palpebre che si separano dalla fessura centrale
  float lid = uOpen * 0.6 * max(0.0, 1.0 - x * x);
  float inEye = (1.0 - smoothstep(lid - 0.006, lid + 0.006, abs(P.y))) * step(abs(x), 1.0);
  float lidEdge = exp(-abs(abs(P.y) - lid) / 0.006) * step(abs(x), 1.0) * step(0.001, uOpen);
  vec3 neb1 = uColor;
  vec3 neb2 = mix(vec3(1.0, 0.45, 0.9), vec3(0.6, 0.95, 1.0), 0.5);

  // iride: fibre radiali nei colori della Nebula, che si muove appena (lo sguardo cerca)
  vec2 E = P - uLook;
  float r = length(E);
  float ang = atan(E.y, E.x);
  float fib = fbm(vec2(ang * 6.0, r * 14.0 - uTime * 0.6));
  vec3 iris = mix(neb1 * 0.5, mix(neb1, neb2, fib), smoothstep(uPupil, uIrisR, r) * 0.8 + 0.2);
  iris += neb2 * pow(fib, 3.0) * 0.6;
  float irisA = 1.0 - smoothstep(uIrisR - 0.01, uIrisR + 0.01, r);
  float ring = exp(-abs(r - uIrisR) / 0.01) * irisA;
  // sclera: buio viola con venature luminose
  float vein = 1.0 - smoothstep(0.0, 0.025, abs(fbm(P * 7.0 + 3.0) - 0.5));
  vec3 sclera = vec3(0.05, 0.02, 0.1) + neb1 * vein * 0.35;
  vec3 eyeCol = mix(sclera, iris, irisA) * (1.0 - ring * 0.6);

  // nella pupilla: la carta
  vec4 tex = cardAt(p);
  float inPupil = 1.0 - smoothstep(uPupil - 0.012, uPupil + 0.012, r);
  float pupilRim = exp(-abs(r - uPupil) / 0.012) * (1.0 - smoothstep(0.55, 0.75, uPupil));
  vec3 col = eyeCol * inEye * uEye * (1.0 - inPupil);
  float a = inEye * uEye * (1.0 - inPupil);
  col += tex.rgb * inPupil;
  a = max(a, tex.a * inPupil);
  // bordo delle palpebre e filo di luce sulla pupilla
  vec3 glow = mix(neb1, vec3(1.0), 0.4);
  col += glow * (lidEdge * 0.9 + pupilRim * 0.8 * inEye) * uEye;
  a = max(a, min(1.0, lidEdge * 0.9 * uEye));
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const figliOcchioEffect = {
  id: 'figli-occhio',
  army: "Figli dell'Orizzonte",
  role: 'entry',
  label: 'Occhio',
  kind: 'in',
  description: "Si apre un occhio della Nebula; la pupilla si dilata e dentro c'è la carta, che riempie lo sguardo.",
  defaults: {
    durationMs: 2800,
    color: '#a288fb',
    openStart: 0.08,
    openTime: 0.25,
    dilate: 0.48,
    irisSize: 0.36,
    motes: 50,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.25, bottom: m * 0.25 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uOpen', 'uPupil', 'uEye', 'uLook', 'uIrisR'],
    bind: (gl, u, { params, progress: t, aspect, time }) => {
      const open = ease(clamp01((t - params.openStart) / Math.max(params.openTime, 0.05)));
      gl.uniform1f(u.uOpen, open + 0.02 * Math.sin(time * 3) * open * (1 - open));
      // la pupilla si dilata fino a coprire tutta la carta (angoli compresi)
      const k = clamp01((t - params.dilate) / Math.max(0.9 - params.dilate, 0.05));
      const full = Math.hypot(aspect * 0.5, 0.5) + 0.06;
      gl.uniform1f(u.uPupil, 0.05 + (full - 0.05) * k * k * (3 - 2 * k) + (k === 0 ? 0.01 * Math.sin(time * 4) : 0));
      gl.uniform1f(u.uIrisR, Math.max(params.irisSize, 0.05 + (full - 0.05) * k * 1.15));
      gl.uniform1f(u.uEye, 1 - ease(clamp01((t - 0.8) / 0.18)));
      // prima di dilatarsi lo sguardo vaga un poco, poi punta dritto
      const wander = 1 - k;
      gl.uniform2f(u.uLook, Math.sin(time * 1.3) * 0.04 * wander, Math.cos(time * 0.9) * 0.02 * wander);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const on = t > params.openStart && t < 0.8 && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const [cx, cy] = toCanvasUv(rect, 0.5 + Math.cos(a) * 0.75, 0.5 + Math.sin(a) * 0.4);
        env.embers.spawn(cx, cy, { vx: -Math.cos(a) * 0.04, vy: -Math.sin(a) * 0.03, life: 1 + Math.random(), size: 1 + Math.random() * 2, heat: 0.5 + Math.random() * 0.5, rise: 0 });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.heat = 0.55 + 0.45 * Math.sin(e.age * 11 + e.sway);
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['openStart', 'Fessura', 0, 0.4, 0.01],
    ['openTime', 'Apertura', 0.05, 0.5, 0.01],
    ['dilate', 'Dilatazione pupilla', 0.2, 0.75, 0.01],
    ['irisSize', 'Misura iride', 0.15, 0.6, 0.01],
    ['motes', 'Stelle / s', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    occhio: { label: 'Occhio', params: {} },
    sguardo: { label: 'Sguardo lungo', params: { durationMs: 3600, openTime: 0.3, dilate: 0.6 } },
  },
};
