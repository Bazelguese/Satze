// Mascarada · «Entrata in scena» (ingresso): sala al buio, un occhio di bue cerca sul palco e
// si ferma al centro; coriandoli e lustrini vorticano nel fascio e si raccolgono, la carta
// compare girando su sé stessa sempre più piano fino a fermarsi in posa, con un ultimo
// scoppio di lustrini. «Il pubblico paga. Tu riscuoti.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uSpot;
uniform float uSpotX;
uniform float uSpin;
uniform float uShow;
uniform float uPose;
uniform float uFlash;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  vec3 warm = mix(vec3(1.0, 0.96, 0.86), uColor, 0.25);

  // occhio di bue: fascio dall'alto che si sposta, pozza di luce ai piedi
  float sx = uSpotX;
  float halfW = 0.12 + (P.y + 1.3) * 0.26;
  float beam = (1.0 - smoothstep(halfW * 0.75, halfW, abs(P.x - sx * (P.y + 1.3) / 1.8))) * smoothstep(-1.3, -0.4, P.y) * (1.0 - smoothstep(0.45, 0.62, P.y));
  float pool = exp(-(sq((P.x - sx) / 0.55) + sq((P.y - 0.53) / 0.07)));
  float light = (beam * 0.16 + pool * 0.45) * uSpot;

  // la carta gira (sempre più piano) e si ferma di fronte, con un piccolo scatto di posa
  float ang = uSpin;
  float c = cos(ang);
  float sc = (0.85 + 0.15 * uShow) * (1.0 + uPose);
  vec2 q = (p - 0.5) / max(sc, 0.05) + 0.5;
  float w = max(abs(c), 0.02);
  float qx = (q.x - 0.5) / w + 0.5;
  vec2 src = vec2(c < 0.0 ? 1.0 - qx : qx, q.y);
  vec4 tex = (qx < 0.0 || qx > 1.0) ? vec4(0.0) : cardAt(src);
  tex *= uShow;
  // di dorso: più scura, con un motivo a losanghe nel colore della Mascarada
  float back = step(c, 0.0);
  float diamond = step(0.5, fract((src.x * uAspect + src.y) * 8.0)) == step(0.5, fract((src.x * uAspect - src.y) * 8.0)) ? 1.0 : 0.0;
  tex.rgb = mix(tex.rgb, (uColor * (0.35 + 0.25 * diamond)) * tex.a, back * 0.85);
  tex.rgb *= 0.6 + 0.4 * w;
  tex.rgb += warm * light * tex.a * 0.5;

  float flash = uFlash * exp(-length(P) / 0.35);
  vec3 col = tex.rgb + warm * light * (1.0 - tex.a) + vec3(1.0) * flash * (1.0 - tex.a * 0.7);
  float a = max(tex.a, min(1.0, light * 0.9 + flash));
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function phases(p) {
  const search = Math.max(0.05, Math.min(0.5, p.search));
  const show = Math.min(0.85, search + 0.05);
  const stop = Math.min(0.92, show + Math.max(0.1, p.spinTime));
  return { search, show, stop };
}

