// Calibri Pesanti · «Corazza» (ingresso): piastre d'acciaio arrivano da fuori e si chiudono
// di schianto una dopo l'altra, dal basso verso l'alto, scuotendo la carta; le giunture
// restano incandescenti e poi si raffreddano, e l'acciaio torna la carta.
// «Acciaio. Inerzia. Sopravvivenza.»

import { PIECE_ENTRY_VERT, cellPointToCanvas, createPiecesRenderer, gridCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform vec3 uColor;
uniform float uMetal;
uniform float uSeamW;
uniform float uHeat;
uniform float uCool;
uniform float uEndFade;
varying vec2 vSrc;
varying float vEdge;
varying float vAge;
varying vec3 vRand;
varying float vSince;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  // calore dopo lo schianto: massimo all'impatto, poi si raffredda
  float hot = vSince < 0.0 ? 0.0 : exp(-vSince / max(uCool, 1e-3));
  hot *= uEndFade;
  // in volo e appena chiusa è acciaio; raffreddandosi torna la carta
  float steelAmt = uMetal * (vSince < 0.0 ? 1.0 : exp(-vSince / max(uCool * 1.6, 1e-3))) * uEndFade;
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 steel = vec3(l) * vec3(0.82, 0.86, 0.92) + 0.08;
  float band = fract(vSrc.x * 2.0 + vSrc.y * 0.5 + vRand.x);
  steel += 0.2 * smoothstep(0.35, 0.5, band) * (1.0 - smoothstep(0.5, 0.65, band));
  vec3 rgb = mix(tex.rgb, steel * tex.a, steelAmt);
  // giunture: rivetti d'ombra in volo, bianco-arancio all'impatto, rosso cupo raffreddandosi
  float seam = 1.0 - smoothstep(uSeamW * 0.4, uSeamW, vEdge);
  float glowSeam = 1.0 - smoothstep(0.0, uSeamW * 3.5, vEdge);
  vec3 hotCol = mix(vec3(0.7, 0.12, 0.02), mix(vec3(1.0, 0.6, 0.15), vec3(1.0, 0.96, 0.88), smoothstep(0.5, 1.0, hot)), smoothstep(0.1, 0.6, hot));
  vec3 col = rgb * (1.0 - seam * 0.45 * max(steelAmt, hot)) + mix(hotCol, uColor, 0.12) * (seam + glowSeam * 0.35) * hot * uHeat * tex.a;
  // la piastra compare appena entra in scena
  float fade = 1.0 - smoothstep(0.82, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

/** Pseudo-casuale fisso per cella (lo stesso in JS per conoscere gli istanti d'impatto). */
function cellHash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function timing(p) {
  const crackTime = Math.max(0, Math.min(0.4, p.start));
  const stagger = Math.max(0, Math.min(0.7, p.stagger));
  const travel = Math.max(0.04, Math.min(0.4, p.travel));
  return { crackTime, stagger, travel };
}

export const calibriCorazzaEffect = {
  id: 'calibri-corazza',
  army: 'Calibri Pesanti',
  role: 'entry',
  label: 'Corazza',
  kind: 'in',
  description: "Piastre d'acciaio si chiudono di schianto dal basso verso l'alto; le giunture roventi si raffreddano.",
  defaults: {
    durationMs: 2400,
    color: '#a9a294',
    cols: 4,
    rows: 6,
    start: 0.04,
    stagger: 0.4,
    travel: 0.14,
    force: 0.55,
    spin: 0.03,
    metal: 0.8,
    seamWidth: 0.01,
    heat: 1.4,
    cool: 0.14,
    shake: 0.008,
    sparks: 26,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.55, right: m * 0.55, top: m * 0.45, bottom: m * 0.45 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    vert: PIECE_ENTRY_VERT,
    frag: FRAG,
    uniforms: ['uMetal', 'uSeamW', 'uHeat', 'uCool', 'uEndFade'],
    meshKey: (p, aspect) => [Math.round(p.cols), Math.round(p.rows), p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: gridCells(Math.round(p.cols), Math.round(p.rows), aspect),
      opts: {
        origin: [0.5, 0.5],
        seed: p.seed,
        glowBorder: false,
        // dal basso verso l'alto, con un filo di disordine (riproducibile in JS)
        delay: (cx, cy) => Math.min(1, (1 - cy) * 0.82 + cellHash(cx + p.seed, cy) * 0.18),
      },
    }),
    motion: (p, state) => {
      const { crackTime, stagger, travel } = timing(p);
      // scossa: ogni fila che si chiude dà un colpo che si smorza in fretta
      const rows = Math.round(p.rows);
      let jy = 0;
      for (let r = 0; r < rows; r += 1) {
        const cy = (r + 0.5) / rows;
        const land = crackTime + (1 - cy) * 0.82 * stagger + 0.09 * stagger + travel;
        const dt = state.progress - land;
        if (dt > 0 && dt < 0.12) jy += Math.sin(dt * 160) * Math.exp(-dt / 0.025);
      }
      return {
        crackTime,
        stagger,
        travel,
        ease: 1,
        force: p.force,
        gravity: 0,
        spin: p.spin,
        tumble: 0,
        radial: 1,
        bias: [0, 0],
        swell: 0,
        origin: [0.5, 0.5],
        jolt: [0, jy * p.shake],
      };
    },
    bind: (gl, u, { params, progress }) => {
      gl.uniform1f(u.uMetal, params.metal);
      gl.uniform1f(u.uSeamW, params.seamWidth);
      gl.uniform1f(u.uHeat, params.heat);
      gl.uniform1f(u.uCool, params.cool);
      // tutto raffreddato alla fine: l'ultimo fotogramma è la carta com'è
      const k = Math.max(0, Math.min(1, (progress - 0.88) / 0.12));
      gl.uniform1f(u.uEndFade, 1 - k * k * (3 - 2 * k));
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const m = env.motion;
      const prev = env.lastProgress;
      const t = state.progress;
      if (t > prev && t - prev < 0.3 && !state.done) {
        // scintille dalle giunture di ogni piastra nel momento in cui sbatte
        for (const poly of env.mesh.cells) {
          let cx = 0;
          let cy = 0;
          poly.forEach(([x, y]) => { cx += x; cy += y; });
          cx /= poly.length;
          cy /= poly.length;
          const land = m.crackTime + Math.min(1, (1 - cy) * 0.82 + cellHash(cx + params.seed, cy) * 0.18) * m.stagger + m.travel;
          if (prev < land && t >= land) {
            for (let i = 0; i < params.sparks; i += 1) {
              const k = Math.floor(Math.random() * poly.length);
              const [ax, ay] = poly[k];
              const [bx, by] = poly[(k + 1) % poly.length];
              const f = Math.random();
              const px = ax + (bx - ax) * f;
              const py = ay + (by - ay) * f;
              if (px < 1e-3 || py < 1e-3 || px > aspect - 1e-3 || py > 1 - 1e-3) continue;
              const [sx, sy] = cellPointToCanvas(rect, aspect, px, py);
              const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
              const sp = 0.12 + Math.random() * 0.35;
              env.embers.spawn(sx, sy, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.25 + Math.random() * 0.45, size: 1 + Math.random() * 2, heat: 0.75 + Math.random() * 0.25 });
            }
          }
        }
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 1.1 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['cols', 'Colonne', 2, 8, 1],
    ['rows', 'Righe', 2, 10, 1],
    ['start', 'Prima piastra', 0, 0.4, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.7, 0.01],
    ['travel', 'Durata volo', 0.04, 0.4, 0.01],
    ['force', 'Distanza di partenza', 0.1, 1.2, 0.01],
    ['spin', 'Rotazione', 0, 0.5, 0.01],
    ['metal', 'Acciaio', 0, 1, 0.01],
    ['seamWidth', 'Spessore giunture', 0.002, 0.03, 0.0005],
    ['heat', 'Calore', 0, 3, 0.01],
    ['cool', 'Raffreddamento', 0.03, 0.4, 0.005],
    ['shake', 'Scossa', 0, 0.03, 0.0005],
    ['sparks', 'Scintille per piastra', 0, 80, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    corazza: { label: 'Corazza', params: {} },
    fortezza: { label: 'Fortezza', params: { cols: 3, rows: 4, stagger: 0.5, travel: 0.2, force: 0.8, shake: 0.016, sparks: 50 } },
  },
};
