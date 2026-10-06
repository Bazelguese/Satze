// Kethran · «Fenice» (entrata): un cumulo di cenere ai piedi della carta si solleva in
// granelli che prendono fuoco d'oro e tornano al loro posto, ricomponendo la carta dal
// basso; sopra la parte già rinata danzano fiamme e faville. «Dalla cenere, più forti.»

import {
  QUAD_VERT,
  clearCanvas,
  createFullscreenQuad,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
} from '../../glUtils.js';
import { NOISE_GLSL, SWEEP_GLSL, SWEEP_UNIFORMS, createSweepRangeCache, setSweepUniforms, sweepBaseAt } from '../../fxNoise.js';
import { createEmberLayer, createSpawnClock } from '../../emberLayer.js';
import { SWEEP_DIRECTIONS, sweepOf } from './common.js';

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
uniform float uFlameBand;
uniform float uFlame;
uniform float uTime;
uniform vec3 uColor;
${NOISE_GLSL}
${SWEEP_GLSL}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec2 cell = (floor(p * uGrid) + 0.5) / uGrid;
  float s = clamp((sweepBase(cell) - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
  float arrive = s * (1.0 - uLife) + uLife; // quando il granello di questa cella è tornato
  float since = uProgress - arrive;
  vec4 tex = texture2D(uTex, p);
  vec3 hot = mix(uColor, vec3(1.0, 0.95, 0.8), 0.45);
  if (since < 0.0) {
    // ancora da ricomporre: lingue di fuoco appena sopra la parte rinata
    float until = -since;
    float f = (1.0 - smoothstep(0.0, uFlameBand, until)) * step(0.001, uProgress);
    float tongue = fbm(vec2(p.x * 9.0, p.y * 5.0 + uTime * 2.4));
    f *= smoothstep(0.35, 0.75, tongue + (1.0 - until / max(uFlameBand, 1e-3)) * 0.4);
    float a = f * uFlame * 0.85 * step(0.05, tex.a + 0.06);
    gl_FragColor = vec4(hot * a, a);
    return;
  }
  // appena rinata: brucia d'oro e poi si raffredda nei suoi colori
  float heat = 1.0 - smoothstep(0.0, uHeatBand, since);
  vec3 col = tex.rgb + hot * heat * tex.a * 0.9;
  gl_FragColor = vec4(min(col, vec3(tex.a)), tex.a);
}
`;

const GRAIN_VERT = `
attribute vec2 aHome;
attribute vec4 aColor;
attribute vec3 aRand;
attribute float aStart;
uniform vec4 uRect;
uniform float uProgress;
uniform float uLife;
uniform float uSpread;
uniform float uRise;
uniform float uGrainPx;
uniform vec3 uColor;
varying vec4 vColor;

void main() {
  float age = (uProgress - aStart * (1.0 - uLife)) / uLife;
  if (age >= 1.0 || aColor.a < 0.05) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vColor = vec4(0.0);
    return;
  }
  float a = clamp(age, 0.0, 1.0);
  // cumulo di cenere ai piedi della carta
  vec2 heap = vec2(0.5 + (aRand.x - 0.5) * uSpread, 1.03 + aRand.y * 0.1);
  float e = 1.0 - pow(1.0 - a, 2.4);
  vec2 pos = mix(heap, aHome, e);
  // sale come una fiamma: un arco verso l'alto e un ondeggio laterale
  pos.y -= sin(a * 3.14159) * uRise * (0.4 + aRand.z * 0.6);
  pos.x += sin(a * 9.0 + aRand.x * 6.283) * 0.03 * (1.0 - a);
  vec2 cv = uRect.xy + pos * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  gl_PointSize = uGrainPx * mix(0.55 + aRand.y * 0.4, 1.05, smoothstep(0.6, 1.0, a));

  vec3 ash = vec3(0.32, 0.29, 0.27);
  vec3 fire = mix(uColor, vec3(1.0, 0.93, 0.75), 0.5);
  vec3 c = mix(ash, fire, smoothstep(0.0, 0.25, a));
  c = mix(c, aColor.rgb, smoothstep(0.7, 1.0, a));
  float alpha = aColor.a * mix(0.55, 1.0, smoothstep(0.0, 0.2, a));
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

function rnd(i, k) {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function createPhoenixRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const card = createProgram(
    gl,
    QUAD_VERT,
    CARD_FRAG,
    ['uTex', 'uRect', 'uGrid', 'uProgress', 'uLife', 'uRange', 'uHeatBand', 'uFlameBand', 'uFlame', 'uTime', 'uColor', ...SWEEP_UNIFORMS],
    ['aPos'],
  );
  const grains = createProgram(gl, GRAIN_VERT, GRAIN_FRAG, ['uRect', 'uProgress', 'uLife', 'uSpread', 'uRise', 'uGrainPx', 'uColor'], ['aHome', 'aColor', 'aRand', 'aStart']);
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl, 500);
  const clock = createSpawnClock();
  const rangeOf = createSweepRangeCache();
  const buf = gl.createBuffer();
  let pixels = null;
  let grid = null;

  function build(params, aspect, range, sweep, cssW, cssH) {
    const cols = Math.max(4, Math.round(cssW / params.grain));
    const rows = Math.max(4, Math.round(cssH / params.grain));
    const key = [cols, rows, range.min, range.max, sweep.direction, sweep.originX, sweep.originY, sweep.seed, sweep.scale, sweep.amount].join('|');
    if (grid && grid.key === key) return;
    const stride = 10;
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
        data.set([hx, hy, pixels.data[o] / 255, pixels.data[o + 1] / 255, pixels.data[o + 2] / 255, alpha, rnd(idx, 1), rnd(idx, 2), rnd(idx, 3), Math.max(0, Math.min(1, s))], off);
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
      const color = hexToRgb01(params.color);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (!state.done) {
        const sweep = sweepOf(params);
        const range = rangeOf(sweep, aspect);
        const cssW = (rect[2] * canvas.width) / state.dpr;
        const cssH = (rect[3] * canvas.height) / state.dpr;
        build(params, aspect, range, sweep, cssW, cssH);
        const life = Math.max(0.1, Math.min(0.9, params.life));

        gl.useProgram(card.prog);
        source.bind(0);
        gl.uniform1i(card.u.uTex, 0);
        gl.uniform4f(card.u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform2f(card.u.uGrid, grid.cols, grid.rows);
        gl.uniform1f(card.u.uProgress, state.progress);
        gl.uniform1f(card.u.uLife, life);
        gl.uniform2f(card.u.uRange, range.min, range.max);
        gl.uniform1f(card.u.uHeatBand, params.heatBand);
        gl.uniform1f(card.u.uFlameBand, params.flameBand);
        gl.uniform1f(card.u.uFlame, params.flame);
        gl.uniform1f(card.u.uTime, state.time);
        gl.uniform3f(card.u.uColor, color[0], color[1], color[2]);
        setSweepUniforms(gl, card.u, sweep, aspect);
        quad.draw(card.a.aPos);

        gl.useProgram(grains.prog);
        gl.uniform4f(grains.u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform1f(grains.u.uProgress, state.progress);
        gl.uniform1f(grains.u.uLife, life);
        gl.uniform1f(grains.u.uSpread, params.heapSpread);
        gl.uniform1f(grains.u.uRise, params.rise);
        gl.uniform1f(grains.u.uGrainPx, params.grain * state.dpr);
        gl.uniform3f(grains.u.uColor, color[0], color[1], color[2]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        const stride = 40;
        const { a } = grains;
        gl.enableVertexAttribArray(a.aHome);
        gl.vertexAttribPointer(a.aHome, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(a.aColor);
        gl.vertexAttribPointer(a.aColor, 4, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(a.aRand);
        gl.vertexAttribPointer(a.aRand, 3, gl.FLOAT, false, stride, 24);
        gl.enableVertexAttribArray(a.aStart);
        gl.vertexAttribPointer(a.aStart, 1, gl.FLOAT, false, stride, 36);
        gl.drawArrays(gl.POINTS, 0, grid.count);
        [a.aHome, a.aColor, a.aRand, a.aStart].forEach((l) => gl.disableVertexAttribArray(l));

        // faville dal fronte che si ricompone
        const front = Math.max(0, Math.min(1, (state.progress - life) / Math.max(1 - life, 1e-3)));
        const n = clock(params.embers * state.active, state.dt);
        for (let i = 0; i < n; i += 1) {
          const x = Math.random();
          // fronte all'incirca: dove il campo vale `front` (dal basso: y = 1 - front)
          const y = sweep.direction === 'bottom' ? 1 - front + (Math.random() - 0.5) * 0.1 : Math.random();
          embers.spawn(rect[0] + x * rect[2], rect[1] + Math.max(0, Math.min(1, y)) * rect[3], {
            heat: 0.5 + Math.random() * 0.5,
          });
        }
      }
      embers.step(state.dt);
      embers.draw(color, state.dpr);
    },
    busy() {
      return embers.count > 0;
    },
    dispose() {
      embers.dispose();
      gl.deleteBuffer(buf);
      gl.deleteTexture(source.tex);
      gl.deleteBuffer(quad.buf);
      gl.deleteProgram(card.prog);
      gl.deleteProgram(grains.prog);
      loseContext(gl);
    },
  };
}

export const kethranEffect = {
  id: 'kethran-fenice',
  army: 'Kethran',
  label: 'Fenice',
  kind: 'in',
  description: 'Entrata: la carta rinasce dalla cenere, granello per granello, nel fuoco d\'oro.',
  defaults: {
    durationMs: 2600,
    color: '#eebf3c',
    grain: 2.5,
    life: 0.5,
    heapSpread: 1.1,
    rise: 0.35,
    heatBand: 0.14,
    flameBand: 0.07,
    flame: 1,
    embers: 90,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3.5,
    sweepAmount: 0.35,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.45, right: m * 0.45, top: m * 0.45, bottom: m * 0.3 };
  },
  createRenderer: createPhoenixRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['grain', 'Granello (px)', 1.5, 8, 0.5],
    ['life', 'Durata volo', 0.15, 0.85, 0.01],
    ['heapSpread', 'Ampiezza cumulo', 0.2, 2, 0.01],
    ['rise', 'Arco di salita', 0, 1, 0.01],
    ['heatBand', 'Calore', 0.01, 0.4, 0.005],
    ['flameBand', 'Fascia fiamme', 0, 0.2, 0.005],
    ['flame', 'Fiamme', 0, 2, 0.01],
    ['embers', 'Faville / s', 0, 300, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    fenice: { label: 'Fenice', params: {} },
    rimonta: { label: 'Rimonta furiosa', params: { durationMs: 1600, life: 0.4, rise: 0.6, heatBand: 0.22, flameBand: 0.12, flame: 1.6, embers: 220 } },
  },
};
