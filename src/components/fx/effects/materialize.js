// Materializzazione (entrata): l'opposto della bruciatura. Un fronte di luce nel colore
// dell'armata percorre l'elemento e lo «disegna»; davanti al fronte si intravede già il
// contorno olografico della carta (bordi e sagoma, con scanline), dietro la carta compare
// con un bagliore che si spegne. Faville di luce salgono dal fronte.

import {
  QUAD_VERT,
  clearCanvas,
  createFullscreenQuad,
  createProgram,
  createSourceTexture,
  getFxContext,
  hexToRgb01,
  loseContext,
} from '../glUtils.js';
import {
  NOISE_GLSL,
  SWEEP_DIRECTIONS,
  SWEEP_GLSL,
  SWEEP_UNIFORMS,
  createSweepRangeCache,
  setSweepUniforms,
  sweepBaseAt,
} from '../fxNoise.js';
import { createEmberLayer, createSpawnClock } from '../emberLayer.js';

export const MATERIALIZE_DEFAULTS = {
  durationMs: 1600,
  /** Colore della luce (di norma l'accento dell'armata) */
  color: '#38bdf8',
  /** Spessore della fascia di luce */
  bandWidth: 0.08,
  /** Bagliore dietro il fronte */
  glow: 1,
  /** Quanto la parte appena comparsa è tinta del colore della luce */
  trailTint: 0.45,
  /** Visibilità del contorno olografico davanti al fronte */
  ghost: 0.55,
  /** Forza dei bordi nel contorno olografico */
  edgeStrength: 1.6,
  /** Intensità delle scanline del contorno */
  scanlines: 0.5,
  /** Faville di luce dal fronte (al secondo) */
  sparkles: 60,
  /** Da dove compare */
  direction: 'top',
  originX: 0.5,
  originY: 0.5,
  /** Scala del rumore del fronte */
  sweepScale: 3,
  /** Peso del rumore rispetto alla direzione */
  sweepAmount: 0.25,
  seed: 0,
};

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uRect;
uniform vec2 uTexel;
uniform float uThreshold;
uniform vec2 uRange;
uniform float uProgress;
uniform float uTime;
uniform vec3 uColor;
uniform float uBand;
uniform float uGlow;
uniform float uTrail;
uniform float uGhost;
uniform float uEdge;
uniform float uScan;
${NOISE_GLSL}
${SWEEP_GLSL}

float luma(vec4 c) { return dot(c.rgb, vec3(0.299, 0.587, 0.114)) + c.a * 0.5; }

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec4 tex = texture2D(uTex, p);
  float s = (sweepBase(p) - uRange.x) / max(uRange.y - uRange.x, 1e-4);
  float dist = uThreshold - s; // > 0: già comparso
  vec3 hot = mix(uColor, vec3(1.0), 0.6);

  // contorno olografico: bordi (luminanza + alpha) e sagoma, con scanline che scorrono
  float gx = luma(texture2D(uTex, p + vec2(uTexel.x, 0.0))) - luma(texture2D(uTex, p - vec2(uTexel.x, 0.0)));
  float gy = luma(texture2D(uTex, p + vec2(0.0, uTexel.y))) - luma(texture2D(uTex, p - vec2(0.0, uTexel.y)));
  float edge = clamp(length(vec2(gx, gy)) * uEdge, 0.0, 1.0);
  float scan = 1.0 - uScan * 0.5 * (1.0 + sin(p.y * 420.0 - uTime * 14.0));
  float flicker = 0.85 + 0.15 * noise(vec2(uTime * 18.0, p.y * 30.0));
  float ghostIn = smoothstep(0.0, 0.18, uProgress);
  float ghostA = (edge * 0.9 + tex.a * 0.12) * scan * flicker * uGhost * ghostIn;

  // fascia di luce sul fronte e scia luminosa dietro
  float band = 1.0 - smoothstep(0.0, uBand, abs(dist - uBand * 0.5));
  float shown = smoothstep(0.0, uBand * 0.5, dist);
  float trail = exp(-max(dist, 0.0) / max(uBand * 2.5, 1e-3));

  vec3 col = tex.rgb * shown;
  col = mix(col, uColor * tex.a * shown, uTrail * trail * shown);
  col += uColor * trail * uGlow * 0.45 * tex.a * shown;
  float alpha = tex.a * shown;

  // davanti al fronte: solo il fantasma
  float before = 1.0 - shown;
  col += uColor * ghostA * before;
  alpha += ghostA * before * 0.9;

  // la fascia stessa, sopra tutto (anche sulle parti trasparenti della sagoma, ma solo dentro)
  float bandA = band * max(tex.a, 0.25 * step(0.01, tex.a + edge));
  col += mix(uColor, hot, 0.45) * bandA * 1.1;
  alpha = max(alpha, min(1.0, bandA));

  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

function sweepOf(params) {
  return {
    direction: params.direction,
    originX: params.originX,
    originY: params.originY,
    seed: params.seed,
    scale: params.sweepScale,
    amount: params.sweepAmount,
  };
}

/** Soglia: a 0 la fascia è tutta prima dell'elemento, a 1 tutta oltre. */
function threshold(progress, band) {
  return -band * 1.2 + (1 + band * 2.4) * Math.max(0, Math.min(1, progress));
}

