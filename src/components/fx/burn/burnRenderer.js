// Renderer WebGL della bruciatura: disegna su un canvas la «foto» di un elemento
// (texture) consumata da un rumore a soglia, con fascia di fiamma, fascia carbonizzata,
// bagliore e faville. Nessuna dipendenza da React: lo usa BurnEffect, ma può
// servire ovunque ci sia un canvas e un'immagine da bruciare.

import { hexToRgb01 } from './burnParams.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // vUv con y verso il basso, come le coordinate della texture (UNPACK_FLIP_Y off)
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;      // elemento nel canvas (uv, y giù): x, y, w, h
uniform float uAspect;   // larghezza / altezza dell'elemento
uniform float uThreshold;
uniform float uActive;   // 0-1: fuoco acceso (bagliore)
uniform float uTime;
uniform vec3 uFlame;
uniform vec3 uOutline;
uniform float uThickness;
uniform float uFlamePct;
uniform float uOutlinePct;
uniform float uBurntAlpha;
uniform float uBurnNoiseScale;
uniform float uNoiseAmount;
uniform float uNoiseScale;
uniform float uWobble;
uniform float uJagged;
uniform float uSpeed;
uniform float uScale;
uniform float uSoftness;
uniform float uGlow;
uniform vec2 uDir;       // verso in cui avanza il fuoco (modalità lineare)
uniform float uMode;     // 0 lineare · 1 radiale da uOrigin · 2 sparso
uniform vec2 uOrigin;
uniform float uSeed;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amp *= 0.5;
  }
  return v / 0.9375;
}

