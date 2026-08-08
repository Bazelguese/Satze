import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ARMY_COLORS } from '../../data/armies';

/**
 * SatzeCursor — puntatore custom del gioco (sostituisce la freccia di sistema).
 *
 *  A riposo   : lama "falce" a due toni, scia legata alla velocità.
 *  Cliccabile : dita escono → al click si chiudono → si riaprono;
 *               se non c'è più un target cliccabile, rientrano (uscita speculare).
 *  Carta      : lama aperta + raggio verso la carta vera in drag.
 */

const SAGOMA = {
  p: 'M0 0 L0 26 Q2.4 13.8 13 12.6 Z',
  f: 'M0 0 L0 26 Q1.6 16.5 4.2 12.9 Q2.4 6.4 0 0 Z',
  coda: [6.5, 19],
};

const DITA_ESTESA = ['M0.42 4.77 L-0.53 4.69 L-1.48 4.60 L-2.43 4.52 L-3.37 4.44 L-4.32 4.36 L-4.73 4.69 L-5.04 4.22 L-5.35 3.76 L-5.66 3.30 L-5.97 2.83 L-6.29 2.37 L-6.60 1.90 L-7.00 2.10 L-6.85 2.63 L-6.69 3.17 L-6.54 3.70 L-6.38 4.24 L-6.22 4.78 L-6.07 5.31 L-4.61 5.98 L-3.69 6.23 L-2.77 6.48 L-1.86 6.73 L-0.94 6.98 L-0.02 7.23 Z', 'M5.65 6.72 L6.49 5.82 L7.33 4.93 L8.18 4.03 L9.02 3.13 L9.86 2.24 L10.90 0.56 L10.58 -0.08 L10.27 -0.72 L9.95 -1.36 L9.64 -2.00 L9.33 -2.64 L9.01 -3.27 L8.59 -3.13 L8.74 -2.43 L8.89 -1.74 L9.05 -1.04 L9.20 -0.35 L9.35 0.35 L9.50 1.04 L8.74 1.03 L7.78 1.80 L6.82 2.57 L5.87 3.34 L4.91 4.11 L3.95 4.88 Z', 'M4.62 5.12 L5.25 4.07 L5.88 3.02 L6.51 1.97 L7.14 0.92 L7.77 -0.13 L8.46 -1.93 L8.12 -2.42 L7.77 -2.92 L7.43 -3.42 L7.09 -3.91 L6.74 -4.41 L6.40 -4.90 L6.00 -4.70 L6.19 -4.13 L6.38 -3.56 L6.57 -2.98 L6.76 -2.41 L6.95 -1.84 L7.14 -1.27 L6.43 -1.07 L5.66 -0.12 L4.89 0.83 L4.12 1.78 L3.35 2.73 L2.58 3.68 Z', 'M3.78 3.81 L4.10 2.61 L4.42 1.42 L4.74 0.22 L5.06 -0.97 L5.38 -2.17 L5.55 -4.10 L5.15 -4.41 L4.75 -4.71 L4.36 -5.02 L3.96 -5.33 L3.56 -5.64 L3.17 -5.95 L2.83 -5.65 L3.10 -5.22 L3.37 -4.80 L3.64 -4.38 L3.91 -3.95 L4.18 -3.53 L4.45 -3.10 L3.82 -2.70 L3.34 -1.56 L2.86 -0.42 L2.38 0.72 L1.90 1.86 L1.42 2.99 Z'];
const DITA_CHIUSA = ['M1.53 5.47 L0.56 5.11 L-0.41 4.75 L-1.38 4.40 L-2.35 4.04 L-3.32 3.69 L-3.97 4.38 L-3.64 3.67 L-3.31 2.96 L-2.99 2.25 L-2.66 1.54 L-2.33 0.83 L-2.01 0.12 L-2.39 -0.12 L-2.87 0.51 L-3.34 1.13 L-3.81 1.75 L-4.29 2.38 L-4.76 3.00 L-5.23 3.62 L-4.01 5.18 L-3.12 5.69 L-2.22 6.20 L-1.32 6.71 L-0.42 7.22 L0.47 7.73 Z', 'M7.74 9.32 L8.36 7.75 L8.98 6.18 L9.60 4.61 L10.23 3.04 L10.85 1.48 L10.86 -1.13 L10.09 -1.12 L9.32 -1.10 L8.54 -1.08 L7.77 -1.06 L6.99 -1.04 L6.22 -1.02 L6.18 -0.58 L6.94 -0.42 L7.70 -0.27 L8.46 -0.12 L9.22 0.03 L9.98 0.18 L10.74 0.33 L9.35 0.79 L8.57 2.29 L7.80 3.79 L7.02 5.29 L6.24 6.78 L5.46 8.28 Z', 'M6.19 5.58 L6.54 4.19 L6.90 2.79 L7.25 1.40 L7.60 0.01 L7.95 -1.38 L7.52 -3.73 L6.66 -3.55 L5.80 -3.36 L4.94 -3.18 L4.09 -2.99 L3.23 -2.81 L2.37 -2.62 L2.43 -2.18 L3.30 -2.19 L4.18 -2.21 L5.06 -2.22 L5.93 -2.24 L6.81 -2.25 L7.68 -2.27 L6.38 -1.88 L5.87 -0.54 L5.35 0.80 L4.84 2.14 L4.32 3.48 L3.81 4.82 Z', 'M4.24 3.76 L4.32 2.41 L4.40 1.07 L4.49 -0.28 L4.57 -1.62 L4.65 -2.96 L3.87 -5.13 L3.15 -4.91 L2.43 -4.69 L1.71 -4.47 L1.00 -4.26 L0.28 -4.04 L-0.44 -3.82 L-0.36 -3.38 L0.39 -3.43 L1.14 -3.48 L1.89 -3.53 L2.63 -3.58 L3.38 -3.63 L4.13 -3.67 L3.02 -3.17 L2.77 -1.85 L2.51 -0.52 L2.26 0.80 L2.01 2.12 L1.76 3.44 Z'];
const PIVOT = [[0.42, 4.77], [5.65, 6.72], [4.62, 5.12], [3.78, 3.81]];
const ASSE = [-157.8, -71.4, -79.9, -93.6];
const RAGGIO = { ox: 11, oy: 25, ampiezza: 49, opacita: 0.36, sfumatura: 100 };
const LAMA_R = { rotCorpo: 14, rotFaccia: -30, corpo: [-3.8, -3.2], faccia: [14.6, -0.3], perno: [-4.3, 39.5] };
const K = 1.35;
const INK = '#0e0e0f';
const BONE = '#f5f3ec';

