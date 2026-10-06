// Risucchio nel vortice: si apre un piccolo portale nel colore dell'armata, la carta si
// torce a spirale e viene inghiottita dal nucleo scuro; scintille vorticano verso il
// centro e il portale si richiude con un lampo. Mappatura inversa nel fragment shader:
// per ogni pixel si cerca quale punto della carta, torto e risucchiato, finisce lì.

import {
  QUAD_VERT,
  clearCanvas,
  createFullscreenQuad,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
  smoothstep,
} from '../glUtils.js';
import { NOISE_GLSL } from '../fxNoise.js';
import { createEmberLayer, createSpawnClock } from '../emberLayer.js';

export const VORTEX_DEFAULTS = {
  durationMs: 2200,
  /** Colore del portale (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Giri di torsione a fine risucchio */
  twist: 1.4,
  /** Quanto la torsione si concentra verso il centro */
  tightness: 3,
  /** Raggio del portale, in altezze della carta */
  portalSize: 0.34,
  /** Nucleo scuro, in quota del raggio del portale */
  coreSize: 0.32,
  /** Spessore del disco luminoso */
  diskWidth: 0.09,
  /** Velocità di rotazione del disco */
  swirlSpeed: 1.6,
  /** Quanto la carta si tinge del colore del portale mentre sparisce */
  tint: 0.55,
  /** Intensità della luce del portale */
  glow: 1,
  /** Lampo di chiusura */
  flash: 0.9,
  /** Scintille risucchiate (al secondo) */
  sparks: 80,
  /** Centro del vortice (0-1 sull'elemento, y verso il basso) */
  originX: 0.5,
  originY: 0.5,
};

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform float uAspect;
uniform float uProgress;
uniform float uTime;
uniform vec2 uCenter;
uniform vec3 uColor;
uniform float uTwist;
uniform float uTight;
uniform float uPortal;
uniform float uCore;
uniform float uDisk;
uniform float uSwirl;
uniform float uTint;
uniform float uGlow;
uniform float uFlash;
${NOISE_GLSL}

float sq(float x) { return x * x; } // pow(x, 2.0) è indefinito per x < 0