function createMaterializeRenderer(canvas) {
  const gl = getFxContext(canvas);
  if (!gl) return null;
  const { prog, u, a } = createProgram(
    gl,
    QUAD_VERT,
    FRAG,
    ['uTex', 'uRect', 'uTexel', 'uThreshold', 'uRange', 'uProgress', 'uTime', 'uColor', 'uBand', 'uGlow', 'uTrail', 'uGhost', 'uEdge', 'uScan', ...SWEEP_UNIFORMS],
    ['aPos'],
  );
  const quad = createFullscreenQuad(gl);
  const source = createSourceTexture(gl);
  const embers = createEmberLayer(gl, 400);
  const spawnClock = createSpawnClock();
  const rangeOf = createSweepRangeCache();
  let texel = [1 / 460, 1 / 660];
  let hasSource = false;

  return {
    setSource(src) {
      source.upload(src);
      texel = [1.5 / Math.max(1, src.width), 1.5 / Math.max(1, src.height)];
      hasSource = true;
    },
    draw(state) {
      clearCanvas(gl, canvas);
      if (!hasSource) return;
      const { params, rect, aspect } = state;
      const color = hexToRgb01(params.color);
      const sweep = sweepOf(params);
      const range = rangeOf(sweep, aspect);
      const T = threshold(state.progress, params.bandWidth);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      // a effetto finito il contenuto vero è già visibile: restano solo le faville
      if (!state.done) {
        gl.useProgram(prog);
        source.bind(0);
        gl.uniform1i(u.uTex, 0);
        gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform2f(u.uTexel, texel[0], texel[1]);
        gl.uniform1f(u.uThreshold, T);
        gl.uniform2f(u.uRange, range.min, range.max);
        gl.uniform1f(u.uProgress, state.progress);
        gl.uniform1f(u.uTime, state.time);
        gl.uniform3f(u.uColor, color[0], color[1], color[2]);
        gl.uniform1f(u.uBand, params.bandWidth);
        gl.uniform1f(u.uGlow, params.glow);
        gl.uniform1f(u.uTrail, params.trailTint);
        gl.uniform1f(u.uGhost, params.ghost);
        gl.uniform1f(u.uEdge, params.edgeStrength);
        gl.uniform1f(u.uScan, params.scanlines);
        setSweepUniforms(gl, u, sweep, aspect);
        quad.draw(a.aPos);

        const n = spawnClock(params.sparkles * state.active, state.dt);
        for (let i = 0; i < n; i += 1) {
          for (let k = 0; k < 12; k += 1) {
            const x = Math.random();
            const y = Math.random();
            const s = (sweepBaseAt(x, y, sweep, aspect) - range.min) / Math.max(range.max - range.min, 1e-4);
            const d = T - s;
            if (d >= 0 && d <= params.bandWidth) {
              embers.spawn(rect[0] + x * rect[2], rect[1] + y * rect[3], {
                vx: (Math.random() - 0.5) * 0.03,
                vy: -(0.02 + Math.random() * 0.07),
                life: 0.5 + Math.random() * 0.8,
                size: 1 + Math.random() * 2.4,
                heat: 0.5 + Math.random() * 0.5,
                rise: 0.02,
              });
              break;
            }
          }
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
      gl.deleteTexture(source.tex);
      gl.deleteBuffer(quad.buf);
      gl.deleteProgram(prog);
      loseContext(gl);
    },
  };
}

export const materializeEffect = {
  id: 'materialize',
  label: 'Materializzazione',
  kind: 'in',
  description: 'La carta compare dal nulla, disegnata da un fronte di luce (entrata).',
  defaults: MATERIALIZE_DEFAULTS,
  directions: SWEEP_DIRECTIONS,
  /** Rapida all'inizio, rallenta mentre completa la carta */
  curve: (t) => 1 - Math.pow(1 - t, 1.6),
  padding: (w, h) => ({ left: w * 0.1, right: w * 0.1, top: h * 0.3, bottom: h * 0.1 }),
  createRenderer: createMaterializeRenderer,
  sliders: [
    ['durationMs', 'Durata (ms)', 400, 5000, 50],
    ['bandWidth', 'Fascia di luce', 0.01, 0.3, 0.005],
    ['glow', 'Bagliore', 0, 2.5, 0.01],
    ['trailTint', 'Scia colorata', 0, 1, 0.01],
    ['ghost', 'Contorno olografico', 0, 1.5, 0.01],
    ['edgeStrength', 'Forza bordi', 0, 5, 0.05],
    ['scanlines', 'Scanline', 0, 1, 0.01],
    ['sparkles', 'Faville / s', 0, 300, 1],
    ['sweepScale', 'Scala rumore', 0.5, 12, 0.1],
    ['sweepAmount', 'Peso rumore', 0, 1, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    ologramma: { label: 'Ologramma', params: {} },
    evocazione: {
      label: 'Evocazione',
      params: { durationMs: 2200, bandWidth: 0.14, glow: 1.6, trailTint: 0.7, ghost: 0.3, edgeStrength: 1, scanlines: 0.15, sparkles: 160, direction: 'bottom', sweepScale: 3.5, sweepAmount: 0.45 },
    },
    stampa: {
      label: 'Stampa netta',
      params: { durationMs: 1000, bandWidth: 0.03, glow: 0.6, trailTint: 0.2, ghost: 0.8, edgeStrength: 2.4, scanlines: 0.8, sparkles: 20, direction: 'top', sweepScale: 3, sweepAmount: 0 },
    },
    nebbia: {
      label: 'Dalla nebbia',
      params: { durationMs: 2600, bandWidth: 0.2, glow: 0.9, trailTint: 0.5, ghost: 0.15, edgeStrength: 0.8, scanlines: 0, sparkles: 90, direction: 'scatter', sweepScale: 4, sweepAmount: 1 },
    },
  },
};
