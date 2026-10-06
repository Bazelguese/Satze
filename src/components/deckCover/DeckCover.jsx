// ============================================================
// DeckCover.jsx — copertine dell'esercito (proposte in prova)
// ============================================================
// Varianti: 'fullart' | 'box' | 'tarot'. Il ticket attuale resta DeckTicket.
// Riempie il box del genitore (480×720 al centro del carosello, 300×560 ai lati,
// scalato nel VS): i testi usano unità cqw, quindi scalano col box.
// `deck` = voce costruita da buildDeckEntry (DeckSelectCinematic).
// ============================================================

import React from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { CARD_IMAGES, AGENT_IMAGES } from '../../data/images.js';
import { DECK_SUMMARY_BG_POSITION } from '../../data/deckSummaryCropConfig.js';
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
/** Carte che escono dalla scatola: le 3 di Lega più alta, escluso il leader in copertina. */
function fanCards(deck) {
  const leaderId = deck?.leaderAgent?.id;
  return (deck?.deckCards || [])
    .filter((c) => c.id !== leaderId && (CARD_IMAGES?.[c.id] || AGENT_IMAGES?.[c.id]))
    .sort((a, b) => (b.league || 0) - (a.league || 0) || (b.power || 0) - (a.power || 0))
    .slice(0, 3)
    .map((c) => ({ id: c.id, name: c.name, src: CARD_IMAGES?.[c.id] || AGENT_IMAGES?.[c.id] }));
}

function BoxCover({ deck, art, armies, isCenter, mirror, opening }) {
  const spineArmy = armies[0]?.accent || deck.accent;
  const fan = opening ? fanCards(deck) : [];
  return (
    <div className={`dcv dcv-box${isCenter ? ' is-center' : ''}${mirror ? ' is-mirror' : ''}${opening ? ' is-opening' : ''}`}>
      <div className="dcv-box-stage">
        <div className="dcv-box-cube">
          <div className="dcv-box-face dcv-box-front">
            <ArtImg art={art} className="dcv-box-art" />
            <div className="dcv-box-front-shade" />
            <div className="dcv-box-seal">
              <ArmyGlyphs armies={armies} />
            </div>
            <div className="dcv-box-label">
              <span className="dcv-box-name">{deck.name}</span>
              <span className="dcv-box-meta">
                {deck.cards ?? 10} CARTE · LEGA {deck.totalLeague ?? 30}
              </span>
            </div>
          </div>
          <div className="dcv-box-face dcv-box-spine" style={{ '--spine': spineArmy }}>
            <span className="dcv-box-spine-name">{deck.name}</span>
            <ArmyGlyphs armies={armies} className="dcv-glyphs dcv-box-spine-glyphs" />
          </div>
          {opening ? (
            <>
              <div className="dcv-box-face dcv-box-cavity" />
              <div className="dcv-box-fan">
                {fan.map((c, i) => (
                  <div key={c.id} className="dcv-box-card" style={{ '--i': i - (fan.length - 1) / 2 }}>
                    <img src={c.src} alt={c.name} draggable={false} />
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
          <div className="dcv-box-face dcv-box-back" />
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
 */
export function DeckCover({ deck, variant, isCenter = true, mirror = false, opening = false }) {
  if (!deck) return null;
  const art = coverArt(deck);
  const armies = deckArmies(deck);
  const props = { deck, art, armies, isCenter, mirror, opening };
  return (
    <div className="dcv-root" style={{ '--accent': deck.accent }}>
      {variant === 'box' ? <BoxCover {...props} />
        : variant === 'tarot' ? <TarotCover {...props} />
          : <FullArtCover {...props} />}
    </div>
  );
}

export default DeckCover;
