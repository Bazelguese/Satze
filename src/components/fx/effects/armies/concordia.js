// Concordia di Caelion · «Consacrazione»: raggi di sole dall'alto e due rintocchi di
// campana che si propagano come onde di luce; la carta si sovraespone d'oro e si scioglie
// verso l'alto in pulviscolo luminoso. (Cael, l'erede del Sole · la Campana · il Vallo)

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint, widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uRays;
uniform float uRings;
uniform float uExposure;
uniform float uEdgeW;

float ringAt(float r, float t, float t0) {
  float since = t - t0;
  float R = max(since, 0.0) * 2.2;
  return step(0.0, since) * exp(-sq((r - R) / 0.025)) * (1.0 - smoothstep(0.0, 0.35, since));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  vec4 tex = cardAt(p);
  vec3 gold = mix(uColor, vec3(1.0, 0.93, 0.72), 0.5);

  // raggi di sole da un punto sopra la carta
  vec2 sun = vec2(0.0, -1.1);
  vec2 d = P - sun;
  float ang = atan(d.x, d.y);
  float rays = pow(noise(vec2(ang * 14.0, uTime * 0.25)), 3.0) * 1.6 + 0.15;
  float fall = smoothstep(2.0, 0.6, length(d)) * smoothstep(-0.9, -0.3, P.y);
  float rayOn = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.8, 1.0, t)) * uRays;
  float rayA = rays * fall * rayOn * 0.22;

  // due rintocchi di campana
  float r = length(P);
  float rings = (ringAt(r, t, 0.1) + ringAt(r, t, 0.4) * 0.8) * uRings;

  // sovraesposizione d'oro, poi la carta si scioglie verso l'alto in luce
  float exposure = smoothstep(0.15, 0.6, t) * uExposure;
  vec3 col = mix(tex.rgb, gold * tex.a, exposure * 0.75) + gold * exposure * 0.25 * tex.a;
  float s = sweepN(clamp(p, 0.0, 1.0));
  float T = mix(-uEdgeW, 1.02, smoothstep(0.45, 1.0, t));
  float dist = s - T;
  float alive = smoothstep(0.0, 0.015, dist);
  float edge = exp(-max(dist, 0.0) / max(uEdgeW, 1e-3)) * alive * step(-uEdgeW + 1e-4, T);
  col = col * alive + vec3(1.0, 0.97, 0.88) * edge * tex.a;
  float a = max(tex.a * alive, min(1.0, edge * tex.a));

  col += gold * (rayA + rings) * (1.0 - a);
  a = max(a, min(1.0, rayA + rings));
  gl_FragColor = outColor(col, a);
}
`;

export const concordiaEffect = {
  id: 'concordia-consacrazione',
  army: 'Concordia di Caelion',
  label: 'Consacrazione',
  kind: 'out',
  description: 'Raggi di sole e rintocchi di campana: la carta si scioglie in luce d\'oro.',
  defaults: {
    durationMs: 2800,
    color: '#c7ad71',
    rays: 1,
    rings: 1,
    exposure: 0.85,
    edgeWidth: 0.1,
    motes: 110,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.3,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const p = widePadding(w, h);
    return { ...p, top: Math.max(w, h) * 0.95 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRays', 'uRings', 'uExposure', 'uEdgeW'],
    sweep: sweepOf,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uRays, params.rays);
      gl.uniform1f(u.uRings, params.rings);
      gl.uniform1f(u.uExposure, params.exposure);
      gl.uniform1f(u.uEdgeW, params.edgeWidth);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const k = Math.max(0, Math.min(1, (t - 0.45) / 0.55));
      const T = -params.edgeWidth + (1.02 + params.edgeWidth) * (k * k * (3 - 2 * k));
      const n = env.clock(params.motes * state.active * (t > 0.45 ? 1 : 0), state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => {
          const d = sweepAt(env, aspect, x, y) - T;
          return d >= 0 && d <= params.edgeWidth;
        });
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        env.embers.spawn(cx, cy, {
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(0.04 + Math.random() * 0.08),
          life: 1.2 + Math.random() * 1.2,
          size: 1.2 + Math.random() * 2.4,
          heat: 0.6 + Math.random() * 0.4,
          rise: 0.02,
        });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['rays', 'Raggi di sole', 0, 2, 0.01],
    ['rings', 'Rintocchi', 0, 2, 0.01],
    ['exposure', 'Sovraesposizione', 0, 1, 0.01],
    ['edgeWidth', 'Bordo di luce', 0.02, 0.3, 0.005],
    ['motes', 'Pulviscolo / s', 0, 300, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    consacrazione: { label: 'Consacrazione', params: {} },
    vespro: { label: 'Vespro solenne', params: { durationMs: 4000, rays: 1.6, rings: 1.4, exposure: 1, edgeWidth: 0.16, motes: 180 } },
  },
};
