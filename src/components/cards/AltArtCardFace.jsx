import React from 'react';
import { getAltFaceStyle } from '../cardFaceLab/cardFaceLabData.js';
import { ArcanaCardFace } from './ArcanaCardFace';
import { EldritchCardFace } from './EldritchCardFace';

/**
 * Router faccia alternativa: Eldritch o Arcana in base al kit registrato.
 * Arcana in partita/mano = layered (composition + testi live), senza parallasse.
 * Override con props (es. gallery `variant="static"` → composita bakeata).
 */
export function AltArtCardFace({ agent, ...props }) {
  if (!agent) return null;
  if (getAltFaceStyle(agent.id) === 'arcana') {
    return (
      <ArcanaCardFace
        agent={agent}
        variant="layered"
        motion={false}
        idleMotion={false}
        {...props}
      />
    );
  }
  return <EldritchCardFace agent={agent} {...props} />;
}
