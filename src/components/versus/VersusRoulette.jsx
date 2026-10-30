// ============================================================
// VersusRoulette.jsx — il sorteggio dell'avversario nella metà nemica del VS
// ============================================================
// Mentre il duello si carica la metà nemica, ancora al buio, si accende un
// rullo da slot: fasce inclinate, una per armata (arte, icona, nome, motto),
// che scorrono e con `stopping` rallentano fino a fermarsi sull'avversario.
// Il movimento: `pos` avanza in "voci" (armate); la fermata è una curva che
// parte alla velocità corrente e arriva ferma su un intero.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS, ARMY_GIFS } from '../../data/armies.js';
import { ARMY_LORE } from '../menu/cosmic/armyLore.js';
import { playSound } from '../../audio/soundBus';
import { UI_SOUND } from '../../audio/soundCatalog';

export const ROULETTE_STOP_MS = 2600;

/** Voci al secondo durante il giro. */
const SPEED = 2.4;
/** Il rullo resta fermo mentre si accende, poi prende velocità in RAMP_MS. */
const POWER_ON_MS = 650;
const RAMP_MS = 1200;

function hermiteStop(t, v0T, d) {
  // posizione relativa: velocità iniziale v0, finale 0, distanza d
  const t2 = t * t;
  const t3 = t2 * t;
  return v0T * (t3 - 2 * t2 + t) + d * (-2 * t3 + 3 * t2);
}

/**
 * @param {{ armies: string[], target: string|null, stopping: boolean, leaving: boolean }} props
 */
