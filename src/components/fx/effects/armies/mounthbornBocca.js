// Mounthborn (Nati dalla Bocca) · «Bocca» (ingresso): una fauce di chitina, mandibole
// dentate chiuse a spirale, palpita; poi si spalanca e dalla gola sale la carta, filamenti
// di bava che si tendono e si spezzano. I Nati dalla Bocca: la Fame che non si placa.

import { createQuadFxRenderer, QUAD_HEADER } from '../../quadRenderer.js';

const FRAG = `${QUAD_HEADER}
uniform float uOpen;
uniform float uBlades;
uniform float uTwist;
uniform float uMaw;
uniform float uGrowCard;
uniform float uDrool;
uniform float uPulse;
uniform float uRadius;

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec2 P = vec2((p.x - 0.5) * uAspect, p.y - 0.5);
  float r = length(P);
  float th = atan(P.y, P.x);
  float N = uBlades;
  float seg = 6.2831853 / N;
  float R = uRadius;

  // apertura a diaframma: poligono che ruota e si allarga, con denti sul bordo
  float rot = uOpen * uTwist;
  float aa = mod(th + rot, seg) - seg * 0.5;
  float ro = uOpen * R * 1.08;
  float polyR = ro / max(cos(aa), 0.2);
  float tooth = abs(fract((th + rot) / seg * 7.0) - 0.5) * 2.0;
  float teeth = (1.0 - tooth) * 0.035 * smoothstep(0.0, 0.2, uOpen);
  float edgeR = polyR - teeth;
  float hole = 1.0 - smoothstep(edgeR - 0.004, edgeR + 0.004, r);

  // mandibole: chitina scura a lamine, giunture a spirale fra una lama e l'altra
  float spiral = th + rot - (r - ro) * 3.0;
  float bladeId = floor(spiral / seg);
  float joint = abs(fract(spiral / seg) - 0.5);
  float seam = 1.0 - smoothstep(0.02, 0.05, 0.5 - joint);
  // chitina quasi nera a segmenti (anelli), un riflesso freddo e un filo del colore armata
  float lam = fbm(vec2(r * 10.0, bladeId * 3.1));
  float ridge = smoothstep(0.35, 0.5, abs(fract(r * 16.0 + bladeId * 0.37) - 0.5));
  vec3 chitin = mix(vec3(0.025, 0.022, 0.015), vec3(0.07, 0.065, 0.04), lam) * (1.0 - ridge * 0.5);
  float sheen = pow(max(0.0, 1.0 - abs(joint - 0.22) * 5.0), 4.0);
  chitin += mix(vec3(0.5, 0.55, 0.45), uColor, 0.4) * sheen * 0.12;
  chitin *= 1.0 - seam * 0.6;
  // bordo della fauce: carne viva e denti chiari
  float lip = exp(-max(r - edgeR, 0.0) / 0.02) * (1.0 - hole);
  chitin = mix(chitin, mix(vec3(0.35, 0.08, 0.06), vec3(0.85, 0.8, 0.6), smoothstep(0.4, 1.0, 1.0 - tooth)), lip * 0.7);
  float pulse = 1.0 + uPulse * sin(uTime * 9.0) * 0.015;
  float disc = 1.0 - smoothstep(R * pulse - 0.01, R * pulse + 0.01, r + (noise(vec2(th * 6.0, 1.0)) - 0.5) * 0.04);
  float mawA = disc * (1.0 - hole) * uMaw;

  // dalla gola: la carta sale ingrandendosi, con il buio della gola attorno
  vec2 q = P / max(uGrowCard, 0.05);
  vec4 tex = cardAt(vec2(q.x / uAspect, q.y) + 0.5);
  float throat = (1.0 - smoothstep(0.0, max(ro, 1e-3), r)) * (1.0 - uGrowCard) * 0.8;
  vec3 card = tex.rgb * (1.0 - throat);
  // filamenti di bava fra i bordi, che si allungano e si spezzano
  float strand = 1.0 - smoothstep(0.004, 0.01, abs(fract(P.x * 9.0 + noise(vec2(P.y * 3.0, 2.0)) * 0.5) - 0.5));
  float sag = noise(vec2(floor(P.x * 9.0), 4.0));
  float strandA = strand * hole * step(sag, 0.6) * uDrool * smoothstep(edgeR * 0.4, edgeR * 0.9, r);
  vec3 slime = mix(uColor, vec3(0.9, 1.0, 0.7), 0.5);

  vec3 inside = card * hole;
  float insideA = tex.a * hole * step(0.001, uOpen);
  vec3 col = inside + slime * strandA * 0.5;
  float a = max(insideA, strandA * 0.5);
  col = mix(col, chitin, mawA);
  a = max(a, mawA);
  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const mounthbornBoccaEffect = {
  id: 'mounthborn-bocca',
  army: 'Mounthborn',
  role: 'entry',
  label: 'Bocca',
  kind: 'in',
  description: 'Una fauce di chitina palpita, si spalanca e dalla gola sale la carta.',
  defaults: {
    durationMs: 2800,
    color: '#c9e238',
    appear: 0.12,
    openStart: 0.32,
    blades: 7,
    twist: 1.4,
    radius: 0.6,
    drool: 1,
    pulse: 1,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: (w, h) => {
    const m = Math.max(w, h);
    return { left: m * 0.4, right: m * 0.4, top: m * 0.25, bottom: m * 0.25 };
  },
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uOpen', 'uBlades', 'uTwist', 'uMaw', 'uGrowCard', 'uDrool', 'uPulse', 'uRadius'],
    bind: (gl, u, { params, progress: t, aspect }) => {
      const k = clamp01((t - params.openStart) / Math.max(0.88 - params.openStart, 0.05));
      // apre a scatti, come mandibole che mordono l'aria
      const open = ease(k) + Math.sin(k * Math.PI * 3) * 0.04 * (1 - k);
      // il raggio deve coprire gli angoli della carta
      const R = Math.max(params.radius, Math.hypot(aspect * 0.5, 0.5) + 0.04);
      gl.uniform1f(u.uOpen, Math.max(0, open));
      gl.uniform1f(u.uBlades, Math.round(params.blades));
      gl.uniform1f(u.uTwist, params.twist);
      gl.uniform1f(u.uRadius, R);
      gl.uniform1f(u.uMaw, ease(clamp01(t / Math.max(params.appear, 0.02))) * (1 - ease(clamp01((t - 0.82) / 0.16))));
      gl.uniform1f(u.uGrowCard, 0.55 + 0.45 * ease(clamp01((t - params.openStart) / Math.max(0.95 - params.openStart, 0.05))));
      gl.uniform1f(u.uDrool, params.drool * (1 - ease(clamp01((k - 0.35) / 0.3))) * (k > 0 ? 1 : 0));
      gl.uniform1f(u.uPulse, params.pulse * (k < 0.05 ? 1 : 0));
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['appear', 'Comparsa fauce', 0.02, 0.4, 0.01],
    ['openStart', 'Apertura', 0.1, 0.7, 0.01],
    ['blades', 'Mandibole', 3, 12, 1],
    ['twist', 'Torsione', 0, 4, 0.05],
    ['radius', 'Ampiezza fauce', 0.5, 1, 0.01],
    ['drool', 'Bava', 0, 2, 0.01],
    ['pulse', 'Palpito', 0, 3, 0.01],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    bocca: { label: 'Bocca', params: {} },
    vorace: { label: 'Vorace', params: { durationMs: 2000, openStart: 0.25, blades: 9, twist: 2.4, drool: 1.6 } },
  },
};
