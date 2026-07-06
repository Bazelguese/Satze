import { useMemo, useState } from 'react';
import { MENU_ACCENTS } from '../../../theme/hudOratorioPalette';
import { CosmicBannerButton } from './CosmicBannerButton';

function wrapIndex(index, length) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

export function CosmicDeckCarousel({ decks, onChooseDeck }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const total = decks.length;

  const slots = useMemo(() => {
    if (!total) return [];
    const left = wrapIndex(activeIdx - 1, total);
    const center = wrapIndex(activeIdx, total);
    const right = wrapIndex(activeIdx + 1, total);
    return [left, center, right];
  }, [activeIdx, total]);

  if (!total) return null;

  const activeDeck = decks[wrapIndex(activeIdx, total)];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => setActiveIdx((idx) => wrapIndex(idx - 1, total))}
          style={arrowStyle(false)}
        >
          ‹
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minHeight: '320px', justifyContent: 'center' }}>
          {slots.map((deckIndex, idx) => {
            const deck = decks[deckIndex];
            const isCenter = idx === 1;
            return (
              <button
                key={deck.key}
                type="button"
                onClick={() => setActiveIdx(deckIndex)}
                style={{
                  width: '240px',
                  minHeight: '300px',
                  border: `1.5px solid ${isCenter ? MENU_ACCENTS.hotPink : '#6f3c8e'}`,
                  background: 'linear-gradient(180deg, rgba(20,8,28,0.98) 0%, rgba(8,7,13,0.98) 100%)',
                  color: MENU_ACCENTS.text,
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transform: isCenter ? 'scale(1.06)' : 'scale(0.86)',
                  opacity: isCenter ? 1 : 0.62,
                  transition: 'transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease',
                  boxShadow: isCenter ? '0 0 26px rgba(255,45,184,0.32)' : 'none',
                }}
              >
                <div style={{ fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: deck.accent, marginBottom: '6px' }}>
                  {deck.armyLabel}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.06rem', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  {deck.name}
                </div>
                {deck.description ? (
                  <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#b5afc4' }}>{deck.description}</p>
                ) : null}
                <p style={{ margin: 0, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#d2cce0', letterSpacing: '0.12em' }}>
                  {deck.meta}
                </p>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setActiveIdx((idx) => wrapIndex(idx + 1, total))}
          style={arrowStyle(true)}
        >
          ›
        </button>
      </div>

      <CosmicBannerButton
        accent={activeDeck.accent || MENU_ACCENTS.magenta}
        disabled={activeDeck.disabled}
        onClick={() => onChooseDeck(activeDeck)}
        style={{ minWidth: '360px' }}
      >
        {activeDeck.disabled ? 'Mazzo non selezionabile' : 'Seleziona questo mazzo'}
      </CosmicBannerButton>
    </div>
  );
}

function arrowStyle(isRight) {
  return {
    width: '48px',
    height: '74px',
    border: '1.5px solid #7e3f9f',
    background: '#150b21',
    color: MENU_ACCENTS.hotPink,
    fontFamily: "'Cinzel', serif",
    fontSize: '2rem',
    cursor: 'pointer',
    clipPath: isRight
      ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
      : 'polygon(16px 0, 100% 0, 100% 100%, 16px 100%, 0 50%)',
  };
}
