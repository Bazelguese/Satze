// Orathai · «Rovi» (sconfitta inflitta): radici e rovi crescono dai bordi e inghiottono la
// carta nell'ombra della foresta, poi la carta si sbriciola in foglie portate dal vento.
// Gli Orathai sono creature lignee: «Le sue radici cercano i caduti prima ancora che tocchino terra.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';
import { hexToRgb01 } from '../../glUtils.js';

const FRAG = `${QUAD_HEADER}
uniform float uVineW;
uniform float uDensity;
uniform float uGrowTime;
uniform float uShadow;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  vec2 P = vec2(p.x * uAspect, p.y);
  // distanza dal bordo più vicino (unità = altezza carta)
  float edge = min(min(P.x, uAspect - P.x), min(P.y, 1.0 - P.y));
  float reach = smoothstep(0.0, uGrowTime, t) * 0.62;
  float wob = (fbm(P * 5.0 + uSeed) - 0.5) * 0.14;
  float grown = smoothstep(edge + wob - 0.015, edge + wob + 0.015, reach);

  // viticci: linee di livello del rumore, più rami sottili
  float n1 = fbm(P * uDensity + vec2(3.1, uSeed));
  float n2 = fbm(P * uDensity * 2.1 + vec2(uSeed, 7.7));
  float vine = 1.0 - smoothstep(uVineW * 0.5, uVineW, abs(n1 - 0.5));
  float twig = (1.0 - smoothstep(uVineW * 0.2, uVineW * 0.45, abs(n2 - 0.5))) * 0.8;
  // spine: piccoli picchi lungo i rami
  float thorn = step(0.88, noise(P * 90.0)) * smoothstep(uVineW * 2.0, uVineW * 0.6, abs(n1 - 0.5));
  float vines = clamp(max(vine, twig) + thorn, 0.0, 1.0) * grown;

  // la carta sprofonda nell'ombra sotto i rovi
  vec3 col = tex.rgb * (1.0 - grown * uShadow);
  vec3 bark = vec3(0.07, 0.12, 0.04);
  vec3 lime = mix(uColor, vec3(1.0), 0.15);
  float hl = smoothstep(0.35, 0.0, abs(n1 - 0.5) / max(uVineW, 1e-4));
  vec3 vineCol = mix(bark, lime, hl * 0.85);
  col = mix(col, vineCol * tex.a, vines);

  // poi si sbriciola in foglie
  float s = sweepN(p);
  float T = mix(-0.05, 1.03, smoothstep(uGrowTime * 0.9, 1.0, t));
  float alive = smoothstep(0.0, 0.02, s - T);
  gl_FragColor = outColor(col * alive, tex.a * alive);
}
`;

export const orathaiRoviEffect = {
  id: 'orathai-rovi',
  army: 'Orathai',
  role: 'defeat',
  label: 'Rovi',
  kind: 'out',
  description: 'Rovi crescono dai bordi e inghiottono la carta, che si sbriciola in foglie.',
  defaults: {
    durationMs: 2800,
    color: '#5ad4bc',
    vineWidth: 0.06,
    density: 7,
    growTime: 0.55,
    shadow: 0.7,
    leaves: 150,
    leafSize: 9,
    wind: 0.15,
    direction: 'top',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.6,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.5, right: m * 0.6, top: m * 0.3, bottom: m * 0.7 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uVineW', 'uDensity', 'uGrowTime', 'uShadow'],
    sweep: sweepOf,
    needsPixels: true,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uVineW, params.vineWidth);
      gl.uniform1f(u.uDensity, params.density);
      gl.uniform1f(u.uGrowTime, params.growTime);
      gl.uniform1f(u.uShadow, params.shadow);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const g = params.growTime * 0.9;
      const k = Math.max(0, Math.min(1, (t - g) / Math.max(1 - g, 1e-3)));
      const T = -0.05 + 1.08 * (k * k * (3 - 2 * k));
      const lime = hexToRgb01(params.color);
      const greens = [lime, [0.18, 0.32, 0.08], [0.32, 0.46, 0.12], [0.5, 0.42, 0.15]];
      const n = env.clock(params.leaves * state.active * (t > g ? 1 : 0), state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => {
          const d = sweepAt(env, aspect, x, y) - T;
          return d >= 0 && d <= 0.06 && (!env.pixels || env.pixels.at(x, y)[3] > 0.2);
        });
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        env.flakes.spawn(cx, cy, {
          vx: params.wind * (0.4 + Math.random()) + (Math.random() - 0.5) * 0.05,
          vy: -0.03 - Math.random() * 0.05,
          life: 1.2 + Math.random() * 1.2,
          size: params.leafSize * (0.6 + Math.random() * 0.7),
          color: greens[Math.floor(Math.random() * greens.length)],
          shape: 1,
          spin: (Math.random() - 0.5) * 4,
          gravity: 0.12,
          drag: 0.9,
          flutter: 5 + Math.random() * 5,
        });
      }
      env.flakes.step(state.dt, (f, dt) => {
        // svolazzo laterale delle foglie
        f.vy += f.gravity * dt;
        f.vx += Math.sin(f.age * 3 + f.phase) * 0.04 * dt;
        const kk = Math.exp(-f.drag * dt);
        f.vx *= kk;
        f.vy *= kk;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['vineWidth', 'Spessore rami', 0.01, 0.12, 0.001],
    ['density', 'Fittezza rovi', 2, 16, 0.1],
    ['growTime', 'Tempo crescita', 0.2, 0.8, 0.01],
    ['shadow', 'Ombra', 0, 1, 0.01],
    ['leaves', 'Foglie / s', 0, 400, 1],
    ['leafSize', 'Misura foglie (px)', 3, 20, 0.5],
    ['wind', 'Vento', -0.5, 0.5, 0.01],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    rovi: { label: 'Rovi', params: {} },
    agguato: { label: 'Agguato', params: { durationMs: 1700, growTime: 0.35, density: 10, shadow: 0.9, leaves: 260, wind: 0.3 } },
  },
};
