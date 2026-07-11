import React from 'react';
import { ARMY_COLORS } from '../../data';
import { CardBack } from '../cards/CardBack';
import { CardReworkP4Scaled } from '../cards/CardReworkP4';
import {
  SHUFFLE_DEAL_CARD_H,
  SHUFFLE_DEAL_CARD_W,
  SHUFFLE_DEAL_TIMING,
} from './cardShuffleDealLayout';

export function ShuffleDealAnimatedCard({
  animatedCard,
  deck,
  deckArmies,
  cardBackSrc = null,
  cardW = SHUFFLE_DEAL_CARD_W,
  cardH = SHUFFLE_DEAL_CARD_H,
}) {
  const { card, x, y, rot, scale, z, flipped, opacity = 1, transition } = animatedCard;
  const armyColor = ARMY_COLORS[card?.army]?.accent ?? '#94a3b8';
  const motionTransition =
    transition ??
    `${SHUFFLE_DEAL_TIMING.moveTransition}, ${SHUFFLE_DEAL_TIMING.opacityTransition}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: cardW,
        height: cardH,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`,
        transition: motionTransition,
        opacity,
        zIndex: z,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transition: SHUFFLE_DEAL_TIMING.flipTransition,
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <CardBack
            armies={deckArmies}
            deck={deck}
            backImage={cardBackSrc}
            fallbackArmy={card?.army}
            borderRadius={10}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#0a0a0d',
            border: '2px solid rgba(255,255,255,.28)',
            boxShadow: `0 0 0 1px ${armyColor}66, 0 4px 16px rgba(0,0,0,0.9)`,
          }}
        >
          <CardReworkP4Scaled agent={card} width={cardW} />
        </div>
      </div>
    </div>
  );
}
