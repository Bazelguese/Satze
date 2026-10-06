// Particelle con forma e rotazione (coriandoli, foglie, pixel, lustrini, scaglie):
// punti con una maschera ruotata nel fragment shader, colore per particella.
// Chi lo usa decide nascita e moto; qui c'è la fisica di base (gravità, attrito, svolazzo).

import { createProgram } from './glUtils.js';

const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aAlpha;
attribute float aAngle;
attribute vec3 aColor;
attribute float aShape;
attribute float aFlip;
varying float vAlpha;
varying float vAngle;
varying vec3 vColor;
varying float vShape;
varying float vFlip;
void main() {
  vAlpha = aAlpha;
  vAngle = aAngle;
  vColor = aColor;
  vShape = aShape;
  vFlip = aFlip;
  gl_PointSize = aSize;
  gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
}
`;

// forme: 0 rettangolo (coriandolo) · 1 foglia · 2 cerchio (lustrino) · 3 quadrato (pixel) · 4 scheggia
const FRAG = `
precision mediump float;
varying float vAlpha;
varying float vAngle;
varying vec3 vColor;
varying float vShape;
varying float vFlip;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  // svolazzo: la particella si «gira» e si assottiglia
  p.x /= max(abs(vFlip), 0.12);
  float m;
  if (vShape < 0.5) {
    m = step(abs(p.x), 0.22) * step(abs(p.y), 0.42);
  } else if (vShape < 1.5) {
    float w = 0.28 * (1.0 - (p.y + 0.5) * (p.y + 0.5) * 0.9);
    m = step(abs(p.x), max(w, 0.0)) * step(abs(p.y), 0.46);
  } else if (vShape < 2.5) {
    m = 1.0 - smoothstep(0.32, 0.4, length(p));
  } else if (vShape < 3.5) {
    m = step(abs(p.x), 0.4) * step(abs(p.y), 0.4);
  } else {
    m = step(abs(p.x) * 0.9 + abs(p.y) * 0.5, 0.3);
  }
  // luce che scorre sulla faccia quando gira
  float shine = 0.75 + 0.25 * vFlip;
  float a = m * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * shine * a, a);
}
`;

const STRIDE = 10; // x y size alpha angle r g b shape flip

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} [max]
 */
export function createFlakeLayer(gl, max = 1500) {
  const { prog, a } = createProgram(gl, VERT, FRAG, [], ['aPos', 'aSize', 'aAlpha', 'aAngle', 'aColor', 'aShape', 'aFlip']);
  const buf = gl.createBuffer();
  const data = new Float32Array(max * STRIDE);
  let flakes = [];

  /**
   * Nuova particella in uv del canvas. opts: vx, vy (uv/s), life (s), size (px CSS),
   * color [r,g,b] 0-1, shape (0-4), spin (rad/s), gravity (uv/s²), drag, flutter.
   */
  function spawn(x, y, opts = {}) {
    if (flakes.length >= max) return;
    flakes.push({
      x,
      y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life: opts.life ?? 1.2,
      age: 0,
      size: opts.size ?? 6,
      color: opts.color ?? [1, 1, 1],
      shape: opts.shape ?? 0,
      angle: opts.angle ?? Math.random() * Math.PI * 2,
      spin: opts.spin ?? (Math.random() - 0.5) * 8,
      gravity: opts.gravity ?? 0.4,
      drag: opts.drag ?? 0.6,
      flutter: opts.flutter ?? 6 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      fadeIn: opts.fadeIn ?? 0.05,
    });
  }

  function step(dt, update) {
    const next = [];
    for (const f of flakes) {
      f.age += dt;
      if (f.age >= f.life) continue;
      if (update) {
        update(f, dt);
      } else {
        f.vy += f.gravity * dt;
        const k = Math.exp(-f.drag * dt);
        f.vx *= k;
        f.vy *= k;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      }
      f.angle += f.spin * dt;
      next.push(f);
    }
    flakes = next;
  }

  function draw(dpr = 1) {
    if (!flakes.length) return;
    let n = 0;
    for (const f of flakes) {
      const k = f.age / f.life;
      const off = n * STRIDE;
      data[off] = f.x;
      data[off + 1] = f.y;
      data[off + 2] = f.size * dpr;
      data[off + 3] = Math.min(1, (1 - k) * 2.2) * Math.min(1, f.age / Math.max(f.fadeIn, 1e-3));
      data[off + 4] = f.angle;
      data[off + 5] = f.color[0];
      data[off + 6] = f.color[1];
      data[off + 7] = f.color[2];
      data[off + 8] = f.shape;
      data[off + 9] = Math.cos(f.phase + f.age * f.flutter);
      n += 1;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * STRIDE), gl.DYNAMIC_DRAW);
    const stride = STRIDE * 4;
    const attr = (loc, size, offset) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    };
    attr(a.aPos, 2, 0);
    attr(a.aSize, 1, 8);
    attr(a.aAlpha, 1, 12);
    attr(a.aAngle, 1, 16);
    attr(a.aColor, 3, 20);
    attr(a.aShape, 1, 32);
    attr(a.aFlip, 1, 36);
    gl.drawArrays(gl.POINTS, 0, n);
    [a.aPos, a.aSize, a.aAlpha, a.aAngle, a.aColor, a.aShape, a.aFlip].forEach((loc) => gl.disableVertexAttribArray(loc));
  }

  return {
    spawn,
    step,
    draw,
    reset() {
      flakes = [];
    },
    get count() {
      return flakes.length;
    },
    dispose() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}

/** Colore [r,g,b] 0-1 dei pixel della foto (per particelle che «sono» la carta). */
export function readSnapshotPixels(src) {
  const ctx = src?.getContext?.('2d');
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, src.width, src.height);
  return {
    width: src.width,
    height: src.height,
    /** colore e alpha al punto (u,v) 0-1 */
    at(u, v) {
      const x = Math.min(src.width - 1, Math.max(0, Math.floor(u * src.width)));
      const y = Math.min(src.height - 1, Math.max(0, Math.floor(v * src.height)));
      const o = (y * src.width + x) * 4;
      return [img.data[o] / 255, img.data[o + 1] / 255, img.data[o + 2] / 255, img.data[o + 3] / 255];
    },
  };
}
