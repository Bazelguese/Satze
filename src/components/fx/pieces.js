// Motore «a pezzi»: la carta divisa in poligoni (celle di Voronoi, griglia, strisce,
// strappi frastagliati) che si staccano e volano via ruotando. Ogni vertice conosce la
// distanza esatta dal bordo del suo pezzo, così crepe e tagli hanno spessore costante.
// Usato da Frattura di luce, Specchio infranto, Pressa, Strappo, Artigliata.
//
// Coordinate «quadrate»: x in [0, aspect], y in [0, 1] (unità = altezza della carta).

import { clearCanvas, createProgram, createSourceTexture, getFxContext, hexToRgb01, loseContext } from './glUtils.js';
import { createEmberLayer } from './emberLayer.js';
import { createFlakeLayer } from './flakeLayer.js';

/** Pseudo-casuale riproducibile dal seme. */
export function mulberry(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Taglia un poligono convesso col semipiano (p - m)·n <= 0 (Sutherland–Hodgman). */
export function clipHalfPlane(poly, mx, my, nx, ny) {
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const da = (ax - mx) * nx + (ay - my) * ny;
    const db = (bx - mx) * nx + (by - my) * ny;
    if (da <= 0) out.push([ax, ay]);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }
  return out;
}

const rectPoly = (aspect) => [[0, 0], [aspect, 0], [aspect, 1], [0, 1]];

/** Celle di Voronoi, addensate attorno a `origin` (uv) per la quota `focus`. */
export function voronoiCells(count, aspect, origin, focus, seed) {
  const rand = mulberry(seed + 1);
  const ox = origin[0] * aspect;
  const oy = origin[1];
  const sites = [];
  for (let i = 0; i < count; i += 1) {
    if (rand() < focus) {
      const r = Math.pow(rand(), 1.6) * 0.45;
      const a = rand() * Math.PI * 2;
      sites.push([Math.min(aspect, Math.max(0, ox + Math.cos(a) * r)), Math.min(1, Math.max(0, oy + Math.sin(a) * r))]);
    } else {
      sites.push([rand() * aspect, rand()]);
    }
  }
  const cells = [];
  for (let i = 0; i < sites.length; i += 1) {
    let poly = rectPoly(aspect);
    const [sx, sy] = sites[i];
    for (let j = 0; j < sites.length && poly.length; j += 1) {
      if (i === j) continue;
      const [tx, ty] = sites[j];
      const nx = tx - sx;
      const ny = ty - sy;
      if (nx === 0 && ny === 0) continue;
      poly = clipHalfPlane(poly, (sx + tx) / 2, (sy + ty) / 2, nx, ny);
    }
    if (poly.length >= 3) cells.push(poly);
  }
  return cells;
}

/** Griglia di piastre rettangolari cols×rows. */
export function gridCells(cols, rows, aspect) {
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x0 = (c / cols) * aspect;
      const x1 = ((c + 1) / cols) * aspect;
      const y0 = r / rows;
      const y1 = (r + 1) / rows;
      cells.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    }
  }
  return cells;
}

/**
 * Strisce tagliate da linee parallele di direzione (dx, dy); `offsets` = distanze con segno
 * di ogni linea dal centro della carta (coordinate quadrate). Restituisce le celle fra i tagli.
 */
export function stripCells(aspect, dx, dy, offsets) {
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = aspect / 2;
  const cy = 0.5;
  const sorted = [...offsets].sort((a, b) => a - b);
  const bounds = [-Infinity, ...sorted, Infinity];
  const cells = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    let poly = rectPoly(aspect);
    if (Number.isFinite(bounds[i])) {
      // tieni (p - c)·n >= bounds[i]
      poly = clipHalfPlane(poly, cx + nx * bounds[i], cy + ny * bounds[i], -nx, -ny);
    }
    if (Number.isFinite(bounds[i + 1]) && poly.length) {
      poly = clipHalfPlane(poly, cx + nx * bounds[i + 1], cy + ny * bounds[i + 1], nx, ny);
    }
    if (poly.length >= 3) cells.push(poly);
  }
  return cells;
}

