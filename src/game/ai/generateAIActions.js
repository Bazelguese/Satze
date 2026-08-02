// ============================================
// Generazione azioni legali / strategiche carta + Focus
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import {
  computeLegalMaxFocus,
  getReservedFocus as reservedFromCardCount,
} from '../legalFocusSpend.js';
import { AI_MIN_FOCUS } from './aiConstants.js';
import {
  getOrdinaryFocusCap,
  getFocusCapException,
  estimateStandardFocus,
} from './focusBudget.js';

export { computeLegalMaxFocus } from '../legalFocusSpend.js';

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
 * Firma storica: il primo argomento (pool) è ignorato.
 */
export function getReservedFocus(_focusPool, availableCardCount) {
  return reservedFromCardCount(availableCardCount);
}

/**
 * Range Focus legale per un lato (stesse regole del selettore giocatore).
 *
 * @param {object} context
 * @param {'ai'|'player'} side
 */
export function getLegalFocusRange(context, side) {
  const sideState = side === 'ai' ? context.ai : context.player;
  const available = getAvailableCards(sideState.hand, sideState.usedCardIds);
  const pool = Math.max(0, Number(sideState.focusPool ?? sideState.focus) || 0);
  const reserved = getReservedFocus(pool, available.length);
  const maxFocus = computeLegalMaxFocus(pool, reserved);
  const minFocus = AI_MIN_FOCUS;

  return {
    minFocus,
    maxFocus,
    reserved,
    pool,
  };
}

/**
 * Genera tutte le coppie legali carta × Focus (test / simulazioni mirate).
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
 * Candidati Focus strategici per una carta (non tutti i valori legali).
 */
export function generateStrategicFocusCandidates(context, card, profile) {
  const { minFocus, maxFocus } = getLegalFocusRange(context, 'ai');
  const budget = getOrdinaryFocusCap(context, 'ai', profile);
  const {
    fairShare,
    ordinaryCap,
    legalMax,
    pool,
    cardsRemaining,
    standardFocus,
  } = budget;

  const fieldMods = getFieldModifiers(context.field);
  const odThreshold = fieldMods.overdriveThreshold || 5;
  const pressure = Math.min(ordinaryCap, standardFocus + 1);

  const values = [
    minFocus,
    fairShare,
    standardFocus,
    pressure,
    ordinaryCap,
  ];

  const wantsOd =
    card?.ability?.trigger === 'overdrive' ||
    fieldMods.overdriveExtraPowerAndDamage === true;
  if (wantsOd) {
    values.push(odThreshold);
  }

  if (fieldMods.winnerByFocusNotVa) {
    values.push(Math.min(legalMax, ordinaryCap + 2));
  }

  // Max legale solo se un'eccezione lo giustifica
  const maxAction = { card, cardId: card?.id, focus: legalMax, fieldIndex: context.currentFieldIndex };
  const maxException = getFocusCapException(context, maxAction, profile, budget);
  if (maxException.allowed && (maxException.reason || cardsRemaining <= 1)) {
    values.push(legalMax);
  }

  // Soglia OD sopra cap: solo se eccezione overdrive-soglia
  if (wantsOd && odThreshold > ordinaryCap) {
    const odAction = { card, cardId: card?.id, focus: odThreshold, fieldIndex: context.currentFieldIndex };
    const odEx = getFocusCapException(context, odAction, profile, budget);
    if (odEx.allowed) values.push(odThreshold);
  }

  const unique = [...new Set(values)]
    .map((v) => Math.max(minFocus, Math.min(maxFocus, Math.round(v))))
    .filter((v) => v >= minFocus && v <= maxFocus)
    .sort((a, b) => a - b);

  return {
    focuses: unique,
    budget: {
      fairShare,
      ordinaryCap,
      legalMax,
      pool,
      cardsRemaining,
      standardFocus,
    },
  };
}

/**
 * Azioni strategiche IA: poche varianti Focus per carta.
 */
export function generateStrategicActionsForSide(context, side, profile, fieldIndex = null) {
  if (side !== 'ai') {
    // Per il giocatore usiamo scenari dedicati; fallback enumerazione ridotta
    return generateActionsForSide(context, side, fieldIndex);
  }

  const cards = getAvailableCards(context.ai.hand, context.ai.usedCardIds);
  const resolvedFieldIndex =
    fieldIndex != null ? fieldIndex : context.currentFieldIndex;
  const actions = [];

  for (const card of cards) {
    const { focuses, budget } = generateStrategicFocusCandidates(context, card, profile);
    for (const focus of focuses) {
      const action = {
        card,
        cardId: card.id,
        focus,
        fieldIndex: resolvedFieldIndex,
      };
      const exception = getFocusCapException(context, action, profile, budget);
      // Escludi candidati sopra cap senza eccezione
      if (focus > budget.ordinaryCap && !exception.allowed) continue;
      actions.push({
        ...action,
        meta: {
          fairShare: budget.fairShare,
          ordinaryCap: budget.ordinaryCap,
          standardFocus: budget.standardFocus,
          exceptionReason: exception.reason,
        },
      });
    }
  }

  return actions;
}

export function generateAIActions(context) {
  return generateActionsForSide(context, 'ai', context.currentFieldIndex);
}

// Re-export utili per i test
export { estimateStandardFocus };
