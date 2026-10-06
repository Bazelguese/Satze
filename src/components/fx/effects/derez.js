// Derez: glitch (strappi orizzontali, canali RGB sfasati), la carta si
// scompone in pixel percorsi da circuiti luminosi, poi i blocchi si staccano e salgono
// come un flusso di dati. «Quando si attivano, nulla li ferma.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../quadRenderer.js';
import { SWEEP_DIRECTIONS, sweepOf, sweepAt, cardHeightPx } from './armies/common.js';

const FRAG = `${QUAD_HEADER}
uniform float uGlitch;
uniform float uChroma;
uniform float uBlocks;
uniform float uPixelMin;
uniform float uCircuits;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  float t = uProgress;
  float g = smoothstep(0.0, 0.3, t) * uGlitch;
  // strappi orizzontali a raffiche
  float rows = 38.0;
  float row = floor(p.y * rows);
  float tick = floor(uTime * 14.0);
  float burst = step(0.72, hash(vec2(row, tick)));
  vec2 pg = p + vec2((hash(vec2(row, tick + 7.0)) - 0.5) * 0.08 * g * burst, 0.0);
  // pixelazione crescente
  float res = mix(260.0, uPixelMin, smoothstep(0.2, 0.7, t));
  vec2 cellsXY = vec2(res, res / uAspect);
  vec2 pq = (floor(pg * cellsXY) + 0.5) / cellsXY;
  float ch = uChroma * g;
  vec4 tr = cardAt(pq + vec2(ch, 0.0));
  vec4 tg = cardAt(pq);
  vec4 tb = cardAt(pq - vec2(ch, 0.0));
  float a = max(tg.a, max(tr.a, tb.a));
  vec3 col = vec3(tr.r, tg.g, tb.b);

  // circuiti: linee della griglia di pixel con impulsi che corrono
  vec2 f = fract(pg * cellsXY);
  float line = max(1.0 - smoothstep(0.0, 0.12, f.x), 1.0 - smoothstep(0.0, 0.12, f.y));
  float pulse = step(0.86, noise(floor(pg * cellsXY) * 0.35 + vec2(uTime * 3.0, 0.0)));
  float circ = line * (0.25 + pulse) * uCircuits * smoothstep(0.15, 0.55, t);
  col += mix(uColor, vec3(1.0), 0.4) * circ * a;
  // scanline
  col *= 0.88 + 0.12 * sin(p.y * 700.0 + uTime * 30.0) * g;

  // i blocchi se ne vanno uno a uno
  vec2 bXY = vec2(uBlocks, floor(uBlocks / uAspect + 0.5));
  vec2 bc = (floor(p * bXY) + 0.5) / bXY;
  float s = sweepN(bc);
  float tGo = 0.42 + s * 0.5;
  float gone = step(tGo, t);
  float flash = (1.0 - smoothstep(0.0, 0.05, tGo - t)) * (1.0 - gone);
  col += mix(uColor, vec3(1.0), 0.6) * flash * a * 0.8;
  gl_FragColor = outColor(col * (1.0 - gone), a * (1.0 - gone));
}
`;

export const derezEffect = {
  id: 'derez',
  label: 'Derez',
  kind: 'out',
  description: 'Glitch, pixel e circuiti: la carta si smonta in un flusso di dati che sale.',
  defaults: {
    durationMs: 2300,
    color: '#26c4e8',
    glitch: 1,
    chroma: 0.014,
    blocks: 14,
    pixelMin: 28,
    circuits: 0.9,
    stream: 1,
    direction: 'top',
    originX: 0.5,
    originY: 0.5,
    sweepScale: 3,
    sweepAmount: 0.55,
    seed: 0,
  },
  directions: SWEEP_DIRECTIONS,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.2, right: m * 0.2, top: m * 1.1, bottom: m * 0.1 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uGlitch', 'uChroma', 'uBlocks', 'uPixelMin', 'uCircuits'],
    sweep: sweepOf,
    needsPixels: true,
    maxFlakes: 1200,
    bind: (gl, u, { params }) => {
      gl.uniform1f(u.uGlitch, params.glitch);
      gl.uniform1f(u.uChroma, params.chroma);
      gl.uniform1f(u.uBlocks, Math.round(params.blocks));
      gl.uniform1f(u.uPixelMin, params.pixelMin);
      gl.uniform1f(u.uCircuits, params.circuits);
    },
    particles: (state, env) => {
      const { params, rect, aspect } = state;
      const bx = Math.round(params.blocks);
      const by = Math.floor(bx / aspect + 0.5);
      const key = [bx, by, env.range.min, env.range.max, JSON.stringify(env.sweep)].join('|');
      if (env.memo.key !== key) {
        const list = [];
        for (let j = 0; j < by; j += 1) {
          for (let i = 0; i < bx; i += 1) {
            const cx = (i + 0.5) / bx;
            const cy = (j + 0.5) / by;
            const px = env.pixels ? env.pixels.at(cx, cy) : [1, 1, 1, 1];
            if (px[3] < 0.2) continue;
            list.push({ cx, cy, tGo: 0.42 + sweepAt(env, aspect, cx, cy) * 0.5, color: px });
          }
        }
        env.memo = { key, list };
      }
      const prev = env.lastP ?? 0;
      const blockPx = cardHeightPx(state, env.canvas) / by;
      // un salto grosso (cursore dell'anteprima trascinato) non deve liberare tutti i blocchi insieme
      if (!state.done && state.progress - prev < 0.3) {
        for (const b of env.memo.list) {
          if (prev < b.tGo && state.progress >= b.tGo) {
            // ogni blocco si sfalda in alcuni pixel che salgono veloci
            const pieces = Math.max(1, Math.round(3 * params.stream));
            for (let k = 0; k < pieces; k += 1) {
              const jx = (Math.random() - 0.5) / bx;
              const jy = (Math.random() - 0.5) / by;
              const [x, y] = toCanvasUv(rect, b.cx + jx, b.cy + jy);
              const tint = Math.random() < 0.5 ? env.color : b.color.slice(0, 3);
              env.flakes.spawn(x, y, {
                vx: (Math.random() - 0.5) * 0.02,
                vy: -(0.25 + Math.random() * 0.45),
                life: 0.5 + Math.random() * 0.6,
                size: blockPx * (0.35 + Math.random() * 0.35),
                color: tint,
                shape: 3,
                spin: 0,
                angle: 0,
                gravity: -0.4,
                drag: 0.2,
                flutter: 0,
                fadeIn: 0.001,
              });
            }
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
    ['glitch', 'Glitch', 0, 2, 0.01],
    ['chroma', 'Sfasamento RGB', 0, 0.05, 0.001],
    ['blocks', 'Blocchi (larghezza)', 4, 30, 1],
    ['pixelMin', 'Pixel finali', 8, 120, 1],
    ['circuits', 'Circuiti', 0, 2, 0.01],
    ['stream', 'Flusso di dati', 0, 3, 0.01],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    derez: { label: 'Derez', params: {} },
    overdrive: { label: 'Overdrive', params: { durationMs: 1400, glitch: 1.8, chroma: 0.03, blocks: 20, pixelMin: 18, circuits: 1.6, stream: 2 } },
  },
};
