// ============================================================
// ArmySelectCinematic.jsx — Schermata "Scegli la tua armata"
// ============================================================
// Stile Persona, costruita attorno a una RUOTA: le armate sono gli spicchi,
// lo spicchio scelto si ferma a destra nel riquadro, accanto le 5 carte di
// punta sull'arco (una per Lega + la migliore restante) e a destra la scheda
// a bande inclinate (bonus, stile, note, storia, SCHIERA).
// La storia lunga sta nel pannello DOSSIER (tasto S).
// I testi per ogni armata (synopsis / motto / bonusExplain /
// style / tips) si modificano in `armyLore.js`.
// Alla conferma la lastra inclinata chiude lo schermo e la Scelta esercito
// riparte da lì (vedi `slabHandoff.jsx`).
//
// Props:
//   onSelect(armyName: string | null)  // null = "Eserciti Personalizzati"
//   onBack()                           // torna al menu
//
// Si renderizza fullscreen (position: fixed). Renderizzala al livello del
// routing, NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  ARMY_COLORS,
  ARMY_BONUSES,
  ARMY_GIFS,
  ARMY_ICONS,
} from '../../../data/armies.js';
import { ARMY_SETS, ARMY_DECKS } from '../../../data/cards.js';
import { ARMY_LORE, MIXED_ARMIES_LORE } from './armyLore.js';
import { GAME_SOUND, playGame, playUiClick } from '../../../audio/gameSounds.js';
import { CardReworkP4 } from '../../cards/CardReworkP4.jsx';
import { evaluateCardBalance } from '../../cosmic/DeckPreviewCosmic.jsx';
import { getCardSprite } from '../../../utils';
import { AGENT_IMAGES } from '../../../data/images';
import { armSlabHandoff, HANDOFF_BG, SlabHandoffTitle } from './slabHandoff.jsx';
import { armTransitionFrom } from '../../cosmic/ScreenTransition';

const SHOWCASE_SIZE = 5;
/** Durata della chiusura a lastra prima di passare alla scelta esercito. */
const EXIT_MS = 700;

/** Offset con wrap-around: l'armata selezionata è 0, le vicine ±1, ±2… */
function wrapOffset(i, idx, total) {
  const half = Math.floor(total / 2);
  return ((i - idx + total + half) % total) - half;
}

/**
 * Pool misto: per ogni Lega la carta col potenziale più alto, poi le migliori
 * in assoluto fino a SHOWCASE_SIZE. Ordinate per Lega (dalla più alta), a pari
 * Lega per potenziale.
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
    .sort((a, b) => (b.card.league ?? 0) - (a.card.league ?? 0) || b.value - a.value)
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
    showcase: [], // nessuna carta di punta: il pool misto non rappresenta un'armata
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

  const confirmArmy = useCallback(() => {
    if (stateRef.current.phase !== 'idle') return;
    playGame(GAME_SOUND.ARMY_CONFIRM);
    setDossier(false);
    setPhase('confirming');
    // La lastra inclinata copre lo schermo (EXIT_MS); la scelta esercito riparte da lì.
    setTimeout(() => {
      armSlabHandoff(army.color, army.name);
      onSelect && onSelect(army.isMixed ? null : army.name);
    }, EXIT_MS);
  }, [army.color, army.isMixed, army.name, onSelect]);

  /** Indietro: la cortina prende il colore dell'armata in vista. */
  const goBack = useCallback(() => {
    if (!onBack) return;
    armTransitionFrom({ accent: army.color });
    onBack();
  }, [army.color, onBack]);

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
        else goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, confirmArmy, toggleDossier, goBack]);

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
    <div
      ref={rootRef}
      className={`asx asx--ruota${phase === 'confirming' ? ' is-leaving' : ''}`}
      style={{ '--accent': army.color }}
    >
      <div className="asx-bg" aria-hidden="true">
        {army.bg && <div className="asx-bg-art" key={army.id} style={{ backgroundImage: `url('${army.bg}')` }} />}
        <div className="asx-bg-tone" />
        <div className="asx-bg-halftone" />
        <div className="asx-bg-stripes" />
      </div>

      <button type="button" className="asx-back" onClick={() => { playUiClick(); goBack(); }}>
        <span className="key">ESC</span><span className="lbl">MENU</span>
      </button>

      <header className="asx-title">
        <div className="asx-eyebrow"><span>FASE I · SCHIERAMENTO</span></div>
        <h1>SCEGLI LA TUA ARMATA</h1>
      </header>

      <div className="asx-topright">
        <div className="asx-hints">
          <span><kbd>↑</kbd><kbd>↓</kbd>ARMATA</span>
          <span><kbd>S</kbd>DOSSIER</span>
          <span><kbd>↵</kbd>SCHIERA</span>
        </div>
      </div>

      <LayoutRuota {...shared} />

      {dossier && <Dossier army={army} onClose={() => setDossier(false)} />}
      {phase === 'confirming' && (
        <>
          <div className="asx-exit-slab" aria-hidden="true" />
          <SlabHandoffTitle name={army.name} color={army.color} mode="in" />
        </>
      )}

      <ArmySelectStyles />
    </div>
  );
}