export function VersusRoulette({ armies, target, stopping, leaving }) {
  const n = Math.max(1, armies.length);
  const targetIdx = Math.max(0, armies.indexOf(target));
  const rootRef = useRef(null);
  const stoppingRef = useRef(stopping);
  stoppingRef.current = stopping;
  const [current, setCurrent] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const speed = SPEED / 1000;
    const t0 = performance.now() + POWER_ON_MS;
    let last = performance.now();
    let pos = 0;
    let stop = null;
    let lastShown = 0;
    let lastTick = 0;
    let raf = 0;
    const ramp = (now) => Math.min(1, Math.max(0, (now - t0) / RAMP_MS)) ** 2;
    const frame = (now) => {
      const dt = now - last;
      last = now;
      if (stoppingRef.current && !stop) {
        const v0T = speed * ramp(now) * ROULETTE_STOP_MS;
        // prima posizione intera, almeno a metà della corsa "naturale", con l'avversario al centro
        let p1 = Math.ceil(pos + Math.max(1, v0T * 0.5));
        while (((p1 % n) + n) % n !== targetIdx) p1 += 1;
        stop = { at: now, p0: pos, v0T, d: p1 - pos };
      }
      if (stop) {
        const t = Math.min(1, (now - stop.at) / ROULETTE_STOP_MS);
        pos = stop.p0 + hermiteStop(t, stop.v0T, stop.d);
        if (t >= 1) {
          pos = stop.p0 + stop.d;
          setLanded(true);
        }
      } else {
        pos += speed * ramp(now) * dt;
      }
      // giro dopo giro la scena è identica: basta la posizione dentro un giro
      rootRef.current?.style.setProperty('--pos', (((pos % n) + n) % n).toFixed(4));
      const shown = Math.round(pos);
      if (shown !== lastShown) {
        lastShown = shown;
        setCurrent(((shown % n) + n) % n);
        if (now - lastTick > 70) {
          lastTick = now;
          playSound(UI_SOUND.NAVIGATE);
        }
      }
      if (!(stop && now - stop.at >= ROULETTE_STOP_MS)) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curArmy = armies[current];
  const curAccent = ARMY_COLORS[curArmy]?.accent || '#f5f3eb';

  return (
    <div
      ref={rootRef}
      className={`vsr${landed ? ' is-landed' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ '--cur': curAccent, '--n': n }}
      aria-hidden="true"
    >
      <div className="vsr-reel-box">
        <div className="vsr-reel">
          {/* tre giri di fasce: la finestra mostra sempre quella al centro e le vicine */}
          {[-1, 0, 1].flatMap((lap) =>
            armies.map((army, i) => (
              <div
                key={`${lap}-${army}`}
                className={`vsr-band${i === current ? ' on' : ''}`}
                style={{
                  '--i': lap * n + i,
                  // accensione: dal centro verso fuori, una fascia dopo l'altra
                  '--on': `${Math.min(Math.abs(lap * n + i), Math.abs(lap * n + i - n)) * 70}ms`,
                  '--c': ARMY_COLORS[army]?.accent || '#94a3b8',
                }}
              >
                {ARMY_GIFS[army] ? <span className="vsr-art" style={{ backgroundImage: `url('${ARMY_GIFS[army]}')` }} /> : <span className="vsr-art" />}
                <span className="vsr-band-tint" />
                {ARMY_ICONS[army] ? <img className="vsr-band-icon" src={ARMY_ICONS[army]} alt="" draggable={false} /> : null}
                <span className="vsr-band-txt">
                  <b>{army}</b>
                  <small>{ARMY_LORE[army]?.motto || ''}</small>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="vsr-reel-window" />
      </div>

      <div className="vsr-caption">
        <span className="vsr-eye">{landed ? 'IL TUO AVVERSARIO' : 'SORTEGGIO DELL’AVVERSARIO'}</span>
        <span className="vsr-name" key={curArmy}>{curArmy}</span>
      </div>
      <VersusRouletteStyles />
    </div>
  );
}

function VersusRouletteStyles() {
  return (
    <style>{`
      /* la metà sinistra del VS: stesso taglio diagonale della .vsx-half--l */
      .vsr {
        position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        clip-path: polygon(0 0, 56% 0, 44% 100%, 0 100%);
        background: #050507;
        font-family: 'Chakra Petch', sans-serif; color: #f5f3eb;
        transition: opacity .4s ease .5s;
      }
      .vsr.is-leaving { opacity: 0; }
      .vsr * { box-sizing: border-box; }
      .vsr-art { position: absolute; inset: 0; background: #111116 center / cover no-repeat; }

      /* ---------- rullo ---------- */
      .vsr-reel-box {
        position: absolute; inset: 0;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
      }
      .vsr-reel {
        --h: 250px; position: absolute; left: -60px; right: 40%; top: 540px; transform: skewY(-4deg);
        /* il rullo entra da sinistra mentre si accende */
        animation: vsr-reel-in .7s cubic-bezier(.2,.9,.25,1) both;
      }
      @keyframes vsr-reel-in { from { transform: skewY(-4deg) translateX(-38%); } }
      .vsr-band {
        position: absolute; left: 0; right: 0; height: calc(var(--h) - 14px);
        top: calc((var(--i) - var(--pos, 0)) * var(--h) - var(--h) / 2 + 7px);
        overflow: hidden; box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
        /* accensione da insegna al neon: sfarfalla e poi resta accesa */
        animation: vsr-band-on .55s steps(1, end) var(--on) both, vsr-band-glow .9s ease-out var(--on) both;
      }
      @keyframes vsr-band-on {
        0% { opacity: 0; }
        12% { opacity: .85; }
        22% { opacity: .1; }
        34% { opacity: 1; }
        46% { opacity: .35; }
        58%, 100% { opacity: 1; }
      }
      @keyframes vsr-band-glow { from { filter: brightness(2.2) saturate(1.4); } }
      .vsr-band .vsr-art { filter: brightness(0.4) saturate(1.1); }
      .vsr-band-tint { position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, transparent) 0%, transparent 55%); }
      .vsr-band::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--c); z-index: 2; }
      .vsr-band-icon { position: absolute; left: 90px; top: 50%; width: 120px; height: 120px; margin-top: -60px; object-fit: contain; z-index: 2; filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-band-txt { position: absolute; left: 240px; right: 40px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; flex-direction: column; gap: 8px; }
      .vsr-band-txt b { font-weight: 700; font-style: italic; font-size: 54px; line-height: 0.95; text-transform: uppercase; text-shadow: 4px 4px 0 #050507; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band-txt small { font-weight: 600; font-size: 18px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band.on .vsr-art { filter: brightness(0.75) saturate(1.2); }
      .vsr-band.on .vsr-band-txt b { color: var(--c); }

      /* finestra: i due bordi si tracciano da sinistra, poi la lancetta scatta dentro */
      .vsr-reel-window {
        position: absolute; left: -20px; right: 38%; top: 540px; height: 266px; margin-top: -133px; z-index: 6;
        transform: skewY(-4deg);
        box-shadow: 0 0 40px color-mix(in srgb, var(--cur) 50%, transparent);
        animation: vsr-fade .5s ease .35s both;
      }
      .vsr-reel-window::before {
        content: ''; position: absolute; inset: 0;
        border-top: 6px solid #f5f3eb; border-bottom: 6px solid #f5f3eb;
        transform-origin: left center; animation: vsr-draw .55s cubic-bezier(.6,0,.2,1) .3s both;
      }
      @keyframes vsr-draw { from { transform: scaleX(0); } }
      @keyframes vsr-fade { from { opacity: 0; } }
      .vsr-reel-window::after {
        content: ''; position: absolute; right: -70px; top: 50%; width: 60px; height: 90px; margin-top: -45px;
        background: #f5f3eb; clip-path: polygon(0 50%, 100% 0, 80% 50%, 100% 100%); filter: drop-shadow(5px 5px 0 #050507);
        animation: vsr-pointer-in .4s cubic-bezier(.2,1.6,.4,1) .75s both;
      }
      @keyframes vsr-pointer-in { from { opacity: 0; transform: translateX(60px); } }
      .vsr.is-landed .vsr-reel-window::before { border-color: var(--cur); }
      .vsr.is-landed .vsr-reel-window { animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }

      .vsr-caption {
        position: absolute; left: 60px; bottom: 70px; z-index: 20; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
        transform: rotate(-4deg); transform-origin: left bottom;
        animation: vsr-caption-in .5s cubic-bezier(.2,1,.3,1) .5s both;
      }
      @keyframes vsr-caption-in { from { opacity: 0; transform: rotate(-4deg) translateX(-80px); } }
      .vsr-eye {
        background: #f5f3eb; color: #050507; font-weight: 700; font-size: 16px; letter-spacing: 0.3em;
        padding: 4px 16px; transform: skewX(-14deg);
      }
      .vsr.is-landed .vsr-eye { background: var(--cur); }
      .vsr-name {
        font-weight: 700; font-style: italic; font-size: 64px; line-height: 0.95; text-transform: uppercase; max-width: 720px;
        text-shadow: 5px 5px 0 var(--cur), 10px 10px 0 #050507;
      }
      .vsr.is-landed .vsr-name { animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-pop { 40% { transform: scale(1.12) rotate(-1deg); } }

      @media (prefers-reduced-motion: reduce) {
        .vsr-reel, .vsr-band, .vsr-reel-window, .vsr-reel-window::before, .vsr-reel-window::after, .vsr-caption { animation: none; }
      }
    `}</style>
  );
}
