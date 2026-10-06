// Bruciatura: un rumore a soglia consuma l'elemento, con una fascia di fiamma sul fronte,
// una fascia carbonizzata subito dietro, bagliore e faville. Nomi e significato dei
// parametri ricalcano lo shader di riferimento (Burn Progress, Flame Percent, …).

import {
  QUAD_VERT,
  clearCanvas,
  createFullscreenQuad,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
} from '../glUtils.js';
import {
  NOISE_GLSL,
  SWEEP_DIRECTIONS,
  SWEEP_GLSL,
  SWEEP_UNIFORMS,
  createSweepRangeCache,
  fbmJs,
  noiseJs,
  setSweepUniforms,
  sweepBaseAt,
  sweepDirection,
} from '../fxNoise.js';
import { createEmberLayer, createSpawnClock } from '../emberLayer.js';

export const BURN_DEFAULTS = {
  /** Durata della bruciatura completa (ms) */
  durationMs: 1800,
  /** Colore della fiamma (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Colore della fascia carbonizzata dietro la fiamma */
  outlineColor: '#0b0710',
  /** Spessore totale del fronte (fiamma + carbone), in unità del campo 0-1 */
  thickness: 0.13,
  /** Quota dello spessore occupata dalla fiamma (0-1) */
  flamePercent: 0.72,
  /** Quota dello spessore occupata dal carbone (0-1) */
  outlinePercent: 0.24,
  /** Opacità di ciò che è già bruciato (0 = sparisce) */
  burntAlpha: 0,
  /** Scala del rumore che disegna la forma dei buchi */
  burnNoiseScale: 3.2,
  /** Peso del rumore rispetto alla direzione (0 = fronte dritto, 1 = solo macchie) */
  noiseAmount: 0.42,
  /** Scala del rumore che fa ondeggiare il fronte */
  noiseScale: 9,
  /** Ampiezza dell'ondeggiamento del fronte */
  wobble: 0.05,
  /** Frastagliatura fine del fronte */
  jaggedness: 0.035,
  /** Velocità dell'ondeggiamento (lingue di fuoco che salgono) */
  speed: 1.6,
  /** Scala finale dell'elemento a fine bruciatura (1 = non rimpicciolisce) */
  shrink: 0.9,
  /** 0 = bande nette (cartoon, come il riferimento) · 1 = sfumate e luminose */
  softness: 0.35,
  /** Intensità del bagliore che la fiamma proietta attorno al fronte */
  glow: 0.8,
  /** Faville che si staccano dal fronte (al secondo, a piena intensità) */
  embers: 70,
  /** Direzione del fuoco: chiave di SWEEP_DIRECTIONS */
  direction: 'bottom',
  /** Origine per direction='point' (0-1 sull'elemento, y verso il basso) */
  originX: 0.5,
  originY: 0.5,
  /** Seme del rumore: cambia la forma dei buchi a parità di parametri */
  seed: 0,
};

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform float uThreshold;
uniform float uActive;
uniform float uTime;
uniform vec3 uFlame;
uniform vec3 uOutline;
uniform float uThickness;
uniform float uFlamePct;
uniform float uOutlinePct;
uniform float uBurntAlpha;
uniform float uNoiseScale;
uniform float uWobble;
uniform float uJagged;
uniform float uSpeed;
uniform float uScale;
uniform float uSoftness;
uniform float uGlow;
${NOISE_GLSL}
${SWEEP_GLSL}

// Campo di bruciatura: brucia dove field < uThreshold.
float burnField(vec2 p) {
  vec2 q = vec2(p.x * uAspect, p.y);
  float base = sweepBase(p);
  // le lingue di fuoco scorrono nel verso del fuoco (in su per il radiale/sparso)
  vec2 flowDir = uMode < 0.5 ? uDir : vec2(0.0, -1.0);
  vec2 flow = -flowDir * uTime * uSpeed * 0.35;
  float w = (fbm(q * uNoiseScale + flow + 3.7) - 0.5) * 2.0 * uWobble;
  float j = (noise(q * uNoiseScale * 4.0 + flow * 2.0 + 9.1) - 0.5) * 2.0 * uJagged;
  return base + w + j;
}

