// Figli dell'Orizzonte · «La Domanda»: l'immagine si deforma come vista attraverso la
// Nebula, i colori vorticano verso la sua tavolozza, poi la carta si scioglie in stelle.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uWarp;
uniform float uSwirl;
uniform float uChroma;
uniform float uNebula;
uniform float uEdgeGlow;
uniform float uEdgeW;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  float w = uWarp * smoothstep(0.0, 0.6, t);
  vec2 q = p * 3.0;
  vec2 flow = vec2(fbm(q + vec2(uTime * uSwirl * 0.3, 0.0)) - 0.5, fbm(q + vec2(5.2, 1.3) - vec2(0.0, uTime * uSwirl * 0.3)) - 0.5);
  // vortice attorno al centro, più forte vicino al centro
  vec2 c = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  c = rot2(c, w * 7.0 * (1.0 - clamp(length(c) * 1.4, 0.0, 1.0)));
  vec2 pw = vec2(c.x / uAspect, c.y) + 0.5 + flow * w * 2.0;
  float ch = uChroma * smoothstep(0.05, 0.7, t);
  vec4 tr = cardAt(pw + vec2(ch, 0.0));
  vec4 tg = cardAt(pw);
  vec4 tb = cardAt(pw - vec2(ch, 0.0));
  float a0 = max(tg.a, max(tr.a, tb.a));
  vec3 rgb = vec3(tr.r, tg.g, tb.b);

  // tavolozza della Nebula: scuri viola, medi nel colore dell'armata, chiari magenta/ciano
  float l = dot(rgb, vec3(0.3, 0.59, 0.11)) / max(a0, 1e-3);
  vec3 hi = mix(vec3(1.0, 0.45, 0.9), vec3(0.6, 0.95, 1.0), fbm(pw * 4.0 + uTime * 0.2));
  vec3 neb = mix(mix(vec3(0.05, 0.02, 0.15), uColor, smoothstep(0.0, 0.5, l)), hi, smoothstep(0.55, 1.0, l));
  vec3 col = mix(rgb, neb * a0, uNebula * smoothstep(0.0, 0.5, t));

  // dissolvenza in stelle, con un bordo luminoso
  float s = sweepN(p);
  float T = mix(-uEdgeW, 1.02, smoothstep(0.25, 1.0, t));
  float dist = s - T;
  float alive = smoothstep(0.0, 0.02, dist);
  float edge = exp(-max(dist, 0.0) / max(uEdgeW, 1e-3)) * alive * step(-uEdgeW + 1e-4, T);
  vec3 star = mix(uColor, vec3(1.0), 0.45);
  col = col * alive + star * edge * uEdgeGlow * a0;
  float a = max(a0 * alive, min(1.0, edge * uEdgeGlow * a0 * 0.8));
  gl_FragColor = outColor(col, a);
}
`;

export const figliEffect = {
  id: 'figli-domanda',
  army: "Figli dell'Orizzonte",
  label: 'La Domanda',
  kind: 'out',
  description: "La carta si deforma attraverso la Nebula e si scioglie in stelle.",
  defaults: {
    durationMs: 2600,
    color: '#a288fb',
    warp: 0.12,
    swirl: 1.2,
    chroma: 0.012,
    nebula: 0.85,
    edgeGlow: 1.3,
    edgeWidth: 0.08,
    stars: 80,
    direction: 'scatter',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.85,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => ({ left: w * 0.3, right: w * 0.3, top: h * 0.3, bottom: h * 0.2 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uWarp', 'uSwirl', 'uChroma', 'uNebula', 'uEdgeGlow', 'uEdgeW'],
    sweep: sweepOf,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uWarp, params.warp);
      gl.uniform1f(u.uSwirl, params.swirl);
      gl.uniform1f(u.uChroma, params.chroma);
      gl.uniform1f(u.uNebula, params.nebula);
      gl.uniform1f(u.uEdgeGlow, params.edgeGlow);
      gl.uniform1f(u.uEdgeW, params.edgeWidth);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const T = -params.edgeWidth + (1.02 + params.edgeWidth) * Math.max(0, Math.min(1, (t - 0.25) / 0.75));
      const n = env.clock(params.stars * state.active * (t > 0.25 ? 1 : 0), state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => {
          const d = sweepAt(env, aspect, x, y) - T;
          return d >= 0 && d <= params.edgeWidth;
        });
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        // le stelle si allontanano piano dal centro, come portate via dalla Nebula
        const ox = pt[0] - 0.5;
        const oy = pt[1] - 0.5;
        env.embers.spawn(cx, cy, {
          vx: ox * 0.08 + (Math.random() - 0.5) * 0.02,
          vy: oy * 0.08 - 0.01,
          life: 1.4 + Math.random() * 1.2,
          size: 1 + Math.random() * 2.2,
          heat: 0.4 + Math.random() * 0.6,
          rise: 0,
        });
      }
      env.embers.step(state.dt, (e, dt) => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.heat = 0.5 + 0.5 * Math.sin(e.age * 9 + e.sway); // scintillio
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['warp', 'Deformazione', 0, 0.4, 0.005],
    ['swirl', 'Vortice', 0, 4, 0.05],
    ['chroma', 'Aberrazione', 0, 0.05, 0.001],
    ['nebula', 'Tavolozza Nebula', 0, 1, 0.01],
    ['edgeGlow', 'Bordo luminoso', 0, 3, 0.01],
    ['edgeWidth', 'Spessore bordo', 0.01, 0.3, 0.005],
    ['stars', 'Stelle / s', 0, 300, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    domanda: { label: 'La Domanda', params: {} },
    follia: { label: 'Follia', params: { durationMs: 1800, warp: 0.3, swirl: 3, chroma: 0.03, nebula: 1, edgeGlow: 2, edgeWidth: 0.12, stars: 160 } },
  },
};
