// Strato di faville/scintille condiviso: punti morbidi che si muovono in uv del canvas.
// Chi lo usa decide dove nascono (spawn) e, se vuole, come si muovono (update).

import { createProgram } from './glUtils.js';

const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aAlpha;
attribute float aHeat;
varying float vAlpha;
varying float vHeat;
void main() {
  vAlpha = aAlpha;
  vHeat = aHeat;
  gl_PointSize = aSize;
  gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying float vAlpha;
varying float vHeat;
uniform vec3 uColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  vec3 c = mix(uColor, vec3(1.0), vHeat * 0.7);
  gl_FragColor = vec4(c * a, a);
}
`;

const STRIDE = 5; // x, y, size, alpha, heat

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} [max]
 */
export function createEmberLayer(gl, max = 700) {
  const { prog, u, a } = createProgram(gl, VERT, FRAG, ['uColor'], ['aPos', 'aSize', 'aAlpha', 'aHeat']);
  const buf = gl.createBuffer();
  const data = new Float32Array(max * STRIDE);
  /** {x, y, vx, vy, life, age, size, heat, sway, ...extra} */
  let embers = [];

  /** Nuova favilla in uv del canvas; i campi mancanti hanno default da brace che sale. */
  function spawn(x, y, opts = {}) {
    if (embers.length >= max) return;
    embers.push({
      x,
      y,
      vx: opts.vx ?? (Math.random() - 0.5) * 0.06,
      vy: opts.vy ?? -(0.06 + Math.random() * 0.16),
      life: opts.life ?? 0.5 + Math.random() * 0.9,
      age: 0,
      size: opts.size ?? 1.4 + Math.random() * 3.2,
      heat: opts.heat ?? Math.random(),
      sway: Math.random() * Math.PI * 2,
      rise: opts.rise ?? 0.05,
      ...opts.extra,
    });
  }

  /**
   * Avanza di dt secondi. `update(e, dt)` sostituisce il moto di default
   * (salita accelerata con ondeggio) per effetti come le spirali del vortice.
   */
  function step(dt, update) {
    const next = [];
    for (const e of embers) {
      e.age += dt;
      if (e.age >= e.life) continue;
      if (update) {
        update(e, dt);
      } else {
        e.vy -= e.rise * dt;
        e.x += (e.vx + Math.sin(e.sway + e.age * 6) * 0.015) * dt;
        e.y += e.vy * dt;
      }
      next.push(e);
    }
    embers = next;
  }

  function draw(color, dpr = 1) {
    if (!embers.length) return;
    let n = 0;
    for (const e of embers) {
      const k = e.age / e.life;
      const off = n * STRIDE;
      data[off] = e.x;
      data[off + 1] = e.y;
      data[off + 2] = e.size * dpr * (1 - k * 0.6);
      data[off + 3] = Math.min(1, (1 - k) * 1.4) * (k < 0.08 ? k / 0.08 : 1);
      data[off + 4] = e.heat * (1 - k);
      n += 1;
    }
    gl.useProgram(prog);
    gl.uniform3f(u.uColor, color[0], color[1], color[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * STRIDE), gl.DYNAMIC_DRAW);
    const stride = STRIDE * 4;
    gl.enableVertexAttribArray(a.aPos);
    gl.vertexAttribPointer(a.aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(a.aSize);
    gl.vertexAttribPointer(a.aSize, 1, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(a.aAlpha);
    gl.vertexAttribPointer(a.aAlpha, 1, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(a.aHeat);
    gl.vertexAttribPointer(a.aHeat, 1, gl.FLOAT, false, stride, 16);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.disableVertexAttribArray(a.aPos);
    gl.disableVertexAttribArray(a.aSize);
    gl.disableVertexAttribArray(a.aAlpha);
    gl.disableVertexAttribArray(a.aHeat);
  }

  return {
    spawn,
    step,
    draw,
    reset() {
      embers = [];
    },
    get count() {
      return embers.length;
    },
    dispose() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}

/** Accumulatore per nascite a frequenza costante (n al secondo) indipendente dai fps. */
export function createSpawnClock() {
  let debt = 0;
  return (rate, dt) => {
    debt += rate * dt;
    const n = Math.floor(debt);
    debt -= n;
    if (debt > 1) debt = 1;
    return n;
  };
}
