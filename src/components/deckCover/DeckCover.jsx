// ============================================================
// DeckCover.jsx — copertine dell'esercito (proposte in prova)
// ============================================================
// Varianti: 'fullart' | 'box' | 'tarot'. Il ticket attuale resta DeckTicket.
// Riempie il box del genitore (480×720 al centro del carosello, 300×560 ai lati,
// scalato nel VS): i testi usano unità cqw, quindi scalano col box.
// `deck` = voce costruita da buildDeckEntry (DeckSelectCinematic).
// ============================================================

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { CARD_IMAGES, AGENT_IMAGES } from '../../data/images.js';
import { DECK_SUMMARY_BG_POSITION } from '../../data/deckSummaryCropConfig.js';
import { GameCard } from '../cards/GameCard.jsx';
import './deckCover.css';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function coverArt(deck) {
  const id = deck?.leaderAgent?.id;
  const src = (id != null && (CARD_IMAGES?.[id] || AGENT_IMAGES?.[id])) || deck?.leader?.img || null;
  const crop = id != null ? DECK_SUMMARY_BG_POSITION?.[id] : null;
  return {
    src,
    position: crop ? `${crop.x ?? 50}% ${crop.y ?? 25}%` : 'center 22%',
    alt: deck?.leaderAgent?.name || deck?.leader?.name || '',
  };
}

function deckArmies(deck) {
  const list = (deck?.armies?.length ? deck.armies : [deck?.army]).filter(Boolean).slice(0, 2);
  return list.map((army) => ({
    army,
    icon: ARMY_ICONS[army] || null,
    accent: ARMY_COLORS[army]?.accent || deck?.accent || '#94a3b8',
  }));
}

function ArtImg({ art, className }) {
  if (!art.src) return <div className={`${className} dcv-art-empty`} />;
  return (
    <img
      className={className}
      src={art.src}
      alt={art.alt}
      draggable={false}
      style={{ objectPosition: art.position }}
    />
  );
}