void main() {
  vec2 local = (vUv - uRect.xy) / uRect.zw;
  vec2 p = (local - 0.5) / uScale + 0.5;
  float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);
  vec4 tex = texture2D(uTex, clamp(p, 0.0, 1.0)) * inside; // premoltiplicata
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  vec2 q = vec2(p.x * uAspect, p.y);
  float dist = burnField(p) - uThreshold;

  float W = uThickness;
  float fw = W * uFlamePct;
  float ow = W * min(1.0, uFlamePct + uOutlinePct);
  ow = max(ow, fw);
  float soft = mix(0.0025, W * 0.3, uSoftness);

  float alive = smoothstep(-soft * 0.5, soft * 0.5, dist);
  float flameM = alive * (1.0 - smoothstep(fw - soft * 0.5, fw + soft * 0.5, dist));
  float charM = alive * (1.0 - smoothstep(ow - soft * 0.5, ow + soft * 0.5, dist));

  vec3 col = tex.rgb;
  // bruciacchiato oltre il carbone, solo con la morbidezza alta
  float scorch = (1.0 - smoothstep(ow, ow + W * 1.5 * uSoftness + 1e-4, dist)) * uSoftness * 0.55;
  col *= 1.0 - scorch;
  col = mix(col, uOutline * tex.a, charM);

  float heat = 1.0 - clamp(dist / max(fw, 1e-4), 0.0, 1.0);
  float flicker = 0.88 + 0.24 * noise(q * 22.0 + vec2(0.0, uTime * 9.0));
  vec3 hot = mix(uFlame, vec3(1.0), 0.6);
  vec3 flameCol = mix(uFlame, hot, heat * (0.25 + 0.75 * uSoftness)) * flicker;
  col = mix(col, min(flameCol, vec3(1.0)) * tex.a, flameM);

  float alpha = tex.a * alive;
  col *= alive;

  // ciò che è già bruciato può restare come cenere semitrasparente
  float burnt = (1.0 - alive) * uBurntAlpha * tex.a;
  col += uOutline * burnt;
  alpha += burnt;

  // bagliore della fiamma attorno al fronte: largo sulla carta, appena un filo nel buco
  float gw = dist >= 0.0 ? W * 0.55 : W * 0.12;
  float g = exp(-abs(dist) / max(gw, 1e-3)) * uGlow * uActive * tex.a * 0.55;
  g *= 1.0 - flameM;
  col += uFlame * g;
  alpha = max(alpha, min(1.0, alpha + g * max(uFlame.r, max(uFlame.g, uFlame.b))));

  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

function sweepOf(params) {
  return {
    direction: params.direction,
    originX: params.originX,
    originY: params.originY,
    seed: params.seed,
    scale: params.burnNoiseScale,
    amount: params.noiseAmount,
  };
}

/** Campo completo di bruciatura in JS (base + ondeggio + frastagliatura), come burnField. */
export function burnFieldAt(px, py, params, aspect, time) {
  const info = sweepDirection(params.direction);
  const qx = px * aspect;
  const qy = py;
  const [fdx, fdy] = info.mode === 0 ? info.dir : [0, -1];
  const k = time * params.speed * 0.35;
  const flx = -fdx * k;
  const fly = -fdy * k;
  const w = (fbmJs(qx * params.noiseScale + flx + 3.7, qy * params.noiseScale + fly + 3.7) - 0.5) * 2 * params.wobble;
  const j = (noiseJs(qx * params.noiseScale * 4 + flx * 2 + 9.1, qy * params.noiseScale * 4 + fly * 2 + 9.1) - 0.5) * 2 * params.jaggedness;
  return sweepBaseAt(px, py, sweepOf(params), aspect) + w + j;
}

/**
 * Soglia del campo per un avanzamento 0-1: a 0 nessun pixel tocca la fascia,
 * a 1 tutto è sotto la soglia anche con ondeggio e frastagliatura al massimo.
 * `range` = minimo/massimo reale del campo statico; senza, l'intervallo teorico 0-1.
 */
export function burnThreshold(progress, params, range = null) {
  const band = params.thickness * Math.max(1, params.flamePercent + params.outlinePercent);
  const jitter = params.wobble + params.jaggedness + 0.01;
  const lo = range ? range.min : 0;
  const hi = range ? range.max : 1;
  const start = lo - band - jitter;
  const end = hi + jitter;
  return start + (end - start) * Math.max(0, Math.min(1, progress));
}

/** Punto casuale (uv elemento) dentro la fascia di fiamma, o null se non trovato. */
function sampleFlamePoint(params, aspect, time, threshold) {
  const fw = Math.max(params.thickness * params.flamePercent, 0.01);
  for (let i = 0; i < 16; i += 1) {
    const x = Math.random();
    const y = Math.random();
    const dist = burnFieldAt(x, y, params, aspect, time) - threshold;
    if (dist >= 0 && dist <= fw) return { x, y };
  }
  return null;
}

function createBurnRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(
    gl,
    QUAD_VERT,
    FRAG,
    [
      'uTex', 'uRect', 'uThreshold', 'uActive', 'uTime', 'uFlame', 'uOutline', 'uThickness',
      'uFlamePct', 'uOutlinePct', 'uBurntAlpha', 'uNoiseScale', 'uWobble', 'uJagged', 'uSpeed',
      'uScale', 'uSoftness', 'uGlow', ...SWEEP_UNIFORMS,
    ],
    ['aPos'],
  );
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl);
  const spawnClock = createSpawnClock();
  const rangeOf = createSweepRangeCache();
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
      const sweep = sweepOf(params);
      const threshold = burnThreshold(state.progress, params, rangeOf(sweep, aspect));
      const scale = 1 - (1 - params.shrink) * state.progress;
      const flame = hexToRgb01(params.color);
      const outline = hexToRgb01(params.outlineColor);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      source.bind(0);
      gl.uniform1i(u.uTex, 0);
      gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.uThreshold, threshold);
      gl.uniform1f(u.uActive, state.active);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform3f(u.uFlame, flame[0], flame[1], flame[2]);
      gl.uniform3f(u.uOutline, outline[0], outline[1], outline[2]);
      gl.uniform1f(u.uThickness, params.thickness);
      gl.uniform1f(u.uFlamePct, params.flamePercent);
      gl.uniform1f(u.uOutlinePct, params.outlinePercent);
      gl.uniform1f(u.uBurntAlpha, params.burntAlpha);
      gl.uniform1f(u.uNoiseScale, params.noiseScale);
      gl.uniform1f(u.uWobble, params.wobble);
      gl.uniform1f(u.uJagged, params.jaggedness);
      gl.uniform1f(u.uSpeed, params.speed);
      gl.uniform1f(u.uScale, scale);
      gl.uniform1f(u.uSoftness, params.softness);
      gl.uniform1f(u.uGlow, params.glow);
      setSweepUniforms(gl, u, sweep, aspect);
      quad.draw(a.aPos);

      const n = spawnClock(params.embers * state.active, state.dt);
      for (let i = 0; i < n; i += 1) {
        const fp = sampleFlamePoint(params, aspect, state.time, threshold);
        if (!fp) continue;
        const lx = (fp.x - 0.5) * scale + 0.5;
        const ly = (fp.y - 0.5) * scale + 0.5;
        embers.spawn(rect[0] + lx * rect[2], rect[1] + ly * rect[3]);
      }
      embers.step(state.dt);
      embers.draw(flame, state.dpr);
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

export const burnEffect = {
  id: 'burn',
  label: 'Bruciatura',
  kind: 'out',
  description: 'Il fuoco consuma la carta: fascia di fiamma, bordo carbonizzato, faville.',
  defaults: BURN_DEFAULTS,
  directions: SWEEP_DIRECTIONS,
  /** Metà lineare e metà smoothstep: attecchisce piano, divora, rallenta sugli ultimi brandelli. */
  curve: (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t),
  padding: (w, h) => ({ left: w * 0.2, right: w * 0.2, top: h * 0.45, bottom: h * 0.15 }),
  createRenderer: createBurnRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 400, 5000, 50],
    ['thickness', 'Spessore fuoco', 0.02, 0.4, 0.005],
    ['flamePercent', 'Fiamma %', 0, 1, 0.01],
    ['outlinePercent', 'Carbone %', 0, 1, 0.01],
    ['burntAlpha', 'Alpha bruciato', 0, 1, 0.01],
    ['burnNoiseScale', 'Scala rumore buchi', 0.5, 12, 0.1],
    ['noiseAmount', 'Peso rumore', 0, 1, 0.01],
    ['noiseScale', 'Scala ondeggio', 1, 30, 0.5],
    ['wobble', 'Ondeggio bordo', 0, 0.2, 0.002],
    ['jaggedness', 'Frastagliatura', 0, 0.15, 0.002],
    ['speed', 'Velocità', 0, 6, 0.05],
    ['shrink', 'Rimpicciolimento', 0.5, 1, 0.01],
    ['softness', 'Morbidezza', 0, 1, 0.01],
    ['glow', 'Bagliore', 0, 2, 0.01],
    ['embers', 'Faville / s', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [['outlineColor', 'Colore carbone']],
  presets: {
    cosmico: { label: 'Cosmico (morbido)', params: {} },
    reel: {
      label: 'Cartoon (riferimento)',
      params: {
        thickness: 0.136, flamePercent: 0.76, outlinePercent: 0.22, burntAlpha: 0,
        burnNoiseScale: 3.4, noiseAmount: 0.45, noiseScale: 16, wobble: 0.06, jaggedness: 0.05,
        speed: 3.3, shrink: 0.85, softness: 0, glow: 0, embers: 0, outlineColor: '#050307',
      },
    },
    cenere: {
      label: 'Cenere lenta',
      params: {
        durationMs: 3200, thickness: 0.09, flamePercent: 0.45, outlinePercent: 0.5, burntAlpha: 0.12,
        burnNoiseScale: 5, noiseAmount: 0.6, noiseScale: 7, wobble: 0.03, jaggedness: 0.02,
        speed: 0.8, shrink: 0.96, softness: 0.7, glow: 0.5, embers: 140, outlineColor: '#1a1410',
      },
    },
    vampata: {
      label: 'Vampata',
      params: {
        durationMs: 900, thickness: 0.22, flamePercent: 0.85, outlinePercent: 0.12, burntAlpha: 0,
        burnNoiseScale: 2.2, noiseAmount: 0.3, noiseScale: 10, wobble: 0.09, jaggedness: 0.04,
        speed: 4.5, shrink: 0.8, softness: 0.55, glow: 1.4, embers: 260, outlineColor: '#000000',
      },
    },
  },
};
