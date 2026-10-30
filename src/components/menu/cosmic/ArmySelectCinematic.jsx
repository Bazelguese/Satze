// ============================================================
// ArmySelectCinematic.jsx — Schermata "Scegli la tua armata"
// ============================================================
// Stile Persona, costruita attorno a un carosello di carte-armata, con le
// 5 carte di punta di ogni armata (potenziale più alto, miste per Lega).
// La storia lunga sta nel pannello DOSSIER (tasto S).
// I testi per ogni armata (synopsis / motto / bonusExplain /
// style / tips) si modificano in `armyLore.js`.
//
// PROPOSTA IN PROVA: tre layout (1 PALCO carosello orizzontale, 2 RUOTA
// carosello ad arco verticale, 3 MANO armate come mano di carte), scelti col
// selettore in alto a destra o coi tasti 1/2/3 · V. Tenere quello scelto e
// togliere gli altri.
//
// Props:
//   onSelect(armyName: string | null)  // null = "Eserciti Personalizzati"
//   onBack()                           // torna al menu
//
// Si renderizza fullscreen (position: fixed). Renderizzala al livello del
// routing, NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
const LAYOUTS = ['palco', 'ruota', 'mano'];
const LAYOUT_LABEL = { palco: 'PALCO', ruota: 'RUOTA', mano: 'MANO' };
const LAYOUT_KEY = 'satze_army_select_layout';

function readLayout() {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return LAYOUTS.includes(v) ? v : 'palco';
  } catch {
    return 'palco';
  }
}

function saveLayout(v) {
  try {
    localStorage.setItem(LAYOUT_KEY, v);
  } catch {
    /* ignore */
  }
}

/** Offset con wrap-around: l'armata selezionata è 0, le vicine ±1, ±2… */
function wrapOffset(i, idx, total) {
  const half = Math.floor(total / 2);
  return ((i - idx + total + half) % total) - half;
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
  const total = ARMIES.length;
  const [idx, setIdx] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle -> confirming
  const [layout, setLayout] = useState(readLayout);
  const [dossier, setDossier] = useState(false);
  /** Passi cumulativi della ruota (senza wrap): gira sempre dal lato più corto. */
  const [spin, setSpin] = useState(1);
  const rootRef = useRef(null);
  const wheelLockRef = useRef(0);
  const stateRef = useRef({});

  const army = ARMIES[idx];
  stateRef.current = { phase, dossier, idx };

  const goTo = useCallback((i) => {
    if (stateRef.current.phase !== 'idle') return;
    const next = (i + total) % total;
    if (next === stateRef.current.idx) return;
    playUiClick();
    setSpin((sp) => sp + wrapOffset(next, stateRef.current.idx, total));
    setIdx(next);
  }, [total]);

  const go = useCallback((delta) => goTo(stateRef.current.idx + delta), [goTo]);

  const pickLayout = useCallback((v) => {
    setLayout(v);
    saveLayout(v);
  }, []);

  const confirmArmy = useCallback(() => {
    if (stateRef.current.phase !== 'idle') return;
    playGame(GAME_SOUND.ARMY_CONFIRM);
    setDossier(false);
    setPhase('confirming');
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSelect && onSelect(army.isMixed ? null : army.name);
        });
      });
    }, 1660);
  }, [army.isMixed, army.name, onSelect]);

  const toggleDossier = useCallback(() => {
    if (stateRef.current.phase !== 'idle') return;
    playUiClick();
    setDossier((d) => !d);
  }, []);

  // Tastiera
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (stateRef.current.phase !== 'idle') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); go(-1); }
      else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); go(1); }
      else if (k === 'Enter') { e.preventDefault(); confirmArmy(); }
      else if (k === 's') toggleDossier();
      else if (k === 'Escape') {
        if (stateRef.current.dossier) setDossier(false);
        else if (onBack) onBack();
      } else if (k === 'v') {
        setLayout((cur) => {
          const next = LAYOUTS[(LAYOUTS.indexOf(cur) + 1) % LAYOUTS.length];
          saveLayout(next);
          return next;
        });
      } else if (k === '1' || k === '2' || k === '3') pickLayout(LAYOUTS[Number(k) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, confirmArmy, toggleDossier, pickLayout, onBack]);

  // Rotella / trackpad: scorre tra le armate (non dentro il dossier)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (stateRef.current.phase !== 'idle') return;
      if (e.target?.closest?.('.asx-dossier, .asx-scroll')) return;
      const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dominant) < 6) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelLockRef.current < 220) return;
      wheelLockRef.current = now;
      go(dominant > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [go]);

  const shared = { armies: ARMIES, idx, army, spin, goTo, onConfirm: confirmArmy, onDossier: toggleDossier };

  return (
    <div ref={rootRef} className={`asx asx--${layout}`} style={{ '--accent': army.color }}>
      <div className="asx-bg" aria-hidden="true">
        {army.bg && <div className="asx-bg-art" key={army.id} style={{ backgroundImage: `url('${army.bg}')` }} />}
        <div className="asx-bg-tone" />
        <div className="asx-bg-halftone" />
        <div className="asx-bg-stripes" />
      </div>

      <button type="button" className="asx-back" onClick={() => { playUiClick(); onBack?.(); }}>
        <span className="key">ESC</span><span className="lbl">MENU</span>
      </button>

      <header className="asx-title">
        <div className="asx-eyebrow"><span>FASE I · SCHIERAMENTO</span></div>
        <h1>SCEGLI LA TUA ARMATA</h1>
      </header>

      <div className="asx-topright">
        <div className="asx-layouts" role="radiogroup" aria-label="Layout in prova">
          <span className="lbl">LAYOUT <kbd>V</kbd></span>
          {LAYOUTS.map((v, i) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={layout === v}
              className={layout === v ? 'on' : ''}
              onClick={() => { playUiClick(); pickLayout(v); }}
            >
              <span><b>{i + 1}</b> {LAYOUT_LABEL[v]}</span>
            </button>
          ))}
        </div>
        <div className="asx-hints">
          <span><kbd>{layout === 'ruota' ? '↑' : '←'}</kbd><kbd>{layout === 'ruota' ? '↓' : '→'}</kbd>ARMATA</span>
          <span><kbd>S</kbd>DOSSIER</span>
          <span><kbd>↵</kbd>SCHIERA</span>
        </div>
      </div>

      {layout === 'palco' && <LayoutPalco {...shared} />}
      {layout === 'ruota' && <LayoutRuota {...shared} />}
      {layout === 'mano' && <LayoutMano {...shared} />}

      {dossier && <Dossier army={army} onClose={() => setDossier(false)} />}
      {phase === 'confirming' && <ConfirmTransition army={army} />}

      <ArmySelectStyles />
    </div>
  );
}

