import { resolveAlternateDiscardAnchor } from './shuffleFieldJitter';
import { scheduleRemainExit, stackOffsetForLayout } from './battlefieldDealMotion';

const ALTERNATE_DEAL_STAGGER_MS = 250;

/**
 * Una Sì Una No: alterna mano/scarto ma con le stesse carte del deal standard
 * (mano = order[0..handSize-1], scarti = order[handSize..]).
 */
export function scheduleAlternateBattlefieldDeal({
  after,
  setCard,
  layout,
  order,
  handSize,
  deckSize,
  startMs,
  dealScale = 1,
}) {
  const remainSize = deckSize - handSize;
  const discardIds = [];
  let t = startMs;
  const discardBase = resolveAlternateDiscardAnchor(layout);

  for (let k = 0; k < handSize; k++) {
    const handId = order[k];
    const discardId = order[handSize + k];

    after(t, () => {
      const slot = layout.getHandSlot(k, handSize);
      setCard(handId, {
        x: slot.x,
        y: slot.y,
        rot: slot.rot,
        z: 60 + k * 2,
        flipped: layout.flipOnDeal !== false,
        scale: dealScale,
        opacity: 1,
      });
    });
    t += ALTERNATE_DEAL_STAGGER_MS;

    discardIds.push(discardId);
    after(t, () => {
      const off = stackOffsetForLayout(layout, k, remainSize);
      setCard(discardId, {
        x: discardBase.x + off.x * 0.55,
        y: discardBase.y + off.y * 0.55,
        rot: (layout.deckRot ?? 0) + (k - 2) * 7,
        z: 48 + k,
        flipped: false,
        opacity: 1,
      });
    });
    t += ALTERNATE_DEAL_STAGGER_MS;
  }

  const dealEnd = t + 500;
  return scheduleRemainExit({
    after,
    setCard,
    layout,
    remainIds: discardIds,
    remainSize: discardIds.length,
    startMs: dealEnd,
  });
}
