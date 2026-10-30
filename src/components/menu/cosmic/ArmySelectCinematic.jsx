// ============================================================
// ArmySelectCinematic.jsx — Schermata "Scegli la tua armata"
// ============================================================
// Drop-in component. È la trasposizione 1:1 dell'esplorazione V3
// approvata, con pelle Persona (DuelArmyPersonaSkin, classe .v3c--p) e
// alcune carte dell'armata (le 5 col potenziale più alto, miste per Lega).
// I testi per ogni armata (synopsis / motto / bonusExplain /
// style / tips) si modificano in `armyLore.js`.
//
// PROPOSTA IN PROVA: tre disposizioni delle carte (A ventaglio sotto
// l'emblema, B colonne ai lati, C mazzetto al posto dell'emblema), scelte
// col selettore in basso a sinistra o col tasto V. Tenere quella scelta e
// togliere le altre.
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
import { GAME_SOUND, playGame, playUiClick } from '../../../audio/gameSounds.js';
import { CardReworkP4Scaled } from '../../cards/CardReworkP4.jsx';
import { evaluateCardBalance } from '../../cosmic/DeckPreviewCosmic.jsx';

const SHOWCASE_SIZE = 5;
const CARD_VARIANTS = ['A', 'B', 'C'];
const CARD_VARIANT_LABEL = { A: 'VENTAGLIO', B: 'COLONNE', C: 'MAZZETTO' };
const CARD_VARIANT_KEY = 'satze_army_select_cards_variant';

function readCardVariant() {
  try {
    const v = localStorage.getItem(CARD_VARIANT_KEY);
    return CARD_VARIANTS.includes(v) ? v : 'A';
  } catch {
    return 'A';
  }
}

/**
 * Pool misto: per ogni Lega la carta col potenziale più alto, poi le migliori
 * in assoluto fino a SHOWCASE_SIZE. Ordinate per potenziale decrescente.
 */
