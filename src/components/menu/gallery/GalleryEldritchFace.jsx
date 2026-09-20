import React from 'react';
import { EldritchCardFace } from '../../cards/EldritchCardFace.jsx';

/**
 * Anteprima Eldritch a livelli per la galleria (senza controlli lab).
 * @deprecated Preferire EldritchCardFace; tenuto come alias.
 */
export function GalleryEldritchFace({ agent, width = 311, className = '' }) {
  return (
    <EldritchCardFace agent={agent} width={width} className={className} showControls={false} />
  );
}
