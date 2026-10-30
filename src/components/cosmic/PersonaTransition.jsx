// ============================================================
// PersonaTransition.jsx — cortina tra le schermate del menù, in stile Persona
// ============================================================
// Lastra inclinata e retino, da soli o insieme, sullo stesso orologio
// (in millisecondi a tempo 1, tutti moltiplicati per `tempo`):
//   0 → COVER       la cortina copre lo schermo (lo scambio avviene sotto)
//   COVER → REVEAL  cortina piena con il nome della schermata
//   REVEAL → END    la cortina si ritira e lascia vedere la nuova schermata
// Il colore viene dalla voce di menù scelta; `dir` = 'back' rovescia il verso.
// ============================================================

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './persona-transitions.css';

export const TRANSITION_LOOKS = ['onda', 'lastraRetino', 'lastra', 'retino'];

const COVER = 300;
const REVEAL = 520;
const END = 900;

/** Tempi della cortina, in ms, per un dato rallentamento (1 = il più svelto). */
export function ptrTiming(tempo = 1) {
  return { cover: COVER * tempo, reveal: REVEAL * tempo, end: END * tempo };
}

const W = 1920;
const H = 1080;
const VOID = '#09080d';
/** Inclinazione della lastra (skewX -14deg): le righe "/" del fronte. */
const SLANT = Math.tan((14 * Math.PI) / 180);

/** Da coordinate dello schermo a quelle del canvas 1920×1080 (il gioco è scalato). */
function toCanvas(origin, box) {
  if (!origin || !box) return null;
  const r = box.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: ((origin.x - r.left) * W) / r.width, y: ((origin.y - r.top) * H) / r.height };
}

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - clamp01(t)) ** 2;
const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

function Title({ label, kicker }) {
  if (!label) return null;
  return (
    <>
      <div className="ptr-echo" aria-hidden="true">{label}</div>
      <div className="ptr-title" aria-hidden="true">
        {kicker ? <span className="k">{kicker}</span> : null}
        <b className={label.length > 16 ? 'long' : ''}>{label}</b>
      </div>
    </>
  );
}

/**
 * Campo di punti di retino disegnato su canvas. `size(x, y, t)` restituisce,
 * per ogni strato, quanto è cresciuto il punto (0 → 1) al tempo t in ms.
 */
function DotField({ layers, stepPx, fill, tempo }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return undefined;
    const rMax = stepPx * fill;
    const dots = [];
    for (let y = stepPx / 2, row = 0; y < H + stepPx; y += stepPx, row += 1) {
      for (let x = row % 2 ? stepPx : stepPx / 2; x < W + stepPx; x += stepPx) dots.push([x, y]);
    }
    const start = performance.now();
    let raf = 0;
    const draw = (now) => {
      // l'orologio dei punti è quello a tempo 1: così le formule restano leggibili
      const t = (now - start) / tempo;
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
  }, [layers, stepPx, fill, tempo]);
  return <canvas ref={canvasRef} className="ptr-dots" width={W} height={H} />;
}

/**
 * Onda radiale dalla voce scelta: cresce entro la copertura, si svuota da
 * `outAt` (ms) con la stessa onda; finisce comunque entro END.
 */
function radialLayers({ origin, dir, accent, withVoid, outAt }) {
  const from = origin ?? (dir === 'back' ? { x: 0, y: H } : { x: W, y: 0 });
  const far = Math.max(
    Math.hypot(from.x, from.y),
    Math.hypot(W - from.x, from.y),
    Math.hypot(from.x, H - from.y),
    Math.hypot(W - from.x, H - from.y)
  );
  const outSpan = END - outAt - 50;
  const make = (inLag, outLag) => (x, y, t) => {
    const d = Math.hypot(x - from.x, y - from.y) / far;
    if (t < outAt + outLag) return easeOut((t - inLag - d * 170) / 120);
    return 1 - easeOut((t - outAt - outLag - d * outSpan * 0.6) / (outSpan * 0.4));
  };
  const layers = [{ color: accent, size: make(0, withVoid ? 50 : 0) }];
  if (withVoid) layers.push({ color: VOID, size: make(45, 0) });
  return layers;
}

