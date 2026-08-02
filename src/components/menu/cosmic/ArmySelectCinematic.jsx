// ============================================================
// ArmySelectCinematic.jsx — Schermata "Scegli la tua armata"
// ============================================================
// Drop-in component. È la trasposizione 1:1 dell'esplorazione V3
// approvata. I testi per ogni armata (synopsis / motto / bonusExplain /
// style / tips) si modificano in `armyLore.js`.
//
// Props:
//   onSelect(armyName: string | null)  // null = "Eserciti Personalizzati"
//   onBack()                           // torna al menu
//
// Si renderizza fullscreen (position: fixed). Renderizzala al
// livello del routing (es. {currentScreen === 'armySelect' && ...}),
// NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ARMY_COLORS,
  ARMY_BONUSES,
  ARMY_GIFS,
  ARMY_ICONS,
} from '../../../data/armies.js';
import { ARMY_SETS, ARMY_DECKS } from '../../../data/cards.js';
import { ARMY_LORE, MIXED_ARMIES_LORE } from './armyLore.js';

// ------------------------------------------------------------
// Adapter: traduce i dati reali del gioco nel formato usato dal V3
// ------------------------------------------------------------
function buildArmies() {
  const list = [];

  // Voce speciale "Eserciti Personalizzati" (multi-armata)
  list.push({
    id: 'mixed',
    name: 'Eserciti Personalizzati',
    color: '#a78bfa',
    bg: null,
    portrait: null,
    glyph: MIXED_ARMIES_LORE.glyph || '⚔',
    cards: 0,
    decks: 0,
    bonus: null,
    bonusLabel: MIXED_ARMIES_LORE.bonusLabel || 'NESSUNO',
    bonusWhen: MIXED_ARMIES_LORE.bonusWhen || '',
    bonusExplain: MIXED_ARMIES_LORE.bonusExplain || '',
    motto: MIXED_ARMIES_LORE.motto || '',
    synopsis: MIXED_ARMIES_LORE.synopsis || '',
    style: MIXED_ARMIES_LORE.style || '',
    tips: MIXED_ARMIES_LORE.tips || '',
    isMixed: true,
  });

  for (const armyName of Object.keys(ARMY_SETS)) {
    const lore = ARMY_LORE[armyName] || {};
    const cards = ARMY_SETS[armyName] || [];
    const decks = ARMY_DECKS?.[armyName] ? Object.keys(ARMY_DECKS[armyName]).length : 2;
    const colors = ARMY_COLORS[armyName] || { accent: '#94a3b8' };
    const bonus = ARMY_BONUSES[armyName];
    const bg = ARMY_GIFS[armyName] || null;

    list.push({
      id: armyName,
      name: armyName,
      color: colors.accent,
      bg,
      portrait: ARMY_ICONS[armyName] || null,
      glyph: lore.glyph || '◈',
      cards: cards.length,
      decks,
      bonus: bonus?.description || '—',
      bonusLabel: lore.bonusLabel || (bonus?.trigger ? bonus.trigger.toUpperCase() : 'PASSIVO'),
      bonusWhen: lore.bonusWhen || '',
      bonusExplain: lore.bonusExplain || '',
      bonusHighlight: lore.bonusHighlight || '',
      motto: lore.motto || '',
      synopsis: lore.synopsis || lore.lore || '',
      style: lore.style || '',
      tips: lore.tips || '',
      isMixed: false,
    });
  }

  return list;
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================

export default function ArmySelectCinematic({ onSelect, onBack }) {
  const ARMIES = React.useMemo(() => buildArmies(), []);
  const [idx, setIdx] = useState(1);
  const [prevIdx, setPrevIdx] = useState(1);
  const [phase, setPhase] = useState('intro'); // intro -> idle -> confirming
  const [direction, setDirection] = useState(1);
  const [audioPulse, setAudioPulse] = useState(0);
  const rootRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const queuedCursorRef = React.useRef({ x: 0, y: 0 });
  const lastCursorRef = React.useRef({ x: 0, y: 0 });

  const total = ARMIES.length;
  const army = ARMIES[idx];

  const updateCursor = useCallback((e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const x = ((Math.min(1, Math.max(0, e.clientX / w))) - 0.5) * 2;
    const y = ((Math.min(1, Math.max(0, e.clientY / h))) - 0.5) * 2;
    queuedCursorRef.current = { x, y };
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = queuedCursorRef.current;
      const prev = lastCursorRef.current;
      if (Math.abs(next.x - prev.x) < 0.002 && Math.abs(next.y - prev.y) < 0.002) return;
      lastCursorRef.current = next;
      const root = rootRef.current;
      if (!root) return;
      root.style.setProperty('--parallax-x', String(next.x));
      root.style.setProperty('--parallax-y', String(next.y));
    });
  }, []);

  // Intro animation: sigillo apre, ritratto zooma
  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 1700);
    return () => clearTimeout(t);
  }, []);

  const go = (delta) => {
    setPrevIdx(idx);
    setDirection(delta);
    setIdx((idx + delta + total) % total);
    setAudioPulse((p) => p + 1);
  };
  const goTo = (i) => {
    if (i === idx) return;
    setPrevIdx(idx);
    setDirection(i > idx ? 1 : -1);
    setIdx(i);
    setAudioPulse((p) => p + 1);
  };

  const confirmArmy = () => {
    if (phase !== 'idle') return;
    setPhase('confirming');
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSelect && onSelect(army.isMixed ? null : army.name);
        });
      });
    }, 1660);
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'idle') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Enter') confirmArmy();
      if (e.key === 'Escape' && onBack) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onBack, go, confirmArmy]);

  // Cleanup rAF cursor scheduler
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`v3c phase-${phase}`}
      style={{ '--accent': army.color, '--parallax-x': 0, '--parallax-y': 0 }}
      onPointerMove={updateCursor}
    >
      {/* BG layer with cross-fade between prev/current */}
      <div className="v3c-bg-layer">
        <BgImage army={ARMIES[prevIdx]} key={`prev-${prevIdx}-${audioPulse}`} kind="prev"/>
        <BgImage army={army} key={`cur-${idx}`} kind="cur"/>
        <div className="v3c-bg-vignette"/>
        <div className="v3c-cosmic-stars"/>
      </div>

      {/* Top HUD: back + title */}
      <header className="v3c-top v3c-top-clean">
        <div className="v3c-back-slot">
          <button className="v3c-back" onClick={onBack}>
            <span className="ar">←</span><span className="lbl">MENU</span>
          </button>
        </div>
        <div className="v3c-title-block">
          <div className="v3c-eyebrow" style={{ color: army.color }}>FASE I · SCHIERAMENTO</div>
          <h1 className="v3c-title">SCEGLI LA TUA ARMATA</h1>
        </div>
        <div className="v3c-back-slot v3c-back-slot-spacer"/>
      </header>
      <div className="v3c-sub-below" style={{ '--accent': army.color }}>
        Seleziona il set con cui vuoi combattere — premi <kbd>↵</kbd> per schierare
      </div>

      {/* Stage: 3D-ish ritratto + side cards */}
      <div className="v3c-stage">
        <NavArrow side="left" onClick={() => go(-1)} accent={army.color}/>
        <div className="v3c-track">
          {[-2, -1, 0, 1, 2].map((off) => {
            const i = (idx + off + total) % total;
            const a = ARMIES[i];
            const isCenter = off === 0;
            return (
              <CarouselCard
                key={`${i}-${off}`}
                army={a}
                offset={off}
                isCenter={isCenter}
                phase={phase}
                pulse={audioPulse}
                onClick={() => !isCenter && goTo(i)}
              />
            );
          })}
        </div>
        <NavArrow side="right" onClick={() => go(1)} accent={army.color}/>
      </div>

      {/* Detail panel: lore + stats + bonus + confirm */}
      <DetailPanel army={army} key={`d-${idx}`} onConfirm={confirmArmy}/>

      {/* Ticker bottom */}
      <Ticker armies={ARMIES} idx={idx} onSelect={goTo}/>

      {/* Intro sigillo overlay */}
      {phase === 'intro' && <SigilloIntro accent={army.color} glyph={army.glyph}/>}

      {/* Confirm transition */}
      {phase === 'confirming' && <ConfirmTransition army={army}/>}

      <div className="scan-lines"/>

      <V3CinematicStyles/>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTI
