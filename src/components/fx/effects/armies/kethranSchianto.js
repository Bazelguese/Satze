// Kethran · «Schianto» (sconfitta inflitta): un colpo tremendo si abbatte sulla carta battuta;
// un'onda d'urto, cicatrici d'oro che si aprono dal punto d'impatto, e la carta si accartoccia
// su sé stessa schiacciata, poi il rottame cade e si sbriciola.
// «Ci hanno spezzati. Non sapevano che i pezzi sanno combattere.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform vec2 uHit;
uniform float uImpact;
uniform float uCrush;
uniform float uFall;
uniform float uFade;
uniform float uScars;
uniform float uFacets;
uniform vec2 uShake;

/** Celle di Voronoi: x = distanza dal bordo di cella, yz = id. */
vec3 voro(vec2 g) {
  vec2 gi = floor(g);
  float d1 = 9.0;
  float d2 = 9.0;
  vec2 id = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = vec2(hash(gi + o), hash(gi + o + 5.3));
      float d = length(gi + o + h - g);
      if (d < d1) { d2 = d1; d1 = d; id = gi + o; } else if (d < d2) { d2 = d; }
    }
  }
  return vec3(d2 - d1, id);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 H = vec2(uHit.x * uAspect, uHit.y);
  vec2 P = vec2(p.x * uAspect, p.y) - uShake - vec2(0.0, uFall);

  // schiacciamento verso il punto d'impatto: più in verticale che in orizzontale
  float k = uCrush;
  vec2 sc = vec2(mix(1.0, 0.62, k), mix(1.0, 0.38, k));
  vec2 L = H + (P - H) / sc;
  // pieghe: la carta si spezza in faccette spostate l'una rispetto all'altra
  vec3 v = voro(L * uFacets);
  vec2 shift = (vec2(hash(v.yz + 1.7), hash(v.yz + 8.3)) - 0.5) * 0.13 * k;
  vec2 S = L + shift;
  // ammaccatura: l'onda d'urto spinge via dal punto d'impatto
  float r = length(S - H);
  float wave = uImpact * sin(r * 40.0 - uImpact * 12.0) * exp(-r * 6.0) * 0.012;
  S += normalize(S - H + 1e-4) * wave;
  vec2 q = vec2(S.x / uAspect, S.y);
  vec4 tex = cardAt(q);
  // la sagoma si arrotonda in un rottame accartocciato
  vec2 c = abs(q - 0.5) - 0.5 + 0.2 * k;
  float box = length(max(c, 0.0)) + min(max(c.x, c.y), 0.0) - 0.2 * k + (noise(q * 9.0) - 0.5) * 0.08 * k;
  tex *= 1.0 - smoothstep(-0.01, 0.01, box);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  // luce sulle faccette (carta piegata) e grinze scure lungo le pieghe
  vec2 n = normalize(vec2(hash(v.yz + 3.1), hash(v.yz + 4.9)) - 0.5);
  float facet = 0.75 + 0.45 * dot(n, normalize(vec2(-0.6, -0.8))) * k;
  float crease = (1.0 - smoothstep(0.0, 0.06, v.x)) * k;
  vec3 col = tex.rgb * facet * (1.0 - crease * 0.55);
  // cicatrici d'oro che si aprono dal punto d'impatto lungo le pieghe
  float reach = smoothstep(0.0, 1.0, uImpact * 1.6) * 0.9;
  float scar = (1.0 - smoothstep(0.0, 0.035, v.x)) * (1.0 - smoothstep(reach - 0.1, reach, length(L - H))) * uScars;
  vec3 gold = mix(uColor, vec3(1.0, 0.95, 0.8), 0.35);
  col += gold * scar * tex.a * (0.6 + 0.4 * sin(uTime * 10.0 + v.y));
  // lampo d'impatto
  col += vec3(1.0, 0.95, 0.85) * exp(-sq(uImpact * 3.0 - 0.3)) * exp(-length(L - H) * 5.0) * tex.a * step(0.001, uImpact);
  gl_FragColor = outColor(col * uFade, tex.a * uFade);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function phases(p, t) {
  const hit = p.hitTime;
  const crushEnd = Math.min(0.75, hit + p.crushTime);
  const since = t - hit;
  return {
    impact: since > 0 ? clamp01(since / 0.35) : 0,
    crush: ease(clamp01(since / Math.max(crushEnd - hit, 0.05))),
    fall: Math.pow(clamp01((t - crushEnd) / Math.max(1 - crushEnd, 0.05)), 2) * p.fall,
    fade: 1 - ease(clamp01((t - 0.86) / 0.13)),
    shake: since > 0 ? Math.exp(-since / 0.06) : 0,
    crushEnd,
  };
}