const onBorder = (x, y, aspect) => x < 1e-5 || y < 1e-5 || x > aspect - 1e-5 || y > 1 - 1e-5;

/**
 * Bordi frastagliati: suddivide ogni lato in `segs` tratti e sposta i punti interni con un
 * campo di rumore deterministico (stesso punto → stesso spostamento in entrambe le celle).
 */
export function jaggedCells(cells, aspect, amp, segs, seed) {
  const k1 = 37.1 + seed * 1.3;
  const k2 = 91.7 + seed * 0.7;
  const field = (x, y) => {
    const h = (a, b) => {
      const s = Math.sin(a * 12.9898 + b * 78.233 + seed) * 43758.5453;
      return s - Math.floor(s);
    };
    // somma di seni a frequenze diverse: liscio ma irregolare, e identico per lo stesso punto
    const n1 = Math.sin(x * k1 + y * 13.3) * 0.5 + Math.sin(x * 7.1 - y * k1 * 0.8) * 0.3 + (h(Math.round(x * 400), Math.round(y * 400)) - 0.5) * 0.4;
    const n2 = Math.sin(y * k2 + x * 11.1) * 0.5 + Math.sin(y * 5.3 - x * k2 * 0.6) * 0.3 + (h(Math.round(y * 400), Math.round(x * 400)) - 0.5) * 0.4;
    return [n1 * amp, n2 * amp];
  };
  return cells.map((poly) => {
    const out = [];
    for (let i = 0; i < poly.length; i += 1) {
      const [ax, ay] = poly[i];
      const [bx, by] = poly[(i + 1) % poly.length];
      const edgeOnBorder = onBorder(ax, ay, aspect) && onBorder(bx, by, aspect) && (Math.abs(ax - bx) < 1e-5 || Math.abs(ay - by) < 1e-5);
      for (let s = 0; s < segs; s += 1) {
        const t = s / segs;
        const x = ax + (bx - ax) * t;
        const y = ay + (by - ay) * t;
        if (s === 0 || edgeOnBorder || onBorder(x, y, aspect)) {
          out.push([x, y]);
        } else {
          // punti arrotondati: lo stesso punto calcolato dalle due celle vicine coincide
          const rx = Math.round(x * 1e6) / 1e6;
          const ry = Math.round(y * 1e6) / 1e6;
          const [jx, jy] = field(rx, ry);
          out.push([Math.min(aspect, Math.max(0, x + jx)), Math.min(1, Math.max(0, y + jy))]);
        }
      }
    }
    return out;
  });
}

function distToLine(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((px - ax) * dy - (py - ay) * dx) / len;
}

export const PIECE_STRIDE = 11; // pos2 center2 edge1 rand3 delay1 dist1 extra1

/**
 * Triangoli a ventaglio per pezzo.
 * opts: origin (uv), seed, glowBorder (false = niente luce sul bordo esterno della carta),
 *   delay(cx, cy, maxD, rand) → 0-1 (default: distanza dall'origine), extra(x, y) → valore libero per vertice.
 */
