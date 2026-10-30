// ============================================================
// VersusRoulette.jsx — il sorteggio dell'avversario nella metà nemica del VS
// ============================================================
// Mentre il duello si carica la metà nemica, ancora al buio, sorteggia
// l'armata: gira piano, e con `stopping` rallenta fino a fermarsi sull'avversario.
// Tre aspetti da confrontare (variant):
//   ruota   — ruota enorme a spicchi che esce dal bordo sinistro
//   rullo   — fasce orizzontali che scorrono come un rullo da slot
//   griglia — tessere delle armate, una luce salta dall'una all'altra
// Lo stesso movimento per tutte: `pos` avanza in "voci" (armate); la fermata
// è una curva che parte alla velocità corrente e arriva ferma su un intero.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS, ARMY_GIFS } from '../../data/armies.js';
import { ARMY_LORE } from '../menu/cosmic/armyLore.js';
import { playSound } from '../../audio/soundBus';
import { UI_SOUND } from '../../audio/soundCatalog';

export const VS_ROULETTE_VARIANTS = ['ruota', 'rullo', 'griglia'];
export const ROULETTE_STOP_MS = 2600;

/** Voci al secondo durante il giro. */
const SPEED = { ruota: 2.6, rullo: 2.4, griglia: 6 };

/** Spinta iniziale: parte da ferma e prende velocità in questo tempo. */
const RAMP_MS = 700;

function hermiteStop(t, v0T, d) {
  // posizione relativa: velocità iniziale v0, finale 0, distanza d
  const t2 = t * t;
  const t3 = t2 * t;
  return v0T * (t3 - 2 * t2 + t) + d * (-2 * t3 + 3 * t2);
}

