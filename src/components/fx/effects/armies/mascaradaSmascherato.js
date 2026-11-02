// Mascarada · «Smascherato» (sconfitta inflitta): la faccia della carta battuta è un costume
// di scena e qualcuno glielo strappa di dosso. Prima la stoffa si tende (il bordo in basso si
// arriccia, compaiono le pieghe di tensione), poi si lacera dal basso verso l'alto: il bordo
// è sfilacciato, i fili si allungano tra la stoffa che sale e il fondo e si spezzano uno dopo
// l'altro. Sotto non resta niente. Senza costume non sei nessuno. «Il pubblico paga. Tu riscuoti.»

import { createQuadFxRenderer, QUAD_HEADER, toCanvasUv } from '../../quadRenderer.js';
import { widePadding } from './common.js';

const FRAG = `${QUAD_HEADER}
uniform float uFold;
uniform float uTug;
uniform float uVoid;
uniform float uFlapA;
uniform float uThreads;
uniform float uRnd;

/** Profilo del fronte di strappo lungo la piega: frastagliato a due scale (stoffa lacerata). */
float tearEdge(float t) {
  return (fbm(vec2(t * 7.0 + uRnd, 3.1)) - 0.5) * 0.07 + (noise(vec2(t * 55.0, uRnd * 1.7)) - 0.5) * 0.018;
}

/** Trama di tessuto (ordito e trama a scacchi) per il rovescio del costume. */
float weave(vec2 q) {
  float chk = mod(floor(q.x) + floor(q.y), 2.0);
  float warp = 1.0 - abs(fract(q.x) - 0.5) * 2.0;
  float weft = 1.0 - abs(fract(q.y) - 0.5) * 2.0;
  return mix(weft, warp, chk);
}

float minAlpha4(vec2 p, float r) {
  return min(min(cardAt(p + vec2(r, 0.0)).a, cardAt(p - vec2(r, 0.0)).a), min(cardAt(p + vec2(0.0, r)).a, cardAt(p - vec2(0.0, r)).a));
}

void main() {
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  vec3 blue = uColor;
  vec3 gold = vec3(1.0, 0.82, 0.32);
  vec3 fiber = mix(vec3(0.93, 0.9, 0.86), blue, 0.3);

  // s: lungo la direzione dello strappo (dal basso verso l'alto); t: lungo il fronte
  vec2 dir = normalize(vec2(0.22, -1.0));
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 o = vec2(0.15, 1.0);
  float s = dot(p - o, dir);
  float t = dot(p - o, perp);
  float started = step(-0.095, uFold);
  float F = uFold + tearEdge(t);

  // tensione: prima dello strappo il bordo basso viene tirato su; poi la stoffa davanti al
  // fronte si tende verso la lacerazione
  float k = smoothstep(0.3, 1.0, p.y);
  float tug = uTug * k * k;
  float front = s > F ? exp(-(s - F) / 0.07) * started : 0.0;
  float strain = max(tug, front);
  vec2 q = p + vec2(-0.25, 1.0) * tug * 0.05 + dir * 0.014 * front;
  vec4 tex = cardAt(q);
  vec4 base = cardAt(p);
  float creases = 0.5 + 0.5 * sin(t * 140.0 + fbm(vec2(t * 9.0, s * 3.0)) * 7.0);

  vec3 col = vec3(0.0);
  float a = 0.0;
  if (s > F) {
    // ancora addosso: pieghe di tensione e l'ombra del lembo vicino alla lacerazione
    float shadow = 0.4 * exp(-(s - F) / 0.03) * started;
    col = (tex.rgb * (1.0 - strain * 0.38 * creases) + tex.rgb * strain * 0.18 * (1.0 - creases)) * (1.0 - shadow);
    a = tex.a;
  } else if (base.a > 0.002) {
    // strappata: resta il vuoto, nero con un filo di luce sul contorno
    float rim = clamp(base.a - minAlpha4(p, 0.015), 0.0, 1.0);
    col = (vec3(0.012, 0.01, 0.02) + blue * rim * 0.6) * base.a * uVoid;
    a = base.a * uVoid;

    // frangia: peli di stoffa che sporgono dal bordo lacerato
    float fw = 0.005;
    float fi = floor(t / fw);
    float fh = hash(vec2(fi, uRnd + 2.0));
    float hairLen = step(0.35, fh) * (0.004 + fh * 0.014);
    float hairX = abs(fract(t / fw) - 0.5);
    float hair = step(F - s, hairLen) * (1.0 - smoothstep(0.18, 0.4, hairX)) * started;
    vec3 edgeCol = cardAt(p + dir * (F - s + 0.006)).rgb * 0.85 + fiber * 0.15;

    // fili: ognuno è ancorato al fondo e attaccato alla stoffa che sale; si allunga, si
    // assottiglia e quando non regge più si spezza e si arriccia
    float colW = 0.022;
    float cellH = 0.03;
    float ti = floor(t / colW);
    float thr = 0.0;
    for (int kk = 0; kk < 9; kk++) {
      float si = floor(s / cellH) - float(kk);
      vec2 id = vec2(ti, si) + uRnd;
      if (hash(id) > uThreads) continue;
      float h1 = hash(id + 7.13);
      float h2 = hash(id + 3.71);
      float h3 = hash(id + 11.9);
      float s0 = (si + h1) * cellH;
      float len = F - s0;
      if (s < s0 || len <= 0.0) continue;
      float snapL = 0.05 + h2 * 0.1;
      float tc = (ti + 0.5 + (h3 - 0.5) * 0.5) * colW;
      float u = (s - s0) / max(len, 1e-4);
      if (len < snapL) {
        float tension = len / snapL;
        float w = mix(0.006, 0.003, tension);
        float bow = sin(u * 3.14159) * (h3 - 0.5) * 0.01 * (1.0 - tension);
        float d = abs(t - tc - bow);
        thr = max(thr, (1.0 - smoothstep(w * 0.5, w, d)) * (0.65 + 0.35 * tension));
      } else {
        // spezzato: un ciuffo resta sul fondo, l'altro torna verso la stoffa; entrambi svaniscono
        float fade = 1.0 - smoothstep(0.0, 0.07, len - snapL);
        float tl = snapL * 0.35 * (0.6 + 0.4 * fade);
        float low = s - s0;
        float high = F - s;
        float uu = low < tl ? low / tl : (high < tl * 0.8 ? high / (tl * 0.8) : 2.0);
        if (uu <= 1.0) {
          float curl = uu * uu * (h1 - 0.5) * 0.03 * (1.6 - fade);
          float d = abs(t - tc - curl);
          thr = max(thr, (1.0 - smoothstep(0.0025, 0.005, d)) * fade * (1.0 - uu * 0.5));
        }
      }
    }
    thr *= uVoid * started;
    col = mix(col, edgeCol * base.a, hair * base.a);
    a = max(a, hair * base.a);
    col = mix(col, mix(fiber, edgeCol, 0.45), thr);
    a = max(a, thr);
  }

  // il lembo: la stoffa già strappata si ribalta oltre il fronte e sale (se ne vede il rovescio).
  // Si ribalta attorno alla piega dritta, così l'orlo resta dritto e il bordo lacerato è sulla piega
  vec2 src = p - dir * 2.0 * (s - uFold);
  if (started > 0.5 && s > F && dot(src - o, dir) < F) {
    vec4 back = cardAt(src);
    if (back.a > 0.002) {
      float shade = 0.55 + 0.35 * smoothstep(0.0, 0.25, s - uFold);
      float curlLight = exp(-max(s - F, 0.0) / 0.015) * 0.3;
      vec2 wq = src * vec2(uAspect, 1.0) * 46.0;
      vec3 lining = mix(blue * 0.5, vec3(0.78, 0.8, 0.9), 0.18) * (0.72 + 0.38 * weave(wq));
      // cucitura dorata lungo l'orlo del costume
      float seam = clamp(minAlpha4(src, 0.012) - minAlpha4(src, 0.024), 0.0, 1.0);
      float stitch = step(0.45, fract((src.x * uAspect + src.y) * 32.0));
      lining = mix(lining, gold, seam * stitch * 0.9);
      vec3 cloth = lining * shade + vec3(curlLight);
      float fa = back.a * uFlapA * smoothstep(-0.6, -0.35, p.y);
      col = mix(col, cloth * fa, fa);
      a = max(a, fa);
    }
  }

  gl_FragColor = outColor(col, a);
}
`;