// ============================================================
// RUOTA: armate a spicchi a sinistra, carte sull'arco, scheda a destra
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
const ZOOM_W = 330;      // carta ingrandita al passaggio del mouse
const ZOOM_LEFT = 790;

const rad = (deg) => (deg * Math.PI) / 180;
const CARD_H = Math.round((CARD_W * 330) / 230);

/** Carta di punta sull'arco: centro su pixel interi, inclinata come il raggio. */
function cardSlotStyle(offset) {
  const deg = offset * CARDS_STEP;
  const a = rad(deg);
  return {
    left: Math.round(CARDS_R * Math.cos(a) - CARD_W / 2),
    top: Math.round(CARDS_R * Math.sin(a) - CARD_H / 2),
    zIndex: 10 - Math.abs(Math.round(offset)),
    '--tilt': `${deg}deg`,
  };
}
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
  const cards = army.showcase;
  const mid = (cards.length - 1) / 2;
  const artX = WEDGE_RI * Math.cos(rad(half));
  const artH = 2 * WEDGE_RO * Math.sin(rad(half));
  const box = WEDGE_RO + 320;
  const vb = `${-box} ${-box} ${box * 2} ${box * 2}`;
  const center = { left: WHEEL_CX, top: WHEEL_CY };
  const labelR = CARDS_R + CARD_W / 2 + 34;
  const [hover, setHover] = useState(null);
  useEffect(() => setHover(null), [army.id]);
  const zoomCard = hover != null ? cards[hover] : null;
  const zoomH = Math.round((ZOOM_W * 330) / 230);
  const zoomY = hover != null ? WHEEL_CY + CARDS_R * Math.sin(rad((hover - mid) * CARDS_STEP)) : 0;
  const zoomTop = Math.round(Math.min(Math.max(zoomY - zoomH / 2, 24), 1080 - zoomH - 24));

  // Direzione del giro (+1 avanti, -1 indietro): la scheda scorre nello stesso verso della ruota.
  const spinRef = useRef(spin);
  const dirRef = useRef(1);
  if (spin !== spinRef.current) {
    dirRef.current = spin > spinRef.current ? 1 : -1;
    spinRef.current = spin;
  }
  // La scheda uscente resta a schermo il tempo della sua animazione.
  const shownRef = useRef({ army, idx });
  const [leaving, setLeaving] = useState(null);
  useLayoutEffect(() => {
    const prev = shownRef.current;
    if (prev.army.id === army.id) return undefined;
    shownRef.current = { army, idx };
    setLeaving({ ...prev, dir: dirRef.current, n: Date.now() });
    const t = setTimeout(() => setLeaving(null), 320);
    return () => clearTimeout(t);
  }, [army, idx]);

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
        <Burst value={String(idx + 1).padStart(2, '0')} />
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
              style={cardSlotStyle(i - mid)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            >
              <div className="asx-rw-card" style={{ '--delay': `${0.12 + Math.abs(i - mid) * 0.06}s` }}>
                <ArcCard card={c} />
              </div>
            </div>
          ))}
        </div>
      )}

      {leaving && (
        <RuotaSheet
          key={`out-${leaving.army.id}-${leaving.n}`}
          army={leaving.army}
          idx={leaving.idx}
          dir={leaving.dir}
          out
        />
      )}
      <RuotaSheet key={`sheet-${army.id}`} army={army} idx={idx} dir={dirRef.current} onConfirm={onConfirm} onDossier={onDossier} />

      {zoomCard && (
        <div className="asx-rw-zoom" style={{ left: ZOOM_LEFT, top: zoomTop }} key={`zoom-${zoomCard.id}`} aria-hidden="true">
          <ZoomCard card={zoomCard} />
        </div>
      )}
    </>
  );
}

