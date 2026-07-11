// Layout e timing per l'animazione shuffle & deal (handoff CardShuffleDeal).

import {
  BATTLEFIELD_VIEWPORT,
  getEnemyDeckCenter,
  getEnemyFanSlot,
  getEnemyHandCardCenter,
  getEnemyRemainCenter,
  getPlayerDeckCenter,
  getPlayerFanSlot,
  getPlayerHandCardCenter,
  getPlayerRemainCenter,
  getDeckExitTarget,
  getHandAxis,
  deckStackOffsetAlongAxis,
  HAND_CARD_H,
  HAND_CARD_W,
} from '../../config/battlefieldHandLayout';

export const SHUFFLE_DEAL_CARD_W = HAND_CARD_W;
export const SHUFFLE_DEAL_CARD_H = HAND_CARD_H;
export const SHUFFLE_DEAL_HAND_SIZE = 5;

export const SHUFFLE_DEAL_TIMING = {
  fanOutMs: 500,
  scrambleStartMs: 1350,
  scrambleRoundMs: 620,
  scrambleRounds: 2,
  restackMs: 900,
  dealStaggerMs: 300,
  /** Durata transizione posizione (allineata al CSS moveTransition). */
  moveDurationMs: 700,
  /** Pausa con il mazzetto residuo visibile dopo l'atterraggio dell'ultima carta in mano. */
  remainHoldMs: 650,
  /** Volo del mazzetto verso la mano e fuori dallo schermo. */
  remainExitMs: 800,
  opacityTransition: 'opacity .55s cubic-bezier(.4,0,.2,1)',
  moveTransition: 'left .7s cubic-bezier(.4,0,.2,1), top .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1)',
  remainExitTransition:
    'left .8s cubic-bezier(.45,0,.2,1), top .8s cubic-bezier(.45,0,.2,1), transform .8s cubic-bezier(.45,0,.2,1), opacity .75s cubic-bezier(.4,0,.2,1)',
  flipTransition: 'transform .6s cubic-bezier(.4,0,.2,1)',
};

/**
 * @param {number} i
 * @param {number} n
 * @param {{ stageCx: number, fanWidth: number, archDepth: number, rotSpread: number, yBase: number }} layout
 */
export function fanSlot(i, n, layout) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return {
    x: layout.stageCx + (t - 0.5) * layout.fanWidth,
    y: layout.yBase - Math.sin(t * Math.PI) * layout.archDepth,
    rot: (t - 0.5) * layout.rotSpread,
  };
}

/**
 * @param {number} i
 * @param {number} n
 * @param {{ stageCx: number, handWidth: number, archDepth: number, rotSpread: number, handY: number }} layout
 */
export function handSlot(i, n, layout) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return {
    x: layout.stageCx + (t - 0.5) * layout.handWidth,
    y: layout.handY - Math.sin(t * Math.PI) * layout.archDepth,
    rot: (t - 0.5) * layout.rotSpread,
  };
}

/**
 * Profilo layout per una singola zona (giocatore in basso o avversario in alto).
 * @param {'player'|'enemy'} side
 * @param {{ stageWidth?: number, stageHeight?: number }} [opts]
 */
export function createShuffleDealLayout(side, opts = {}) {
  const stageWidth = opts.stageWidth ?? 1000;
  const stageHeight = opts.stageHeight ?? 280;
  const stageCx = stageWidth / 2;
  const stageCy = stageHeight / 2;
  const isPlayer = side === 'player';

  return {
    side,
    stageWidth,
    stageHeight,
    stageCx,
    stageCy,
    fanWidth: 620,
    handWidth: 480,
    fanArchDepth: 36,
    handArchDepth: 22,
    fanRotSpread: 56,
    handRotSpread: 44,
    deckPos: { x: stageWidth * 0.33, y: stageCy },
    remainPos: { x: stageWidth * 0.15, y: stageCy },
    handY: isPlayer ? stageHeight - 58 : 58,
    yBase: stageCy,
    dealScale: 1.06,
    flipOnDeal: true,
    getDeckExitTarget: () => ({
      x: isPlayer ? stageWidth + 140 : -140,
      y: isPlayer ? stageHeight + 140 : -140,
      rot: isPlayer ? 14 : -14,
    }),
  };
}

/**
 * Layout allineato al campo di battaglia reale (1920×1080, posizioni Hand).
 * @param {'player'|'enemy'} side
 */
export function createBattlefieldShuffleDealLayout(side) {
  const isEnemy = side === 'enemy';
  const deck = isEnemy ? getEnemyDeckCenter() : getPlayerDeckCenter();
  const remain = isEnemy ? getEnemyRemainCenter() : getPlayerRemainCenter();

  return {
    side,
    stageWidth: BATTLEFIELD_VIEWPORT.width,
    stageHeight: BATTLEFIELD_VIEWPORT.height,
    cardW: HAND_CARD_W,
    cardH: HAND_CARD_H,
    deckPos: { x: deck.x, y: deck.y },
    deckRot: deck.rot,
    remainPos: { x: remain.x, y: remain.y },
    remainRot: remain.rot,
    dealScale: 1,
    flipOnDeal: true,
    getDeckStackOffset: (index, deckSize) => deckStackOffsetAlongAxis(index, deckSize, deck.rot),
    getRemainStackOffset: (index, remainSize) =>
      deckStackOffsetAlongAxis(index, remainSize, remain.rot),
    getFanSlot: (i, n) => (isEnemy ? getEnemyFanSlot(i, n) : getPlayerFanSlot(i, n)),
    getHandSlot: (i, n) => {
      const slot = isEnemy ? getEnemyHandCardCenter(i) : getPlayerHandCardCenter(i);
      return { x: slot.x, y: slot.y, rot: slot.rot };
    },
    getDeckExitTarget: () => getDeckExitTarget(side),
  };
}

/** @param {number} deckSize */
export function deckStackOffset(index, deckSize) {
  return {
    x: index * 0.6,
    y: index * 1.4,
    rot: (index - (deckSize - 1) / 2) * 0.8,
  };
}

/**
 * Calcola i millisecondi totali della sequenza.
 * @param {number} deckSize
 * @param {number} [handSize]
 */
export function getShuffleDealDurationMs(
  deckSize = 10,
  handSize = SHUFFLE_DEAL_HAND_SIZE,
  timing = SHUFFLE_DEAL_TIMING
) {
  const scrambleEnd =
    timing.scrambleStartMs + timing.scrambleRounds * timing.scrambleRoundMs;
  const dealStart = scrambleEnd + timing.restackMs;
  const lastDealMs = (handSize - 1) * timing.dealStaggerMs;
  return (
    dealStart +
    lastDealMs +
    timing.moveDurationMs +
    timing.remainHoldMs +
    timing.remainExitMs
  );
}

/**
 * Indici mazzo delle carte in mano (prime `handSize` dell'ordine finale).
 * Tutte le animazioni devono consegnare visivamente queste carte.
 */
export function getDealtHandIndices(finalOrder, handSize = SHUFFLE_DEAL_HAND_SIZE) {
  return finalOrder.slice(0, handSize);
}

/** Indici mazzo del mazzetto residuo / scarti. */
export function getRemainDeckIndices(finalOrder, handSize = SHUFFLE_DEAL_HAND_SIZE) {
  return finalOrder.slice(handSize);
}
