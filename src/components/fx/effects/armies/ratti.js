// Ratti della Megera · «Corrosione»: un acido verde tossico divora la carta dall'alto,
// con colature che corrono avanti al fronte, bolle che ribollono sul bordo e fumi lenti
// che salgono. «Corrompere. Consumare. Aspettare.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';
import { noiseJs } from '../../fxNoise.js';

const FRAG = `${QUAD_HEADER}
uniform float uBand;
uniform float uDrip;
uniform float uDripCols;
uniform float uBubbles;
uniform float uResidue;
uniform float uThreshold;

float corroField(vec2 p) {
  // colature: colonne irregolari in cui l'acido corre avanti
  float dr = pow(noise(vec2(p.x * uDripCols, 3.1 + uSeed)), 3.0) * uDrip * smoothstep(0.05, 0.5, uProgress);
  return sweepN(p) - dr;
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec2 P = vec2(p.x * uAspect, p.y);
  float dist = corroField(p) - uThreshold;
  float W = uBand;
  float alive = smoothstep(-0.004, 0.004, dist);
  vec3 neon = mix(uColor, vec3(0.75, 1.0, 0.35), 0.45);

  // fascia acida che ribolle
  float acid = alive * (1.0 - smoothstep(W * 0.8, W, dist));
  float bub = smoothstep(0.62, 0.7, noise(P * 34.0 + vec2(0.0, uTime * 1.5))) * uBubbles;
  float pop = smoothstep(0.8, 0.86, noise(P * 60.0 - vec2(uTime * 2.0, 0.0))) * uBubbles;
  // bordo corroso e bruciato subito dietro
  float scorch = alive * (1.0 - smoothstep(W, W * 1.8, dist)) * (1.0 - acid);

  vec3 col = tex.rgb;
  col = mix(col, vec3(0.16, 0.12, 0.04) * tex.a, scorch * 0.75);
  vec3 acidCol = mix(neon * 0.7, neon, bub) + vec3(1.0) * pop * 0.6;
  col = mix(col, acidCol * tex.a, acid);
  col *= alive;
  float a = tex.a * alive;

  // dove è già corrosa resta una patina verdastra che svanisce
  float residue = (1.0 - alive) * uResidue * tex.a * (1.0 - smoothstep(0.0, W * 4.0, -dist));
  col += vec3(0.12, 0.2, 0.05) * residue;
  a = max(a, residue);
  gl_FragColor = outColor(col, a);
}
`;

function corroThreshold(t, params) {
  // le colature tolgono dal campo, non aggiungono: a 1 basta superare il massimo (1)
  const start = -params.band - 0.02;
  const end = 1.02;
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

export const rattiEffect = {
  id: 'ratti-corrosione',
  army: 'Ratti della Megera',
  role: 'defeat',
  label: 'Corrosione',
  kind: 'out',
  description: 'Acido tossico divora la carta con colature, bolle e fumi.',
  defaults: {
    durationMs: 2600,
    color: '#40ad60',
    band: 0.07,
    drip: 0.3,
    dripCols: 9,
    bubbles: 1,
    residue: 0.3,
    fumes: 55,
    bubblePops: 50,
    direction: 'top',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 4,
    sweepAmount: 0.35,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => 0.4 * t + 0.6 * t * t * (3 - 2 * t),
  padding: (w, h) => ({ left: w * 0.25, right: w * 0.25, top: h * 0.55, bottom: h * 0.1 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uBand', 'uDrip', 'uDripCols', 'uBubbles', 'uResidue', 'uThreshold'],
    sweep: sweepOf,
    bind: (gl, u, { params, progress }) => {
      gl.uniform1f(u.uBand, params.band);
      gl.uniform1f(u.uDrip, params.drip);
      gl.uniform1f(u.uDripCols, params.dripCols);
      gl.uniform1f(u.uBubbles, params.bubbles);
      gl.uniform1f(u.uResidue, params.residue);
      gl.uniform1f(u.uThreshold, corroThreshold(progress, params));
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const T = corroThreshold(state.progress, params);
      const dripK = Math.max(0, Math.min(1, (state.progress - 0.05) / 0.45));
      const dripS = dripK * dripK * (3 - 2 * dripK);
      const onFront = (x, y) => {
        const dr = Math.pow(noiseJs(x * params.dripCols, 3.1 + params.seed), 3) * params.drip * dripS;
        const d = sweepAt(env, aspect, x, y) - dr - T;
        return d >= 0 && d <= params.band;
      };
      // fumi: grandi sbuffi lenti e tenui
      const nf = env.clock(params.fumes * state.active, state.dt);
      for (let i = 0; i < nf; i += 1) {
        const pt = samplePoint(onFront);
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        env.embers.spawn(cx, cy, {
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(0.02 + Math.random() * 0.04),
          life: 1.4 + Math.random() * 1.2,
          size: 8 + Math.random() * 12,
          heat: 0,
          rise: 0.01,
          alpha: 0.22,
          extra: { fume: true },
        });
      }
      // schizzi delle bolle che scoppiano
      const nb = env.clock2(params.bubblePops * state.active, state.dt);
      for (let i = 0; i < nb; i += 1) {
        const pt = samplePoint(onFront);
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2;
        env.embers.spawn(cx, cy, { vx: Math.cos(ang) * 0.06, vy: Math.sin(ang) * 0.06, life: 0.3 + Math.random() * 0.3, size: 1 + Math.random() * 1.6, heat: 0.7 });
      }
      env.embers.step(state.dt, (e, dt) => {
        if (e.fume) {
          e.vy -= e.rise * dt;
          e.x += (e.vx + Math.sin(e.sway + e.age * 2) * 0.01) * dt;
          e.y += e.vy * dt;
          e.size += 4 * dt; // lo sbuffo si allarga salendo
        } else {
          e.vy += 0.3 * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        }
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['band', 'Fascia acida', 0.02, 0.25, 0.005],
    ['drip', 'Colature', 0, 0.8, 0.01],
    ['dripCols', 'Colonne colature', 2, 24, 0.5],
    ['bubbles', 'Bolle', 0, 2, 0.01],
    ['residue', 'Patina', 0, 1, 0.01],
    ['fumes', 'Fumi / s', 0, 200, 1],
    ['bubblePops', 'Schizzi / s', 0, 200, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    corrosione: { label: 'Corrosione', params: {} },
    veleno: { label: 'Veleno lento', params: { durationMs: 4000, band: 0.1, drip: 0.5, dripCols: 14, residue: 0.5, fumes: 90 } },
  },
};