// ============================================================

function BgImage({ army, kind }) {
  const has = !!army.bg;
  const style = {
    backgroundImage: has ? `url('${army.bg}')` : undefined,
    transform:
      kind === 'cur'
        ? 'translate(calc(var(--parallax-x, 0) * 30px), calc(var(--parallax-y, 0) * 20px)) scale(1.06)'
        : 'translate(calc(var(--parallax-x, 0) * 20px), calc(var(--parallax-y, 0) * 14px)) scale(1.1)',
  };
  return (
    <div className={`v3c-bg ${kind} t-parallax`} style={style}>
      {!has && <div className="v3c-bg-fallback" style={{ '--accent': army.color }}>{army.glyph}</div>}
    </div>
  );
}

function NavArrow({ side, onClick, accent }) {
  return (
    <button className={`v3c-arrow ${side}`} onClick={onClick} style={{ '--accent': accent }} aria-label={side}>
      <svg viewBox="0 0 56 56" width="56" height="56">
        <polygon points={side === 'left' ? '38,12 18,28 38,44' : '18,12 38,28 18,44'} fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1"/>
      </svg>
    </button>
  );
}

function CarouselCard({ army, offset, isCenter, phase, pulse, onClick }) {
  return (
    <div
      className={`v3cc ${isCenter ? 'is-center' : ''} ${phase === 'intro' ? 'intro' : ''}`}
      style={{
        '--accent': army.color,
        '--off': offset,
        zIndex: 10 - Math.abs(offset),
      }}
      onClick={onClick}
    >
      <div className="v3cc-bg" style={{ backgroundImage: army.bg ? `url('${army.bg}')` : 'none' }}>
        {!army.bg && <div className="v3cc-bg-fallback" style={{ '--accent': army.color }}>{army.glyph}</div>}
      </div>
      <div className="v3cc-vignette"/>
      <div className="v3cc-portrait-wrap">
        {army.portrait
          ? <img className="v3cc-portrait" src={army.portrait} alt={army.name} draggable={false}/>
          : <div className="v3cc-portrait-glyph" style={{ color: army.color }}>{army.glyph}</div>}
      </div>

      {isCenter && <div className="v3cc-holo"/>}
      {isCenter && <div className="v3cc-holo-ring"/>}
      {isCenter && <SigilloRing accent={army.color}/>}

      {isCenter && <div className="v3cc-scan"/>}
      {isCenter && <div className="v3cc-grid"/>}

      <div className="v3cc-name" style={{ color: army.color }}>{army.name}</div>

      {isCenter && (
        <div className="v3cc-corners">
          <span/><span/><span/><span/>
        </div>
      )}
    </div>
  );
}

