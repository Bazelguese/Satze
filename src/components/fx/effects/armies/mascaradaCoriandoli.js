// Mascarada · «Coriandoli» (ingresso): la carta si compone da coriandoli e lustrini che
// arrivano svolazzando da ogni parte e si posano al loro posto, come i granelli della
// Fenice; mentre si posano prendono il colore della carta. «Il pubblico paga. Tu riscuoti.»

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
uniform float uTime;
${NOISE_GLSL}
${SWEEP_GLSL}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec2 cell = (floor(p * uGrid) + 0.5) / uGrid;
  float s = clamp((sweepBase(cell) - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
  float arrive = s * (1.0 - uLife) + uLife;
  vec4 tex = texture2D(uTex, p);
  // la cella compare quando il suo coriandolo si è posato
  float on = step(arrive, uProgress);
  gl_FragColor = tex * on;
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
uniform float uGrainPx;
uniform float uTime;
uniform vec3 uStage[4];
varying vec4 vColor;
varying float vAngle;
varying float vFlip;
varying float vShape;

void main() {
  float age = (uProgress - aStart * (1.0 - uLife)) / uLife;
  if (age >= 1.0 || aColor.a < 0.05) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vColor = vec4(0.0);
    return;
  }
  float a = clamp(age, 0.0, 1.0);
  // partenza: tutt'attorno alla carta, un po' più dall'alto
  float ang = aRand.x * 6.2832;
  vec2 from = vec2(0.5, 0.4) + vec2(cos(ang), sin(ang) * 0.8 - 0.25) * uSpread * (0.7 + aRand.y * 0.5);
  float e = 1.0 - pow(1.0 - a, 2.6);
  vec2 pos = mix(from, aHome, e);
  // svolazzo laterale che si smorza all'arrivo
  pos.x += sin(a * 10.0 + aRand.z * 6.283) * 0.04 * (1.0 - a);
  pos.y += cos(a * 8.0 + aRand.x * 6.283) * 0.02 * (1.0 - a);
  vec2 cv = uRect.xy + pos * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  gl_PointSize = uGrainPx * mix(1.6, 1.0, smoothstep(0.7, 1.0, a));
  int k = int(floor(aRand.y * 3.99));
  vec3 stage = k == 0 ? uStage[0] : (k == 1 ? uStage[1] : (k == 2 ? uStage[2] : uStage[3]));
  // solo una parte dei coriandoli è nei colori di scena; gli altri hanno già quello della carta
  vec3 c = aRand.z < 0.35 ? mix(stage, aColor.rgb, smoothstep(0.45, 0.9, a)) : aColor.rgb;
  float alpha = aColor.a * smoothstep(0.0, 0.08, a);
  vColor = vec4(c * alpha, alpha);
  vAngle = aRand.z * 6.283 + a * 9.0 * (1.0 - a);
  vFlip = mix(cos(a * 18.0 + aRand.x * 6.0), 1.0, smoothstep(0.75, 1.0, a));
  vShape = step(0.8, aRand.z);
}
`;

const GRAIN_FRAG = `
precision mediump float;
varying vec4 vColor;
varying float vAngle;
varying float vFlip;
varying float vShape;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  p.x /= max(abs(vFlip), 0.15);
  // coriandolo rettangolare o lustrino tondo
  float m = vShape > 0.5 ? 1.0 - smoothstep(0.38, 0.45, length(p)) : step(abs(p.x), 0.32) * step(abs(p.y), 0.46);
  if (m < 0.01) discard;
  float shine = 0.8 + 0.2 * vFlip;
  gl_FragColor = vec4(vColor.rgb * shine, vColor.a) * m;
}
`;

function rnd(i, k) {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const STAGE = [
  [1, 0.84, 0.3],
  [0.95, 0.35, 0.75],
  [1, 1, 1],
];

function createConfettiRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const card = createProgram(gl, QUAD_VERT, CARD_FRAG, ['uTex', 'uRect', 'uGrid', 'uProgress', 'uLife', 'uRange', 'uTime', ...SWEEP_UNIFORMS], ['aPos']);
  const grains = createProgram(gl, GRAIN_VERT, GRAIN_FRAG, ['uRect', 'uProgress', 'uLife', 'uSpread', 'uGrainPx', 'uTime', 'uStage'], ['aHome', 'aColor', 'aRand', 'aStart']);
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl, 400);
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
        data.set([hx, hy, pixels.data[o] / 255, pixels.data[o + 1] / 255, pixels.data[o + 2] / 255, alpha, rnd(idx, 1), rnd(idx, 2), rnd(idx, 3), Math.max(0, Math.min(1, s))], n * stride);
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
        const life = Math.max(0.15, Math.min(0.9, params.life));

        gl.useProgram(card.prog);
        source.bind(0);
        gl.uniform1i(card.u.uTex, 0);
        gl.uniform4f(card.u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform2f(card.u.uGrid, grid.cols, grid.rows);
        gl.uniform1f(card.u.uProgress, state.progress);
        gl.uniform1f(card.u.uLife, life);
        gl.uniform2f(card.u.uRange, range.min, range.max);
        gl.uniform1f(card.u.uTime, state.time);
        setSweepUniforms(gl, card.u, sweep, aspect);
        quad.draw(card.a.aPos);

        gl.useProgram(grains.prog);
        gl.uniform4f(grains.u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform1f(grains.u.uProgress, state.progress);
        gl.uniform1f(grains.u.uLife, life);
        gl.uniform1f(grains.u.uSpread, params.spread);
        gl.uniform1f(grains.u.uGrainPx, params.grain * state.dpr);
        gl.uniform1f(grains.u.uTime, state.time);
        gl.uniform3fv(grains.u.uStage, new Float32Array([...color, ...STAGE.flat()]));
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

        // qualche lustrino che brilla sulla carta mentre si compone
        const n = clock(params.sparkle * state.active, state.dt);
        for (let i = 0; i < n; i += 1) {
          embers.spawn(rect[0] + Math.random() * rect[2], rect[1] + Math.random() * rect[3], { vx: 0, vy: 0, life: 0.2 + Math.random() * 0.3, size: 1.5 + Math.random() * 2, heat: 1, rise: 0 });
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

export const mascaradaCoriandoliEffect = {
  id: 'mascarada-coriandoli',
  army: 'Mascarada',
  role: 'entry',
  label: 'Coriandoli',
  kind: 'in',
  description: 'La carta si compone da coriandoli e lustrini che arrivano svolazzando e si posano al loro posto.',
  defaults: {
    durationMs: 2600,
    color: '#437ef2',
    grain: 7,
    life: 0.5,
    spread: 0.55,
    sparkle: 20,
    direction: 'scatter',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.7,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.5, right: m * 0.5, top: m * 0.55, bottom: m * 0.3 };
  },
  createRenderer: createConfettiRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['grain', 'Misura coriandoli (px)', 2.5, 10, 0.5],
    ['life', 'Durata volo', 0.15, 0.85, 0.01],
    ['spread', 'Da quanto lontano', 0.3, 1.5, 0.01],
    ['sparkle', 'Luccichii / s', 0, 100, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    coriandoli: { label: 'Coriandoli', params: {} },
    pioggia: { label: 'Pioggia di lustrini', params: { durationMs: 3200, grain: 5, life: 0.6, spread: 0.9, sparkle: 50 } },
  },
};