function ArmyGlyphs({ armies, className = 'dcv-glyphs' }) {
  return (
    <div className={className}>
      {armies.map(({ army, icon, accent }) => (
        <span key={army} className="dcv-glyph" style={{ '--army': accent }} title={army}>
          {icon ? <img src={icon} alt={army} draggable={false} /> : null}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// A · Full-art: il leader a tutta altezza, nome in grande.
// ------------------------------------------------------------
function FullArtCover({ deck, art, armies, isCenter }) {
  return (
    <div className={`dcv dcv-fullart${isCenter ? ' is-center' : ''}`}>
      <div className="dcv-fa-frame">
        <ArtImg art={art} className="dcv-fa-art" />
        <div className="dcv-fa-shade" />
        <div className="dcv-fa-slash" />
        <ArmyGlyphs armies={armies} className="dcv-glyphs dcv-fa-glyphs" />
        <div className="dcv-fa-count">
          <b>{deck.cards ?? deck.deckCards?.length ?? 10}</b>
          <span>CARTE</span>
        </div>
        <div className="dcv-fa-info">
          <span className="dcv-eyebrow">ESERCITO</span>
          <span className="dcv-fa-name">{deck.name}</span>
          <span className="dcv-fa-armies">
            {armies.map(({ army, accent }, i) => (
              <React.Fragment key={army}>
                {i > 0 ? <i>·</i> : null}
                <em style={{ color: accent }}>{army}</em>
              </React.Fragment>
            ))}
          </span>
          {art.alt ? <span className="dcv-fa-leader">Copertina · {art.alt}</span> : null}
        </div>
        {isCenter ? <div className="dcv-sheen" /> : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// B · Scatola 3D: custodia con fronte illustrato e dorso col nome.
// ------------------------------------------------------------
/** Larghezza nativa della carta di gioco (CardReworkP4 / faccia alternativa). */
const GAME_CARD_W = 230;
/** Le carte del ventaglio occupano l'80% della larghezza della scatola (vedi deckCover.css). */
const FAN_CARD_FRACTION = 0.8;

/**
 * Carte che escono dalla scatola: una a caso per ogni Lega presente nel mazzo,
 * ordinate da sinistra (Lega più bassa) a destra. Nuova pesca a ogni montaggio.
 */
function pickFanCards(deck) {
  const byLeague = new Map();
  (deck?.deckCards || []).forEach((c) => {
    const list = byLeague.get(c.league) || [];
    list.push(c);
    byLeague.set(c.league, list);
  });
  return [...byLeague.keys()]
    .sort((a, b) => a - b)
    .map((league) => {
      const list = byLeague.get(league);
      return list[Math.floor(Math.random() * list.length)];
    })
    .slice(0, 5);
}

/**
 * Rotazione stile schermate di caricamento: lenta in automatico (dopo `delayMs`),
 * trascinabile col puntatore (orizzontale = giro, verticale = inclinazione) con inerzia.
 * Scrive solo variabili CSS sul nodo: nessun re-render per fotogramma.
 */
function useBoxSpin(enabled, { delayMs = 0, dir = 1 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const autoSpeed = reduce ? 0 : 16 * dir; // gradi/secondo
    let angle = 0;
    let tilt = 0;
    let vel = 0;
    let dragging = false;
    let startAt = performance.now() + delayMs;
    let last = performance.now();
    let lastX = 0;
    let lastY = 0;
    let lastMove = 0;
    let raf = 0;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        if (now >= startAt) {
          vel += (autoSpeed - vel) * Math.min(1, dt * 1.2);
          angle += vel * dt;
        }
        tilt += (0 - tilt) * Math.min(1, dt * 2.5);
      }
      el.style.setProperty('--spin-y', `${angle.toFixed(2)}deg`);
      el.style.setProperty('--spin-x', `${tilt.toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };
    const onDown = (e) => {
      dragging = true;
      startAt = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = performance.now();
      vel = 0;
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-dragging');
    };
    const onMove = (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dts = Math.max(0.008, (now - lastMove) / 1000);
      angle += dx * 0.6;
      tilt = Math.max(-28, Math.min(28, tilt - dy * 0.35));
      vel = Math.max(-720, Math.min(720, (dx * 0.6) / dts));
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = now;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (performance.now() - lastMove > 90) vel = 0;
      el.releasePointerCapture?.(e.pointerId);
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [enabled, delayMs, dir]);
  return ref;
}

function BoxSpine({ deck, armies, spineArmy, side }) {
  return (
    <div className={`dcv-box-face dcv-box-spine dcv-box-spine--${side}`} style={{ '--spine': spineArmy }}>
      <ArmyGlyphs armies={armies} className="dcv-glyphs dcv-box-spine-glyphs" />
      <span className="dcv-box-spine-name">{deck.name}</span>
    </div>
  );
}

/** Retro della scatola: dorso delle carte come sfondo, sopra il contenuto del mazzo. */
function BoxBack({ deck, armies, backImage }) {
  const cards = (deck.deckCards || []).slice(0, 10);
  return (
    <div className="dcv-box-face dcv-box-back">
      {backImage ? <img className="dcv-box-back-img" src={backImage} alt="" draggable={false} /> : null}
      <div className="dcv-box-back-panel">
      <span className="dcv-eyebrow">CONTENUTO</span>
      <ol className="dcv-box-list">
        {cards.map((c) => (
          <li key={c.id}>
            <b>L{c.league}</b>
            <span>{c.name}</span>
          </li>
        ))}
      </ol>
      <div className="dcv-box-back-foot">
        <span>{armies.map((a) => a.army).join(' · ')}</span>
        <span>{deck.cards ?? cards.length} CARTE · LEGA {deck.totalLeague ?? 30}</span>
      </div>
      </div>
    </div>
  );
}

function BoxCover({ deck, art, armies, isCenter, mirror, opening, spin, backImage }) {
  const spineArmy = armies[0]?.accent || deck.accent;
  // Pesca stabile per tutta la vita del componente (il VS rimonta a ogni ingresso).
  const [fan] = useState(() => (opening ? pickFanCards(deck) : []));
  const cubeRef = useRef(null);
  // Le carte sono GameCard a 230px nativi: scala calcolata sulla larghezza reale della scatola.
  useLayoutEffect(() => {
    const cube = cubeRef.current;
    if (!opening || !cube) return undefined;
    const apply = () => cube.style.setProperty(
      '--fan-scale',
      String((cube.offsetWidth * FAN_CARD_FRACTION) / GAME_CARD_W)
    );
    apply();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(apply);
    ro.observe(cube);
    return () => ro.disconnect();
  }, [opening]);
  // Nel VS la rotazione parte dopo l'ingresso (o dopo che la scatola si è richiusa).
  const spinRef = useBoxSpin(spin, { delayMs: opening ? 3100 : 1100, dir: mirror ? -1 : 1 });
  return (
    <div
      ref={spinRef}
      className={`dcv dcv-box${isCenter ? ' is-center' : ''}${mirror ? ' is-mirror' : ''}${opening ? ' is-opening' : ''}${spin ? ' is-spin' : ''}`}
    >
      <div className="dcv-box-stage">
        <div className="dcv-box-cube" ref={cubeRef}>
          <div className="dcv-box-face dcv-box-front">
            <ArtImg art={art} className="dcv-box-art" />
            <div className="dcv-box-front-shade" />
            <div className="dcv-box-label">
              <span className="dcv-box-name">{deck.name}</span>
              <span className="dcv-box-meta">
                {deck.cards ?? 10} CARTE · LEGA {deck.totalLeague ?? 30}
              </span>
            </div>
          </div>
          <BoxSpine deck={deck} armies={armies} spineArmy={spineArmy} side="right" />
          <BoxSpine deck={deck} armies={armies} spineArmy={spineArmy} side="left" />
          <BoxBack deck={deck} armies={armies} backImage={backImage} />
          <div className="dcv-box-face dcv-box-bottom" />
          {opening ? (
            <>
              <div className="dcv-box-face dcv-box-cavity" />
              <div className="dcv-box-fan">
                {fan.map((c, i) => (
                  <div key={c.id} className="dcv-box-card" style={{ '--i': i - (fan.length - 1) / 2, '--k': i }}>
                    <div className="dcv-box-card-face">
                      <GameCard agent={c} showBonus suppressAnimations />
                    </div>
                  </div>
                ))}
              </div>
              <div className="dcv-box-lid-hinge">
                <div className="dcv-box-lid" />
              </div>
            </>
          ) : (
            <div className="dcv-box-face dcv-box-top" />
          )}
        </div>
        <div className="dcv-box-floor" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// C · Tarocco: stesso linguaggio delle carte Eminenza (arco, cornice doppia).
// ------------------------------------------------------------
function TarotCover({ deck, art, armies, isCenter }) {
  const league = deck.leader?.league ?? deck.leaderAgent?.league ?? 5;
  return (
    <div className={`dcv dcv-tarot${isCenter ? ' is-center' : ''}`}>
      <div className="dcv-tr-card">
        <div className="dcv-tr-numeral">{ROMAN[league] || league}</div>
        <div className="dcv-tr-window">
          <ArtImg art={art} className="dcv-tr-art" />
          <div className="dcv-tr-window-shade" />
          {isCenter ? <div className="dcv-sheen" /> : null}
        </div>
        <div className="dcv-tr-plate">
          <span className="dcv-tr-orn" aria-hidden>✦</span>
          <span className="dcv-tr-name">{deck.name}</span>
          <span className="dcv-tr-orn" aria-hidden>✦</span>
        </div>
        <div className="dcv-tr-foot">
          <ArmyGlyphs armies={armies} />
          <span className="dcv-tr-leader">{art.alt}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.deck voce di buildDeckEntry
 * @param {'fullart'|'box'|'tarot'} props.variant
 * @param {boolean} [props.isCenter] decorazioni e animazioni piene
 * @param {boolean} [props.mirror] scatola ruotata dall'altro lato (lato avversario nel VS)
 * @param {boolean} [props.opening] scatola: all'ingresso si apre e mostra le carte (solo VS)
 * @param {boolean} [props.spin] scatola: rotazione lenta + trascinabile (solo VS)
 * @param {string|null} [props.backImage] scatola: dorso carte sul retro esterno
 */
export function DeckCover({ deck, variant, isCenter = true, mirror = false, opening = false, spin = false, backImage = null }) {
  if (!deck) return null;
  const art = coverArt(deck);
  const armies = deckArmies(deck);
  const props = { deck, art, armies, isCenter, mirror, opening, spin, backImage };
  return (
    <div className="dcv-root" style={{ '--accent': deck.accent }}>
      {variant === 'box' ? <BoxCover {...props} />
        : variant === 'tarot' ? <TarotCover {...props} />
          : <FullArtCover {...props} />}
    </div>
  );
}

export default DeckCover;
