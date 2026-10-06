// Orathai · «Corteccia» (ingresso): una scorza di legno cresce dal basso e avvolge la
// carta; nelle fenditure si accende la linfa, poi la corteccia si spacca lungo il centro e
// si apre come due ante, mostrando la carta. Gli Orathai sono creature lignee.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uGrow;
uniform float uSap;
uniform float uOpen;
uniform float uGrain;
uniform float uShade;

/** Corteccia procedurale: venature verticali, fenditure profonde, nodi. */
vec4 bark(vec2 P) {
  float g = fbm(vec2(P.x * uGrain, P.y * uGrain * 0.12));
  float fiss = smoothstep(0.4, 0.47, abs(fract(P.x * uGrain * 0.35 + fbm(P * vec2(3.0, 0.8)) * 1.6) - 0.5));
  float knot = smoothstep(0.75, 0.9, noise(P * 7.0 + 2.3));
  vec3 base = mix(vec3(0.16, 0.1, 0.06), vec3(0.36, 0.25, 0.15), g);
  base = mix(base, vec3(0.08, 0.05, 0.03), fiss * 0.8 + knot * 0.4);
  return vec4(base, fiss);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2(p.x * uAspect, p.y);
  vec3 sap = mix(uColor, vec3(1.0), 0.25);
  // linea della spaccatura, frastagliata come legno che si apre
  float crackX = 0.5 + (fbm(vec2(p.y * 7.0, 4.2)) - 0.5) * 0.12;
  // ante: ognuna incernierata al suo bordo esterno, si chiude in larghezza ruotando
  float c = max(cos(uOpen * 1.45), 0.03);
  vec4 col = vec4(0.0);
  vec2 src = vec2(-1.0);
  float side = 0.0;
  if (p.x < crackX * c) {
    src = vec2(p.x / c, p.y);
    side = -1.0;
  } else if (p.x > 1.0 - (1.0 - crackX) * c) {
    src = vec2(1.0 - (1.0 - p.x) / c, p.y);
    side = 1.0;
  }

  // la carta dietro (visibile dove le ante si sono aperte)
  vec4 tex = cardAt(p);
  float behind = step(0.001, uOpen) * tex.a;
  vec3 card = tex.rgb * (1.0 - 0.45 * (1.0 - smoothstep(0.3, 1.0, uOpen)) * step(0.001, uOpen));

  float barkA = 0.0;
  vec3 barkC = vec3(0.0);
  if (side != 0.0 || uOpen <= 0.0) {
    vec2 s2 = uOpen <= 0.0 ? p : src;
    vec4 shape = cardAt(s2);
    vec2 S = vec2(s2.x * uAspect, s2.y);
    // cresce dal basso con un bordo fibroso
    float edge = 1.0 - uGrow * 1.15 + (fbm(vec2(S.x * 9.0, 1.7)) - 0.5) * 0.12;
    float grown = smoothstep(edge - 0.01, edge + 0.01, s2.y);
    vec4 b = bark(S);
    // linfa nelle fenditure, che scorre verso l'alto e si accende verso la spaccatura
    float flow = smoothstep(0.4, 0.8, noise(vec2(S.x * 30.0, S.y * 4.0 + uTime * 1.5)));
    float sapA = b.a * uSap * (0.5 + 0.5 * flow);
    float crackGlow = exp(-abs(s2.x - crackX) * uAspect / 0.02) * uSap;
    barkC = b.rgb * (0.55 + 0.45 * c) + sap * (sapA * 0.7 + crackGlow) * (1.0 - uShade * (1.0 - c));
    // le ante, ormai di taglio, spariscono alla fine
    barkA = shape.a * grown * (1.0 - smoothstep(0.8, 1.0, uOpen));
  }
  vec3 outC = card * behind * (1.0 - barkA) + barkC * barkA;
  float a = max(behind, barkA);
  gl_FragColor = outColor(outC, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const orathaiCortecciaEffect = {
  id: 'orathai-corteccia',
  army: 'Orathai',
  role: 'entry',
  label: 'Corteccia',
  kind: 'in',
  description: 'Una scorza di legno avvolge la carta, la linfa si accende nelle fenditure, poi la corteccia si apre come due ante.',
  defaults: {
    durationMs: 2900,
    color: '#5ad4bc',
    grow: 0.25,
    sapStart: 0.28,
    openStart: 0.5,
    grain: 18,
    shade: 0.6,
    chips: 70,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.25, bottom: m * 0.3 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uGrow', 'uSap', 'uOpen', 'uGrain', 'uShade'],
    maxFlakes: 500,
    bind: (gl, u, { params, progress: t }) => {
      gl.uniform1f(u.uGrow, ease(clamp01(t / Math.max(params.grow, 0.02))));
      gl.uniform1f(u.uSap, ease(clamp01((t - params.sapStart) / 0.15)) * (1 - ease(clamp01((t - 0.85) / 0.12))));
      gl.uniform1f(u.uOpen, ease(clamp01((t - params.openStart) / Math.max(0.96 - params.openStart, 0.05))));
      gl.uniform1f(u.uGrain, params.grain);
      gl.uniform1f(u.uShade, params.shade);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      const wood = () => {
        const g = Math.random();
        return [0.2 + g * 0.18, 0.13 + g * 0.12, 0.07 + g * 0.06];
      };
      // schegge allo spacco e mentre le ante si aprono
      if (prev < params.openStart && t >= params.openStart && t - prev < 0.3) {
        for (let i = 0; i < params.chips; i += 1) {
          const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 0.12, Math.random());
          const side = Math.random() < 0.5 ? -1 : 1;
          env.flakes.spawn(cx, cy, { vx: side * (0.08 + Math.random() * 0.2), vy: -0.05 - Math.random() * 0.15, life: 0.6 + Math.random() * 0.7, size: 3 + Math.random() * 5, color: wood(), shape: 4, gravity: 0.9, drag: 0.5 });
        }
      }
      // gocce di linfa luminosa dalla spaccatura
      const on = t > params.openStart && t < 0.9 && !state.done ? 1 : 0;
      const n = env.clock(40 * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 0.1, Math.random());
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.04, vy: -(0.02 + Math.random() * 0.05), life: 0.6 + Math.random() * 0.8, size: 1 + Math.random() * 2, heat: 0.4 + Math.random() * 0.4 });
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['grow', 'Crescita corteccia', 0.02, 0.5, 0.01],
    ['sapStart', 'Linfa', 0.05, 0.7, 0.01],
    ['openStart', 'Apertura ante', 0.2, 0.85, 0.01],
    ['grain', 'Venatura', 4, 40, 0.5],
    ['shade', 'Ombra sulle ante', 0, 1, 0.01],
    ['chips', 'Schegge', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    corteccia: { label: 'Corteccia', params: {} },
    tronco: { label: 'Tronco antico', params: { durationMs: 3600, grow: 0.3, sapStart: 0.35, openStart: 0.6, grain: 12, chips: 140 } },
  },
};