// ============================================================
// PEZZI COMUNI
// ============================================================

/** Carta-armata del carosello: sfondo d'armata, emblema, targa nome. */
function ArmyCard({ army, number, selected = false, compact = false, onClick }) {
  return (
    <button
      type="button"
      className={`asx-acard${selected ? ' on' : ''}${compact ? ' compact' : ''}`}
      style={{ '--c': army.color }}
      onClick={onClick}
      tabIndex={selected ? 0 : -1}
      aria-label={army.name}
    >
      <span className="asx-acard-bg" style={army.bg ? { backgroundImage: `url('${army.bg}')` } : undefined} />
      <span className="asx-acard-tone" />
      <span className="asx-acard-num">{String(number).padStart(2, '0')}</span>
      <span className="asx-acard-emblem">
        {army.portrait
          ? <img src={army.portrait} alt="" draggable={false} />
          : <span className="glyph">{army.glyph}</span>}
      </span>
      <span className="asx-acard-name"><span>{army.name}</span></span>
    </button>
  );
}

function ShowcaseCard({ card, width }) {
  return (
    <div className="asx-sc" style={{ width, height: Math.round((width * 330) / 230) }}>
      <CardReworkP4Scaled agent={card} width={width} preferThumb showBonus />
    </div>
  );
}

function BonusPlate({ army, compact = false }) {
  return (
    <div className={`asx-bonus${compact ? ' compact' : ''}`}>
      <div className="asx-chip asx-chip--dark">BONUS · {army.bonusLabel}</div>
      {army.bonusHighlight && (
        <div className="asx-bonus-hl"><b>DIVERSO DALLE ALTRE</b> {army.bonusHighlight}</div>
      )}
      {army.bonusWhen && <p className="asx-bonus-when">{army.bonusWhen}</p>}
      {army.bonusExplain && <p className="asx-bonus-explain">{army.bonusExplain}</p>}
      {army.bonus && <div className="asx-bonus-val">{army.bonus}</div>}
    </div>
  );
}

function NamePlate({ army, number }) {
  return (
    <div className="asx-name">
      <div className="asx-name-top">
        <span className="asx-chip">{String(number).padStart(2, '0')} · {army.glyph}</span>
        {!army.isMixed && <span className="asx-name-meta">{army.cards} carte · {army.decks} eserciti</span>}
      </div>
      <h2 className={army.name.length > 18 ? 'long' : ''}>{army.name}</h2>
      {army.motto && <div className="asx-motto">“{army.motto}”</div>}
    </div>
  );
}

function ConfirmButton({ onConfirm, onDossier }) {
  return (
    <div className="asx-actions">
      <button type="button" className="asx-dossier-btn" onClick={onDossier}>
        <span><kbd>S</kbd> DOSSIER</span>
      </button>
      <button type="button" className="asx-confirm" onClick={onConfirm}>
        <span className="in"><span>SCHIERA</span><kbd>↵</kbd></span>
      </button>
    </div>
  );
}

function TextPanel({ label, text }) {
  if (!text) return null;
  return (
    <div className="asx-panel">
      <div className="asx-chip">{label}</div>
      <p>{text}</p>
    </div>
  );
}

// ============================================================
// LAYOUT 1 — PALCO: carosello orizzontale, carte a corona
// ============================================================

function LayoutPalco({ armies, idx, army, goTo, onConfirm, onDossier }) {
  const total = armies.length;
  const cards = army.showcase || [];
  const mid = (cards.length - 1) / 2;
  return (
    <>
      <div className="asx-palco-stage">
        <div className="asx-palco-crown" key={`crown-${army.id}`} aria-hidden="true">
          {cards.map((c, i) => (
            <div key={c.id} className="asx-palco-crown-slot" style={{ '--d': i - mid, '--delay': `${i * 0.05}s` }}>
              <ShowcaseCard card={c} width={160} />
            </div>
          ))}
        </div>
        {armies.map((a, i) => {
          const off = wrapOffset(i, idx, total);
          if (Math.abs(off) > 3) return null;
          return (
            <div
              key={a.id}
              className="asx-palco-slot"
              style={{ '--off': off, '--abs': Math.abs(off), zIndex: off === 0 ? 20 : 10 - Math.abs(off) }}
            >
              <ArmyCard army={a} number={i + 1} selected={off === 0} onClick={() => goTo(i)} />
            </div>
          );
        })}
      </div>

      <div className="asx-palco-strip" key={`strip-${army.id}`}>
        <NamePlate army={army} number={idx + 1} />
        <BonusPlate army={army} />
        <ConfirmButton onConfirm={onConfirm} onDossier={onDossier} />
      </div>
    </>
  );
}

// ============================================================
// LAYOUT 2 — RUOTA: carosello ad arco a sinistra, scheda a destra
// ============================================================

// Geometria della ruota (px, centro fuori schermo a sinistra).
const WHEEL_CX = -220;
const WHEEL_CY = 540;
const HUB_R = 360;       // mozzo scuro
const WEDGE_RI = 410;    // spicchi: raggio interno
const WEDGE_RO = 700;    // spicchi: raggio esterno
const WEDGE_GAP = 2;   // gradi di vuoto tra uno spicchio e l'altro
const WEDGE_POP = 34;    // quanto sporge lo spicchio scelto
const CARDS_R = 842;     // arco delle carte di punta
const CARDS_STEP = 14.5; // gradi tra una carta e l'altra
const CARD_W = 150;

const rad = (deg) => (deg * Math.PI) / 180;
const polar = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];

/** Settore di corona circolare centrato sull'angolo 0, ampio 2*half gradi. */
function sectorPath(ri, ro, half) {
  const [ox1, oy1] = polar(ro, -half);
  const [ox2, oy2] = polar(ro, half);
  const [ix2, iy2] = polar(ri, half);
  const [ix1, iy1] = polar(ri, -half);
  return `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${ro} ${ro} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ri} ${ri} 0 0 0 ${ix1} ${iy1} Z`;
}

