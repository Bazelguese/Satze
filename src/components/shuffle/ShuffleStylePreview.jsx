import React, { useMemo } from 'react';
import { pickDistinctCardBackPair } from '../../utils/cardBackPicker';
import { getShuffleStyleMeta, CLASSIC_SHUFFLE_KIND } from '../../utils/shuffleStylePreference';
import { BATTLEFIELD_VIEWPORT } from '../../config/battlefieldHandLayout';
import { CardShuffleDealStage } from './CardShuffleDealStage';
import { createBattlefieldShuffleDealLayout } from './cardShuffleDealLayout';

/**
 * Anteprima compatta dell'animazione shuffle (stesso layout del duello, scalato).
 */
export function ShuffleStylePreview({ kind, deck, accent = '#a78bfa' }) {
  const layout = useMemo(() => createBattlefieldShuffleDealLayout('player'), []);
  const previewDeck = useMemo(() => {
    if (deck?.length >= 10) return deck.slice(0, 10);
    const filler = deck?.[0];
    return Array.from({ length: 10 }, (_, i) => filler ?? { id: `preview-${i}`, army: 'Kethran' });
  }, [deck]);

  const { playerCardBack } = useMemo(() => pickDistinctCardBackPair(), []);
  const meta = getShuffleStyleMeta(kind);
  const isClassic = kind === CLASSIC_SHUFFLE_KIND;
  const focus = useMemo(() => {
    const deckPos = layout.deckPos;
    const hand = layout.getHandSlot(2, 5);
    return {
      x: (deckPos.x + hand.x) / 2,
      y: (deckPos.y + hand.y) / 2 - 40,
      scale: 0.3,
    };
  }, [layout]);

  return (
    <div className="ssh-wrap" style={{ '--ssh-accent': accent }}>
      <div className="ssh-head">
        <span className="ssh-eye">MISCHIA</span>
        <span className="ssh-title">{meta.title}</span>
      </div>
      <div className="ssh-stage">
        <div
          className="ssh-world"
          style={{
            width: BATTLEFIELD_VIEWPORT.width,
            height: BATTLEFIELD_VIEWPORT.height,
            left: `calc(50% - ${focus.x * focus.scale}px)`,
            top: `calc(50% - ${focus.y * focus.scale}px)`,
            transform: `scale(${focus.scale})`,
          }}
        >
          <CardShuffleDealStage
            key={kind}
            deck={previewDeck}
            layout={layout}
            shuffleKind={kind}
            cardBackSrc={playerCardBack}
            battlefield
            autoPlay
            loop={!isClassic}
            timeScale={1}
          />
        </div>
      </div>
      <p className="ssh-desc">{meta.desc}</p>
      <ShuffleStylePreviewStyles />
    </div>
  );
}

function ShuffleStylePreviewStyles() {
  return (
    <style>{`
      .ssh-wrap {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(5,6,8,0.82);
        border: 1.5px solid color-mix(in srgb, var(--ssh-accent) 55%, rgba(255,255,255,0.18));
        clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .ssh-head { display: flex; flex-direction: column; gap: 2px; }
      .ssh-eye {
        font-family: 'Share Tech Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.32em;
        color: var(--ssh-accent);
        font-weight: 700;
      }
      .ssh-title {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.08em;
        color: #f5f3eb;
        text-transform: uppercase;
      }
      .ssh-stage {
        position: relative;
        width: 100%;
        height: 220px;
        border-radius: 6px;
        overflow: hidden;
        background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--ssh-accent) 12%, transparent), #0a0a0e 72%);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .ssh-world {
        position: absolute;
        transform-origin: 0 0;
        pointer-events: none;
      }
      .ssh-desc {
        margin: 0;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        line-height: 1.45;
        letter-spacing: 0.04em;
        color: rgba(203,213,225,0.82);
      }
    `}</style>
  );
}
