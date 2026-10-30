// ============================================================
// VersusRoulette.jsx — il sorteggio dell'avversario nella metà nemica del VS
// ============================================================
// Mentre il duello si carica la metà nemica, ancora al buio, si accende un
// rullo da slot: fasce inclinate (arte, icona, nome, sottotitolo) che partono
// velocissime, rallentano piano e con `stopping` si fermano sull'avversario.
// Le voci sono le armate, oppure gli eserciti dell'armata nemica se il
// giocatore l'ha scelta lui (vedi buildRouletteItems).
// Il movimento: `pos` avanza in voci; la velocità cala da VMAX verso VMIN e
// la fermata è una curva che parte alla velocità corrente e arriva ferma su
// un intero.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS, ARMY_GIFS } from '../../data/armies.js';
import { ARMY_DECKS } from '../../data/cards.js';
import { ARMY_LORE } from '../menu/cosmic/armyLore.js';
import { buildDeckTicketEntry } from '../menu/cosmic/DeckSelectCinematic.jsx';
import { playSound } from '../../audio/soundBus';
import { UI_SOUND } from '../../audio/soundCatalog';

export const ROULETTE_STOP_MS = 3200;

/** Voci al secondo: si parte a VMAX e si scende verso VMIN con costante TAU. */
const VMAX = 18;
const VMIN = 2.2;
const TAU_MS = 1600;
/** Le fasce si accendono, poi il rullo parte di scatto. */
const POWER_ON_MS = 380;
const RAMP_MS = 220;

const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  a: `${Math.round((360 / 16) * i + ((i * 37) % 13))}deg`,
  d: `${150 + ((i * 53) % 140)}px`,
}));

function hermiteStop(t, v0T, d) {
  // posizione relativa: velocità iniziale v0, finale 0, distanza d
  const t2 = t * t;
  const t3 = t2 * t;
  return v0T * (t3 - 2 * t2 + t) + d * (-2 * t3 + 3 * t2);
}

/**
 * Voci del rullo. Con `deckArmy` (armata nemica scelta dal giocatore) sono
 * gli eserciti di quell'armata e il bersaglio è l'esercito nemico; altrimenti
 * le armate e il bersaglio è l'armata nemica.
 * @returns {{ items: object[], targetKey: string|null, mode: 'armies'|'decks' }}
 */
export function buildRouletteItems({ armies, enemyArmy, enemyDeckKey, deckArmy }) {
  const decks = deckArmy ? ARMY_DECKS[deckArmy] : null;
  if (decks && enemyDeckKey && decks[enemyDeckKey] && Object.keys(decks).length > 1) {
    const items = Object.keys(decks).map((key) => {
      const e = buildDeckTicketEntry({ army: deckArmy, deckKey: key });
      return {
        key,
        label: e.name,
        sub: `${e.leader?.name || deckArmy} · LEGA ${e.totalLeague ?? 30}`,
        art: ARMY_GIFS[deckArmy] || null,
        portrait: e.leader?.img || null,
        icon: ARMY_ICONS[deckArmy] || null,
        accent: ARMY_COLORS[deckArmy]?.accent || '#94a3b8',
      };
    });
    return { items, targetKey: enemyDeckKey, mode: 'decks' };
  }
  const items = armies.map((army) => ({
    key: army,
    label: army,
    sub: ARMY_LORE[army]?.motto || '',
    art: ARMY_GIFS[army] || null,
    portrait: null,
    icon: ARMY_ICONS[army] || null,
    accent: ARMY_COLORS[army]?.accent || '#94a3b8',
  }));
  return { items, targetKey: enemyArmy, mode: 'armies' };
}

/**
 * @param {{ items: object[], targetKey: string|null, mode: 'armies'|'decks', stopping: boolean, leaving: boolean }} props
 */
