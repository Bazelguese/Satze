// Patto degli Indocili · «Ricucitura» (ingresso): brandelli strappati arrivano da direzioni
// diverse e si accostano; un filo nel colore del Patto li ricuce a punti incrociati, poi
// strappi e cuciture si richiudono e resta la carta intera. Da soli erano prede: insieme,
// una minaccia.

import { PIECE_ENTRY_VERT, cellPointToCanvas, createPiecesRenderer, jaggedCells, voronoiCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform vec3 uColor;
uniform float uFiber;
uniform float uStitchW;
uniform float uStitchK;
uniform float uSew;
uniform float uHeal;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying float vFlip;
varying float vSince;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  // bordo strappato: fibre di carta irregolari, che si richiudono alla fine
  float fw = uFiber * (0.5 + hash(floor(vSrc * vec2(140.0, 200.0))) * 1.1) * uHeal;
  float fiber = 1.0 - smoothstep(fw * 0.6, fw, vEdge);
  vec3 paper = vec3(0.86, 0.82, 0.74);
  vec3 col = mix(tex.rgb, paper * tex.a, fiber);
  // punti incrociati: due famiglie di tratti diagonali che attraversano la cucitura
  float k = uStitchK;
  float d1 = abs(fract((vSrc.x * 0.7 + vSrc.y) * k) - 0.5);
  float d2 = abs(fract((vSrc.x * 0.7 - vSrc.y) * k) - 0.5);
  float near = 1.0 - smoothstep(uStitchW * 0.7, uStitchW, vEdge);
  float thread = (1.0 - smoothstep(0.1, 0.16, min(d1, d2))) * near;
  // il filo avanza lungo le cuciture (dal centro) dopo che i brandelli si sono accostati
  float sewn = smoothstep(vDist - 0.04, vDist, uSew) * step(0.0, vSince);
  float stitch = thread * sewn * uHeal;
  // filo spesso, con un'ombra sotto per staccarlo dalla carta
  vec3 threadCol = uColor * (0.75 + 0.25 * (1.0 - min(d1, d2) * 6.0));
  float shadow = (1.0 - smoothstep(0.12, 0.22, min(d1, d2))) * near * sewn * uHeal;
  col *= 1.0 - shadow * 0.45;
  col = mix(col, threadCol * tex.a, stitch);
  col *= 0.7 + 0.3 * abs(vFlip);
  float fade = 1.0 - smoothstep(0.8, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

const ease = (k) => k * k * (3 - 2 * k);

function timing(p) {
  const crackTime = Math.max(0, Math.min(0.3, p.start));
  const stagger = Math.max(0, Math.min(0.5, p.stagger));
  const travel = Math.max(0.05, Math.min(0.5, p.travel));
  return { crackTime, stagger, travel, arrived: crackTime + stagger + travel };
}

export const pattoRicucituraEffect = {
  id: 'patto-ricucitura',
  army: 'Patto degli Indocili',
  role: 'entry',
  label: 'Ricucitura',
  kind: 'in',
  description: 'Brandelli strappati arrivano da direzioni diverse e un filo li ricuce in una carta intera.',
  defaults: {
    durationMs: 2600,
    color: '#e867c3',
    pieces: 6,
    jag: 0.022,
    fiber: 0.006,
    start: 0.02,
    stagger: 0.18,
    travel: 0.28,
    force: 0.7,
    spin: 0.12,
    tumble: 0.35,
    stitchWidth: 0.02,
    stitchDensity: 24,
    threads: 50,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.7, right: m * 0.7, top: m * 0.55, bottom: m * 0.55 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    vert: PIECE_ENTRY_VERT,
    frag: FRAG,
    uniforms: ['uFiber', 'uStitchW', 'uStitchK', 'uSew', 'uHeal'],
    meshKey: (p, aspect) => [Math.round(p.pieces), p.jag, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: jaggedCells(voronoiCells(Math.round(p.pieces), aspect, [0.5, 0.5], 0, p.seed + 3), aspect, p.jag, 22, p.seed),
      opts: { origin: [0.5, 0.5], seed: p.seed, glowBorder: false, delay: (cx, cy, maxD, r) => r[0] },
    }),
    motion: (p) => {
      const { crackTime, stagger, travel } = timing(p);
      return {
        crackTime,
        stagger,
        travel,
        ease: 0,
        force: p.force,
        gravity: 0.15,
        spin: p.spin,
        tumble: p.tumble,
        radial: 1,
        bias: [0, 0],
        swell: 0,
        origin: [0.5, 0.5],
      };
    },
    bind: (gl, u, { params, progress: t }) => {
      const { arrived } = timing(params);
      gl.uniform1f(u.uFiber, params.fiber);
      gl.uniform1f(u.uStitchW, params.stitchWidth);
      gl.uniform1f(u.uStitchK, params.stitchDensity);
      // il filo corre dal centro verso i bordi
      gl.uniform1f(u.uSew, ease(Math.max(0, Math.min(1, (t - arrived + 0.05) / 0.3))) * 1.1);
      // strappi e cuciture si richiudono nell'ultimo tratto
      gl.uniform1f(u.uHeal, 1 - ease(Math.max(0, Math.min(1, (t - 0.8) / 0.18))));
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const { arrived } = timing(params);
      // scintille di filo lungo le cuciture mentre vengono ricucite
      const on = t > arrived - 0.05 && t < arrived + 0.3 && !state.done ? 1 : 0;
      env.memo.debt = (env.memo.debt ?? 0) + params.threads * on * state.dt;
      const cells = env.mesh.cells;
      while (env.memo.debt >= 1) {
        env.memo.debt -= 1;
        const poly = cells[Math.floor(Math.random() * cells.length)];
        const k = Math.floor(Math.random() * poly.length);
        const [x, y] = poly[k];
        if (x < 1e-3 || y < 1e-3 || x > aspect - 1e-3 || y > 1 - 1e-3) continue;
        const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.05, vy: -(0.01 + Math.random() * 0.04), life: 0.3 + Math.random() * 0.4, size: 1 + Math.random() * 1.8, heat: 0.6 + Math.random() * 0.4, rise: 0 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['pieces', 'Brandelli', 2, 12, 1],
    ['jag', 'Frastagliatura', 0, 0.05, 0.001],
    ['fiber', 'Fibre', 0.002, 0.03, 0.0005],
    ['start', 'Primo brandello', 0, 0.3, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.5, 0.01],
    ['travel', 'Durata volo', 0.05, 0.5, 0.01],
    ['force', 'Distanza di partenza', 0.1, 1.5, 0.01],
    ['spin', 'Rotazione', 0, 1, 0.01],
    ['tumble', 'Ribaltamento', 0, 1.5, 0.01],
    ['stitchWidth', 'Larghezza cucitura', 0.005, 0.05, 0.001],
    ['stitchDensity', 'Fitto dei punti', 10, 80, 1],
    ['threads', 'Scintille filo / s', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    ricucitura: { label: 'Ricucitura', params: {} },
    coalizione: { label: 'Coalizione', params: { pieces: 9, stagger: 0.3, travel: 0.22, force: 1, tumble: 0.6, stitchDensity: 46 } },
  },
};