const FINGER_N = 4;
const EXTEND_STAGGER = 70;
const EXTEND_DUR = 320;
const CLOSE_STAGGER = 50;
const CLOSE_DUR = 320;
const EXTEND_SPAN = EXTEND_STAGGER * (FINGER_N - 1) + EXTEND_DUR;
const CLOSE_SPAN = CLOSE_STAGGER * (FINGER_N - 1) + CLOSE_DUR;

const NUM = (d) => d.match(/-?\d+(?:\.\d+)?/g).map(Number);
const NE = DITA_ESTESA.map(NUM);
const NC = DITA_CHIUSA.map(NUM);
const UAX = ASSE.map((a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
const LUM = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const EASE = (x) => 1 - Math.pow(1 - x, 3);
const CLAMP01 = (x) => Math.max(0, Math.min(1, x));

function fingerOut(t, i) {
  return EASE(CLAMP01((t - i * EXTEND_STAGGER) / EXTEND_DUR));
}
/** rientro speculare: ultimo dito parte per primo */
function fingerIn(t, i) {
  return EASE(CLAMP01((t - (FINGER_N - 1 - i) * EXTEND_STAGGER) / EXTEND_DUR));
}
function fingerCloseProg(t, i) {
  return EASE(CLAMP01((t - i * CLOSE_STAGGER) / CLOSE_DUR));
}

function ditoPath(i, morph, est) {
  const a = NE[i];
  const b = NC[i];
  const r = PIVOT[i];
  const u = UAX[i];
  const out = [];
  for (let j = 0; j < a.length; j += 2) {
    let x = a[j] + (b[j] - a[j]) * morph;
    let y = a[j + 1] + (b[j + 1] - a[j + 1]) * morph;
    const dx = x - r[0];
    const dy = y - r[1];
    const lu = dx * u[0] + dy * u[1];
    const px = dx - lu * u[0];
    const py = dy - lu * u[1];
    x = r[0] + u[0] * lu * est + px;
    y = r[1] + u[1] * lu * est + py;
    out.push(x.toFixed(2) + ' ' + y.toFixed(2));
  }
  return 'M' + out.join(' L') + ' Z';
}

function hitHot(target) {
  let t = target?.closest?.('[data-hot],[data-drag],button,a,[role="button"]') || null;
  if (t && t.closest('[data-drag]')) t = null;
  return t;
}

/**
 * Finger mode: hidden → extend → open → close → reopen → (open | retract → hidden)
 */
export default function SatzeCursor({
  army,
  inDuel = true,
  neutral = '#c9c5b8',
  size = 1,
  trail = true,
  trailLength = 10,
  trailDurationMs = 400,
  fingers = true,
  enabled = true,
  dragCard = null,
}) {
  const [, tick] = useState(0);
  const st = useRef({
    x: -100, y: -100, vel: 0, traccia: [],
    hot: false, giu: false, presa: null, t0: 0,
    tPresa: 0, lastMove: 0,
    finger: { mode: 'hidden', t0: 0, est0: 0 },
  }).current;
  const raf = useRef(null);
  const loop = useRef(null);
  const trailLenRef = useRef(trailLength);
  const trailDurRef = useRef(trailDurationMs);
  trailLenRef.current = trailLength;
  trailDurRef.current = trailDurationMs;

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    const prev = root.style.cursor;
    root.style.cursor = 'none';
    root.classList.add('satze-custom-cursor');
    document.body?.classList.add('satze-custom-cursor');
    return () => {
      root.style.cursor = prev;
      root.classList.remove('satze-custom-cursor');
      document.body?.classList.remove('satze-custom-cursor');
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const redraw = () => tick((n) => n + 1);

    const fingerBusy = () => {
      const m = st.finger.mode;
      return m === 'extend' || m === 'close' || m === 'reopen' || m === 'retract';
    };

    const estAt = (now) => {
      const f = st.finger;
      const t = now - f.t0;
      if (f.mode === 'hidden') return 0;
      if (f.mode === 'open' || f.mode === 'close' || f.mode === 'reopen') return 1;
      if (f.mode === 'extend') return f.est0 + (1 - f.est0) * fingerOut(t, 0);
      if (f.mode === 'retract') return f.est0 * (1 - fingerIn(t, 0));
      return 0;
    };

    const startExtend = (now) => {
      st.finger = { mode: 'extend', t0: now, est0: estAt(now) };
    };

    const startRetract = (now) => {
      st.finger = { mode: 'retract', t0: now, est0: Math.max(0.03, estAt(now)) };
    };

    const advanceFingers = (now) => {
      const f = st.finger;
      const elapsed = now - f.t0;
      if (f.mode === 'extend' && elapsed >= EXTEND_SPAN) {
        st.finger = { mode: 'open', t0: now, est0: 1 };
      } else if (f.mode === 'close' && elapsed >= CLOSE_SPAN) {
        st.finger = { mode: 'reopen', t0: now, est0: 1 };
      } else if (f.mode === 'reopen' && elapsed >= CLOSE_SPAN) {
        if (st.hot) st.finger = { mode: 'open', t0: now, est0: 1 };
        else startRetract(now);
      } else if (f.mode === 'retract' && elapsed >= EXTEND_SPAN) {
        st.finger = { mode: 'hidden', t0: now, est0: 0 };
      }
    };

    const ageTrail = (now) => {
      const dur = trailDurRef.current;
      st.traccia = st.traccia.filter((p) => now - p.t < dur);
      if (now - st.lastMove > 24) st.vel *= 0.88;
    };

    const anima = () => {
      const now = performance.now();
      advanceFingers(now);
      ageTrail(now);
      redraw();
      const vivo =
        st.presa ||
        st.hot ||
        fingerBusy() ||
        st.traccia.length > 0 ||
        now - st.t0 < 1400;
      loop.current = vivo ? requestAnimationFrame(anima) : null;
    };

    const avvia = () => {
      if (loop.current) return;
      loop.current = requestAnimationFrame(anima);
    };

    const onMove = (e) => {
      const now = performance.now();
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      st.vel = st.vel * 0.72 + Math.hypot(dx, dy) * 0.28;
      st.lastMove = now;
      st.t0 = now;
      st.traccia = [
        { x: e.clientX, y: e.clientY, k: (st.traccia[0]?.k || 0) + 1, t: now },
        ...st.traccia,
      ].slice(0, trailLenRef.current);
      st.x = e.clientX;
      st.y = e.clientY;
      const t = hitHot(e.target);
      if (!!t !== st.hot) {
        st.hot = !!t;
        if (t) {
          if (st.finger.mode === 'hidden' || st.finger.mode === 'retract') startExtend(now);
        } else if (st.finger.mode === 'open' || st.finger.mode === 'extend') {
          startRetract(now);
        }
        // close/reopen: non interrompere; a fine reopen → open o retract
      }
      avvia();
    };

    const onDown = (e) => {
      const d = e.target?.closest?.('[data-drag]') || null;
      const hotEl = d ? null : hitHot(e.target);
      const now = performance.now();
      st.giu = true;
      st.presa = null;
      st.tPresa = 0;
      if (d) {
        st.presa = true;
        st.tPresa = now;
        st.hot = false;
        st.finger = { mode: 'hidden', t0: now, est0: 0 };
      } else if (hotEl) {
        st.hot = true;
        const m = st.finger.mode;
        // chiusura → reopen; se le dita non c'erano, partono già in close da aperte
        if (m !== 'close' && m !== 'reopen') {
          st.finger = { mode: 'close', t0: now, est0: 1 };
        }
      }
      st.t0 = now;
      avvia();
    };

    const onUp = () => {
      st.giu = false;
      st.presa = null;
      st.tPresa = 0;
      avvia();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('mouseup', onUp, true);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mouseup', onUp, true);
      if (raf.current) cancelAnimationFrame(raf.current);
      if (loop.current) cancelAnimationFrame(loop.current);
    };
  }, [enabled, st]);

  if (!enabled) return null;

  const accent = inDuel ? (ARMY_COLORS?.[army]?.accent || BONE) : neutral;
  const luce = LUM(accent) > 0.82 ? INK : BONE;
  const presa = !!st.presa || !!dragCard;
  const premuto = st.giu;
  const corpo = premuto ? { fill: luce } : { fill: accent };
  const faccia = premuto ? { fill: accent } : { fill: luce };
  const bordo = { stroke: INK, strokeWidth: 0.9, strokeLinejoin: 'miter' };
  const now = performance.now();
  const Tpresa = st.tPresa ? now - st.tPresa : (dragCard ? 1e5 : 0);
  const strati = [];
  const trailDur = trailDurationMs;
  const openEase = EASE(Math.min(1, Tpresa / 280));
  const fMode = st.finger.mode;
  const fT = now - st.finger.t0;
  const fEst0 = st.finger.est0 || 0;

  if (trail && st.traccia.length > 1) {
    const forza = Math.min(1, Math.max(0, st.vel - 1) / 14);
    const k = K * size;
    const bx = SAGOMA.coda[0] * k;
    const by = SAGOMA.coda[1] * k;
    const p = st.traccia;
    const seg = [];
    for (let i = 0; i < p.length - 1; i++) {
      const age0 = Math.max(0, 1 - (now - p[i].t) / trailDur);
      const age1 = Math.max(0, 1 - (now - p[i + 1].t) / trailDur);
      const age = (age0 + age1) * 0.5;
      if (age < 0.02) continue;
      const t = i / Math.max(1, p.length - 1);
      const t2 = (i + 1) / Math.max(1, p.length - 1);
      const r = 1 - t;
      const r2 = 1 - t2;
      const opac = r * r * 0.8 * Math.max(forza, 0.35 * age) * age;
      if (opac < 0.015) continue;
      seg.push(
        <polygon
          key={'s' + p[i].k}
          points={[p[i].x, p[i].y, p[i].x + bx * r, p[i].y + by * r, p[i + 1].x + bx * r2, p[i + 1].y + by * r2, p[i + 1].x, p[i + 1].y].join(' ')}
          fill={accent}
          opacity={opac}
        />
      );
    }
    if (seg.length) {
      strati.push(
        <svg key="scia" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', filter: 'blur(1px)' }}>{seg}</svg>
      );
    }
  }

  if (presa) {
    const W = RAGGIO.ampiezza * size;
    const ox = RAGGIO.ox * size;
    const oy = RAGGIO.oy * size;
    const tx = (dragCard?.cx ?? st.x) - st.x;
    const ty = (dragCard?.cy ?? st.y) - st.y;
    const Lfull = Math.max(10, Math.hypot(tx - ox, ty - oy));
    const L = Lfull * Math.max(0.08, openEase);
    const ang = (Math.atan2(ty - oy, tx - ox) * 180) / Math.PI;
    strati.push(
      <div key={st.tPresa ? `fascio-${st.tPresa}` : 'fascio'} style={{ position: 'absolute', zIndex: 3, left: 0, top: 0, transformOrigin: '0 0', transform: `translate3d(${st.x + ox}px,${st.y + oy}px,0) rotate(${ang}deg)` }}>
        <div style={{ position: 'absolute', left: 0, top: -W / 2, width: L, height: W, background: `linear-gradient(90deg,${accent} 0%,transparent ${RAGGIO.sfumatura}%)`, clipPath: 'polygon(0 48%,100% 0,100% 100%,0 52%)', opacity: RAGGIO.opacita * openEase, animation: 'satze-cursor-pulsa 1.1s ease-in-out infinite', filter: 'blur(.4px)' }} />
        <div style={{ position: 'absolute', left: 0, top: -0.5, width: L, height: 1, background: `linear-gradient(90deg,${accent},transparent)`, opacity: 0.85 * openEase }} />
      </div>
    );
  }

  let lama;
  if (presa) {
    const ce = openEase;
    const P = LAMA_R.perno;
    const tr = (rot, off) => `translate(${off[0] * ce} ${off[1] * ce}) rotate(${rot * ce} ${P[0]} ${P[1]})`;
    lama = (
      <g transform={`scale(${K})`}>
        <g transform={tr(LAMA_R.rotCorpo, LAMA_R.corpo)}>
          <path d={`${SAGOMA.p} ${SAGOMA.f}`} fillRule="evenodd" {...corpo} {...bordo} />
        </g>
        <g transform={tr(LAMA_R.rotFaccia, LAMA_R.faccia)}>
          <path d={SAGOMA.f} {...faccia} {...bordo} />
        </g>
      </g>
    );
  } else {
    const dita = [];
    const showDita = fingers && fMode !== 'hidden';
    if (showDita) {
      for (let i = 0; i < DITA_ESTESA.length; i++) {
        let est = 1;
        let morph = 0;
        if (fMode === 'extend') {
          est = Math.max(0.03, fEst0 + (1 - fEst0) * fingerOut(fT, i));
          morph = 0;
        } else if (fMode === 'open') {
          est = 1;
          morph = 0;
        } else if (fMode === 'close') {
          est = 1;
          morph = fingerCloseProg(fT, i);
        } else if (fMode === 'reopen') {
          est = 1;
          morph = 1 - fingerCloseProg(fT, i);
        } else if (fMode === 'retract') {
          est = Math.max(0.03, fEst0 * (1 - fingerIn(fT, i)));
          morph = 0;
        }
        dita.push(
          <path key={'f' + i} d={ditoPath(i, morph, est)} fill={accent} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke" />
        );
      }
    }
    lama = (
      <g transform={`scale(${K})`}>
        {dita}
        <path d={SAGOMA.p} {...corpo} {...bordo} />
        <path d={SAGOMA.f} {...faccia} {...bordo} />
      </g>
    );
  }

  strati.push(
    <div key="punta" style={{ position: 'absolute', zIndex: presa ? 4 : 1, left: 0, top: 0, transformOrigin: '0 0', transform: `translate3d(${st.x}px,${st.y}px,0) scale(${size})`, filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.5))' }}>
      <div style={{ transformOrigin: '0 0', transition: 'transform .1s cubic-bezier(.4,0,.2,1)', transform: presa ? 'none' : premuto ? 'translate(1.5px,2px) scale(.96)' : 'none' }}>
        <svg width={40 * K} height={48 * K} viewBox="0 0 40 48" style={{ display: 'block', overflow: 'visible' }}>{lama}</svg>
      </div>
    </div>
  );

  return (
    <div className="satze-cursor-root" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483000 }}>
      <style>{'@keyframes satze-cursor-pulsa{0%,100%{opacity:.34}50%{opacity:.58}}'}</style>
      {strati}
    </div>
  );
}