export const mascaradaEntrataEffect = {
  id: 'mascarada-entrata',
  army: 'Mascarada',
  role: 'entry',
  label: 'Entrata in scena',
  kind: 'in',
  description: "Un occhio di bue cerca sul palco, coriandoli vorticano nel fascio e la carta entra in giravolta fermandosi in posa.",
  defaults: {
    durationMs: 3000,
    color: '#437ef2',
    search: 0.28,
    spinTime: 0.45,
    turns: 3,
    spot: 1,
    pose: 0.06,
    confetti: 220,
    sparkle: 120,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: widePadding,
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uSpot', 'uSpotX', 'uSpin', 'uShow', 'uPose', 'uFlash'],
    maxFlakes: 1200,
    bind: (gl, u, { params, progress: t, aspect }) => {
      const { search, show, stop } = phases(params);
      gl.uniform1f(u.uSpot, params.spot * ease(clamp01(t / 0.06)) * (1 - ease(clamp01((t - 0.82) / 0.16))));
      // il fascio cerca: due passate ai lati, poi si ferma al centro
      const s = clamp01(t / search);
      const sweep = Math.sin(s * Math.PI * 2.2) * (1 - ease(s)) * aspect * 0.9;
      gl.uniform1f(u.uSpotX, sweep);
      // giravolta: veloce all'inizio, rallenta fino a fermarsi di fronte (angolo multiplo di 2π)
      const k = clamp01((t - show) / Math.max(stop - show, 0.05));
      const decel = 1 - (1 - k) * (1 - k) * (1 - k);
      const turns = Math.max(1, Math.round(params.turns));
      gl.uniform1f(u.uSpin, (1 - decel) * turns * Math.PI * 2);
      gl.uniform1f(u.uShow, ease(clamp01((t - show) / 0.06)));
      const since = t - stop;
      gl.uniform1f(u.uPose, since > 0 ? params.pose * Math.sin(Math.min(since / 0.06, 1) * Math.PI) * Math.exp(-since / 0.1) : 0);
      gl.uniform1f(u.uFlash, since > 0 ? Math.exp(-Math.pow(since / 0.04, 2)) * 0.6 : 0);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const { search, stop } = phases(params);
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      const palette = [env.color, [1, 0.85, 0.3], [1, 0.4, 0.6], [0.5, 0.9, 1], [1, 1, 1]];
      // coriandoli che vorticano nel fascio e si stringono verso il centro
      const on = t > search * 0.6 && t < stop && !state.done ? 1 : 0;
      const n = env.clock(params.confetti * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.7 + Math.random() * 0.4;
        const [sx, sy] = toCanvasUv(rect, 0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r * 0.7);
        const [cx, cy] = toCanvasUv(rect, 0.5, 0.5);
        env.flakes.spawn(sx, sy, {
          life: 0.8 + Math.random() * 0.5,
          size: 4 + Math.random() * 4,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: Math.random() < 0.75 ? 0 : 2,
          spin: (Math.random() - 0.5) * 12,
          gravity: 0,
          drag: 0,
          extra: { cx, cy, a0: a, r0: r, dir: Math.random() < 0.5 ? -1 : 1, rect },
        });
      }
      // scoppio di lustrini quando si ferma in posa
      if (prev < stop && t >= stop && t - prev < 0.3) {
        for (let i = 0; i < params.sparkle; i += 1) {
          const a = Math.random() * Math.PI * 2;
          const sp = 0.15 + Math.random() * 0.4;
          const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 0.6, 0.5 + (Math.random() - 0.5) * 0.8);
          env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.1, life: 0.7 + Math.random() * 0.7, size: 3 + Math.random() * 4, color: palette[Math.floor(Math.random() * palette.length)], shape: 2, gravity: 0.6, drag: 1.2 });
        }
      }
      env.flakes.step(state.dt, (fl, dt) => {
        if (fl.r0 != null) {
          // spirale verso il centro della carta
          const k = fl.age / fl.life;
          const r = fl.r0 * (1 - k * k);
          const a = fl.a0 + fl.dir * k * 5;
          const [x, y] = toCanvasUv(fl.rect, 0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r * 0.7);
          fl.x = x;
          fl.y = y;
        } else {
          fl.vy += fl.gravity * dt;
          const e = Math.exp(-fl.drag * dt);
          fl.vx *= e;
          fl.vy *= e;
          fl.x += fl.vx * dt;
          fl.y += fl.vy * dt;
        }
      });
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['search', 'Ricerca del fascio', 0.05, 0.5, 0.01],
    ['spinTime', 'Durata giravolta', 0.1, 0.7, 0.01],
    ['turns', 'Giri', 1, 6, 1],
    ['spot', 'Occhio di bue', 0, 2, 0.01],
    ['pose', 'Scatto di posa', 0, 0.2, 0.005],
    ['confetti', 'Coriandoli / s', 0, 500, 1],
    ['sparkle', 'Lustrini finali', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    entrata: { label: 'Entrata in scena', params: {} },
    mainEvent: { label: 'Main event', params: { durationMs: 3600, search: 0.35, turns: 5, confetti: 380, sparkle: 220 } },
  },
};