/** Scheda a bande di un'armata. `out` = scheda che sta uscendo durante il cambio. */
function RuotaSheet({ army, idx, dir, out = false, onConfirm, onDossier }) {
  return (
    <div
      className={`asx-ruota-sheet${out ? ' is-out' : ''}`}
      style={{ '--dir': dir, '--accent': army.color }}
      aria-hidden={out || undefined}
    >
        <header className="asx-bd-head">
          <div className="asx-bd-num asx-sk" aria-hidden="true">
            <small>ARMATA</small>
            <b>{String(idx + 1).padStart(2, '0')}</b>
          </div>
          <div className="asx-sk">
            <h2 className={army.name.length > 18 ? 'long' : ''}>{army.name}</h2>
            {army.motto && <div className="asx-motto">“{army.motto}”</div>}
          </div>
          {!army.isMixed && (
            <div className="asx-bd-stats asx-sk">
              <Burst value={army.cards} label="CARTE" />
              <Burst value={army.decks} label="ESERCITI" dark />
            </div>
          )}
        </header>

        <Band tone="paper" tag="BONUS" sub={army.bonusLabel} d={0.06}>
          {army.bonusWhen && <p className="asx-bd-when">{army.bonusWhen}</p>}
          {army.bonusExplain && <p className="asx-bd-main">{army.bonusExplain}</p>}
          {army.bonusHighlight && <p className="asx-bd-when"><b>DIVERSO DALLE ALTRE ·</b> {army.bonusHighlight}</p>}
          {army.bonus && <span className="asx-bonus-val">{army.bonus}</span>}
        </Band>
        {army.style && (
          <Band tone="ink" tag="STILE" sub="CONSIGLIATO" d={0.1}>
            <p>{army.style}</p>
          </Band>
        )}
        {army.tips && (
          <Band tone="accent" tag="NOTE" sub="TATTICHE" d={0.14}>
            <p>{army.tips}</p>
          </Band>
        )}
        {army.synopsis && (
          <Band tone="ink" tag="STORIA" sub="IN BREVE" d={0.18}>
            <p className="asx-bd-story">{army.synopsis}</p>
          </Band>
        )}

        <div className="asx-bd-go" style={{ '--d': '0.22s' }}>
          <button type="button" className="asx-bd-dossier" onClick={onDossier}>
            <span className="asx-sk"><kbd>S</kbd> DOSSIER</span>
          </button>
          <button type="button" className="asx-bd-confirm" onClick={onConfirm}>
            <span className="asx-sk">SCHIERA <kbd>↵</kbd></span>
          </button>
        </div>
    </div>
  );
}

/**
 * Carta piccola dell'arco. Ridotta con `zoom` e non con transform: la carta
 * viene impaginata alla taglia vera, così inclinata resta più nitida.
 */
function ArcCard({ card }) {
  return (
    <div className="asx-sc" style={{ width: CARD_W, height: CARD_H }}>
      <div style={{ zoom: CARD_W / 230 }}>
        <CardReworkP4 agent={card} showBonus preferThumb suppressAnimations />
      </div>
    </div>
  );
}

/** Carta ingrandita: arte piena, e se manca ripiega sulla miniatura. */
function ZoomCard({ card }) {
  const [thumb, setThumb] = useState(false);
  useEffect(() => {
    const sprite = getCardSprite(card);
    const url = sprite.type === 'specific' ? AGENT_IMAGES[sprite.agentId] : null;
    if (!url) return undefined;
    let alive = true;
    const img = new Image();
    img.onerror = () => { if (alive) setThumb(true); };
    img.src = url;
    return () => { alive = false; };
  }, [card]);
  // `zoom` (non transform) ridisegna la carta alla taglia vera: testo e arte restano nitidi.
  return (
    <div style={{ zoom: ZOOM_W / 230 }}>
      <CardReworkP4 agent={card} showBonus preferThumb={thumb} suppressAnimations />
    </div>
  );
}

