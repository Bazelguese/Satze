import { resolveDeckOrigin } from './shuffleFieldJitter';

/**
 * Mappa coordinate locali del kit (palco orizzontale) sul campo.
 * X orizzontale + Y verticale; nemico speculare su entrambi gli assi.
 */

/**
 * @param {ReturnType<import('./cardShuffleDealLayout').createBattlefieldShuffleDealLayout>} layout
 * @param {ReturnType<import('./shuffleKitGeometry').buildShuffleKitGeometry>} geometry
 */
export function createShuffleZoneTransform(layout, geometry) {
  const mirrorX = geometry.mirrorX ?? 1;
  const mirrorY = geometry.mirrorY ?? 1;
  const anchor = resolveDeckOrigin(layout);
  const localDeck = geometry.deck;
  const deckRot = layout.deckRot ?? 0;

  const mapPoint = (localX, localY) => {
    const dlx = localX - localDeck.x;
    const dly = localY - localDeck.y;
    return {
      x: anchor.x + dlx * mirrorX,
      y: anchor.y + dly * mirrorY,
    };
  };

  const mapPatch = (patch) => {
    if (patch == null) return patch;
    const next = { ...patch };
    if (patch.x != null || patch.y != null) {
      const mapped = mapPoint(patch.x ?? localDeck.x, patch.y ?? localDeck.y);
      next.x = mapped.x;
      next.y = mapped.y;
    }
    if (patch.rot != null) {
      next.rot = deckRot + patch.rot * mirrorX * mirrorY;
    }
    return next;
  };

  return { mapPoint, mapPatch, mirrorX, mirrorY };
};
