// L'Enclave delle Scaglie · «Muta»: la carta è fatta di scaglie che, a ondata, si girano
// mostrando il dorso d'oro e poi si staccano cadendo come pagliuzze dorate.
// «Ogni terra conquistata rinforza il trono.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, cardHeightPx } from './common.js';
import { hexToRgb01 } from '../../glUtils.js';

// tempi di una scaglia, in quota della durata: giro, attesa, distacco
const FLIP = 0.12;
const HOLD = 0.08;
const SPAN = 0.6; // quota in cui partono tutte le scaglie (l'ultima gira a SPAN)

const FRAG = `${QUAD_HEADER}
uniform float uRows;
uniform float uGold;
uniform float uSeams;
uniform float uShine;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  // griglia sfalsata di scaglie (coordinate quadrate)
  float ch = 1.0 / uRows;
  float cw = ch * 1.15;
  vec2 P = vec2(p.x * uAspect, p.y);
  float row = floor(P.y / ch);
  float shift = mod(row, 2.0) * 0.5 * cw;
  float col = floor((P.x + shift) / cw);
  vec2 origin = vec2(col * cw - shift, row * ch);
  vec2 local = (P - origin) / vec2(cw, ch);
  vec2 centerUv = vec2((origin.x + cw * 0.5) / uAspect, origin.y + ch * 0.5);

  float s = sweepN(clamp(centerUv, 0.0, 1.0));
  float tFlip = s * ${SPAN.toFixed(3)};
  float f = clamp((t - tFlip) / ${FLIP.toFixed(3)}, 0.0, 1.0);
  float peel = t - tFlip - ${(FLIP + HOLD).toFixed(3)};
  if (peel > 0.0) { gl_FragColor = vec4(0.0); return; } // staccata: ora è una particella

  // il giro: la scaglia si stringe in larghezza e mostra l'altra faccia
  float ang = f * 3.14159;
  float w = max(abs(cos(ang)), 0.02);
  float lx = (local.x - 0.5) / w + 0.5;
  if (lx < 0.0 || lx > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec2 lp = vec2(lx, local.y);
  vec2 src = vec2((origin.x + lp.x * cw) / uAspect, origin.y + lp.y * ch);
  vec4 tex = cardAt(src);
  if (tex.a < 0.002) { gl_FragColor = vec4(0.0); return; }

  // forma di scaglia: bordo arrotondato in basso, giuntura scura fra le scaglie
  float shape = length((lp - vec2(0.5, 0.3)) * vec2(1.0, 0.85));
  float seam = smoothstep(0.62, 0.72, shape) * uSeams * smoothstep(0.0, 0.05, t);
  vec3 col3;
  if (f < 0.5) {
    col3 = tex.rgb * (1.0 - seam * 0.55);
    // un filo di luce sul bordo curvo, mentre la scaglia inizia a girare
    col3 += mix(uColor, vec3(1.0), 0.5) * smoothstep(0.58, 0.7, shape) * f * 1.4 * tex.a;
  } else {
    // dorso: scaglia d'oro arrotondata con un riflesso curvo, bronzo scuro fra le scaglie
    vec3 gold = mix(uColor, vec3(1.0, 0.82, 0.36), uGold);
    float inside = 1.0 - smoothstep(0.64, 0.7, shape);
    float hl = (1.0 - smoothstep(0.0, 0.42, length(lp - vec2(0.36, 0.26)))) * uShine;
    float rimL = smoothstep(0.5, 0.64, shape) * inside;
    vec3 back = gold * (0.5 + 0.5 * (1.0 - lp.y)) * (1.0 - rimL * 0.35) + vec3(1.0, 0.95, 0.82) * hl * 0.6;
    col3 = mix(gold * 0.22, back, inside) * tex.a;
  }
  // durante il giro la faccia si scurisce di taglio
  col3 *= 0.55 + 0.45 * w;
  gl_FragColor = outColor(col3, tex.a);
}
`;

export const enclaveEffect = {
  id: 'enclave-muta',
  army: "L'Enclave delle Scaglie",
  role: 'defeat',
  label: 'Muta',
  kind: 'out',
  description: "Le scaglie della carta si girano mostrando l'oro e si staccano a ondata.",
  defaults: {
    durationMs: 2800,
    color: '#fb912d',
    rows: 11,
    gold: 0.7,
    seams: 0.6,
    shine: 1,
    fall: 0.6,
    direction: 'bottom',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.3,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.35, right: m * 0.35, top: m * 0.2, bottom: m * 0.9 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uRows', 'uGold', 'uSeams', 'uShine'],
    sweep: sweepOf,
    needsPixels: true,
    maxFlakes: 800,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uRows, Math.round(params.rows));
      gl.uniform1f(u.uGold, params.gold);
      gl.uniform1f(u.uSeams, params.seams);
      gl.uniform1f(u.uShine, params.shine);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const rows = Math.round(params.rows);
      // elenco delle scaglie (stessa griglia dello shader), ricalcolato se cambia
      const key = [rows, aspect.toFixed(4), env.range.min, env.range.max, JSON.stringify(env.sweep)].join('|');
      if (env.memo.key !== key) {
        const ch = 1 / rows;
        const cw = ch * 1.15;
        const list = [];
        for (let r = 0; r < rows; r += 1) {
          const shift = (r % 2) * 0.5 * cw;
          for (let c = 0; (c * cw - shift) < aspect; c += 1) {
            const ox = c * cw - shift;
            const cx = Math.min(1, Math.max(0, (ox + cw / 2) / aspect));
            const cy = r * ch + ch / 2;
            if (env.pixels && env.pixels.at(cx, cy)[3] < 0.2) continue;
            list.push({ cx, cy, tPeel: sweepAt(env, aspect, cx, cy) * SPAN + FLIP + HOLD });
          }
        }
        env.memo = { key, list };
      }
      const prev = env.lastP ?? 0;
      const sizePx = (cardHeightPx(state, env.canvas) / rows) * 0.85;
      const gold = hexToRgb01(params.color).map((v, i) => v * (1 - params.gold) + [1, 0.82, 0.36][i] * params.gold);
      // un salto grosso (cursore dell'anteprima trascinato) non deve far piovere tutte le scaglie insieme
      if (!state.done && state.progress - prev < 0.3) {
        for (const sc of env.memo.list) {
          if (prev < sc.tPeel && state.progress >= sc.tPeel) {
            const [x, y] = toCanvasUv(rect, sc.cx, sc.cy);
            env.flakes.spawn(x, y, {
              vx: (Math.random() - 0.5) * 0.06,
              vy: -0.02 - Math.random() * 0.04,
              life: 0.9 + Math.random() * 0.6,
              size: sizePx,
              color: gold,
              shape: 2,
              spin: (Math.random() - 0.5) * 6,
              gravity: params.fall,
              drag: 0.4,
              flutter: 8 + Math.random() * 6,
              fadeIn: 0.001,
            });
          }
        }
      }
      env.lastP = state.progress;
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 600, 6000, 50],
    ['rows', 'File di scaglie', 5, 20, 1],
    ['gold', 'Oro sul dorso', 0, 1, 0.01],
    ['seams', 'Giunture', 0, 1, 0.01],
    ['shine', 'Riflesso', 0, 2.5, 0.01],
    ['fall', 'Caduta', -0.2, 2, 0.01],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    muta: { label: 'Muta', params: {} },
    tesoro: { label: 'Pioggia d\'oro', params: { durationMs: 2000, rows: 15, gold: 0.95, shine: 1.8, fall: 1.1, direction: 'top' } },
  },
};