// Campo di bruciatura: brucia dove field < uThreshold.
float burnField(vec2 p, vec2 q) {
  float d;
  if (uMode < 0.5) {
    float ext = abs(uDir.x) + abs(uDir.y);
    d = dot(p - 0.5, uDir) / max(ext, 1e-4) + 0.5;
  } else if (uMode < 1.5) {
    vec2 o = uOrigin;
    float m = max(
      max(length(vec2(o.x * uAspect, o.y)), length(vec2((1.0 - o.x) * uAspect, o.y))),
      max(length(vec2(o.x * uAspect, 1.0 - o.y)), length(vec2((1.0 - o.x) * uAspect, 1.0 - o.y)))
    );
    d = length(vec2((p.x - o.x) * uAspect, p.y - o.y)) / max(m, 1e-4);
  } else {
    d = 0.5;
  }
  float n = fbm(q * uBurnNoiseScale + vec2(mod(uSeed * 7.31, 61.0), mod(uSeed * 3.17, 53.0)));
  float amount = uMode > 1.5 ? 1.0 : uNoiseAmount;
  float base = mix(d, n, amount);
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
  float dist = burnField(p, q) - uThreshold;

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
  vec3 glowCol = uFlame * g;
  col += glowCol;
  alpha = max(alpha, min(1.0, alpha + g * max(uFlame.r, max(uFlame.g, uFlame.b))));

  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

const P_VERT = `
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

const P_FRAG = `
precision mediump float;
varying float vAlpha;
varying float vHeat;
uniform vec3 uFlame;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  vec3 c = mix(uFlame, vec3(1.0), vHeat * 0.7);
  gl_FragColor = vec4(c * a, a);
}
`;

// --- Copia JS del campo dello shader (stesse operazioni in float32) per far nascere
// le faville esattamente sulla fascia di fiamma, qualunque sia la direzione.
const f32 = Math.fround;
const fract = (x) => x - Math.floor(x);

function hashJs(x, y) {
  let px = fract(f32(x * 123.34));
  let py = fract(f32(y * 456.21));
  const d = f32(f32(px * f32(px + 45.32)) + f32(py * f32(py + 45.32)));
  px = f32(px + d);
  py = f32(py + d);
  return fract(f32(px * py));
}

function noiseJs(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hashJs(ix, iy);
  const b = hashJs(ix + 1, iy);
  const c = hashJs(ix, iy + 1);
  const d = hashJs(ix + 1, iy + 1);
  return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy;
}

function fbmJs(x, y) {
  let v = 0;
  let amp = 0.5;
  for (let i = 0; i < 4; i += 1) {
    v += amp * noiseJs(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.2;
    amp *= 0.5;
  }
  return v / 0.9375;
}

/** Stesso calcolo di burnField nello shader. p in uv dell'elemento (y giù). */
export function burnFieldAt(px, py, params, dirInfo, aspect, time) {
  const qx = px * aspect;
  const qy = py;
  let d;
  if (dirInfo.mode === 0) {
    const [dx, dy] = dirInfo.dir;
    const ext = Math.abs(dx) + Math.abs(dy);
    d = ((px - 0.5) * dx + (py - 0.5) * dy) / Math.max(ext, 1e-4) + 0.5;
  } else if (dirInfo.mode === 1) {
    const [ox, oy] = dirInfo.origin || [params.originX, params.originY];
    const m = Math.max(
      Math.hypot(ox * aspect, oy),
      Math.hypot((1 - ox) * aspect, oy),
      Math.hypot(ox * aspect, 1 - oy),
      Math.hypot((1 - ox) * aspect, 1 - oy),
    );
    d = Math.hypot((px - ox) * aspect, py - oy) / Math.max(m, 1e-4);
  } else {
    d = 0.5;
  }
  const sx = (params.seed * 7.31) % 61;
  const sy = (params.seed * 3.17) % 53;
  const n = fbmJs(qx * params.burnNoiseScale + sx, qy * params.burnNoiseScale + sy);
  const amount = dirInfo.mode === 2 ? 1 : params.noiseAmount;
  const base = d + (n - d) * amount;
  const [fdx, fdy] = dirInfo.mode === 0 ? dirInfo.dir : [0, -1];
  const k = time * params.speed * 0.35;
  const flx = -fdx * k;
  const fly = -fdy * k;
  const w = (fbmJs(qx * params.noiseScale + flx + 3.7, qy * params.noiseScale + fly + 3.7) - 0.5) * 2 * params.wobble;
  const j = (noiseJs(qx * params.noiseScale * 4 + flx * 2 + 9.1, qy * params.noiseScale * 4 + fly * 2 + 9.1) - 0.5) * 2 * params.jaggedness;
  return base + w + j;
}

/** Punto casuale (uv elemento) dentro la fascia di fiamma, o null se non trovato. */
function sampleFlamePoint(params, dirInfo, aspect, time, threshold) {
  const fw = Math.max(params.thickness * params.flamePercent, 0.01);
  for (let i = 0; i < 16; i += 1) {
    const x = Math.random();
    const y = Math.random();
    const dist = burnFieldAt(x, y, params, dirInfo, aspect, time) - threshold;
    if (dist >= 0 && dist <= fw) return { x, y };
  }
  return null;
}

/**
 * Minimo e massimo del campo senza ondeggio (che si muove nel tempo ed è già
 * coperto dal margine di burnThreshold), campionato su una griglia fitta.
 */
export function measureFieldRange(params, dirInfo, aspect) {
  const still = { ...params, wobble: 0, jaggedness: 0 };
  let min = Infinity;
  let max = -Infinity;
  const nx = 28;
  const ny = 40;
  for (let iy = 0; iy <= ny; iy += 1) {
    for (let ix = 0; ix <= nx; ix += 1) {
      const v = burnFieldAt(ix / nx, iy / ny, still, dirInfo, aspect, 0);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  // la griglia può mancare di poco gli estremi: piccolo margine
  return { min: min - 0.015, max: max + 0.015 };
}

const MAX_EMBERS = 600;
const EMBER_STRIDE = 5; // x, y, size, alpha, heat

/** Vettore di avanzamento (uv, y giù) e modalità shader per una direzione. */
export function burnDirectionVector(direction) {
  switch (direction) {
    case 'top':
      return { mode: 0, dir: [0, 1] };
    case 'left':
      return { mode: 0, dir: [1, 0] };
    case 'right':
      return { mode: 0, dir: [-1, 0] };
    case 'center':
      return { mode: 1, dir: [0, 0], origin: [0.5, 0.5] };
    case 'point':
      return { mode: 1, dir: [0, 0] };
    case 'scatter':
      return { mode: 2, dir: [0, 0] };
    case 'bottom':
    default:
      return { mode: 0, dir: [0, -1] };
  }
}

/**
 * Soglia del campo per un avanzamento 0-1: a 0 nessun pixel tocca la fascia,
 * a 1 tutto è sotto la soglia anche con ondeggio e frastagliatura al massimo.
 * `range` è il minimo/massimo reale del campo statico (measureFieldRange); senza,
 * si usa l'intervallo teorico 0-1, più prudente ma con tempi morti all'inizio e alla fine.
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

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`burn shader: ${log}`);
  }
  return sh;
}

function link(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`burn program: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function uniformsOf(gl, prog, names) {
  const out = {};
  names.forEach((n) => {
    out[n] = gl.getUniformLocation(prog, n);
  });
  return out;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {null | {
 *   setSource: (src: TexImageSource) => void,
 *   draw: (state: object) => void,
 *   clear: () => void,
 *   resetEmbers: () => void,
 *   dispose: () => void,
 * }}
 */
export function createBurnRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const prog = link(gl, VERT, FRAG);
  const pProg = link(gl, P_VERT, P_FRAG);
  const u = uniformsOf(gl, prog, [
    'uTex', 'uRect', 'uAspect', 'uThreshold', 'uActive', 'uTime', 'uFlame', 'uOutline',
    'uThickness', 'uFlamePct', 'uOutlinePct', 'uBurntAlpha', 'uBurnNoiseScale', 'uNoiseAmount',
    'uNoiseScale', 'uWobble', 'uJagged', 'uSpeed', 'uScale', 'uSoftness', 'uGlow', 'uDir',
    'uMode', 'uOrigin', 'uSeed',
  ]);
  const pu = uniformsOf(gl, pProg, ['uFlame']);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');

  const pBuf = gl.createBuffer();
  const pData = new Float32Array(MAX_EMBERS * EMBER_STRIDE);
  const pa = {
    pos: gl.getAttribLocation(pProg, 'aPos'),
    size: gl.getAttribLocation(pProg, 'aSize'),
    alpha: gl.getAttribLocation(pProg, 'aAlpha'),
    heat: gl.getAttribLocation(pProg, 'aHeat'),
  };

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let hasSource = false;

  /** Estremi reali del campo per i parametri correnti (ricalcolati solo se cambiano). */
  let range = { key: '', min: 0, max: 1 };
  function fieldRange(params, dirInfo, aspect) {
    const key = [
      params.direction, params.originX, params.originY, params.seed, params.burnNoiseScale,
      params.noiseAmount, aspect.toFixed(4),
    ].join('|');
    if (range.key !== key) range = { key, ...measureFieldRange(params, dirInfo, aspect) };
    return range;
  }

  /** Faville vive: {x, y, vx, vy, life, age, size, heat, sway} in uv del canvas. */
  let embers = [];
  let emberDebt = 0;

  function setSource(src) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    hasSource = true;
  }

  function clear() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function stepEmbers(state, dirInfo, threshold) {
    const { params, dt, rect, scale, active } = state;
    const rate = params.embers * active;
    emberDebt += rate * dt;
    while (emberDebt >= 1 && embers.length < MAX_EMBERS) {
      emberDebt -= 1;
      const fp = sampleFlamePoint(params, dirInfo, state.aspect, state.time, threshold);
      if (!fp) continue;
      const lx = (fp.x - 0.5) * scale + 0.5;
      const ly = (fp.y - 0.5) * scale + 0.5;
      embers.push({
        x: rect[0] + lx * rect[2],
        y: rect[1] + ly * rect[3],
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(0.06 + Math.random() * 0.16),
        life: 0.5 + Math.random() * 0.9,
        age: 0,
        size: 1.4 + Math.random() * 3.2,
        heat: Math.random(),
        sway: Math.random() * Math.PI * 2,
      });
    }
    if (emberDebt > 1) emberDebt = 1;
    const next = [];
    for (const e of embers) {
      e.age += dt;
      if (e.age >= e.life) continue;
      e.vy -= 0.05 * dt; // le faville salgono accelerando
      e.x += (e.vx + Math.sin(e.sway + e.age * 6) * 0.015) * dt;
      e.y += e.vy * dt;
      next.push(e);
    }
    embers = next;
    let n = 0;
    const dpr = state.dpr || 1;
    for (const e of embers) {
      const k = e.age / e.life;
      const off = n * EMBER_STRIDE;
      pData[off] = e.x;
      pData[off + 1] = e.y;
      pData[off + 2] = e.size * dpr * (1 - k * 0.6);
      pData[off + 3] = Math.min(1, (1 - k) * 1.4) * (k < 0.08 ? k / 0.08 : 1);
      pData[off + 4] = e.heat * (1 - k);
      n += 1;
    }
    return n;
  }

  /**
   * @param {{
   *   params: object, progress: number, active: number, time: number, dt: number,
   *   rect: [number, number, number, number], aspect: number, scale: number, dpr?: number,
   * }} state
   */
  function draw(state) {
    clear();
    if (!hasSource) return;
    const { params } = state;
    const dirInfo = burnDirectionVector(params.direction);
    const origin = dirInfo.origin || [params.originX, params.originY];
    const threshold = burnThreshold(state.progress, params, fieldRange(params, dirInfo, state.aspect));
    const flame = hexToRgb01(params.flameColor);
    const outline = hexToRgb01(params.outlineColor);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(u.uTex, 0);
    gl.uniform4f(u.uRect, state.rect[0], state.rect[1], state.rect[2], state.rect[3]);
    gl.uniform1f(u.uAspect, state.aspect);
    gl.uniform1f(u.uThreshold, threshold);
    gl.uniform1f(u.uActive, state.active);
    gl.uniform1f(u.uTime, state.time);
    gl.uniform3f(u.uFlame, flame[0], flame[1], flame[2]);
    gl.uniform3f(u.uOutline, outline[0], outline[1], outline[2]);
    gl.uniform1f(u.uThickness, params.thickness);
    gl.uniform1f(u.uFlamePct, params.flamePercent);
    gl.uniform1f(u.uOutlinePct, params.outlinePercent);
    gl.uniform1f(u.uBurntAlpha, params.burntAlpha);
    gl.uniform1f(u.uBurnNoiseScale, params.burnNoiseScale);
    gl.uniform1f(u.uNoiseAmount, params.noiseAmount);
    gl.uniform1f(u.uNoiseScale, params.noiseScale);
    gl.uniform1f(u.uWobble, params.wobble);
    gl.uniform1f(u.uJagged, params.jaggedness);
    gl.uniform1f(u.uSpeed, params.speed);
    gl.uniform1f(u.uScale, state.scale);
    gl.uniform1f(u.uSoftness, params.softness);
    gl.uniform1f(u.uGlow, params.glow);
    gl.uniform2f(u.uDir, dirInfo.dir[0], dirInfo.dir[1]);
    gl.uniform1f(u.uMode, dirInfo.mode);
    gl.uniform2f(u.uOrigin, origin[0], origin[1]);
    gl.uniform1f(u.uSeed, params.seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aPos);

    const count = stepEmbers(state, dirInfo, threshold);
    if (count > 0) {
      gl.useProgram(pProg);
      gl.uniform3f(pu.uFlame, flame[0], flame[1], flame[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pData.subarray(0, count * EMBER_STRIDE), gl.DYNAMIC_DRAW);
      const stride = EMBER_STRIDE * 4;
      gl.enableVertexAttribArray(pa.pos);
      gl.vertexAttribPointer(pa.pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(pa.size);
      gl.vertexAttribPointer(pa.size, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(pa.alpha);
      gl.vertexAttribPointer(pa.alpha, 1, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(pa.heat);
      gl.vertexAttribPointer(pa.heat, 1, gl.FLOAT, false, stride, 16);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disableVertexAttribArray(pa.pos);
      gl.disableVertexAttribArray(pa.size);
      gl.disableVertexAttribArray(pa.alpha);
      gl.disableVertexAttribArray(pa.heat);
    }
  }

  function resetEmbers() {
    embers = [];
    emberDebt = 0;
  }

  function dispose() {
    gl.deleteTexture(tex);
    gl.deleteBuffer(quad);
    gl.deleteBuffer(pBuf);
    gl.deleteProgram(prog);
    gl.deleteProgram(pProg);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  return { setSource, draw, clear, resetEmbers, dispose, get emberCount() { return embers.length; } };
}