export function buildPieceMesh(cells, aspect, opts = {}) {
  const origin = opts.origin || [0.5, 0.5];
  const rand = mulberry((opts.seed ?? 0) + 77);
  const ox = origin[0] * aspect;
  const oy = origin[1];
  const maxD = Math.max(Math.hypot(ox, oy), Math.hypot(aspect - ox, oy), Math.hypot(ox, 1 - oy), Math.hypot(aspect - ox, 1 - oy));
  const glowBorder = opts.glowBorder ?? true;
  const verts = [];
  for (const poly of cells) {
    let cx = 0;
    let cy = 0;
    poly.forEach(([x, y]) => {
      cx += x;
      cy += y;
    });
    cx /= poly.length;
    cy /= poly.length;
    const r = [rand(), rand(), rand()];
    const delay = opts.delay ? opts.delay(cx, cy, maxD, r) : Math.min(1, Math.hypot(cx - ox, cy - oy) / maxD);
    const push = (x, y, edge) => {
      verts.push(
        x / aspect, y, cx / aspect, cy, edge, r[0], r[1], r[2], delay,
        Math.min(1, Math.hypot(x - ox, y - oy) / maxD), opts.extra ? opts.extra(x, y) : 0,
      );
    };
    for (let k = 0; k < poly.length; k += 1) {
      const [ax, ay] = poly[k];
      const [bx, by] = poly[(k + 1) % poly.length];
      const borderEdge = !glowBorder && onBorder(ax, ay, aspect) && onBorder(bx, by, aspect)
        && (Math.abs(ax - bx) < 1e-5 || Math.abs(ay - by) < 1e-5);
      // lato sul bordo della carta: distanza «infinita» = nessuna luce
      push(cx, cy, borderEdge ? 10 : distToLine(cx, cy, ax, ay, bx, by));
      push(ax, ay, borderEdge ? 10 : 0);
      push(bx, by, borderEdge ? 10 : 0);
    }
  }
  return { data: new Float32Array(verts), count: verts.length / PIECE_STRIDE, cells, origin };
}

/** Vertex shader comune: rilascio scaglionato, spinta (radiale + verso fisso), gravità, rotazione, ribaltamento. */
export const PIECE_VERT = `
attribute vec2 aPos;
attribute vec2 aCenter;
attribute float aEdge;
attribute vec3 aRand;
attribute float aDelay;
attribute float aDist;
attribute float aExtra;
uniform vec4 uRect;
uniform float uAspect;
uniform float uProgress;
uniform float uCrackTime;
uniform float uStagger;
uniform vec2 uOrigin;
uniform float uForce;
uniform float uGravity;
uniform float uSpin;
uniform float uTumble;
uniform float uRadial;
uniform vec2 uBias;
uniform float uSwell;
uniform vec2 uJolt;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying vec3 vRand;
varying float vAngle;
varying float vFlip;
varying float vExtra;

void main() {
  float release = uCrackTime + aDelay * uStagger;
  float fly = max(1.0 - uCrackTime - uStagger, 0.05);
  float age = clamp((uProgress - release) / fly, 0.0, 1.0);
  vec2 c = vec2(aCenter.x * uAspect, aCenter.y);
  vec2 v = vec2(aPos.x * uAspect, aPos.y) - c;
  vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
  vec2 dirOut = normalize(c - o + vec2(1e-4, 0.0));
  float crackT = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  vec2 pre = dirOut * uSwell * smoothstep(aDist, aDist + 0.3, crackT * 1.2);
  float ang = (aRand.x - 0.5) * 2.0 * 6.2832 * uSpin * age;
  float flip = cos(age * 6.2832 * uTumble * (0.4 + aRand.y));
  v.x *= mix(1.0, flip, step(0.001, age));
  v = vec2(v.x * cos(ang) - v.y * sin(ang), v.x * sin(ang) + v.y * cos(ang));
  vec2 dir = dirOut * uRadial + uBias + (aRand.yz - 0.5) * 0.6;
  vec2 vel = dir * uForce * (0.6 + aRand.z * 0.8);
  vec2 move = vel * age + vec2(0.0, 0.5 * uGravity * age * age);
  vec2 q = c + v + pre + move + uJolt;
  vec2 uv = vec2(q.x / uAspect, q.y);
  vec2 cv = uRect.xy + uv * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  vSrc = aPos;
  vEdge = aEdge;
  vDist = aDist;
  vAge = age;
  vRand = aRand;
  vAngle = ang;
  vFlip = flip;
  vExtra = aExtra;
}
`;

