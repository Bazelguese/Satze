// Apex · «Artigliata»: tre artigli di luce gelida squarciano la carta in diagonale, con una
// testa luminosa che corre lungo ogni taglio; poi le strisce si separano e cadono tra
// schegge di brina. «Ridevi quando ci scegliesti.»

import { cellPointToCanvas, createPiecesRenderer, stripCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform vec3 uColor;
uniform float uCutW;
uniform float uGlow;
varying vec2 vSrc;
varying float vEdge;
varying float vAge;
varying float vFlip;
varying float vExtra;

float sq(float x) { return x * x; }

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  // l'artiglio corre lungo il taglio (vExtra 0 → 1) nei primi istanti
  float slash = clamp(uProgress / max(uCrackTime * 0.65, 1e-3), 0.0, 1.0);
  float head = slash * 1.15;
  float cut = 1.0 - smoothstep(uCutW * 0.35, uCutW, vEdge);
  float halo = 1.0 - smoothstep(0.0, uCutW * 5.0, vEdge);
  float drawn = step(vExtra, head);
  float headGlow = exp(-sq((vExtra - head) / 0.06)) * step(slash, 0.999);
  float cool = 1.0 - smoothstep(0.0, 0.7, vAge) * 0.7;
  vec3 ice = mix(uColor, vec3(1.0), 0.55);
  float g = (cut * 1.3 + halo * 0.35) * drawn * cool + headGlow * (cut + halo) * 2.5;
  vec3 col = tex.rgb + ice * g * uGlow * tex.a;
  col *= 0.65 + 0.35 * abs(vFlip);
  float fade = 1.0 - smoothstep(0.55, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

/** Direzione del taglio (coordinate quadrate) dall'angolo in gradi. */
function slashDir(angle) {
  const a = (angle * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

export const apexEffect = {
  id: 'apex-artigliata',
  army: 'Apex',
  label: 'Artigliata',
  kind: 'out',
  description: 'Tre artigli di luce gelida squarciano la carta, che cade a strisce.',
  defaults: {
    durationMs: 1700,
    color: '#d5ecf9',
    claws: 3,
    angle: -62,
    spacing: 0.11,
    crackTime: 0.36,
    stagger: 0.14,
    force: 0.28,
    gravity: 1.7,
    spin: 0.22,
    tumble: 0.2,
    cutWidth: 0.007,
    glow: 1.6,
    frost: 90,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.5, right: m * 0.5, top: m * 0.3, bottom: m * 1.1 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uCutW', 'uGlow'],
    meshKey: (p, aspect) => [Math.round(p.claws), p.angle, p.spacing, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => {
      const [dx, dy] = slashDir(p.angle);
      const n = Math.round(p.claws);
      const offsets = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * p.spacing);
      // posizione lungo il taglio, 0 → 1, per far correre la testa dell'artiglio
      const half = 0.5 * (Math.abs(dx) * aspect + Math.abs(dy));
      const along = (x, y) => Math.max(0, Math.min(1, (((x - aspect / 2) * dx + (y - 0.5) * dy) / Math.max(half, 1e-4) + 1) / 2));
      return {
        cells: stripCells(aspect, dx, dy, offsets),
        opts: { origin: [0.5, 0.5], seed: p.seed, glowBorder: false, extra: along, delay: (cx, cy, maxD, r) => r[0] },
      };
    },
    motion: (p) => {
      const crackTime = Math.max(0.05, Math.min(0.9, p.crackTime));
      return {
        crackTime,
        stagger: Math.max(0, Math.min(0.95 - crackTime, p.stagger)),
        force: p.force,
        gravity: p.gravity,
        spin: p.spin,
        tumble: p.tumble,
        origin: [0.5, 0.5],
        radial: 1,
        swell: 0.008,
      };
    },
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uCutW, params.cutWidth);
      gl.uniform1f(u.uGlow, params.glow);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const ct = env.motion.crackTime;
      const slash = Math.min(1, state.progress / Math.max(ct * 0.65, 1e-3));
      // brina staccata dalla testa di ogni artiglio
      env.memo.debt = (env.memo.debt ?? 0) + params.frost * (slash < 1 && state.progress > 0 && !state.done ? 1 : 0) * state.dt * 2;
      const [dx, dy] = slashDir(params.angle);
      const nx = -dy;
      const ny = dx;
      const half = 0.5 * (Math.abs(dx) * aspect + Math.abs(dy));
      const claws = Math.round(params.claws);
      while (env.memo.debt >= 1) {
        env.memo.debt -= 1;
        const i = Math.floor(Math.random() * claws);
        const off = (i - (claws - 1) / 2) * params.spacing;
        const a = (slash * 1.15 * 2 - 1) * half;
        const x = aspect / 2 + nx * off + dx * a;
        const y = 0.5 + ny * off + dy * a;
        if (x < 0 || x > aspect || y < 0 || y > 1) continue;
        const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
        env.embers.spawn(cx, cy, {
          vx: (Math.random() - 0.5) * 0.12 + dx * 0.05,
          vy: (Math.random() - 0.5) * 0.12 + dy * 0.05,
          life: 0.4 + Math.random() * 0.6,
          size: 1 + Math.random() * 2.2,
          heat: 0.6 + Math.random() * 0.4,
        });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.25 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['claws', 'Artigli', 1, 5, 1],
    ['angle', 'Inclinazione (°)', -90, 90, 1],
    ['spacing', 'Distanza artigli', 0.04, 0.25, 0.005],
    ['crackTime', 'Tempo artigliata', 0.1, 0.7, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.4, 0.01],
    ['force', 'Spinta', 0, 1.2, 0.01],
    ['gravity', 'Gravità', 0, 4, 0.01],
    ['spin', 'Rotazione', 0, 1.5, 0.01],
    ['tumble', 'Ribaltamento', 0, 2, 0.01],
    ['cutWidth', 'Spessore tagli', 0.002, 0.03, 0.0005],
    ['glow', 'Luce tagli', 0, 3, 0.01],
    ['frost', 'Brina / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    artigliata: { label: 'Artigliata', params: {} },
    caccia: { label: 'Caccia', params: { durationMs: 1100, claws: 4, angle: -50, spacing: 0.09, crackTime: 0.28, force: 0.5, gravity: 2.4, glow: 2.2, frost: 180 } },
  },
};
