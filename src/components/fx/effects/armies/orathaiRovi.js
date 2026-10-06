// Orathai · «Rovi» (sconfitta inflitta): rami di rovo spinosi, con spine e foglie ben
// visibili, crescono dai bordi e si avvolgono attorno alla carta battuta; la carta avvizzisce
// sotto la stretta, i rami serrano, e la carta si sbriciola in foglie portate dal vento.
// Gli Orathai sono creature lignee: «Le sue radici cercano i caduti prima ancora che tocchino terra.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, samplePoint } from './common.js';
import { hexToRgb01 } from '../../glUtils.js';
import { mulberry } from '../../pieces.js';

const STEMS = 7;

const FRAG = `${QUAD_HEADER}
uniform vec4 uStemA[${STEMS}];   // partenza (x,y) e direzione (x,y), coordinate quadrate
uniform vec4 uStemB[${STEMS}];   // ampiezza, frequenza, fase, ritardo
uniform float uGrow;
uniform float uStemR;
uniform float uSqueeze;
uniform float uWither;
uniform float uThreshold;
uniform float uThorns;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2(p.x * uAspect, p.y);
  vec4 tex = cardAt(p);

  // rami: per ognuno, coordinata lungo il ramo (u) e distanza laterale dalla sua curva
  float stem = 0.0;
  float thorn = 0.0;
  float leaf = 0.0;
  float core = 0.0;
  float edgeDark = 0.0;
  for (int i = 0; i < ${STEMS}; i++) {
    vec4 A = uStemA[i];
    vec4 B = uStemB[i];
    vec2 D = A.zw;
    vec2 N = vec2(-D.y, D.x);
    vec2 rel = P - A.xy;
    float u = dot(rel, D);
    float len = max(uGrow - B.w, 0.0) * 1.6;
    if (u < 0.0 || u > len + 0.05) continue;
    float slope = B.x * B.y * cos(B.y * u + B.z);
    float dv = (dot(rel, N) - B.x * sin(B.y * u + B.z)) / sqrt(1.0 + slope * slope);
    float tip = clamp((len - u) / 0.12, 0.0, 1.0);
    float R = uStemR * mix(0.35, 1.0, tip) * (1.0 + uSqueeze * 0.3);
    float ad = abs(dv);
    float sOn = (1.0 - smoothstep(R - 0.003, R + 0.003, ad)) * step(u, len);
    stem = max(stem, sOn);
    core = max(core, sOn * (1.0 - smoothstep(0.0, R * 0.7, abs(dv + R * 0.3))));
    edgeDark = max(edgeDark, sOn * smoothstep(R * 0.55, R, ad));
    // spine: triangoli alternati sui due lati, piegati all'indietro
    float sp = 0.055;
    float k = floor(u / sp);
    float side = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
    float outD = dv * side - R * 0.85;
    float h = R * 1.6 * uThorns;
    float uu = u - (k + 0.5) * sp + outD * 0.7;
    float tw = R * 0.75 * (1.0 - outD / max(h, 1e-4));
    float th = step(0.0, outD) * step(outD, h) * step(abs(uu), tw) * step(u, len - 0.02);
    thorn = max(thorn, th);
    // foglie: ogni tanto, ovali appuntiti attaccati al ramo
    float lk = floor(u / 0.17);
    float lside = mod(lk, 2.0) < 0.5 ? -1.0 : 1.0;
    vec2 lc = vec2((lk + 0.5) * 0.17, lside * (R + 0.03));
    vec2 lp = vec2(u, dv) - lc;
    lp = rot2(lp, lside * 0.6);
    float lf = 1.0 - smoothstep(0.9, 1.0, length(lp / vec2(0.045, 0.02)));
    leaf = max(leaf, lf * step(lc.x, len - 0.04) * step(0.5, hash(vec2(lk, float(i)))));
  }

  // la carta avvizzisce sotto la stretta
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 withered = mix(vec3(0.12, 0.09, 0.05), vec3(0.45, 0.36, 0.22), l) * tex.a;
  vec3 col = mix(tex.rgb, withered, uWither * 0.8);
  // ombra dei rami sulla carta
  col *= 1.0 - 0.35 * max(stem, thorn) * uWither;

  // la carta si sbriciola in foglie (dall'alto), i rami restano un attimo e svaniscono
  float s = sweepN(clamp(p, 0.0, 1.0));
  float alive = smoothstep(0.0, 0.02, s - uThreshold);
  float vinesFade = 1.0 - smoothstep(0.2, 1.0, uThreshold);
  col *= alive;
  float a = tex.a * alive;

  vec3 bark = mix(vec3(0.16, 0.12, 0.06), vec3(0.28, 0.33, 0.13), core);
  bark *= 1.0 - edgeDark * 0.55;
  vec3 thornCol = vec3(0.62, 0.56, 0.4);
  vec3 leafCol = mix(vec3(0.16, 0.36, 0.1), uColor * 0.6, 0.3);
  float vA = max(max(stem, thorn), leaf) * vinesFade;
  vec3 vCol = leaf > 0.0 && stem < 0.5 && thorn < 0.5 ? leafCol : (thorn > 0.5 && stem < 0.5 ? thornCol : bark);
  col = col * (1.0 - vA) + vCol * vA;
  a = max(a, vA);
  gl_FragColor = outColor(col, a);
}
`;