const ease = (k) => k * k * (3 - 2 * k);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const FOLD_START = -0.1;
const FOLD_END = 1.4;
const TEAR_END = 0.84;

/** Origine e direzioni dello strappo (uv della carta), come nello shader. */
const DIR = (() => {
  const l = Math.hypot(0.22, 1);
  return [0.22 / l, -1 / l];
})();
const PERP = [-DIR[1], DIR[0]];
const ORIGIN = [0.15, 1];

/** Avanzamento dello strappo 0-1: strattoni a scatti (la stoffa cede a tratti). */
function tearProgress(p, t) {
  const r = clamp01((t - p.rip) / Math.max(TEAR_END - p.rip, 0.05));
  const jerky = r + (p.jerk * Math.sin(r * Math.PI * 8)) / (Math.PI * 8);
  return clamp01(0.5 * jerky + 0.5 * ease(jerky));
}

function foldAt(p, t) {
  return t < p.rip ? FOLD_START : FOLD_START + tearProgress(p, t) * (FOLD_END - FOLD_START);
}

export const mascaradaSmascheratoEffect = {
  id: 'mascarada-smascherato',
  army: 'Mascarada',
  role: 'defeat',
  label: 'Smascherato',
  kind: 'out',
  description: 'La faccia della carta è un costume: si tende e viene strappata via come stoffa, con il bordo sfilacciato e i fili che si spezzano, lasciando il vuoto.',
  defaults: {
    durationMs: 2600,
    color: '#437ef2',
    rip: 0.3,
    tug: 1,
    jerk: 0.8,
    threads: 0.4,
    fluff: 70,
    seed: 0,
  },
  directions: null,
  curve: (t) => t,
  padding: widePadding,
  createRenderer: (canvas) => createQuadFxRenderer(canvas, {
    frag: FRAG,
    uniforms: ['uFold', 'uTug', 'uVoid', 'uFlapA', 'uThreads', 'uRnd'],
    maxFlakes: 400,
    bind: (gl, u, { params, progress: t }) => {
      // tensione che cresce a strattoni e si scarica di colpo quando la stoffa cede
      const build = ease(clamp01(t / Math.max(params.rip, 0.05)));
      const shake = 1 + 0.12 * Math.sin(t * 140);
      const release = 1 - ease(clamp01((t - params.rip) / 0.06));
      gl.uniform1f(u.uTug, params.tug * build * shake * release);
      gl.uniform1f(u.uFold, foldAt(params, t));
      gl.uniform1f(u.uVoid, 1 - ease(clamp01((t - 0.86) / 0.14)));
      gl.uniform1f(u.uFlapA, 1 - ease(clamp01((t - 0.78) / 0.16)));
      gl.uniform1f(u.uThreads, clamp01(params.threads));
      gl.uniform1f(u.uRnd, (params.seed ?? 0) * 7.31);
    },
    particles: (state, env) => {
      const { params, rect } = state;
      const t = state.progress;
      const prev = env.memo.prev ?? t;
      env.memo.prev = t;
      const fold = foldAt(params, t);
      const prevFold = env.memo.prevFold ?? fold;
      env.memo.prevFold = fold;
      // pelucchi e fili che si staccano lungo il fronte mentre avanza (più uno sbuffo allo strappo)
      let n = 0;
      if (prev < params.rip && t >= params.rip && t - prev < 0.3) n += Math.round(params.fluff * 0.35);
      if (fold > prevFold && fold - prevFold < 0.5) {
        env.memo.acc = (env.memo.acc ?? 0) + (fold - prevFold) * params.fluff;
        n += Math.floor(env.memo.acc);
        env.memo.acc -= Math.floor(env.memo.acc);
      }
      for (let i = 0, tries = 0; i < n && tries < n * 4; tries += 1) {
        const tt = -0.25 + Math.random() * 1.45;
        const s = Math.max(fold, 0);
        const x = ORIGIN[0] + DIR[0] * s + PERP[0] * tt;
        const y = ORIGIN[1] + DIR[1] * s + PERP[1] * tt;
        if (x < 0 || x > 1 || y < 0 || y > 1) continue;
        i += 1;
        const [cx, cy] = toCanvasUv(rect, x, y);
        const sp = 0.03 + Math.random() * 0.12;
        const a = Math.atan2(DIR[1], DIR[0]) + (Math.random() - 0.5) * 2.2;
        env.flakes.spawn(cx, cy, {
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.5 + Math.random() * 0.6,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.6 ? [0.93, 0.9, 0.86] : env.color,
          shape: 0,
          gravity: 0.25,
          drag: 2,
        });
      }
      env.flakes.step(state.dt);
      env.embers.step(state.dt);
    },
  }),
  sliders: [
    ['durationMs', 'Durata (ms)', 800, 6000, 50],
    ['rip', 'Inizio strappo', 0.1, 0.6, 0.01],
    ['tug', 'Tensione', 0, 2, 0.05],
    ['jerk', 'Strattoni', 0, 1, 0.05],
    ['threads', 'Fili', 0, 1, 0.01],
    ['fluff', 'Pelucchi', 0, 200, 1],
    ['seed', 'Seme', 0, 100, 1],
  ],
  colorParams: [],
  presets: {
    smascherato: { label: 'Smascherato', params: {} },
    colpoBasso: { label: 'Colpo basso', params: { durationMs: 1800, rip: 0.18, tug: 0.7, jerk: 0.4 } },
  },
};
