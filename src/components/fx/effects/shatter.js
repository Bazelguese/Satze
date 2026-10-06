// Frattura di luce: crepe luminose nel colore dell'armata partono dal punto d'impatto e
// corrono sulla carta; un lampo, poi la carta si spezza in schegge che volano via
// ruotando e cadono. Le schegge sono celle di Voronoi calcolate una volta in JS
// (più fitte vicino all'impatto); ogni vertice sa la distanza dal bordo della sua
// scheggia, così le crepe hanno spessore costante.

import {
  clearCanvas,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
} from '../glUtils.js';
import { createEmberLayer } from '../emberLayer.js';

export const SHATTER_DEFAULTS = {
  durationMs: 2000,
  /** Colore delle crepe (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Numero di schegge */
  shards: 26,
  /** Quanto le schegge si addensano attorno all'impatto (0 = uniformi) */
  focus: 0.55,
  /** Quota della durata in cui si allargano le crepe (0-1) */
  crackTime: 0.38,
  /** Ritardo fra la prima e l'ultima scheggia a staccarsi (quota della durata) */
  stagger: 0.18,
  /** Spinta verso l'esterno, in altezze della carta */
  force: 0.45,
  /** Gravità, in altezze della carta */
  gravity: 0.9,
  /** Rotazione massima delle schegge (giri) */
  spin: 0.6,
  /** Ribaltamento in profondità (giri) */
  tumble: 0.8,
  /** Spessore delle crepe (in altezze della carta) */
  crackWidth: 0.008,
  /** Intensità della luce nelle crepe */
  glow: 1.2,
  /** Lampo alla rottura */
  flash: 0.7,
  /** Scintille alla rottura */
  sparks: 90,
  /** Punto d'impatto (0-1 sull'elemento, y verso il basso) */
  originX: 0.5,
  originY: 0.42,
  seed: 0,
};

const VERT = `
attribute vec2 aPos;
attribute vec2 aCenter;
attribute float aEdge;
attribute vec3 aRand;
attribute float aDelay;
attribute float aDist;
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
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;

void main() {
  float release = uCrackTime + aDelay * uStagger;
  float fly = max(1.0 - uCrackTime - uStagger, 0.05);
  float age = clamp((uProgress - release) / fly, 0.0, 1.0);
  // in uv «quadrate» (x scalata per l'aspetto) per ruotare senza deformare
  vec2 c = vec2(aCenter.x * uAspect, aCenter.y);
  vec2 v = vec2(aPos.x * uAspect, aPos.y) - c;
  vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
  vec2 dirOut = normalize(c - o + vec2(1e-4, 0.0));
  // prima della rottura: un filo di rigonfiamento lungo le crepe
  float crackT = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  vec2 pre = dirOut * 0.004 * smoothstep(aDist, aDist + 0.3, crackT * 1.2);
  float ang = (aRand.x - 0.5) * 2.0 * 6.2832 * uSpin * age;
  float flip = cos(age * 6.2832 * uTumble * (0.4 + aRand.y));
  v.x *= mix(1.0, flip, step(0.001, age));
  v = vec2(v.x * cos(ang) - v.y * sin(ang), v.x * sin(ang) + v.y * cos(ang));
  vec2 vel = (dirOut + (aRand.yz - 0.5) * 0.6) * uForce * (0.6 + aRand.z * 0.8);
  vec2 move = vel * age + vec2(0.0, 0.5 * uGravity * age * age);
  vec2 q = c + v + pre + move;
  vec2 uv = vec2(q.x / uAspect, q.y);
  vec2 cv = uRect.xy + uv * uRect.zw;
  gl_Position = vec4(cv.x * 2.0 - 1.0, 1.0 - cv.y * 2.0, 0.0, 1.0);
  vSrc = aPos;
  vEdge = aEdge;
  vDist = aDist;
  vAge = age;
}
`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uCrackTime;
uniform float uCrackWidth;
uniform float uGlow;
uniform float uFlash;
uniform vec3 uColor;
varying vec2 vSrc;
varying float vEdge;
varying float vDist;
varying float vAge;