function SigilloRing({ accent }) {
  return (
    <svg className="v3cc-sigillo" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <linearGradient id="asc-sgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0.1"/>
        </linearGradient>
      </defs>
      <g style={{ transformOrigin: '200px 200px' }} className="v3cc-sigillo-spin">
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#asc-sgrad)" strokeWidth="0.5" strokeDasharray="3 8"/>
        <circle cx="200" cy="200" r="140" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        <circle cx="200" cy="200" r="120" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.4" strokeDasharray="1 5"/>
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x = 200 + Math.cos(a) * 150;
          const y = 200 + Math.sin(a) * 150;
          const ch = ['◇','▲','✦','▽','✧','◈','✕','✺','◬','◉','✚','☩'][i];
          return <text key={i} x={x} y={y} fill={accent} fillOpacity="0.55" fontFamily="monospace" fontSize="10" textAnchor="middle" dominantBaseline="middle">{ch}</text>;
        })}
      </g>
    </svg>
  );
}

function DetailPanel({ army, onConfirm }) {
  const metaCards = army.cards || '—';
  const metaDecks = army.decks || '—';
  const synopsisBlocks = (army.synopsis || '').split(/\n\n+/).filter(Boolean);
  return (
    <>
      {/* LEFT — sinossi narrativa */}
      <div className="v3c-side v3c-side-l" style={{ '--accent': army.color }}>
        <div className="v3c-side-inner v3c-side-inner-lore">
          <div className="v3c-side-eye">ARMATA · {army.glyph}</div>
          <h2 className="v3c-side-name">{army.name}</h2>
          {army.motto && <p className="v3c-side-motto">"{army.motto}"</p>}
          <div className="v3c-side-synopsis">
            {synopsisBlocks.map((block, i) => (
              <p key={i}>{block}</p>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — tecnica: bonus, stile, note, meta, confirm */}
      <div className="v3c-side v3c-side-r" style={{ '--accent': army.color }}>
        <div className="v3c-side-inner v3c-side-inner-tech">
          <div className="v3c-side-tech-body">
            <div className={`v3c-bonus${army.bonusHighlight ? ' v3c-bonus--exception' : ''}`} style={{ borderColor: army.color }}>
              <div className="v3c-bonus-eye" style={{ color: army.color }}>BONUS · {army.bonusLabel}</div>
              {army.bonusHighlight && (
                <div className="v3c-bonus-highlight" style={{ '--accent': army.color }}>
                  <span className="v3c-bonus-highlight-tag">DIVERSO DALLE ALTRE</span>
                  <p>{army.bonusHighlight}</p>
                </div>
              )}
              {army.bonusWhen && <div className="v3c-bonus-when">{army.bonusWhen}</div>}
              {army.bonusExplain && <p className="v3c-bonus-explain">{army.bonusExplain}</p>}
              {army.bonus && (
                <div className="v3c-bonus-val">{army.bonus}</div>
              )}
              {!army.bonus && !army.bonusExplain && (
                <div className="v3c-bonus-val">— Multi-Armata —</div>
              )}
            </div>
            {army.style && (
              <div className="v3c-side-block">
                <div className="lbl">STILE CONSIGLIATO</div>
                <div className="txt">{army.style}</div>
              </div>
            )}
            {army.tips && (
              <div className="v3c-side-block">
                <div className="lbl">NOTE TATTICHE</div>
                <div className="txt">{army.tips}</div>
              </div>
            )}
            <div className="v3c-side-meta">
              <span><b>{metaCards}</b> Carte</span>
              <span className="dot">•</span>
              <span><b>{metaDecks}</b> Eserciti</span>
            </div>
          </div>
          <button className="v3c-confirm" style={{ borderColor: army.color, color: army.color }} onClick={onConfirm}>
            <span className="v3c-confirm-bg"/>
            <span className="v3c-confirm-lbl">SCHIERA</span>
            <span className="v3c-confirm-arr">→</span>
            <span className="v3c-confirm-key">↵</span>
          </button>
        </div>
      </div>
    </>
  );
}

function Ticker({ armies, idx, onSelect }) {
  return (
    <div className="v3c-ticker-named">
      {armies.map((a, i) => {
        const active = i === idx;
        return (
          <button key={a.id} className={`tkn ${active ? 'on' : ''}`} onClick={() => onSelect(i)} style={{ '--c': a.color }}>
            <span className="num">{String(i+1).padStart(2,'0')}</span>
            <span className="nm">{a.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SigilloIntro({ accent, glyph }) {
  return (
    <div className="v3c-intro" style={{ '--accent': accent }}>
      <svg viewBox="0 0 800 800" width="800" height="800" className="v3c-intro-svg">
        <defs>
          <radialGradient id="asc-igrad">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="400" cy="400" r="380" fill="url(#asc-igrad)"/>
        <g className="v3c-intro-spin">
          <circle cx="400" cy="400" r="320" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="2 6"/>
          <circle cx="400" cy="400" r="260" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.5"/>
        </g>
        <g className="v3c-intro-spin-r">
          <circle cx="400" cy="400" r="200" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.5" strokeDasharray="4 4"/>
        </g>
        {Array.from({length: 8}).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x1 = 400 + Math.cos(a) * 220;
          const y1 = 400 + Math.sin(a) * 220;
          const x2 = 400 + Math.cos(a) * 340;
          const y2 = 400 + Math.sin(a) * 340;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeOpacity="0.4"/>;
        })}
      </svg>
      <div className="v3c-intro-glyph" style={{ color: accent }}>{glyph}</div>
      <div className="v3c-intro-text">APERTURA · SCHIERAMENTO</div>
    </div>
  );
}

function ConfirmTransition({ army }) {
  return (
    <div className="v3c-confirming" style={{ '--accent': army.color }}>
      <div className="v3c-confirming-flash"/>
      <div className="v3c-confirming-iris"/>
      <div className="v3c-confirming-text">
        <div className="eye" style={{ color: army.color }}>SIGILLO IMPRESSO</div>
        <div className="nm">{army.name}</div>
        <div className="next">Apertura → Scelta dell'esercito</div>
      </div>
    </div>
  );
}

// ============================================================
// STILI (1:1 con esplorazione V3 approvata)
// ============================================================

function V3CinematicStyles() {
  return (
    <style>{`
      .v3c {
        position: fixed; inset: 0;
        background: #050608;
        color: #e8e8ec;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden;
        isolation: isolate;
        z-index: 1000;
      }
      .v3c.phase-intro { cursor: wait; }

      /* BG */
      .v3c-bg-layer { position: absolute; inset: 0; z-index: 0; }
      .v3c-bg {
        position: absolute; inset: -4%;
        background-size: cover;
        background-position: center;
        filter: brightness(0.42) saturate(1.15);
        transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .24s ease-out;
        will-change: transform, opacity;
      }
      .v3c-bg.cur { opacity: 1; animation: v3c-bg-in 1.2s cubic-bezier(.2,.7,.2,1); }
      .v3c-bg.prev { opacity: 0; animation: v3c-bg-out 1.2s cubic-bezier(.2,.7,.2,1); }
      @keyframes v3c-bg-in { from { opacity: 0; transform: scale(1.16); filter: brightness(0.1) saturate(1) blur(8px); } to { opacity: 1; } }
      @keyframes v3c-bg-out { from { opacity: 1; } to { opacity: 0; } }
      .v3c-bg-fallback {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        background:
          radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 60%),
          #050608;
        font-family: 'Cinzel', serif;
        font-size: 600px;
        color: color-mix(in srgb, var(--accent) 25%, transparent);
        text-shadow: 0 0 80px var(--accent);
      }
      .v3c-bg-vignette {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.75) 85%),
          linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.92) 100%);
      }
      .v3c-cosmic-stars {
        position: absolute; inset: 0;
        background-image:
          radial-gradient(1px 1px at 18% 22%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 64% 14%, rgba(255,255,255,0.6), transparent 100%),
          radial-gradient(1.5px 1.5px at 88% 38%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 12% 78%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1px 1px at 92% 82%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 92%, rgba(255,255,255,0.7), transparent 100%);
        opacity: 0.65;
        animation: v3c-stars-drift 120s linear infinite;
      }
      @keyframes v3c-stars-drift { to { transform: translate(-30px,-20px); } }

      /* Top HUD */
      .v3c-top {
        position: absolute; top: 0; left: 0; right: 0;
        z-index: 10;
        padding: 32px 64px 0;
        display: grid;
        grid-template-columns: 200px 1fr 200px;
        align-items: start;
        gap: 32px;
      }
      .v3c-back {
        display: inline-flex; align-items: center; gap: 12px;
        background: rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.18);
        color: #e8e8ec;
        font-family: 'Chakra Petch', sans-serif;
        font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase;
        padding: 12px 18px;
        cursor: pointer;
        transition: all .2s;
        backdrop-filter: blur(6px);
      }
      .v3c-back:hover { border-color: var(--accent); color: var(--accent); }
      .v3c-back .ar { font-size: 16px; }
      .v3c-title-block { text-align: center; }
      .v3c-eyebrow {
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; letter-spacing: 0.4em; opacity: 0.85;
      }
      .v3c-title {
        font-family: 'Cinzel', serif;
        font-weight: 700; font-size: 48px; letter-spacing: 0.32em;
        margin: 6px 0 4px;
        text-shadow: 0 4px 24px rgba(0,0,0,0.9), 0 0 30px color-mix(in srgb, var(--accent) 30%, transparent);
      }
      .v3c-sub-below {
        position: absolute;
        left: 50%; transform: translateX(-50%);
        top: calc(180px + 540px + 14px);
        z-index: 9;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; letter-spacing: 0.22em;
        color: rgba(255,255,255,0.65);
        text-transform: uppercase;
        text-align: center;
        text-shadow: 0 2px 12px rgba(0,0,0,0.9);
        pointer-events: none;
        white-space: nowrap;
      }
      .v3c-sub-below kbd {
        display: inline-block; padding: 1px 6px;
        border: 1px solid color-mix(in srgb, var(--accent) 60%, rgba(255,255,255,0.3));
        margin: 0 2px;
        color: var(--accent);
        font-family: inherit;
      }

      /* Stage */
      .v3c-stage {
        position: absolute; left: 0; right: 0;
        top: 180px; height: 520px;
        z-index: 5;
        display: flex; align-items: center; justify-content: center;
      }
      .v3c-track {
        position: relative;
        width: 100%; height: 100%;
        perspective: 1800px;
      }
      .v3c-arrow {
        position: absolute; top: 50%; transform: translateY(-50%);
        z-index: 11;
        width: 64px; height: 64px;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.18);
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        transition: all .25s;
        display: grid; place-items: center;
      }
      .v3c-arrow.left { left: 80px; }
      .v3c-arrow.right { right: 80px; }
      .v3c-arrow:hover { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 40%, transparent); transform: translateY(-50%) scale(1.05); }

      /* Carousel card */
      .v3cc {
        position: absolute;
        left: 50%; top: 50%;
        width: 280px; height: 400px;
        transform:
          translate(-50%, -50%)
          translate(var(--tx, 0), var(--ty, 0))
          translateX(calc(var(--off) * 280px))
          translateZ(calc(abs(var(--off)) * -200px))
          rotateY(calc(var(--off) * -18deg))
          scale(calc(1 - 0.12 * abs(var(--off))));
        opacity: calc(1 - 0.35 * abs(var(--off)));
        filter: blur(calc(abs(var(--off)) * 1.8px));
        border: 1px solid rgba(255,255,255,0.1);
        background: #0d0e13;
        cursor: pointer;
        overflow: hidden;
        transition: transform .65s cubic-bezier(.2,.7,.2,1), opacity .55s, filter .55s, border-color .35s, box-shadow .35s;
        will-change: transform;
      }
      .v3cc.intro { animation: v3cc-intro 1.6s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(0.04s * abs(var(--off))); }
      @keyframes v3cc-intro {
        0% { opacity: 0; transform:
          translate(-50%, -50%)
          translateX(calc(var(--off) * 280px))
          scale(0.4)
          rotateY(calc(var(--off) * -40deg)); filter: blur(20px); }
      }
      .v3cc.is-center {
        width: 400px; height: 520px;
        z-index: 20;
        border-color: var(--accent);
        box-shadow:
          0 0 0 1px var(--accent),
          0 30px 100px rgba(0,0,0,0.85),
          0 0 80px color-mix(in srgb, var(--accent) 40%, transparent);
        filter: blur(0);
        opacity: 1;
      }
      .v3cc-bg {
        position: absolute; inset: 0;
        background-size: cover; background-position: center;
        filter: brightness(0.65) saturate(1.1);
      }
      .v3cc-bg-fallback {
        position: absolute; inset: 0;
        background:
          repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 14px),
          radial-gradient(circle at center, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 65%),
          #0d0e13;
        display: grid; place-items: center;
        font-family: 'Cinzel', serif;
        font-size: 200px;
        color: var(--accent);
        text-shadow: 0 0 40px var(--accent);
      }
      .v3cc-vignette {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 100%);
      }
      .v3cc-portrait-wrap {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: grid;
        place-items: center;
        pointer-events: none;
      }
      .v3cc-portrait {
        width: 72%;
        height: 72%;
        object-fit: contain;
        opacity: 0.95;
        filter: drop-shadow(0 10px 26px rgba(0,0,0,0.88));
      }
      .v3cc.is-center .v3cc-portrait {
        width: 78%;
        height: 78%;
        filter: drop-shadow(0 16px 34px rgba(0,0,0,0.9));
      }
      .v3cc-portrait-glyph {
        font-family: 'Cinzel', serif;
        font-size: 190px;
        opacity: 0.85;
        text-shadow: 0 0 45px currentColor;
      }
      .v3cc-grid {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
        background-size: 40px 40px;
        mix-blend-mode: overlay;
        pointer-events: none;
      }
      .v3cc-holo {
        position: absolute; inset: -2px;
        background: conic-gradient(from var(--ang, 0deg),
          transparent 0deg,
          var(--accent) 30deg,
          transparent 90deg,
          color-mix(in srgb, var(--accent) 70%, white 30%) 180deg,
          transparent 240deg,
          var(--accent) 300deg,
          transparent 360deg);
        opacity: 0.45;
        filter: blur(4px);
        animation: v3cc-holo-spin 5s linear infinite;
        pointer-events: none;
        z-index: 1;
      }
      .v3cc-holo-ring {
        position: absolute; inset: 12px;
        border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
        pointer-events: none;
        animation: v3cc-ring-pulse 2.4s ease-in-out infinite;
        z-index: 2;
      }
      @keyframes v3cc-ring-pulse {
        0%, 100% { box-shadow: inset 0 0 0 0 var(--accent), inset 0 0 30px transparent; opacity: 0.5; }
        50% { box-shadow: inset 0 0 0 0 var(--accent), inset 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent); opacity: 1; }
      }
      @property --ang { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
      @keyframes v3cc-holo-spin { to { --ang: 360deg; } }

      .v3cc-sigillo {
        position: absolute; inset: 0;
        z-index: 2;
        opacity: 0.85;
      }
      .v3cc-sigillo-spin { animation: v3cc-sgl-spin 60s linear infinite; }
      @keyframes v3cc-sgl-spin { to { transform: rotate(360deg); } }

      .v3cc-name {
        position: absolute; left: 24px; right: 24px; bottom: 32px;
        z-index: 4;
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        text-align: center;
        line-height: 1.1;
        text-shadow: 0 2px 14px rgba(0,0,0,0.95);
      }
      .v3cc.is-center .v3cc-name {
        font-size: 30px;
        bottom: 48px;
        letter-spacing: 0.22em;
      }
      .v3cc-corners > span {
        position: absolute; width: 22px; height: 22px;
        border: 1.5px solid var(--accent);
        z-index: 5;
      }
      .v3cc-corners > span:nth-child(1) { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
      .v3cc-corners > span:nth-child(2) { top: -1px; right: -1px; border-left: 0; border-bottom: 0; }
      .v3cc-corners > span:nth-child(3) { bottom: -1px; left: -1px; border-right: 0; border-top: 0; }
      .v3cc-corners > span:nth-child(4) { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }

      .v3cc-scan {
        position: absolute; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
        animation: v3cc-scan 3.5s ease-in-out infinite;
        z-index: 4;
        box-shadow: 0 0 10px var(--accent);
      }
      @keyframes v3cc-scan {
        0% { top: 0; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }

      /* Side panels */
      .v3c-side {
        position: absolute;
        top: 160px; bottom: 110px;
        z-index: 8;
        width: 460px;
        perspective: 1400px;
      }
      .v3c-side-l { left: 24px; }
      .v3c-side-r { right: 24px; }
      .v3c-side-inner {
        position: relative;
        height: 100%;
        padding: 28px 26px;
        background: linear-gradient(135deg, rgba(8,9,12,0.55) 0%, rgba(8,9,12,0.35) 100%);
        border: 1px solid rgba(255,255,255,0.12);
        border-top: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        backdrop-filter: blur(8px);
        box-shadow:
          0 30px 80px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.06);
        animation: v3c-panel-in .6s cubic-bezier(.2,.7,.2,1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .v3c-side-l .v3c-side-inner {
        transform: rotateY(14deg);
        transform-origin: left center;
        border-left: 2px solid var(--accent);
      }
      .v3c-side-r .v3c-side-inner {
        transform: rotateY(-14deg);
        transform-origin: right center;
        border-right: 2px solid var(--accent);
      }
      .v3c-side-inner::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 60%);
        pointer-events: none;
      }
      @keyframes v3c-panel-in { from { opacity: 0; transform: translateY(8px); } }

      .v3c-side-eye {
        font-family: 'Share Tech Mono', monospace;
        font-size: 15px; letter-spacing: 0.26em; text-transform: uppercase;
        color: var(--accent);
        flex-shrink: 0;
      }
      .v3c-side-name {
        font-family: 'Cinzel', serif;
        font-weight: 700; font-size: 36px;
        letter-spacing: 0.06em; text-transform: uppercase;
        margin: 8px 0 14px;
        line-height: 1.1;
        flex-shrink: 0;
      }
      .v3c-side-motto {
        flex-shrink: 0;
        margin: 0 0 18px;
        font-family: 'Cinzel', serif;
        font-style: italic;
        font-size: 20px;
        line-height: 1.4;
        color: color-mix(in srgb, var(--accent) 75%, #e4e4e7);
      }
      .v3c-side-synopsis {
        flex: 1;
        min-height: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: auto;
      }
      .v3c-side-synopsis p {
        margin: 0;
        font-family: 'Cinzel', serif;
        font-size: 20px;
        line-height: 1.55;
        color: #d4d4d8;
        text-wrap: pretty;
      }
      .v3c-side-inner-tech {
        justify-content: space-between;
        gap: 12px;
      }
      .v3c-side-tech-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 18px;
        overflow: auto;
        padding-right: 2px;
      }
      .v3c-side-block .lbl,
      .v3c-side-style .lbl {
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px; letter-spacing: 0.22em; color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .v3c-side-block .txt,
      .v3c-side-style .txt {
        font-size: 18px; line-height: 1.5;
        color: #d4d4d8;
        text-wrap: pretty;
      }
      .v3c-side-meta {
        display: flex; gap: 12px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 15px; color: rgba(255,255,255,0.6);
        letter-spacing: 0.14em;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .v3c-side-meta b { color: #e8e8ec; font-weight: 600; }
      .v3c-side-meta .dot { color: rgba(255,255,255,0.3); }

      /* Named ticker */
      .v3c-ticker-named {
        position: absolute;
        bottom: 36px; left: 50%; transform: translateX(-50%);
        z-index: 9;
        display: flex; gap: 6px;
        padding: 8px 12px;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.08);
        flex-wrap: wrap;
        max-width: 90vw;
        justify-content: center;
      }
      .tkn {
        background: transparent; border: 1px solid transparent;
        cursor: pointer;
        padding: 8px 12px;
        opacity: 0.5;
        display: flex; align-items: center; gap: 8px;
        font-family: 'Share Tech Mono', monospace;
        color: rgba(255,255,255,0.75);
        transition: all .2s;
      }
      .tkn .num { font-size: 10px; opacity: 0.6; letter-spacing: 0.2em; }
      .tkn .nm { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }
      .tkn:hover { opacity: 0.9; }
      .tkn.on {
        opacity: 1;
        border-color: var(--c);
        background: color-mix(in srgb, var(--c) 14%, transparent);
        color: var(--c);
        box-shadow: 0 0 14px color-mix(in srgb, var(--c) 40%, transparent);
      }

      .v3c-bonus {
        padding: 14px 16px;
        background: rgba(0,0,0,0.55);
        border: 1px solid;
      }
      .v3c-bonus--exception {
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
          0 0 28px color-mix(in srgb, var(--accent) 18%, transparent);
      }
      .v3c-bonus-eye {
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px; letter-spacing: 0.24em; text-transform: uppercase;
      }
      .v3c-bonus-highlight {
        margin-top: 12px;
        padding: 10px 12px;
        border-left: 3px solid var(--accent);
        background: color-mix(in srgb, var(--accent) 16%, rgba(0,0,0,0.45));
      }
      .v3c-bonus-highlight-tag {
        display: block;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 6px;
      }
      .v3c-bonus-highlight p {
        margin: 0;
        font-size: 16px;
        line-height: 1.45;
        color: #fafafa;
        text-wrap: pretty;
      }
      .v3c-bonus-when {
        margin-top: 10px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 15px;
        letter-spacing: 0.04em;
        color: color-mix(in srgb, var(--accent) 80%, #fff);
        line-height: 1.4;
      }
      .v3c-bonus-explain {
        margin: 10px 0 0;
        font-size: 18px;
        line-height: 1.5;
        color: #e4e4e7;
        text-wrap: pretty;
      }
      .v3c-bonus-val {
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px;
        margin-top: 12px;
        color: rgba(255,255,255,0.5);
        letter-spacing: 0.04em;
      }

      .v3c-confirm {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: rgba(0,0,0,0.6);
        border: 1.5px solid;
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 20px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all .25s;
        overflow: hidden;
        margin-top: auto;
        width: 100%;
        color: inherit;
        flex-shrink: 0;
      }
      .v3c-confirm-bg {
        position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 25%, transparent), transparent);
        transform: translateX(-100%);
        transition: transform .6s ease;
      }
      .v3c-confirm:hover .v3c-confirm-bg { transform: translateX(100%); }
      .v3c-confirm:hover {
        box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 50%, transparent);
        background: rgba(0,0,0,0.8);
      }
      .v3c-confirm-lbl, .v3c-confirm-arr, .v3c-confirm-key { position: relative; }
      .v3c-confirm-arr { font-size: 22px; }
      .v3c-confirm-key {
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px;
        padding: 2px 8px;
        border: 1px solid currentColor;
        opacity: 0.7;
      }

      /* Intro overlay */
      .v3c-intro {
        position: absolute; inset: 0;
        z-index: 50;
        display: grid; place-items: center;
        background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 80%);
        animation: v3c-intro-fade 1.7s ease forwards;
      }
      @keyframes v3c-intro-fade {
        0% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; pointer-events: none; }
      }
      .v3c-intro-svg {
        position: absolute;
        animation: v3c-intro-zoom 1.7s cubic-bezier(.2,.7,.2,1);
      }
      @keyframes v3c-intro-zoom {
        0% { transform: scale(0.2); opacity: 0; }
        40% { opacity: 1; }
        100% { transform: scale(1.3); opacity: 0; }
      }
      .v3c-intro-spin { animation: v3c-spin 6s linear infinite; transform-origin: 400px 400px; }
      .v3c-intro-spin-r { animation: v3c-spin 6s linear infinite reverse; transform-origin: 400px 400px; }
      @keyframes v3c-spin { to { transform: rotate(360deg); } }
      .v3c-intro-glyph {
        position: relative;
        font-family: 'Cinzel', serif;
        font-size: 200px;
        text-shadow: 0 0 80px currentColor;
        animation: v3c-intro-glyph 1.7s ease;
      }
      @keyframes v3c-intro-glyph {
        0% { opacity: 0; transform: scale(0.4); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.6); filter: blur(20px); }
      }
      .v3c-intro-text {
        position: absolute;
        bottom: 28%;
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px; letter-spacing: 0.5em;
        color: rgba(255,255,255,0.85);
        animation: v3c-intro-text 1.7s ease;
      }
      @keyframes v3c-intro-text {
        0%, 30% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }

      /* Confirm transition */
      .v3c-confirming { position: absolute; inset: 0; z-index: 60; }
      .v3c-confirming-flash {
        position: absolute; inset: 0;
        background: var(--accent);
        animation: v3c-cf-flash 1.6s ease;
        mix-blend-mode: screen;
        opacity: 0;
      }
      @keyframes v3c-cf-flash {
        0% { opacity: 0; } 20% { opacity: 0.5; } 100% { opacity: 0; }
      }
      .v3c-confirming-iris {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.95);
        clip-path: circle(0% at 50% 50%);
        animation: v3c-cf-iris 1.6s cubic-bezier(.7,.05,.3,1) forwards;
      }
      @keyframes v3c-cf-iris {
        0% { clip-path: circle(0% at 50% 50%); }
        100% { clip-path: circle(140% at 50% 50%); }
      }
      .v3c-confirming-text {
        position: absolute; inset: 0;
        display: grid; place-items: center; align-content: center;
        text-align: center;
        opacity: 0;
        animation: v3c-cf-text 1.6s ease forwards;
      }
      @keyframes v3c-cf-text {
        0%, 30% { opacity: 0; transform: translateY(20px); }
        60% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
      .v3c-confirming-text .eye {
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; letter-spacing: 0.5em; margin-bottom: 12px;
      }
      .v3c-confirming-text .nm {
        font-family: 'Cinzel', serif;
        font-weight: 700; font-size: 64px;
        letter-spacing: 0.2em; text-transform: uppercase;
        text-shadow: 0 0 40px var(--accent);
      }
      .v3c-confirming-text .next {
        margin-top: 14px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; letter-spacing: 0.32em;
        color: rgba(255,255,255,0.7);
      }

      /* Scan-line overlay */
      .scan-lines {
        position: absolute; inset: 0; pointer-events: none;
        z-index: 90;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 3px,
          rgba(255,255,255,0.022) 3px,
          rgba(255,255,255,0.022) 4px
        );
        mix-blend-mode: overlay;
      }
    `}</style>
  );
}
