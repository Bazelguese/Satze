// Renderer generico «a tutto canvas»: un fragment shader disegna la carta trasformata,
// sopra si possono aggiungere faville (soft) e particelle con forma (flake).
// Gli effetti forniscono solo lo shader, le uniform e l'eventuale logica delle particelle.

import {
  QUAD_VERT,
  clearCanvas,
  createFullscreenQuad,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
} from './glUtils.js';
import { NOISE_GLSL, SWEEP_GLSL, SWEEP_UNIFORMS, createSweepRangeCache, sweepDirection } from './fxNoise.js';
import { createEmberLayer, createSpawnClock } from './emberLayer.js';
import { createFlakeLayer, readSnapshotPixels } from './flakeLayer.js';

/** Intestazione comune degli shader: uniform di base, rumore e campo di avanzamento. */
export const QUAD_HEADER = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform vec2 uTexel;
uniform float uProgress;
uniform float uActive;
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uRange;
${NOISE_GLSL}
${SWEEP_GLSL}

float sq(float x) { return x * x; } // pow(x, 2.0) è indefinito per x < 0

vec2 rot2(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

/** Campo di avanzamento normalizzato 0-1 sull'elemento. */
float sweepN(vec2 p) {
  return clamp((sweepBase(p) - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
}

vec4 cardAt(vec2 p) {
  float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);
  return texture2D(uTex, clamp(p, 0.0, 1.0)) * inside;
}

/** Uscita premoltiplicata sicura (rgb ≤ alpha). */
vec4 outColor(vec3 c, float a) {
  a = clamp(a, 0.0, 1.0);
  return vec4(min(c, vec3(a)), a);
}
`;

const BASE_UNIFORMS = ['uTex', 'uRect', 'uTexel', 'uProgress', 'uActive', 'uTime', 'uColor', 'uRange', ...SWEEP_UNIFORMS];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   frag: string,
 *   uniforms?: string[],
 *   sweep?: (params: object) => object,
 *   bind?: (gl, u, state, env) => void,
 *   particles?: (state, env) => void,
 *   needsPixels?: boolean,
 *   maxEmbers?: number,
 *   maxFlakes?: number,
 * }} spec
 */
export function createQuadFxRenderer(canvas, spec) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(gl, QUAD_VERT, spec.frag, [...BASE_UNIFORMS, ...(spec.uniforms || [])], ['aPos']);
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl, spec.maxEmbers ?? 600);
  const flakes = createFlakeLayer(gl, spec.maxFlakes ?? 1500);
  const rangeOf = createSweepRangeCache();
  const env = {
    gl,
    canvas,
    embers,
    flakes,
    clock: createSpawnClock(),
    clock2: createSpawnClock(),
    pixels: null,
    texel: [1 / 460, 1 / 660],
    memo: {},
  };
  let hasSource = false;

  return {
    setSource(src) {
      source.upload(src);
      env.texel = [1 / Math.max(1, src.width), 1 / Math.max(1, src.height)];
      if (spec.needsPixels) env.pixels = readSnapshotPixels(src);
      hasSource = true;
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!hasSource) return;
      const { params, rect, aspect } = state;
      const color = hexToRgb01(params.color);
      env.color = color;
      const sweep = spec.sweep ? spec.sweep(params) : null;
      const range = sweep ? rangeOf(sweep, aspect) : { min: 0, max: 1 };
      env.sweep = sweep;
      env.range = range;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (!state.hideCard) {
        gl.useProgram(prog);
        source.bind(0);
        gl.uniform1i(u.uTex, 0);
        gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform2f(u.uTexel, env.texel[0], env.texel[1]);
        gl.uniform1f(u.uProgress, state.progress);
        gl.uniform1f(u.uActive, state.active);
        gl.uniform1f(u.uTime, state.time);
        gl.uniform3f(u.uColor, color[0], color[1], color[2]);
        gl.uniform2f(u.uRange, range.min, range.max);
        if (sweep) {
          const dir = sweepUniformsFor(sweep);
          gl.uniform2f(u.uDir, dir.dir[0], dir.dir[1]);
          gl.uniform1f(u.uMode, dir.mode);
          gl.uniform2f(u.uOrigin, dir.origin[0], dir.origin[1]);
          gl.uniform1f(u.uSeed, sweep.seed);
          gl.uniform1f(u.uSweepScale, sweep.scale);
          gl.uniform1f(u.uSweepAmount, sweep.amount);
        }
        gl.uniform1f(u.uAspect, aspect);
        spec.bind?.(gl, u, state, env);
        quad.draw(a.aPos);
      }
      spec.particles?.(state, env);
      embers.draw(color, state.dpr);
      flakes.draw(state.dpr);
    },
    busy() {
      return embers.count > 0 || flakes.count > 0;
    },
    dispose() {
      embers.dispose();
      flakes.dispose();
      gl.deleteTexture(source.tex);
      gl.deleteBuffer(quad.buf);
      gl.deleteProgram(prog);
      loseContext(gl);
    },
  };
}

/** Modalità, verso e origine del campo di avanzamento (come setSweepUniforms). */
function sweepUniformsFor(sweep) {
  const info = sweepDirection(sweep.direction);
  return { mode: info.mode, dir: info.dir, origin: info.origin || [sweep.originX, sweep.originY] };
}

/** Da uv dell'elemento a uv del canvas. */
export function toCanvasUv(rect, x, y) {
  return [rect[0] + x * rect[2], rect[1] + y * rect[3]];
}

/** Punto casuale dell'elemento (con alpha della foto > soglia, se ci sono i pixel). */
export function randomCardPoint(env, minAlpha = 0.2, tries = 8) {
  for (let i = 0; i < tries; i += 1) {
    const x = Math.random();
    const y = Math.random();
    if (!env.pixels || env.pixels.at(x, y)[3] > minAlpha) return [x, y];
  }
  return [Math.random(), Math.random()];
}