void main() {
  vec4 tex = texture2D(uTex, vSrc);
  if (tex.a < 0.002) discard;
  float crackT = clamp(uProgress / max(uCrackTime, 1e-3), 0.0, 1.0);
  // il fronte delle crepe avanza dall'impatto (vDist 0) ai bordi (vDist 1)
  float reach = crackT * crackT * (3.0 - 2.0 * crackT) * 1.15;
  float reveal = smoothstep(vDist, vDist + 0.06, reach);
  float line = 1.0 - smoothstep(uCrackWidth * 0.35, uCrackWidth, vEdge);
  float halo = 1.0 - smoothstep(0.0, uCrackWidth * 4.0, vEdge);
  float pulse = 0.85 + 0.15 * sin(uProgress * 60.0);
  float fadeOut = 1.0 - smoothstep(0.35, 1.0, vAge);
  float g = (line + halo * 0.35) * reveal * uGlow * pulse * (1.0 - smoothstep(0.2, 0.8, vAge) * 0.6);
  vec3 hot = mix(uColor, vec3(1.0), 0.55);
  vec3 col = tex.rgb + mix(uColor, hot, line * 0.45) * g * tex.a;
  // lampo alla rottura
  float flash = uFlash * exp(-abs(uProgress - uCrackTime) * 30.0);
  col += hot * flash * tex.a;
  float alpha = tex.a * fadeOut;
  col *= fadeOut;
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

/** Pseudo-casuale riproducibile dal seme. */
function mulberry(seed) {
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
function clipHalfPlane(poly, mx, my, nx, ny) {
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

/**
 * Celle di Voronoi dentro il rettangolo [0,aspect]×[0,1] (coordinate quadrate).
 * @returns {Array<Array<[number, number]>>}
 */
export function voronoiShards(count, aspect, origin, focus, seed) {
  const rand = mulberry(seed + 1);
  const ox = origin[0] * aspect;
  const oy = origin[1];
  const sites = [];
  for (let i = 0; i < count; i += 1) {
    // metà circa addensata attorno all'impatto, il resto uniforme
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
    let poly = [[0, 0], [aspect, 0], [aspect, 1], [0, 1]];
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

function distToLine(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((px - ax) * dy - (py - ay) * dx) / len;
}

/** Triangoli a ventaglio per scheggia, con distanza dal bordo esatta (interpolata linearmente). */
function buildMesh(params, aspect) {
  const origin = [params.originX, params.originY];
  const cells = voronoiShards(Math.round(params.shards), aspect, origin, params.focus, params.seed);
  const rand = mulberry(params.seed + 77);
  const ox = origin[0] * aspect;
  const oy = origin[1];
  const maxD = Math.max(
    Math.hypot(ox, oy), Math.hypot(aspect - ox, oy), Math.hypot(ox, 1 - oy), Math.hypot(aspect - ox, 1 - oy),
  );
  const stride = 11; // pos2 center2 edge1 rand3 delay1 dist1 + 1 libero
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
    const delay = Math.min(1, Math.hypot(cx - ox, cy - oy) / maxD);
    const push = (x, y, edge) => {
      verts.push(
        x / aspect, y, cx / aspect, cy, edge, r[0], r[1], r[2], delay,
        Math.min(1, Math.hypot(x - ox, y - oy) / maxD), 0,
      );
    };
    for (let k = 0; k < poly.length; k += 1) {
      const [ax, ay] = poly[k];
      const [bx, by] = poly[(k + 1) % poly.length];
      push(cx, cy, distToLine(cx, cy, ax, ay, bx, by));
      push(ax, ay, 0);
      push(bx, by, 0);
    }
  }
  return { data: new Float32Array(verts), count: verts.length / stride, stride, cells };
}

function createShatterRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(
    gl,
    VERT,
    FRAG,
    [
      'uTex', 'uRect', 'uAspect', 'uProgress', 'uCrackTime', 'uStagger', 'uOrigin', 'uForce',
      'uGravity', 'uSpin', 'uTumble', 'uCrackWidth', 'uGlow', 'uFlash', 'uColor',
    ],
    ['aPos', 'aCenter', 'aEdge', 'aRand', 'aDelay', 'aDist'],
  );
  const source = createSourceTexture(gl);
  const buf = gl.createBuffer();
  const embers = createEmberLayer(gl, 400);
  let hasSource = false;
  let mesh = null;
  let meshKey = '';
  let lastProgress = 0;

  function ensureMesh(params, aspect) {
    const key = [Math.round(params.shards), params.focus, params.originX, params.originY, params.seed, aspect.toFixed(4)].join('|');
    if (key === meshKey) return;
    mesh = buildMesh(params, aspect);
    meshKey = key;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
  }

  /** Scintille alla rottura: partono dai vertici delle crepe e cadono. */
  function burst(params, rect, aspect) {
    const n = Math.round(params.sparks);
    const pts = [];
    mesh.cells.forEach((poly) => poly.forEach((p) => pts.push(p)));
    for (let i = 0; i < n && pts.length; i += 1) {
      const [x, y] = pts[Math.floor(Math.random() * pts.length)];
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.05 + Math.random() * 0.25;
      embers.spawn(rect[0] + (x / aspect) * rect[2], rect[1] + y * rect[3], {
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 0.08,
        life: 0.4 + Math.random() * 0.7,
        size: 1.2 + Math.random() * 2.6,
        heat: 0.6 + Math.random() * 0.4,
      });
    }
  }

  return {
    setSource(src) {
      source.upload(src);
      hasSource = true;
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!hasSource) return;
      const { params, rect, aspect } = state;
      ensureMesh(params, aspect);
      const color = hexToRgb01(params.color);
      const crackTime = Math.max(0.02, Math.min(0.9, params.crackTime));
      const stagger = Math.max(0, Math.min(0.95 - crackTime, params.stagger));

      if (lastProgress < crackTime && state.progress >= crackTime && !state.done) burst(params, rect, aspect);
      lastProgress = state.progress;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      source.bind(0);
      gl.uniform1i(u.uTex, 0);
      gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.uAspect, aspect);
      gl.uniform1f(u.uProgress, state.progress);
      gl.uniform1f(u.uCrackTime, crackTime);
      gl.uniform1f(u.uStagger, stagger);
      gl.uniform2f(u.uOrigin, params.originX, params.originY);
      gl.uniform1f(u.uForce, params.force);
      gl.uniform1f(u.uGravity, params.gravity);
      gl.uniform1f(u.uSpin, params.spin);
      gl.uniform1f(u.uTumble, params.tumble);
      gl.uniform1f(u.uCrackWidth, params.crackWidth);
      gl.uniform1f(u.uGlow, params.glow);
      gl.uniform1f(u.uFlash, params.flash);
      gl.uniform3f(u.uColor, color[0], color[1], color[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = mesh.stride * 4;
      gl.enableVertexAttribArray(a.aPos);
      gl.vertexAttribPointer(a.aPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(a.aCenter);
      gl.vertexAttribPointer(a.aCenter, 2, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(a.aEdge);
      gl.vertexAttribPointer(a.aEdge, 1, gl.FLOAT, false, stride, 16);
      gl.enableVertexAttribArray(a.aRand);
      gl.vertexAttribPointer(a.aRand, 3, gl.FLOAT, false, stride, 20);
      gl.enableVertexAttribArray(a.aDelay);
      gl.vertexAttribPointer(a.aDelay, 1, gl.FLOAT, false, stride, 32);
      gl.enableVertexAttribArray(a.aDist);
      gl.vertexAttribPointer(a.aDist, 1, gl.FLOAT, false, stride, 36);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      ['aPos', 'aCenter', 'aEdge', 'aRand', 'aDelay', 'aDist'].forEach((k) => gl.disableVertexAttribArray(a[k]));

      embers.step(state.dt, (e, dt) => {
        e.vy += 0.5 * dt; // le scintille di vetro cadono
        e.vx *= 1 - 0.8 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      });
      embers.draw(color, state.dpr);
    },
    busy() {
      return embers.count > 0;
    },
    dispose() {
      embers.dispose();
      gl.deleteBuffer(buf);
      gl.deleteTexture(source.tex);
      gl.deleteProgram(prog);
      loseContext(gl);
    },
  };
}

export const shatterEffect = {
  id: 'shatter',
  label: 'Frattura di luce',
  kind: 'out',
  description: "Crepe di luce partono dal punto d'impatto, poi la carta va in schegge.",
  defaults: SHATTER_DEFAULTS,
  directions: null,
  /** Clic sulla carta: sposta il punto d'impatto */
  usesOrigin: true,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.6, right: m * 0.6, top: m * 0.45, bottom: m * 1.0 };
  },
  createRenderer: createShatterRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 5000, 50],
    ['shards', 'Schegge', 6, 60, 1],
    ['focus', 'Addensate all\'impatto', 0, 1, 0.01],
    ['crackTime', 'Tempo crepe', 0.05, 0.7, 0.01],
    ['stagger', 'Scaglionamento', 0, 0.5, 0.01],
    ['force', 'Spinta', 0, 1.5, 0.01],
    ['gravity', 'Gravità', -0.5, 3, 0.01],
    ['spin', 'Rotazione', 0, 2, 0.01],
    ['tumble', 'Ribaltamento', 0, 3, 0.01],
    ['crackWidth', 'Spessore crepe', 0.002, 0.03, 0.0005],
    ['glow', 'Luce crepe', 0, 3, 0.01],
    ['flash', 'Lampo', 0, 2, 0.01],
    ['sparks', 'Scintille', 0, 300, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    vetro: { label: 'Vetro di luce', params: {} },
    colpo: {
      label: 'Colpo secco',
      params: { durationMs: 1200, shards: 34, focus: 0.75, crackTime: 0.18, stagger: 0.08, force: 0.9, gravity: 1.4, spin: 0.9, tumble: 1.2, crackWidth: 0.006, glow: 1.6, flash: 1.2, sparks: 180 },
    },
    crollo: {
      label: 'Crollo lento',
      params: { durationMs: 3200, shards: 16, focus: 0.2, crackTime: 0.5, stagger: 0.3, force: 0.12, gravity: 1.2, spin: 0.25, tumble: 0.3, crackWidth: 0.01, glow: 1, flash: 0.3, sparks: 40 },
    },
    cristallo: {
      label: 'Cristallo',
      params: { durationMs: 2200, shards: 50, focus: 0.4, crackTime: 0.42, stagger: 0.2, force: 0.35, gravity: 0.4, spin: 1.2, tumble: 2, crackWidth: 0.004, glow: 2.2, flash: 0.9, sparks: 220 },
    },
  },
};
