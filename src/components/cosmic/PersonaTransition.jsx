// ============================================================
// PersonaTransition.jsx — cortina tra le schermate del menù, in stile Persona
// ============================================================
// Quattro "aspetti" della stessa cortina, tutti sullo stesso orologio:
//   0 → COVER_MS     la cortina copre lo schermo (lo scambio avviene sotto)
//   COVER → REVEAL   cortina piena con il nome della schermata
//   REVEAL_MS → END  la cortina si ritira e lascia vedere la nuova schermata
// Il colore viene dalla voce di menù scelta; `dir` = 'back' rovescia il verso.
// ============================================================

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './persona-transitions.css';

export const TRANSITION_LOOKS = ['lastra', 'macchia', 'ritaglio', 'retino'];

export const PTR_COVER_MS = 300;
export const PTR_REVEAL_MS = 520;
export const PTR_END_MS = 900;

const W = 1920;
const H = 1080;
const VOID = '#09080d';
const CREAM = '#f5f3eb';

function rnd(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Da coordinate dello schermo a quelle del canvas 1920×1080 (il gioco è scalato). */
function toCanvas(origin, box) {
  if (!origin || !box) return null;
  const r = box.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: ((origin.x - r.left) * W) / r.width, y: ((origin.y - r.top) * H) / r.height };
}

function Title({ label, kicker, className = '' }) {
  if (!label) return null;
  return (
    <div className={`ptr-title ${className}`} aria-hidden="true">
      {kicker ? <span className="k">{kicker}</span> : null}
      <b className={label.length > 16 ? 'long' : ''}>{label}</b>
    </div>
  );
}

// ---------- A · Lastra: la lastra inclinata della scelta armata ----------
function LookLastra({ label, kicker }) {
  return (
    <>
      <div className="ptrA-slab" />
      {label ? <div className="ptrA-echo" aria-hidden="true">{label}</div> : null}
      <Title label={label} kicker={kicker} className="ptrA-title" />
    </>
  );
}

