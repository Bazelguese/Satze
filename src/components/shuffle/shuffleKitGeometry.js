import { DEFAULT_GEOMETRY } from './shuffleKit';
import { SHUFFLE_DEAL_HAND_SIZE } from './cardShuffleDealLayout';

/**
 * Geometria compatta per coreografie kit: palco locale attorno al mazzo (non 1920×1080).
 * @param {ReturnType<import('./cardShuffleDealLayout').createBattlefieldShuffleDealLayout>} layout
 */
export function buildShuffleKitGeometry(layout) {
  const side = layout.side ?? 'player';
  const handCount = SHUFFLE_DEAL_HAND_SIZE;
  const slots = Array.from({ length: handCount }, (_, i) => layout.getHandSlot(i, handCount));
  const deckGlobal = layout.deckPos;
  const handCx = slots.reduce((s, p) => s + p.x, 0) / handCount;
  const handCy = slots.reduce((s, p) => s + p.y, 0) / handCount;
  const span = Math.hypot(handCx - deckGlobal.x, handCy - deckGlobal.y);

  // Palco locale solo per la coreografia shuffle (il deal usa le posizioni mano reali).
  const zoneW = Math.round(Math.min(620, Math.max(460, span * 1.55)));
  const zoneH = Math.round(Math.min(440, Math.max(320, span * 1.2)));
  const deckLocalX = zoneW / 2;
  const deckLocalY = zoneH * 0.42;
  const handSpread = Math.min(340, Math.max(260, span * 0.9));
  const remainOffset = 68 * (side === 'enemy' ? 1 : -1);

  return {
    side,
    mirrorX: side === 'enemy' ? -1 : 1,
    mirrorY: side === 'enemy' ? -1 : 1,
    zoneW,
    zoneH,
    stageW: zoneW,
    stageH: zoneH,
    cardW: layout.cardW ?? DEFAULT_GEOMETRY.cardW,
    cardH: layout.cardH ?? DEFAULT_GEOMETRY.cardH,
    deck: { x: deckLocalX, y: deckLocalY },
    remain: { x: deckLocalX + remainOffset, y: deckLocalY },
    handY: zoneH * 0.8,
    fanSpread: handSpread * 1.12,
    fanArch: DEFAULT_GEOMETRY.fanArch,
    fanRot: DEFAULT_GEOMETRY.fanRot,
    handSpread,
    handArch: DEFAULT_GEOMETRY.handArch,
    handRot: DEFAULT_GEOMETRY.handRot,
    dealScale: layout.dealScale ?? 1,
  };
}

/** Layout compatto per anteprima nel menu eserciti. */
export function createPreviewShuffleLayout() {
  const stageWidth = 340;
  const stageHeight = 220;
  const stageCx = stageWidth / 2;
  return {
    side: 'player',
    stageWidth,
    stageHeight,
    cardW: 72,
    cardH: 102,
    deckPos: { x: stageCx, y: stageHeight * 0.42 },
    remainPos: { x: stageWidth * 0.22, y: stageHeight * 0.42 },
    deckRot: 0,
    dealScale: 0.92,
    flipOnDeal: true,
    getHandSlot: (i, n) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      return {
        x: stageCx + (t - 0.5) * 220,
        y: stageHeight - 36,
        rot: (t - 0.5) * 32,
      };
    },
    getDeckExitTarget: () => ({ x: stageWidth + 60, y: stageHeight + 40, rot: 10 }),
  };
}