/** Fronte inclinato come la lastra: i bordi sono fatti di punti che crescono. */
function slantLayers({ dir, accent }) {
  const BAND = 380;
  const GAP = 150;
  const uMin = -SLANT * (H / 2);
  const uMax = W + SLANT * (H / 2);
  // coordinata lungo il verso di marcia (avanti: da destra a sinistra)
  const along = dir === 'back' ? (x, y) => x + SLANT * (y - H / 2) : (x, y) => W - (x + SLANT * (y - H / 2));
  const lo = W - uMax;
  const hi = W - uMin;
  const make = (lag) => (x, y, t) => {
    const u = along(x, y);
    if (t < REVEAL) {
      // il fronte avanza: dietro di lui i punti sono pieni
      const front = lo - BAND - GAP + (hi - lo + 2 * BAND + 2 * GAP) * easeInOut(t / COVER);
      return (front - lag - u) / BAND;
    }
    const back = lo - BAND - GAP + (hi - lo + 2 * BAND + 2 * GAP) * easeInOut((t - REVEAL) / (END - REVEAL - 40));
    return 1 - (back + lag - u) / BAND;
  };
  return [
    { color: accent, size: make(0) },
    { color: VOID, size: make(GAP) },
  ];
}

function LookLastra({ label, kicker }) {
  return (
    <>
      <div className="ptr-slab" />
      <Title label={label} kicker={kicker} />
    </>
  );
}

function LookRetino({ label, kicker, origin, dir, accent, lite, tempo }) {
  const [layers] = useState(() => radialLayers({ origin, dir, accent, withVoid: true, outAt: REVEAL }));
  return (
    <>
      <DotField layers={layers} stepPx={lite ? 36 : 26} fill={0.74} tempo={tempo} />
      <Title label={label} kicker={kicker} />
    </>
  );
}

/** Onda di retino dalla voce, la lastra arriva sopra; all'uscita la lastra se ne va e i punti si svuotano. */
function LookOnda({ label, kicker, origin, dir, accent, lite, tempo }) {
  const [layers] = useState(() => radialLayers({ origin, dir, accent, withVoid: false, outAt: REVEAL + 120 }));
  return (
    <>
      <DotField layers={layers} stepPx={lite ? 34 : 24} fill={0.36} tempo={tempo} />
      <div className="ptr-slab" />
      <Title label={label} kicker={kicker} />
    </>
  );
}

/** La lastra stessa, con i bordi che sfumano in punti di retino. */
function LookLastraRetino({ label, kicker, dir, accent, lite, tempo }) {
  const [layers] = useState(() => slantLayers({ dir, accent }));
  return (
    <>
      <DotField layers={layers} stepPx={lite ? 34 : 24} fill={0.74} tempo={tempo} />
      <Title label={label} kicker={kicker} />
    </>
  );
}

const LOOKS = { onda: LookOnda, lastraRetino: LookLastraRetino, lastra: LookLastra, retino: LookRetino };

/**
 * Cortina disegnata sopra la scena. `run` arriva dal provider:
 * { look, tempo, label, kicker, accent, dir, origin, lite, runId }.
 */
export function PersonaTransitionOverlay({ run }) {
  const boxRef = useRef(null);
  // undefined = non ancora misurato (si misura prima del primo disegno)
  const [origin, setOrigin] = useState(undefined);

  useLayoutEffect(() => {
    setOrigin(toCanvas(run.origin, boxRef.current));
  }, [run.origin]);

  const Look = LOOKS[run.look] ?? LookOnda;
  const tempo = run.tempo ?? 1;

  return (
    <div
      ref={boxRef}
      className={`ptr ptr--${run.look} ptr--${run.dir === 'back' ? 'back' : 'fwd'}${run.lite ? ' ptr--lite' : ''}`}
      style={{ '--acc': run.accent, '--d': run.dir === 'back' ? -1 : 1, '--k': tempo }}
    >
      {origin !== undefined ? (
        <Look
          label={run.label}
          kicker={run.kicker}
          dir={run.dir}
          accent={run.accent}
          lite={run.lite}
          tempo={tempo}
          origin={origin}
        />
      ) : null}
    </div>
  );
}