function pickShowcaseCards(cards) {
  const scored = cards
    .map((card) => ({ card, value: evaluateCardBalance(card).potentialValue }))
    .sort((a, b) => b.value - a.value);
  const picked = [];
  const seenLeague = new Set();
  for (const s of scored) {
    if (seenLeague.has(s.card.league)) continue;
    seenLeague.add(s.card.league);
    picked.push(s);
  }
  for (const s of scored) {
    if (picked.length >= SHOWCASE_SIZE) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked
    .slice(0, SHOWCASE_SIZE)
    .sort((a, b) => b.value - a.value)
    .map((s) => s.card);
}
// ------------------------------------------------------------
// Adapter: traduce i dati reali del gioco nel formato usato dal V3
// ------------------------------------------------------------
function buildArmies() {
  const list = [];

  // Voce speciale "Eserciti Personalizzati" (tutti i mazzi creati dall'utente)
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
    showcase: pickShowcaseCards(
      Object.entries(ARMY_SETS).flatMap(([army, cards]) => cards.map((c) => ({ ...c, army }))),
    ),
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
      showcase: pickShowcaseCards(cards.map((c) => ({ ...c, army: armyName }))),
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
  const [cardVariant, setCardVariant] = useState(readCardVariant);
  const rootRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const queuedCursorRef = React.useRef({ x: 0, y: 0 });
  const lastCursorRef = React.useRef({ x: 0, y: 0 });
  const wheelLockRef = React.useRef(0);
  const phaseRef = React.useRef(phase);
  const idxRef = React.useRef(idx);
  const goRef = React.useRef(null);

  const total = ARMIES.length;
  const army = ARMIES[idx];
  phaseRef.current = phase;
  idxRef.current = idx;

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

  const go = useCallback((delta) => {
    const current = idxRef.current;
    const next = (current + delta + total) % total;
    playUiClick();
    setPrevIdx(current);
    setDirection(delta);
    setIdx(next);
    setAudioPulse((p) => p + 1);
  }, [total]);

  const goTo = useCallback((i) => {
    const current = idxRef.current;
    if (i === current) return;
    playUiClick();
    setPrevIdx(current);
    setDirection(i > current ? 1 : -1);
    setIdx(i);
    setAudioPulse((p) => p + 1);
  }, []);

  goRef.current = go;

  const pickCardVariant = useCallback((v) => {
    setCardVariant(v);
    try {
      localStorage.setItem(CARD_VARIANT_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);
  const cycleCardVariant = useCallback(() => {
    setCardVariant((cur) => {
      const next = CARD_VARIANTS[(CARD_VARIANTS.indexOf(cur) + 1) % CARD_VARIANTS.length];
      try {
        localStorage.setItem(CARD_VARIANT_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const confirmArmy = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    playGame(GAME_SOUND.ARMY_CONFIRM);
    setPhase('confirming');
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSelect && onSelect(army.isMixed ? null : army.name);
        });
      });
    }, 1660);
  }, [army.isMixed, army.name, onSelect]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== 'idle') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Enter') confirmArmy();
      if (e.key === 'Escape' && onBack) onBack();
      if (e.key === 'v' || e.key === 'V') cycleCardVariant();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, go, confirmArmy, cycleCardVariant]);

  // Scroll / trackpad: scorre tra le armate
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (phaseRef.current !== 'idle') return;

      const scrollable = e.target?.closest?.(
        '.v3c-side-synopsis, .v3c-side-tech-body, .v3c-ticker-named'
      );
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 1) {
        return;
      }
      if (scrollable?.classList?.contains('v3c-ticker-named')
        && scrollable.scrollWidth > scrollable.clientWidth + 1) {
        // ticker: scroll orizzontale nativo se serve; altrimenti naviga
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) return;
      }

      const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dominant) < 6) return;

      e.preventDefault();
      const now = performance.now();
      if (now - wheelLockRef.current < 260) return;
      wheelLockRef.current = now;
      goRef.current?.(dominant > 0 ? 1 : -1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Cleanup rAF cursor scheduler
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onVis = () => {
      el.classList.toggle('is-vfx-paused', document.hidden);
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`v3c v3c--p cards-${cardVariant} phase-${phase}`}
      style={{ '--accent': army.color, '--parallax-x': 0, '--parallax-y': 0 }}
      onPointerMove={updateCursor}
    >
      {/* BG layer with cross-fade between prev/current */}
      <div className="v3c-bg-layer">
        <BgImage army={ARMIES[prevIdx]} key={`prev-${prevIdx}-${audioPulse}`} kind="prev"/>
        <BgImage army={army} key={`cur-${idx}`} kind="cur"/>
        <div className="v3c-bg-vignette"/>
        <div className="v3c-cosmic-stars"/>
        <div className="v3c-p-halftone"/>
        <div className="v3c-p-stripes"/>
      </div>

      {/* Top HUD: back + title */}
      <header className="v3c-top v3c-top-clean">
        <div className="v3c-back-slot">
          <button className="v3c-back" onClick={() => { playUiClick(); onBack?.(); }}>
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
                showStack={cardVariant === 'C'}
                onClick={() => !isCenter && goTo(i)}
              />
            );
          })}
        </div>
        <NavArrow side="right" onClick={() => go(1)} accent={army.color}/>
      </div>

      {cardVariant === 'A' && <CardFan army={army} key={`fan-${idx}`}/>}
      {cardVariant === 'B' && <CardColumns army={army} key={`cols-${idx}`}/>}

      {/* Detail panel: lore + stats + bonus + confirm */}
      <DetailPanel army={army} onConfirm={confirmArmy}/>

      {/* Ticker bottom */}
      <Ticker armies={ARMIES} idx={idx} onSelect={goTo}/>

      {/* Proposta: scelta disposizione carte */}
      <div className="v3c-variant" role="radiogroup" aria-label="Disposizione carte">
        <span className="v3c-variant-lbl">CARTE <kbd>V</kbd></span>
        {CARD_VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={cardVariant === v}
            className={cardVariant === v ? 'on' : ''}
            onClick={() => { playUiClick(); pickCardVariant(v); }}
            title={CARD_VARIANT_LABEL[v]}
          >
            <span><b>{v}</b> {CARD_VARIANT_LABEL[v]}</span>
          </button>
        ))}
      </div>

      {/* Intro sigillo overlay */}
      {phase === 'intro' && <SigilloIntro accent={army.color} glyph={army.glyph}/>}

      {/* Confirm transition */}
      {phase === 'confirming' && <ConfirmTransition army={army}/>}

      <div className="scan-lines"/>

      <V3CinematicStyles/>
      <ArmySelectPersonaSkin/>
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

