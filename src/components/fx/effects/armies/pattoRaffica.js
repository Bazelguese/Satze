// Patto degli Indocili · «Raffica» (sconfitta inflitta): una raffica di colpi crivella la
// carta battuta; ogni proiettile la scuote e lascia un foro bruciato con crepe a stella, da
// cui si vede attraverso. Poi la carta cede: i fori si allargano e cade.
// «Oggi non ci spariamo addosso.» Oggi sì.

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { mulberry } from '../../pieces.js';

const MAX_SHOTS = 10;

const FRAG = `${QUAD_HEADER}
uniform vec3 uHoles[${MAX_SHOTS}];
uniform float uCount;
uniform float uHoleR;
uniform float uTear;
uniform float uDrop;
uniform float uTilt;
uniform float uFade;
uniform vec2 uShake;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  // la carta che cede: cade e si inclina attorno al bordo in basso
  vec2 c = vec2((p.x - 0.5) * uAspect, p.y - 1.0 - uDrop);
  c = rot2(c, -uTilt);
  vec2 P = c + vec2(0.5 * uAspect, 1.0) - uShake;
  vec2 q = vec2(P.x / uAspect, P.y);
  vec4 tex = cardAt(q);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  float hole = 0.0;
  float burn = 0.0;
  float crack = 0.0;
  float flash = 0.0;
  for (int i = 0; i < ${MAX_SHOTS}; i++) {
    if (float(i) >= uCount) break;
    vec3 h = uHoles[i];
    float since = uProgress - h.z;
    if (since < 0.0) continue;
    vec2 d = P - vec2(h.x * uAspect, h.y);
    float r = length(d);
    float ang = atan(d.y, d.x);
    // bordo frastagliato del foro, che si allarga quando la carta cede
    float jag = (noise(vec2(ang * 3.0 + float(i) * 7.0, 1.0)) - 0.5) * 0.35;
    float R = uHoleR * (1.0 + jag) * (1.0 + uTear * (0.6 + hash(vec2(float(i), 2.0))));
    hole = max(hole, 1.0 - smoothstep(R * 0.92, R, r));
    burn = max(burn, (1.0 - smoothstep(R, R * 2.4, r)));
    // crepe a stella attorno al foro
    float rays = pow(abs(sin(ang * (3.0 + floor(hash(vec2(float(i), 5.0)) * 3.0)) + float(i))), 30.0);
    crack = max(crack, rays * (1.0 - smoothstep(R, R * 4.5, r)) * step(R, r));
    // vampa del colpo
    flash = max(flash, exp(-since / 0.012) * (1.0 - smoothstep(0.0, R * 6.0, r)));
  }
  vec3 col = tex.rgb;
  col *= 1.0 - burn * 0.75;
  col = mix(col, vec3(0.06, 0.04, 0.03) * tex.a, crack * 0.8);
  // filo incandescente sul bordo del foro
  float rim = burn * (1.0 - smoothstep(0.0, 0.5, burn - 0.55)) * step(0.55, burn);
  col += mix(uColor, vec3(1.0, 0.6, 0.25), 0.6) * rim * 0.5 * tex.a;
  col += vec3(1.0, 0.92, 0.7) * flash * tex.a;
  float a = tex.a * (1.0 - hole);
  gl_FragColor = outColor(col * (1.0 - hole) * uFade, a * uFade);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Colpi della raffica: posizione (uv) e istante, riproducibili dal seme. */
function shotsOf(p) {
  const rand = mulberry(Math.round(p.seed) + 11);
  const n = Math.max(1, Math.min(MAX_SHOTS, Math.round(p.shots)));
  const list = [];
  for (let i = 0; i < n; i += 1) {
    // più fitti al centro (il bersaglio), con qualche colpo largo
    const spread = rand() < 0.75 ? 0.28 : 0.42;
    const x = 0.5 + (rand() - 0.5) * 2 * spread;
    const y = 0.45 + (rand() - 0.5) * 2 * spread * 0.9;
    list.push([Math.min(0.92, Math.max(0.08, x)), Math.min(0.92, Math.max(0.08, y)), p.start + i * p.cadence + (rand() - 0.5) * p.cadence * 0.4]);
  }
  return list;
}

export const pattoRafficaEffect = {
  id: 'patto-raffica',
  army: 'Patto degli Indocili',
  role: 'defeat',
  label: 'Raffica',
  kind: 'out',
  description: 'Una raffica di colpi crivella la carta di fori bruciati; poi la carta cede e cade.',
  defaults: {
    durationMs: 2400,
    color: '#e867c3',
    shots: 7,
    start: 0.06,
    cadence: 0.055,
    holeSize: 0.03,
    collapse: 0.62,
    shake: 0.012,
    chips: 14,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.45, right: m * 0.45, top: m * 0.3, bottom: m * 0.9 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uHoles', 'uCount', 'uHoleR', 'uTear', 'uDrop', 'uTilt', 'uFade', 'uShake'],
    needsPixels: true,
    maxFlakes: 700,
    bind: (gl, u, { params, progress: t, time }) => {
      const shots = shotsOf(params);
      const data = new Float32Array(MAX_SHOTS * 3);
      shots.forEach((s, i) => data.set(s, i * 3));
      gl.uniform3fv(u.uHoles, data);
      gl.uniform1f(u.uCount, shots.length);
      gl.uniform1f(u.uHoleR, params.holeSize);
      const k = clamp01((t - params.collapse) / Math.max(1 - params.collapse, 0.05));
      gl.uniform1f(u.uTear, ease(k) * 1.4);
      gl.uniform1f(u.uDrop, k * k * 0.6);
      gl.uniform1f(u.uTilt, ease(k) * 0.35);
      gl.uniform1f(u.uFade, 1 - ease(clamp01((t - 0.86) / 0.13)));
      // ogni colpo dà uno strattone che si smorza
      let jx = 0;
      let jy = 0;
      shots.forEach(([x, y, at], i) => {
        const dt = t - at;
        if (dt > 0 && dt < 0.08) {
          const e = Math.exp(-dt / 0.015);
          jx += (0.5 - x) * e * (i % 2 ? 1 : -1);
          jy += -e * 0.6;
        }
      });
      gl.uniform2f(u.uShake, jx * params.shake * 2, jy * params.shake);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      if (t - prev > 0.3 || t < prev) return;
      for (const [x, y, at] of shotsOf(params)) {
        if (prev < at && t >= at) {
          const [cx, cy] = toCanvasUv(rect, x, y);
          // schegge di carta e scintille che escono dal foro
          for (let i = 0; i < params.chips; i += 1) {
            const px = env.pixels ? env.pixels.at(x, y) : [0.5, 0.5, 0.5, 1];
            const a = Math.random() * Math.PI * 2;
            const sp = 0.08 + Math.random() * 0.3;
            env.flakes.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.1, life: 0.4 + Math.random() * 0.5, size: 2 + Math.random() * 3.5, color: [px[0] * 0.8, px[1] * 0.8, px[2] * 0.8], shape: 4, gravity: 1.2, drag: 0.6 });
          }
          for (let i = 0; i < 10; i += 1) {
            const a = Math.random() * Math.PI * 2;
            const sp = 0.2 + Math.random() * 0.4;
            env.embers.spawn(cx, cy, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.12 + Math.random() * 0.2, size: 1 + Math.random() * 1.5, heat: 1, rise: 0 });
          }
          // un filo di fumo
          for (let i = 0; i < 4; i += 1) {
            env.embers.spawn(cx, cy, { vx: (Math.random() - 0.5) * 0.02, vy: -0.03 - Math.random() * 0.03, life: 0.8 + Math.random() * 0.6, size: 3 + Math.random() * 3, heat: 0.05, rise: 0.02, alpha: 0.4 });
          }
        }
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['shots', 'Colpi', 1, MAX_SHOTS, 1],
    ['start', 'Primo colpo', 0, 0.4, 0.01],
    ['cadence', 'Cadenza', 0.02, 0.15, 0.005],
    ['holeSize', 'Misura fori', 0.008, 0.06, 0.001],
    ['collapse', 'La carta cede', 0.3, 0.9, 0.01],
    ['shake', 'Strattoni', 0, 0.04, 0.001],
    ['chips', 'Schegge per colpo', 0, 40, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    raffica: { label: 'Raffica', params: {} },
    caricatore: { label: 'Tutto il caricatore', params: { shots: 10, cadence: 0.035, holeSize: 0.018, collapse: 0.6 } },
  },
};