/**
 * Vertex shader d'entrata: i pezzi partono lontani (stessa spinta di PIECE_VERT) e arrivano
 * al loro posto. uCrackTime = quando parte il primo, uStagger = scaglionamento, uTravel =
 * durata del volo, uEase: 0 planata (rallenta all'arrivo), 1 schianto (accelera e sbatte).
 * vAge = quanto manca all'arrivo (1 lontano, 0 a posto); vSince = tempo dall'arrivo.
 */
export const PIECE_ENTRY_VERT = `
attribute vec2 aPos;
attribute vec2 aCenter;
attribute float aEdge;
attribute vec3 aRand;
attribute float aDelay;
attribute float aDist;
attribute float aExtra;
uniform vec4 uRect;
uniform float uAspect;
uniform float uProgress;
uniform float uCrackTime;
uniform float uStagger;
uniform vec2 uOrigin;
uniform float uForce;
uniform float uGravity;
uniform float uSpin;
uniform float uTumble;
uniform float uRadial;
uniform vec2 uBias;
uniform float uSwell;
uniform vec2 uJolt;
uniform float uTravel;
uniform float uEase;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;
varying vec3 vRand;
varying float vAngle;
varying float vFlip;
varying float vExtra;
varying float vSince;

void main() {
  float begin = uCrackTime + aDelay * uStagger;
  float fly = max(uTravel, 0.02);
  float k = clamp((uProgress - begin) / fly, 0.0, 1.0);
  float glide = 1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k);
  float slam = k * k * k;
  float away = 1.0 - mix(glide, slam, uEase);
  vec2 c = vec2(aCenter.x * uAspect, aCenter.y);
  vec2 v = vec2(aPos.x * uAspect, aPos.y) - c;
  vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
  vec2 dirOut = normalize(c - o + vec2(1e-4, 0.0));
  float ang = (aRand.x - 0.5) * 2.0 * 6.2832 * uSpin * away;
  float flip = cos(away * 6.2832 * uTumble * (0.4 + aRand.y));
  v.x *= flip;
  v = vec2(v.x * cos(ang) - v.y * sin(ang), v.x * sin(ang) + v.y * cos(ang));
  vec2 dir = dirOut * uRadial + uBias + (aRand.yz - 0.5) * 0.6;
  vec2 move = dir * uForce * (0.6 + aRand.z * 0.8) * away - vec2(0.0, uGravity * away * (1.0 - away));
  vec2 q = c + v + move + uJolt;
  vec2 uv = vec2(q.x / uAspect, q.y);
  vec2 cv = uRect.xy + uv * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  vSrc = aPos;
  vEdge = aEdge;
  vDist = aDist;
  vAge = away;
  vRand = aRand;
  vAngle = ang;
  vFlip = flip;
  vExtra = aExtra;
  vSince = uProgress - (begin + fly);
}
`;

const MOTION_UNIFORMS = ['uRect', 'uAspect', 'uProgress', 'uCrackTime', 'uStagger', 'uOrigin', 'uForce', 'uGravity', 'uSpin', 'uTumble', 'uRadial', 'uBias', 'uSwell', 'uJolt'];

/**
 * Renderer a pezzi.
 * spec: frag, vert (opzionale: PIECE_ENTRY_VERT per i pezzi che arrivano), uniforms (extra), mesh(params, aspect) → { cells, opts }, meshKey(params, aspect),
 *   motion(params, state) → { crackTime, stagger, force, gravity, spin, tumble, radial, bias:[x,y], swell, jolt:[x,y], origin:[x,y], travel, ease },
 *   bind(gl, u, state, env), particles(state, env), passes (opzionale: disegni extra prima dei pezzi).
 */
