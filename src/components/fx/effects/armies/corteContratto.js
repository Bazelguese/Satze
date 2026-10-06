// Corte Rossa · «Contratto consumato» (sconfitta inflitta): l'agente battuto diventa un
// contratto. La carta ingiallisce in pergamena, clausole d'inchiostro rosso la riempiono,
// un sigillo di ceralacca la timbra; poi brucia dal sigillo come carta, e il contratto è
// riscosso. «Leggi prima di firmare. Poi firma comunque. Tutti lo fanno.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { sweepAt, samplePoint } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform vec2 uSeal;
uniform float uParchment;
uniform float uInk;
uniform float uBand;
uniform float uThreshold;
uniform float uSealSize;
uniform float uFlame;

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}

/** Lettera inventata: tre tratti fra i punti di una griglia 3×3. */
float glyph(vec2 uv, float id) {
  float d = 1e3;
  for (int k = 0; k < 3; k++) {
    float h1 = hash(vec2(id, float(k) * 7.13));
    float h2 = hash(vec2(id + 3.3, float(k) * 1.71));
    vec2 a = vec2(floor(h1 * 3.0), floor(fract(h1 * 7.0) * 3.0)) * 0.33 + 0.17;
    vec2 b = vec2(floor(h2 * 3.0), floor(fract(h2 * 5.0) * 3.0)) * 0.33 + 0.17;
    d = min(d, segDist(uv, a, b));
  }
  return 1.0 - smoothstep(0.06, 0.13, d);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  vec2 P = vec2(p.x * uAspect, p.y);
  vec2 S = vec2(uSeal.x * uAspect, uSeal.y);

  // 1) pergamena
  float l = dot(tex.rgb, vec3(0.3, 0.59, 0.11)) / max(tex.a, 1e-3);
  vec3 parch = mix(vec3(0.42, 0.3, 0.17), vec3(0.93, 0.85, 0.66), l) * (0.9 + 0.1 * fbm(P * 9.0));
  float pa = smoothstep(0.0, 0.25, t) * uParchment;
  vec3 col = mix(tex.rgb, parch * tex.a, pa);

  // 2) clausole in inchiostro rosso, scritte riga per riga
  float rowH = 0.055;
  float row = floor((p.y - 0.1) / rowH);
  float inRows = step(0.1, p.y) * step(p.y, 0.68);
  float write = clamp((t - 0.05 - row * 0.018) / 0.12, 0.0, 1.0);
  vec2 cellSize = vec2(rowH * 0.62 / uAspect, rowH);
  vec2 cell = floor(vec2(p.x, p.y - 0.1) / cellSize);
  vec2 cuv = fract(vec2(p.x, p.y - 0.1) / cellSize);
  cuv = (cuv - 0.5) * vec2(1.25, 1.6) + 0.5;
  float letter = glyph(cuv, cell.x * 13.7 + cell.y * 91.3) * step(abs(cuv.y - 0.5), 0.5) * step(abs(cuv.x - 0.5), 0.5);
  letter *= step(p.x, write) * step(0.08, p.x) * step(p.x, 0.92) * inRows * step(0.3, hash(cell + 2.7));
  vec3 ink = mix(uColor * 0.55, uColor, 0.6);
  col = mix(col, ink * tex.a, letter * uInk);

  // 3) sigillo di ceralacca: si imprime con un piccolo colpo
  float stamp = smoothstep(0.26, 0.3, t);
  float sr = uSealSize * mix(1.6, 1.0, smoothstep(0.26, 0.31, t));
  float sd = length(P - S);
  float wax = (1.0 - smoothstep(sr * 0.92, sr, sd + (fbm(P * 40.0) - 0.5) * 0.01)) * stamp;
  float ring = (1.0 - smoothstep(0.004, 0.009, abs(sd - sr * 0.72))) * wax;
  float sealGlyph = glyph((P - S) / (sr * 1.1) * 0.5 + 0.5, 77.0) * wax;
  vec3 waxCol = mix(uColor * 0.5, uColor, 0.4 + 0.6 * (1.0 - sd / max(sr, 1e-3)));
  col = mix(col, waxCol * tex.a, wax);
  col += mix(uColor, vec3(1.0, 0.8, 0.6), 0.5) * (ring * 0.5 + sealGlyph * 0.6) * tex.a;
  col += vec3(1.0, 0.85, 0.7) * exp(-sq((t - 0.3) / 0.025)) * (1.0 - smoothstep(0.0, sr * 3.0, sd)) * tex.a;

  // 4) brucia dal sigillo come carta
  float dist = sweepN(p) - uThreshold;
  float W = uBand;
  float alive = smoothstep(-0.004, 0.004, dist);
  float flame = alive * (1.0 - smoothstep(W * 0.45, W * 0.6, dist));
  float charB = alive * (1.0 - smoothstep(W * 0.6, W, dist)) * (1.0 - flame);
  float scorch = alive * (1.0 - smoothstep(W, W * 2.6, dist)) * (1.0 - flame) * (1.0 - charB);
  // le clausole vicine al fuoco si accendono prima di bruciare
  col += vec3(1.0, 0.45, 0.1) * letter * scorch * 1.6 * tex.a;
  col = mix(col, vec3(0.28, 0.16, 0.06) * tex.a, scorch * 0.6);
  col = mix(col, vec3(0.04, 0.02, 0.02) * tex.a, charB);
  float flick = 0.85 + 0.3 * noise(P * 30.0 + vec2(0.0, uTime * 8.0));
  vec3 fire = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.4), 1.0 - dist / max(W * 0.45, 1e-3)) * flick;
  col = mix(col, min(fire, vec3(1.0)) * tex.a, flame * uFlame);
  gl_FragColor = outColor(col * alive, tex.a * alive);
}
`;

function sweepOfContract(params) {
  return { direction: 'point', originX: params.sealX, originY: params.sealY, seed: params.seed, scale: params.burnNoise, amount: params.burnNoiseAmount };
}

/** Soglia del fuoco: parte dopo il sigillo e consuma tutto entro la fine. */
function contractThreshold(t, params) {
  const k = Math.max(0, Math.min(1, (t - params.burnStart) / Math.max(1 - params.burnStart, 1e-3)));
  const e = k * k * (3 - 2 * k);
  return -params.band - 0.02 + (1.04 + params.band) * e;
}

export const corteContrattoEffect = {
  id: 'corte-contratto',
  army: 'Corte Rossa',
  role: 'defeat',
  label: 'Contratto consumato',
  kind: 'out',
  description: "La carta diventa un contratto: clausole rosse, sigillo di ceralacca, poi brucia come carta.",
  usesOrigin: false,
  defaults: {
    durationMs: 3000,
    color: '#f8504f',
    parchment: 0.85,
    ink: 1,
    sealSize: 0.075,
    sealX: 0.5,
    sealY: 0.8,
    burnStart: 0.36,
    band: 0.09,
    flame: 1,
    burnNoise: 4,
    burnNoiseAmount: 0.35,
    ash: 90,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => ({ left: w * 0.3, right: w * 0.3, top: h * 0.6, bottom: h * 0.1 }),
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uSeal', 'uParchment', 'uInk', 'uBand', 'uThreshold', 'uSealSize', 'uFlame'],
    sweep: sweepOfContract,
    maxFlakes: 600,
    bind: (gl, u, { params, progress }) => {
      gl.uniform2f(u.uSeal, params.sealX, params.sealY);
      gl.uniform1f(u.uParchment, params.parchment);
      gl.uniform1f(u.uInk, params.ink);
      gl.uniform1f(u.uBand, params.band);
      gl.uniform1f(u.uThreshold, contractThreshold(progress, params));
      gl.uniform1f(u.uSealSize, params.sealSize);
      gl.uniform1f(u.uFlame, params.flame);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const T = contractThreshold(state.progress, params);
      const burning = state.progress > params.burnStart && !state.done ? 1 : 0;
      const n = env.clock(params.ash * state.active * burning, state.dt);
      for (let i = 0; i < n; i += 1) {
        const pt = samplePoint((x, y) => {
          const d = sweepAt(env, aspect, x, y) - T;
          return d >= 0 && d <= params.band;
        });
        if (!pt) continue;
        const [cx, cy] = toCanvasUv(rect, pt[0], pt[1]);
        if (Math.random() < 0.55) {
          // cenere di carta che si arriccia salendo
          const g = 0.08 + Math.random() * 0.12;
          env.flakes.spawn(cx, cy, {
            vx: (Math.random() - 0.5) * 0.05,
            vy: -(0.04 + Math.random() * 0.08),
            life: 1 + Math.random() * 1.2,
            size: 3 + Math.random() * 5,
            color: [g, g * 0.9, g * 0.8],
            shape: 4,
            spin: (Math.random() - 0.5) * 6,
            gravity: -0.05,
            drag: 0.8,
          });
        } else {
          env.embers.spawn(cx, cy, { heat: 0.4 + Math.random() * 0.5, size: 1 + Math.random() * 2 });
        }
      }
      env.flakes.step(state.dt, (f, dt) => {
        f.vy += f.gravity * dt;
        f.vx += Math.sin(f.age * 4 + f.phase) * 0.03 * dt;
        const k = Math.exp(-f.drag * dt);
        f.vx *= k;
        f.vy *= k;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      });
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['parchment', 'Pergamena', 0, 1, 0.01],
    ['ink', 'Inchiostro clausole', 0, 1, 0.01],
    ['sealSize', 'Misura sigillo', 0.03, 0.15, 0.001],
    ['sealX', 'Sigillo X', 0.1, 0.9, 0.01],
    ['sealY', 'Sigillo Y', 0.1, 0.95, 0.01],
    ['burnStart', 'Inizio fuoco', 0.2, 0.7, 0.01],
    ['band', 'Fascia fuoco', 0.03, 0.25, 0.005],
    ['flame', 'Fiamma', 0, 1.5, 0.01],
    ['burnNoise', 'Scala rumore', 0.5, 12, 0.1],
    ['burnNoiseAmount', 'Peso rumore', 0, 1, 0.01],
    ['ash', 'Cenere / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    contratto: { label: 'Contratto consumato', params: {} },
    riscossione: { label: 'Riscossione immediata', params: { durationMs: 1800, burnStart: 0.3, band: 0.13, ash: 160 } },
  },
};
