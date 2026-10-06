// Specchio infranto: la carta diventa uno specchio cromato che riflette
// sé stessa (ciò che vedi, lo diventi), un riflesso le corre sopra, poi si incrina e va in
// schegge che lampeggiano quando, ruotando, colgono la luce.

import { cellPointToCanvas, createPiecesRenderer, voronoiCells } from '../pieces.js';

const FRAG = `
precision highp float;
float sq(float x) { return x * x; } // pow(x, 2.0) è indefinito per x < 0
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform vec3 uColor;
uniform float uMirror;
uniform float uChrome;
uniform float uSheen;
uniform float uCrackWidth;
uniform float uGlint;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying vec3 vRand;
varying float vAngle;
varying float vFlip;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float pre = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  // l'immagine diventa il proprio riflesso
  float m = smoothstep(0.1, 0.85, pre) * uMirror;
  vec4 mir = texture2D(uTex, vec2(1.0 - vSrc.x, vSrc.y));
  vec3 rgb = mix(tex.rgb, mir.rgb * tex.a / max(mir.a, 1e-3), m);
  // cromatura: desatura, contrasta e tinge di rosso
  float l = dot(rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 chrome = mix(vec3(0.08, 0.06, 0.07), mix(vec3(0.85, 0.86, 0.9), uColor, 0.35), smoothstep(0.1, 0.9, l));
  rgb = mix(rgb, chrome * tex.a, uChrome * smoothstep(0.0, 0.7, pre));
  // riflesso che attraversa la carta in diagonale
  float band = vSrc.x + vSrc.y * 0.6 - (pre * 2.4 - 0.4);
  float sheen = exp(-sq(band / 0.07)) * uSheen * (1.0 - smoothstep(0.85, 1.0, pre));
  // crepe sottili dal punto d'impatto
  float reach = smoothstep(0.55, 1.0, pre) * 1.15;
  float reveal = smoothstep(vDist, vDist + 0.06, reach);
  float line = (1.0 - smoothstep(uCrackWidth * 0.3, uCrackWidth, vEdge)) * reveal;
  // le schegge in volo lampeggiano quando la faccia è rivolta alla luce
  float glint = pow(abs(sin(vAngle * 1.7 + vRand.x * 6.283)), 10.0) * step(0.001, vAge) * uGlint * abs(vFlip);
  vec3 hot = mix(uColor, vec3(1.0), 0.6);
  vec3 col = rgb + vec3(1.0) * sheen * tex.a + hot * line * 1.4 * tex.a + vec3(1.0, 0.92, 0.92) * glint * tex.a;
  float fade = 1.0 - smoothstep(0.4, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

export const mirrorEffect = {
  id: 'specchio',
  label: 'Specchio infranto',
  kind: 'out',
  description: 'La carta diventa uno specchio cromato di sé stessa, poi va in schegge.',
  usesOrigin: true,
  defaults: {
    durationMs: 2400,
    color: '#f8504f',
    shards: 22,
    focus: 0.5,
    crackTime: 0.5,
    stagger: 0.18,
    force: 0.35,
    gravity: 1.1,
    spin: 0.55,
    tumble: 1.1,
    mirror: 1,
    chrome: 0.65,
    sheen: 1,
    crackWidth: 0.005,
    glint: 1.3,
    sparks: 60,
    originX: 0.5,
    originY: 0.45,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.6, right: m * 0.6, top: m * 0.45, bottom: m * 1.0 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uMirror', 'uChrome', 'uSheen', 'uCrackWidth', 'uGlint'],
    meshKey: (p, aspect) => [Math.round(p.shards), p.focus, p.originX, p.originY, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: voronoiCells(Math.round(p.shards), aspect, [p.originX, p.originY], p.focus, p.seed),
      opts: { origin: [p.originX, p.originY], seed: p.seed, glowBorder: false },
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
        origin: [p.originX, p.originY],
      };
    },
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uMirror, params.mirror);
      gl.uniform1f(u.uChrome, params.chrome);
      gl.uniform1f(u.uSheen, params.sheen);
      gl.uniform1f(u.uCrackWidth, params.crackWidth);
      gl.uniform1f(u.uGlint, params.glint);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const ct = env.motion.crackTime;
      if (env.lastProgress < ct && state.progress >= ct && !state.done) {
        const pts = [];
        env.mesh.cells.forEach((poly) => poly.forEach((pt) => pts.push(pt)));
        for (let i = 0; i < Math.round(params.sparks) && pts.length; i += 1) {
          const [x, y] = pts[Math.floor(Math.random() * pts.length)];
          const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
          const ang = Math.random() * Math.PI * 2;
          const sp = 0.04 + Math.random() * 0.2;
          env.embers.spawn(cx, cy, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.05, life: 0.4 + Math.random() * 0.6, size: 1 + Math.random() * 2.2, heat: 0.8 });
        }
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.45 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['mirror', 'Riflesso di sé', 0, 1, 0.01],
    ['chrome', 'Cromatura', 0, 1, 0.01],
    ['sheen', 'Riflesso di luce', 0, 2, 0.01],
    ['shards', 'Schegge', 6, 60, 1],
    ['focus', "Addensate all'impatto", 0, 1, 0.01],
    ['crackTime', 'Tempo specchio', 0.1, 0.8, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.5, 0.01],
    ['force', 'Spinta', 0, 1.5, 0.01],
    ['gravity', 'Gravità', -0.5, 3, 0.01],
    ['spin', 'Rotazione', 0, 2, 0.01],
    ['tumble', 'Ribaltamento', 0, 3, 0.01],
    ['crackWidth', 'Spessore crepe', 0.002, 0.03, 0.0005],
    ['glint', 'Lampi schegge', 0, 3, 0.01],
    ['sparks', 'Scintille', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    specchio: { label: 'Specchio infranto', params: {} },
    sangue: { label: 'Vetro di sangue', params: { chrome: 0.3, sheen: 0.6, crackTime: 0.3, force: 0.6, glint: 2, sparks: 140 } },
  },
};