export function createPiecesRenderer(canvas, spec) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(
    gl,
    spec.vert || PIECE_VERT,
    spec.frag,
    ['uTex', 'uColor', ...MOTION_UNIFORMS, ...(spec.vert === PIECE_ENTRY_VERT ? ['uTravel', 'uEase'] : []), ...(spec.uniforms || [])],
    ['aPos', 'aCenter', 'aEdge', 'aRand', 'aDelay', 'aDist', 'aExtra'],
  );
  const source = createSourceTexture(gl);
  const buf = gl.createBuffer();
  const embers = createEmberLayer(gl, spec.maxEmbers ?? 500);
  const flakes = createFlakeLayer(gl, spec.maxFlakes ?? 600);
  const env = { gl, canvas, embers, flakes, mesh: null, memo: {}, lastProgress: 0 };
  let hasSource = false;
  let meshKey = '';

  function ensureMesh(params, aspect) {
    const key = spec.meshKey(params, aspect);
    if (key === meshKey) return;
    const { cells, opts } = spec.mesh(params, aspect);
    env.mesh = buildPieceMesh(cells, aspect, opts);
    meshKey = key;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, env.mesh.data, gl.STATIC_DRAW);
  }

  return {
    setSource(src) {
      source.upload(src);
      env.source = src;
      hasSource = true;
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!hasSource) return;
      const { params, rect, aspect } = state;
      ensureMesh(params, aspect);
      const color = hexToRgb01(params.color);
      env.color = color;
      const m = spec.motion(params, state);
      env.motion = m;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      spec.passes?.(state, env);
      gl.useProgram(prog);
      source.bind(0);
      gl.uniform1i(u.uTex, 0);
      gl.uniform3f(u.uColor, color[0], color[1], color[2]);
      gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.uAspect, aspect);
      gl.uniform1f(u.uProgress, state.progress);
      gl.uniform1f(u.uCrackTime, m.crackTime);
      gl.uniform1f(u.uStagger, m.stagger);
      gl.uniform2f(u.uOrigin, m.origin[0], m.origin[1]);
      gl.uniform1f(u.uForce, m.force);
      gl.uniform1f(u.uGravity, m.gravity);
      gl.uniform1f(u.uSpin, m.spin);
      gl.uniform1f(u.uTumble, m.tumble);
      gl.uniform1f(u.uRadial, m.radial ?? 1);
      gl.uniform2f(u.uBias, (m.bias || [0, 0])[0], (m.bias || [0, 0])[1]);
      gl.uniform1f(u.uSwell, m.swell ?? 0.004);
      // scossa di tutta la carta (coordinate quadrate), es. un colpo violento
      gl.uniform2f(u.uJolt, (m.jolt || [0, 0])[0], (m.jolt || [0, 0])[1]);
      if (u.uTravel) gl.uniform1f(u.uTravel, m.travel ?? Math.max(0.05, 1 - m.crackTime - m.stagger));
      if (u.uEase) gl.uniform1f(u.uEase, m.ease ?? 0);
      spec.bind?.(gl, u, state, env);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = PIECE_STRIDE * 4;
      const attr = (loc, size, offset) => {
        if (loc < 0) return;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
      };
      attr(a.aPos, 2, 0);
      attr(a.aCenter, 2, 8);
      attr(a.aEdge, 1, 16);
      attr(a.aRand, 3, 20);
      attr(a.aDelay, 1, 32);
      attr(a.aDist, 1, 36);
      attr(a.aExtra, 1, 40);
      gl.drawArrays(gl.TRIANGLES, 0, env.mesh.count);
      Object.values(a).forEach((loc) => { if (loc >= 0) gl.disableVertexAttribArray(loc); });

      spec.particles?.(state, env);
      env.lastProgress = state.progress;
      embers.draw(color, state.dpr);
      flakes.draw(state.dpr);
    },
    busy() {
      return embers.count > 0 || flakes.count > 0;
    },
    dispose() {
      embers.dispose();
      flakes.dispose();
      gl.deleteBuffer(buf);
      gl.deleteTexture(source.tex);
      gl.deleteProgram(prog);
      loseContext(gl);
    },
  };
}

/** Pezzo in uv del canvas (centro della cella), per far nascere particelle dai tagli. */
export function cellPointToCanvas(rect, aspect, x, y) {
  return [rect[0] + (x / aspect) * rect[2], rect[1] + y * rect[3]];
}
