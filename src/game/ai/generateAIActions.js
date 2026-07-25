// ============================================
// Generazione azioni legali carta + Focus
// ============================================

import { AI_MIN_FOCUS } from './aiConstants.js';

/**
 * Normalizza usedCards (id o oggetti) in Set di id.
 * @param {Array} usedCardIds
 */
export function normalizeUsedIdSet(usedCardIds) {
  const set = new Set();
  for (const entry of usedCardIds || []) {
    if (entry == null) continue;
    if (typeof entry === 'object') {
      if (entry.id != null) set.add(entry.id);
    } else {
      set.add(entry);
    }
  }
  return set;
}

/**
 * @param {Array} hand
 * @param {Array} usedCardIds
 */
export function getAvailableCards(hand, usedCardIds) {
  const used = normalizeUsedIdSet(usedCardIds);
  return (hand || []).filter((card) => card && card.id != null && !used.has(card.id));
}

/**
 * Riserva UI: 1 FC per ogni carta ancora da giocare dopo quella corrente.
 * Allineata a FocusCoinSelector (max - reserved).
 *
 * @param {number} focusPool
 * @param {number} availableCardCount
 */
export function getReservedFocus(focusPool, availableCardCount) {
  const reserved = Math.max(0, (availableCardCount || 0) - 1);
  return reserved;
}

/**
 * Range Focus legale per un lato (stesse regole del selettore giocatore).
 *
 * @param {object} context
 * @param {'ai'|'player'} side
 * @returns {{ minFocus: number, maxFocus: number, reserved: number, pool: number }}
 */
export function getLegalFocusRange(context, side) {
  const sideState = side === 'ai' ? context.ai : context.player;
  const available = getAvailableCards(sideState.hand, sideState.usedCardIds);
  const pool = Math.max(0, Number(sideState.focus) || 0);
  const reserved = getReservedFocus(pool, available.length);
  const maxFocus = Math.max(AI_MIN_FOCUS, pool - reserved);
  const minFocus = AI_MIN_FOCUS;

  // Se il pool è 0, il gioco può essere in stato terminale: resta comunque min 1
  // come UI, ma generateActions filtrerà se non ci sono carte.
  return {
    minFocus,
    maxFocus: Math.min(maxFocus, Math.max(pool, AI_MIN_FOCUS)),
    reserved,
    pool,
  };
}

/**
 * Genera tutte le coppie legali carta × Focus per un lato.
 *
 * @param {object} context
 * @param {'ai'|'player'} side
 * @param {number|null} [fieldIndex]
 */
export function generateActionsForSide(context, side, fieldIndex = null) {
  const sideState = side === 'ai' ? context.ai : context.player;
  const cards = getAvailableCards(sideState.hand, sideState.usedCardIds);
  const { minFocus, maxFocus } = getLegalFocusRange(context, side);
  const resolvedFieldIndex =
    fieldIndex != null ? fieldIndex : context.currentFieldIndex;

  const actions = [];
  for (const card of cards) {
    for (let focus = minFocus; focus <= maxFocus; focus += 1) {
      actions.push({
        card,
        cardId: card.id,
        focus,
        fieldIndex: resolvedFieldIndex,
      });
    }
  }
  return actions;
}

/**
 * Azioni IA sul Campo corrente.
 * @param {object} context
 */
export function generateAIActions(context) {
  return generateActionsForSide(context, 'ai', context.currentFieldIndex);
}