/** Arco (senso orario): serve a textPath e alle pennellate. */
function arcPath(r, from, to) {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function LayoutRuota({ armies, idx, army, spin, goTo, onConfirm, onDossier }) {
  const total = armies.length;
  const step = 360 / total;
  const half = (step - WEDGE_GAP) / 2;
  const sector = sectorPath(WEDGE_RI, WEDGE_RO, half);
  const paper = sectorPath(WEDGE_RI - 12, WEDGE_RO + 14, half + 1.2);
  const cards = army.showcase || [];
  const mid = (cards.length - 1) / 2;
  const artX = WEDGE_RI * Math.cos(rad(half));
  const artH = 2 * WEDGE_RO * Math.sin(rad(half));
  const box = WEDGE_RO + 320;
  const vb = `${-box} ${-box} ${box * 2} ${box * 2}`;
  const center = { left: WHEEL_CX, top: WHEEL_CY };
  const labelR = CARDS_R + CARD_W / 2 + 34;

  return (
    <>
      <div className="asx-ruota-slab" aria-hidden="true" />

      {/* Sotto la ruota (fisso): mozzo, sagoma bianca e ombra dello spicchio scelto */}
      <div className="asx-rw-layer asx-rw-under" style={center} aria-hidden="true">
        <svg viewBox={vb} width={box * 2} height={box * 2}>
          <circle r={HUB_R} className="asx-rw-hub" />
          <path d={paper} className="asx-rw-shadow" />
          <path d={paper} className="asx-rw-paper" />
        </svg>
      </div>

      {/* La ruota che gira: solo gli spicchi */}
      <div className="asx-wheel" style={{ ...center, '--spin': spin, '--step': `${step}deg` }}>
        <svg viewBox={vb} width={box * 2} height={box * 2}>
          <defs>
            <clipPath id="asx-rw-clip"><path d={sector} /></clipPath>
            <linearGradient id="asx-rw-shade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#050507" stopOpacity="0.92" />
              <stop offset="0.45" stopColor="#050507" stopOpacity="0.35" />
              <stop offset="1" stopColor="#050507" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="asx-rw-stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="14" height="14" fill="#0d0b16" />
              <rect width="6" height="14" fill="rgba(167,139,250,0.22)" />
            </pattern>
          </defs>
          {armies.map((a, i) => {
            const on = i === idx;
            const long = a.name.length > 18;
            return (
              <g
                key={a.id}
                className={`asx-rw-wedge${on ? ' on' : ''}`}
                style={{ transform: `rotate(${i * step}deg)`, '--c': a.color }}
                onClick={() => goTo(i)}
                role="button"
                aria-label={a.name}
              >
                <g className="asx-rw-pop">
                  <g clipPath="url(#asx-rw-clip)">
                    {a.bg ? (
                      <image
                        href={a.bg}
                        x={artX}
                        y={-artH / 2}
                        width={WEDGE_RO - artX}
                        height={artH}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <rect x={WEDGE_RI - 20} y={-WEDGE_RO} width={WEDGE_RO} height={WEDGE_RO * 2} fill="url(#asx-rw-stripes)" />
                    )}
                    <path d={sector} fill="url(#asx-rw-shade)" />
                    <path d={arcPath(WEDGE_RO - 2, -half - 2, half + 2)} className="asx-rw-rim" />
                  </g>
                  {a.portrait ? (
                    <image
                      href={a.portrait}
                      x={560 - 82}
                      y={-82}
                      width="164"
                      height="164"
                      className="asx-rw-emblem"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : (
                    <text x="560" y="0" className="asx-rw-glyph">{a.glyph}</text>
                  )}
                  <text x={WEDGE_RI + 22} y="0" className="asx-rw-num">{String(i + 1).padStart(2, '0')}</text>
                  <path id={`asx-rw-name-${i}`} d={arcPath(WEDGE_RO - 32, -half, half)} fill="none" />
                  <text className={`asx-rw-name${long ? ' long' : ''}`}>
                    <textPath href={`#asx-rw-name-${i}`} startOffset="50%">{a.name}</textPath>
                  </text>
                  <path d={sector} className="asx-rw-dim" />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="asx-ruota-dial-text" style={center} aria-hidden="true">
        <svg viewBox="-340 -340 680 680" width="680" height="680">
          <defs>
            <path id="asx-ruota-text-path" d="M 0,-296 a 296,296 0 1,1 0,592 a 296,296 0 1,1 0,-592" />
          </defs>
          <text>
            <textPath href="#asx-ruota-text-path">
              {'FASE I · SCHIERAMENTO · SCEGLI LA TUA ARMATA · '.repeat(2)}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Sigillo col numero dell'armata, piantato sul bordo interno dello spicchio */}
      <div
        className="asx-rw-seal"
        key={`seal-${army.id}`}
        style={{ left: WHEEL_CX + WEDGE_RI + WEDGE_POP + 8, top: WHEEL_CY }}
        aria-hidden="true"
      >
        <Burst value={String(idx + 1).padStart(2, '0')} label="ARMATA" />
      </div>

      {cards.length > 0 && (
        <div className="asx-rw-layer asx-rw-over" style={center} aria-hidden="true">
          <svg viewBox={vb} width={box * 2} height={box * 2}>
            <path id="asx-rw-cards-label" d={arcPath(labelR, -31, 31)} fill="none" />
            <text className="asx-rw-cards-label">
              <textPath href="#asx-rw-cards-label" startOffset="50%" textAnchor="middle">CARTE DI PUNTA · POTENZIALE PIÙ ALTO</textPath>
            </text>
          </svg>
        </div>
      )}

      {cards.length > 0 && (
        <div className="asx-rw-cards" style={center} key={`cards-${army.id}`}>
          {cards.map((c, i) => (
            <div
              key={c.id}
              className="asx-rw-card-slot"
              style={{ transform: `rotate(${(i - mid) * CARDS_STEP}deg) translateX(${CARDS_R}px)`, zIndex: 10 - Math.abs(Math.round(i - mid)) }}
            >
              <div className="asx-rw-card" style={{ '--delay': `${0.12 + Math.abs(i - mid) * 0.06}s` }}>
                <ShowcaseCard card={c} width={CARD_W} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="asx-ruota-sheet" key={`sheet-${army.id}`}>
        <div className="asx-ruota-wipe" aria-hidden="true" />

        <div className="asx-ruota-head">
          <div className="asx-ruota-bignum" aria-hidden="true">{String(idx + 1).padStart(2, '0')}</div>
          <div className="asx-ruota-title">
            <div className="asx-ruota-kicker">
              <span className="asx-chip">ARMATA {army.glyph}</span>
              <span className="asx-chip asx-chip--dark">BONUS · {army.bonusLabel}</span>
            </div>
            <h2 className={army.name.length > 18 ? 'long' : ''}>{army.name}</h2>
            {army.motto && <div className="asx-motto">“{army.motto}”</div>}
          </div>
          {!army.isMixed && (
            <div className="asx-ruota-stats">
              <Burst value={army.cards} label="CARTE" />
              <Burst value={army.decks} label="ESERCITI" dark />
            </div>
          )}
        </div>

        <div className="asx-ruota-bonus">
          <span className="asx-ruota-bonus-mark" aria-hidden="true">✦</span>
          <BonusPlate army={army} />
        </div>

        <div className="asx-ruota-cols">
          <NumberedPanel n="01" label="STILE CONSIGLIATO" text={army.style} />
          <NumberedPanel n="02" label="NOTE TATTICHE" text={army.tips} />
        </div>

        <div className="asx-ruota-bottom">
          <NumberedPanel n="03" label="IN BREVE" text={army.synopsis} className="asx-npanel--clamp" />
          <ConfirmButton onConfirm={onConfirm} onDossier={onDossier} />
        </div>
      </div>
    </>
  );
}

const BURST_CLIP = 'polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)';

function Burst({ value, label, dark = false }) {
  return (
    <div className={`asx-burst${dark ? ' dark' : ''}`}>
      <span className="shape" aria-hidden="true" />
      <span className="val">{value}</span>
      <span className="lbl">{label}</span>
    </div>
  );
}

function NumberedPanel({ n, label, text, className = '' }) {
  if (!text) return null;
  return (
    <div className={`asx-npanel ${className}`}>
      <div className="asx-npanel-head">
        <span className="n">{n}</span>
        <span className="asx-chip">{label}</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

// ============================================================
// LAYOUT 3 — MANO: armate come mano di carte in basso
// ============================================================

function LayoutMano({ armies, idx, army, goTo, onConfirm, onDossier }) {
  const total = armies.length;
  const cards = army.showcase || [];
  const mid = (cards.length - 1) / 2;
  return (
    <>
      <div className="asx-mano-hero" key={`hero-${army.id}`}>
        <div className="asx-mano-burst" aria-hidden="true">
          {cards.map((c, i) => (
            <div key={c.id} className="asx-mano-burst-slot" style={{ '--d': i - mid, '--delay': `${i * 0.05}s` }}>
              <ShowcaseCard card={c} width={150} />
            </div>
          ))}
          <div className="asx-mano-emblem">
            {army.portrait
              ? <img src={army.portrait} alt="" draggable={false} />
              : <span>{army.glyph}</span>}
          </div>
        </div>
        <NamePlate army={army} number={idx + 1} />
      </div>

      <div className="asx-mano-sheet" key={`msheet-${army.id}`}>
        <BonusPlate army={army} />
        <div className="asx-mano-cols">
          <TextPanel label="STILE CONSIGLIATO" text={army.style} />
          <TextPanel label="NOTE TATTICHE" text={army.tips} />
        </div>
        <ConfirmButton onConfirm={onConfirm} onDossier={onDossier} />
      </div>

      <div className="asx-mano-hand">
        {armies.map((a, i) => {
          const off = wrapOffset(i, idx, total);
          return (
            <div
              key={a.id}
              className={`asx-mano-slot${off === 0 ? ' on' : ''}`}
              style={{ '--off': off, '--abs': Math.abs(off), zIndex: off === 0 ? 30 : 20 - Math.abs(off) }}
            >
              <ArmyCard army={a} number={i + 1} selected={off === 0} compact onClick={() => goTo(i)} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// DOSSIER + CONFERMA
// ============================================================

function Dossier({ army, onClose }) {
  const blocks = (army.synopsis || '').split(/\n\n+/).filter(Boolean);
  return (
    <div className="asx-dossier-wrap" onClick={onClose}>
      <aside className="asx-dossier" onClick={(e) => e.stopPropagation()} aria-label={`Dossier ${army.name}`}>
        <div className="asx-dossier-head">
          <span className="asx-chip">DOSSIER</span>
          <button type="button" className="asx-dossier-close" onClick={onClose}><span><kbd>ESC</kbd> CHIUDI</span></button>
        </div>
        <h3>{army.name}</h3>
        <div className="asx-scroll">
          <div className="asx-chip asx-chip--ink">{army.isMixed ? 'COSA TROVI QUI' : 'STORIA'}</div>
          {blocks.map((b, i) => <p key={i}>{b}</p>)}
          {army.style && (<><div className="asx-chip asx-chip--ink">STILE CONSIGLIATO</div><p>{army.style}</p></>)}
          {army.tips && (<><div className="asx-chip asx-chip--ink">NOTE TATTICHE</div><p>{army.tips}</p></>)}
        </div>
      </aside>
    </div>
  );
}

function ConfirmTransition({ army }) {
  return (
    <div className="asx-confirming">
      <div className="asx-confirming-blades" aria-hidden="true"><span /><span /><span /></div>
      <div className="asx-confirming-text">
        <div className="eye">SIGILLO IMPRESSO</div>
        <div className="nm">{army.name}</div>
        <div className="next">Apertura → Scelta dell&apos;esercito</div>
      </div>
    </div>
  );
}

// ============================================================
// STILI (canvas 1920×1080)
// ============================================================

function ArmySelectStyles() {
  return (
    <style>{`
      .asx {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --dim: rgba(245,243,235,0.65);
        position: fixed; inset: 0; z-index: 1000; overflow: hidden; isolation: isolate;
        background: var(--void); color: var(--ink); font-family: 'Chakra Petch', sans-serif;
      }
      .asx * { box-sizing: border-box; }
      .asx kbd {
        display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 5px;
        background: var(--ink); color: var(--void); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; font-style: normal;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }
      .asx-chip {
        display: inline-block; align-self: flex-start; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 12px; letter-spacing: 0.22em; padding: 2px 11px; transform: skewX(-14deg);
        transition: background .3s;
      }
      .asx-chip--dark { background: var(--void); color: var(--ink); }
      .asx-chip--ink { background: var(--ink); color: var(--void); margin: 14px 0 8px; }

      /* Fondo */
      .asx-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .asx-bg-art {
        position: absolute; inset: -3%; background-size: cover; background-position: center;
        filter: brightness(0.32) saturate(1.15); animation: asx-fade .6s ease both;
      }
      @keyframes asx-fade { from { opacity: 0; } }
      .asx-bg-tone {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%),
          linear-gradient(to bottom, rgba(5,5,7,0.6), rgba(5,5,7,0.15) 30%, rgba(5,5,7,0.25) 65%, rgba(5,5,7,0.92));
      }
      .asx-bg-halftone {
        position: absolute; inset: 0; opacity: 0.25;
        background-image: radial-gradient(circle, var(--accent) 1.3px, transparent 1.8px); background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(160deg, #000 0%, transparent 28%, transparent 72%, #000 100%);
        mask-image: linear-gradient(160deg, #000 0%, transparent 28%, transparent 72%, #000 100%);
      }
      .asx-bg-stripes { position: absolute; inset: 0; opacity: 0.05; background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px); }

      /* Testata */
      .asx-back {
        position: absolute; top: 26px; left: 40px; z-index: 40;
        display: inline-flex; align-items: center; gap: 12px; border: 0; cursor: pointer;
        background: var(--void); color: var(--ink); padding: 10px 26px 10px 14px;
        transform: skewX(-14deg) rotate(-2deg); box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .asx-back > * { transform: skewX(14deg); }
      .asx-back:hover { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--accent); }
      .asx-back .key { background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .asx-back .lbl { font-weight: 700; font-style: italic; font-size: 22px; letter-spacing: 0.08em; }
      .asx-title { position: absolute; top: 18px; left: 50%; z-index: 30; transform: translateX(-50%) rotate(-2deg); text-align: center; pointer-events: none; }
      .asx-eyebrow span {
        display: inline-block; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 13px; letter-spacing: 0.26em; padding: 2px 12px; transform: skewX(-14deg);
      }
      .asx-title h1 {
        margin: 2px 0 0; font-weight: 700; font-style: italic; font-size: 54px; line-height: 1; white-space: nowrap;
        text-shadow: 5px 5px 0 var(--accent), 9px 9px 0 var(--void);
      }
      .asx-topright { position: absolute; top: 24px; right: 40px; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      .asx-layouts {
        display: flex; align-items: center; gap: 6px; background: var(--void); padding: 7px 12px;
        box-shadow: 5px 5px 0 var(--accent); transform: skewX(-10deg);
      }
      .asx-layouts > * { transform: skewX(10deg); }
      .asx-layouts .lbl { display: inline-flex; align-items: center; gap: 6px; margin-right: 6px; font-weight: 700; font-size: 12px; letter-spacing: 0.2em; }
      .asx-layouts button {
        border: 0; cursor: pointer; padding: 5px 10px; background: #1c1c23; color: var(--dim);
        font-family: inherit; font-size: 12px; letter-spacing: 0.08em;
      }
      .asx-layouts button b { font-size: 15px; font-style: italic; margin-right: 2px; }
      .asx-layouts button.on { background: var(--accent); color: var(--void); font-weight: 700; }
      .asx-hints { display: flex; gap: 14px; font-weight: 700; font-style: italic; font-size: 13px; letter-spacing: 0.12em; text-shadow: 2px 2px 0 var(--void); }
      .asx-hints span { display: inline-flex; align-items: center; gap: 3px; }
      .asx-hints kbd { margin-right: 2px; }

      /* Carta-armata */
      .asx-acard {
        position: relative; display: block; width: 100%; height: 100%; padding: 0; border: 0; cursor: pointer;
        background: #0b0b10; overflow: hidden; color: inherit; font-family: inherit;
        box-shadow: 0 0 0 3px rgba(245,243,235,0.16), 8px 8px 0 rgba(0,0,0,0.6);
        transition: box-shadow .2s, transform .3s cubic-bezier(.3,1.5,.5,1);
      }
      .asx-acard-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.55) saturate(1.15); }
      .asx-acard-bg:not([style]) { background: repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 6px, transparent 6px 14px), radial-gradient(circle, color-mix(in srgb, var(--c) 30%, transparent), transparent 70%); filter: none; }
      .asx-acard-tone { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.2) 45%, transparent 70%); }
      .asx-acard-num {
        position: absolute; top: 10px; left: 10px; z-index: 2; background: var(--void); color: var(--c);
        font-family: 'Share Tech Mono', monospace; font-size: 14px; padding: 2px 8px; transform: skewX(-14deg);
      }
      .asx-acard-emblem { position: absolute; left: 10%; right: 10%; top: 12%; bottom: 30%; display: grid; place-items: center; z-index: 1; }
      .asx-acard-emblem img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.85)); }
      .asx-acard-emblem .glyph { font-size: 130px; line-height: 1; color: var(--c); text-shadow: 0 0 30px var(--c); }
      .asx-acard-name { position: absolute; left: 12px; right: 12px; bottom: 16px; z-index: 2; display: flex; justify-content: center; }
      .asx-acard-name span {
        background: var(--void); color: var(--ink); border-left: 5px solid var(--c);
        font-weight: 700; font-style: italic; font-size: 21px; line-height: 1.05; text-transform: uppercase; text-align: center;
        padding: 5px 12px; transform: skewX(-10deg);
      }
      .asx-acard:hover:not(.on) { box-shadow: 0 0 0 3px var(--c), 8px 8px 0 rgba(0,0,0,0.6); }
      .asx-acard.on { transform: rotate(-3deg); box-shadow: 0 0 0 5px var(--ink), 16px 16px 0 5px var(--c), 0 30px 80px rgba(0,0,0,0.7); }
      .asx-acard.on .asx-acard-name span { background: var(--ink); color: var(--void); box-shadow: 5px 5px 0 var(--c); border-left-color: var(--void); }
      .asx-acard.compact .asx-acard-num { font-size: 11px; top: 7px; left: 7px; }
      .asx-acard.compact .asx-acard-emblem { top: 10%; bottom: 32%; }
      .asx-acard.compact .asx-acard-emblem .glyph { font-size: 70px; }
      .asx-acard.compact .asx-acard-name { left: 6px; right: 6px; bottom: 10px; }
      .asx-acard.compact .asx-acard-name span { font-size: 13px; padding: 3px 7px; border-left-width: 3px; }

      .asx-sc { position: relative; filter: drop-shadow(6px 6px 0 rgba(0,0,0,0.7)); }

      /* Pezzi della scheda */
      .asx-name { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; animation: asx-swipe .35s cubic-bezier(.2,1,.3,1) both; }
      @keyframes asx-swipe { from { opacity: 0; transform: translateX(50px) skewX(-8deg); } }
      .asx-name-top { display: flex; align-items: center; gap: 12px; }
      .asx-name-meta { font-weight: 600; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); }
      .asx-name h2 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 64px; line-height: 0.95; letter-spacing: -0.01em; text-transform: uppercase;
        text-shadow: 5px 5px 0 var(--accent), 9px 9px 0 var(--void); transform: rotate(-2deg); transform-origin: left;
      }
      .asx-name h2.long { font-size: 48px; }
      .asx-motto {
        background: var(--ink); color: var(--void); font-weight: 600; font-style: italic; font-size: 17px;
        padding: 5px 14px; transform: skewX(-12deg) rotate(1deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .asx-bonus {
        position: relative; display: flex; flex-direction: column; gap: 6px; padding: 16px 22px 18px;
        background: var(--ink); color: var(--void); box-shadow: 9px 9px 0 var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        animation: asx-swipe .35s .05s cubic-bezier(.2,1,.3,1) both;
      }
      .asx-bonus p { margin: 0; }
      .asx-bonus-when { font-style: italic; font-weight: 600; font-size: 15px; opacity: 0.7; }
      .asx-bonus-explain { font-weight: 600; font-size: 18px; line-height: 1.35; }
      .asx-bonus.compact .asx-bonus-explain { font-size: 16px; }
      .asx-bonus-val { align-self: flex-start; margin-top: 4px; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; padding: 2px 10px; transform: skewX(-12deg); }
      .asx-bonus-hl { background: color-mix(in srgb, var(--accent) 28%, var(--ink)); padding: 6px 10px; font-size: 14px; line-height: 1.35; }
      .asx-bonus-hl b { display: block; font-size: 11px; letter-spacing: 0.18em; }
      .asx-panel {
        display: flex; flex-direction: column; gap: 8px; padding: 14px 18px; min-width: 0;
        background: rgba(5,5,7,0.9); border-left: 5px solid var(--accent);
        animation: asx-swipe .35s .1s cubic-bezier(.2,1,.3,1) both;
      }
      .asx-panel p { margin: 0; font-size: 15px; line-height: 1.5; color: rgba(245,243,235,0.88); }
      .asx-actions { display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
      .asx-dossier-btn {
        align-self: flex-end; border: 0; cursor: pointer; padding: 8px 18px; background: var(--void); color: var(--ink);
        font-family: inherit; font-weight: 700; font-size: 15px; letter-spacing: 0.14em; transform: skewX(-14deg);
        box-shadow: inset 0 0 0 2px var(--ink); transition: background .15s, color .15s;
      }
      .asx-dossier-btn > span { display: inline-flex; align-items: center; gap: 8px; transform: skewX(14deg); }
      .asx-dossier-btn:hover { background: var(--ink); color: var(--void); }
      .asx-dossier-btn:hover kbd { background: var(--void); color: var(--ink); }
      .asx-confirm { border: 0; padding: 0; cursor: pointer; background: transparent; font-family: inherit; }
      .asx-confirm .in {
        display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 96px; padding: 0 26px 0 34px;
        background: var(--accent); color: var(--void); font-weight: 700; font-style: italic; font-size: 56px;
        transform: skewX(-14deg) rotate(-2deg); box-shadow: 9px 9px 0 var(--ink);
        transition: transform .15s, box-shadow .15s, background .3s; animation: asx-ready 1.6s ease-in-out infinite;
      }
      .asx-confirm .in > * { transform: skewX(14deg); }
      .asx-confirm .in kbd { background: var(--void); color: var(--ink); font-size: 20px; min-width: 40px; height: 34px; }
      .asx-confirm:hover .in, .asx-confirm:focus-visible .in { transform: skewX(-14deg) rotate(-3deg) translate(-4px,-4px); box-shadow: 13px 13px 0 var(--ink); }
      @keyframes asx-ready { 50% { box-shadow: 9px 9px 0 var(--ink), 0 0 40px color-mix(in srgb, var(--accent) 70%, transparent); } }

      @keyframes asx-deal { from { opacity: 0; transform: translateY(60px) rotate(0deg) scale(0.85); } }

      /* ---------- 1 PALCO ---------- */
      .asx-palco-stage { position: absolute; left: 0; right: 0; top: 170px; height: 600px; z-index: 5; perspective: 1700px; }
      .asx-palco-slot {
        position: absolute; left: 50%; top: 50%; width: 350px; height: 490px; margin: -245px 0 0 -175px;
        transform: translateX(calc(var(--off) * 330px)) translateZ(calc(var(--abs) * -230px)) rotateY(calc(var(--off) * -22deg)) scale(calc(1 - var(--abs) * 0.08));
        opacity: calc(1 - var(--abs) * 0.24);
        transition: transform .5s cubic-bezier(.2,.8,.2,1), opacity .4s;
      }
      .asx-palco-crown { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 15; pointer-events: none; }
      .asx-palco-crown-slot {
        position: absolute; left: -80px; top: -270px; width: 160px;
        transform-origin: 50% 150%; transform: rotate(calc(var(--d) * 22deg)) translateY(-40px);
        animation: asx-crown .5s cubic-bezier(.2,1.2,.4,1) var(--delay) both;
      }
      @keyframes asx-crown { from { opacity: 0; transform: rotate(0deg) translateY(60px); } }
      .asx-palco-strip {
        position: absolute; left: 50px; right: 50px; bottom: 34px; z-index: 12;
        display: grid; grid-template-columns: 620px 1fr 400px; gap: 34px; align-items: end;
      }

      /* ---------- 2 RUOTA ---------- */
      .asx--ruota .asx-title { left: 880px; top: 24px; transform: rotate(-2deg); text-align: left; }
      .asx--ruota .asx-title h1 { font-size: 42px; }
      .asx-ruota-slab {
        position: absolute; top: -10%; bottom: -10%; left: 800px; right: -120px; z-index: 4;
        background: linear-gradient(100deg, rgba(5,5,7,0.94) 0%, rgba(5,5,7,0.86) 100%);
        transform: skewX(-8deg); transform-origin: top left;
        box-shadow: -14px 0 0 0 var(--accent), -26px 0 0 0 rgba(5,5,7,0.9), -34px 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent);
        transition: box-shadow .3s;
      }

      .asx-rw-layer, .asx-wheel, .asx-rw-cards, .asx-ruota-dial-text { position: absolute; width: 0; height: 0; }
      .asx-rw-layer svg, .asx-wheel svg, .asx-ruota-dial-text svg {
        position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); overflow: visible;
      }
      .asx-rw-layer { pointer-events: none; }
      .asx-rw-under { z-index: 5; }
      .asx-wheel {
        z-index: 6;
        transform: rotate(calc(var(--spin) * var(--step) * -1));
        transition: transform .65s cubic-bezier(.2,.8,.2,1);
      }
      .asx-wheel svg { pointer-events: none; }
      .asx-ruota-dial-text { z-index: 7; pointer-events: none; animation: asx-spin 120s linear infinite; }
      .asx-ruota-dial-text text {
        fill: color-mix(in srgb, var(--accent) 60%, transparent); font-family: 'Chakra Petch', sans-serif;
        font-weight: 700; font-style: italic; font-size: 28px; letter-spacing: 9px;
      }
      @keyframes asx-spin { to { transform: rotate(360deg); } }
      .asx-rw-over { z-index: 10; }

      .asx-rw-hub { fill: rgba(5,5,7,0.9); stroke: var(--accent); stroke-width: 8; transition: stroke .3s; }
      .asx-rw-shadow { fill: var(--accent); transform: translate(${WEDGE_POP + 18}px, 14px); transition: fill .3s; }
      .asx-rw-paper { fill: var(--ink); transform: translateX(${WEDGE_POP}px); }

      .asx-rw-wedge { cursor: pointer; pointer-events: auto; }
      .asx-rw-pop { transition: transform .45s cubic-bezier(.3,1.5,.5,1); }
      .asx-rw-wedge.on .asx-rw-pop { transform: translateX(${WEDGE_POP}px); }
      .asx-rw-rim { fill: none; stroke: var(--c); stroke-width: 10; }
      .asx-rw-emblem { filter: drop-shadow(0 8px 10px rgba(0,0,0,0.85)); transition: transform .45s cubic-bezier(.3,1.5,.5,1); transform-box: fill-box; transform-origin: center; transform: scale(0.82); }
      .asx-rw-wedge.on .asx-rw-emblem { transform: scale(1.05); }
      .asx-rw-glyph { fill: var(--c); font-size: 120px; text-anchor: middle; dominant-baseline: central; }
      .asx-rw-num {
        fill: var(--ink); font-family: 'Share Tech Mono', monospace; font-size: 22px; dominant-baseline: central;
        paint-order: stroke; stroke: var(--void); stroke-width: 5px; transition: opacity .2s;
      }
      .asx-rw-wedge.on .asx-rw-num { opacity: 0; }
      .asx-rw-name {
        fill: var(--ink); font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic;
        font-size: 17px; letter-spacing: 2px; text-transform: uppercase; text-anchor: middle; dominant-baseline: central;
        paint-order: stroke; stroke: var(--void); stroke-width: 5px;
      }
      .asx-rw-name.long { font-size: 13px; letter-spacing: 1px; }
      .asx-rw-dim { fill: #050507; opacity: 0.55; transition: opacity .3s; pointer-events: none; }
      .asx-rw-wedge:hover .asx-rw-dim { opacity: 0.25; }
      .asx-rw-wedge.on .asx-rw-dim { opacity: 0; }

      .asx-rw-seal {
        position: absolute; z-index: 9; pointer-events: none;
        transform: translate(-50%, -50%) rotate(-10deg);
        animation: asx-rw-stamp .45s cubic-bezier(.3,1.6,.5,1) .15s both;
      }
      @keyframes asx-rw-stamp { from { transform: translate(-50%, -50%) rotate(-50deg) scale(1.8); opacity: 0; } }

      .asx-rw-cards-label {
        fill: var(--ink); opacity: .9; font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic;
        font-size: 15px; letter-spacing: 5px; dominant-baseline: central;
      }

      .asx-rw-cards { z-index: 9; }
      .asx-rw-card-slot { position: absolute; left: 0; top: 0; width: 0; height: 0; }
      .asx-rw-card-slot:hover { z-index: 30 !important; }
      .asx-rw-card {
        position: absolute; left: ${-CARD_W / 2}px; top: ${-Math.round((CARD_W * 330) / 230) / 2}px;
        filter: drop-shadow(6px 6px 0 rgba(5,5,7,0.9));
        transition: transform .22s cubic-bezier(.3,1.5,.5,1);
        animation: asx-rw-deal .5s cubic-bezier(.2,1.2,.4,1) var(--delay) both;
      }
      .asx-rw-card:hover { transform: translateX(34px) scale(1.14); }
      @keyframes asx-rw-deal {
        from { transform: translateX(-240px) scale(0.35); opacity: 0; }
        60% { opacity: 1; }
      }

      .asx-ruota-sheet {
        position: absolute; left: 840px; right: 54px; top: 132px; bottom: 34px; z-index: 12;
        display: flex; flex-direction: column; justify-content: space-between; gap: 20px; overflow: hidden;
      }
      .asx-ruota-wipe {
        position: absolute; top: -20%; bottom: -20%; left: -30%; width: 22%; z-index: 30; pointer-events: none;
        background: var(--accent); transform: skewX(-18deg) translateX(-100%);
        animation: asx-wipe .55s cubic-bezier(.7,0,.3,1) forwards;
      }
      @keyframes asx-wipe { to { transform: skewX(-18deg) translateX(700%); } }

      .asx-ruota-head { display: grid; grid-template-columns: auto 1fr auto; align-items: end; gap: 20px; }
      .asx-ruota-bignum {
        font-weight: 700; font-style: italic; font-size: 190px; line-height: 0.78; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 3px var(--accent); transform: rotate(-6deg);
        animation: asx-swipe .35s cubic-bezier(.2,1,.3,1) both;
      }
      .asx-ruota-title { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 0; animation: asx-swipe .35s .04s cubic-bezier(.2,1,.3,1) both; }
      .asx-ruota-kicker { display: flex; gap: 8px; }
      .asx-ruota-title h2 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 74px; line-height: 0.95; letter-spacing: -0.015em; text-transform: uppercase;
        text-shadow: 5px 5px 0 var(--accent), 10px 10px 0 var(--void); transform: rotate(-2deg); transform-origin: left;
      }
      .asx-ruota-title h2.long { font-size: 54px; }
      .asx-ruota-stats { display: flex; gap: 4px; transform: rotate(-6deg); animation: asx-swipe .35s .08s cubic-bezier(.2,1,.3,1) both; }
      .asx-burst { position: relative; width: 112px; height: 112px; display: grid; place-items: center; }
      .asx-burst .shape { position: absolute; inset: 0; background: var(--ink); clip-path: ${BURST_CLIP}; filter: drop-shadow(5px 5px 0 var(--accent)); animation: asx-spin 22s linear infinite; }
      .asx-burst.dark .shape { background: var(--accent); filter: drop-shadow(5px 5px 0 var(--void)); }
      .asx-burst .val { position: relative; font-weight: 700; font-style: italic; font-size: 44px; line-height: 1; color: var(--void); transform: translateY(-6px) rotate(-6deg); }
      .asx-burst .lbl { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%) skewX(-14deg); background: var(--void); color: var(--ink); font-weight: 700; font-size: 10px; letter-spacing: 0.2em; padding: 1px 7px; }

      .asx-ruota-bonus { position: relative; padding-left: 64px; }
      .asx-ruota-bonus-mark {
        position: absolute; left: 0; top: 50%; transform: translateY(-50%) rotate(-12deg);
        font-size: 74px; line-height: 1; color: var(--accent); text-shadow: 4px 4px 0 var(--void);
      }
      .asx-ruota-bonus .asx-bonus { padding: 18px 26px 20px; }
      .asx-ruota-bonus .asx-bonus-explain { font-size: 21px; }

      .asx-ruota-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .asx-npanel {
        position: relative; display: flex; flex-direction: column; gap: 10px; padding: 16px 22px 18px; min-width: 0;
        background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 16%, #0b0b10), #0b0b10 70%);
        clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
        animation: asx-swipe .35s .12s cubic-bezier(.2,1,.3,1) both;
      }
      .asx-npanel + .asx-npanel { animation-delay: .16s; }
      .asx-npanel-head { display: flex; align-items: center; gap: 12px; }
      .asx-npanel-head .n { font-weight: 700; font-style: italic; font-size: 34px; line-height: 1; color: var(--accent); }
      .asx-npanel p { margin: 0; font-size: 17px; line-height: 1.5; color: rgba(245,243,235,0.9); }

      .asx-ruota-bottom { display: flex; align-items: flex-end; justify-content: flex-end; gap: 28px; }
      .asx-ruota-bottom .asx-npanel { flex: 1; animation-delay: .2s; }
      .asx-npanel--clamp p { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .asx-ruota-bottom .asx-actions { width: 420px; flex: none; }

      /* ---------- 3 MANO ---------- */
      .asx-mano-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .asx-mano-hero { position: absolute; left: 50px; top: 130px; width: 660px; height: 620px; z-index: 10; display: flex; flex-direction: column; align-items: flex-start; }
      .asx-mano-burst { position: relative; width: 660px; height: 400px; flex: none; }
      .asx-mano-burst-slot {
        position: absolute; left: calc(50% - 70px); top: 120px; width: 140px;
        transform-origin: 50% 85%; transform: rotate(calc(var(--d) * 30deg)) translateY(-70px);
        animation: asx-crown .5s cubic-bezier(.2,1.2,.4,1) var(--delay) both;
      }
      .asx-mano-emblem {
        position: absolute; left: calc(50% - 110px); top: 150px; width: 220px; height: 220px; border-radius: 50%; z-index: 5;
        display: grid; place-items: center; background: var(--void);
        box-shadow: 0 0 0 6px var(--ink), 10px 10px 0 6px var(--accent);
        animation: asx-pop .45s cubic-bezier(.3,1.6,.5,1) both;
      }
      @keyframes asx-pop { from { transform: scale(0.4) rotate(-30deg); opacity: 0; } }
      .asx-mano-emblem img { width: 170px; height: 170px; object-fit: contain; }
      .asx-mano-emblem span { font-size: 110px; line-height: 1; color: var(--accent); }
      .asx-mano-hero .asx-name { margin-top: 8px; }
      .asx-mano-sheet {
        position: absolute; left: 760px; right: 50px; top: 150px; height: 600px; z-index: 12;
        display: flex; flex-direction: column; gap: 18px;
      }
      .asx-mano-sheet .asx-actions { margin-top: auto; flex-direction: row; align-items: center; justify-content: flex-end; gap: 22px; }
      .asx-mano-sheet .asx-confirm { width: 400px; }
      .asx-mano-hand { position: absolute; left: 0; right: 0; bottom: 0; height: 300px; z-index: 20; pointer-events: none; }
      .asx-mano-slot {
        position: absolute; left: 50%; bottom: -70px; width: 170px; height: 240px; pointer-events: auto;
        transform-origin: 50% 100%;
        transform: translateX(calc(-50% + var(--off) * 128px)) translateY(calc(var(--abs) * var(--abs) * 5px)) rotate(calc(var(--off) * 4deg));
        transition: transform .4s cubic-bezier(.2,1.2,.4,1);
      }
      .asx-mano-slot:hover:not(.on) { transform: translateX(calc(-50% + var(--off) * 128px)) translateY(calc(var(--abs) * var(--abs) * 5px - 26px)) rotate(calc(var(--off) * 4deg)); }
      .asx-mano-slot.on { transform: translateX(-50%) translateY(-78px) scale(1.25); }

      /* ---------- Dossier ---------- */
      .asx-dossier-wrap { position: absolute; inset: 0; z-index: 150; background: rgba(5,5,7,0.55); animation: asx-fade .2s ease both; }
      .asx-dossier {
        position: absolute; top: 0; bottom: 0; right: 0; width: 760px; display: flex; flex-direction: column; gap: 10px;
        padding: 34px 50px 30px 76px; background: var(--void);
        clip-path: polygon(50px 0, 100% 0, 100% 100%, 0 100%);
        animation: asx-drawer .35s cubic-bezier(.2,1,.3,1) both;
      }
      .asx-dossier::before {
        content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 64px; background: var(--accent);
        clip-path: polygon(50px 0, 64px 0, 14px 100%, 0 100%);
      }
      @keyframes asx-drawer { from { transform: translateX(100%); } }
      .asx-dossier-head { display: flex; align-items: center; justify-content: space-between; }
      .asx-dossier-close {
        border: 0; cursor: pointer; padding: 6px 14px; background: var(--ink); color: var(--void);
        font-family: inherit; font-weight: 700; font-size: 14px; letter-spacing: 0.12em; transform: skewX(-14deg);
      }
      .asx-dossier-close > span { display: inline-flex; align-items: center; gap: 8px; transform: skewX(14deg); }
      .asx-dossier-close kbd { background: var(--void); color: var(--ink); }
      .asx-dossier h3 {
        margin: 6px 0 4px; font-weight: 700; font-style: italic; font-size: 52px; line-height: 1; text-transform: uppercase;
        text-shadow: 5px 5px 0 var(--accent);
      }
      .asx-scroll { flex: 1; min-height: 0; overflow-y: auto; padding-right: 8px; scrollbar-width: thin; scrollbar-color: var(--accent) transparent; }
      .asx-scroll p { margin: 0 0 12px; font-size: 17px; line-height: 1.6; color: rgba(245,243,235,0.88); }

      /* ---------- Conferma ---------- */
      .asx-confirming { position: absolute; inset: 0; z-index: 200; display: grid; place-items: center; background: rgba(5,5,7,0.9); animation: asx-fade .2s ease both; }
      .asx-confirming-blades { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
      .asx-confirming-blades > span {
        position: absolute; top: -30%; bottom: -30%; width: 38%;
        transform: skewX(-18deg) translateX(-260%); animation: asx-blade .75s cubic-bezier(.7,0,.3,1) forwards;
      }
      .asx-confirming-blades > span:nth-child(1) { left: 0; background: var(--accent); }
      .asx-confirming-blades > span:nth-child(2) { left: 34%; background: var(--ink); animation-delay: .06s; }
      .asx-confirming-blades > span:nth-child(3) { left: 68%; background: var(--accent); animation-delay: .12s; }
      @keyframes asx-blade { 60% { transform: skewX(-18deg) translateX(0); } 100% { transform: skewX(-18deg) translateX(280%); } }
      .asx-confirming-text { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; transform: rotate(-3deg); animation: asx-ctxt 1.4s ease both; }
      @keyframes asx-ctxt { 0%, 30% { opacity: 0; transform: rotate(-3deg) scale(1.3); } 45% { opacity: 1; transform: rotate(-3deg) scale(1); } }
      .asx-confirming-text .eye { background: var(--accent); color: var(--void); font-weight: 700; font-size: 20px; letter-spacing: 0.4em; padding: 4px 20px; transform: skewX(-14deg); }
      .asx-confirming-text .nm {
        background: var(--ink); color: var(--void); font-weight: 700; font-style: italic; font-size: 76px; line-height: 1;
        text-transform: uppercase; padding: 12px 40px; box-shadow: 12px 12px 0 var(--accent);
      }
      .asx-confirming-text .next { font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.24em; text-transform: uppercase; }

      @media (prefers-reduced-motion: reduce) {
        .asx *, .asx *::before, .asx *::after { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}
