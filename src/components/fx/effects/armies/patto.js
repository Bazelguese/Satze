// Patto degli Indocili · «Strappo»: la carta si lacera dall'alto in pochi pezzi dai bordi
// frastagliati e sfilacciati, che vengono tirati ognuno dalla sua parte. «Mai uniti.»

import { cellPointToCanvas, createPiecesRenderer, jaggedCells, voronoiCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform vec3 uColor;
uniform float uFiber;
uniform float uGlow;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying float vFlip;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float pre = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  // lo strappo corre dall'alto (vDist 0) verso il basso
  float reach = pre * 1.25;
  float reveal = smoothstep(vDist, vDist + 0.05, reach);
  // fibre: spessore irregolare lungo il bordo strappato
  float fw = uFiber * (0.5 + hash(floor(vSrc * vec2(140.0, 200.0))) * 1.1);
  float fiber = (1.0 - smoothstep(fw * 0.6, fw, vEdge)) * reveal;
  float halo = (1.0 - smoothstep(0.0, uFiber * 4.0, vEdge)) * reveal * (1.0 - smoothstep(0.1, 0.6, vAge));
  vec3 paper = vec3(0.96, 0.94, 0.9);
  vec3 col = mix(tex.rgb, paper * tex.a, fiber);
  col += uColor * halo * uGlow * tex.a * 0.6;
  col *= 0.7 + 0.3 * abs(vFlip);
  float fade = 1.0 - smoothstep(0.55, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

export const pattoEffect = {
  id: 'patto-strappo',
  army: 'Patto degli Indocili',
  label: 'Strappo',
  kind: 'out',
  description: 'La carta si strappa in pochi pezzi sfilacciati tirati in direzioni diverse.',
  defaults: {
    durationMs: 1900,
    color: '#e867c3',
    pieces: 3,
    jag: 0.022,
    fiber: 0.011,
    glow: 0.8,
    crackTime: 0.42,
    stagger: 0.08,
    force: 0.3,
    gravity: 0.35,
    spin: 0.18,
    tumble: 0.1,
    scraps: 40,
    seed: 3,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.55, right: m * 0.55, top: m * 0.3, bottom: m * 0.5 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uFiber', 'uGlow'],
    meshKey: (p, aspect) => [Math.round(p.pieces), p.jag, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: jaggedCells(voronoiCells(Math.round(p.pieces), aspect, [0.5, 0.5], 0, p.seed), aspect, p.jag, 22, p.seed),
      // la distanza per lo strappo parte dal bordo alto
      opts: { origin: [0.5, 0], seed: p.seed, glowBorder: false, delay: (cx, cy, maxD, r) => r[0] },
    }),
    motion: (p) => {
      const crackTime = Math.max(0.05, Math.min(0.9, p.crackTime));
      return {
        crackTime,
        stagger: Math.max(0, Math.min(0.95 - crackTime, p.stagger)),
        force: p.force,
        gravity: p.gravity,
        spin: p.spin,
        tumble: p.tumble,
        // tirati in fuori dal centro della carta
        origin: [0.5, 0.5],
        radial: 1.2,
        swell: 0.006,
      };
    },
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uFiber, params.fiber);
      gl.uniform1f(u.uGlow, params.glow);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const ct = env.motion.crackTime;
      // brandelli di carta quando i pezzi si separano
      if (env.lastProgress < ct && state.progress >= ct && !state.done) {
        const pts = [];
        env.mesh.cells.forEach((poly) => poly.forEach(([x, y]) => {
          if (x > 1e-4 && x < aspect - 1e-4 && y > 1e-4 && y < 1 - 1e-4) pts.push([x, y]);
        }));
        for (let i = 0; i < Math.round(params.scraps) && pts.length; i += 1) {
          const [x, y] = pts[Math.floor(Math.random() * pts.length)];
          const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
          env.flakes.spawn(cx, cy, {
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.05 - Math.random() * 0.1,
            life: 0.7 + Math.random() * 0.7,
            size: 3 + Math.random() * 5,
            color: Math.random() < 0.7 ? [0.95, 0.93, 0.88] : env.color,
            shape: 4,
            spin: (Math.random() - 0.5) * 10,
            gravity: 0.5,
            drag: 1.2,
          });
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['pieces', 'Pezzi', 2, 6, 1],
    ['jag', 'Frastagliatura', 0, 0.06, 0.001],
    ['fiber', 'Fibre', 0.002, 0.03, 0.0005],
    ['glow', 'Bagliore', 0, 2, 0.01],
    ['crackTime', 'Tempo strappo', 0.1, 0.8, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.4, 0.01],
    ['force', 'Spinta', 0, 1.2, 0.01],
    ['gravity', 'Gravità', -0.5, 2, 0.01],
    ['spin', 'Rotazione', 0, 1, 0.01],
    ['tumble', 'Ribaltamento', 0, 1.5, 0.01],
    ['scraps', 'Brandelli', 0, 150, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    strappo: { label: 'Strappo', params: {} },
    rifiuto: { label: 'Rifiuto violento', params: { durationMs: 1100, pieces: 4, crackTime: 0.25, force: 0.7, spin: 0.4, scraps: 90 } },
  },
};
