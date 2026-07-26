// ============================================
// Valutazione stato strategico proiettato
// ============================================

import { estimateFutureCardValue } from './scoreAIAction.js';
import { findCardInState } from './strategicState.js';

const TERMINAL_WIN = 1000000;
const TERMINAL_LOSS = -1000000;

function nonlinearHpScore(hp, maxHp = 20) {
  const h = Math.max(0, hp);
  // Perdere PV vicino allo zero pesa di più
  const ratio = h / Math.max(1, maxHp);
  return h * 40 + Math.pow(ratio, 1.4) * 180;
}

function focusPerCard(focus, cardsRemaining) {
  if (cardsRemaining <= 0) return focus;
  return focus / cardsRemaining;
}

/**
 * Valore immediato dei trigger residui nella mano IA.
 */
function evaluateImmediateTriggers(state) {
  let score = 0;
  const round = state.roundNumber || 1;
  for (const id of state.aiRemainingCardIds || []) {
    const card = findCardInState(state, 'ai', id);
    if (!card?.ability?.trigger) continue;
    const t = card.ability.trigger;
    if (t === 'turbo' && round <= 2) score += 90;
    if (t === 'turbo' && round > 2) score -= 25;
    if (t === 'ultimaChance' && round >= 4) score += 110;
    if (t === 'ultimaChance' && round < 3) score += 35;
    if (t === 'reckoning' && (state.aiUsedCardIds?.length || 0) >= 2) score += 70;
    if (t === 'glory' && state.lastWinner === 'enemy') score += 380;
    if (t === 'vendetta' && state.lastWinner === 'player') score += 420;
    if (t === 'invasione' && (state.enemyFieldsConquered || 0) >= 1) score += 50;
    if (t === 'resistenza' && (state.playerFieldsConquered || 0) >= 1) score += 50;
    if (t === 'intervention' && state.isPlayerFirst) score += 40;
    if (t === 'imboscata' && !state.isPlayerFirst) score += 40;
  }
  return score;
}

/**
 * Contesto minimo per estimateFutureCardValue.
 */
function handEvalContext(state) {
  return {
    roundNumber: state.roundNumber,
    lastWinner: state.lastWinner,
    isPlayerFirst: state.isPlayerFirst,
    playerFieldsConquered: state.playerFieldsConquered,
    enemyFieldsConquered: state.enemyFieldsConquered,
    ai: { usedCardIds: state.aiUsedCardIds },
    player: { usedCardIds: state.playerUsedCardIds },
  };
}

/**
 * Valuta uno stato strategico dal punto di vista dell'IA.
 * @param {object} state
 * @param {object} [profile]
 * @returns {{ score: number, parts: object }}
 */
export function evaluateStrategicState(state, profile = {}) {
  const parts = {
    terminal: 0,
    hp: 0,
    fields: 0,
    focusEconomy: 0,
    hand: 0,
    triggers: 0,
    initiative: 0,
  };

  const terminal = state.terminalStatus;
  if (terminal === 'ai_win_hp' || terminal === 'ai_win_fields' || terminal === 'ai_win_cards') {
    parts.terminal = TERMINAL_WIN;
  } else if (
    terminal === 'ai_loss_hp' ||
    terminal === 'ai_loss_fields' ||
    terminal === 'ai_loss_cards'
  ) {
    parts.terminal = TERMINAL_LOSS;
  }

  // PV non lineari
  parts.hp += nonlinearHpScore(state.aiHP) - nonlinearHpScore(state.playerHP) * 1.05;
  if (state.playerHP <= 4) parts.hp += 220;
  if (state.aiHP <= 4) parts.hp -= 260;

  // Territorio
  parts.fields += (state.enemyFieldsConquered || 0) * 900;
  parts.fields -= (state.playerFieldsConquered || 0) * 980;
  if ((state.enemyFieldsConquered || 0) >= 2) parts.fields += 700;
  if ((state.playerFieldsConquered || 0) >= 2) parts.fields -= 850;
  parts.fields += (state.availableFieldIndexes?.length || 0) * 15;

  // Economia FC / carta
  const aiCards = state.aiRemainingCardIds?.length || 0;
  const playerCards = state.playerRemainingCardIds?.length || 0;
  const aiFpc = focusPerCard(state.aiFocus || 0, aiCards);
  const playerFpc = focusPerCard(state.playerFocus || 0, playerCards);
  parts.focusEconomy += aiFpc * 55 - playerFpc * 40;
  parts.focusEconomy += (state.aiFocus || 0) * 12 - (state.playerFocus || 0) * 9;
  if (aiCards > 0 && aiFpc < 1.5) parts.focusEconomy -= 180;
  if (aiCards > 0 && (state.aiFocus || 0) === 0) parts.focusEconomy -= 400;

  // Mano residua
  const ctx = handEvalContext(state);
  let handValue = 0;
  for (const id of state.aiRemainingCardIds || []) {
    const card = findCardInState(state, 'ai', id);
    if (card) handValue += estimateFutureCardValue(card, ctx);
  }
  let oppHand = 0;
  for (const id of state.playerRemainingCardIds || []) {
    const card = findCardInState(state, 'player', id);
    if (card) oppHand += estimateFutureCardValue(card, ctx) * 0.85;
  }
  const futureWeight = profile.futurePlanningWeight ?? 0.7;
  parts.hand += (handValue - oppHand) * 4.5 * futureWeight;

  parts.triggers += evaluateImmediateTriggers(state) * futureWeight;

  // Iniziativa del round proiettato
  if (state.initiativeSide === 'ai' || state.isPlayerFirst === false) {
    parts.initiative += 160;
    parts.initiative += (state.availableFieldIndexes?.length || 0) * 25;
  } else {
    parts.initiative -= 70;
  }

  // Setup post-sconfitta / post-vittoria con iniziativa (catene Vendetta/Gloria)
  if (state.lastWinner === 'player' && state.initiativeSide === 'ai') {
    parts.triggers += 220;
  }
  if (state.lastWinner === 'enemy' && state.initiativeSide === 'ai') {
    parts.triggers += 160;
  }

  const score =
    parts.terminal +
    parts.hp +
    parts.fields +
    parts.focusEconomy +
    parts.hand +
    parts.triggers +
    parts.initiative;

  return { score, parts };
}

/**
 * Peso della valutazione strategica rispetto al punteggio duello immediato.
 */
export function strategicEvalWeight(profile) {
  if (!profile) return 0.35;
  if (profile.id === 'easy') return 0.2;
  if (profile.id === 'hard') return 0.55;
  return 0.4;
}
