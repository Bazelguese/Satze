// Mascarada · «Gran finale»: si accende un occhio di bue, la carta gira sempre più veloce
// come al main event, poi esplode in coriandoli e lustrini (metà presi dai colori della
// carta) con un lampo. «Il pubblico paga. Tu riscuoti.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv, randomCardPoint } from '../../quadRenderer.js';
import { widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uSpot;
uniform float uTurns;
uniform float uBurst;
uniform float uFlash;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float t = uProgress;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);

  // occhio di bue: fascio dall'alto e pozza di luce ai piedi della carta
  float spotOn = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.75, 0.98, t)) * uSpot;
  float halfW = 0.12 + (P.y + 1.3) * 0.26;
  float beam = (1.0 - smoothstep(halfW * 0.75, halfW, abs(P.x))) * smoothstep(-1.3, -0.4, P.y) * (1.0 - smoothstep(0.45, 0.62, P.y));
  float pool = exp(-(sq(P.x / 0.55) + sq((P.y - 0.53) / 0.07)));
  vec3 warm = mix(vec3(1.0, 0.96, 0.86), uColor, 0.25);
  float light = (beam * 0.16 + pool * 0.45) * spotOn;

  // la carta gira su sé stessa e si ingrandisce un poco
  float s = smoothstep(0.1, uBurst, t);
  float ang = s * s * uTurns * 6.2832;
  float c = cos(ang);
  float sc = 1.0 + 0.12 * s;
  vec2 q = (p - 0.5) / sc + 0.5;
  float w = max(abs(c), 0.02);
  float qx = (q.x - 0.5) / w + 0.5;
  // di dorso: immagine specchiata e più scura
  vec2 src = vec2(c < 0.0 ? 1.0 - qx : qx, q.y);
  vec4 tex = (qx < 0.0 || qx > 1.0) ? vec4(0.0) : cardAt(src);
  tex *= step(t, uBurst);
  tex.rgb *= (c < 0.0 ? 0.55 : 1.0) * (0.6 + 0.4 * w);
  tex.rgb += warm * light * tex.a * 0.6;

  // lampo e anello allo scoppio
  float since = t - uBurst;
  float flash = uFlash * exp(-sq(since / 0.035)) * exp(-length(P) / 0.35);
  float ringR = max(since, 0.0) * 1.6;
  float ring = uFlash * step(0.0, since) * exp(-sq((length(P) - ringR) / 0.03)) * (1.0 - smoothstep(0.0, 0.3, since));

  vec3 col = tex.rgb + warm * light * (1.0 - tex.a) + vec3(1.0) * flash + mix(uColor, vec3(1.0), 0.5) * ring;
  float a = max(tex.a, min(1.0, light * 0.9 + flash + ring));
  gl_FragColor = outColor(col, a);
}
`;

const STAGE = [
  [1, 0.84, 0.3], // oro
  [0.95, 0.3, 0.75], // magenta
  [1, 1, 1],
  [0.3, 0.85, 1],
];

export const mascaradaEffect = {
  id: 'mascarada-finale',
  army: 'Mascarada',
  label: 'Gran finale',
  kind: 'out',
  description: 'Occhio di bue, la carta gira e scoppia in coriandoli e lustrini.',
  defaults: {
    durationMs: 2400,
    color: '#437ef2',
    spotlight: 0.85,
    turns: 2.5,
    burstAt: 0.6,
    confetti: 280,
    sequins: 0.3,
    spread: 0.9,
    gravity: 0.7,
    flash: 1,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const p = widePadding(w, h);
    return { ...p, top: Math.max(w, h) * 0.9 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uSpot', 'uTurns', 'uBurst', 'uFlash'],
    needsPixels: true,
    maxFlakes: 1200,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uSpot, params.spotlight);
      gl.uniform1f(u.uTurns, params.turns);
      gl.uniform1f(u.uBurst, Math.max(0.15, Math.min(0.9, params.burstAt)));
      gl.uniform1f(u.uFlash, params.flash);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const burst = Math.max(0.15, Math.min(0.9, params.burstAt));
      const prev = env.lastP ?? 0;
      if (prev < burst && state.progress >= burst && !state.done) {
        const stage = [env.color, ...STAGE];
        for (let i = 0; i < Math.round(params.confetti); i += 1) {
          const [x, y] = randomCardPoint(env);
          const [cx, cy] = toCanvasUv(rect, x, y);
          const ang = Math.atan2(y - 0.5, x - 0.5) + (Math.random() - 0.5) * 1.2;
          const sp = (0.15 + Math.random() * 0.55) * params.spread;
          const fromCard = Math.random() < 0.5 && env.pixels;
          const color = fromCard ? env.pixels.at(x, y).slice(0, 3) : stage[Math.floor(Math.random() * stage.length)];
          const sequin = Math.random() < params.sequins;
          env.flakes.spawn(cx, cy, {
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 0.25 * params.spread,
            life: 1.2 + Math.random() * 0.9,
            size: sequin ? 3 + Math.random() * 3 : 5 + Math.random() * 6,
            color,
            shape: sequin ? 2 : 0,
            spin: (Math.random() - 0.5) * 12,
            gravity: params.gravity,
            drag: 1.4,
            flutter: 8 + Math.random() * 10,
            fadeIn: 0.001,
          });
        }
      }
      env.lastP = state.progress;
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['spotlight', 'Occhio di bue', 0, 1.5, 0.01],
    ['turns', 'Giri', 0, 6, 0.1],
    ['burstAt', 'Momento dello scoppio', 0.2, 0.85, 0.01],
    ['confetti', 'Coriandoli', 0, 600, 1],
    ['sequins', 'Quota lustrini', 0, 1, 0.01],
    ['spread', 'Esplosione', 0.2, 2, 0.01],
    ['gravity', 'Gravità', -0.3, 2, 0.01],
    ['flash', 'Lampo', 0, 2, 0.01],
  ],
  colorParams: [],
  presets: {
    finale: { label: 'Gran finale', params: {} },
    cobra: { label: 'Colpo basso', params: { durationMs: 1300, turns: 1.2, burstAt: 0.4, confetti: 380, spread: 1.4, gravity: 1, flash: 1.6 } },
  },
};
