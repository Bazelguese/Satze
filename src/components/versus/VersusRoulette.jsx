// ============================================================
// VersusRoulette.jsx — la ruota delle armate che sceglie l'avversario
// ============================================================
// Nella metà nemica del VS, ancora al buio: le armate girano su una ruota
// mentre il duello si carica; con `stopping` la ruota rallenta e si ferma
// con l'armata avversaria sotto la lancetta (a destra, verso il centro).
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';

const SPIN_DEG_PER_MS = 0.6;
export const ROULETTE_STOP_MS = 1150;
const RADIUS = 300;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * @param {{ armies: string[], target: string|null, stopping: boolean, leaving: boolean }} props
 */
export function VersusRoulette({ armies, target, stopping, leaving }) {
  const ringRef = useRef(null);
  const angleRef = useRef(0);
  const [current, setCurrent] = useState(null);
  const [landed, setLanded] = useState(false);
  const step = 360 / Math.max(1, armies.length);
  const targetIdx = Math.max(0, armies.indexOf(target));
  const stoppingRef = useRef(stopping);
  stoppingRef.current = stopping;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let stopFrom = null;
    let stopTo = 0;
    let stopAt = 0;
    let lastIdx = -1;
    const frame = (now) => {
      const dt = now - last;
      last = now;
      let a = angleRef.current;
      if (stoppingRef.current && stopFrom == null) {
        // arrivo: l'armata bersaglio sotto la lancetta (angolo 0), almeno un giro e mezzo più avanti
        stopFrom = a;
        stopAt = now;
        const want = -targetIdx * step;
        stopTo = want + 360 * Math.ceil((a + 540 - want) / 360);
      }
      if (stopFrom != null) {
        const t = Math.min(1, (now - stopAt) / ROULETTE_STOP_MS);
        a = stopFrom + (stopTo - stopFrom) * easeOutCubic(t);
        if (t >= 1) setLanded(true);
      } else {
        a += SPIN_DEG_PER_MS * dt;
      }
      angleRef.current = a;
      const el = ringRef.current;
      if (el) el.style.setProperty('--rot', `${a.toFixed(2)}deg`);
      // armata sotto la lancetta: quella con angolo più vicino a 0
      const idx = ((Math.round(-a / step) % armies.length) + armies.length) % armies.length;
      if (idx !== lastIdx) {
        lastIdx = idx;
        setCurrent(idx);
      }
      if (!(stopFrom != null && now - stopAt >= ROULETTE_STOP_MS)) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curArmy = current == null ? null : armies[current];
  const curAccent = (curArmy && ARMY_COLORS[curArmy]?.accent) || '#f5f3eb';

  return (
    <div
      className={`vsr${landed ? ' is-landed' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ '--cur': curAccent }}
      aria-hidden="true"
    >
      <div className="vsr-wheel">
        <div className="vsr-ring" ref={ringRef}>
          {armies.map((army, i) => (
            <div
              key={army}
              className={`vsr-slot${i === current ? ' on' : ''}`}
              style={{ '--a': `${i * step}deg`, '--c': ARMY_COLORS[army]?.accent || '#94a3b8', '--r': `${RADIUS}px` }}
            >
              <span className="vsr-chip">
                {ARMY_ICONS[army] ? <img src={ARMY_ICONS[army]} alt="" draggable={false} /> : null}
              </span>
            </div>
          ))}
        </div>
        <div className="vsr-hub">
          <span className="vsr-hub-eye">{landed ? 'AVVERSARIO' : 'SORTEGGIO'}</span>
          <span className="vsr-hub-name" key={curArmy}>{curArmy}</span>
        </div>
        <div className="vsr-pointer" />
      </div>
      <VersusRouletteStyles />
    </div>
  );
}

function VersusRouletteStyles() {
  return (
    <style>{`
      .vsr {
        position: absolute; left: 0; top: 0; bottom: 0; width: 50%; z-index: 6; pointer-events: none;
        display: grid; place-items: center;
        background: radial-gradient(circle, color-mix(in srgb, var(--cur) 22%, transparent) 1.4px, transparent 1.9px) 0 0 / 12px 12px;
        -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0 360px, transparent 560px);
        mask-image: radial-gradient(circle at 50% 50%, #000 0 360px, transparent 560px);
        animation: vsr-in .45s cubic-bezier(.2,1,.3,1) both;
        transition: opacity .35s ease, transform .35s cubic-bezier(.5,0,.8,.4);
        font-family: 'Chakra Petch', sans-serif; color: #f5f3eb;
      }
      .vsr.is-leaving { opacity: 0; transform: scale(1.15); }
      @keyframes vsr-in { from { opacity: 0; transform: scale(.85) rotate(-20deg); } }
      .vsr-wheel { position: relative; width: ${RADIUS * 2 + 140}px; height: ${RADIUS * 2 + 140}px; }
      .vsr-ring {
        position: absolute; inset: 0; border-radius: 50%;
        transform: rotate(var(--rot, 0deg));
      }
      .vsr-ring::before {
        content: ''; position: absolute; inset: 70px; border-radius: 50%;
        border: 3px solid rgba(245,243,235,0.18);
        box-shadow: 0 0 0 26px rgba(5,5,7,0.6), 0 0 0 28px rgba(245,243,235,0.08);
      }
      .vsr-slot {
        position: absolute; left: 50%; top: 50%; width: 0; height: 0;
        transform: rotate(var(--a)) translateX(var(--r));
      }
      .vsr-chip {
        position: absolute; left: -46px; top: -46px; width: 92px; height: 92px;
        display: grid; place-items: center; background: #050507;
        clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);
        box-shadow: inset 0 0 0 3px var(--c);
        /* sempre dritta mentre la ruota gira */
        transform: rotate(calc(-1 * var(--a))) rotate(calc(-1 * var(--rot, 0deg)));
        transition: background .12s;
      }
      .vsr-chip img { width: 62px; height: 62px; object-fit: contain; }
      .vsr-slot.on .vsr-chip { background: var(--c); box-shadow: 6px 6px 0 #f5f3eb; }
      .vsr.is-landed .vsr-slot.on .vsr-chip { animation: vsr-pop .5s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-pop { 50% { scale: 1.35; } }

      .vsr-hub {
        position: absolute; left: 50%; top: 50%; width: 360px; transform: translate(-50%, -50%) rotate(-4deg);
        display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
      }
      .vsr-hub-eye {
        background: #f5f3eb; color: #050507; font-weight: 700; font-size: 15px; letter-spacing: 0.3em;
        padding: 3px 14px; transform: skewX(-14deg);
      }
      .vsr-hub-name {
        font-weight: 700; font-style: italic; font-size: 40px; line-height: 1; text-transform: uppercase;
        text-shadow: 4px 4px 0 var(--cur), 8px 8px 0 #050507; min-height: 1em;
      }
      .vsr.is-landed .vsr-hub-name { animation: vsr-pop .5s cubic-bezier(.2,1.6,.4,1) both; }

      /* lancetta a destra: punta verso la ruota, dal lato del centro dello schermo */
      .vsr-pointer {
        position: absolute; right: -8px; top: 50%; width: 64px; height: 56px; margin-top: -28px;
        background: #f5f3eb; clip-path: polygon(100% 0, 0 50%, 100% 100%, 72% 50%);
        filter: drop-shadow(-4px 4px 0 #050507);
      }
      .vsr.is-landed .vsr-pointer { background: var(--cur); }

      @media (prefers-reduced-motion: reduce) {
        .vsr { animation: none; }
      }
    `}</style>
  );
}
