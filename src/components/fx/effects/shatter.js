// Frattura di luce: crepe luminose nel colore dell'armata partono dal punto d'impatto e
// corrono sulla carta; un lampo, poi la carta si spezza in schegge che volano via
// ruotando e cadono. Le schegge sono celle di Voronoi calcolate una volta in JS
// (più fitte vicino all'impatto); ogni vertice sa la distanza dal bordo della sua
// scheggia, così le crepe hanno spessore costante.

import { cellPointToCanvas, createPiecesRenderer, voronoiCells } from '../pieces.js';

export const SHATTER_DEFAULTS = {
  durationMs: 2000,
  /** Colore delle crepe (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Numero di schegge */
  shards: 26,
  /** Quanto le schegge si addensano attorno all'impatto (0 = uniformi) */
  focus: 0.55,
  /** Quota della durata in cui si allargano le crepe (0-1) */
  crackTime: 0.38,
  /** Ritardo fra la prima e l'ultima scheggia a staccarsi (quota della durata) */
  stagger: 0.18,
  /** Spinta verso l'esterno, in altezze della carta */
  force: 0.45,
  /** Gravità, in altezze della carta */
  gravity: 0.9,
  /** Rotazione massima delle schegge (giri) */
  spin: 0.6,
  /** Ribaltamento in profondità (giri) */
  tumble: 0.8,
  /** Spessore delle crepe (in altezze della carta) */
  crackWidth: 0.008,
  /** Intensità della luce nelle crepe */
  glow: 1.2,
  /** Lampo alla rottura */
  flash: 0.7,
  /** Scintille alla rottura */
  sparks: 90,
  /** Punto d'impatto (0-1 sull'elemento, y verso il basso) */
  originX: 0.5,
  originY: 0.42,
  seed: 0,
};

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform float uCrackWidth;
uniform float uGlow;
uniform float uFlash;
uniform vec3 uColor;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float crackT = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  // il fronte delle crepe avanza dall'impatto (vDist 0) ai bordi (vDist 1)
  float reach = crackT * crackT * (3.0 - 2.0 * crackT) * 1.15;
  float reveal = smoothstep(vDist, vDist + 0.06, reach);
  float line = 1.0 - smoothstep(uCrackWidth * 0.35, uCrackWidth, vEdge);
  float halo = 1.0 - smoothstep(0.0, uCrackWidth * 4.0, vEdge);
  float pulse = 0.85 + 0.15 * sin(uProgress * 60.0);
  float fadeOut = 1.0 - smoothstep(0.35, 1.0, vAge);
  float g = (line + halo * 0.35) * reveal * uGlow * pulse * (1.0 - smoothstep(0.2, 0.8, vAge) * 0.6);
  vec3 hot = mix(uColor, vec3(1.0), 0.55);
  vec3 col = tex.rgb + mix(uColor, hot, line * 0.45) * g * tex.a;
  // lampo alla rottura
  float flash = uFlash * exp(-abs(uProgress - uCrackTime) * 30.0);
  col += hot * flash * tex.a;
  float alpha = tex.a * fadeOut;
  col *= fadeOut;
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

function createShatterRenderer(canvas) {
  return createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uCrackWidth', 'uGlow', 'uFlash'],
    meshKey: (p, aspect) => [Math.round(p.shards), p.focus, p.originX, p.originY, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: voronoiCells(Math.round(p.shards), aspect, [p.originX, p.originY], p.focus, p.seed),
      opts: { origin: [p.originX, p.originY], seed: p.seed },
    }),
    motion: (p) => {
      const crackTime = Math.max(0.02, Math.min(0.9, p.crackTime));
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
    bind: (gl, u, state) => {
      gl.uniform1f(u.uCrackWidth, state.params.crackWidth);
      gl.uniform1f(u.uGlow, state.params.glow);
      gl.uniform1f(u.uFlash, state.params.flash);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const crackTime = env.motion.crackTime;
      // scintille alla rottura: partono dai vertici delle crepe e cadono
      if (env.lastProgress < crackTime && state.progress >= crackTime && !state.done) {
        const pts = [];
        env.mesh.cells.forEach((poly) => poly.forEach((pt) => pts.push(pt)));
        for (let i = 0; i < Math.round(params.sparks) && pts.length; i += 1) {
          const [x, y] = pts[Math.floor(Math.random() * pts.length)];
          const ang = Math.random() * Math.PI * 2;
          const sp = 0.05 + Math.random() * 0.25;
          const [cx, cy] = cellPointToCanvas(rect, aspect, x, y);
          env.embers.spawn(cx, cy, {
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 0.08,
            life: 0.4 + Math.random() * 0.7,
            size: 1.2 + Math.random() * 2.6,
            heat: 0.6 + Math.random() * 0.4,
          });
        }
      }
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.5 * dt; // le scintille di vetro cadono
        e.vx *= 1 - 0.8 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  });
}

export const shatterEffect = {
  id: 'shatter',
  label: 'Frattura di luce',
  kind: 'out',
  description: "Crepe di luce partono dal punto d'impatto, poi la carta va in schegge.",
  defaults: SHATTER_DEFAULTS,
  directions: null,
  /** Clic sulla carta: sposta il punto d'impatto */
  usesOrigin: true,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.6, right: m * 0.6, top: m * 0.45, bottom: m * 1.0 };
  },
  createRenderer: createShatterRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 5000, 50],
    ['shards', 'Schegge', 6, 60, 1],
    ['focus', 'Addensate all\'impatto', 0, 1, 0.01],
    ['crackTime', 'Tempo crepe', 0.05, 0.7, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.5, 0.01],
    ['force', 'Spinta', 0, 1.5, 0.01],
    ['gravity', 'Gravità', -0.5, 3, 0.01],
    ['spin', 'Rotazione', 0, 2, 0.01],
    ['tumble', 'Ribaltamento', 0, 3, 0.01],
    ['crackWidth', 'Spessore crepe', 0.002, 0.03, 0.0005],
    ['glow', 'Luce crepe', 0, 3, 0.01],
    ['flash', 'Lampo', 0, 2, 0.01],
    ['sparks', 'Scintille', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    vetro: { label: 'Vetro di luce', params: {} },
    colpo: {
      label: 'Colpo secco',
      params: { durationMs: 1200, shards: 34, focus: 0.75, crackTime: 0.18, stagger: 0.08, force: 0.9, gravity: 1.4, spin: 0.9, tumble: 1.2, crackWidth: 0.006, glow: 1.6, flash: 1.2, sparks: 180 },
    },
    crollo: {
      label: 'Crollo lento',
      params: { durationMs: 3200, shards: 16, focus: 0.2, crackTime: 0.5, stagger: 0.3, force: 0.12, gravity: 1.2, spin: 0.25, tumble: 0.3, crackWidth: 0.01, glow: 1, flash: 0.3, sparks: 40 },
    },
    cristallo: {
      label: 'Cristallo',
      params: { durationMs: 2200, shards: 50, focus: 0.4, crackTime: 0.42, stagger: 0.2, force: 0.35, gravity: 0.4, spin: 1.2, tumble: 2, crackWidth: 0.004, glow: 2.2, flash: 0.9, sparks: 220 },
    },
  },
};