// ---------- B · Macchia: la macchia del menù invade lo schermo ----------
function makeSplash(seed) {
  const n = 30 + Math.floor(rnd(seed) * 8);
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const spike = rnd(seed + 10 + i) > 0.86;
    const r = spike ? 1.06 + rnd(seed + 40 + i) * 0.2 : 0.86 + rnd(seed + 80 + i) * 0.14;
    pts.push([150 + Math.cos(a) * 146 * r, 90 + Math.sin(a) * 80 * r]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  let d = `M ${mid(pts[n - 1], pts[0]).map(f).join(' ')}`;
  for (let i = 0; i < n; i += 1) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d;
}

function Blob({ d, x, y, rot, className }) {
  return (
    <div className={`ptrB-blob ${className}`} style={{ left: x, top: y, '--r': `${rot}deg` }}>
      <svg viewBox="0 0 300 180" preserveAspectRatio="none">
        <path d={d} />
      </svg>
    </div>
  );
}

function LookMacchia({ label, kicker, origin, dir, seed }) {
  const shapes = useMemo(() => [makeSplash(seed), makeSplash(seed + 7), makeSplash(seed + 13), makeSplash(seed + 21)], [seed]);
  const from = origin ?? (dir === 'back' ? { x: 360, y: 540 } : { x: 1500, y: 560 });
  // la macchia si ritira verso l'angolo opposto a quello da cui è partita
  const to = { x: from.x > W / 2 ? 260 : 1660, y: from.y > H / 2 ? 180 : 900 };
  const rot = -6 + rnd(seed + 3) * 10;
  return (
    <>
      <Blob d={shapes[0]} x={from.x} y={from.y} rot={rot} className="ptrB-grow ptrB-acc" />
      <Blob d={shapes[1]} x={from.x} y={from.y} rot={rot + 8} className="ptrB-grow ptrB-void" />
      <Blob d={shapes[2]} x={to.x} y={to.y} rot={rot} className="ptrB-shrink ptrB-acc" />
      <Blob d={shapes[3]} x={to.x} y={to.y} rot={rot - 6} className="ptrB-shrink ptrB-void" />
      <Title label={label} kicker={kicker} className="ptrB-title" />
    </>
  );
}

// ---------- C · Ritaglio: strisce tagliate e lettere da biglietto ----------
const STRIPS = [
  { c: VOID, h: 20 },
  { c: 'var(--acc)', h: 7 },
  { c: VOID, h: 31 },
  { c: CREAM, h: 3 },
  { c: VOID, h: 27 },
  { c: 'var(--acc)', h: 12 },
];
const LETTER_STYLES = ['l-cream', 'l-void', 'l-acc', 'l-cream', 'l-outline', 'l-void'];

function LookRitaglio({ label, kicker, seed }) {
  const letters = useMemo(
    () =>
      [...(label || '')].map((ch, i) => ({
        ch,
        cls: ch === ' ' ? 'l-gap' : LETTER_STYLES[Math.floor(rnd(seed + i * 3) * LETTER_STYLES.length)],
        rot: (rnd(seed + i * 5) - 0.5) * 14,
        dy: (rnd(seed + i * 7) - 0.5) * 18,
        big: rnd(seed + i * 11) > 0.72,
        serif: rnd(seed + i * 13) > 0.6,
      })),
    [label, seed]
  );
  return (
    <>
      <div className="ptrC-strips">
        {STRIPS.map((s, i) => (
          <span key={i} style={{ background: s.c, flexGrow: s.h, '--i': i, '--s': i % 2 ? 1 : -1 }} />
        ))}
      </div>
      {label ? (
        <div className="ptrC-title" aria-hidden="true">
          {kicker ? <span className="k">{kicker}</span> : null}
          <div className={`w ${letters.length > 16 ? 'long' : ''}`}>
            {letters.map((l, i) => (
              <i
                key={i}
                className={`${l.cls}${l.big ? ' big' : ''}${l.serif ? ' serif' : ''}`}
                style={{ '--rot': `${l.rot.toFixed(1)}deg`, '--dy': `${l.dy.toFixed(0)}px`, '--i': i }}
              >
                {l.ch}
              </i>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------- D · Retino: un'onda di punti che riempie e svuota ----------
function LookRetino({ label, kicker, origin, dir, accent, lite }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return undefined;
    const step = lite ? 36 : 26;
    const rMax = step * 0.74;
    const from = origin ?? (dir === 'back' ? { x: 0, y: H } : { x: W, y: 0 });
    const far = Math.max(
      Math.hypot(from.x, from.y),
      Math.hypot(W - from.x, from.y),
      Math.hypot(from.x, H - from.y),
      Math.hypot(W - from.x, H - from.y)
    );
    const dots = [];
    for (let y = step / 2; y < H + step; y += step) {
      const odd = Math.round(y / step) % 2;
      for (let x = odd ? step : step / 2; x < W + step; x += step) {
        dots.push([x, y, Math.hypot(x - from.x, y - from.y) / far]);
      }
    }
    const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) * (1 - t));
    // fronte d'onda: ogni punto cresce in GROW ms, il ritardo dipende dalla distanza
    const SPREAD_IN = 170;
    const GROW = 120;
    const SPREAD_OUT = 210;
    const SHRINK = 150;
    const start = performance.now();
    let raf = 0;
    const draw = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      const layer = (color, lag) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < dots.length; i += 1) {
          const [x, y, d] = dots[i];
          let k;
          if (t < PTR_REVEAL_MS) k = ease((t - lag - d * SPREAD_IN) / GROW);
          else k = 1 - ease((t - PTR_REVEAL_MS - (lag ? 0 : 50) - d * SPREAD_OUT) / SHRINK);
          if (k <= 0.02) continue;
          const r = rMax * k;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
      };
      layer(accent, 0);
      layer(VOID, 45);
      if (t < PTR_END_MS) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [origin, dir, accent, lite]);
  return (
    <>
      <canvas ref={canvasRef} className="ptrD-canvas" width={W} height={H} />
      <Title label={label} kicker={kicker} className="ptrD-title" />
    </>
  );
}

/**
 * Cortina disegnata sopra la scena. `run` arriva dal provider:
 * { look, label, kicker, accent, dir, origin, lite, runId }.
 */
export function PersonaTransitionOverlay({ run }) {
  const boxRef = useRef(null);
  // undefined = non ancora misurato (si misura prima del primo disegno)
  const [origin, setOrigin] = useState(undefined);

  useLayoutEffect(() => {
    setOrigin(toCanvas(run.origin, boxRef.current));
  }, [run.origin]);

  const common = {
    label: run.label,
    kicker: run.kicker,
    dir: run.dir,
    seed: (run.runId * 37) % 1000,
    accent: run.accent,
    lite: run.lite,
  };

  let body = null;
  if (origin === undefined) body = null;
  else if (run.look === 'macchia') body = <LookMacchia {...common} origin={origin} />;
  else if (run.look === 'ritaglio') body = <LookRitaglio {...common} />;
  else if (run.look === 'retino') body = <LookRetino {...common} origin={origin} />;
  else body = <LookLastra {...common} />;

  return (
    <div
      ref={boxRef}
      className={`ptr ptr--${run.look} ptr--${run.dir === 'back' ? 'back' : 'fwd'}${run.lite ? ' ptr--lite' : ''}`}
      style={{ '--acc': run.accent, '--d': run.dir === 'back' ? -1 : 1 }}
    >
      {body}
    </div>
  );
}