function shuffled(n, seed) {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {{ variant?: string, armies: string[], target: string|null, stopping: boolean, leaving: boolean }} props
 */
export function VersusRoulette({ variant = 'ruota', armies, target, stopping, leaving }) {
  const kind = VS_ROULETTE_VARIANTS.includes(variant) ? variant : 'ruota';
  const n = Math.max(1, armies.length);
  // ordine di passaggio: la griglia salta in ordine sparso, ruota e rullo in fila
  const order = useMemo(() => (kind === 'griglia' ? shuffled(n, 7 + n) : Array.from({ length: n }, (_, i) => i)), [kind, n]);
  const targetIdx = Math.max(0, armies.indexOf(target));
  const rootRef = useRef(null);
  const stoppingRef = useRef(stopping);
  stoppingRef.current = stopping;
  const [current, setCurrent] = useState(order[0]);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const speed = SPEED[kind] / 1000;
    const t0 = performance.now();
    let last = t0;
    let pos = 0;
    let stop = null;
    let lastShown = -1;
    let lastTick = 0;
    let raf = 0;
    const frame = (now) => {
      const dt = now - last;
      last = now;
      if (stoppingRef.current && !stop) {
        const v = speed * Math.min(1, (now - t0) / RAMP_MS);
        const v0T = v * ROULETTE_STOP_MS;
        // prima posizione intera, almeno a metà della corsa "naturale", con l'avversario al centro
        let p1 = Math.ceil(pos + v0T * 0.5);
        while (order[((p1 % n) + n) % n] !== targetIdx) p1 += 1;
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
        pos += speed * Math.min(1, (now - t0) / RAMP_MS) * dt;
      }
      // giro dopo giro la scena è identica: basta la posizione dentro un giro
      rootRef.current?.style.setProperty('--pos', (((pos % n) + n) % n).toFixed(4));
      const shown = Math.round(pos);
      if (shown !== lastShown) {
        lastShown = shown;
        setCurrent(order[((shown % n) + n) % n]);
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
      className={`vsr vsr--${kind}${landed ? ' is-landed' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ '--cur': curAccent, '--n': n }}
      aria-hidden="true"
    >
      {kind === 'ruota' && <Wheel armies={armies} current={current} />}
      {kind === 'rullo' && <Reel armies={armies} current={current} />}
      {kind === 'griglia' && <Grid armies={armies} current={current} />}

      <div className="vsr-caption">
        <span className="vsr-eye">{landed ? 'IL TUO AVVERSARIO' : 'SORTEGGIO DELL’AVVERSARIO'}</span>
        <span className="vsr-name" key={curArmy}>{curArmy}</span>
      </div>
      <VersusRouletteStyles />
    </div>
  );
}

function ArmyArt({ army }) {
  const src = ARMY_GIFS[army];
  return src ? <span className="vsr-art" style={{ backgroundImage: `url('${src}')` }} /> : <span className="vsr-art" />;
}

// ---------- A · ruota enorme a spicchi ----------
function Wheel({ armies, current }) {
  const step = 360 / armies.length;
  return (
    <div className="vsr-wheel-box">
      <div className="vsr-wheel">
        {armies.map((army, i) => (
          <div
            key={army}
            className={`vsr-wedge${i === current ? ' on' : ''}`}
            style={{ '--a': `${i * step}deg`, '--c': ARMY_COLORS[army]?.accent || '#94a3b8', '--half': `${step / 2}deg` }}
          >
            <ArmyArt army={army} />
            <span className="vsr-wedge-tint" />
            <span className="vsr-wedge-label">
              {ARMY_ICONS[army] ? <img src={ARMY_ICONS[army]} alt="" draggable={false} /> : null}
              <b>{army}</b>
            </span>
          </div>
        ))}
        <div className="vsr-hub" />
      </div>
      <div className="vsr-wheel-pointer" />
    </div>
  );
}

// ---------- B · rullo da slot ----------
function Reel({ armies, current }) {
  // tre giri di fasce: la finestra mostra sempre quella al centro e le vicine
  return (
    <div className="vsr-reel-box">
      <div className="vsr-reel">
        {[-1, 0, 1].flatMap((lap) =>
          armies.map((army, i) => (
            <div
              key={`${lap}-${army}`}
              className={`vsr-band${i === current ? ' on' : ''}`}
              style={{ '--i': lap * armies.length + i, '--c': ARMY_COLORS[army]?.accent || '#94a3b8' }}
            >
              <ArmyArt army={army} />
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
  );
}

// ---------- C · griglia con la luce che salta ----------
function Grid({ armies, current }) {
  return (
    <div className="vsr-grid">
      {armies.map((army, i) => (
        <div
          key={army}
          className={`vsr-tile${i === current ? ' on' : ''}`}
          style={{ '--c': ARMY_COLORS[army]?.accent || '#94a3b8', '--k': i }}
        >
          <ArmyArt army={army} />
          <span className="vsr-tile-tint" />
          {ARMY_ICONS[army] ? <img className="vsr-tile-icon" src={ARMY_ICONS[army]} alt="" draggable={false} /> : null}
          <b className="vsr-tile-name">{army}</b>
        </div>
      ))}
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
        animation: vsr-in .8s ease both;
        transition: opacity .4s ease .5s;
      }
      .vsr.is-leaving { opacity: 0; }
      @keyframes vsr-in { from { opacity: 0; } }
      .vsr * { box-sizing: border-box; }
      .vsr-art { position: absolute; inset: 0; background: #111116 center / cover no-repeat; }

      .vsr-caption {
        position: absolute; left: 60px; bottom: 70px; z-index: 20; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
        transform: rotate(-4deg); transform-origin: left bottom;
      }
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

      /* ---------- ruota ---------- */
      .vsr-wheel-box { position: absolute; inset: 0; }
      .vsr-wheel {
        --R: 1060px;
        position: absolute; left: calc(-170px - var(--R)); top: calc(540px - var(--R)); width: calc(var(--R) * 2); height: calc(var(--R) * 2);
        border-radius: 50%; overflow: hidden;
        transform: rotate(calc(var(--pos, 0) * -360deg / var(--n)));
        box-shadow: 0 0 0 10px #050507, 0 0 0 16px rgba(245,243,235,0.25);
      }
      .vsr-wedge {
        position: absolute; inset: 0;
        transform: rotate(var(--a));
        /* spicchio verso destra (angolo 0), largo 2·half */
        clip-path: polygon(50% 50%, 100% calc(50% - 50% * tan(var(--half))), 100% calc(50% + 50% * tan(var(--half))));
      }
      .vsr-wedge .vsr-art { left: 50%; top: 22%; bottom: 22%; right: 0; filter: brightness(0.45) saturate(1.1); }
      .vsr-wedge-tint {
        position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent 50%, color-mix(in srgb, var(--c) 30%, transparent) 80%, color-mix(in srgb, var(--c) 55%, transparent) 100%);
        box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
      }
      /* bordo dello spicchio: dal centro verso il cerchio, sul lato superiore */
      .vsr-wedge::after {
        content: ''; position: absolute; left: 50%; top: 50%; width: 50%; height: 4px; margin-top: -2px; background: rgba(245,243,235,0.35);
        transform-origin: 0 50%; transform: rotate(calc(var(--half) * -1));
      }
      .vsr-wedge-label {
        position: absolute; right: 70px; top: 50%; transform: translateY(-50%);
        display: flex; align-items: center; gap: 18px; flex-direction: row-reverse; text-align: right;
      }
      .vsr-wedge-label img { width: 96px; height: 96px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-wedge-label b { font-weight: 700; font-style: italic; font-size: 34px; line-height: 1; text-transform: uppercase; max-width: 300px; text-shadow: 3px 3px 0 #050507; }
      .vsr-wedge.on .vsr-art { filter: brightness(0.8) saturate(1.2); }
      .vsr-wedge.on .vsr-wedge-label b { color: var(--c); }
      .vsr-hub {
        position: absolute; left: 50%; top: 50%; width: 1100px; height: 1100px; margin: -550px 0 0 -550px; border-radius: 50%;
        background: radial-gradient(circle, #050507 60%, rgba(5,5,7,0.6) 100%);
        box-shadow: 0 0 0 6px rgba(245,243,235,0.2);
      }
      .vsr-wheel-pointer {
        position: absolute; left: 820px; top: 540px; width: 90px; height: 120px; margin-top: -60px; z-index: 5;
        background: #f5f3eb; clip-path: polygon(0 50%, 100% 0, 80% 50%, 100% 100%);
        filter: drop-shadow(6px 6px 0 #050507);
      }
      .vsr.is-landed .vsr-wheel-pointer { background: var(--cur); animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }

      /* ---------- rullo ---------- */
      .vsr-reel-box {
        position: absolute; inset: 0;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
      }
      .vsr-reel { --h: 250px; position: absolute; left: -60px; right: 40%; top: 540px; transform: skewY(-4deg); }
      .vsr-band {
        position: absolute; left: 0; right: 0; height: calc(var(--h) - 14px);
        top: calc((var(--i) - var(--pos, 0)) * var(--h) - var(--h) / 2 + 7px);
        overflow: hidden; box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
      }
      .vsr-band .vsr-art { filter: brightness(0.4) saturate(1.1); }
      .vsr-band-tint { position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, transparent) 0%, transparent 55%); }
      .vsr-band::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--c); z-index: 2; }
      .vsr-band-icon { position: absolute; left: 90px; top: 50%; width: 120px; height: 120px; margin-top: -60px; object-fit: contain; z-index: 2; filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-band-txt { position: absolute; left: 240px; right: 40px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; flex-direction: column; gap: 8px; }
      .vsr-band-txt b { font-weight: 700; font-style: italic; font-size: 54px; line-height: 0.95; text-transform: uppercase; text-shadow: 4px 4px 0 #050507; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band-txt small { font-weight: 600; font-size: 18px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band.on .vsr-art { filter: brightness(0.75) saturate(1.2); }
      .vsr-band.on .vsr-band-txt b { color: var(--c); }
      .vsr-reel-window {
        position: absolute; left: -20px; right: 38%; top: 540px; height: 266px; margin-top: -133px; z-index: 6;
        transform: skewY(-4deg);
        border-top: 6px solid #f5f3eb; border-bottom: 6px solid #f5f3eb;
        box-shadow: 0 0 40px color-mix(in srgb, var(--cur) 50%, transparent), inset 0 0 0 2px rgba(5,5,7,0.6);
      }
      .vsr-reel-window::after {
        content: ''; position: absolute; right: -70px; top: 50%; width: 60px; height: 90px; margin-top: -45px;
        background: #f5f3eb; clip-path: polygon(0 50%, 100% 0, 80% 50%, 100% 100%); filter: drop-shadow(5px 5px 0 #050507);
      }
      .vsr.is-landed .vsr-reel-window { border-color: var(--cur); animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }

      /* ---------- griglia ---------- */
      .vsr-grid {
        position: absolute; left: 40px; top: 70px; width: 860px; height: 780px;
        display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, 1fr); gap: 14px;
        transform: skewX(-8deg);
      }
      .vsr-tile {
        position: relative; overflow: hidden; background: #111116;
        box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
        transition: transform .14s, box-shadow .14s, filter .14s;
        filter: saturate(0.6) brightness(0.7);
      }
      .vsr-tile .vsr-art { transform: skewX(8deg) scale(1.2); filter: brightness(0.45); }
      .vsr-tile-tint { position: absolute; inset: 0; background: linear-gradient(0deg, color-mix(in srgb, var(--c) 45%, transparent), transparent 70%); }
      .vsr-tile-icon { position: absolute; left: 50%; top: 40%; width: 84px; height: 84px; margin: -42px 0 0 -42px; object-fit: contain; transform: skewX(8deg); filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-tile-name { position: absolute; left: 14px; right: 14px; bottom: 12px; transform: skewX(8deg); font-weight: 700; font-style: italic; font-size: 20px; line-height: 1; text-transform: uppercase; text-align: center; text-shadow: 2px 2px 0 #050507; }
      .vsr-tile.on {
        filter: none; z-index: 2; transform: scale(1.08);
        box-shadow: inset 0 0 0 4px var(--c), 0 0 40px color-mix(in srgb, var(--c) 60%, transparent), 8px 8px 0 #f5f3eb;
      }
      .vsr-tile.on .vsr-art { filter: brightness(0.85); }
      .vsr.is-landed .vsr-tile:not(.on) { filter: saturate(0.2) brightness(0.35); }
      .vsr.is-landed .vsr-tile.on { animation: vsr-tile-land .6s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-tile-land { 40% { transform: scale(1.2); } 100% { transform: scale(1.12); } }
      .vsr--griglia .vsr-caption { bottom: 40px; }
      .vsr--griglia .vsr-name { font-size: 52px; }

      @media (prefers-reduced-motion: reduce) {
        .vsr { animation: none; }
      }
    `}</style>
  );
}
