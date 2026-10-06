// Kethran · «Mutilazione» (sconfitta inflitta): un colpo violento si abbatte sulla carta,
// che sobbalza e si ammacca; le crepe si accendono come le cicatrici luminose dei Kethran,
// poi i pezzi vengono strappati via con forza, i più vicini al colpo per primi.
// «Ci hanno spezzati. Non sapevano che i pezzi sanno combattere.»

import { cellPointToCanvas, createPiecesRenderer, jaggedCells, voronoiCells } from '../../pieces.js';

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform vec3 uColor;
uniform float uImpact;
uniform float uScarW;
uniform float uScar;
uniform float uFlash;
uniform float uBruise;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying float vFlip;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float since = uProgress - uImpact;
  float hit = step(0.0, since);
  // le cicatrici corrono dal punto del colpo in pochissimo tempo
  float reach = clamp(since / 0.08, 0.0, 1.0) * 1.2;
  float reveal = smoothstep(vDist, vDist + 0.05, reach) * hit;
  float scar = (1.0 - smoothstep(uScarW * 0.35, uScarW, vEdge)) * reveal;
  float halo = (1.0 - smoothstep(0.0, uScarW * 4.0, vEdge)) * reveal;
  float pulse = 0.8 + 0.2 * sin(uProgress * 70.0);
  vec3 hot = mix(uColor, vec3(1.0, 0.95, 0.85), 0.5);
  // livido attorno al colpo: la carta si scurisce e arrossa
  float bruise = (1.0 - smoothstep(0.0, 0.45, vDist)) * hit * uBruise;
  vec3 col = tex.rgb * (1.0 - bruise * 0.45) + vec3(0.35, 0.02, 0.0) * bruise * 0.4 * tex.a;
  col += hot * (scar * 1.5 + halo * 0.4) * uScar * pulse * tex.a * (1.0 - smoothstep(0.3, 0.9, vAge) * 0.6);
  // lampo dell'impatto
  float flash = uFlash * exp(-abs(since) * 26.0) * (1.0 - smoothstep(0.0, 0.6, vDist));
  col += vec3(1.0, 0.92, 0.8) * flash * tex.a;
  col *= 0.6 + 0.4 * abs(vFlip);
  float fade = 1.0 - smoothstep(0.5, 1.0, vAge);
  gl_FragColor = vec4(min(col * fade, vec3(tex.a * fade)), tex.a * fade);
}
`;

/** Scossa della carta dopo il colpo: spinta via dal punto d'impatto e oscillazione che si smorza. */
function joltAt(params, aspect, t) {
  const since = t - params.impactAt;
  if (since < 0) return [0, 0];
  const dx = (0.5 - params.originX) * aspect;
  const dy = 0.5 - params.originY;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.exp(-since * 14) * Math.cos(since * 70) * params.jolt;
  return [(dx / len) * k, (dy / len) * k];
}

export const kethranMutilazioneEffect = {
  id: 'kethran-mutilazione',
  army: 'Kethran',
  role: 'defeat',
  label: 'Mutilazione',
  kind: 'out',
  description: 'Un colpo violento: la carta si spacca in cicatrici luminose e viene fatta a pezzi.',
  usesOrigin: true,
  defaults: {
    durationMs: 1800,
    color: '#eebf3c',
    pieces: 7,
    focus: 0.6,
    jag: 0.016,
    impactAt: 0.12,
    crackTime: 0.34,
    stagger: 0.16,
    force: 0.95,
    gravity: 1.4,
    spin: 0.9,
    tumble: 0.6,
    jolt: 0.05,
    scarWidth: 0.008,
    scar: 1.5,
    flash: 1.2,
    bruise: 0.8,
    debris: 120,
    originX: 0.22,
    originY: 0.42,
    seed: 2,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.8, right: m * 0.8, top: m * 0.5, bottom: m * 1.0 };
  },
  createRenderer: (canvas) => createPiecesRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uImpact', 'uScarW', 'uScar', 'uFlash', 'uBruise'],
    meshKey: (p, aspect) => [Math.round(p.pieces), p.focus, p.jag, p.originX, p.originY, p.seed, aspect.toFixed(4)].join('|'),
    mesh: (p, aspect) => ({
      cells: jaggedCells(voronoiCells(Math.round(p.pieces), aspect, [p.originX, p.originY], p.focus, p.seed), aspect, p.jag, 16, p.seed),
      opts: { origin: [p.originX, p.originY], seed: p.seed, glowBorder: false },
    }),
    motion: (p, state) => {
      const crackTime = Math.max(p.impactAt + 0.05, Math.min(0.9, p.crackTime));
      return {
        crackTime,
        stagger: Math.max(0, Math.min(0.95 - crackTime, p.stagger)),
        force: p.force,
        gravity: p.gravity,
        spin: p.spin,
        tumble: p.tumble,
        origin: [p.originX, p.originY],
        radial: 1.3,
        swell: 0.012,
        jolt: joltAt(p, state.aspect, state.progress),
      };
    },
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uImpact, params.impactAt);
      gl.uniform1f(u.uScarW, params.scarWidth);
      gl.uniform1f(u.uScar, params.scar);
      gl.uniform1f(u.uFlash, params.flash);
      gl.uniform1f(u.uBruise, params.bruise);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      // all'impatto: scintille d'oro e schegge scure che schizzano via dal colpo
      if (env.lastProgress < params.impactAt && state.progress >= params.impactAt && !state.done) {
        const [ix, iy] = cellPointToCanvas(rect, aspect, params.originX * aspect, params.originY);
        const away = Math.atan2(0.5 - params.originY, (0.5 - params.originX) * aspect);
        for (let i = 0; i < Math.round(params.debris); i += 1) {
          const ang = away + Math.PI + (Math.random() - 0.5) * 2.6;
          const sp = 0.15 + Math.random() * 0.5;
          if (i % 3 === 0) {
            env.flakes.spawn(ix, iy, {
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - 0.1,
              life: 0.5 + Math.random() * 0.6,
              size: 3 + Math.random() * 5,
              color: [0.18, 0.12, 0.08],
              shape: 4,
              spin: (Math.random() - 0.5) * 16,
              gravity: 1.4,
              drag: 1,
              fadeIn: 0.001,
            });
          } else {
            env.embers.spawn(ix, iy, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.05, life: 0.3 + Math.random() * 0.5, size: 1 + Math.random() * 2.4, heat: 0.8 });
          }
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.7 * dt;
        e.vx *= 1 - 1.2 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 5000, 50],
    ['impactAt', 'Momento del colpo', 0.02, 0.5, 0.01],
    ['pieces', 'Pezzi', 3, 14, 1],
    ['focus', 'Addensati al colpo', 0, 1, 0.01],
    ['jag', 'Frastagliatura', 0, 0.05, 0.001],
    ['crackTime', 'Inizio strappo', 0.1, 0.8, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.5, 0.01],
    ['force', 'Violenza', 0, 2, 0.01],
    ['gravity', 'Gravità', 0, 4, 0.01],
    ['spin', 'Rotazione', 0, 2.5, 0.01],
    ['tumble', 'Ribaltamento', 0, 2, 0.01],
    ['jolt', 'Sobbalzo', 0, 0.15, 0.002],
    ['scarWidth', 'Spessore cicatrici', 0.002, 0.03, 0.0005],
    ['scar', 'Luce cicatrici', 0, 3, 0.01],
    ['flash', 'Lampo', 0, 2.5, 0.01],
    ['bruise', 'Livido', 0, 1, 0.01],
    ['debris', 'Detriti', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    mutilazione: { label: 'Mutilazione', params: {} },
    massacro: { label: 'Colpo di maglio', params: { durationMs: 1300, pieces: 10, impactAt: 0.08, crackTime: 0.22, force: 1.5, spin: 1.4, jolt: 0.09, flash: 2, debris: 220 } },
  },
};
