// Disintegrazione in polvere: la carta si sbriciola in granelli che un vento cosmico
// porta via. Finché un pezzo non si stacca la carta è disegnata a piena risoluzione
// (quad); al distacco ogni cella diventa un granello (punto) che vola, si tinge del
// colore dell'armata e svanisce. Tutto dipende solo dall'avanzamento: si può fermare
// a qualunque quota.

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
  setSweepUniforms,
  sweepBaseAt,
} from '../fxNoise.js';

export const DUST_DEFAULTS = {
  durationMs: 2400,
  /** Colore della polvere (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Lato di un granello in px CSS */
  grain: 2.5,
  /** Quota della durata in cui un granello vola prima di sparire (0-1) */
  life: 0.45,
  /** Distanza percorsa, in altezze della carta */
  distance: 0.9,
  /** Direzione del vento in gradi (0 = destra, -90 = su) */
  windAngle: -25,
  /** Dispersione delle traiettorie attorno al vento */
  spread: 0.7,
  /** 0 = tutti col vento · 1 = in fuori dal punto d'origine (esplosione) */
  radial: 0,
  /** Mulinello: quanto i granelli ondeggiano in volo */
  turbulence: 0.05,
  /** Spinta verso l'alto in volo */
  lift: 0.25,
  /** Quanto i granelli prendono il colore dell'armata (0-1) */
  colorShift: 0.75,
  /** Bagliore del bordo che si sta sgretolando */
  glow: 0.9,
  /** Larghezza della fascia che si scalda prima di staccarsi */
  heatBand: 0.07,
  /** Da dove comincia a sgretolarsi */
  direction: 'left',
  originX: 0.5,
  originY: 0.5,
  /** Scala del rumore che decide l'ordine di distacco */
  sweepScale: 4,
  /** Peso del rumore rispetto alla direzione */
  sweepAmount: 0.55,
  seed: 0,
};