/** Banda inclinata della scheda: etichetta a sinistra, contenuto a destra. */
function Band({ tone, tag, sub, d = 0, children }) {
  return (
    <section className={`asx-bd asx-bd--${tone}`} style={{ '--d': `${d}s` }}>
      <div className="asx-bd-tag">
        <div className="asx-sk">
          <b>{tag}</b>
          {sub && <small>{sub}</small>}
        </div>
      </div>
      <div className="asx-bd-body">
        <div className="asx-sk">{children}</div>
      </div>
    </section>
  );
}

const BURST_CLIP = 'polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)';

function Burst({ value, label, dark = false }) {
  return (
    <div className={`asx-burst${dark ? ' dark' : ''}${label ? '' : ' solo'}`}>
      <span className="shape" aria-hidden="true" />
      <span className="val">{value}</span>
      {label && <span className="lbl">{label}</span>}
    </div>
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
      .asx-hints { display: flex; gap: 14px; font-weight: 700; font-style: italic; font-size: 13px; letter-spacing: 0.12em; text-shadow: 2px 2px 0 var(--void); }
      .asx-hints span { display: inline-flex; align-items: center; gap: 3px; }
      .asx-hints kbd { margin-right: 2px; }

      /* Carta-armata */

      .asx-sc { position: relative; filter: drop-shadow(6px 6px 0 rgba(0,0,0,0.7)); }

      /* Pezzi della scheda */
      
      .asx-motto {
        background: var(--ink); color: var(--void); font-weight: 600; font-style: italic; font-size: 17px;
        padding: 5px 14px; transform: skewX(-12deg) rotate(1deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .asx-bonus-val { align-self: flex-start; margin-top: 4px; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; padding: 2px 10px; transform: skewX(-12deg); }

      /* ---------- RUOTA ---------- */
      /* il titolo della pagina è solo una riga-percorso: il titolo grande è il nome dell'armata */
      .asx--ruota .asx-title { left: 948px; top: 34px; transform: none; text-align: left; display: flex; align-items: center; gap: 12px; }
      .asx--ruota .asx-title::after {
        content: ''; position: absolute; left: 0; top: calc(100% + 10px); width: 540px; height: 2px;
        background: linear-gradient(90deg, var(--accent), transparent);
      }
      .asx--ruota .asx-eyebrow span { font-size: 11px; padding: 1px 10px; }
      .asx--ruota .asx-title h1 {
        margin: 0; font-size: 15px; font-style: normal; letter-spacing: 0.28em; text-shadow: none; color: rgba(245,243,235,0.75);
      }
      .asx--ruota .asx-title h1::before { content: '›'; margin-right: 12px; color: var(--accent); font-weight: 700; }
      .asx-ruota-slab {
        position: absolute; top: -10%; bottom: -10%; left: 920px; right: -120px; z-index: 4;
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
      .asx-rw-card-slot { position: absolute; width: ${CARD_W}px; height: ${CARD_H}px; transform: rotate(var(--tilt)); transition: transform .25s cubic-bezier(.22,1,.36,1); }
      .asx-rw-card-slot:hover { transform: rotate(0deg); }
      .asx-rw-card-slot:hover { z-index: 30 !important; }
      .asx-rw-card {
        transition: transform .22s cubic-bezier(.3,1.5,.5,1);
        animation: asx-rw-deal .5s cubic-bezier(.2,1.2,.4,1) var(--delay) backwards;
      }
      .asx-rw-card .asx-sc { filter: none; box-shadow: 6px 6px 0 rgba(5,5,7,0.85); }
      .asx-rw-card-slot:hover .asx-rw-card { transform: translateX(14px); }
      .asx-rw-card-slot:hover .asx-sc { box-shadow: 6px 6px 0 var(--accent); }
      @keyframes asx-rw-deal {
        from { transform: translateX(-240px) scale(0.35); opacity: 0; }
        60% { opacity: 1; }
      }
      .asx-rw-zoom {
        position: absolute; z-index: 60; pointer-events: none;
        box-shadow: 12px 12px 0 var(--accent), 0 30px 80px rgba(0,0,0,0.75);
        animation: asx-rw-zoom .2s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes asx-rw-zoom { from { opacity: 0; transform: translateX(-24px); } }

      /* scheda a bande: tutto il blocco è inclinato come il divisorio, il testo è raddrizzato */
      .asx-ruota-sheet {
        position: absolute; left: 926px; right: 30px; top: 116px; bottom: 30px; z-index: 12;
        display: flex; flex-direction: column; justify-content: space-between; gap: 12px; overflow: hidden;
        transform: skewX(-8deg); transform-origin: top left;
      }
      .asx-sk { transform: skewX(8deg); transform-origin: left center; }
      /* cambio armata: la scheda vecchia scorre via e sfuma, la nuova entra a cascata nello stesso verso della ruota */
      .asx-ruota-sheet.is-out { z-index: 11; pointer-events: none; }
      .asx-ruota-sheet > * { --ease: cubic-bezier(.22,1,.36,1); }
      .asx-ruota-sheet.is-out > * { animation: asx-bd-out .2s cubic-bezier(.4,0,1,1) calc(var(--d, 0s) * .4) both !important; }
      @keyframes asx-bd-out { to { opacity: 0; transform: translateY(calc(var(--dir) * -38px)); } }

      .asx-bd-head { display: grid; grid-template-columns: auto 1fr auto; align-items: end; gap: 16px; padding: 0 8px 4px 22px; animation: asx-bd-in .5s var(--ease) .16s both; }
      .asx-bd-head .asx-sk { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 0; }
      .asx-bd-head h2 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 72px; line-height: 0.92; letter-spacing: -0.015em; text-transform: uppercase;
        text-shadow: 5px 5px 0 var(--accent), 10px 10px 0 var(--void);
      }
      .asx-bd-head h2.long { font-size: 54px; }
      .asx-bd-head .asx-motto { margin-left: 18px; }
      .asx-bd-head .asx-bd-num { flex-direction: column; align-items: flex-start; gap: 0; padding-right: 6px; }
      .asx-bd-num small { font-weight: 700; font-size: 11px; letter-spacing: 0.3em; color: var(--accent); }
      .asx-bd-num b {
        font-weight: 700; font-style: italic; font-size: 118px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 3px var(--accent);
      }
      .asx-bd-head .asx-bd-stats { flex-direction: row; align-items: flex-end; gap: 2px; padding-bottom: 6px; }

      .asx-bd {
        display: grid; grid-template-columns: 196px 1fr; flex: none;
        animation: asx-bd-in .5s var(--ease) calc(var(--d) * .6 + .16s) both;
      }
      @keyframes asx-bd-in { from { opacity: 0; transform: translateY(calc(var(--dir) * 44px)); } }
      .asx-bd-tag { display: flex; align-items: center; padding: 12px 16px 12px 24px; }
      .asx-bd-tag b { display: block; font-weight: 700; font-style: italic; font-size: 40px; line-height: 0.9; letter-spacing: -0.01em; }
      .asx-bd-tag small { display: block; margin-top: 6px; font-weight: 700; font-size: 11px; letter-spacing: 0.24em; }
      .asx-bd-body { display: flex; align-items: center; padding: 14px 30px 15px 26px; min-width: 0; }
      .asx-bd-body .asx-sk { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; }
      .asx-bd-body p { margin: 0; font-size: 18px; line-height: 1.45; }
      .asx-bd-when { font-style: italic; font-weight: 600; font-size: 15px !important; opacity: 0.75; }
      .asx-bd-main { font-weight: 600; font-size: 20px !important; line-height: 1.35 !important; }
      .asx-bd-story {
        font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }

      /* toni: bianco, nero, colore d'armata — l'etichetta inverte sempre la banda */
      .asx-bd--paper { background: var(--ink); color: var(--void); box-shadow: 9px 9px 0 var(--accent); margin-right: 14px; }
      .asx-bd--paper .asx-bd-tag { background: var(--void); color: var(--ink); }
      .asx-bd--paper .asx-bd-tag small { color: var(--accent); }
      .asx-bd--ink { background: rgba(14,13,20,0.96); color: rgba(245,243,235,0.92); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); margin-right: 70px; }
      .asx-bd--ink .asx-bd-tag { background: var(--accent); color: var(--void); }
      .asx-bd--accent { background: var(--accent); color: var(--void); margin-right: 30px; }
      .asx-bd--accent .asx-bd-tag { background: var(--ink); color: var(--void); }
      .asx-bd--accent .asx-bd-tag small { color: var(--accent); }
      .asx-bd--accent .asx-bd-body p { font-weight: 600; }
      .asx-bd--ink + .asx-bd--accent + .asx-bd--ink { margin-right: 120px; }

      .asx-bd-go {
        display: grid; grid-template-columns: 196px 1fr; flex: none; height: 108px; margin-right: 40px;
        animation: asx-bd-in .5s var(--ease) calc(var(--d) * .6 + .16s) both;
      }
      .asx-bd-go button { border: 0; padding: 0; font-family: inherit; cursor: pointer; transition: transform .15s, box-shadow .15s, background .15s, color .15s; }
      .asx-bd-go kbd { display: inline-grid; place-items: center; font-family: 'Share Tech Mono', monospace; font-style: normal; }
      .asx-bd-dossier { background: var(--void); color: var(--ink); box-shadow: inset 0 0 0 3px var(--ink); font-weight: 700; font-size: 18px; letter-spacing: 0.14em; }
      .asx-bd-dossier kbd { background: var(--ink); color: var(--void); min-width: 26px; height: 24px; margin-right: 6px; font-size: 14px; }
      .asx-bd-dossier:hover { background: var(--ink); color: var(--void); }
      .asx-bd-dossier:hover kbd { background: var(--void); color: var(--ink); }
      .asx-bd-confirm {
        background: var(--accent); color: var(--void); box-shadow: 10px 10px 0 var(--ink);
        font-weight: 700; font-style: italic; font-size: 72px; letter-spacing: -0.01em; text-align: left; padding-left: 40px !important;
      }
      .asx-bd-confirm .asx-sk { display: flex; align-items: center; gap: 22px; }
      .asx-bd-confirm kbd { background: var(--void); color: var(--ink); font-size: 26px; min-width: 50px; height: 42px; }
      .asx-bd-confirm:hover, .asx-bd-confirm:focus-visible { transform: translate(-5px, -5px); box-shadow: 16px 16px 0 var(--ink); outline: none; }

      .asx-burst { position: relative; width: 112px; height: 112px; display: grid; place-items: center; }
      .asx-burst .shape { position: absolute; inset: 0; background: var(--ink); clip-path: ${BURST_CLIP}; filter: drop-shadow(5px 5px 0 var(--accent)); animation: asx-spin 22s linear infinite; }
      .asx-burst.dark .shape { background: var(--accent); filter: drop-shadow(5px 5px 0 var(--void)); }
      .asx-burst .val { position: relative; font-weight: 700; font-style: italic; font-size: 44px; line-height: 1; color: var(--void); transform: translateY(-10px) rotate(-6deg); }
      .asx-burst.solo .val { font-size: 50px; transform: rotate(-6deg); }
      .asx-burst .lbl { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%) skewX(-14deg); background: var(--void); color: var(--ink); font-weight: 700; font-size: 10px; letter-spacing: 0.2em; padding: 1px 7px; }

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

      /* ---------- Conferma: la lastra inclinata chiude lo schermo verso sinistra ---------- */
      .asx.is-leaving { pointer-events: none; }
      .asx.is-leaving .asx-back, .asx.is-leaving .asx-title, .asx.is-leaving .asx-topright { opacity: 0; transition: opacity .2s ease; }
      .asx.is-leaving .asx-ruota-sheet > * { animation: asx-leave .3s cubic-bezier(.5,0,.9,.4) calc(var(--d, 0s) * .5) both !important; }
      @keyframes asx-leave { to { opacity: 0; transform: translateX(-90px); } }
      .asx.is-leaving .asx-rw-cards, .asx.is-leaving .asx-rw-over { opacity: 0; transition: opacity .2s ease; }
      .asx.is-leaving .asx-rw-zoom { display: none; }
      .asx-exit-slab {
        position: absolute; top: -10%; bottom: -10%; left: 920px; right: -400px; z-index: 11; pointer-events: none;
        background: ${HANDOFF_BG}; transform: skewX(-8deg); transform-origin: top left;
        box-shadow: -14px 0 0 0 var(--accent), -26px 0 0 0 #050507, -34px 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent);
        animation: asx-exit-sweep .6s cubic-bezier(.7,0,.25,1) .06s forwards;
      }
      @keyframes asx-exit-sweep { to { left: -560px; } }

      @media (prefers-reduced-motion: reduce) {
        .asx *, .asx *::before, .asx *::after { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}
