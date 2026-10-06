// Orathai · «Varco» (ingresso): un groviglio di rovi e radici avvolge la sagoma della carta
// nell'ombra del bosco; poi i rovi si ritraggono aprendosi dal centro come un sipario, e la
// carta esce dall'ombra alla luce. Gli Orathai sono creature lignee, alberi umanoidi.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uVineW;
uniform float uDensity;
uniform float uGrow;
uniform float uOpen;
uniform float uShadow;
uniform float uStep;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  // la carta avanza appena dall'ombra: da un po' più piccola alla sua misura
  vec2 pc = (p - 0.5) / uStep + 0.5;
  vec4 tex = cardAt(pc);
  vec2 P = vec2(p.x * uAspect, p.y);
  // il groviglio sborda un poco oltre la carta
  float m = 0.06;
  float ex = max(max(-P.x, P.x - uAspect), max(-P.y, P.y - 1.0));
  float region = 1.0 - smoothstep(0.0, m, ex);
  if (region <= 0.0 && tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  // crescita: il groviglio sale dal basso e avvolge tutto
  float wob = (fbm(P * 5.0 + 3.7) - 0.5) * 0.18;
  float grown = smoothstep(1.0 - uGrow * 1.25 - 0.02, 1.0 - uGrow * 1.25 + 0.02, P.y + wob);
  // apertura: dal centro verso i lati, frastagliata
  float dx = abs(P.x - uAspect * 0.5) + (fbm(vec2(P.y * 6.0, 1.3)) - 0.5) * 0.12;
  float parted = smoothstep(uOpen - 0.02, uOpen + 0.02, dx);
  float cover = grown * parted * region;

  // viticci e spine (linee di livello del rumore), i rami si arricciano mentre si ritirano
  vec2 Q = P + vec2(sign(P.x - uAspect * 0.5) * uOpen * 0.35, 0.0);
  float n1 = fbm(Q * uDensity + vec2(3.1, 0.0));
  float n2 = fbm(Q * uDensity * 2.1 + vec2(0.0, 7.7));
  float vine = 1.0 - smoothstep(uVineW * 0.5, uVineW, abs(n1 - 0.5));
  float twig = (1.0 - smoothstep(uVineW * 0.2, uVineW * 0.45, abs(n2 - 0.5))) * 0.8;
  float thorn = step(0.88, noise(Q * 90.0)) * smoothstep(uVineW * 2.0, uVineW * 0.6, abs(n1 - 0.5));
  float vines = clamp(max(vine, twig) + thorn, 0.0, 1.0) * cover;
  // fondo del groviglio: buio di sottobosco dove i rami si infittiscono
  float thicket = cover * smoothstep(0.3, 0.7, fbm(Q * uDensity * 0.6 + 9.1)) * 0.85;

  vec3 bark = vec3(0.07, 0.12, 0.04);
  vec3 lime = mix(uColor, vec3(1.0), 0.15);
  float hl = smoothstep(0.35, 0.0, abs(n1 - 0.5) / max(uVineW, 1e-4));
  // rami di legno scuro, con un riflesso di linfa solo sul dorso
  vec3 wood = mix(vec3(0.1, 0.07, 0.04), vec3(0.22, 0.17, 0.09), fbm(Q * 30.0));
  vec3 vineCol = mix(wood, lime, smoothstep(0.6, 1.0, hl) * 0.55);

  // la carta: in ombra sotto i rovi, alla luce nel varco (con un filo di luce sul bordo)
  float dark = uShadow * mix(0.3, 1.0, cover);
  vec3 card = tex.rgb * (1.0 - dark);
  float lip = exp(-abs(dx - uOpen) / 0.025) * step(dx, uOpen) * step(0.001, uOpen) * (1.0 - smoothstep(0.45, 0.65, uOpen));
  card += lime * lip * 0.4 * tex.a;
  float cardA = tex.a * grown;

  vec3 col = mix(card, vec3(0.03, 0.04, 0.02), thicket);
  float a = max(cardA, thicket);
  col = mix(col, vineCol, vines);
  a = max(a, vines);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const orathaiVarcoEffect = {
  id: 'orathai-varco',
  army: 'Orathai',
  role: 'entry',
  label: 'Varco',
  kind: 'in',
  description: "Un groviglio di rovi avvolge la carta nell'ombra, poi si apre dal centro come un sipario e la carta esce alla luce.",
  defaults: {
    durationMs: 2800,
    color: '#5ad4bc',
    vineWidth: 0.1,
    density: 7,
    grow: 0.25,
    openStart: 0.42,
    shadow: 0.8,
    step: 0.06,
    leaves: 90,
    leafSize: 8,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.45, right: m * 0.45, top: m * 0.25, bottom: m * 0.25 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uVineW', 'uDensity', 'uGrow', 'uOpen', 'uShadow', 'uStep'],
    maxFlakes: 500,
    bind: (gl, u, { params, progress: t, aspect }) => {
      gl.uniform1f(u.uVineW, params.vineWidth);
      gl.uniform1f(u.uDensity, params.density);
      gl.uniform1f(u.uGrow, ease(clamp01(t / Math.max(params.grow, 0.02))));
      // a fine apertura i rovi sono oltre il bordo della carta (+ margine e frastagliatura)
      const k = ease(clamp01((t - params.openStart) / Math.max(0.95 - params.openStart, 0.05)));
      gl.uniform1f(u.uOpen, k * (aspect * 0.5 + 0.2));
      gl.uniform1f(u.uShadow, params.shadow * (1 - ease(clamp01((t - 0.8) / 0.2))));
      gl.uniform1f(u.uStep, 1 - params.step * (1 - ease(clamp01((t - params.openStart) / Math.max(0.98 - params.openStart, 0.05)))));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // foglie strappate ai rovi mentre si aprono
      const on = t > params.openStart && t < 0.95 && !state.done ? 1 : 0;
      const n = env.clock(params.leaves * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = 0.5 + side * Math.random() * 0.45;
        const [cx, cy] = toCanvasUv(rect, x, Math.random());
        const g = Math.random();
        const col = g < 0.5 ? [0.1 + g * 0.1, 0.22 + g * 0.2, 0.06] : env.color.map((c) => c * (0.6 + Math.random() * 0.4));
        env.flakes.spawn(cx, cy, {
          vx: side * (0.05 + Math.random() * 0.12),
          vy: -0.02 - Math.random() * 0.05,
          life: 1 + Math.random() * 1.2,
          size: params.leafSize * (0.6 + Math.random() * 0.6),
          color: col,
          shape: 1,
          gravity: 0.12,
          drag: 0.9,
        });
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['grow', 'Crescita groviglio', 0.02, 0.5, 0.01],
    ['openStart', 'Inizio apertura', 0.15, 0.8, 0.01],
    ['vineWidth', 'Spessore rami', 0.01, 0.15, 0.001],
    ['density', 'Fitto dei rami', 2, 16, 0.1],
    ['shadow', 'Ombra', 0, 1, 0.01],
    ['step', 'Passo avanti', 0, 0.2, 0.005],
    ['leaves', 'Foglie / s', 0, 300, 1],
    ['leafSize', 'Misura foglie', 3, 20, 0.5],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    varco: { label: 'Varco', params: {} },
    sottobosco: { label: 'Dal sottobosco', params: { durationMs: 3400, grow: 0.3, openStart: 0.55, density: 9, shadow: 0.95, leaves: 160 } },
  },
};
