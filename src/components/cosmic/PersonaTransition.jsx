// ============================================================
// PersonaTransition.jsx — cortina tra le schermate del menù, in stile Persona
// ============================================================
// La lastra inclinata con i bordi che si sfaldano in punti di retino.
// Orologio in millisecondi a tempo 1, tutto moltiplicato per `tempo`:
//   0 → COVER       la cortina copre lo schermo (lo scambio avviene sotto)
//   COVER → REVEAL  cortina piena con il nome della schermata
//   REVEAL → END    la cortina si ritira e lascia vedere la nuova schermata
// Il colore viene dalla voce di menù scelta; `dir` = 'back' rovescia il verso.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import './persona-transitions.css';

const COVER = 300;
const REVEAL = 520;
const END = 900;

/** Tempi della cortina, in ms, per un dato rallentamento (1 = 0,9 s in tutto). */
export function ptrTiming(tempo = 1) {
  return { cover: COVER * tempo, reveal: REVEAL * tempo, end: END * tempo };
}

const W = 1920;
const H = 1080;
const VOID = '#09080d';
/** Inclinazione della lastra (skewX -14deg): le righe "/" del fronte. */
const SLANT = Math.tan((14 * Math.PI) / 180);
/** Larghezza della sfumatura di punti e distacco tra punti colorati e neri. */
const BAND = 380;
const GAP = 150;

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

/**
 * Due strati di punti (colore della voce davanti, nero dietro) con il fronte
 * inclinato come la lastra. Per ogni punto: quanto è cresciuto (0 → 1).
 */
function slabLayers(dir, accent) {
  const uMin = -SLANT * (H / 2);
  const uMax = W + SLANT * (H / 2);
  // coordinata lungo il verso di marcia (avanti: da destra a sinistra)
  const along = dir === 'back' ? (x, y) => x + SLANT * (y - H / 2) : (x, y) => W - (x + SLANT * (y - H / 2));
  const from = W - uMax - BAND - GAP;
  const span = uMax - uMin + 2 * BAND + 2 * GAP;
  const make = (lag) => (x, y, t) => {
    const u = along(x, y);
    if (t < REVEAL) {
      // il fronte avanza: dietro di lui i punti sono pieni
      const front = from + span * easeInOut(t / COVER);
      return (front - lag - u) / BAND;
    }
    const back = from + span * easeInOut((t - REVEAL) / (END - REVEAL - 40));
    return 1 - (back + lag - u) / BAND;
  };
  return [
    { color: accent, size: make(0) },
    { color: VOID, size: make(GAP) },
  ];
}

/**
 * Campo di punti di retino disegnato su canvas, sull'orologio a tempo 1.
 * `t0` è l'avvio della cortina; finché `release.at` è 0 la lastra resta piena
 * (la nuova schermata sta ancora montando), poi si ritira da lì in avanti.
 */
function DotField({ layers, stepPx, tempo, t0, release }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return undefined;
    // punti sfalsati: con raggio 0,74 del passo coprono tutto lo schermo
    const rMax = stepPx * 0.74;
    const dots = [];
    for (let y = stepPx / 2, row = 0; y < H + stepPx; y += stepPx, row += 1) {
      for (let x = row % 2 ? stepPx : stepPx / 2; x < W + stepPx; x += stepPx) dots.push([x, y]);
    }
    const start = t0 ?? performance.now();
    let raf = 0;
    const clock = (now) => {
      const t = (now - start) / tempo;
      if (!release || t < REVEAL) return t;
      if (!release.at) return REVEAL - 1;
      // l'attesa oltre REVEAL slitta in avanti la ritirata
      const held = Math.max(0, release.at - (start + REVEAL * tempo));
      return (now - start - held) / tempo;
    };
    const draw = (now) => {
      const t = clock(now);
      ctx.clearRect(0, 0, W, H);
      for (const layer of layers) {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        for (let i = 0; i < dots.length; i += 1) {
          const [x, y] = dots[i];
          const k = layer.size(x, y, t);
          if (k <= 0.02) continue;
          const r = rMax * Math.min(1, k);
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      if (t < END) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [layers, stepPx, tempo, t0, release]);
  return <canvas ref={canvasRef} className="ptr-dots" width={W} height={H} />;
}

/**
 * Cortina disegnata sopra la scena. `run` arriva dal provider:
 * { tempo, label, kicker, accent, dir, lite, runId }.
 */
export function PersonaTransitionOverlay({ run }) {
  const tempo = run.tempo ?? 1;
  const [layers] = useState(() => slabLayers(run.dir, run.accent));
  return (
    <div
      className={`ptr ptr--${run.dir === 'back' ? 'back' : 'fwd'}`}
      style={{ '--acc': run.accent, '--d': run.dir === 'back' ? -1 : 1, '--k': tempo }}
    >
      <DotField layers={layers} stepPx={run.lite ? 34 : 24} tempo={tempo} t0={run.t0} release={run.release} />
      {run.label ? (
        <>
          <div className="ptr-echo" aria-hidden="true">{run.label}</div>
          <div className="ptr-title" aria-hidden="true">
            {run.kicker ? <span className="k">{run.kicker}</span> : null}
            <b className={run.label.length > 16 ? 'long' : ''}>{run.label}</b>
          </div>
        </>
      ) : null}
    </div>
  );
}