/** Rami: partono dai bordi (anche un po' fuori) e attraversano la carta, riproducibili dal seme. */
function stemsOf(params, aspect) {
  const rand = mulberry(Math.round(params.seed) + 5);
  const starts = [
    [-0.05, 0.85, 0.5], [aspect + 0.05, 0.75, 2.6], [aspect * 0.2, 1.05, -1.2], [aspect * 0.8, 1.05, -1.9],
    [-0.05, 0.3, 0.2], [aspect + 0.05, 0.2, 2.9], [aspect * 0.5, 1.05, -1.57],
  ];
  const a = new Float32Array(STEMS * 4);
  const b = new Float32Array(STEMS * 4);
  for (let i = 0; i < STEMS; i += 1) {
    const [x, y, ang0] = starts[i];
    const ang = ang0 + (rand() - 0.5) * 0.5;
    a.set([x, y, Math.cos(ang), Math.sin(ang)], i * 4);
    b.set([0.04 + rand() * 0.05, 6 + rand() * 6, rand() * 6.28, i * 0.05 + rand() * 0.06], i * 4);
  }
  return { a, b };
}

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function crumbleThreshold(t, params) {
  const g = params.growTime;
  const k = clamp01((t - g - 0.08) / Math.max(1 - g - 0.08, 1e-3));
  return -0.05 + 1.1 * ease(k);
}

export const orathaiRoviEffect = {
  id: 'orathai-rovi',
  army: 'Orathai',
  role: 'defeat',
  label: 'Rovi',
  kind: 'out',
  description: 'Rami di rovo spinosi crescono dai bordi, stringono la carta che avvizzisce e si sbriciola in foglie.',
  defaults: {
    durationMs: 2800,
    color: '#5ad4bc',
    stemWidth: 0.026,
    thorns: 1,
    growTime: 0.5,
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
    uniforms: ['uStemA', 'uStemB', 'uGrow', 'uStemR', 'uSqueeze', 'uWither', 'uThreshold', 'uThorns'],
    sweep: sweepOf,
    needsPixels: true,
    bind: (gl, u, { params, progress: t, aspect }) => {
      const { a, b } = stemsOf(params, aspect);
      gl.uniform4fv(u.uStemA, a);
      gl.uniform4fv(u.uStemB, b);
      const g = params.growTime;
      gl.uniform1f(u.uGrow, ease(clamp01(t / g)) * 0.95);
      gl.uniform1f(u.uStemR, params.stemWidth);
      // stretta finale: i rami si ingrossano un poco e serrano
      gl.uniform1f(u.uSqueeze, ease(clamp01((t - g) / 0.12)));
      gl.uniform1f(u.uWither, params.shadow * ease(clamp01((t - 0.1) / Math.max(g, 0.1))));
      gl.uniform1f(u.uThreshold, crumbleThreshold(t, params));
      gl.uniform1f(u.uThorns, params.thorns);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const t = state.progress;
      const g = params.growTime + 0.08;
      const T = crumbleThreshold(t, params);
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
    ['stemWidth', 'Spessore rami', 0.01, 0.06, 0.001],
    ['thorns', 'Spine', 0, 2, 0.01],
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
    agguato: { label: 'Agguato', params: { durationMs: 1700, growTime: 0.35, stemWidth: 0.032, thorns: 1.4, shadow: 0.9, leaves: 260, wind: 0.3 } },
  },
};
