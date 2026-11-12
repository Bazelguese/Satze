// ============================================
// EMINENZE — Scene dedicate delle abilità maggiori (canvas 2D)
// ============================================
//
// Otto abilità cambiano la partita più delle altre e hanno una scena tutta loro, oltre
// all'effetto d'attivazione comune (effectFxEngine.js). Come quello, ogni scena è una
// funzione del tempo senza stato: `createAbilityScene(id, { g, data, seed })` prepara le
// particelle e `scene.draw(ctx, tMs)` disegna l'istante richiesto.
//
// Unità: 1600 di larghezza per l'intera scena di gioco (chi disegna imposta la trasformata).
// `g` sono i riquadri veri del tavolo, per ruolo e non per lato, così la stessa scena vale
// per il giocatore e per l'avversario:
//   own / foe   Agente di chi ha giocato l'abilità / dell'altro      [x, y, w, h]
//   port        centro del portale                                    [x, y]
//   slot        riga del Campo in gioco                               [x, y, w, h]
//   plate       targa PV·FC·PR di chi subisce                          [x, y, w, h]
//   ann         centro dell'avviso da cui parte la scena              [x, y]
//   hand        carte della mano bersaglio                            [[x, y, w, h], …]
//   card        la carta scelta in quella mano (Preda, Agente sconfitto)
// `data` porta le cifre vere (Presenza spesa, modificatori invertiti, voci del Registro).

export const ABILITY_SCENE_DURATION_MS = 4400;
const D = ABILITY_SCENE_DURATION_MS;

