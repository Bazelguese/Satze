import { SHUFFLE_DEAL_TIMING } from './cardShuffleDealLayout';
import { resolveDeckOrigin, resolveRemainAnchor } from './shuffleFieldJitter';

export { resolveDeckOrigin };

export function stackOffsetForLayout(layout, index, size) {
  if (layout.getRemainStackOffset) return layout.getRemainStackOffset(index, size);
  if (layout.getDeckStackOffset) return layout.getDeckStackOffset(index, size);
  return {
    x: index * 0.6,
    y: index * 1.4,
    rot: (index - (size - 1) / 2) * 0.8,
  };
}

/**
 * Mazzetto residuo esce dallo schermo (fade) come nello shuffle classico.
 */
export function scheduleRemainExit({
  after,
  setCard,
  layout,
  remainIds,
  remainSize,
  startMs,
}) {
  const { remainHoldMs, remainExitMs, remainExitTransition } = SHUFFLE_DEAL_TIMING;
  const exitStart = startMs + remainHoldMs;

  after(exitStart, () => {
    const exit = layout.getDeckExitTarget?.() ?? {
      x: resolveDeckOrigin(layout).x,
      y: resolveDeckOrigin(layout).y,
      rot: layout.deckRot ?? 0,
    };
    const baseRot = layout.deckRot ?? exit.rot;
    remainIds.forEach((deckIndex, pos) => {
      const off = stackOffsetForLayout(layout, pos, remainSize);
      setCard(deckIndex, {
        x: exit.x + off.x,
        y: exit.y + off.y,
        rot: exit.rot + (off.rot - baseRot),
        opacity: 0,
        z: 20 + pos,
        transition: remainExitTransition,
      });
    });
  });

  return exitStart + remainExitMs;
}

/**
 * Impila il mazzetto residuo sulla posizione scarti.
 */
export function placeRemainStack({
  setCard,
  layout,
  order,
  handSize,
  deckSize,
  remainIds = [],
}) {
  const remainSize = deckSize - handSize;
  const remainOrigin = resolveRemainAnchor(layout);
  order.slice(handSize).forEach((deckIndex, pos) => {
    remainIds.push(deckIndex);
    const off = stackOffsetForLayout(layout, pos, remainSize);
    setCard(deckIndex, {
      x: remainOrigin.x + off.x,
      y: remainOrigin.y + off.y,
      rot: off.rot,
      z: 20 + pos,
      flipped: false,
      opacity: 1,
    });
  });
  return remainIds;
}

/**
 * Deal + mazzetto residuo identico all'animazione classica (slot mano reali del campo).
 */
export function scheduleBattlefieldDeal({
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
  const remainIds = [];
  const { dealStaggerMs, moveDurationMs } = SHUFFLE_DEAL_TIMING;
  const lastDealMs = (handSize - 1) * dealStaggerMs;
  const placeRemainMs = startMs + lastDealMs;

  for (let k = 0; k < handSize; k++) {
    const deckIndex = order[k];
    after(startMs + k * dealStaggerMs, () => {
      const slot = layout.getHandSlot(k, handSize);
      setCard(deckIndex, {
        x: slot.x,
        y: slot.y,
        rot: slot.rot,
        z: 50 + k,
        flipped: layout.flipOnDeal !== false,
        scale: dealScale,
        opacity: 1,
      });
    });
  }

  // Scarti visibili solo dopo l'ultima carta in mano (restano sul mazzo fino ad allora).
  after(placeRemainMs, () => {
    placeRemainStack({
      setCard,
      layout,
      order,
      handSize,
      deckSize,
      remainIds,
    });
  });

  return scheduleRemainExit({
    after,
    setCard,
    layout,
    remainIds,
    remainSize,
    startMs: placeRemainMs + moveDurationMs,
  });
}

/** Posizione iniziale / restack sul mazzo inclinato del campo. */
export function applyDeckStackPosition(layout, deckIndex, pos, deckSize) {
  const deckOrigin = resolveDeckOrigin(layout);
  const off = stackOffsetForLayout(layout, pos, deckSize);
  return {
    x: deckOrigin.x + off.x,
    y: deckOrigin.y + off.y,
    rot: off.rot,
    scale: 1,
    z: deckSize - pos,
    flipped: false,
    opacity: 1,
  };
}