export const kethranSchiantoEffect = {
  id: 'kethran-schianto',
  army: 'Kethran',
  role: 'defeat',
  label: 'Schianto',
  kind: 'out',
  description: "Un colpo tremendo schiaccia la carta: onda d'urto, cicatrici d'oro, la carta si accartoccia e il rottame cade.",
  usesOrigin: true,
  defaults: {
    durationMs: 2200,
    color: '#eebf3c',
    hitTime: 0.12,
    crushTime: 0.3,
    fall: 0.9,
    scars: 1.2,
    facets: 7,
    shake: 0.03,
    debris: 70,
    originX: 0.5,
    originY: 0.35,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.25, bottom: m * 1.1 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uHit', 'uImpact', 'uCrush', 'uFall', 'uFade', 'uScars', 'uFacets', 'uShake'],
    needsPixels: true,
    bind: (gl, u, { params, progress: t, time }) => {
      const ph = phases(params, t);
      gl.uniform2f(u.uHit, params.originX, params.originY);
      gl.uniform1f(u.uImpact, ph.impact);
      gl.uniform1f(u.uCrush, ph.crush);
      gl.uniform1f(u.uFall, ph.fall);
      gl.uniform1f(u.uFade, ph.fade);
      gl.uniform1f(u.uScars, params.scars);
      gl.uniform1f(u.uFacets, params.facets);
      const a = params.shake * ph.shake;
      gl.uniform2f(u.uShake, Math.sin(time * 90) * a, Math.cos(time * 73) * a * 0.7);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      const ph = phases(params, t);
      const burst = (n, at, spread, up) => {
        for (let i = 0; i < n; i += 1) {
          const x = at[0] + (Math.random() - 0.5) * spread;
          const y = at[1] + (Math.random() - 0.5) * spread * 0.6;
          const px = env.pixels ? env.pixels.at(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))) : [0.6, 0.6, 0.6, 1];
          const [cx, cy] = toCanvasUv(rect, x, y);
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 3;
          const sp = 0.1 + Math.random() * up;
          env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.7, size: 3 + Math.random() * 5, color: [px[0], px[1], px[2]], shape: 4, gravity: 1.4, drag: 0.4 });
        }
      };
      if (t - prev < 0.3) {
        // schegge e scintille d'oro all'impatto
        if (prev < params.hitTime && t >= params.hitTime) {
          burst(Math.round(params.debris * 0.5), [params.originX, params.originY], 0.25, 0.45);
          for (let i = 0; i < 50; i += 1) {
            const [cx, cy] = toCanvasUv(rect, params.originX, params.originY);
            const a = Math.random() * Math.PI * 2;
            const sp = 0.15 + Math.random() * 0.45;
            env.embers.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.35, size: 1 + Math.random() * 2.5, heat: 0.8 + Math.random() * 0.2, rise: 0 });
          }
        }
        // il rottame tocca terra e si sbriciola
        const crumble = ph.crushEnd + (1 - ph.crushEnd) * 0.55;
        if (prev < crumble && t >= crumble) {
          const fallUv = params.fall * Math.pow(0.55, 2);
          burst(params.debris, [params.originX, params.originY + 0.25 + fallUv], 0.35, 0.3);
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt, (e, dt) => {
        e.vy += 0.6 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['hitTime', 'Momento del colpo', 0, 0.4, 0.01],
    ['crushTime', 'Durata schiacciamento', 0.1, 0.6, 0.01],
    ['fall', 'Caduta del rottame', 0, 2, 0.01],
    ['scars', "Cicatrici d'oro", 0, 3, 0.01],
    ['facets', 'Pieghe', 3, 16, 0.5],
    ['shake', 'Scossa', 0, 0.08, 0.001],
    ['debris', 'Schegge', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    schianto: { label: 'Schianto', params: {} },
    maglio: { label: 'Colpo di maglio', params: { durationMs: 1600, hitTime: 0.06, crushTime: 0.28, shake: 0.05, debris: 130 } },
  },
};
