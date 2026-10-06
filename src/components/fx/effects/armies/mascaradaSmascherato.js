// Mascarada · «Smascherato» (sconfitta inflitta): una maschera da lottatore cala sul volto
// della carta battuta e ci si incolla; poi viene strappata via e si porta dietro la faccia
// della carta, che si stacca come un adesivo e lascia il vuoto. Senza maschera non sei
// nessuno. «Il pubblico paga. Tu riscuoti.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform vec2 uMaskPos;
uniform float uMaskRot;
uniform float uMaskA;
uniform float uFold;
uniform float uVoid;
uniform float uPress;

/** Maschera da lottatore (coordinate locali, centro 0,0): fascia con occhi e punte. */
vec3 maskShape(vec2 m) {
  // corpo: ellisse larga con due punte in alto ai lati
  float body = length(m / vec2(0.46, 0.15)) - 1.0;
  // punte ad ala verso l'esterno, leggermente all'insù
  vec2 wl = rot2(m - vec2(-0.47, -0.05), 0.35);
  vec2 wr = rot2(m - vec2(0.47, -0.05), -0.35);
  float hornL = length(wl / vec2(0.13, 0.045)) - 1.0;
  float hornR = length(wr / vec2(0.13, 0.045)) - 1.0;
  float d = min(body, min(hornL, hornR));
  float eyeL = length((m - vec2(-0.15, 0.0)) / vec2(0.1, 0.055)) - 1.0;
  float eyeR = length((m - vec2(0.15, 0.0)) / vec2(0.1, 0.055)) - 1.0;
  float eyes = min(eyeL, eyeR);
  float inside = (1.0 - smoothstep(-0.02, 0.02, d)) * smoothstep(-0.05, 0.05, eyes);
  float trim = (1.0 - smoothstep(0.0, 0.12, abs(d))) * inside + (1.0 - smoothstep(0.0, 0.25, abs(eyes))) * inside;
  return vec3(inside, trim, d);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec4 tex = cardAt(p);
  vec3 blue = uColor;
  vec3 gold = vec3(1.0, 0.82, 0.32);

  // la faccia si stacca dal basso verso l'alto, come un adesivo tirato dalla maschera
  vec2 dir = normalize(vec2(0.22, -1.0));
  vec2 o = vec2(0.15, 1.0);
  float s = dot(p - o, dir);
  float f = uFold;
  vec3 col = vec3(0.0);
  float a = 0.0;
  if (tex.a > 0.002) {
    if (s > f) {
      // ancora attaccata (con un'ombra vicino alla piega)
      col = tex.rgb * (1.0 - 0.35 * exp(-(s - f) / 0.03) * step(0.001, f));
      a = tex.a;
    } else {
      // staccata: resta il vuoto, nero con un filo di luce sul contorno
      float r = 0.015;
      float m = min(min(cardAt(p + vec2(r, 0.0)).a, cardAt(p - vec2(r, 0.0)).a), min(cardAt(p + vec2(0.0, r)).a, cardAt(p - vec2(0.0, r)).a));
      float rim = clamp(tex.a - m, 0.0, 1.0);
      col = (vec3(0.012, 0.01, 0.02) + blue * rim * 0.6) * tex.a * uVoid;
      a = tex.a * uVoid;
    }
  }
  // il lembo: la parte già staccata si ribalta sopra la piega e sale (se ne vede il retro)
  if (f > 0.0 && s > f) {
    vec2 src = p - dir * 2.0 * (s - f);
    vec4 back = cardAt(src);
    if (back.a > 0.002 && dot(src - o, dir) < f) {
      float shade = 0.55 + 0.35 * smoothstep(0.0, 0.25, s - f);
      vec3 paper = mix(vec3(0.85, 0.83, 0.8), blue * 0.6, 0.35) * shade;
      col = mix(col, paper * back.a, back.a);
      a = max(a, back.a);
    }
  }

  // la maschera
  vec2 mp = vec2((p.x - uMaskPos.x) * uAspect, p.y - uMaskPos.y);
  mp = rot2(mp, -uMaskRot) / max(uPress, 0.2);
  vec3 mk = maskShape(mp / uAspect * 0.9);
  float mA = mk.x * uMaskA;
  vec3 mCol = mix(blue * (0.75 + 0.25 * noise(mp * 30.0)), gold, mk.y * 0.85);
  mCol += vec3(1.0) * smoothstep(0.7, 1.0, 1.0 - length(mp - vec2(-0.1, -0.06)) * 3.0) * 0.25;
  // ombra della maschera sulla carta mentre scende
  col = col * (1.0 - mA) + mCol * mA;
  a = max(a, mA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function phases(p, t) {
  const land = p.land;
  const rip = p.rip;
  const drop = clamp01(t / Math.max(land, 0.05));
  const r = clamp01((t - rip) / Math.max(0.82 - rip, 0.05));
  return { drop, r, land, rip };
}

export const mascaradaSmascheratoEffect = {
  id: 'mascarada-smascherato',
  army: 'Mascarada',
  role: 'defeat',
  label: 'Smascherato',
  kind: 'out',
  description: 'Una maschera cala sulla carta, viene strappata via e si porta dietro la faccia della carta, lasciando il vuoto.',
  defaults: {
    durationMs: 2600,
    color: '#437ef2',
    land: 0.22,
    rip: 0.45,
    maskY: 0.3,
    sparkle: 40,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: widePadding,
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uMaskPos', 'uMaskRot', 'uMaskA', 'uFold', 'uVoid', 'uPress'],
    maxFlakes: 300,
    bind: (gl, u, { params, progress: t }) => {
      const { drop, r, land } = phases(params, t);
      // cala dall'alto con un colpo secco, poi viene strappata in alto a destra ruotando
      const fall = 1 - drop * drop;
      const pull = r * r;
      gl.uniform2f(u.uMaskPos, 0.5 + pull * 0.9, params.maskY - fall * 0.9 - pull * 1.3);
      gl.uniform1f(u.uMaskRot, -0.25 * fall + pull * 1.6);
      gl.uniform1f(u.uMaskA, ease(clamp01(t / 0.05)) * (1 - ease(clamp01((r - 0.6) / 0.4))));
      const since = t - land;
      gl.uniform1f(u.uPress, since > 0 && since < 0.08 ? 1 - Math.sin((since / 0.08) * Math.PI) * 0.06 : 1);
      // lo strappo: la piega corre dal basso fino oltre la cima (la faccia se ne va tutta)
      gl.uniform1f(u.uFold, r > 0 ? ease(r) * 1.25 : 0);
      gl.uniform1f(u.uVoid, 1 - ease(clamp01((t - 0.84) / 0.15)));
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      // lustrini quando la maschera si incolla
      if (prev < params.land && t >= params.land && t - prev < 0.3) {
        for (let i = 0; i < params.sparkle; i += 1) {
          const [cx, cy] = toCanvasUv(rect, 0.5 + (Math.random() - 0.5) * 0.9, params.maskY + (Math.random() - 0.5) * 0.15);
          const a = Math.random() * Math.PI * 2;
          const sp = 0.05 + Math.random() * 0.2;
          env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 3, color: Math.random() < 0.5 ? [1, 0.82, 0.32] : env.color, shape: 2, gravity: 0.5, drag: 1 });
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['land', 'Maschera posata', 0.05, 0.4, 0.01],
    ['rip', 'Strappo', 0.2, 0.7, 0.01],
    ['maskY', 'Altezza maschera', 0.15, 0.6, 0.01],
    ['sparkle', 'Lustrini', 0, 150, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    smascherato: { label: 'Smascherato', params: {} },
    colpoBasso: { label: 'Colpo basso', params: { durationMs: 1800, land: 0.15, rip: 0.32 } },
  },
};
