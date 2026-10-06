// Concordia di Caelion · «Discesa» (ingresso): un fascio di sole si apre dall'alto e la carta
// scende lenta dentro la luce, sovraesposta d'oro; quando si posa suona un rintocco di
// campana che si allarga in onde di luce, e i colori tornano i suoi. (Cael, la Campana)

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uDrop;
uniform float uRays;
uniform float uExposure;
uniform float uShow;
uniform float uRing1;
uniform float uRing2;

float ringAt(float r, float since) {
  float R = max(since, 0.0) * 2.0;
  return step(0.0, since) * exp(-sq((r - R) / 0.025)) * (1.0 - smoothstep(0.0, 0.4, since));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  vec3 gold = mix(uColor, vec3(1.0, 0.93, 0.72), 0.5);

  // fascio di sole dall'alto
  vec2 sun = vec2(0.0, -1.2);
  vec2 d = P - sun;
  float ang = atan(d.x, d.y);
  float rays = pow(noise(vec2(ang * 14.0, uTime * 0.25)), 3.0) * 1.6 + 0.2;
  float cone = 1.0 - smoothstep(0.35, 0.6, abs(ang));
  float fall = smoothstep(2.1, 0.6, length(d));
  float rayA = rays * cone * fall * uRays * 0.25;

  // la carta scende (rallentando) dentro la luce
  vec2 q = p + vec2(0.0, uDrop);
  vec4 tex = cardAt(q) * uShow;
  vec3 col = mix(tex.rgb, gold * tex.a, uExposure * 0.7) + gold * uExposure * 0.3 * tex.a;
  // alone attorno alla carta mentre scende
  vec2 Q = vec2((q.x - 0.5) * uAspect, q.y - 0.5);
  vec2 cb = abs(Q) - vec2(uAspect * 0.5, 0.5);
  float box = length(max(cb, 0.0)) + min(max(cb.x, cb.y), 0.0);
  float halo = exp(-max(box, 0.0) / 0.05) * step(0.0, box) * uExposure * uShow * 0.6;

  // rintocchi quando si posa: onde dalla base della carta
  float r = length(vec2(P.x, (P.y - 0.5) * 1.6));
  float rings = (ringAt(r, uRing1) + ringAt(r, uRing2) * 0.7) * (1.0 - smoothstep(0.9, 1.0, uProgress));

  float a = tex.a;
  col += gold * (rayA + rings + halo) * (1.0 - a);
  a = max(a, min(1.0, rayA + rings + halo));
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const concordiaDiscesaEffect = {
  id: 'concordia-discesa',
  army: 'Concordia di Caelion',
  role: 'entry',
  label: 'Discesa',
  kind: 'in',
  description: "La carta scende lenta in un fascio di sole, sovraesposta d'oro; posandosi suona un rintocco di campana.",
  defaults: {
    durationMs: 3000,
    color: '#c7ad71',
    drop: 0.55,
    land: 0.6,
    rays: 1,
    exposure: 1,
    motes: 80,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: widePadding,
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uDrop', 'uRays', 'uExposure', 'uShow', 'uRing1', 'uRing2'],
    bind: (gl, u, { params, progress: t }) => {
      const L = Math.max(0.2, Math.min(0.85, params.land));
      const k = clamp01((t - 0.08) / Math.max(L - 0.08, 0.05));
      const slow = 1 - (1 - k) * (1 - k) * (1 - k);
      gl.uniform1f(u.uDrop, (1 - slow) * params.drop);
      gl.uniform1f(u.uShow, ease(clamp01((t - 0.06) / 0.12)));
      gl.uniform1f(u.uRays, params.rays * ease(clamp01(t / 0.12)) * (1 - ease(clamp01((t - 0.8) / 0.18))));
      gl.uniform1f(u.uExposure, params.exposure * (1 - ease(clamp01((t - L) / Math.max(0.97 - L, 0.05)))));
      gl.uniform1f(u.uRing1, t - L);
      gl.uniform1f(u.uRing2, t - L - 0.12);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      // pulviscolo dorato che scende nel fascio
      const on = t < 0.85 && !state.done ? 1 : 0;
      const n = env.clock(params.motes * on, state.dt);
      for (let i = 0; i < n; i += 1) {
        const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 1.4, -0.6 + Math.random() * 1.5);
        env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.01, vy: 0.01 + Math.random() * 0.03, life: 1 + Math.random() * 1.2, size: 1 + Math.random() * 2, heat: 0.4 + Math.random() * 0.5, rise: -0.005 });
      }
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['drop', 'Altezza discesa', 0, 1.2, 0.01],
    ['land', 'Momento in cui si posa', 0.2, 0.85, 0.01],
    ['rays', 'Raggi di sole', 0, 2, 0.01],
    ['exposure', "Sovraesposizione d'oro", 0, 1.5, 0.01],
    ['motes', 'Pulviscolo / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    discesa: { label: 'Discesa', params: {} },
    vallo: { label: 'Dal Vallo', params: { durationMs: 3800, drop: 0.85, land: 0.65, rays: 1.5, motes: 160 } },
  },
};