const CARD_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform vec2 uGrid;
uniform float uProgress;
uniform float uLife;
uniform vec2 uRange;
uniform float uHeatBand;
uniform float uGlow;
uniform vec3 uColor;
${NOISE_GLSL}
${SWEEP_GLSL}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  // stessa cella (e stesso istante di distacco) del granello corrispondente
  vec2 cell = (floor(p * uGrid) + 0.5) / uGrid;
  float s = clamp((sweepBase(cell) - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
  float release = s * (1.0 - uLife);
  float until = release - uProgress; // > 0: ancora attaccata
  if (until <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec4 tex = texture2D(uTex, p);
  float heat = (1.0 - smoothstep(0.0, uHeatBand, until)) * uGlow;
  vec3 col = tex.rgb + uColor * heat * tex.a * 0.8;
  gl_FragColor = vec4(min(col, vec3(tex.a)), tex.a);
}
`;

const GRAIN_VERT = `
attribute vec2 aHome;
attribute vec4 aColor;
attribute vec3 aRand;
attribute float aRelease;
uniform vec4 uRect;
uniform float uProgress;
uniform float uLife;
uniform float uAspect;
uniform vec2 uWind;
uniform float uSpread;
uniform float uRadial;
uniform vec2 uBurst;
uniform float uDistance;
uniform float uTurb;
uniform float uLift;
uniform float uGrainPx;
uniform vec3 uColor;
uniform float uColorShift;
uniform float uGlow;
varying vec4 vColor;

void main() {
  float age = (uProgress - aRelease * (1.0 - uLife)) / uLife;
  if (age <= 0.0 || age >= 1.0 || aColor.a < 0.05) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vColor = vec4(0.0);
    return;
  }
  float a = age;
  float e = a * a * (1.6 - 0.6 * a); // parte piano, poi accelera
  vec2 outward = normalize(vec2((aHome.x - uBurst.x) * uAspect, aHome.y - uBurst.y) + vec2(1e-4, 0.0));
  vec2 d0 = normalize(mix(normalize(uWind), outward, uRadial) + vec2(1e-5, 0.0));
  float ang = atan(d0.y, d0.x) + (aRand.x - 0.5) * 3.14159 * uSpread;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 off = dir * e * uDistance * (0.55 + aRand.z * 0.9);
  off += vec2(sin(a * 7.0 + aRand.y * 6.283), cos(a * 6.0 + aRand.x * 6.283)) * uTurb * a;
  off.y -= uLift * a * a;
  vec2 cuv = aHome + vec2(off.x / uAspect, off.y);
  vec2 cv = uRect.xy + cuv * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  gl_PointSize = uGrainPx * mix(1.05, 0.35 + aRand.y * 0.5, smoothstep(0.0, 1.0, a));

  vec3 base = aColor.rgb;
  vec3 hot = mix(uColor, vec3(1.0), 0.55);
  float flash = smoothstep(0.0, 0.06, a) * (1.0 - smoothstep(0.06, 0.45, a));
  vec3 c = mix(base, uColor, smoothstep(0.05, 0.45, a) * uColorShift);
  c = mix(c, hot, flash * uGlow * 0.8);
  float alpha = aColor.a * (1.0 - smoothstep(0.45, 1.0, a));
  vColor = vec4(c * alpha, alpha);
}
`;

const GRAIN_FRAG = `
precision mediump float;
varying vec4 vColor;
void main() {
  gl_FragColor = vColor;
}
`;

function sweepOf(params) {
  return {
    direction: params.direction,
    originX: params.originX,
    originY: params.originY,
    seed: params.seed,
    scale: params.sweepScale,
    amount: params.sweepAmount,
  };
}

/** Pseudo-casuale stabile per cella: le traiettorie non cambiano da un fotogramma all'altro. */
function rnd(i, k) {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function createDustRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const card = createProgram(
    gl,
    QUAD_VERT,
    CARD_FRAG,
    ['uTex', 'uRect', 'uGrid', 'uProgress', 'uLife', 'uRange', 'uHeatBand', 'uGlow', 'uColor', ...SWEEP_UNIFORMS],
    ['aPos'],
  );
  const grains = createProgram(
    gl,
    GRAIN_VERT,
    GRAIN_FRAG,
    ['uRect', 'uProgress', 'uLife', 'uAspect', 'uWind', 'uSpread', 'uRadial', 'uBurst', 'uDistance', 'uTurb', 'uLift', 'uGrainPx', 'uColor', 'uColorShift', 'uGlow'],
    ['aHome', 'aColor', 'aRand', 'aRelease'],
  );
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const rangeOf = createSweepRangeCache();
  const buf = gl.createBuffer();
  let pixels = null; // { data, width, height }
  let grid = null; // { key, cols, rows, count }

  /** Una cella per granello: colore preso dal centro della cella nella foto. */
  function buildGrains(params, aspect, range, cssW, cssH) {
    const cols = Math.max(4, Math.round(cssW / params.grain));
    const rows = Math.max(4, Math.round(cssH / params.grain));
    const sweep = sweepOf(params);
    const key = [cols, rows, range.min, range.max, sweep.direction, sweep.originX, sweep.originY, sweep.seed, sweep.scale, sweep.amount].join('|');
    if (grid && grid.key === key) return;
    const stride = 10; // home(2) color(4) rand(3) release(1)
    const data = new Float32Array(cols * rows * stride);
    let n = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const hx = (c + 0.5) / cols;
        const hy = (r + 0.5) / rows;
        const px = Math.min(pixels.width - 1, Math.floor(hx * pixels.width));
        const py = Math.min(pixels.height - 1, Math.floor(hy * pixels.height));
        const o = (py * pixels.width + px) * 4;
        const alpha = pixels.data[o + 3] / 255;
        if (alpha < 0.05) continue;
        const idx = r * cols + c;
        const s = (sweepBaseAt(hx, hy, sweep, aspect) - range.min) / Math.max(range.max - range.min, 1e-4);
        const off = n * stride;
        data[off] = hx;
        data[off + 1] = hy;
        data[off + 2] = pixels.data[o] / 255;
        data[off + 3] = pixels.data[o + 1] / 255;
        data[off + 4] = pixels.data[o + 2] / 255;
        data[off + 5] = alpha;
        data[off + 6] = rnd(idx, 1);
        data[off + 7] = rnd(idx, 2);
        data[off + 8] = rnd(idx, 3);
        data[off + 9] = Math.max(0, Math.min(1, s));
        n += 1;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * stride), gl.STATIC_DRAW);
    grid = { key, cols, rows, count: n };
  }

  return {
    setSource(src) {
      source.upload(src);
      const ctx = src.getContext?.('2d');
      if (ctx) {
        const img = ctx.getImageData(0, 0, src.width, src.height);
        pixels = { data: img.data, width: src.width, height: src.height };
      }
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!pixels) return;
      const { params, rect, aspect } = state;
      const sweep = sweepOf(params);
      const range = rangeOf(sweep, aspect);
      const cssW = (rect[2] * canvas.width) / state.dpr;
      const cssH = (rect[3] * canvas.height) / state.dpr;
      buildGrains(params, aspect, range, cssW, cssH);
      const color = hexToRgb01(params.color);
      const life = Math.max(0.05, Math.min(0.95, params.life));

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(card.prog);
      source.bind(0);
      gl.uniform1i(card.u.uTex, 0);
      gl.uniform4f(card.u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform2f(card.u.uGrid, grid.cols, grid.rows);
      gl.uniform1f(card.u.uProgress, state.progress);
      gl.uniform1f(card.u.uLife, life);
      gl.uniform2f(card.u.uRange, range.min, range.max);
      gl.uniform1f(card.u.uHeatBand, params.heatBand);
      gl.uniform1f(card.u.uGlow, params.glow * (state.progress > 0 ? 1 : 0));
      gl.uniform3f(card.u.uColor, color[0], color[1], color[2]);
      setSweepUniforms(gl, card.u, sweep, aspect);
      quad.draw(card.a.aPos);

      if (state.progress <= 0 || grid.count === 0) return;
      const rad = (params.windAngle * Math.PI) / 180;
      gl.useProgram(grains.prog);
      gl.uniform4f(grains.u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(grains.u.uProgress, state.progress);
      gl.uniform1f(grains.u.uLife, life);
      gl.uniform1f(grains.u.uAspect, aspect);
      gl.uniform2f(grains.u.uWind, Math.cos(rad), Math.sin(rad));
      gl.uniform1f(grains.u.uSpread, params.spread);
      gl.uniform1f(grains.u.uRadial, params.radial);
      const burst = params.direction === 'point' ? [params.originX, params.originY] : [0.5, 0.5];
      gl.uniform2f(grains.u.uBurst, burst[0], burst[1]);
      gl.uniform1f(grains.u.uDistance, params.distance);
      gl.uniform1f(grains.u.uTurb, params.turbulence);
      gl.uniform1f(grains.u.uLift, params.lift);
      gl.uniform1f(grains.u.uGrainPx, params.grain * state.dpr);
      gl.uniform3f(grains.u.uColor, color[0], color[1], color[2]);
      gl.uniform1f(grains.u.uColorShift, params.colorShift);
      gl.uniform1f(grains.u.uGlow, params.glow);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = 10 * 4;
      const { a } = grains;
      gl.enableVertexAttribArray(a.aHome);
      gl.vertexAttribPointer(a.aHome, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(a.aColor);
      gl.vertexAttribPointer(a.aColor, 4, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(a.aRand);
      gl.vertexAttribPointer(a.aRand, 3, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(a.aRelease);
      gl.vertexAttribPointer(a.aRelease, 1, gl.FLOAT, false, stride, 36);
      gl.drawArrays(gl.POINTS, 0, grid.count);
      gl.disableVertexAttribArray(a.aHome);
      gl.disableVertexAttribArray(a.aColor);
      gl.disableVertexAttribArray(a.aRand);
      gl.disableVertexAttribArray(a.aRelease);
    },
    busy() {
      return false;
    },
    dispose() {
      gl.deleteBuffer(buf);
      gl.deleteTexture(source.tex);
      gl.deleteBuffer(quad.buf);
      gl.deleteProgram(card.prog);
      gl.deleteProgram(grains.prog);
      loseContext(gl);
    },
  };
}

export const dustEffect = {
  id: 'dust',
  label: 'Disintegrazione',
  kind: 'out',
  description: 'La carta si sbriciola in granelli portati via da un vento cosmico.',
  defaults: DUST_DEFAULTS,
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.75, right: m * 0.75, top: m * 0.75, bottom: m * 0.35 };
  },
  createRenderer: createDustRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['grain', 'Granello (px)', 1.5, 8, 0.5],
    ['life', 'Durata volo', 0.15, 0.85, 0.01],
    ['distance', 'Distanza', 0.2, 2, 0.01],
    ['windAngle', 'Vento (gradi)', -180, 180, 1],
    ['spread', 'Dispersione', 0, 2, 0.01],
    ['radial', 'Radiale', 0, 1, 0.01],
    ['turbulence', 'Mulinello', 0, 0.3, 0.005],
    ['lift', 'Spinta in alto', -0.5, 1, 0.01],
    ['colorShift', 'Colore armata', 0, 1, 0.01],
    ['glow', 'Bagliore', 0, 2, 0.01],
    ['heatBand', 'Fascia calda', 0, 0.3, 0.005],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    vento: { label: 'Vento cosmico', params: {} },
    schiocco: {
      label: 'Schiocco di dita',
      params: { durationMs: 3200, grain: 2, life: 0.6, distance: 1.2, windAngle: -15, spread: 0.45, turbulence: 0.08, lift: 0.15, colorShift: 0.35, glow: 0.3, heatBand: 0.02, direction: 'scatter', sweepScale: 3, sweepAmount: 1 },
    },
    cenere: {
      label: 'Cenere che cade',
      params: { durationMs: 2600, grain: 3, life: 0.5, distance: 0.7, windAngle: 95, spread: 0.35, turbulence: 0.12, lift: -0.3, colorShift: 0.5, glow: 0.6, heatBand: 0.05, direction: 'top', sweepScale: 5, sweepAmount: 0.5 },
    },
    esplosione: {
      label: 'Esplosione',
      params: { durationMs: 1300, grain: 3.5, life: 0.75, distance: 1.6, windAngle: -90, spread: 0.25, radial: 1, turbulence: 0.02, lift: 0, colorShift: 0.9, glow: 1.6, heatBand: 0.1, direction: 'center', sweepScale: 4, sweepAmount: 0.3 },
    },
  },
};
