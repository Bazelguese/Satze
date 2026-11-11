// ============================================
// EMINENZE — Motore degli effetti d'attivazione (canvas 2D, particelle)
// ============================================
//
// Un effetto è una funzione del tempo: `createEffectRun(...)` prepara le particelle
// (pseudo-casuali ma ripetibili) e `run.draw(ctx, tMs)` disegna l'istante richiesto.
// Niente stato tra un fotogramma e l'altro: si può mettere in pausa, rallentare o saltare
// a un istante qualsiasi. Nessuna dipendenza: lo stesso file gira in gioco e nelle pagine di prova.
//
// Tempi: carica sull'avviso → sciame lungo un arco → impatto sul bersaglio → residuo.
// `theme` è il motivo dell'Eminenza, `kind` il tipo di bersaglio (vedi eminenceEffectFx.js).

export const EFFECT_FX_DURATION_MS = 2400;

const TAU = Math.PI * 2;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(hex) {
  const h = String(hex || '#ffffff').replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;
const mix = (a, b, k) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
const WHITE = [255, 255, 255];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;
const easeIn = (x) => clamp01(x) ** 2;
const easeInOut = (x) => { const v = clamp01(x); return v < 0.5 ? 2 * v * v : 1 - ((-2 * v + 2) ** 2) / 2; };
/** Inviluppo: sale in `a` ms, tiene, scende fino a `end`. */
const env = (t, a, hold, end) => (t <= 0 || t >= end ? 0 : t < a ? t / a : t < hold ? 1 : 1 - (t - hold) / (end - hold));
/** Rimbalzo da timbro: arriva grande, schiaccia, assesta. */
const stamp = (x) => { const v = clamp01(x); return v < 0.55 ? 2.3 - 1.42 * (v / 0.55) : v < 0.78 ? 0.88 + 0.18 * ((v - 0.55) / 0.23) : 1.06 - 0.06 * ((v - 0.78) / 0.22); };

function glow(ctx, x, y, r, c, a) {
  if (a <= 0.004 || r <= 0.2) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(mix(c, WHITE, 0.6), a));
  g.addColorStop(0.35, rgba(c, a * 0.55));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function ring(ctx, x, y, r, w, c, a) {
  if (a <= 0.004 || r <= 0) return;
  ctx.strokeStyle = rgba(c, a);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
function star4(ctx, x, y, r, rot, thin = 0.16) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = rot + (i * TAU) / 8;
    const rr = i % 2 ? r * thin : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Scintille che partono dal punto d'impatto: posizione in forma chiusa (attrito + gravità). */
function burst(rnd, n, { speed = 260, spread = TAU, dir = 0, life = 900, size = 3, delay = 0, drag = 3.2 } = {}) {
  return Array.from({ length: n }, () => {
    const a = dir + (rnd() - 0.5) * spread;
    return {
      a, v: speed * (0.35 + rnd() * 0.85), life: life * (0.55 + rnd() * 0.7), size: size * (0.55 + rnd() * 0.9),
      d: delay * rnd(), spin: (rnd() - 0.5) * 14, rot: rnd() * TAU, hue: rnd(), drag, k: rnd(),
    };
  });
}
function burstAt(p, t, grav) {
  const tt = (t - p.d) / 1000;
  if (tt < 0) return null;
  const life = tt / (p.life / 1000);
  if (life >= 1) return null;
  const dist = (p.v * (1 - Math.exp(-p.drag * tt))) / p.drag;
  return { x: Math.cos(p.a) * dist, y: Math.sin(p.a) * dist + grav * tt * tt * 0.5, life, rot: p.rot + p.spin * tt };
}

// ── Motivi ────────────────────────────────────────────────────────────
// Ogni motivo: colori, forma del granello in volo, disegno dell'impatto.
// `e` = ambiente dell'effetto: { cx, cy, R, tw, th, c (colore), c2, rnd-liste, grav, kind }.

const THEMES = {
  // Il Sole Verde — raggi e disco di luce verde
  apex: {
    color: () => [56, 240, 122], color2: [196, 255, 214], count: 16,
    mote(ctx, e, x, y, ang, p, a) {
      ctx.strokeStyle = rgba(e.c2, a); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 16, y - Math.sin(ang) * 16); ctx.lineTo(x, y); ctx.stroke();
      glow(ctx, x, y, 9, e.c, a);
    },
    setup(e, rnd) { e.rays = Array.from({ length: 30 }, (_, i) => ({ a: (i / 30) * TAU + rnd() * 0.12, len: 0.9 + rnd() * 1.5, w: 1 + rnd() * 2.4, ph: rnd() * TAU })); e.embers = burst(rnd, 46, { speed: 210, life: 1300, size: 2.6, delay: 220 }); },
    impact(ctx, t, e) {
      const k = easeOut(t / 240); const fade = env(t, 60, 700, 1500);
      const rot = t * 0.00035;
      e.rays.forEach((r) => {
        const len = e.R * (0.55 + r.len * k) * (1 + 0.06 * Math.sin(t * 0.012 + r.ph));
        const a0 = r.a + rot; const x0 = e.cx + Math.cos(a0) * e.R * 0.34; const y0 = e.cy + Math.sin(a0) * e.R * 0.34;
        const g = ctx.createLinearGradient(x0, y0, e.cx + Math.cos(a0) * len, e.cy + Math.sin(a0) * len);
        g.addColorStop(0, rgba(e.c2, 0.85 * fade)); g.addColorStop(1, rgba(e.c, 0));
        ctx.strokeStyle = g; ctx.lineWidth = r.w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(e.cx + Math.cos(a0) * len, e.cy + Math.sin(a0) * len); ctx.stroke();
      });
      glow(ctx, e.cx, e.cy, e.R * (0.5 + 1.1 * k), e.c, 0.85 * fade);
      glow(ctx, e.cx, e.cy, e.R * 0.42 * (0.6 + 0.4 * k), WHITE, env(t, 40, 260, 900));
      ring(ctx, e.cx, e.cy, e.R * (0.3 + 1.5 * easeOut(t / 620)), 3 * (1 - clamp01(t / 620)), e.c2, 0.9 * (1 - clamp01(t / 620)));
      e.embers.forEach((p) => { const q = burstAt(p, t, e.grav - 90); if (q) glow(ctx, e.cx + q.x, e.cy + q.y, p.size * 2.4, e.c, 0.9 * (1 - q.life)); });
    },
  },

  // Il Grande Semaforo — la luce dell'abilità, lente e nastro segnaletico
  indocili: {
    color: (o) => (o.lamp ? hexRgb(o.lamp) : hexRgb(o.accent)), color2: [255, 255, 255], count: 12,
    mote(ctx, e, x, y, ang, p, a) { glow(ctx, x, y, 13, e.c, a); glow(ctx, x, y, 4, WHITE, a); },
    setup(e, rnd) { e.sparks = burst(rnd, 34, { speed: 320, life: 620, size: 2, delay: 60 }); },
    impact(ctx, t, e) {
      const s = stamp(t / 300); const hold = env(t, 50, 1050, 1600); const r = e.R * 0.5 * s;
      // corpo del semaforo
      ctx.fillStyle = rgba([8, 7, 12], 0.92 * hold); ctx.beginPath(); ctx.arc(e.cx, e.cy, r * 1.22, 0, TAU); ctx.fill();
      ring(ctx, e.cx, e.cy, r * 1.22, 2, mix(e.c, [0, 0, 0], 0.5), hold);
      // lente: pulsazione da lampeggio
      const blink = 0.72 + 0.28 * Math.sin(t * 0.021);
      const g = ctx.createRadialGradient(e.cx - r * 0.28, e.cy - r * 0.3, 0, e.cx, e.cy, r);
      g.addColorStop(0, rgba(WHITE, hold)); g.addColorStop(0.3, rgba(e.c, hold * blink)); g.addColorStop(1, rgba(mix(e.c, [0, 0, 0], 0.62), hold));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.cx, e.cy, r, 0, TAU); ctx.fill();
      // rigature della lente
      ctx.save(); ctx.beginPath(); ctx.arc(e.cx, e.cy, r, 0, TAU); ctx.clip(); ctx.strokeStyle = rgba([0, 0, 0], 0.16 * hold); ctx.lineWidth = 1;
      for (let y = -r; y < r; y += 5) { ctx.beginPath(); ctx.moveTo(e.cx - r, e.cy + y); ctx.lineTo(e.cx + r, e.cy + y); ctx.stroke(); }
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, e.cx, e.cy, e.R * 1.9, e.c, 0.6 * hold * blink);
      // riflesso orizzontale
      const fl = env(t, 40, 200, 700); ctx.fillStyle = rgba(e.c2, 0.75 * fl); ctx.beginPath(); ctx.ellipse(e.cx, e.cy, e.R * 2.4 * fl, 2.2, 0, 0, TAU); ctx.fill();
      ring(ctx, e.cx, e.cy, e.R * (0.5 + 1.6 * easeOut(t / 520)), 4 * (1 - clamp01(t / 520)), e.c, 1 - clamp01(t / 520));
      e.sparks.forEach((p) => { const q = burstAt(p, t, e.grav + 200); if (q) glow(ctx, e.cx + q.x, e.cy + q.y, p.size * 2.2, e.c, 1 - q.life); });
      // nastro segnaletico che corre sul bordo del bersaglio
      if (e.kind !== 'aura') {
        ctx.globalCompositeOperation = 'source-over';
        const a = env(t, 80, 900, 1500); ctx.save(); ctx.setLineDash([12, 12]); ctx.lineDashOffset = -t * 0.09; ctx.lineWidth = 5;
        ctx.strokeStyle = rgba(e.c, a); roundRect(ctx, e.cx - e.tw / 2 - 5, e.cy - e.th / 2 - 5, e.tw + 10, e.th + 10, 8); ctx.stroke(); ctx.restore();
      }
    },
  },

  // L'Organizzatore degli Incontri — occhio di bue e coriandoli
  mascarada: {
    color: (o) => hexRgb(o.accent), color2: [255, 210, 63], count: 14,
    palette: [[255, 79, 163], [255, 210, 63], [67, 126, 242], [255, 255, 255], [120, 230, 190]],
    mote(ctx, e, x, y, ang, p, a) { const c = THEMES.mascarada.palette[p.i % 5]; ctx.save(); ctx.translate(x, y); ctx.rotate(p.k * 9 + p.u * 14); ctx.fillStyle = rgba(c, a); ctx.fillRect(-3, -6 * Math.abs(Math.cos(p.u * 16 + p.k * 6)), 6, 12 * Math.abs(Math.cos(p.u * 16 + p.k * 6)) + 1); ctx.restore(); },
    setup(e, rnd) { e.conf = burst(rnd, 120, { speed: 430, life: 1700, size: 5, delay: 140, drag: 2.4, spread: TAU }); e.conf.forEach((p) => { p.a = -Math.PI / 2 + (rnd() - 0.5) * 2.6; }); },
    impact(ctx, t, e) {
      // occhio di bue dall'alto
      const a = env(t, 90, 1000, 1700); const top = e.cy - e.th / 2 - e.R * 2.6; const w = e.tw * 0.5 + e.R * 0.5;
      const g = ctx.createLinearGradient(0, top, 0, e.cy + e.th / 2);
      g.addColorStop(0, rgba(WHITE, 0.5 * a)); g.addColorStop(0.75, rgba(mix(e.c, WHITE, 0.6), 0.2 * a)); g.addColorStop(1, rgba(e.c, 0));
      ctx.fillStyle = g; poly(ctx, [[e.cx - 14, top], [e.cx + 14, top], [e.cx + w, e.cy + e.th / 2], [e.cx - w, e.cy + e.th / 2]]); ctx.fill();
      ctx.fillStyle = rgba(WHITE, 0.16 * a); ctx.beginPath(); ctx.ellipse(e.cx, e.cy + e.th / 2, w, e.R * 0.26, 0, 0, TAU); ctx.fill();
      glow(ctx, e.cx, e.cy, e.R * 1.5, e.c, 0.5 * env(t, 40, 200, 700));
      ctx.globalCompositeOperation = 'source-over';
      e.conf.forEach((p, i) => {
        const q = burstAt(p, t, 520 + e.grav); if (!q) return;
        const c = THEMES.mascarada.palette[i % 5]; const flip = Math.abs(Math.cos(q.rot * 1.7 + p.k * 6));
        const sway = Math.sin(t * 0.006 + p.k * 20) * 14 * q.life;
        ctx.save(); ctx.translate(e.cx + q.x + sway, e.cy + q.y); ctx.rotate(q.rot);
        ctx.fillStyle = rgba(c, Math.min(1, (1 - q.life) * 2.2)); ctx.fillRect(-p.size * 0.6, -p.size * flip, p.size * 1.2, p.size * 2 * flip + 0.8); ctx.restore();
      });
      ctx.globalCompositeOperation = 'lighter';
    },
  },

  // L'Altare della Ricomposizione — schegge d'oro che si ricompongono
  kethran: {
    color: (o) => hexRgb(o.accent), color2: [255, 246, 201], count: 14,
    mote(ctx, e, x, y, ang, p, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(p.k * 6 + p.u * 10); ctx.fillStyle = rgba(mix(e.c, WHITE, 0.3 + 0.5 * p.k), a); poly(ctx, [[0, -9], [6, 7], [-5, 3]]); ctx.fill(); ctx.restore(); glow(ctx, x, y, 8, e.c, a * 0.5); },
    setup(e, rnd) {
      e.shards = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * TAU + rnd() * 0.3, far: 1.6 + rnd() * 1.6, s: 6 + rnd() * 10, rot: rnd() * TAU, d: rnd() * 160, k: rnd() }));
      e.cracks = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU + rnd() * 0.5; let r = 0.5; const pts = []; for (let j = 0; j < 6; j += 1) { r += 0.22 + rnd() * 0.2; pts.push([a + (rnd() - 0.5) * 0.34, r]); } return pts; });
      e.dust = burst(rnd, 40, { speed: 150, life: 1200, size: 2, delay: 420 });
    },
    impact(ctx, t, e) {
      const join = 380; const fade = env(t, 1, 1100, 1700);
      e.shards.forEach((s) => {
        const k = easeInOut((t - s.d) / join); if (t < s.d) return;
        const r = e.R * (s.far * (1 - k) + 0.55 * k); const a = s.a + (1 - k) * 0.9;
        ctx.save(); ctx.translate(e.cx + Math.cos(a) * r, e.cy + Math.sin(a) * r); ctx.rotate(s.rot * (1 - k) + a * k);
        ctx.fillStyle = rgba(mix(e.c, WHITE, 0.25 + 0.5 * s.k), fade * Math.min(1, (t - s.d) / 90)); poly(ctx, [[0, -s.s], [s.s * 0.55, s.s * 0.7], [-s.s * 0.5, s.s * 0.35]]); ctx.fill(); ctx.restore();
      });
      const lock = t - join - 120; if (lock > 0) {
        const s = stamp(lock / 260); const a = env(lock, 30, 700, 1250); const d = e.R * 0.6 * s;
        ctx.save(); ctx.translate(e.cx, e.cy); ctx.rotate(Math.PI / 4); ctx.shadowColor = rgba(e.c, 1); ctx.shadowBlur = 18;
        ctx.strokeStyle = rgba(e.c2, a); ctx.lineWidth = 3.5; ctx.strokeRect(-d, -d, d * 2, d * 2); ctx.lineWidth = 1.4; ctx.strokeRect(-d * 0.6, -d * 0.6, d * 1.2, d * 1.2); ctx.restore();
        glow(ctx, e.cx, e.cy, e.R * 1.6, e.c, 0.7 * env(lock, 30, 140, 600));
        e.cracks.forEach((pts) => { const kk = easeOut(lock / 300); ctx.strokeStyle = rgba(e.c2, 0.8 * env(lock, 20, 400, 1000)); ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(([a2, r2], j) => { const rr = e.R * r2 * kk; ctx[j ? 'lineTo' : 'moveTo'](e.cx + Math.cos(a2) * rr, e.cy + Math.sin(a2) * rr); }); ctx.stroke(); });
      }
      e.dust.forEach((p) => { const q = burstAt(p, t, e.grav + 40); if (q) glow(ctx, e.cx + q.x, e.cy + q.y, p.size * 2.2, e.c, 0.8 * (1 - q.life)); });
    },
  },

  // La Fame — non un oggetto: una sensazione trasmessa. Il battito accelera, le vene
  // affiorano dai bordi, il bersaglio suda e fila bava. Niente al centro: resta leggibile.
  mounthborn: {
    color: (o) => hexRgb(o.accent), color2: [226, 84, 160], count: 8, stagger: 60,
    // gocce di bava tese in volo, con il loro filo
    mote(ctx, e, x, y, ang, p, a) {
      const len = 16 + 10 * p.k; const g = ctx.createLinearGradient(x - Math.cos(ang) * len, y - Math.sin(ang) * len, x, y);
      g.addColorStop(0, rgba(e.c, 0)); g.addColorStop(1, rgba(mix(e.c, WHITE, 0.55), 0.7 * a));
      ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = rgba(mix(e.c, WHITE, 0.6), 0.75 * a); ctx.beginPath(); ctx.ellipse(x, y, 3.4, 2.4, ang, 0, TAU); ctx.fill();
    },
    setup(e, rnd) {
      // battiti sempre più ravvicinati: è adrenalina che sale
      e.beats = [0, 310, 570, 790, 970, 1120, 1250, 1370];
      const hw = e.tw / 2; const hh = e.th / 2; const per = (k) => { const u = k * 4; const side = Math.floor(u) % 4; const f = u - Math.floor(u); return side === 0 ? [-hw + f * e.tw, -hh, 0, 1] : side === 1 ? [hw, -hh + f * e.th, -1, 0] : side === 2 ? [hw - f * e.tw, hh, 0, -1] : [-hw, hh - f * e.th, 1, 0]; };
      const reach = Math.min(e.tw, e.th) * 0.42;
      // su bersagli piccoli (targa PV, Campo) gocce e fili si rimpiccioliscono
      const sc = Math.max(0.42, Math.min(1, Math.min(e.tw, e.th) / 150));
      // vene: un tronco che parte dal bordo, curva dolcemente e si assottiglia, con uno o due rami
      const walk = (x0, y0, a0, len, n, w0) => {
        let a = a0; let turn = (rnd() - 0.5) * 0.5; let x = x0; let y = y0; const pts = [[x, y, w0]];
        for (let j = 1; j <= n; j += 1) { turn = turn * 0.45 + (rnd() - 0.5) * 0.62; a += turn; x += Math.cos(a) * (len / n); y += Math.sin(a) * (len / n); pts.push([x, y, w0 * (1 - (j / n) * 0.6), a]); }
        return pts;
      };
      e.veins = [];
      for (let i = 0; i < 8; i += 1) {
        const [x0, y0] = per((i + 0.2 + rnd() * 0.6) / 8); const d = rnd() * 240; const w0 = (1.7 + rnd() * 0.8) * sc;
        // il tronco punta verso l'interno del bersaglio e serpeggia appena
        const trunk = walk(x0, y0, Math.atan2(-y0, -x0) + (rnd() - 0.5) * 0.5, reach * (0.75 + rnd() * 0.4), 14, w0);
        e.veins.push({ pts: trunk, d, from: 0 });
        for (let b2 = 0; b2 < 2; b2 += 1) {
          // i rami nascono dal tronco, con il suo stesso spessore in quel punto, ad angolo stretto
          const at = 3 + Math.floor(rnd() * 7); const [bx, by, bw, ba] = trunk[at];
          e.veins.push({ pts: walk(bx, by, ba + (b2 ? -1 : 1) * (0.5 + rnd() * 0.4), reach * (0.3 + rnd() * 0.25), 8, bw * 0.85), d, from: at / 14 });
        }
      }
      e.sweat = Array.from({ length: Math.round(4 + Math.min(18, (e.tw * e.th) / 3600)) }, () => ({ x: (rnd() - 0.5) * e.tw * 0.84, y: -hh + rnd() * e.th * 0.62, r: (1.6 + rnd() * 2.2) * sc, born: 120 + rnd() * 620, hold: 260 + rnd() * 420, run: 0.5 + rnd() * 0.9 }));
      const strands = Math.max(2, Math.min(5, Math.round(e.tw / 60)));
      e.drool = Array.from({ length: strands }, (_, i) => ({ x: -hw + ((i + 0.3 + rnd() * 0.4) / strands) * e.tw, len: (0.34 + rnd() * 0.3) * Math.max(e.th, 70), d: 160 + rnd() * 320, sway: rnd() * TAU, r: (2.4 + rnd() * 1.6) * sc }));
      e.breath = Array.from({ length: 4 }, () => ({ x: (rnd() - 0.5) * e.tw * 0.7, d: rnd() * 700, r: 0.5 + rnd() * 0.5 }));
    },
    impact(ctx, t, e) {
      const a = env(t, 80, 1250, 1800); const hw = e.tw / 2; const hh = e.th / 2;
      // battito: colpo doppio, «tum-tum»
      let pulse = 0; e.beats.forEach((b) => { [0, 95].forEach((off, n) => { const x = t - b - off; if (x > 0) pulse += (n ? 0.6 : 1) * Math.min(1, x / 14) * Math.exp(-x / 85); }); });
      pulse = Math.min(1.2, pulse);
      // la vista si stringe: bordi accesi, centro libero
      ctx.save(); roundRect(ctx, e.cx - hw, e.cy - hh, e.tw, e.th, 9); ctx.clip();
      const vg = ctx.createRadialGradient(e.cx, e.cy, Math.min(hw, hh) * 0.35, e.cx, e.cy, Math.hypot(hw, hh));
      vg.addColorStop(0, rgba(e.c, 0)); vg.addColorStop(1, rgba(e.c, (0.12 + 0.3 * pulse) * a));
      ctx.fillStyle = vg; ctx.fillRect(e.cx - hw, e.cy - hh, e.tw, e.th);
      // vene: affiorano dal bordo, e a ogni battito un'onda di sangue le percorre dalla radice alla punta.
      // Ogni vena è UNA sagoma piena che si assottiglia: tratti sovrapposti la farebbero sembrare tratteggiata.
      ctx.globalCompositeOperation = 'source-over';
      const deep = mix(e.c2, [58, 10, 52], 0.72); const lit = mix(e.c2, WHITE, 0.18);
      const ribbon = (v, u0, u1, swell, bulge = false) => {
        const n = v.pts.length - 1; const at = (u) => { const f = clamp01(u) * n; const i = Math.min(n - 1, Math.floor(f)); const k = f - i; const p = v.pts[i]; const q = v.pts[i + 1]; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k]; };
        const steps = Math.max(2, Math.ceil((u1 - u0) * n * 2)); const left = []; const right = [];
        for (let i = 0; i <= steps; i += 1) {
          const u = u0 + ((u1 - u0) * i) / steps; const [x, y, w] = at(u); const [xa, ya] = at(u - 0.02); const [xb, yb] = at(u + 0.02);
          const len = Math.hypot(xb - xa, yb - ya) || 1; const nx = -(yb - ya) / len; const ny = (xb - xa) / len;
          // la punta si chiude a zero, così la vena finisce affusolata
          // la punta si chiude; un rigonfiamento (l'onda) si chiude a entrambi i capi
          const half = Math.max(0.25, (w * swell) / 2) * (bulge ? Math.sin((i / steps) * Math.PI) : (i === steps ? 0.1 : 1));
          left.push([e.cx + x + nx * half, e.cy + y + ny * half]); right.push([e.cx + x - nx * half, e.cy + y - ny * half]);
        }
        ctx.beginPath(); left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); right.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill();
      };
      // col battito si scuriscono e si gonfiano appena, tutte insieme
      ctx.fillStyle = rgba(mix(deep, lit, 0.35 * Math.min(1, pulse)), (0.5 + 0.3 * Math.min(1, pulse)) * a);
      e.veins.forEach((v) => {
        const grown = Math.min(1, easeOut((t - v.d) / 700) * 1.25 - v.from); if (grown <= 0.02) return;
        ribbon(v, 0, grown, 1 + 0.35 * Math.min(1, pulse));
      });
      ctx.globalCompositeOperation = 'lighter';
      // fiato caldo dal basso
      e.breath.forEach((b) => { const tt = t - b.d; const k = clamp01(tt / 1100); if (tt <= 0 || k >= 1) return; glow(ctx, e.cx + b.x, e.cy + hh - k * e.th * 0.5, Math.min(hw, hh) * b.r * (0.6 + k), mix(e.c, WHITE, 0.5), 0.1 * (1 - k) * a); });
      ctx.globalCompositeOperation = 'source-over';
      // sudore: le gocce nascono, restano, poi colano lasciando la scia
      e.sweat.forEach((d) => {
        const tt = t - d.born; if (tt <= 0) return; const grow = clamp01(tt / 180); const slide = Math.max(0, tt - d.hold); const fall = d.run * slide * slide * 0.00035 * e.th * 0.02 * 50;
        const y = e.cy + d.y + fall; if (y > e.cy + hh + 4) return;
        if (fall > 1) { const tg = ctx.createLinearGradient(0, y - Math.min(fall, 46), 0, y); tg.addColorStop(0, rgba(WHITE, 0)); tg.addColorStop(1, rgba(mix(e.c, WHITE, 0.7), 0.4 * a)); ctx.strokeStyle = tg; ctx.lineWidth = d.r * 0.9; ctx.beginPath(); ctx.moveTo(e.cx + d.x, y - Math.min(fall, 46)); ctx.lineTo(e.cx + d.x, y); ctx.stroke(); }
        const r = d.r * grow;
        ctx.fillStyle = rgba(mix(e.c, WHITE, 0.72), 0.55 * a); ctx.beginPath(); ctx.ellipse(e.cx + d.x, y, r, r * (1.15 + Math.min(0.6, fall * 0.02)), 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(WHITE, 0.9 * a); ctx.beginPath(); ctx.arc(e.cx + d.x - r * 0.3, y - r * 0.35, r * 0.28, 0, TAU); ctx.fill();
      });
      ctx.restore();
      // bava: fili che si allungano dal bordo alto, tremano col battito, poi cedono
      e.drool.forEach((d) => {
        const tt = t - d.d; if (tt <= 0) return; const k = easeOut(tt / 900); const snap = clamp01((tt - 1150) / 260);
        const len = d.len * k; const x0 = e.cx + d.x; const y0 = e.cy - hh + 2; const sway = Math.sin(t * 0.006 + d.sway) * (3 + 5 * pulse) * k;
        const x1 = x0 + sway; const y1 = y0 + len + snap * 60;
        if (snap < 1) { ctx.strokeStyle = rgba(mix(e.c, WHITE, 0.7), 0.6 * a * (1 - snap)); ctx.lineWidth = 1.6 * (1 - 0.6 * k) + 0.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + sway * 0.2, y0 + len * 0.6, x1, y0 + len); ctx.stroke(); }
        const r = d.r * (0.5 + 0.5 * k);
        ctx.fillStyle = rgba(mix(e.c, WHITE, 0.68), 0.7 * a * (1 - snap * 0.6)); ctx.beginPath(); ctx.ellipse(x1, y1, r, r * 1.35, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(WHITE, 0.9 * a * (1 - snap)); ctx.beginPath(); ctx.arc(x1 - r * 0.3, y1 - r * 0.4, r * 0.3, 0, TAU); ctx.fill();
      });
      ctx.globalCompositeOperation = 'lighter';
      // il bordo batte: un anello che si allarga a ogni colpo
      e.beats.forEach((b) => { const x = t - b; if (x <= 0 || x > 420) return; const g2 = 2 + 16 * easeOut(x / 420); ctx.strokeStyle = rgba(e.c, 0.6 * (1 - x / 420) * a); ctx.lineWidth = 1.6; roundRect(ctx, e.cx - hw - g2, e.cy - hh - g2, e.tw + g2 * 2, e.th + g2 * 2, 9 + g2); ctx.stroke(); });
    },
  },

  // Il Castello degli Arcanisti Nefasti — sigillo arcano
  khemet: {
    color: (o) => hexRgb(o.accent), color2: [223, 248, 255], count: 12,
    glyph(ctx, k, s) { ctx.beginPath(); if (k < 0.25) { ctx.moveTo(-s, -s); ctx.lineTo(s, -s); ctx.lineTo(0, s); ctx.closePath(); } else if (k < 0.5) { ctx.rect(-s, -s, s * 2, s * 2); ctx.moveTo(0, -s); ctx.lineTo(0, s); } else if (k < 0.75) { ctx.arc(0, 0, s, 0, TAU); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); } else { ctx.moveTo(-s, s); ctx.lineTo(0, -s); ctx.lineTo(s, s); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.5, 0); } ctx.stroke(); },
    mote(ctx, e, x, y, ang, p, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(p.u * 5 + p.k * 6); ctx.strokeStyle = rgba(e.c2, a); ctx.lineWidth = 1.6; THEMES.khemet.glyph(ctx, p.k, 6); ctx.restore(); glow(ctx, x, y, 10, e.c, a * 0.55); },
    setup(e, rnd) { e.glyphs = Array.from({ length: 12 }, () => rnd()); e.motes = burst(rnd, 36, { speed: 110, life: 1500, size: 2, delay: 500 }); },
    impact(ctx, t, e) {
      const k = easeOut(t / 420); const a = env(t, 60, 1150, 1750); const R = e.R * (1.5 - 0.5 * k);
      ctx.shadowColor = rgba(e.c, 1); ctx.shadowBlur = 14; ctx.strokeStyle = rgba(e.c, a); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.cx, e.cy, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(e.cx, e.cy, R * 0.78, 0, TAU); ctx.stroke();
      // tacche e glifi sull'anello, in rotazione
      const rot = t * 0.0011 + (1 - k) * 2.4;
      for (let i = 0; i < 48; i += 1) { const aa = rot + (i / 48) * TAU; const r0 = R * (i % 4 ? 0.97 : 0.93); ctx.beginPath(); ctx.moveTo(e.cx + Math.cos(aa) * r0, e.cy + Math.sin(aa) * r0); ctx.lineTo(e.cx + Math.cos(aa) * R, e.cy + Math.sin(aa) * R); ctx.stroke(); }
      ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(e.c2, a);
      e.glyphs.forEach((g, i) => { const aa = -rot * 0.7 + (i / 12) * TAU; ctx.save(); ctx.translate(e.cx + Math.cos(aa) * R * 0.885, e.cy + Math.sin(aa) * R * 0.885); ctx.rotate(aa + Math.PI / 2); THEMES.khemet.glyph(ctx, g, R * 0.045); ctx.restore(); });
      // quadrato e triangolo interni che si chiudono in senso opposto
      ctx.strokeStyle = rgba(e.c2, a); ctx.lineWidth = 2;
      ctx.save(); ctx.translate(e.cx, e.cy); ctx.rotate(Math.PI / 4 + (1 - k) * 1.8); const s = R * 0.5; ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.restore();
      ctx.save(); ctx.translate(e.cx, e.cy); ctx.rotate(-(1 - k) * 2.2 - t * 0.0006); poly(ctx, [0, 1, 2].map((i) => [Math.cos(-Math.PI / 2 + (i * TAU) / 3) * R * 0.62, Math.sin(-Math.PI / 2 + (i * TAU) / 3) * R * 0.62])); ctx.stroke(); ctx.restore();
      ctx.shadowBlur = 0;
      const lock = t - 420; glow(ctx, e.cx, e.cy, e.R * 1.5, e.c, 0.65 * env(lock, 30, 120, 620)); glow(ctx, e.cx, e.cy, e.R * 0.3, WHITE, 0.8 * env(lock, 20, 160, 560));
      ring(ctx, e.cx, e.cy, e.R * (1 + 1.2 * easeOut(lock / 520)), 2.5, e.c2, lock > 0 ? 1 - clamp01(lock / 520) : 0);
      e.motes.forEach((p) => { const q = burstAt(p, t, e.grav - 120); if (q) glow(ctx, e.cx + q.x, e.cy + q.y, p.size * 2.2, e.c, 0.85 * (1 - q.life)); });
    },
  },

  // Il Primo Canto — onde di suono
  orathai: {
    color: (o) => hexRgb(o.accent), color2: [214, 255, 244], count: 12,
    mote(ctx, e, x, y, ang, p, a) { ctx.strokeStyle = rgba(e.c2, a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7 + 3 * Math.sin(p.u * 20), ang - 0.9, ang + 0.9); ctx.stroke(); glow(ctx, x, y, 8, e.c, a * 0.5); },
    setup(e, rnd) { e.leaves = burst(rnd, 34, { speed: 230, life: 1500, size: 3.4, delay: 320, drag: 2.2 }); e.ph = rnd() * TAU; },
    impact(ctx, t, e) {
      for (let i = 0; i < 5; i += 1) {
        const tt = t - i * 150; if (tt <= 0) continue; const k = clamp01(tt / 900); if (k >= 1) continue;
        const R = e.R * (0.3 + 2 * easeOut(k)); const a = (1 - k) * 0.95;
        ctx.strokeStyle = rgba(i % 2 ? e.c2 : e.c, a); ctx.lineWidth = 3.4 * (1 - k) + 0.8; ctx.shadowColor = rgba(e.c, a); ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let s = 0; s <= 72; s += 1) { const aa = (s / 72) * TAU; const rr = R * (1 + 0.045 * Math.sin(aa * 9 + e.ph + t * 0.012 + i)); ctx[s ? 'lineTo' : 'moveTo'](e.cx + Math.cos(aa) * rr, e.cy + Math.sin(aa) * rr); }
        ctx.closePath(); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      glow(ctx, e.cx, e.cy, e.R * 1.2, e.c, 0.6 * env(t, 40, 220, 800));
      // la corda che vibra attraverso il bersaglio
      const a = env(t, 40, 500, 1300); ctx.strokeStyle = rgba(e.c2, 0.8 * a); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let s = 0; s <= 40; s += 1) { const x = e.cx - e.tw * 0.75 + (s / 40) * e.tw * 1.5; const y = e.cy + Math.sin((s / 40) * Math.PI) * Math.sin(t * 0.05) * e.R * 0.28 * a; ctx[s ? 'lineTo' : 'moveTo'](x, y); }
      ctx.stroke();
      e.leaves.forEach((p) => { const q = burstAt(p, t, e.grav + 60); if (!q) return; ctx.save(); ctx.translate(e.cx + q.x + Math.sin(t * 0.005 + p.k * 9) * 10, e.cy + q.y); ctx.rotate(q.rot); ctx.fillStyle = rgba(mix(e.c, WHITE, p.k * 0.5), 0.9 * (1 - q.life)); ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.6, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    },
  },

  // Sanguinaccio, il Registro — sigillo di ceralacca
  corte: {
    color: (o) => hexRgb(o.accent), color2: [255, 170, 160], count: 13,
    mote(ctx, e, x, y, ang, p, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = rgba(e.c, a); ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-2, -6, 5, 0); ctx.quadraticCurveTo(-2, 6, -11, 0); ctx.arc(2, 0, 5, 0, TAU); ctx.fill(); ctx.restore(); glow(ctx, x, y, 7, e.c2, a * 0.5); },
    setup(e, rnd) { e.edge = Array.from({ length: 22 }, () => 0.9 + rnd() * 0.24); e.splat = burst(rnd, 46, { speed: 300, life: 700, size: 3, delay: 0 }); e.drips = Array.from({ length: 3 }, () => ({ x: (rnd() - 0.5) * 0.9, len: 0.5 + rnd() * 0.8, d: 120 + rnd() * 260 })); },
    impact(ctx, t, e) {
      const s = stamp(t / 300); const a = env(t, 40, 1200, 1800); const R = e.R * 0.62 * s; const dark = mix(e.c, [60, 0, 0], 0.62);
      ctx.globalCompositeOperation = 'source-over';
      // colature
      e.drips.forEach((d) => { const k = easeOut((t - 300 - d.d) / 700); if (k <= 0) return; const x = e.cx + d.x * R; const y0 = e.cy + R * 0.7; const len = e.R * d.len * k; ctx.strokeStyle = rgba(dark, a); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + len); ctx.stroke(); ctx.fillStyle = rgba(e.c, a); ctx.beginPath(); ctx.arc(x, y0 + len, 4.2, 0, TAU); ctx.fill(); });
      // disco di ceralacca dal bordo irregolare
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
      const g = ctx.createRadialGradient(e.cx - R * 0.3, e.cy - R * 0.35, 0, e.cx, e.cy, R * 1.1);
      g.addColorStop(0, rgba(e.c2, a)); g.addColorStop(0.4, rgba(e.c, a)); g.addColorStop(1, rgba(dark, a));
      ctx.fillStyle = g; ctx.beginPath();
      e.edge.forEach((m, i) => { const aa = (i / e.edge.length) * TAU; const aa2 = ((i + 0.5) / e.edge.length) * TAU; const x = e.cx + Math.cos(aa) * R * m; const y = e.cy + Math.sin(aa) * R * m; if (!i) ctx.moveTo(x, y); const m2 = e.edge[(i + 1) % e.edge.length]; ctx.quadraticCurveTo(e.cx + Math.cos(aa2) * R * (m + m2) * 0.54, e.cy + Math.sin(aa2) * R * (m + m2) * 0.54, e.cx + Math.cos(aa + TAU / e.edge.length) * R * m2, e.cy + Math.sin(aa + TAU / e.edge.length) * R * m2); });
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      // impronta: anelli e bilancia stilizzata del Registro
      ctx.strokeStyle = rgba(dark, 0.85 * a); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(e.cx, e.cy, R * 0.68, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(e.c2, 0.4 * a); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.cx, e.cy, R * 0.62, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(dark, 0.9 * a); ctx.lineWidth = 2.4; ctx.beginPath();
      ctx.moveTo(e.cx, e.cy - R * 0.4); ctx.lineTo(e.cx, e.cy + R * 0.38); ctx.moveTo(e.cx - R * 0.36, e.cy - R * 0.22); ctx.lineTo(e.cx + R * 0.36, e.cy - R * 0.22);
      ctx.moveTo(e.cx - R * 0.2, e.cy + R * 0.38); ctx.lineTo(e.cx + R * 0.2, e.cy + R * 0.38); ctx.stroke();
      [-1, 1].forEach((d) => { ctx.beginPath(); ctx.arc(e.cx + d * R * 0.36, e.cy - R * 0.22 + R * 0.2, R * 0.14, 0, Math.PI); ctx.stroke(); });
      ctx.globalCompositeOperation = 'lighter';
      const hit = t - 160; glow(ctx, e.cx, e.cy, e.R * 1.5, e.c, 0.32 * env(hit, 20, 100, 480));
      ring(ctx, e.cx, e.cy, e.R * (0.6 + 1.3 * easeOut(hit / 480)), 3, e.c2, hit > 0 ? 1 - clamp01(hit / 480) : 0);
      ctx.globalCompositeOperation = 'source-over';
      e.splat.forEach((p) => { const q = burstAt(p, hit, 700 + e.grav); if (!q) return; ctx.fillStyle = rgba(q.life < 0.5 ? e.c : dark, 1 - q.life * 0.7); ctx.beginPath(); ctx.arc(e.cx + q.x, e.cy + q.y, p.size * (1 - q.life * 0.5), 0, TAU); ctx.fill(); });
      ctx.globalCompositeOperation = 'lighter';
    },
  },

  // La Domanda Senza Fine — stelle e costellazione
  orizzonte: {
    color: (o) => hexRgb(o.accent), color2: [236, 228, 255], count: 14,
    mote(ctx, e, x, y, ang, p, a) { ctx.fillStyle = rgba(WHITE, a); star4(ctx, x, y, 7 + 3 * Math.sin(p.u * 30 + p.k * 6), p.k * 3); ctx.fill(); glow(ctx, x, y, 11, e.c, a * 0.7); },
    setup(e, rnd) {
      e.stars = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU + rnd() * 0.6; const r = 0.55 + rnd() * 0.75; return { x: Math.cos(a) * r, y: Math.sin(a) * r * 1.15, s: 4 + rnd() * 5, d: 80 + i * 90 }; });
      e.dustS = Array.from({ length: 60 }, () => ({ x: (rnd() - 0.5) * 3.4, y: (rnd() - 0.5) * 3.4, ph: rnd() * TAU, s: 0.6 + rnd() * 1.6, d: rnd() * 600 }));
    },
    impact(ctx, t, e) {
      const a = env(t, 60, 1150, 1800);
      // bagliore centrale a quattro punte
      const f = env(t, 30, 220, 900); ctx.fillStyle = rgba(WHITE, f); star4(ctx, e.cx, e.cy, e.R * 1.5 * (0.4 + 0.6 * easeOut(t / 240)), t * 0.0006, 0.05); ctx.fill();
      ctx.fillStyle = rgba(e.c2, f * 0.8); star4(ctx, e.cx, e.cy, e.R * 0.9, Math.PI / 4 + t * 0.0006, 0.07); ctx.fill();
      glow(ctx, e.cx, e.cy, e.R * 1.3, e.c, 0.75 * f);
      // linee che si tracciano da stella a stella
      ctx.strokeStyle = rgba(e.c2, 0.75 * a); ctx.lineWidth = 1.3;
      e.stars.forEach((s, i) => { const n = e.stars[(i + 1) % e.stars.length]; const k = easeOut((t - n.d) / 260); if (k <= 0) return; const x0 = e.cx + s.x * e.R; const y0 = e.cy + s.y * e.R; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (e.cx + n.x * e.R - x0) * k, y0 + (e.cy + n.y * e.R - y0) * k); ctx.stroke(); });
      e.stars.forEach((s) => { const k = clamp01((t - s.d) / 200); if (k <= 0) return; const x = e.cx + s.x * e.R; const y = e.cy + s.y * e.R; const tw = 0.8 + 0.2 * Math.sin(t * 0.02 + s.d); ctx.fillStyle = rgba(WHITE, a * k); star4(ctx, x, y, s.s * (2.2 - 1.2 * k) * tw, 0, 0.14); ctx.fill(); glow(ctx, x, y, s.s * 3, e.c, 0.8 * a * k); });
      e.dustS.forEach((d) => { const k = env(t - d.d, 200, 500, 1100); if (k <= 0) return; glow(ctx, e.cx + d.x * e.R, e.cy + d.y * e.R - (t - d.d) * 0.012, d.s * 2, e.c2, 0.75 * k * (0.5 + 0.5 * Math.sin(t * 0.03 + d.ph))); });
    },
  },

  // Bella Malelabbra — il bacio avvelenato: labbra inclinate col contorno verde; poi la bocca
  // si schiude e ne sbuca un topo
  ratti: {
    color: (o) => hexRgb(o.accent), color2: [232, 84, 178], count: 12,
    heart(ctx, x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.5, -s * 0.2, -s * 0.7, -s * 1.3, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.7, -s * 1.3, s * 1.5, -s * 0.2, 0, s * 0.9); ctx.closePath(); ctx.restore(); },
    mote(ctx, e, x, y, ang, p, a) { ctx.fillStyle = rgba(mix(e.c2, WHITE, 0.25 * p.k), a); THEMES.ratti.heart(ctx, x, y, 5 + 3 * p.k, Math.sin(p.u * 12 + p.k * 6) * 0.5); ctx.fill(); glow(ctx, x, y, 9, e.c, a * 0.55); },
    /** Labbra: arco di Cupido sopra, labbro pieno sotto. Unità = larghezza/2. */
    lips(ctx, x, y, w, open, part = 'both') {
      const h = w * 0.36;
      ctx.beginPath();
      if (part !== 'lower') {
        ctx.moveTo(x - w, y);
        ctx.bezierCurveTo(x - w * 0.6, y - h * 0.9, x - w * 0.3, y - h * 1.45, x - w * 0.12, y - h * 1.05);
        ctx.quadraticCurveTo(x, y - h * 0.78, x + w * 0.12, y - h * 1.05);
        ctx.bezierCurveTo(x + w * 0.3, y - h * 1.45, x + w * 0.6, y - h * 0.9, x + w, y);
        ctx.bezierCurveTo(x + w * 0.5, y - h * open, x - w * 0.5, y - h * open, x - w, y); ctx.closePath();
      }
      if (part !== 'upper') {
        ctx.moveTo(x - w, y);
        ctx.bezierCurveTo(x - w * 0.5, y + h * open, x + w * 0.5, y + h * open, x + w, y);
        ctx.bezierCurveTo(x + w * 0.55, y + h * 1.75, x - w * 0.55, y + h * 1.75, x - w, y); ctx.closePath();
      }
    },
    setup(e, rnd) {
      // vene di veleno: spezzate che si diramano dal bacio
      e.veins = Array.from({ length: 6 }, (_, i) => { let a = (i / 6) * TAU + rnd() * 0.5; let x = Math.cos(a) * 0.5; let y = Math.sin(a) * 0.22; const pts = [[x, y]]; const n = 7 + Math.floor(rnd() * 4); for (let j = 0; j < n; j += 1) { a += (rnd() - 0.5) * 1.1; const step = 0.16 + rnd() * 0.16; x += Math.cos(a) * step; y += Math.sin(a) * step; pts.push([x, y]); } return { pts, d: rnd() * 260, w: 0.8 + rnd() * 0.9 }; });
      e.hearts = burst(rnd, 7, { speed: 150, life: 1500, size: 6, delay: 380, drag: 1.6 }); e.hearts.forEach((p) => { p.a = -Math.PI / 2 + (rnd() - 0.5) * 1.5; });
    },
    impact(ctx, t, e) {
      const a = env(t, 40, 1300, 1850); const s = stamp(t / 320); const w = e.R * 1.3 * s; const dark = mix(e.c2, [40, 0, 40], 0.6);
      // lo schiocco: dopo l'impronta le labbra si stringono un istante e si rilassano
      const smack = env(t - 330, 70, 110, 330); const lw = w * (1 - 0.07 * smack);
      // poi la bocca si schiude e ne sbuca un topo: annusa, si guarda attorno e rientra
      const part = env(t - 500, 170, 760, 940); const open = 0.32 - 0.2 * smack + 0.5 * part;
      const out = easeInOut(env(t - 560, 220, 640, 840)); const tilt = -0.2;
      // alone verde dietro alle labbra: respira piano
      const breathe = 0.82 + 0.18 * Math.sin(t * 0.008);
      ctx.save(); ctx.translate(e.cx, e.cy); ctx.scale(1, 0.62); glow(ctx, 0, 0, w * 1.7, e.c, 0.6 * a * breathe); ctx.restore();
      // il veleno si dirama
      const press = t - 180;
      if (press > 0) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        e.veins.forEach((v) => {
          const k = easeOut((press - v.d) / 620); if (k <= 0) return; const upto = k * (v.pts.length - 1);
          for (let pass = 0; pass < 2; pass += 1) {
            ctx.strokeStyle = pass ? rgba(mix(e.c, WHITE, 0.35), 0.5 * a) : rgba(e.c, 0.2 * a); ctx.lineWidth = pass ? v.w : v.w * 3; ctx.beginPath();
            v.pts.forEach(([px, py], j) => { if (j > upto + 1) return; const f = j <= upto ? 1 : upto - (j - 1); const [qx, qy] = j ? v.pts[j - 1] : [px, py]; const x = e.cx + (qx + (px - qx) * f) * e.R; const y = e.cy + (qy + (py - qy) * f) * e.R; ctx[j ? 'lineTo' : 'moveTo'](x, y); });
            ctx.stroke();
          }
        });
      }
      ctx.globalCompositeOperation = 'source-over';
      // le labbra stanno un po' inclinate: tutto quello che le riguarda ruota insieme
      ctx.save(); ctx.translate(e.cx, e.cy); ctx.rotate(tilt); ctx.translate(-e.cx, -e.cy);
      const L = THEMES.ratti.lips; const hh = lw * 0.36;
      // contorno verde: prima un bordo largo e sfumato, poi un filo netto, entrambi sotto al colore
      ctx.lineJoin = 'round';
      ctx.shadowColor = rgba(e.c, a); ctx.shadowBlur = 26; ctx.strokeStyle = rgba(e.c, 0.85 * a * breathe); ctx.lineWidth = Math.max(5, lw * 0.11);
      L(ctx, e.cx, e.cy, lw, open); ctx.stroke();
      ctx.shadowBlur = 8; ctx.strokeStyle = rgba(mix(e.c, WHITE, 0.55), a); ctx.lineWidth = Math.max(2, lw * 0.035);
      L(ctx, e.cx, e.cy, lw, open); ctx.stroke(); ctx.shadowBlur = 0;
      // l'interno della bocca: buio, con un fondo verde
      const mg = ctx.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, lw * 0.8);
      mg.addColorStop(0, rgba(mix(e.c, [0, 0, 0], 0.72), a)); mg.addColorStop(1, rgba([14, 2, 14], a));
      ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(e.cx - lw, e.cy); ctx.bezierCurveTo(e.cx - lw * 0.5, e.cy - hh * open, e.cx + lw * 0.5, e.cy - hh * open, e.cx + lw, e.cy); ctx.bezierCurveTo(e.cx + lw * 0.5, e.cy + hh * open, e.cx - lw * 0.5, e.cy + hh * open, e.cx - lw, e.cy); ctx.closePath(); ctx.fill();
      // le labbra
      const g = ctx.createLinearGradient(e.cx, e.cy - lw * 0.55, e.cx, e.cy + lw * 0.65);
      g.addColorStop(0, rgba(mix(e.c2, WHITE, 0.3), a)); g.addColorStop(0.45, rgba(e.c2, a)); g.addColorStop(1, rgba(dark, a));
      ctx.fillStyle = g; L(ctx, e.cx, e.cy, lw, open); ctx.fill();
      const shine = () => {
        // pieghe brevi e leggere, due riflessi fermi e uno che scorre da sinistra a destra
        ctx.strokeStyle = rgba(dark, 0.3 * a); ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i += 1) { const x = e.cx + i * lw * 0.17; ctx.beginPath(); ctx.moveTo(x, e.cy - lw * 0.36 + Math.abs(i) * lw * 0.05); ctx.lineTo(x + i * lw * 0.012, e.cy - lw * 0.2); ctx.moveTo(x, e.cy + lw * 0.26); ctx.lineTo(x + i * lw * 0.02, e.cy + lw * 0.5 - Math.abs(i) * lw * 0.06); ctx.stroke(); }
        ctx.fillStyle = rgba(WHITE, 0.55 * a); ctx.beginPath(); ctx.ellipse(e.cx - lw * 0.28, e.cy + lw * 0.36, lw * 0.2, lw * 0.055, -0.18, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(WHITE, 0.35 * a); ctx.beginPath(); ctx.ellipse(e.cx + lw * 0.3, e.cy - lw * 0.3, lw * 0.1, lw * 0.03, 0.3, 0, TAU); ctx.fill();
        const sweep = (t - 380) / 480; if (sweep > 0 && sweep < 1) { const sx = e.cx - lw * 1.2 + sweep * lw * 2.4; const sg = ctx.createLinearGradient(sx - lw * 0.22, 0, sx + lw * 0.22, 0); sg.addColorStop(0, rgba(WHITE, 0)); sg.addColorStop(0.5, rgba(WHITE, 0.55 * a)); sg.addColorStop(1, rgba(WHITE, 0)); ctx.fillStyle = sg; ctx.fillRect(sx - lw * 0.22, e.cy - lw, lw * 0.44, lw * 2); }
      };
      ctx.save(); L(ctx, e.cx, e.cy, lw, open); ctx.clip(); shine(); ctx.restore();
      // il topo: sbuca dal buio tra le labbra, annusa, si guarda attorno e rientra
      if (out > 0.01) {
        const hw2 = lw * 0.2; const hl = lw * 0.52; // mezza larghezza e lunghezza del muso
        const look = Math.sin(t * 0.011) * 0.16 * out; const sniff = Math.sin(t * 0.06) * lw * 0.012;
        const fur = [74, 64, 84]; const furD = [30, 24, 38]; const pink = [244, 150, 190];
        ctx.save(); ctx.translate(e.cx + lw * 0.04, e.cy - hh * open * 0.55 - hl * 0.55 + hl * 0.86 * out); ctx.rotate(look);
        // orecchie (dietro alla testa): spuntano per ultime
        [-1, 1].forEach((d) => { const tw2 = Math.sin(t * 0.03 + d) * 0.06; ctx.save(); ctx.translate(d * hw2 * 0.86, hl * 0.06); ctx.rotate(d * (0.25 + tw2));
          ctx.fillStyle = rgba(furD, a); ctx.beginPath(); ctx.ellipse(0, 0, hw2 * 0.5, hw2 * 0.58, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = rgba(pink, 0.85 * a); ctx.beginPath(); ctx.ellipse(0, hw2 * 0.04, hw2 * 0.3, hw2 * 0.38, 0, 0, TAU); ctx.fill(); ctx.restore(); });
        // testa a pera: guance larghe in alto, muso che si stringe verso il basso
        const hg = ctx.createLinearGradient(0, 0, 0, hl); hg.addColorStop(0, rgba(furD, a)); hg.addColorStop(0.45, rgba(fur, a)); hg.addColorStop(1, rgba(mix(fur, WHITE, 0.22), a));
        ctx.fillStyle = hg; ctx.shadowColor = rgba(e.c, 0.9 * a); ctx.shadowBlur = 9; ctx.beginPath(); ctx.moveTo(-hw2, hl * 0.2);
        ctx.bezierCurveTo(-hw2 * 1.05, -hl * 0.12, hw2 * 1.05, -hl * 0.12, hw2, hl * 0.2);
        ctx.bezierCurveTo(hw2 * 0.95, hl * 0.6, hw2 * 0.34, hl * 0.92, 0, hl + sniff);
        ctx.bezierCurveTo(-hw2 * 0.34, hl * 0.92, -hw2 * 0.95, hl * 0.6, -hw2, hl * 0.2); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        // occhi verdi accesi, con una palpebra che batte una volta
        const blink = 1 - env(t - 1010, 40, 70, 140) * 0.9;
        [-1, 1].forEach((d) => { const ex = d * hw2 * 0.46; const ey = hl * 0.36; ctx.globalCompositeOperation = 'lighter'; glow(ctx, ex, ey, hw2 * 0.5, e.c, 0.8 * a); ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = rgba(mix(e.c, WHITE, 0.35), a); ctx.beginPath(); ctx.ellipse(ex, ey, hw2 * 0.15, hw2 * 0.17 * blink, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = rgba([6, 16, 8], a); ctx.beginPath(); ctx.ellipse(ex, ey, hw2 * 0.055, hw2 * 0.13 * blink, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = rgba(WHITE, 0.9 * a); ctx.beginPath(); ctx.arc(ex - hw2 * 0.05, ey - hw2 * 0.06, hw2 * 0.035, 0, TAU); ctx.fill(); });
        // naso, incisivi e baffi che fremono
        const ny2 = hl * 0.93 + sniff;
        ctx.fillStyle = rgba([250, 246, 232], a); ctx.fillRect(-hw2 * 0.09, ny2 + hw2 * 0.08, hw2 * 0.08, hw2 * 0.2); ctx.fillRect(hw2 * 0.01, ny2 + hw2 * 0.08, hw2 * 0.08, hw2 * 0.2);
        ctx.fillStyle = rgba(pink, a); ctx.beginPath(); ctx.ellipse(0, ny2, hw2 * 0.17, hw2 * 0.13, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba([236, 230, 240], 0.8 * a); ctx.lineWidth = Math.max(0.8, lw * 0.006); ctx.lineCap = 'round';
        [-1, 1].forEach((d) => { for (let i = -1; i <= 1; i += 1) { const wa = i * 0.3 + Math.sin(t * 0.05 + i) * 0.07; ctx.beginPath(); ctx.moveTo(d * hw2 * 0.16, ny2 - hw2 * 0.08); ctx.lineTo(d * (hw2 * 0.16 + Math.cos(wa) * hw2 * 1.05), ny2 - hw2 * 0.08 + Math.sin(wa) * hw2 * 1.05); ctx.stroke(); } });
        ctx.restore();
        // zampine rosa aggrappate al labbro inferiore
        [-1, 1].forEach((d) => { const px = e.cx + lw * 0.04 + d * hw2 * 1.25; const py = e.cy + hh * open * 0.7 + (1 - out) * lw * 0.1; ctx.fillStyle = rgba(pink, a * Math.min(1, out * 1.6));
          for (let f = -1; f <= 1; f += 1) { ctx.beginPath(); ctx.ellipse(px + f * hw2 * 0.13, py + Math.abs(f) * hw2 * 0.03, hw2 * 0.065, hw2 * 0.17, f * 0.2, 0, TAU); ctx.fill(); } });
        // il labbro superiore torna davanti: il topo esce da sotto
        ctx.fillStyle = g; L(ctx, e.cx, e.cy, lw, open, 'upper'); ctx.fill();
        ctx.save(); L(ctx, e.cx, e.cy, lw, open, 'upper'); ctx.clip(); shine(); ctx.restore();
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, e.cx, e.cy, e.R * 1.5, e.c2, 0.45 * env(press, 20, 110, 520));
      ring(ctx, e.cx, e.cy, e.R * (0.6 + 1.3 * easeOut(press / 520)), 2.5, e.c, press > 0 ? 1 - clamp01(press / 520) : 0);
      // cuori che salgono e svaniscono in fumo verde
      e.hearts.forEach((p) => { const q = burstAt(p, t, e.grav - 150); if (!q) return; const x = e.cx + q.x + Math.sin(t * 0.005 + p.k * 9) * 9; const y = e.cy + q.y; ctx.fillStyle = rgba(mix(e.c2, e.c, q.life), 0.95 * (1 - q.life)); THEMES.ratti.heart(ctx, x, y, p.size * (1 - q.life * 0.4), Math.sin(t * 0.004 + p.k * 6) * 0.4); ctx.fill(); glow(ctx, x, y, p.size * 2.4, e.c, 0.4 * q.life * (1 - q.life) * 4); });
    },
  },

  // L'Enclave dell'Ascensione — monete e scaglie d'oro
  enclave: {
    color: (o) => hexRgb(o.accent), color2: [255, 236, 170], count: 14,
    coin(ctx, x, y, r, flip, c, c2, a) { if (a <= 0) return; const w = Math.max(0.12, Math.abs(flip)); ctx.fillStyle = rgba(flip > 0 ? c2 : c, a); ctx.beginPath(); ctx.ellipse(x, y, r * w, r, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(mix(c, [80, 40, 0], 0.5), a); ctx.lineWidth = 1.2; ctx.stroke(); if (w > 0.5) { ctx.strokeStyle = rgba(mix(c, [80, 40, 0], 0.35), a * 0.8); ctx.beginPath(); ctx.ellipse(x, y, r * w * 0.6, r * 0.6, 0, 0, TAU); ctx.stroke(); } },
    mote(ctx, e, x, y, ang, p, a) { THEMES.enclave.coin(ctx, x, y, 6.5, Math.cos(p.u * 26 + p.k * 6), e.c, e.c2, a); glow(ctx, x, y, 9, e.c, a * 0.45); },
    setup(e, rnd) { e.coins = burst(rnd, 44, { speed: 360, life: 1500, size: 6, delay: 120, drag: 2 }); e.coins.forEach((p) => { p.a = -Math.PI / 2 + (rnd() - 0.5) * 2; }); },
    impact(ctx, t, e) {
      // scaglie che si accendono in diagonale dentro il bersaglio
      const a = env(t, 60, 950, 1600); const x0 = e.cx - e.tw / 2; const y0 = e.cy - e.th / 2; const sw = 22; const sh = 13;
      ctx.save(); roundRect(ctx, x0, y0, e.tw, e.th, 8); ctx.clip(); ctx.lineWidth = 1.6;
      for (let row = 0; row * sh < e.th + sh; row += 1) for (let col = -1; col * sw < e.tw + sw; col += 1) {
        const x = x0 + col * sw + (row % 2 ? sw / 2 : 0); const y = y0 + row * sh;
        const wave = clamp01(1 - Math.abs(((x - x0) + (y - y0)) / (e.tw + e.th) - (t / 900 - 0.1)) * 3.2);
        const al = a * (0.16 + 0.84 * wave); if (al < 0.03) continue;
        ctx.strokeStyle = rgba(mix(e.c, e.c2, wave), al); ctx.beginPath(); ctx.arc(x, y, sw / 2, 0.08 * Math.PI, 0.92 * Math.PI); ctx.stroke();
      }
      ctx.restore();
      glow(ctx, e.cx, e.cy, e.R * 1.5, e.c, 0.6 * env(t, 30, 160, 640));
      const s = stamp(t / 300); ctx.shadowColor = rgba(e.c, 1); ctx.shadowBlur = 14; ring(ctx, e.cx, e.cy, e.R * 0.62 * s, 4, e.c2, env(t, 30, 900, 1500)); ring(ctx, e.cx, e.cy, e.R * 0.5 * s, 1.4, e.c, env(t, 30, 900, 1500)); ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      e.coins.forEach((p) => { const q = burstAt(p, t, 640 + e.grav); if (q) THEMES.enclave.coin(ctx, e.cx + q.x, e.cy + q.y, p.size, Math.cos(q.rot * 2), e.c, e.c2, Math.min(1, (1 - q.life) * 2.5)); });
      ctx.globalCompositeOperation = 'lighter';
    },
  },

  // Il Comando dei Quattro Fronti — traccianti e mirino
  calibri: {
    color: () => [255, 160, 60], color2: [255, 236, 200], count: 10, travelMs: 360, stagger: 46,
    mote(ctx, e, x, y, ang, p, a) { const g = ctx.createLinearGradient(x - Math.cos(ang) * 46, y - Math.sin(ang) * 46, x, y); g.addColorStop(0, rgba(e.c, 0)); g.addColorStop(1, rgba(e.c2, a)); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 46, y - Math.sin(ang) * 46); ctx.lineTo(x, y); ctx.stroke(); glow(ctx, x, y, 7, WHITE, a); },
    setup(e, rnd, o) { e.steel = hexRgb(o.accent); e.hits = Array.from({ length: 4 }, (_, i) => ({ x: (rnd() - 0.5) * 1.1, y: (rnd() - 0.5) * 1.1, d: i * 70, sp: burst(rnd, 16, { speed: 330, life: 420, size: 1.8 }) })); e.smoke = Array.from({ length: 10 }, () => ({ x: (rnd() - 0.5) * 1.3, y: (rnd() - 0.5) * 1.1, r: 0.35 + rnd() * 0.5, d: 80 + rnd() * 300 })); },
    impact(ctx, t, e) {
      ctx.globalCompositeOperation = 'source-over';
      e.smoke.forEach((s) => { const tt = t - s.d; const k = clamp01(tt / 1200); if (tt <= 0 || k >= 1) return; const r = e.R * s.r * (0.6 + 1.3 * easeOut(k)); const g = ctx.createRadialGradient(e.cx + s.x * e.R, e.cy + s.y * e.R - tt * 0.03, 0, e.cx + s.x * e.R, e.cy + s.y * e.R - tt * 0.03, r); g.addColorStop(0, rgba([120, 116, 108], 0.32 * (1 - k))); g.addColorStop(1, rgba([60, 58, 54], 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.cx + s.x * e.R, e.cy + s.y * e.R - tt * 0.03, r, 0, TAU); ctx.fill(); });
      // mirino: i settori arrivano ruotando e si agganciano
      const k = easeOut(t / 260); const a = env(t, 40, 1000, 1600); const R = e.R * (1.5 - 0.62 * k); const rot = (1 - k) * 1.9;
      ctx.strokeStyle = rgba(e.steel, a); ctx.lineWidth = 3; ctx.shadowColor = rgba(e.c, a); ctx.shadowBlur = 10;
      for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(e.cx, e.cy, R, rot + i * (TAU / 4) + 0.2, rot + (i + 1) * (TAU / 4) - 0.2); ctx.stroke(); }
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(e.cx, e.cy, R * 0.55, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2.4; for (let i = 0; i < 4; i += 1) { const aa = rot + i * (TAU / 4); ctx.beginPath(); ctx.moveTo(e.cx + Math.cos(aa) * R * 0.22, e.cy + Math.sin(aa) * R * 0.22); ctx.lineTo(e.cx + Math.cos(aa) * R * 1.28, e.cy + Math.sin(aa) * R * 1.28); ctx.stroke(); }
      ctx.shadowBlur = 0; ctx.fillStyle = rgba(e.c, a * (0.6 + 0.4 * Math.sin(t * 0.03))); ctx.beginPath(); ctx.arc(e.cx, e.cy, 3.2, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      e.hits.forEach((h) => { const tt = t - h.d; if (tt <= 0) return; const x = e.cx + h.x * e.R * 0.8; const y = e.cy + h.y * e.R * 0.8; glow(ctx, x, y, e.R * 0.75, e.c, 0.95 * env(tt, 12, 60, 300)); glow(ctx, x, y, e.R * 0.26, WHITE, env(tt, 10, 50, 220)); ring(ctx, x, y, e.R * 0.5 * easeOut(tt / 300), 2, e.c2, 1 - clamp01(tt / 300)); h.sp.forEach((p) => { const q = burstAt(p, tt, 600 + e.grav); if (q) { ctx.strokeStyle = rgba(e.c2, 1 - q.life); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + q.x, y + q.y); ctx.lineTo(x + q.x * 0.9, y + q.y * 0.9); ctx.stroke(); } }); });
    },
  },
};

export const EFFECT_FX_ENGINE_THEMES = Object.freeze(Object.keys(THEMES));

/**
 * Prepara un effetto.
 * @param {{ theme: string, kind: string, accent: string, lamp?: string|null, seed?: number,
 *   g: { x1: number, y1: number, x2: number, y2: number, tw: number, th: number } }} o
 * @returns {{ draw: (ctx: CanvasRenderingContext2D, tMs: number) => void, duration: number }}
 */
export function createEffectRun(o) {
  const def = THEMES[o.theme] || THEMES.apex;
  const rnd = mulberry32((o.seed ?? 7) + o.theme.length * 97 + o.kind.length * 13);
  const aura = o.kind === 'aura';
  const g = o.g;
  const c = def.color(o);
  const e = {
    cx: g.x2, cy: g.y2, tw: g.tw, th: g.th, kind: o.kind, c, c2: def.color2,
    R: Math.max(34, Math.min(118, Math.min(g.tw, g.th) * (aura ? 0.5 : 0.46))),
    grav: o.kind === 'boon' ? -170 : o.kind === 'bane' ? 150 : 0,
  };
  def.setup?.(e, rnd, o);
  const travel = def.travelMs || 560;
  const stagger = def.stagger || 38;
  const charge = 150;
  const impactAt = aura ? 120 : charge + travel * 0.9;
  // arco dello sciame: ogni granello ha la sua curva e il suo punto d'arrivo dentro il bersaglio
  const dx = g.x2 - g.x1; const dy = g.y2 - g.y1; const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist; const ny = dx / dist; const lift = Math.max(40, dist * 0.16) * (ny < 0 ? 1 : -1);
  const motes = aura ? [] : Array.from({ length: def.count }, (_, i) => ({
    i, k: rnd(), start: charge + i * stagger, bend: lift * (0.4 + rnd() * 1.3) + (rnd() - 0.5) * 50,
    ex: g.x2 + (rnd() - 0.5) * g.tw * 0.5, ey: g.y2 + (rnd() - 0.5) * g.th * 0.5,
    sx: g.x1 + (rnd() - 0.5) * 40, sy: g.y1 + (rnd() - 0.5) * 24,
  }));
  const pos = (m, u) => {
    const cx = (m.sx + m.ex) / 2 + nx * m.bend; const cy = (m.sy + m.ey) / 2 + ny * m.bend; const v = 1 - u;
    return [v * v * m.sx + 2 * v * u * cx + u * u * m.ex, v * v * m.sy + 2 * v * u * cy + u * u * m.ey];
  };

  function draw(ctx, t) {
    if (t < 0 || t > EFFECT_FX_DURATION_MS) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // carica sull'avviso
    if (!aura) {
      glow(ctx, g.x1, g.y1, 70 * easeOut(t / charge), c, 0.75 * env(t, 60, charge, charge + travel * 0.7));
      ring(ctx, g.x1, g.y1, 60 * (1 - easeOut(t / charge)) + 8, 2, def.color2, env(t, 30, charge * 0.8, charge + 60));
    }
    // sciame con scia
    motes.forEach((m) => {
      const u = (t - m.start) / travel; if (u <= 0 || u >= 1) return;
      const uu = easeInOut(u); m.u = uu;
      for (let s = 5; s >= 1; s -= 1) { const ut = uu - s * 0.028; if (ut <= 0) continue; const [tx, ty] = pos(m, ut); glow(ctx, tx, ty, 7 - s, c, 0.34 * (1 - s / 6) * Math.min(1, u * 6)); }
      const [x, y] = pos(m, uu); const [px, py] = pos(m, Math.max(0, uu - 0.02));
      def.mote(ctx, e, x, y, Math.atan2(y - py, x - px), m, Math.min(1, u * 6) * Math.min(1, (1 - u) * 8));
    });
    // impatto
    const ti = t - impactAt;
    if (ti > 0) {
      // il bersaglio si accende; un colpo «contro» lo scuote
      if (!aura) {
        const a = env(ti, 50, 420, 1300);
        ctx.shadowColor = rgba(c, a); ctx.shadowBlur = 22; ctx.strokeStyle = rgba(mix(c, WHITE, 0.25), a); ctx.lineWidth = 2;
        roundRect(ctx, e.cx - e.tw / 2, e.cy - e.th / 2, e.tw, e.th, 9); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(c, 0.13 * env(ti, 30, 160, 700)); ctx.fill();
      }
      if (o.kind === 'bane' && ti < 260) ctx.translate(Math.sin(ti * 0.11) * 7 * (1 - ti / 260), Math.cos(ti * 0.13) * 3 * (1 - ti / 260));
      def.impact(ctx, ti, e);
    }
    ctx.restore();
  }

  return { draw, duration: EFFECT_FX_DURATION_MS };
}