export function VersusRoulette({ items, targetKey, mode = 'armies', stopping, leaving }) {
  const n = Math.max(1, items.length);
  const targetIdx = Math.max(0, items.findIndex((it) => it.key === targetKey));
  const rootRef = useRef(null);
  const stoppingRef = useRef(stopping);
  stoppingRef.current = stopping;
  const [shown, setShown] = useState(0);
  const [landed, setLanded] = useState(false);
  // abbastanza giri di fasce da coprire la metà schermo anche con 2-3 eserciti
  const laps = Math.max(1, Math.ceil(7 / n));

  useEffect(() => {
    const tStart = performance.now() + POWER_ON_MS;
    let last = performance.now();
    let pos = 0;
    let stop = null;
    let lastShown = 0;
    let lastTick = 0;
    let raf = 0;
    const speedAt = (now) => {
      const t = now - tStart;
      if (t <= 0) return 0;
      const ramp = Math.min(1, t / RAMP_MS);
      return (VMIN + (VMAX - VMIN) * Math.exp(-t / TAU_MS)) * ramp / 1000;
    };
    const frame = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      let v = speedAt(now);
      if (stoppingRef.current && !stop) {
        const v0T = v * ROULETTE_STOP_MS;
        // prima posizione intera, almeno a metà della corsa "naturale", con il bersaglio al centro
        let p1 = Math.ceil(pos + Math.max(1, v0T * 0.5));
        while (((p1 % n) + n) % n !== targetIdx) p1 += 1;
        stop = { at: now, p0: pos, v0T, d: p1 - pos };
      }
      if (stop) {
        const t = Math.min(1, (now - stop.at) / ROULETTE_STOP_MS);
        const prev = pos;
        pos = stop.p0 + hermiteStop(t, stop.v0T, stop.d);
        v = dt ? Math.max(0, (pos - prev) / dt) : 0;
        if (t >= 1) {
          pos = stop.p0 + stop.d;
          v = 0;
          setLanded(true);
        }
      } else {
        pos += v * dt;
      }
      const el = rootRef.current;
      if (el) {
        // giro dopo giro la scena è identica: basta la posizione dentro un giro
        el.style.setProperty('--pos', (((pos % n) + n) % n).toFixed(4));
        el.style.setProperty('--spd', Math.min(1, (v * 1000) / VMAX).toFixed(3));
      }
      const s = Math.round(pos);
      if (s !== lastShown) {
        lastShown = s;
        setShown(s);
        if (now - lastTick > 60) {
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

  const current = ((shown % n) + n) % n;
  const cur = items[current] || items[0];
  const lapList = Array.from({ length: laps * 2 + 1 }, (_, k) => k - laps);

  return (
    <div
      ref={rootRef}
      className={`vsr vsr--${mode}${landed ? ' is-landed' : ''}${leaving ? ' is-leaving' : ''}`}
      style={{ '--cur': cur?.accent || '#f5f3eb', '--n': n }}
      aria-hidden="true"
    >
      <div className="vsr-glow" />
      <div className="vsr-reel-box">
        <div className="vsr-reel">
          {lapList.flatMap((lap) =>
            items.map((it, i) => {
              const idx = lap * n + i;
              return (
                <div
                  key={`${lap}-${it.key}`}
                  className={`vsr-band${i === current ? ' on' : ''}`}
                  style={{
                    '--i': idx,
                    // accensione: dal centro verso fuori, una fascia dopo l'altra
                    '--on': `${Math.min(Math.abs(idx), Math.abs(idx - n)) * 55}ms`,
                    '--c': it.accent,
                  }}
                >
                  {it.art ? <span className="vsr-art" style={{ backgroundImage: `url('${it.art}')` }} /> : <span className="vsr-art" />}
                  {it.portrait ? <span className="vsr-portrait" style={{ backgroundImage: `url('${it.portrait}')` }} /> : null}
                  <span className="vsr-band-tint" />
                  {it.icon ? <img className="vsr-band-icon" src={it.icon} alt="" draggable={false} /> : null}
                  <span className="vsr-band-txt">
                    <b>{it.label}</b>
                    <small>{it.sub}</small>
                  </span>
                </div>
              );
            })
          )}
          {/* scie di velocità: si vedono solo quando il rullo corre */}
          <div className="vsr-streaks" />
        </div>
        <div className="vsr-reel-window">
          <span className="vsr-flash" key={`f${shown}`} />
          <span className="vsr-centerline" />
          <span className="vsr-needle vsr-needle--l"><i key={`l${shown}`} /></span>
          <span className="vsr-needle vsr-needle--r"><i key={`r${shown}`} /></span>
        </div>
        {landed ? (
          <div className="vsr-sparks">
            {SPARKS.map((sp, i) => <span key={i} style={{ '--a': sp.a, '--d': sp.d }} />)}
          </div>
        ) : null}
      </div>

      <div className="vsr-caption">
        <span className="vsr-eye">
          {landed
            ? (mode === 'decks' ? 'ESERCITO AVVERSARIO' : 'IL TUO AVVERSARIO')
            : (mode === 'decks' ? 'SORTEGGIO DELL’ESERCITO' : 'SORTEGGIO DELL’AVVERSARIO')}
        </span>
        <span className="vsr-name" key={cur?.key}>{cur?.label}</span>
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
        --spd: 0;
        position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        clip-path: polygon(0 0, 56% 0, 44% 100%, 0 100%);
        background: #050507;
        font-family: 'Chakra Petch', sans-serif; color: #f5f3eb;
        transition: opacity .4s ease .5s;
      }
      .vsr.is-leaving { opacity: 0; }
      .vsr * { box-sizing: border-box; }
      .vsr-art { position: absolute; inset: 0; background: #111116 center / cover no-repeat; }

      /* alone del colore corrente dietro al rullo, più forte quando corre */
      .vsr-glow {
        position: absolute; left: -10%; top: 50%; width: 90%; height: 520px; margin-top: -260px;
        background: radial-gradient(ellipse at 40% 50%, color-mix(in srgb, var(--cur) 45%, transparent), transparent 70%);
        opacity: calc(0.35 + var(--spd) * 0.5); transition: background .2s;
      }

      /* ---------- rullo ---------- */
      .vsr-reel-box {
        position: absolute; inset: 0;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
      }
      .vsr-reel {
        --h: 250px; position: absolute; left: -60px; right: 40%; top: 540px; transform: skewY(-4deg);
        animation: vsr-reel-in .6s cubic-bezier(.2,.9,.25,1) both;
      }
      @keyframes vsr-reel-in { from { transform: skewY(-4deg) translateX(-38%); } }
      .vsr-band {
        position: absolute; left: 0; right: 0; height: calc(var(--h) - 14px);
        top: calc((var(--i) - var(--pos, 0)) * var(--h) - var(--h) / 2 + 7px);
        overflow: hidden; box-shadow: inset 0 0 0 2px rgba(245,243,235,0.12);
        /* accensione da insegna al neon: sfarfalla e poi resta accesa */
        animation: vsr-band-on .5s steps(1, end) var(--on) both, vsr-band-glow .8s ease-out var(--on) both;
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
      .vsr-portrait {
        position: absolute; right: 0; top: 0; bottom: 0; width: 46%; background: center 20% / cover no-repeat;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 45%); mask-image: linear-gradient(90deg, transparent, #000 45%);
        filter: brightness(0.6);
      }
      .vsr-band.on .vsr-portrait { filter: brightness(0.95); }
      .vsr-band-tint { position: absolute; inset: 0; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, transparent) 0%, transparent 55%); }
      .vsr-band::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--c); z-index: 2; }
      .vsr-band-icon { position: absolute; left: 90px; top: 50%; width: 120px; height: 120px; margin-top: -60px; object-fit: contain; z-index: 2; filter: drop-shadow(0 0 10px rgba(0,0,0,.8)); }
      .vsr-band-txt { position: absolute; left: 240px; right: 40px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; flex-direction: column; gap: 8px; }
      .vsr-band-txt b { font-weight: 700; font-style: italic; font-size: 54px; line-height: 0.95; text-transform: uppercase; text-shadow: 4px 4px 0 #050507; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr--decks .vsr-band-txt b { font-size: 46px; }
      .vsr-band-txt small { font-weight: 600; font-size: 18px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .vsr-band.on .vsr-art { filter: brightness(0.75) saturate(1.2); }
      .vsr-band.on .vsr-band-txt b { color: var(--c); }

      /* scie verticali: compaiono con la velocità */
      .vsr-streaks {
        position: absolute; left: 0; right: 0; top: -700px; height: 1400px; z-index: 3;
        background:
          repeating-linear-gradient(90deg, transparent 0 46px, rgba(245,243,235,0.16) 46px 48px, transparent 48px 120px),
          linear-gradient(180deg, rgba(5,5,7,0.55), transparent 30%, transparent 70%, rgba(5,5,7,0.55));
        opacity: calc(var(--spd) * var(--spd) * 0.9);
      }

      /* finestra: i bordi si tracciano, le lancette scattano dentro */
      .vsr-reel-window {
        /* finisce prima della diagonale centrale, così la lancetta destra resta visibile */
        position: absolute; left: -20px; right: calc(100% - 830px); top: 540px; height: 266px; margin-top: -133px; z-index: 6;
        transform: skewY(-4deg);
        box-shadow: 0 0 calc(30px + var(--spd) * 50px) color-mix(in srgb, var(--cur) 55%, transparent);
        animation: vsr-fade .5s ease .3s both;
      }
      .vsr-reel-window::before {
        content: ''; position: absolute; inset: 0;
        border-top: 6px solid #f5f3eb; border-bottom: 6px solid #f5f3eb;
        transform-origin: left center; animation: vsr-draw .5s cubic-bezier(.6,0,.2,1) .25s both;
      }
      @keyframes vsr-draw { from { transform: scaleX(0); } }
      @keyframes vsr-fade { from { opacity: 0; } }
      .vsr.is-landed .vsr-reel-window::before { border-color: var(--cur); }
      .vsr.is-landed .vsr-reel-window { animation: vsr-win-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-win-pop { 40% { transform: skewY(-4deg) scale(1.05); } }
      /* lampo a ogni fascia che passa sotto le lancette */
      .vsr-flash {
        position: absolute; inset: 6px 0; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--cur) 40%, #fff 10%) 60%, transparent);
        mix-blend-mode: screen; animation: vsr-flash .35s ease-out both;
      }
      @keyframes vsr-flash { from { opacity: .7; } to { opacity: 0; } }
      /* linea di mira al centro della finestra */
      .vsr-centerline {
        position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px;
        background: repeating-linear-gradient(90deg, rgba(245,243,235,0.7) 0 18px, transparent 18px 30px);
        animation: vsr-draw .5s cubic-bezier(.6,0,.2,1) .45s both; transform-origin: left center;
      }
      /* lancette: due becchi ai lati che indicano il centro e «scattano» a ogni fascia */
      .vsr-needle { position: absolute; top: 50%; width: 76px; height: 104px; margin-top: -52px; z-index: 2; }
      .vsr-needle i {
        position: absolute; inset: 0; background: #f5f3eb; filter: drop-shadow(5px 5px 0 #050507);
        animation: vsr-flap .22s cubic-bezier(.2,1.8,.4,1) both;
      }
      .vsr-needle--r { right: -84px; animation: vsr-needle-in-r .4s cubic-bezier(.2,1.6,.4,1) .65s both; }
      .vsr-needle--r i { clip-path: polygon(0 50%, 100% 0, 78% 50%, 100% 100%); transform-origin: 100% 50%; }
      .vsr-needle--l { left: 6px; animation: vsr-needle-in-l .4s cubic-bezier(.2,1.6,.4,1) .7s both; }
      .vsr-needle--l i { clip-path: polygon(100% 50%, 0 0, 22% 50%, 0 100%); transform-origin: 0 50%; }
      @keyframes vsr-flap { from { transform: rotate(-14deg); } }
      @keyframes vsr-needle-in-r { from { opacity: 0; transform: translateX(70px); } }
      @keyframes vsr-needle-in-l { from { opacity: 0; transform: translateX(-70px); } }
      .vsr.is-landed .vsr-needle i { background: var(--cur); animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }

      /* scintille all'arrivo, dal centro della finestra */
      .vsr-sparks { position: absolute; left: 860px; top: 540px; width: 0; height: 0; z-index: 8; }
      .vsr-sparks span {
        position: absolute; left: -4px; top: -4px; width: 8px; height: 26px; background: var(--cur);
        box-shadow: 0 0 12px var(--cur);
        transform: rotate(var(--a)) translateY(0); opacity: 0;
        animation: vsr-spark .7s cubic-bezier(.1,.8,.3,1) both;
      }
      @keyframes vsr-spark {
        0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scaleY(1.6); }
        100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(-1 * var(--d))) scaleY(.4); }
      }

      .vsr-caption {
        position: absolute; left: 60px; bottom: 70px; z-index: 20; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
        transform: rotate(-4deg); transform-origin: left bottom;
        animation: vsr-caption-in .5s cubic-bezier(.2,1,.3,1) .45s both;
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
      .vsr--decks .vsr-name { font-size: 54px; }
      .vsr.is-landed .vsr-name { animation: vsr-pop .55s cubic-bezier(.2,1.6,.4,1) both; }
      @keyframes vsr-pop { 40% { transform: scale(1.12) rotate(-1deg); } }

      @media (prefers-reduced-motion: reduce) {
        .vsr-reel, .vsr-band, .vsr-reel-window, .vsr-reel-window::before, .vsr-needle, .vsr-needle i,
        .vsr-centerline, .vsr-flash, .vsr-sparks span, .vsr-caption { animation: none; }
        .vsr-streaks { display: none; }
      }
    `}</style>
  );
}
