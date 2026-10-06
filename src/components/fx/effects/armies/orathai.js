// Orathai · «Eclissi»: un disco lunare scuro scivola sulla carta e la divora, lasciando una
// corona d'argento sul bordo; al momento della totalità un lampo ad «anello di diamante»,
// poi resta solo il buio. «Aspetta. Poi finisci.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { smoothstepJs } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform vec2 uDisc;
uniform float uRadius;
uniform float uSoft;
uniform float uRimW;
uniform float uRim;
uniform float uShadow;
uniform float uDiamond;
uniform vec2 uDiamondDir;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  // coordinate quadrate (unità = altezza della carta)
  vec2 P = vec2(p.x * uAspect, p.y);
  float d = length(P - uDisc);
  float cover = 1.0 - smoothstep(uRadius - uSoft, uRadius, d);
  float t = uProgress;
  // la parte coperta sprofonda nel buio, poi sparisce
  vec3 night = vec3(0.015, 0.025, 0.06);
  float shadowA = cover * tex.a * uShadow * (1.0 - smoothstep(0.75, 1.0, t));
  vec3 col = tex.rgb * (1.0 - cover);
  float a = tex.a * (1.0 - cover);
  col += night * shadowA;
  a = max(a, shadowA);
  // corona argentea sul bordo del disco, solo dove c'è carta
  vec3 silver = mix(vec3(0.92, 0.95, 1.0), uColor, 0.45);
  float rim = exp(-sq((d - uRadius) / max(uRimW, 1e-4))) * uRim * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.85, 1.0, t));
  float rimA = rim * max(tex.a, 0.0);
  col += silver * rimA;
  a = max(a, min(1.0, rimA));
  // anello di diamante: un punto abbagliante sul bordo alla totalità
  vec2 dp = uDisc + uDiamondDir * uRadius;
  float flash = uDiamond * exp(-sq((t - 0.62) / 0.045)) * exp(-length(P - dp) / 0.035);
  col += vec3(1.0) * flash;
  a = max(a, min(1.0, flash));
  gl_FragColor = outColor(col, a);
}
`;

/** Centro e raggio del disco (coordinate quadrate) per un avanzamento. */
function discAt(params, aspect, t) {
  const ang = (params.startAngle * Math.PI) / 180;
  const cx = aspect / 2;
  const cy = 0.5;
  const startDist = params.radius + Math.hypot(aspect, 1) * 0.55;
  const k = smoothstepJs(0, 0.62, t);
  const ease = 1 - Math.pow(1 - k, 2);
  const dist = startDist * (1 - ease);
  const grow = smoothstepJs(0.6, 0.95, t);
  const radius = params.radius + (Math.hypot(aspect, 1) * 0.62 - params.radius) * grow;
  return { x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, radius, ang };
}

export const orathaiEffect = {
  id: 'orathai-eclissi',
  army: 'Orathai',
  label: 'Eclissi',
  kind: 'out',
  description: 'Un disco lunare scuro divora la carta lasciando una corona d\'argento.',
  defaults: {
    durationMs: 2600,
    color: '#5ad4bc',
    startAngle: 200,
    radius: 0.36,
    softness: 0.012,
    rimWidth: 0.018,
    rim: 1.3,
    shadow: 0.85,
    diamond: 1.2,
    motes: 50,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => ({ left: w * 0.2, right: w * 0.2, top: h * 0.25, bottom: h * 0.15 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uDisc', 'uRadius', 'uSoft', 'uRimW', 'uRim', 'uShadow', 'uDiamond', 'uDiamondDir'],
    bind: (gl, u, state) => {
      const { params, aspect, progress } = state;
      const disc = discAt(params, aspect, progress);
      gl.uniform2f(u.uDisc, disc.x, disc.y);
      gl.uniform1f(u.uRadius, disc.radius);
      gl.uniform1f(u.uSoft, params.softness);
      gl.uniform1f(u.uRimW, params.rimWidth);
      gl.uniform1f(u.uRim, params.rim);
      gl.uniform1f(u.uShadow, params.shadow);
      gl.uniform1f(u.uDiamond, params.diamond);
      // il lampo sul lato opposto a quello da cui arriva la luna
      gl.uniform2f(u.uDiamondDir, -Math.cos(disc.ang + 0.6), -Math.sin(disc.ang + 0.6));
    },
    particles: (state, env) => {
      const { params, rect, aspect, progress } = state;
      const disc = discAt(params, aspect, progress);
      const n = env.clock(params.motes * state.active, state.dt);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const x = (disc.x + Math.cos(a) * disc.radius) / aspect;
        const y = disc.y + Math.sin(a) * disc.radius;
        if (x < 0 || x > 1 || y < 0 || y > 1) continue;
        const [cx, cy] = toCanvasUv(rect, x, y);
        env.embers.spawn(cx, cy, {
          vx: Math.cos(a) * 0.02,
          vy: Math.sin(a) * 0.02 - 0.01,
          life: 0.8 + Math.random() * 0.8,
          size: 0.8 + Math.random() * 1.8,
          heat: 0.8,
          rise: 0,
        });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['startAngle', 'Da dove arriva (°)', 0, 360, 1],
    ['radius', 'Raggio luna', 0.15, 0.7, 0.01],
    ['softness', 'Morbidezza bordo', 0.001, 0.06, 0.001],
    ['rimWidth', 'Spessore corona', 0.004, 0.08, 0.001],
    ['rim', 'Luce corona', 0, 3, 0.01],
    ['shadow', 'Buio', 0, 1, 0.01],
    ['diamond', 'Anello di diamante', 0, 3, 0.01],
    ['motes', 'Pulviscolo / s', 0, 200, 1],
  ],
  colorParams: [],
  presets: {
    eclissi: { label: 'Eclissi', params: {} },
    totale: { label: 'Totalità lenta', params: { durationMs: 3800, radius: 0.5, rim: 1.8, rimWidth: 0.03, diamond: 2, motes: 90 } },
  },
};
