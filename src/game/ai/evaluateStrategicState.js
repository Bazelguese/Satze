// ============================================
// Valutazione stato strategico proiettato
// ============================================

import { evaluateRemainingHandPlan } from './strategyPlanner.js';

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
 * Valuta uno stato strategico dal punto di vista dell'IA.
 * @param {object} state
 * @param {object} [profile]
 * @returns {{ score: number, parts: object, plan: object }}
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
    synergy: 0,
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

  // Piano della mano derivato da trigger, effetti e stato proiettato.
  const plan = evaluateRemainingHandPlan(state, profile);
  parts.hand += plan.handScore;
  parts.triggers += plan.triggerScore;
  parts.initiative += plan.initiativeScore;
  parts.synergy += plan.synergyScore;

  // Valore base dell'iniziativa, oltre alle sinergie carta-specifiche del planner.
  if (state.initiativeSide === 'ai' || state.isPlayerFirst === false) {
    parts.initiative += 130;
    parts.initiative += (state.availableFieldIndexes?.length || 0) * 20;
  } else {
    parts.initiative -= 60;
  }

  const score =
    parts.terminal +
    parts.hp +
    parts.fields +
    parts.focusEconomy +
    parts.hand +
    parts.triggers +
    parts.initiative +
    parts.synergy;

  return { score, parts, plan };
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
