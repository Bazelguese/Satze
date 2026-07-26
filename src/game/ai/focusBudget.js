// ============================================
// Budget razionale Focus Coin per l'IA
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import { AI_MIN_FOCUS, OVERINVESTMENT_ROUND_MULTIPLIER } from './aiConstants.js';

function usedIdSet(usedCardIds) {
  const set = new Set();
  for (const entry of usedCardIds || []) {
    if (entry == null) continue;
    set.add(typeof entry === 'object' ? entry.id : entry);
  }
  return set;
}

function availableCount(sideState) {
  const used = usedIdSet(sideState?.usedCardIds);
  return (sideState?.hand || []).filter((c) => c && c.id != null && !used.has(c.id)).length;
}

function sidePool(sideState) {
  return Math.max(0, Number(sideState?.focusPool ?? sideState?.focus) || 0);
}

function legalMaxForSide(sideState) {
  const cards = availableCount(sideState);
  const pool = sidePool(sideState);
  const reserved = Math.max(0, cards - 1);
  return Math.max(AI_MIN_FOCUS, Math.min(pool - reserved, Math.max(pool, AI_MIN_FOCUS)));
}

/**
 * @param {{ focusPool: number, cardsRemaining: number, profile: object }} args
 */
export function estimateStandardFocus({ focusPool, cardsRemaining, profile }) {
  const cards = Math.max(1, cardsRemaining || 1);
  const fairShare = Math.ceil(Math.max(0, focusPool) / cards);
  const buffer = profile?.standardFocusBuffer ?? 1;
  return Math.max(AI_MIN_FOCUS, fairShare + buffer);
}

export function getFairShare(focusPool, cardsRemaining) {
  return Math.ceil(Math.max(0, focusPool) / Math.max(1, cardsRemaining || 1));
}

/**
 * Cap ordinario (quota + buffer + early share).
 * @param {object} context
 * @param {'ai'|'player'} side
 * @param {object} profile
 */
export function getOrdinaryFocusCap(context, side, profile) {
  const sideState = side === 'ai' ? context.ai : context.player;
  const cardsRemaining = availableCount(sideState);
  const pool = sidePool(sideState);
  const maxFocus = legalMaxForSide(sideState);
  const fairShare = getFairShare(pool, cardsRemaining);
  const buffer = profile?.ordinaryFocusBuffer ?? 2;
  let ordinaryCap = Math.min(maxFocus, fairShare + buffer);

  const round = context.roundNumber || 1;
  if (round <= 2) {
    const share = profile?.earlyPoolShareCap ?? 0.4;
    const percentageCap = Math.ceil(pool * share);
    ordinaryCap = Math.min(ordinaryCap, Math.max(AI_MIN_FOCUS, percentageCap));
  }

  return {
    fairShare,
    ordinaryCap: Math.max(AI_MIN_FOCUS, ordinaryCap),
    legalMax: maxFocus,
    pool,
    cardsRemaining,
    standardFocus: estimateStandardFocus({ focusPool: pool, cardsRemaining, profile }),
  };
}

/**
 * Eccezioni esplicite al cap ordinario.
 * @returns {{ allowed: boolean, reason: string|null, maxFocus?: number }}
 */
export function getFocusCapException(context, action, profile, budget) {
  const focus = action?.focus ?? 0;
  const card = action?.card;
  const ordinaryCap = budget?.ordinaryCap ?? 1;
  const legalMax = budget?.legalMax ?? focus;
  const cardsRemaining = budget?.cardsRemaining ?? 1;

  if (focus <= ordinaryCap) {
    return { allowed: true, reason: null };
  }

  if (cardsRemaining <= 1) {
    return { allowed: true, reason: 'ultima-carta', maxFocus: legalMax };
  }

  const pool = budget?.pool ?? 0;
  if (cardsRemaining === 2 && pool >= (budget.fairShare || 1) * 4) {
    return { allowed: true, reason: 'penultima-risorse-abbondanti', maxFocus: legalMax };
  }

  const playerHp = context.player?.hp ?? 0;
  const dmg = card?.damage ?? 0;
  const direct =
    card?.ability?.effect === 'directDamage' ? Math.abs(card.ability?.value || 0) : 0;
  if ((dmg > 0 && dmg >= playerHp) || (direct > 0 && direct >= playerHp)) {
    return { allowed: true, reason: 'possibile-letale', maxFocus: legalMax };
  }

  if ((context.enemyFieldsConquered || 0) >= 2) {
    return { allowed: true, reason: 'terzo-campo', maxFocus: legalMax };
  }

  const fieldMods = getFieldModifiers(context.field);
  if (fieldMods.winnerByFocusNotVa) {
    return { allowed: true, reason: 'campo-winner-by-focus', maxFocus: legalMax };
  }

  const odThreshold = fieldMods.overdriveThreshold || 5;
  const wantsOd =
    card?.ability?.trigger === 'overdrive' ||
    fieldMods.overdriveExtraPowerAndDamage === true;
  if (wantsOd && focus === odThreshold && odThreshold <= ordinaryCap + 1) {
    return { allowed: true, reason: 'overdrive-soglia', maxFocus: odThreshold };
  }

  if (context.campaignDuelMod?.allowHighFocus === true) {
    return { allowed: true, reason: 'campagna', maxFocus: legalMax };
  }

  if (profile?.allowMaxFocusScenario && focus === legalMax && cardsRemaining <= 2) {
    return { allowed: true, reason: 'fine-partita', maxFocus: legalMax };
  }

  return { allowed: false, reason: null };
}

/**
 * Penalità progressiva oltre lo standard.
 */
export function computeOverinvestmentPenalty(focus, standardFocus, profile, roundNumber) {
  const excess = Math.max(0, (focus || 0) - (standardFocus || 1));
  if (excess <= 0) return 0;
  const linear = profile?.overinvestmentLinearPenalty ?? 90;
  const quad = profile?.overinvestmentQuadraticPenalty ?? 45;
  const round = Math.min(5, Math.max(1, roundNumber || 1));
  const mult = OVERINVESTMENT_ROUND_MULTIPLIER[round] ?? 1;
  return (excess * linear + excess * excess * quad) * mult;
}
