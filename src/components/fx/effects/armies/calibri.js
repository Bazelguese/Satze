// Calibri Pesanti · «Pressa»: le giunture di una griglia di piastre diventano incandescenti,
// la carta si fa acciaio, poi le piastre si staccano e cadono pesanti, quasi senza ruotare,
// tra scintille arancioni. «Acciaio. Inerzia. Sopravvivenza.»

import { cellPointToCanvas, createPiecesRenderer, gridCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform vec3 uColor;
uniform float uMetal;
uniform float uSeamW;
uniform float uHeat;
varying vec2 vSrc;
varying float vEdge;
varying float vAge;
varying vec3 vRand;
varying float vFlip;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float pre = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  // acciaio: grigio freddo con un riflesso verticale per piastra
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 steel = vec3(l) * vec3(0.82, 0.86, 0.92) + 0.08;
  steel += 0.18 * smoothstep(0.35, 0.5, fract(vSrc.x * 2.0 + vRand.x)) * (1.0 - smoothstep(0.5, 0.65, fract(vSrc.x * 2.0 + vRand.x)));
  vec3 rgb = mix(tex.rgb, steel * tex.a, uMetal * smoothstep(0.1, 0.9, pre));
  // giunture incandescenti: dal rosso cupo al bianco, poi si raffreddano in volo
  float seam = 1.0 - smoothstep(uSeamW * 0.4, uSeamW, vEdge);
  float glowSeam = 1.0 - smoothstep(0.0, uSeamW * 3.0, vEdge);
  float heat = smoothstep(0.2, 1.0, pre) * (1.0 - smoothstep(0.0, 0.6, vAge)) * uHeat;
  vec3 hotCol = mix(vec3(0.8, 0.15, 0.02), mix(vec3(1.0, 0.62, 0.15), vec3(1.0, 0.95, 0.85), seam), seam);
  vec3 col = rgb * (1.0 - seam * 0.5) + mix(hotCol, uColor, 0.15) * (seam + glowSeam * 0.3) * heat * tex.a;
  // il ribaltamento scurisce la faccia che si gira
  col *= 0.6 + 0.4 * abs(vFlip);
  float fade = 1.0 - smoothstep(0.55, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

export const calibriEffect = {
  id: 'calibri-pressa',
  army: 'Calibri Pesanti',
  role: 'defeat',
  label: 'Pressa',
  kind: 'out',
  description: 'La carta si divide in piastre d\'acciaio dalle giunture roventi che cadono pesanti.',
  defaults: {
    durationMs: 2200,
    color: '#a9a294',
    cols: 4,
    rows: 6,
    crackTime: 0.38,
    stagger: 0.32,
    force: 0.1,
    gravity: 2.6,
    spin: 0.06,
    tumble: 0.12,
    metal: 0.75,
    seamWidth: 0.009,
    heat: 1.3,
    sparks: 140,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.3, bottom: m * 1.3 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uMetal', 'uSeamW', 'uHeat'],
    meshKey: (p, aspect) => [Math.round(p.cols), Math.round(p.rows), p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: gridCells(Math.round(p.cols), Math.round(p.rows), aspect),
      opts: {
        origin: [0.5, 1],
        seed: p.seed,
        glowBorder: false,
        // le file in basso cedono per prime, con un po' di disordine
        delay: (cx, cy, maxD, r) => Math.min(1, (1 - cy) * 0.7 + r[0] * 0.3),
      },
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
        radial: 0,
        bias: [0, -0.2],
        swell: 0,
        origin: [0.5, 1],
      };
    },
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uMetal, params.metal);
      gl.uniform1f(u.uSeamW, params.seamWidth);
      gl.uniform1f(u.uHeat, params.heat);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const m = env.motion;
      // scintille dalle giunture mentre le piastre cedono
      const window0 = m.crackTime * 0.7;
      const window1 = m.crackTime + m.stagger + 0.05;
      const on = state.progress > window0 && state.progress < window1 && !state.done ? 1 : 0;
      const rate = params.sparks * on * 1.5;
      env.memo.debt = (env.memo.debt ?? 0) + rate * state.dt;
      const cols = Math.round(params.cols);
      const rows = Math.round(params.rows);
      while (env.memo.debt >= 1) {
        env.memo.debt -= 1;
        // punto a caso su una giuntura interna
        const vertical = Math.random() < 0.5;
        const x = vertical ? (Math.ceil(Math.random() * (cols - 1)) / cols) * aspect : Math.random() * aspect;
        const y = vertical ? Math.random() : Math.ceil(Math.random() * (rows - 1)) / rows;
        const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = 0.1 + Math.random() * 0.3;
        env.embers.spawn(cx, cy, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.3 + Math.random() * 0.5, size: 1 + Math.random() * 2, heat: 0.7 + Math.random() * 0.3 });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.9 * dt; // scintille pesanti: cadono presto
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['cols', 'Colonne', 2, 8, 1],
    ['rows', 'Righe', 2, 10, 1],
    ['crackTime', 'Tempo arroventamento', 0.05, 0.7, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.6, 0.01],
    ['gravity', 'Gravità', 0, 5, 0.01],
    ['force', 'Spinta', 0, 1, 0.01],
    ['spin', 'Rotazione', 0, 1, 0.01],
    ['tumble', 'Ribaltamento', 0, 1.5, 0.01],
    ['metal', 'Acciaio', 0, 1, 0.01],
    ['seamWidth', 'Spessore giunture', 0.002, 0.03, 0.0005],
    ['heat', 'Calore', 0, 3, 0.01],
    ['sparks', 'Scintille / s', 0, 400, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    pressa: { label: 'Pressa', params: {} },
    crollo: { label: 'Crollo di piastre', params: { cols: 3, rows: 4, crackTime: 0.25, stagger: 0.5, gravity: 3.5, spin: 0.15, tumble: 0.3, sparks: 220 } },
  },
};