vec2 rot(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  // coordinate quadrate (unità = altezza carta) centrate sul vortice
  vec2 P = vec2((p.x - uCenter.x) * uAspect, p.y - uCenter.y);
  float r = length(P);

  float open = smoothstep(0.0, 0.16, uProgress) * (1.0 - smoothstep(0.86, 0.97, uProgress));
  // risucchio lento all'inizio e rapido alla fine: la carta resta visibile fino a ~85%
  float s = pow(smoothstep(0.08, 0.9, uProgress), 1.8);
  float R = uPortal * open;
  float Rg = max(R, 1e-3); // smoothstep con estremi uguali è indefinito

  // il nucleo nasce piccolo e si allarga mentre la carta ci finisce dentro
  float coreR = Rg * uCore * mix(0.2, 1.0, smoothstep(0.3, 0.88, uProgress));

  // --- carta: torta e risucchiata (mappatura inversa). Collassa sul bordo del nucleo,
  // non sul centro: nell'ultimo tratto resta avvolta attorno al buco come strisce a spirale
  float sc = max(1.0 - s, 1e-3);
  float tw = s * uTwist * 6.2832 / (1.0 + max(r - coreR, 0.0) * uTight);
  float hug = coreR * s;
  vec2 radial = P / max(r, 1e-5) * max(r - hug, 0.0);
  vec2 src = rot(radial, -tw) / sc;
  vec2 suv = uCenter + vec2(src.x / uAspect, src.y);
  float inside = step(0.0, suv.x) * step(suv.x, 1.0) * step(0.0, suv.y) * step(suv.y, 1.0);
  vec4 card = texture2D(uTex, clamp(suv, 0.0, 1.0)) * inside;
  float near = 1.0 - smoothstep(0.0, Rg * 1.3, r);
  vec3 hot = mix(uColor, vec3(1.0), 0.5);
  card.rgb = mix(card.rgb, uColor * card.a, uTint * s * (0.4 + 0.6 * near));

  // --- disco del portale (dietro la carta): bracci a spirale che ruotano
  // bracci a spirale: rumore su coordinate ruotate di un angolo che cresce con log(r),
  // continuo ovunque (con atan ci sarebbe una cucitura a ±180°)
  vec2 qa = rot(P, -uTime * uSwirl + log(r + 0.02) * 2.5);
  float arms = fbm(qa * 4.0 + 10.0);
  float ring = exp(-sq((r - R) / max(uDisk * open, 1e-3)));
  float inner = smoothstep(Rg * 1.1, Rg * min(uCore, 0.95), r) * open;
  float disk = (ring * (0.55 + 0.9 * arms) + inner * 0.5 * arms) * uGlow * open;
  vec3 diskCol = mix(uColor, hot, ring * arms);
  vec4 back = vec4(diskCol * disk, min(1.0, disk));

  // --- composizione: disco, carta sopra, nucleo scuro che inghiotte, bordo luminoso
  vec4 col = back * (1.0 - card.a) + card;
  float core = 1.0 - smoothstep(coreR * 0.85, coreR + 1e-4, r);
  col = mix(col, vec4(0.0, 0.0, 0.0, max(col.a, 0.96 * open)), core * open);
  float rim = exp(-sq((r - coreR) / (Rg * 0.05 + 1e-3))) * open * uGlow;
  col.rgb += hot * rim;
  col.a = max(col.a, min(1.0, rim));

  // lampo di chiusura: un punto di luce che esplode e si spegne
  float fl = uFlash * exp(-sq((uProgress - 0.93) / 0.035));
  float flash = fl * exp(-r / max(0.05 + 0.25 * fl, 1e-3));
  col.rgb += hot * flash;
  col.a = max(col.a, min(1.0, flash));

  gl_FragColor = vec4(min(col.rgb, vec3(col.a)), col.a);
}
`;

function createVortexRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(
    gl,
    QUAD_VERT,
    FRAG,
    ['uTex', 'uRect', 'uAspect', 'uProgress', 'uTime', 'uCenter', 'uColor', 'uTwist', 'uTight', 'uPortal', 'uCore', 'uDisk', 'uSwirl', 'uTint', 'uGlow', 'uFlash'],
    ['aPos'],
  );
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl, 400);
  const spawnClock = createSpawnClock();
  let hasSource = false;

  return {
    setSource(src) {
      source.upload(src);
      hasSource = true;
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!hasSource) return;
      const { params, rect, aspect } = state;
      const color = hexToRgb01(params.color);
      const p = state.progress;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      source.bind(0);
      gl.uniform1i(u.uTex, 0);
      gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.uAspect, aspect);
      gl.uniform1f(u.uProgress, p);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform2f(u.uCenter, params.originX, params.originY);
      gl.uniform3f(u.uColor, color[0], color[1], color[2]);
      gl.uniform1f(u.uTwist, params.twist);
      gl.uniform1f(u.uTight, params.tightness);
      gl.uniform1f(u.uPortal, params.portalSize);
      gl.uniform1f(u.uCore, params.coreSize);
      gl.uniform1f(u.uDisk, params.diskWidth);
      gl.uniform1f(u.uSwirl, params.swirlSpeed);
      gl.uniform1f(u.uTint, params.tint);
      gl.uniform1f(u.uGlow, params.glow);
      gl.uniform1f(u.uFlash, params.flash);
      quad.draw(a.aPos);

      // scintille: nascono fuori dal portale e spiraleggiano verso il nucleo
      const open = smoothstep(0, 0.16, p) * (1 - smoothstep(0.86, 0.97, p));
      const R = params.portalSize * open;
      const cx = rect[0] + params.originX * rect[2];
      const cy = rect[1] + params.originY * rect[3];
      const kx = rect[2] / aspect; // altezza carta -> uv x del canvas
      const ky = rect[3];
      const n = spawnClock(params.sparks * open * (state.done ? 0 : 1), state.dt);
      for (let i = 0; i < n; i += 1) {
        const r0 = R * (1.3 + Math.random() * 0.9);
        const a0 = Math.random() * Math.PI * 2;
        embers.spawn(cx + Math.cos(a0) * r0 * kx, cy + Math.sin(a0) * r0 * ky, {
          life: 0.6 + Math.random() * 0.8,
          size: 1.2 + Math.random() * 2.4,
          heat: Math.random(),
          extra: { pr: r0, pa: a0, pw: 2.5 + Math.random() * 2, pin: 0.25 + Math.random() * 0.3 },
        });
      }
      const coreR = params.portalSize * params.coreSize;
      embers.step(state.dt, (e, dt) => {
        e.pa += (e.pw / Math.max(e.pr, 0.04)) * 0.12 * dt;
        e.pr = Math.max(0, e.pr - e.pin * dt);
        if (e.pr < coreR * 0.8) e.age = e.life; // inghiottita
        e.x = cx + Math.cos(e.pa) * e.pr * kx;
        e.y = cy + Math.sin(e.pa) * e.pr * ky;
      });
      embers.draw(color, state.dpr);
    },
    busy() {
      return embers.count > 0;
    },
    dispose() {
      embers.dispose();
      gl.deleteTexture(source.tex);
      gl.deleteBuffer(quad.buf);
      gl.deleteProgram(prog);
      loseContext(gl);
    },
  };
}

export const vortexEffect = {
  id: 'vortex',
  label: 'Vortice',
  kind: 'out',
  description: 'Un portale si apre, la carta si torce a spirale e viene inghiottita.',
  defaults: VORTEX_DEFAULTS,
  directions: null,
  /** Clic sulla carta: sposta il centro del vortice */
  usesOrigin: true,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.45, right: m * 0.45, top: m * 0.4, bottom: m * 0.4 };
  },
  createRenderer: createVortexRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 5000, 50],
    ['twist', 'Torsione (giri)', 0, 4, 0.05],
    ['tightness', 'Torsione al centro', 0, 10, 0.1],
    ['portalSize', 'Raggio portale', 0.1, 0.8, 0.01],
    ['coreSize', 'Nucleo', 0, 0.9, 0.01],
    ['diskWidth', 'Spessore disco', 0.02, 0.4, 0.005],
    ['swirlSpeed', 'Rotazione disco', 0, 6, 0.05],
    ['tint', 'Tinta carta', 0, 1, 0.01],
    ['glow', 'Luce portale', 0, 2.5, 0.01],
    ['flash', 'Lampo chiusura', 0, 2.5, 0.01],
    ['sparks', 'Scintille / s', 0, 300, 1],
  ],
  colorParams: [],
  presets: {
    portale: { label: 'Portale', params: {} },
    gorgo: {
      label: 'Gorgo violento',
      params: { durationMs: 1300, twist: 3, tightness: 5, portalSize: 0.5, coreSize: 0.25, diskWidth: 0.16, swirlSpeed: 4, tint: 0.7, glow: 1.5, flash: 1.4, sparks: 200 },
    },
    buco: {
      label: 'Buco nero',
      params: { durationMs: 2800, twist: 0.8, tightness: 8, portalSize: 0.36, coreSize: 0.55, diskWidth: 0.07, swirlSpeed: 1, tint: 0.3, glow: 0.8, flash: 0.5, sparks: 60 },
    },
  },
};