function CarouselCard({ army, offset, isCenter, phase, pulse, showStack = false, onClick }) {
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
      {isCenter && showStack && army.showcase?.length ? (
        <CardStack army={army}/>
      ) : (
        <div className="v3cc-portrait-wrap">
          {army.portrait
            ? <img className="v3cc-portrait" src={army.portrait} alt={army.name} draggable={false}/>
            : <div className="v3cc-portrait-glyph" style={{ color: army.color }}>{army.glyph}</div>}
        </div>
      )}

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

// ============================================================
// CARTE IN VETRINA (proposta A / B / C)
// ============================================================

function ShowcaseCard({ card, width }) {
  return (
    <div className="v3c-sc-card" style={{ width, height: Math.round((width * 330) / 230) }}>
      <CardReworkP4Scaled agent={card} width={width} preferThumb showBonus />
    </div>
  );
}

/** A — ventaglio sotto l'emblema. */
function CardFan({ army }) {
  const cards = army.showcase || [];
  if (!cards.length) return null;
  const mid = (cards.length - 1) / 2;
  return (
    <div className="v3c-fan" style={{ '--accent': army.color }} aria-label="Carte di punta">
      <div className="v3c-sc-tag">CARTE DI PUNTA</div>
      <div className="v3c-fan-row">
        {cards.map((c, i) => {
          const d = i - mid;
          return (
            <div
              key={c.id}
              className="v3c-fan-slot"
              style={{
                '--rot': `${d * 7}deg`,
                '--lift': `${Math.abs(d) * 12}px`,
                '--delay': `${i * 0.05}s`,
                zIndex: 10 - Math.abs(Math.round(d)),
              }}
            >
              <ShowcaseCard card={c} width={128}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** B — due colonne di carte che scorrono ai bordi. */
function CardColumns({ army }) {
  const cards = army.showcase || [];
  if (!cards.length) return null;
  const left = cards.filter((_, i) => i % 2 === 0);
  const right = cards.filter((_, i) => i % 2 === 1);
  const column = (list, side) => (
    <div className={`v3c-col v3c-col--${side}`} aria-hidden="true">
      <div className="v3c-col-track">
        {[...list, ...list, ...list, ...list].map((c, i) => (
          <ShowcaseCard key={`${c.id}-${i}`} card={c} width={140}/>
        ))}
      </div>
    </div>
  );
  return (
    <div className="v3c-cols" style={{ '--accent': army.color }}>
      {column(left, 'l')}
      {column(right.length ? right : left, 'r')}
    </div>
  );
}

/** C — mazzetto di carte al centro, emblema sopra. */
function CardStack({ army }) {
  const cards = army.showcase || [];
  const mid = (cards.length - 1) / 2;
  return (
    <div className="v3c-stack">
      <div className="v3c-stack-cards">
        {cards.map((c, i) => {
          const d = i - mid;
          return (
            <div
              key={c.id}
              className="v3c-stack-slot"
              style={{
                '--rot': `${d * 9}deg`,
                '--dx': `${d * 46}px`,
                '--dy': `${Math.abs(d) * 14}px`,
                '--delay': `${i * 0.05}s`,
                zIndex: 10 - Math.abs(Math.round(d)),
              }}
            >
              <ShowcaseCard card={c} width={150}/>
            </div>
          );
        })}
      </div>
      <div className="v3c-stack-emblem">
        {army.portrait
          ? <img src={army.portrait} alt="" draggable={false}/>
          : <span style={{ color: army.color }}>{army.glyph}</span>}
      </div>
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
  const railRef = React.useRef(null);
  const activeRef = React.useRef(null);

  useEffect(() => {
    const rail = railRef.current;
    const active = activeRef.current;
    if (!rail || !active) return;
    const railRect = rail.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const delta =
      activeRect.left + activeRect.width / 2 - (railRect.left + railRect.width / 2);
    rail.scrollBy({ left: delta, behavior: 'smooth' });
  }, [idx]);

  return (
    <div className="v3c-ticker-named" ref={railRef}>
      {armies.map((a, i) => {
        const active = i === idx;
        return (
          <button
            key={a.id}
            ref={active ? activeRef : null}
            className={`tkn ${active ? 'on' : ''}`}
            onClick={() => onSelect(i)}
            style={{ '--c': a.color }}
          >
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
      .v3c.is-vfx-paused .v3cc-holo,
      .v3c.is-vfx-paused .v3cc-holo-ring,
      .v3c.is-vfx-paused .v3cc-scan,
      .v3c.is-vfx-paused .v3cc-sigillo-spin {
        animation-play-state: paused !important;
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
        background: rgba(0,0,0,0.72);
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
        background: rgba(0,0,0,0.72);
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
        opacity: calc(1 - 0.48 * abs(var(--off)));
        border: 1px solid rgba(255,255,255,0.1);
        background: #0d0e13;
        cursor: pointer;
        overflow: hidden;
        transition: transform .65s cubic-bezier(.2,.7,.2,1), opacity .55s, border-color .35s, box-shadow .35s;
        will-change: transform;
      }
      .v3cc.intro { animation: v3cc-intro 1.6s cubic-bezier(.2,.7,.2,1) backwards; animation-delay: calc(0.04s * abs(var(--off))); }
      @keyframes v3cc-intro {
        0% { opacity: 0; transform:
          translate(-50%, -50%)
          translateX(calc(var(--off) * 280px))
          scale(0.4)
          rotateY(calc(var(--off) * -40deg)); }
      }
      .v3cc.is-center {
        width: 400px; height: 520px;
        z-index: 20;
        border-color: var(--accent);
        box-shadow:
          0 0 0 1px var(--accent),
          0 30px 100px rgba(0,0,0,0.85),
          0 0 80px color-mix(in srgb, var(--accent) 40%, transparent);
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
        opacity: 0.4;
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
        background: linear-gradient(135deg, rgba(8,9,12,0.88) 0%, rgba(8,9,12,0.78) 100%);
        border: 1px solid rgba(255,255,255,0.12);
        border-top: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
        box-shadow:
          0 30px 80px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .v3c.phase-intro .v3c-side-inner {
        animation: v3c-panel-in .6s cubic-bezier(.2,.7,.2,1);
      }
      .v3c-side-l .v3c-side-inner {
        --panel-ry: 14deg;
        transform: rotateY(14deg);
        transform-origin: left center;
        border-left: 2px solid var(--accent);
      }
      .v3c-side-r .v3c-side-inner {
        --panel-ry: -14deg;
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
      @keyframes v3c-panel-in {
        from { opacity: 0; transform: translateY(8px) rotateY(var(--panel-ry, 0deg)); }
        to { opacity: 1; transform: translateY(0) rotateY(var(--panel-ry, 0deg)); }
      }

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
        background: rgba(0,0,0,0.78);
        border: 1px solid rgba(255,255,255,0.08);
        flex-wrap: nowrap;
        max-width: min(90vw, 1100px);
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--accent) 50%, transparent) transparent;
      }
      .v3c-ticker-named::-webkit-scrollbar { height: 4px; }
      .v3c-ticker-named::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .v3c-ticker-named .tkn { flex: 0 0 auto; }
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

// ============================================================
// PELLE PERSONA (classe .v3c--p) + carte in vetrina
// ============================================================

function ArmySelectPersonaSkin() {
  return (
    <style>{`
      .v3c.v3c--p { --p-ink: #f5f3eb; --p-void: #050507; }
      .v3c--p kbd {
        display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 5px;
        background: var(--p-ink); color: var(--p-void); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      /* Fondo */
      .v3c--p .v3c-p-halftone {
        position: absolute; inset: 0; opacity: 0.22; pointer-events: none;
        background-image: radial-gradient(circle, var(--accent) 1.3px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(160deg, #000 0%, transparent 30%, transparent 70%, #000 100%);
        mask-image: linear-gradient(160deg, #000 0%, transparent 30%, transparent 70%, #000 100%);
      }
      .v3c--p .v3c-p-stripes {
        position: absolute; inset: 0; opacity: 0.05; pointer-events: none;
        background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px);
      }

      /* Testata */
      .v3c--p .v3c-back {
        border: 0; background: var(--p-void); color: var(--p-ink);
        font-weight: 700; font-style: italic; font-size: 20px; letter-spacing: 0.08em;
        padding: 10px 24px 10px 18px;
        transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .v3c--p .v3c-back > * { display: inline-block; transform: skewX(14deg); }
      .v3c--p .v3c-back:hover { color: var(--p-ink); border: 0; transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--accent); }
      .v3c--p .v3c-title-block { transform: rotate(-2deg); }
      .v3c--p .v3c-eyebrow {
        display: inline-block; background: var(--accent); color: var(--p-void) !important;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.26em;
        padding: 2px 12px; transform: skewX(-14deg); opacity: 1;
      }
      .v3c--p .v3c-title {
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic;
        font-size: 64px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase;
        margin: 4px 0 0;
        text-shadow: 5px 5px 0 var(--accent), 9px 9px 0 var(--p-void);
      }
      .v3c--p .v3c-sub-below {
        background: rgba(5,5,7,0.85); color: rgba(245,243,235,0.8);
        font-family: 'Chakra Petch', sans-serif; font-weight: 600; letter-spacing: 0.14em;
        padding: 4px 14px;
      }
      .v3c--p .v3c-sub-below kbd { border: 0; color: var(--p-void); }

      /* Frecce */
      .v3c--p .v3c-arrow {
        border: 0; background: var(--p-void); color: var(--p-ink);
        transform: translateY(-50%) skewX(-12deg);
        box-shadow: 5px 5px 0 var(--accent);
      }
      .v3c--p .v3c-arrow svg circle { display: none; }
      .v3c--p .v3c-arrow:hover {
        background: var(--accent); color: var(--p-void);
        transform: translateY(-50%) skewX(-12deg) translate(-2px,-2px);
        box-shadow: 7px 7px 0 var(--p-ink);
      }

      /* Carosello */
      .v3c--p .v3cc { border: 2px solid rgba(245,243,235,0.18); }
      .v3c--p .v3cc.is-center {
        border: 0;
        box-shadow: 0 0 0 4px var(--p-ink), 16px 16px 0 4px var(--accent), 0 30px 90px rgba(0,0,0,0.8);
      }
      .v3c--p .v3cc-corners { display: none; }
      .v3c--p .v3cc-name {
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic;
        letter-spacing: 0.02em; color: var(--p-ink) !important;
      }
      .v3c--p .v3cc.is-center .v3cc-name {
        left: 50%; right: auto; bottom: 30px; width: max-content; max-width: 360px;
        transform: translateX(-50%) rotate(-3deg);
        background: var(--p-ink); color: var(--p-void) !important;
        font-size: 30px; letter-spacing: 0; padding: 6px 18px; line-height: 1.05;
        box-shadow: 6px 6px 0 var(--accent);
        text-shadow: none;
      }

      /* Pannelli laterali */
      .v3c--p .v3c-side-inner {
        background: rgba(5,5,7,0.92); border: 0;
        box-shadow: 12px 12px 0 rgba(0,0,0,0.55);
      }
      .v3c--p .v3c-side-inner::before { display: none; }
      .v3c--p .v3c-side-l .v3c-side-inner { border-left: 6px solid var(--accent); }
      .v3c--p .v3c-side-r .v3c-side-inner { border-right: 6px solid var(--accent); }
      .v3c--p .v3c-side-eye {
        align-self: flex-start; background: var(--accent); color: var(--p-void);
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.24em;
        padding: 2px 12px; transform: skewX(-14deg);
      }
      .v3c--p .v3c-side-name {
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic;
        font-size: 42px; letter-spacing: -0.01em; line-height: 1;
        text-shadow: 4px 4px 0 var(--accent);
      }
      .v3c--p .v3c-side-motto {
        align-self: flex-start;
        background: var(--p-ink); color: var(--p-void);
        font-family: 'Chakra Petch', sans-serif; font-weight: 600; font-size: 17px; line-height: 1.3;
        padding: 6px 14px; transform: rotate(-1.5deg);
        box-shadow: 4px 4px 0 var(--accent);
      }
      .v3c--p .v3c-side-synopsis p {
        font-family: 'Chakra Petch', sans-serif; font-size: 17px; line-height: 1.55; color: rgba(245,243,235,0.86);
      }
      .v3c--p .v3c-bonus {
        border: 0 !important; background: var(--p-ink); color: var(--p-void);
        box-shadow: 6px 6px 0 var(--accent);
      }
      .v3c--p .v3c-bonus-eye {
        display: inline-block; background: var(--p-void); color: var(--p-ink) !important;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.2em;
        padding: 2px 10px; transform: skewX(-14deg);
      }
      .v3c--p .v3c-bonus-when { font-family: 'Chakra Petch', sans-serif; font-style: italic; font-weight: 600; color: rgba(5,5,7,0.7); }
      .v3c--p .v3c-bonus-explain { color: var(--p-void); font-weight: 600; }
      .v3c--p .v3c-bonus-val {
        display: inline-block; background: var(--p-void); color: var(--p-ink);
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; padding: 2px 10px; transform: skewX(-12deg);
      }
      .v3c--p .v3c-bonus-highlight { background: color-mix(in srgb, var(--accent) 25%, var(--p-ink)); border-left-color: var(--p-void); }
      .v3c--p .v3c-bonus-highlight-tag { color: var(--p-void); font-weight: 700; }
      .v3c--p .v3c-bonus-highlight p { color: var(--p-void); }
      .v3c--p .v3c-side-block .lbl {
        display: inline-block; background: var(--accent); color: var(--p-void);
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.22em;
        padding: 2px 10px; transform: skewX(-14deg);
      }
      .v3c--p .v3c-side-block .txt { font-size: 16px; color: rgba(245,243,235,0.88); }
      .v3c--p .v3c-side-meta { font-family: 'Chakra Petch', sans-serif; font-size: 15px; border-top-color: rgba(245,243,235,0.14); }
      .v3c--p .v3c-side-meta b { font-size: 20px; font-style: italic; }
      .v3c--p .v3c-confirm {
        border: 0 !important; background: var(--accent); color: var(--p-void) !important;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic; font-size: 34px; letter-spacing: 0.02em;
        padding: 12px 22px; transform: skewX(-12deg);
        box-shadow: 7px 7px 0 var(--p-ink);
        overflow: visible;
      }
      .v3c--p .v3c-confirm-bg { display: none; }
      .v3c--p .v3c-confirm > * { transform: skewX(12deg); }
      .v3c--p .v3c-confirm:hover { background: var(--accent); transform: skewX(-12deg) translate(-3px,-3px); box-shadow: 11px 11px 0 var(--p-ink); }
      .v3c--p .v3c-confirm-key { border: 0; opacity: 1; background: var(--p-void); color: var(--p-ink); font-family: 'Chakra Petch', sans-serif; font-style: normal; font-weight: 700; }

      /* Elenco armate in basso */
      .v3c--p .v3c-ticker-named { background: var(--p-void); border: 0; border-top: 3px solid var(--accent); padding: 8px 14px; gap: 6px; }
      .v3c--p .tkn {
        opacity: 1; border: 0; padding: 7px 12px;
        background: #111116; color: rgba(245,243,235,0.65);
        border-left: 4px solid var(--c);
        font-family: 'Chakra Petch', sans-serif; transform: skewX(-12deg);
      }
      .v3c--p .tkn > * { transform: skewX(12deg); }
      .v3c--p .tkn .nm { font-weight: 600; font-size: 13px; letter-spacing: 0.04em; }
      .v3c--p .tkn:hover { color: var(--p-ink); background: #1c1c23; }
      .v3c--p .tkn.on {
        background: var(--c); color: var(--p-void); border-left-color: var(--p-ink);
        box-shadow: 3px 3px 0 var(--p-ink); font-weight: 700;
      }

      /* Conferma */
      .v3c--p .v3c-confirming-text .eye {
        background: var(--accent); color: var(--p-void) !important;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 0.4em;
        padding: 4px 18px; transform: skewX(-14deg);
      }
      .v3c--p .v3c-confirming-text .nm {
        background: var(--p-ink); color: var(--p-void);
        font-family: 'Chakra Petch', sans-serif; font-style: italic; font-size: 72px; letter-spacing: 0;
        padding: 10px 36px; margin-top: 10px; transform: rotate(-3deg);
        box-shadow: 12px 12px 0 var(--accent); text-shadow: none;
      }
      .v3c--p .v3c-confirming-text .next { margin-top: 22px; font-family: 'Chakra Petch', sans-serif; font-weight: 600; }

      /* ---------- Carte in vetrina ---------- */
      .v3c-sc-card { position: relative; filter: drop-shadow(6px 6px 0 rgba(0,0,0,0.75)); }
      .v3c-sc-tag {
        display: inline-block; background: var(--accent); color: #050507;
        font-weight: 700; font-size: 12px; letter-spacing: 0.24em; padding: 2px 12px; transform: skewX(-14deg);
      }

      /* A — ventaglio */
      .v3c--p.cards-A .v3c-sub-below { display: none; }
      .v3c-fan {
        position: absolute; left: 50%; top: 712px; z-index: 9; transform: translateX(-50%);
        display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none;
      }
      .v3c-fan-row { display: flex; align-items: flex-start; }
      .v3c-fan-slot {
        margin: 0 -14px; transform: translateY(var(--lift)) rotate(var(--rot)); transform-origin: 50% 120%;
        animation: v3c-deal .45s cubic-bezier(.2,1.2,.4,1) var(--delay) both;
      }
      @keyframes v3c-deal { from { opacity: 0; transform: translateY(-60px) rotate(0deg) scale(0.8); } }

      /* B — colonne ai bordi (pannelli un po' più stretti e rientrati) */
      .v3c--p.cards-B .v3c-side { width: 410px; }
      .v3c--p.cards-B .v3c-side-l { left: 172px; }
      .v3c--p.cards-B .v3c-side-r { right: 172px; }
      .v3c--p.cards-B .v3c-arrow.left { left: 596px; }
      .v3c--p.cards-B .v3c-arrow.right { right: 596px; }
      .v3c-cols { position: absolute; inset: 0; z-index: 7; pointer-events: none; }
      .v3c-col {
        position: absolute; top: 0; bottom: 0; width: 140px; overflow: hidden;
        -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
      }
      .v3c-col--l { left: 18px; }
      .v3c-col--r { right: 18px; }
      .v3c-col-track { display: flex; flex-direction: column; gap: 18px; animation: v3c-col-up 26s linear infinite; }
      .v3c-col--r .v3c-col-track { animation-direction: reverse; }
      .v3c-col--l .v3c-sc-card { transform: rotate(-4deg); }
      .v3c-col--r .v3c-sc-card { transform: rotate(4deg); }
      @keyframes v3c-col-up { to { transform: translateY(-50%); } }

      /* C — mazzetto al centro */
      .v3c-stack { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
      .v3c-stack-cards { position: absolute; left: 50%; top: 150px; width: 0; height: 215px; }
      .v3c-stack-slot {
        position: absolute; left: -75px; top: 0;
        transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); transform-origin: 50% 110%;
        animation: v3c-deal .45s cubic-bezier(.2,1.2,.4,1) var(--delay) both;
      }
      .v3c-stack-emblem {
        position: absolute; left: 50%; top: 26px; width: 118px; height: 118px; transform: translateX(-50%);
        display: grid; place-items: center; border-radius: 50%;
        background: #050507; box-shadow: 0 0 0 4px #f5f3eb, 6px 6px 0 4px var(--accent);
      }
      .v3c-stack-emblem img { width: 92px; height: 92px; object-fit: contain; }
      .v3c-stack-emblem span { font-size: 60px; line-height: 1; }

      /* Selettore proposta */
      .v3c-variant {
        position: absolute; left: 24px; bottom: 30px; z-index: 12;
        display: flex; align-items: center; gap: 6px;
        background: #050507; padding: 8px 12px; box-shadow: 5px 5px 0 var(--accent);
        transform: skewX(-10deg);
      }
      .v3c-variant > * { transform: skewX(10deg); }
      .v3c-variant-lbl { display: inline-flex; align-items: center; gap: 6px; margin-right: 6px; font-weight: 700; font-size: 12px; letter-spacing: 0.2em; color: #f5f3eb; }
      .v3c-variant button {
        border: 0; cursor: pointer; padding: 5px 10px; background: #1c1c23; color: rgba(245,243,235,0.7);
        font-family: 'Chakra Petch', sans-serif; font-size: 12px; letter-spacing: 0.08em;
      }
      .v3c-variant button b { font-size: 15px; font-style: italic; margin-right: 2px; }
      .v3c-variant button.on { background: var(--accent); color: #050507; font-weight: 700; }

      @media (prefers-reduced-motion: reduce) {
        .v3c-col-track, .v3c-fan-slot, .v3c-stack-slot { animation: none !important; }
      }
    `}</style>
  );
}
