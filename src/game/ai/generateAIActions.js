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
 * Decide quando la potatura euristica dei Focus non è accettabile.
 * - Difficile: risposta a carta visibile, minaccia territoriale/letale o endgame.
 * - Normale: risposta a carta visibile o ultime due carte.
 * - Facile: resta volutamente approssimativa.
 */
export function shouldUseExactFocusSearch(context, profile) {
  const mode = profile?.exactFocusSearch || 'off';
  if (mode === 'always') return true;
  if (mode === 'off') return false;

  const respondingToVisibleCard = Boolean(context?.isPlayerFirst && context?.player?.visibleCard);
  const available = getAvailableCards(context?.ai?.hand, context?.ai?.usedCardIds);
  const endgame = available.length <= (profile?.exactFocusEndgameCards ?? 2);
  const fieldThreat =
    (context?.enemyFieldsConquered || 0) >= 2 ||
    (context?.playerFieldsConquered || 0) >= 2;
  const hpThreat =
    (context?.player?.hp || 0) <= (profile?.exactFocusHpThreshold ?? 6) ||
    (context?.ai?.hp || 0) <= (profile?.exactFocusHpThreshold ?? 6);

  if (mode === 'responding') return respondingToVisibleCard || endgame;
  if (mode === 'critical') {
    return respondingToVisibleCard || endgame || fieldThreat || hpThreat;
  }
  return false;
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
 * Candidati Focus strategici per una carta.
 * Nei momenti decisivi restituisce l'intero intervallo legale, così una puntata
 * esatta non può essere eliminata prima della simulazione del duello.
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

  const exactSearch = shouldUseExactFocusSearch(context, profile);
  if (exactSearch) {
    const focuses = [];
    for (let focus = minFocus; focus <= maxFocus; focus += 1) focuses.push(focus);
    return {
      focuses,
      exactSearch: true,
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
  if (wantsOd) values.push(odThreshold);

  if (fieldMods.winnerByFocusNotVa) {
    values.push(Math.min(legalMax, ordinaryCap + 2));
  }

  const maxAction = {
    card,
    cardId: card?.id,
    focus: legalMax,
    fieldIndex: context.currentFieldIndex,
  };
  const maxException = getFocusCapException(context, maxAction, profile, budget);
  if (maxException.allowed && (maxException.reason || cardsRemaining <= 1)) {
    values.push(legalMax);
  }

  if (wantsOd && odThreshold > ordinaryCap) {
    const odAction = {
      card,
      cardId: card?.id,
      focus: odThreshold,
      fieldIndex: context.currentFieldIndex,
    };
    const odEx = getFocusCapException(context, odAction, profile, budget);
    if (odEx.allowed) values.push(odThreshold);
  }

  const unique = [...new Set(values)]
    .map((v) => Math.max(minFocus, Math.min(maxFocus, Math.round(v))))
    .filter((v) => v >= minFocus && v <= maxFocus)
    .sort((a, b) => a - b);

  return {
    focuses: unique,
    exactSearch: false,
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
 * Azioni strategiche IA.
 */
export function generateStrategicActionsForSide(context, side, profile, fieldIndex = null) {
  if (side !== 'ai') {
    return generateActionsForSide(context, side, fieldIndex);
  }

  const cards = getAvailableCards(context.ai.hand, context.ai.usedCardIds);
  const resolvedFieldIndex =
    fieldIndex != null ? fieldIndex : context.currentFieldIndex;
  const actions = [];

  for (const card of cards) {
    const { focuses, budget, exactSearch } = generateStrategicFocusCandidates(
      context,
      card,
      profile
    );
    for (const focus of focuses) {
      const action = {
        card,
        cardId: card.id,
        focus,
        fieldIndex: resolvedFieldIndex,
      };
      const exception = getFocusCapException(context, action, profile, budget);
      // In ricerca esatta il cap resta una preferenza di scoring, non un divieto.
      if (!exactSearch && focus > budget.ordinaryCap && !exception.allowed) continue;
      actions.push({
        ...action,
        meta: {
          fairShare: budget.fairShare,
          ordinaryCap: budget.ordinaryCap,
          standardFocus: budget.standardFocus,
          exceptionReason: exception.reason,
          exactFocusSearch: exactSearch,
        },
      });
    }
  }

  return actions;
}

export function generateAIActions(context) {
  return generateActionsForSide(context, 'ai', context.currentFieldIndex);
}

export { estimateStandardFocus };
