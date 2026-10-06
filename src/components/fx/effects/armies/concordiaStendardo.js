// Concordia di Caelion · «Stendardo» (ingresso): un'asta dorata appare in cima e da lì si
// srotola uno stendardo; sul drappo è dipinta la carta. Il tessuto ondeggia al vento con le
// frange dorate, poi si tende e diventa la carta. L'ordine del Vallo schiera i suoi.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uRoll;
uniform float uWave;
uniform float uCloth;
uniform float uPole;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec3 gold = mix(uColor, vec3(1.0, 0.9, 0.6), 0.45);
  // onde del drappo: più ampie in basso (il tessuto è appeso in cima)
  float hang = clamp(p.y, 0.0, 1.0);
  float wv = sin(p.y * 9.0 - uTime * 4.0 + p.x * 3.0) * 0.5 + sin(p.y * 17.0 - uTime * 6.0) * 0.25;
  vec2 q = p + vec2(wv * 0.025 * hang * uWave, sin(p.x * 8.0 - uTime * 3.0) * 0.006 * hang * uWave);
  vec4 tex = cardAt(q);
  // srotolato fino a uRoll: oltre, ancora arrotolato
  float rolled = step(p.y, uRoll);
  // il rotolo: un cilindro di stoffa sul bordo che scende
  float rollBand = exp(-abs(p.y - uRoll) / 0.018) * step(0.001, uRoll) * (1.0 - step(0.999, uRoll));
  float inX = step(0.0, q.x) * step(q.x, 1.0);
  // trama del tessuto e pieghe in ombra
  float weave = 0.94 + 0.06 * sin(p.x * 420.0) * sin(p.y * 420.0);
  float fold = 1.0 - 0.18 * uWave * hang * (0.5 + 0.5 * cos(p.y * 9.0 - uTime * 4.0 + p.x * 3.0));
  vec3 cloth = tex.rgb * mix(1.0, weave * fold, uCloth);
  vec3 col = cloth * rolled;
  float a = tex.a * rolled;
  vec3 rollCol = mix(uColor * 0.5, gold, 0.4) * (0.6 + 0.4 * sin(p.y * 200.0));
  float rA = rollBand * inX * 0.95;
  col = col * (1.0 - rA) + rollCol * rA;
  a = max(a, rA);
  // frange dorate sul bordo inferiore mentre scende
  float fringe = step(uRoll, p.y) * step(p.y, uRoll + 0.035) * step(0.5, fract(p.x * 60.0)) * inX * step(0.001, uRoll) * uCloth;
  col = col * (1.0 - fringe) + gold * fringe;
  a = max(a, fringe);
  // asta dorata in cima, con i pomoli
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y);
  float pole = (1.0 - smoothstep(0.006, 0.011, abs(P.y + 0.012))) * step(abs(P.x), 0.5 * uAspect + 0.06);
  float knob = 1.0 - smoothstep(0.016, 0.02, length(vec2(abs(P.x) - 0.5 * uAspect - 0.07, P.y + 0.012)));
  float poleA = max(pole, knob) * uPole;
  vec3 poleCol = gold * (0.8 + 0.4 * smoothstep(0.0, 0.01, -(P.y + 0.016)));
  col = col * (1.0 - poleA) + poleCol * poleA;
  a = max(a, poleA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const concordiaStendardoEffect = {
  id: 'concordia-stendardo',
  army: 'Concordia di Caelion',
  role: 'entry',
  label: 'Stendardo',
  kind: 'in',
  description: "Da un'asta dorata si srotola uno stendardo con la carta dipinta; ondeggia al vento, poi si tende e diventa la carta.",
  defaults: {
    durationMs: 2900,
    color: '#c7ad71',
    pole: 0.1,
    unroll: 0.45,
    wave: 1,
    cloth: 1,
    motes: 50,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.3, right: m * 0.3, top: m * 0.2, bottom: m * 0.2 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRoll', 'uWave', 'uCloth', 'uPole'],
    bind: (gl, u, { params, progress: t }) => {
      const p0 = Math.max(0.02, params.pole);
      const k = clamp01((t - p0) / Math.max(params.unroll, 0.05));
      // si srotola rallentando, con un piccolo rimbalzo quando arriva in fondo
      const roll = 1 - (1 - k) * (1 - k);
      gl.uniform1f(u.uRoll, k >= 1 ? 1.001 : roll * 1.0);
      const end = p0 + params.unroll;
      // ondeggia forte appena srotolato, poi il vento cala e il drappo si tende
      gl.uniform1f(u.uWave, params.wave * (t < p0 ? 0 : 1 - ease(clamp01((t - end) / Math.max(0.92 - end, 0.05)))));
      gl.uniform1f(u.uCloth, params.cloth * (1 - ease(clamp01((t - 0.8) / 0.16))));
      gl.uniform1f(u.uPole, ease(clamp01(t / p0)) * (1 - ease(clamp01((t - 0.82) / 0.16))));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // pulviscolo dorato portato dal vento
      const on = t > params.pole && t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, -0.1 + Math.random() * 0.3, Math.random());
        env.embers.spawn(cx, cy, { vx: 0.1 + Math.random() * 0.1, vy: -0.01 + (Math.random() - 0.5) * 0.02, life: 1 + Math.random(), size: 1 + Math.random() * 1.8, heat: 0.4 + Math.random() * 0.4, rise: 0 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['pole', "Comparsa dell'asta", 0.02, 0.3, 0.01],
    ['unroll', 'Srotolamento', 0.1, 0.6, 0.01],
    ['wave', 'Vento', 0, 2.5, 0.01],
    ['cloth', 'Trama del tessuto', 0, 1, 0.01],
    ['motes', 'Pulviscolo / s', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    stendardo: { label: 'Stendardo', params: {} },
    vallo: { label: 'Vento sul Vallo', params: { durationMs: 3600, unroll: 0.5, wave: 1.8 } },
  },
};