const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const eo = (x) => 1 - (1 - cl(x)) ** 3;
const eio = (x) => { const v = cl(x); return v < 0.5 ? 4 * v * v * v : 1 - ((-2 * v + 2) ** 3) / 2; };
const back = (x) => { const v = cl(x); const c = 1.9; return 1 + (c + 1) * (v - 1) ** 3 + c * (v - 1) ** 2; };
/** Inviluppo: 0 fino ad `a`, sale fino a `b`, tiene fino a `c`, scende fino a `d`. */
const env = (t, a, b, c, d) => (t < a ? 0 : t < b ? (t - a) / (b - a) : t < c ? 1 : t < d ? 1 - (t - c) / (d - c) : 0);
const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const rgba = (hex, a) => { const n = parseInt(String(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${cl(a)})`; };
const bez = (p0, p1, p2, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]];
const cx = (r) => r[0] + r[2] / 2;
const cy = (r) => r[1] + r[3] / 2;
const FONT = "'Chakra Petch','Segoe UI',sans-serif";

let C = null; // contesto del fotogramma in corso

function glow(x, y, r, col, a) {
  if (a <= 0 || r <= 0) return;
  C.save(); C.globalCompositeOperation = 'lighter';
  const g = C.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  C.fillStyle = g; C.fillRect(x - r, y - r, r * 2, r * 2); C.restore();
}
function ring(x, y, rx, ry, col, a, lw = 3) {
  if (a <= 0) return;
  C.save(); C.globalCompositeOperation = 'lighter'; C.strokeStyle = rgba(col, a); C.lineWidth = lw;
  C.beginPath(); C.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, 7); C.stroke(); C.restore();
}
function txt(s, x, y, px, col, a = 1, o = {}) {
  if (a <= 0) return;
  C.save(); C.globalAlpha = cl(a); C.font = `${o.w || 700} ${px}px ${FONT}`; C.textAlign = o.al || 'center'; C.textBaseline = 'middle';
  if (o.ls && C.letterSpacing !== undefined) C.letterSpacing = o.ls;
  if (o.stroke !== 0) { C.lineWidth = px * 0.22; C.lineJoin = 'round'; C.strokeStyle = 'rgba(4,5,9,.9)'; C.strokeText(s, x, y); }
  C.fillStyle = col; C.fillText(s, x, y); C.restore();
}
/** Titolo grande: corsivo come il nome dell'abilità nell'avviso, col filo nel colore dell'armata. */
function title(s, x, y, px, col, a, acc) {
  if (a <= 0) return;
  C.save(); C.globalAlpha = cl(a); C.font = `italic 700 ${px}px ${FONT}`; C.textAlign = 'center'; C.textBaseline = 'middle';
  if (C.letterSpacing !== undefined) C.letterSpacing = `${px * 0.08}px`;
  C.lineWidth = px * 0.2; C.lineJoin = 'round'; C.strokeStyle = 'rgba(4,5,9,.92)'; C.strokeText(s, x, y);
  C.shadowColor = acc; C.shadowBlur = px * 0.5; C.fillStyle = col; C.fillText(s, x, y); C.shadowBlur = 0;
  const w = C.measureText(s).width * 0.62; const g = C.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, rgba(acc, 0)); g.addColorStop(0.5, rgba(acc, 1)); g.addColorStop(1, rgba(acc, 0));
  C.fillStyle = g; C.fillRect(x - w, y + px * 0.62, w * 2, 2); C.restore();
}
/** Lastra di vetro delle fasce dell'Eminenza. */
function slab(x, y, w, h, acc, a) {
  if (a <= 0) return;
  C.save(); C.globalAlpha = cl(a); C.beginPath(); C.moveTo(x + 12, y); C.lineTo(x + w, y); C.lineTo(x + w - 12, y + h); C.lineTo(x, y + h); C.closePath();
  const g = C.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(16,20,29,.95)'); g.addColorStop(1, 'rgba(5,7,11,.95)'); C.fillStyle = g; C.fill();
  const g2 = C.createLinearGradient(x, 0, x + w * 0.4, 0); g2.addColorStop(0, rgba(acc, 0.3)); g2.addColorStop(1, rgba(acc, 0)); C.fillStyle = g2; C.fill();
  C.strokeStyle = 'rgba(180,191,208,.35)'; C.lineWidth = 1; C.stroke();
  const g3 = C.createLinearGradient(x + 30, 0, x + w - 60, 0); g3.addColorStop(0, 'rgba(255,255,255,0)'); g3.addColorStop(0.5, 'rgba(255,255,255,.7)'); g3.addColorStop(1, 'rgba(255,255,255,0)');
  C.fillStyle = g3; C.fillRect(x + 30, y, w - 90, 1); C.restore();
}
function tag(s, x, y, acc, a, px = 15) {
  if (a <= 0) return;
  C.save(); C.font = `700 ${px}px ${FONT}`; const w = C.measureText(s).width + px * 2.6; C.restore();
  slab(x - w / 2, y - px * 1.05, w, px * 2.1, acc, a); txt(s, x, y + 1, px, '#fff', a, { stroke: 0, ls: '1.5px' });
}
function shade(g, a, col = '#04050a') { if (a > 0) { C.fillStyle = rgba(col, a); C.fillRect(-g.pad, -g.pad, 1600 + g.pad * 2, g.h + g.pad * 2); } }
const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;

const SCENES = {
  // Protocollo Terra Bruciata — il Campo è distrutto
  calibri_terra_bruciata: {
    acc: '#a9a294',
    init(r) {
      return {
        deb: Array.from({ length: 70 }, () => ({ i: Math.floor(r() * 3), a: r() * 6.28, v: 120 + r() * 380, s: 2 + r() * 4, l: 0.5 + r() * 0.6 })),
        emb: Array.from({ length: 90 }, () => ({ x: r() * 1600, y: 0.58 + r() * 0.42, v: 40 + r() * 110, p: r() * 6.28, s: 1 + r() * 2.4, d: r() * 1800 })),
      };
    },
    draw(t, S, g) {
      const SLOT = g.slot;
      const hit = [[g.port[0], g.port[1]], [g.port[0] - 190, g.port[1] + 228], [cx(SLOT), cy(SLOT)]];
      const from = [[g.ann[0] - 40, g.ann[1]], [g.ann[0], g.ann[1] - 10], [g.ann[0] + 40, g.ann[1]]]; const t0 = [150, 330, 520];
      shade(g, env(t, 0, 500, 3500, D) * 0.42, '#140803');
      hit.forEach((h, i) => {
        const ctl = [(from[i][0] + h[0]) / 2, Math.min(from[i][1], h[1]) - 330];
        const u = (t - t0[i]) / 720;
        if (u > 0 && u < 1) {
          const p = bez(from[i], ctl, h, eio(u));
          for (let k = 0; k < 14; k += 1) { const q = bez(from[i], ctl, h, eio(Math.max(0, u - k * 0.012))); glow(q[0], q[1], 16 - k, '#ffb055', 0.5 * (1 - k / 14)); }
          glow(p[0], p[1], 26, '#fff2c0', 1);
        }
        const v = (t - t0[i] - 720) / 1000;
        if (v > 0) { glow(h[0], h[1], 90 + 420 * eo(v), '#ff7a1a', 0.95 * (1 - cl(v * 1.1))); glow(h[0], h[1], 40 + 160 * eo(v), '#fff4c8', 1 - cl(v * 2.2)); ring(h[0], h[1], 40 + 520 * eo(v), (40 + 520 * eo(v)) * 0.45, '#ffc27a', 0.8 * (1 - cl(v)), 5); }
      });
      // i focolai restano accesi su portale e terreno; la riga del Campo resta pulita per il timbro
      hit.forEach((h, i) => { const f = i === 2 ? 0 : env(t, t0[i] + 900, t0[i] + 1300, 3500, D); if (f > 0) for (let k = 0; k < 6; k += 1) { const w = Math.sin(t / 90 + k * 1.7 + i); glow(h[0] + (k - 2.5) * 22, h[1] - 10 - (k % 3) * 16 - 10 * w, 46 + 14 * w, k % 2 ? '#ff7a1a' : '#ffc45a', 0.5 * f); } });
      S.deb.forEach((d) => { const v = (t - t0[d.i] - 720) / 1000; if (v > 0 && v < d.l) { const h = hit[d.i]; const x = h[0] + Math.cos(d.a) * d.v * v; const y = h[1] + Math.sin(d.a) * d.v * v * 0.6 + 420 * v * v - 90 * v; C.fillStyle = rgba('#2a1a10', 1 - v / d.l); C.fillRect(x, y, d.s * 2, d.s * 2); glow(x, y, d.s * 3, '#ff8a2a', 0.7 * (1 - v / d.l)); } });
      // la striscia di fuoco attraversa la riga del Campo, senza lasciarci sopra niente
      const b = cl((t - 1300) / 1300);
      if (b > 0 && b < 1) { const w = SLOT[2] * eo(b); glow(SLOT[0] + w, cy(SLOT), 60, '#ff8a2a', 0.9); for (let k = 0; k < 5; k += 1) glow(SLOT[0] + w - 6, SLOT[1] + k * 10, 14 + 8 * Math.sin(t / 50 + k), '#ffe08a', 0.8); }
      S.emb.forEach((e) => { const v = (t - 900 - e.d) / 1000; if (v > 0) { const a = env(t, 900 + e.d, 1200 + e.d, 3400, D); glow(e.x + 18 * Math.sin(v * 2 + e.p), e.y * g.h - e.v * v, e.s * 3, '#ff9a3a', 0.8 * a); } });
      const st = (t - 2500) / 260;
      if (st > 0) {
        const k = st < 1 ? 2.4 - 1.4 * eo(st) : 1; const a = cl(st) * env(t, 2500, 2501, 3800, D); const sw = Math.min(256, SLOT[2] * 0.82);
        C.save(); C.translate(cx(SLOT), cy(SLOT)); C.rotate(-0.06); C.scale(k, k); C.strokeStyle = rgba('#ff5a3a', a); C.lineWidth = 3; C.strokeRect(-sw / 2, -17, sw, 34);
        txt('CAMPO DISTRUTTO', 0, 1, sw / 12.2, '#ff6a4a', a, { ls: '3px' }); C.restore();
        if (st < 1.6) glow(cx(SLOT), cy(SLOT), 200, '#ff6a3a', 0.5 * (1 - st / 1.6));
      }
    },
  },

  // Cataclisma Verde — round 5, il Campo aperto è terraformato
  ora_verde: {
    acc: '#5cf58a',
    init(r) { return { sp: Array.from({ length: 120 }, () => ({ a: r() * 6.28, v: 0.3 + r() * 0.9, d: r() * 1600, s: 1 + r() * 2.5 })) }; },
    draw(t, S, g, data) {
      const rise = eo(t / 1500); const a = env(t, 0, 600, 3500, D); const [x, y] = g.port; const SLOT = g.slot;
      shade(g, a * 0.4, '#02140a');
      C.save(); C.globalCompositeOperation = 'lighter'; C.translate(x, y); C.rotate(t / 2600);
      for (let k = 0; k < 18; k += 1) { C.rotate(6.283 / 18); const L = 260 + 520 * rise + 40 * Math.sin(t / 300 + k); const gr = C.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, `rgba(120,255,160,${0.2 * a})`); gr.addColorStop(1, 'rgba(120,255,160,0)'); C.fillStyle = gr; C.beginPath(); C.moveTo(60, -7); C.lineTo(L, -26 - rise * 20); C.lineTo(L, 26 + rise * 20); C.lineTo(60, 7); C.fill(); }
      C.restore();
      glow(x, y, 150 + 520 * rise, '#2bff7a', 0.38 * a); glow(x, y, 90 + 150 * rise, '#d8ffe6', 0.95 * a);
      for (let k = 0; k < 3; k += 1) { const v = (t - 1100 - k * 330) / 1200; if (v > 0 && v < 1) { const R = 80 + 1050 * eo(v); ring(x, y, R, R * 0.62, '#9cffc0', 0.9 * (1 - v), 7 - k * 2); } }
      S.sp.forEach((p) => { const v = (t - 600 - p.d) / 1700; if (v > 0 && v < 1) { const R = 90 + 900 * v * p.v; glow(x + Math.cos(p.a) * R, y + Math.sin(p.a) * R * 0.62, p.s * 4, '#b8ffcf', 0.9 * (1 - v)); } });
      // Terraformare: la riga del Campo viene riscritta
      const w = cl((t - 1900) / 900);
      if (w > 0) {
        const al = env(t, 1900, 2000, 3800, D); const W = SLOT[2] * eio(w);
        C.save(); C.globalAlpha = al; C.beginPath(); C.rect(SLOT[0], SLOT[1], W, SLOT[3]); C.clip();
        const gr = C.createLinearGradient(SLOT[0], 0, SLOT[0] + SLOT[2], 0); gr.addColorStop(0, '#0c3a1f'); gr.addColorStop(1, '#06200f'); C.fillStyle = gr; C.fillRect(SLOT[0], SLOT[1], SLOT[2], SLOT[3]);
        C.strokeStyle = '#7dffa8'; C.lineWidth = 2; C.strokeRect(SLOT[0] + 1, SLOT[1] + 1, SLOT[2] - 2, SLOT[3] - 2);
        txt(data.fieldName || 'Arena del Violento Gaudio', SLOT[0] + 13, cy(SLOT) - 7, 15, '#eafff0', 1, { al: 'left', stroke: 0 }); txt('Terraformato · round 5', SLOT[0] + 13, cy(SLOT) + 11, 10.5, '#8fe8ae', 1, { al: 'left', stroke: 0, w: 500 });
        C.restore();
        if (w < 1) { glow(SLOT[0] + W, cy(SLOT), 70, '#8dffb5', 1); C.fillStyle = 'rgba(220,255,232,.95)'; C.fillRect(SLOT[0] + W - 2, SLOT[1] - 6, 3, SLOT[3] + 12); }
      }
      title('ROUND 5', x, y - 190, 54, '#eafff0', env(t, 500, 900, 2300, 2800), this.acc); tag('IL SOLE VERDE SORGE', x, y - 140, this.acc, env(t, 700, 1000, 2300, 2800), 15);
    },
  },

  // Ascensione — tutta la Presenza diventa POT
  enclave_ascensione: {
    acc: '#fb912d',
    init(r) { return { sc: Array.from({ length: 46 }, () => ({ x: r(), d: r() * 900, v: 0.6 + r() * 0.7, s: 5 + r() * 7 })) }; },
    draw(t, S, g, data) {
      const OWN = g.own; const N = Math.max(1, Math.min(9, Number(data.spent) || 3)); const step = Math.min(430, 1700 / N);
      const from = [cx(g.plate), cy(g.plate)]; const to = [OWN[0] + 24, OWN[1] + 27]; const ctl = [(from[0] + to[0]) / 2 + (from[0] > to[0] ? 180 : -180), Math.min(from[1], to[1]) - 60];
      let got = 0; shade(g, env(t, 0, 400, 3600, D) * 0.38);
      const pil = env(t, 500, 1500, 3500, D);
      for (let k = 0; k < 9; k += 1) glow(cx(OWN), OWN[1] + OWN[3] + 10 - k * 72, 150 - k * 8, this.acc, 0.34 * pil * (1 - k / 10));
      glow(cx(OWN), OWN[1] + OWN[3] + 16, 230, '#ffd08a', 0.3 * pil);
      S.sc.forEach((s) => { const v = ((t - 600 - s.d) % 1100) / 1100; if (t > 600 + s.d && t < 3700) { const x = OWN[0] - 14 + s.x * (OWN[2] + 28); const y = OWN[1] + OWN[3] + 20 - v * (OWN[3] + 300) * s.v; C.save(); C.globalCompositeOperation = 'lighter'; C.translate(x, y); C.rotate(0.785); C.fillStyle = rgba('#ffd08a', 0.75 * (1 - v) * pil); C.fillRect(-s.s / 2, -s.s / 2, s.s, s.s); C.restore(); } });
      for (let i = 0; i < N; i += 1) {
        const s0 = 500 + i * step; const u = (t - s0) / 760; if (u >= 1) got += 1;
        if (u > 0 && u < 1) { const p = bez(from, ctl, to, eio(u)); for (let k = 0; k < 10; k += 1) { const q = bez(from, ctl, to, eio(Math.max(0, u - k * 0.02))); glow(q[0], q[1], 18 - k, '#ffb45a', 0.55 * (1 - k / 10)); } glow(p[0], p[1], 22, '#fff0d0', 1); }
        const h = (t - s0 - 760) / 700; if (h > 0 && h < 1) { ring(to[0], to[1], 20 + 90 * eo(h), 20 + 90 * eo(h), '#ffd9a0', 1 - h, 4); txt('+1 POT', to[0] + 78, to[1] - 18 - 46 * eo(h), 22, '#ffe2b0', 1 - h); }
      }
      // POT che sale sul medaglione
      const pa = env(t, 300, 500, 3700, D);
      if (data.basePower != null) { C.save(); C.globalAlpha = pa; C.beginPath(); C.arc(to[0], to[1], 21, 0, 7); C.fillStyle = '#1a0f04'; C.fill(); C.lineWidth = 3; C.strokeStyle = '#ffc070'; C.stroke(); C.restore(); txt(String(Number(data.basePower) + got), to[0], to[1] + 2, 24, '#fff', pa, { stroke: 0 }); glow(to[0], to[1], 46, '#ffb050', 0.5 * pa); }
      const end = 500 + (N - 1) * step + 760; const f = (t - end) / 900;
      if (f > 0) { ring(cx(OWN), cy(OWN), 120 + 360 * eo(f), (120 + 360 * eo(f)) * 0.8, '#ffd9a0', 0.9 * (1 - cl(f)), 6); glow(cx(OWN), cy(OWN), 300, '#ff9a3a', 0.5 * (1 - cl(f))); title(`+${N} POT`, cx(OWN), OWN[1] - 46, 46, '#fff1da', env(t, end, end + 200, 3700, D), this.acc); }
    },
  },

  // Risposta — Ancorato: Immune, trigger soddisfatto
  figli_risposta: {
    acc: '#a288fb',
    init() { return {}; },
    draw(t, S, g) {
      const OWN = g.own; const a = env(t, 0, 400, 3600, D); const y0 = cy(OWN); const X = cx(OWN); const by = OWN[1] + OWN[3];
      shade(g, a * 0.42, '#07051a');
      const sw = eo(t / 800);
      C.save(); C.globalCompositeOperation = 'lighter'; const gr = C.createLinearGradient(800 - 800 * sw, 0, 800 + 800 * sw, 0); gr.addColorStop(0, 'rgba(162,136,251,0)'); gr.addColorStop(0.5, `rgba(214,202,255,${a})`); gr.addColorStop(1, 'rgba(162,136,251,0)'); C.fillStyle = gr; C.fillRect(800 - 800 * sw, y0 - 1.5, 1600 * sw, 3); C.restore();
      for (let k = 0; k < 4; k += 1) { const v = ((t + k * 500) % 2000) / 2000; ring(g.port[0], g.port[1], 80 + 500 * v, (80 + 500 * v) * 0.3, '#a288fb', 0.35 * (1 - v) * a, 2); }
      // l'àncora è una costellazione: le stelle si accendono una alla volta e i tratti le uniscono
      const N = [[0, -150], [0, -112], [-46, -112], [46, -112], [0, -40], [0, 34], [-34, 22], [-66, -8], [-78, -44], [34, 22], [66, -8], [78, -44]].map((p) => [X + p[0] * 1.75, by - 6 + p[1] * 1.75]);
      const L = [[0, 1], [2, 1], [1, 3], [1, 4], [4, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11]];
      C.save(); C.globalCompositeOperation = 'lighter';
      L.forEach(([p, q], i) => { const u = eo((t - 1350 - i * 110) / 320); if (u <= 0) return; const A = N[p]; const B = N[q]; C.strokeStyle = rgba('#d9cfff', 0.9 * a); C.lineWidth = 2; C.beginPath(); C.moveTo(A[0], A[1]); C.lineTo(lerp(A[0], B[0], u), lerp(A[1], B[1], u)); C.stroke(); });
      N.forEach((p, i) => { const u = back((t - 1100 - i * 95) / 380); if (u <= 0) return; const tw = 0.75 + 0.25 * Math.sin(t / 170 + i * 1.9); const r = (i === 0 || i === 5 ? 17 : 11) * u * tw; C.fillStyle = rgba('#ffffff', a); C.beginPath(); for (let k = 0; k < 8; k += 1) { const an = k * 0.7854; const rr = k % 2 ? r * 0.2 : r; C[k ? 'lineTo' : 'moveTo'](p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr); } C.closePath(); C.fill(); });
      C.restore();
      N.forEach((p, i) => { if (t > 1100 + i * 95) glow(p[0], p[1], i === 0 || i === 5 ? 38 : 26, '#a288fb', 0.75 * a); });
      tag('ANCORATO', X, by + 84, this.acc, env(t, 2500, 2700, 3600, D), 13);
      // l'alone: due orbite sottili con stelle che girano attorno alla carta
      const dm = eo((t - 2500) / 700);
      if (dm > 0) {
        const al = env(t, 2500, 2800, 3600, D); const R = 215 * dm; ring(X, y0, R, R * 1.05, '#d6caff', 0.85 * al, 2.5); ring(X, y0, R * 1.12, R * 0.42, '#a288fb', 0.6 * al, 1.5); glow(X, y0, R * 1.2, '#a288fb', 0.22 * al);
        for (let k = 0; k < 10; k += 1) { const an = k * 0.6283 + t / 900; glow(X + Math.cos(an) * R * 1.12, y0 + Math.sin(an) * R * 0.42, 10, '#ffffff', 0.9 * al); }
        title('IMMUNE', X, OWN[1] - 78, 40, '#f1ecff', env(t, 2700, 2950, 3600, D), this.acc);
      }
      // riga del Potere: trigger soddisfatto
      const pr = env(t, 3000, 3200, 3700, D);
      if (pr > 0) { const ry = OWN[1] + OWN[3] * 0.612; const rh = OWN[3] * 0.128; C.save(); C.globalCompositeOperation = 'lighter'; C.fillStyle = rgba('#a288fb', 0.45 * pr); C.fillRect(OWN[0] + 3, ry, OWN[2] - 6, rh); C.restore(); C.strokeStyle = rgba('#efeaff', pr); C.lineWidth = 2; C.strokeRect(OWN[0] + 3, ry, OWN[2] - 6, rh); tag('✓ TRIGGER SODDISFATTO', X, OWN[1] - 34, this.acc, pr, 13); }
    },
  },

  // Caccia — un Agente in mano all'avversario diventa Preda e va schierato
  mounthborn_caccia: {
    acc: '#c9e238',
    init() { return {}; },
    draw(t, S, g) {
      const a = env(t, 0, 400, 3700, D); const hand = g.hand.length ? g.hand : [g.card]; const src = g.card;
      shade(g, a * 0.5, '#0a0d02');
      // il mirino fiuta la mano carta per carta, poi si chiude sulla scelta
      const hops = Math.min(7, hand.length + 2); const hopMs = 1330 / hops; const hop = Math.floor(t / hopMs);
      const r = t < 1330 ? hand[hop % hand.length] : src; const lock = eo((t - 1330) / 300);
      const R = (t < 1330 ? 104 : 104 - 34 * lock) * (src[2] / 118); const X = cx(r); const Y = cy(r);
      C.save(); C.translate(X, Y); C.rotate(t / 500); C.strokeStyle = rgba('#e6ff7a', a); C.lineWidth = 3;
      for (let k = 0; k < 4; k += 1) { C.rotate(1.5708); C.beginPath(); C.arc(0, 0, R, -0.5, 0.5); C.stroke(); C.beginPath(); C.moveTo(R - 14, 0); C.lineTo(R + 16, 0); C.stroke(); }
      C.restore(); glow(X, Y, R * 1.5, '#c9e238', 0.35 * a);
      // tre artigli segnano la carta
      const cw = (t - 1500) / 260;
      if (cw > 0) {
        const k = src[2] / 118; C.save(); C.translate(cx(src), cy(src)); C.scale(k, k); C.lineCap = 'round';
        for (let i = -1; i <= 1; i += 1) { const L = cl(cw - (i + 1) * 0.18); if (L <= 0) continue; C.strokeStyle = rgba('#f4ffb0', a); C.lineWidth = 4.5; C.beginPath(); C.moveTo(-34 + i * 26, -70); C.quadraticCurveTo(-10 + i * 26, 0, -34 + i * 26 + 68 * L, -70 + 140 * L); C.stroke(); C.strokeStyle = rgba('#3d4a05', a); C.lineWidth = 1.5; C.stroke(); }
        C.restore(); if (cw < 1.4) glow(cx(src), cy(src), 160, '#e6ff7a', 0.5 * (1 - cw / 1.4));
      }
      const below = cy(src) < g.h / 2; const ty = below ? src[1] + src[3] + 24 : src[1] - 24;
      tag('PREDA', cx(src), ty, this.acc, env(t, 1650, 1800, 3700, D), 15);
      // la traccia verso lo slot dove dovrà essere schierata
      const tr = eio((t - 2100) / 900);
      if (tr > 0) { const A = [cx(src), cy(src)]; const B = [cx(g.foe), cy(g.foe)]; const ctl = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 60]; for (let k = 0; k <= 22 * tr; k += 1) { const q = bez(A, ctl, B, k / 22); glow(q[0], q[1], 9 + 5 * Math.sin(t / 120 + k), '#c9e238', 0.6 * a); } }
      const sl = (t - 2900) / 700;
      if (sl > 0) { C.strokeStyle = rgba('#e6ff7a', a * 0.9); C.lineWidth = 2.5; C.setLineDash([10, 8]); C.strokeRect(g.foe[0], g.foe[1], g.foe[2], g.foe[3]); C.setLineDash([]); ring(cx(g.foe), cy(g.foe), 120 + 300 * eo(sl), (120 + 300 * eo(sl)) * 0.9, '#e6ff7a', 0.9 * (1 - cl(sl)), 6); glow(cx(g.foe), cy(g.foe), 260, '#c9e238', 0.45 * (1 - cl(sl))); title('DEVE SCHIERARLA', cx(g.foe), g.foe[1] - 42, 30, '#f4ffb0', env(t, 2900, 3100, 3700, D), this.acc); }
    },
  },

  // Maledizione Inversa — i modificatori del Duello cambiano segno
  khemet_maledizione_inversa: {
    acc: '#26c4e8',
    init() { return {}; },
    draw(t, S, g, data) {
      const a = env(t, 0, 400, 3700, D); const fl = eio((t - 1500) / 500); const [x, y] = g.port;
      shade(g, a * 0.45, '#03101a');
      // sigillo: gira, si ribalta, torna indietro
      C.save(); C.translate(x, y); C.scale(Math.cos(fl * Math.PI) || 0.01, 1); C.rotate((t < 1500 ? t : 1500 - (t - 1500)) / 700); C.globalCompositeOperation = 'lighter'; const col = fl < 0.5 ? '#26c4e8' : '#e84aa8';
      [330, 300, 210].forEach((R, i) => { C.strokeStyle = rgba(col, a * (0.8 - i * 0.2)); C.lineWidth = i ? 1.5 : 3; C.beginPath(); C.arc(0, 0, R, 0, 7); C.stroke(); });
      for (let k = 0; k < 36; k += 1) { C.rotate(6.283 / 36); C.fillStyle = rgba(col, a * 0.8); C.fillRect(302, -1.5, k % 3 ? 12 : 26, 3); }
      C.strokeStyle = rgba(col, a * 0.7); C.lineWidth = 2; C.beginPath(); for (let k = 0; k < 7; k += 1) { const an = (k * 6.283 * 3) / 7; C[k ? 'lineTo' : 'moveTo'](Math.cos(an) * 210, Math.sin(an) * 210); } C.closePath(); C.stroke(); C.restore();
      if (t > 1500 && t < 2100) { const f = (t - 1500) / 600; shade(g, 0.28 * (1 - f), '#e8f8ff'); ring(x, y, 330 + 500 * eo(f), 330 + 500 * eo(f), '#ffffff', 0.7 * (1 - f), 5); }
      // i modificatori veri del Duello, uno per statistica e per Agente: ognuno si ribalta e cambia segno
      [[g.own, data.own], [g.foe, data.foe]].forEach(([R, mods]) => (mods || []).forEach((m, i) => {
        const k = cl((t - 1600 - i * 220) / 480); const sy = Math.cos(k * Math.PI); const al = env(t, 650 + i * 150, 900 + i * 150, 3700, D); const yy = R[1] - 40 - i * 46;
        const flips = m.to !== m.from; const neg = flips && sy <= 0; const val = neg ? m.to : m.from;
        C.save(); C.translate(cx(R), yy); C.scale(1, flips ? Math.max(0.02, Math.abs(sy)) : 1); tag(`${m.stat} ${signed(val)}`, 0, 0, neg ? '#e84aa8' : '#26c4e8', al, 19); C.restore();
        if (flips && k > 0 && k < 1) glow(cx(R), yy, 110, neg ? '#e84aa8' : '#7fe6ff', 0.5 * Math.sin(k * Math.PI));
      }));
      const o = env(t, 2200, 2450, 3700, D); C.strokeStyle = rgba('#e84aa8', o); C.lineWidth = 2.5; C.strokeRect(g.slot[0], g.slot[1], g.slot[2], g.slot[3]);
      tag('I + DIVENTANO − · I MINIMI NON VALGONO', x, y + 238, '#e84aa8', o, 14);
    },
  },

  // Vendetta oltre la Morte — un Agente sconfitto torna in campo
  ratti_vendetta: {
    acc: '#40ad60',
    init(r) {
      return {
        rats: Array.from({ length: 11 }, (_, i) => ({ sx: (r() - 0.5) * 700, d: r() * 500, o: (i / 10 - 0.5) * 100, ph: r() * 6.28, s: 0.8 + r() * 0.5 })),
        mist: Array.from({ length: 40 }, () => ({ u: r(), o: (r() - 0.5) * 60, s: 14 + r() * 26 })),
      };
    },
    draw(t, S, g) {
      const OWN = g.own; const a = env(t, 0, 400, 3700, D); const src = g.card; const lift = eio((t - 1300) / 1300);
      const A = [cx(src), cy(src)]; const B = [cx(OWN), cy(OWN)]; const ctl = [(A[0] + B[0]) / 2 - 80, (A[1] + B[1]) / 2 + 40]; const p = bez(A, ctl, B, lift);
      shade(g, a * 0.45, '#03110a');
      // nebbia verde sotto la carta sconfitta, poi lungo la strada
      for (let k = 0; k < 9; k += 1) { const v = ((t + k * 230) % 1700) / 1700; glow(A[0] + (k - 4) * 18 + 12 * Math.sin(t / 300 + k), src[1] + src[3] - v * 120, 40 + 30 * v, '#3bd06c', 0.28 * a * (1 - v) * (t < 1500 ? 1 : Math.max(0, 1 - (t - 1500) / 600))); }
      S.mist.forEach((m) => { if (m.u < lift && t > 1300) { const q = bez(A, ctl, B, m.u); const v = cl((t - 1300 - m.u * 1300) / 1200); glow(q[0] + m.o, q[1] + m.o * 0.5 - 30 * v, m.s * (1 + v), '#3bd06c', 0.3 * a * (1 - v)); } });
      if (t > 1300 && lift < 1) glow(p[0], p[1], 90, '#8dffb0', 0.6 * a);
      // i ratti: corrono alla carta, poi la accompagnano fino allo slot
      S.rats.forEach((r) => {
        const gk = eo((t - 300 - r.d) / 800); if (gk <= 0) return;
        const edge = cy(src) > g.h / 2 ? g.h + 40 : -40; const bx = p[0] + r.o; const by = p[1] + src[3] * 0.5 + 8 + 5 * Math.sin(t / 60 + r.ph);
        const X = lerp(A[0] + r.sx, bx, gk); const Y = lerp(edge, by, gk) + (gk < 1 ? -14 * Math.abs(Math.sin(t / 70 + r.ph)) : 0);
        const dir = lift > 0 && lift < 1 ? (B[0] > A[0] ? 1 : -1) : (bx > A[0] + r.sx ? 1 : -1); const al = a * (t < 2900 ? 1 : Math.max(0, 1 - (t - 2900) / 500));
        C.save(); C.globalAlpha = al; C.translate(X, Y); C.scale(dir * r.s, r.s); C.fillStyle = '#16110f'; C.beginPath(); C.ellipse(0, 0, 13, 7, 0, 0, 7); C.fill(); C.beginPath(); C.ellipse(11, -3, 6, 5, 0, 0, 7); C.fill(); C.beginPath(); C.arc(9, -8, 3, 0, 7); C.fill();
        C.strokeStyle = '#3a2a26'; C.lineWidth = 2; C.beginPath(); C.moveTo(-12, 0); C.quadraticCurveTo(-24, -10 + 4 * Math.sin(t / 90 + r.ph), -30, 2); C.stroke(); C.fillStyle = '#7dffa0'; C.fillRect(13, -5, 2, 2); C.restore();
        glow(X + 13 * dir * r.s, Y - 4 * r.s, 5, '#7dffa0', 0.9 * al);
      });
      const ks = (t - 2700) / 480; if (ks > 0 && ks < 1) { glow(B[0], B[1], 260, '#3bd06c', 0.45 * (1 - ks)); ring(B[0], B[1], 120 + 260 * eo(ks), (120 + 260 * eo(ks)) * 0.9, '#8dffb0', 0.8 * (1 - ks), 5); }
      title('DI NUOVO IN CAMPO', B[0], OWN[1] - 44, 30, '#d6ffe2', env(t, 2800, 3000, 3700, D), this.acc);
    },
  },

  // Interessi — ogni voce del Registro cresce di 2 PV
  corte_interessi: {
    acc: '#f8504f',
    init(r) { return { dr: Array.from({ length: 30 }, () => ({ d: r() * 700, o: (r() - 0.5) * 50, s: 3 + r() * 4 })) }; },
    draw(t, S, g, data) {
      const acc = this.acc; const a = env(t, 0, 350, 3700, D); const op = back(t / 750); const [x, y] = g.port; const rx = lerp(72, 196, op); const ry = lerp(90, 262, op);
      const rows = (data.entries || []).slice(0, 3); const more = (data.entries || []).length - rows.length; const PLATE = g.plate;
      shade(g, a * 0.55, '#150405');
      // il portale aperto: l'illustrazione dell'Eminenza dentro l'ovale
      C.save(); C.globalAlpha = a; C.beginPath(); C.ellipse(x, y, rx, ry, 0, 0, 7); C.clip();
      const im = data.art; if (im && im.complete && im.naturalWidth) { const k = Math.max((rx * 2) / im.naturalWidth, (ry * 2) / im.naturalHeight) * 1.05; C.drawImage(im, x - (im.naturalWidth * k) / 2, y - ry - 10, im.naturalWidth * k, im.naturalHeight * k); } else { C.fillStyle = '#2a0d10'; C.fillRect(x - rx, y - ry, rx * 2, ry * 2); }
      const gr = C.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, 'rgba(20,4,6,.25)'); gr.addColorStop(0.42, 'rgba(16,3,5,.86)'); gr.addColorStop(1, 'rgba(8,2,3,.97)'); C.fillStyle = gr; C.fillRect(x - rx, y - ry, rx * 2, ry * 2); C.restore();
      C.save(); C.globalAlpha = a; C.shadowColor = acc; C.shadowBlur = 26; C.strokeStyle = acc; C.lineWidth = 3; C.beginPath(); C.ellipse(x, y, rx, ry, 0, 0, 7); C.stroke(); C.shadowBlur = 0; C.strokeStyle = 'rgba(255,220,216,.55)'; C.lineWidth = 1; C.beginPath(); C.ellipse(x, y, rx - 7, ry - 7, 0, 0, 7); C.stroke();
      // rune sulla ghiera
      for (let q = 0; q < 30; q += 1) { const an = (q / 30) * 6.283 + t / 5200; C.save(); C.translate(x + Math.cos(an) * (rx + 17), y + Math.sin(an) * (ry + 17)); C.rotate(an + 1.5708); C.strokeStyle = rgba('#ff8a86', 0.85); C.lineWidth = 1.6; C.beginPath(); const m = q % 4; if (m === 0) C.rect(-4, -4, 8, 8); else if (m === 1) { C.moveTo(-5, 4); C.lineTo(0, -5); C.lineTo(5, 4); C.closePath(); } else if (m === 2) { C.moveTo(-4, -4); C.lineTo(4, 4); C.moveTo(4, -4); C.lineTo(-4, 4); } else { C.moveTo(-5, -2); C.lineTo(5, -2); C.moveTo(-5, 3); C.lineTo(5, 3); } C.stroke(); C.restore(); }
      C.restore();
      const tin = env(t, 500, 750, 3700, D); txt('IL REGISTRO', x, y - 78, 10, '#f0b9b5', tin, { stroke: 0, ls: '2.5px', w: 600 }); title('INTERESSI', x, y - 50, 32, '#fff', tin, acc);
      // le voci: fasce di vetro con la cifra nella cornice del costo
      const frame = (fx, fy, w, h, hot, al) => { C.save(); C.globalAlpha = cl(al); C.translate(fx, fy); C.transform(1, 0, -0.16, 1, 0, 0); const gg = C.createLinearGradient(0, -h / 2, 0, h / 2); gg.addColorStop(0, hot ? 'rgba(120,24,24,.95)' : 'rgba(60,14,14,.95)'); gg.addColorStop(1, 'rgba(6,4,6,.95)'); C.fillStyle = gg; C.fillRect(-w / 2, -h / 2, w, h); C.shadowColor = acc; C.shadowBlur = hot ? 18 : 8; C.strokeStyle = hot ? '#ffd0cc' : '#ff8a86'; C.lineWidth = 1.5; C.strokeRect(-w / 2, -h / 2, w, h); C.restore(); };
      let tot = Number(data.totalBefore) || 0; const totAfter = Number(data.totalAfter) || tot; const stepTot = rows.length ? (totAfter - tot) / rows.length : 0;
      rows.forEach((row, i) => {
        const yy = y + 8 + i * 48; const rin = env(t, 650 + i * 120, 850 + i * 120, 3700, D); const s0 = 1350 + i * 430; const u = cl((t - s0) / 360); const hot = u > 0 && u < 1; if (u >= 0.5) tot += stepTot;
        slab(x - 158, yy - 19, 316, 38, acc, rin); txt(String(row.name).toUpperCase(), x - 132, yy + 1, 15, '#fff', rin, { al: 'left', stroke: 0, ls: '1.5px' }); frame(x + 104, yy, 84, 28, hot, rin);
        // la cifra scatta: la vecchia esce verso l'alto, la nuova entra dal basso
        C.save(); C.beginPath(); C.rect(x + 58, yy - 14, 96, 28); C.clip(); const e = eio(u); txt(`${row.from} PV`, x + 104, yy + 1 - 22 * e, 16, '#f3d6d2', rin * (1 - e), { stroke: 0 }); txt(`${row.to} PV`, x + 104, yy + 23 - 22 * e, 16, '#fff', rin * e, { stroke: 0 }); C.restore();
        if (hot) { glow(x + 104, yy, 70, '#ff5a58', 0.7 * (1 - u)); txt(signed(row.to - row.from), x + 172, yy - 6 - 22 * eo(u), 17, '#ff8a86', 1 - u); }
      });
      if (t > 1350 + rows.length * 430) tot = totAfter;
      const yt = y + 168; const tinr = env(t, 1050, 1250, 3700, D); txt(more > 0 ? `TOTALE · ${rows.length + more} VOCI` : 'TOTALE', x - 70, yt + 1, 12, '#f0b9b5', tinr, { stroke: 0, ls: '4px', w: 600 }); frame(x + 60, yt, 116, 38, t > 1350 && t < 2700, tinr); txt(`${Math.round(tot)} PV`, x + 60, yt + 2, 23, '#fff', tinr, { stroke: 0 });
      // sigillo di ceralacca sulla ghiera
      const st = (t - 2600) / 240; const sx = x + rx * 0.74; const sy = y + ry * 0.7;
      if (st > 0) { const kk = st < 1 ? 2.6 - 1.6 * eo(st) : 1; const al = cl(st) * env(t, 2600, 2601, 3700, D); C.save(); C.translate(sx, sy); C.scale(kk, kk); C.rotate(-0.2); C.fillStyle = rgba('#b3161c', al); C.beginPath(); for (let q = 0; q < 24; q += 1) { const an = (q / 24) * 6.283; const R = 34 + (q % 2 ? 4 : -2); C[q ? 'lineTo' : 'moveTo'](Math.cos(an) * R, Math.sin(an) * R); } C.closePath(); C.fill(); C.strokeStyle = rgba('#ff8a86', al); C.lineWidth = 2; C.beginPath(); C.arc(0, 0, 24, 0, 7); C.stroke(); title('S', 0, 0, 30, '#ffd9d6', al, acc); C.restore(); if (st < 1.5) glow(sx, sy, 150, '#ff4a48', 0.6 * (1 - st / 1.5)); }
      // il debito scorre fino alla targa di chi paga
      S.dr.forEach((d) => { const u = (t - 2900 - d.d) / 800; if (u > 0 && u < 1) { const q = bez([sx, sy], [(sx + cx(PLATE)) / 2, (sy + cy(PLATE)) / 2 - 80], [cx(PLATE), cy(PLATE)], eio(u)); glow(q[0] + d.o * (1 - u), q[1], d.s * 3, '#ff4a48', 0.9); } });
      if (t > 3300 && t < 3800) glow(cx(PLATE), cy(PLATE), 160, '#ff4a48', 0.4 * (1 - (t - 3300) / 500));
    },
  },
};

export const ABILITY_SCENE_IDS = Object.freeze(Object.keys(SCENES));
export const hasAbilityScene = (id) => Object.prototype.hasOwnProperty.call(SCENES, id);

/**
 * Prepara una scena.
 * @param {string} id id dell'abilità (o dello Statico) in catalogo
 * @param {{ g: object, data?: object, seed?: number }} o geometria in unità di scena e cifre vere
 * @returns {null|{ draw: (ctx: CanvasRenderingContext2D, tMs: number) => void, duration: number }}
 */
export function createAbilityScene(id, { g, data = {}, seed = 7 } = {}) {
  const scene = SCENES[id];
  if (!scene || !g) return null;
  const state = scene.init(rnd(seed * 7919 + id.length));
  return {
    duration: D,
    draw(ctx, t) {
      if (t < 0 || t > D) return;
      C = ctx;
      ctx.save();
      scene.draw(t, state, g, data);
      ctx.restore();
      C = null;
    },
  };
}
