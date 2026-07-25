// ============================================
// Punteggio, dominanza e valore futuro carte
// ============================================

import { AI_SCORE_WEIGHTS } from './aiConstants.js';
import { getAvailableCards } from './generateAIActions.js';

const POST_BATTLE = new Set(['conquest', 'lastWish']);

/**
 * Stima leggera del valore residuo di una carta (non duplica il duello).
 */
export function estimateFutureCardValue(card, context) {
  if (!card) return 0;
  const round = context.roundNumber || 1;
  const base = (card.power || 0) * 1.2 + (card.damage || 0) * 1.4 + (card.league || 0) * 0.15;
  const trigger = card.ability?.trigger;
  let triggerFuture = 0;

  switch (trigger) {
    case 'turbo':
      triggerFuture = round <= 2 ? 8 : 1;
      break;
    case 'ultimaChance':
      triggerFuture = round >= 4 ? 14 : round >= 3 ? 8 : 3;
      break;
    case 'reckoning':
      triggerFuture = (context.ai.usedCardIds?.length || 0) >= 2 ? 10 : 4;
      break;
    case 'glory':
      triggerFuture = context.lastWinner === 'enemy' ? 6 : 3;
      break;
    case 'vendetta':
      triggerFuture = context.lastWinner === 'player' ? 6 : 3;
      break;
    case 'invasione':
      triggerFuture = (context.enemyFieldsConquered || 0) >= 1 ? 5 : 4;
      break;
    case 'resistenza':
      triggerFuture = (context.playerFieldsConquered || 0) >= 1 ? 5 : 4;
      break;
    case 'intervention':
      triggerFuture = context.isPlayerFirst ? 7 : 3;
      break;
    case 'imboscata':
      triggerFuture = !context.isPlayerFirst ? 7 : 3;
      break;
    case 'overdrive':
      triggerFuture = 5;
      break;
    case 'conquest':
    case 'lastWish':
      triggerFuture = 4;
      break;
    default:
      triggerFuture = trigger ? 3 : 0;
  }

  const effect = card.ability?.effect;
  let effectUtility = 0;
  if (effect === 'directDamage') effectUtility = 6 + Math.abs(card.ability?.value || 0);
  else if (effect === 'heal') effectUtility = 4;
  else if (effect === 'focusCoin') effectUtility = round >= 5 ? 1 : 4;
  else if (effect) effectUtility = 2;

  return base + triggerFuture + effectUtility;
}

/**
 * Bonus conservazione trigger futuri per la carta consumata.
 */
function futurePlanningPenalty(card, context, profile, weights) {
  if (!card || !profile) return 0;
  const futureWeight = profile.futurePlanningWeight ?? 0.5;
  const remaining = getAvailableCards(context.ai.hand, [
    ...(context.ai.usedCardIds || []),
    card.id,
  ]);
  const keptValue = remaining.reduce((sum, c) => sum + estimateFutureCardValue(c, context), 0);
  const consumed = estimateFutureCardValue(card, context);
  const trigger = card.ability?.trigger;
  let setup = 0;

  if (trigger === 'ultimaChance' && (context.roundNumber || 1) < 4) {
    setup -= weights.futureTriggerSetup * 1.2;
  }
  if (trigger === 'reckoning' && (context.ai.usedCardIds?.length || 0) < 2) {
    setup -= weights.futureTriggerSetup * 0.8;
  }
  if (trigger === 'turbo' && (context.roundNumber || 1) > 2) {
    setup += weights.futureTriggerSetup * 0.3;
  }

  return (setup - consumed * 0.35 + keptValue * 0.02) * futureWeight;
}

/**
 * Punteggio di uno stato simulato dal punto di vista di un lato.
 *
 * @param {object} simulation
 * @param {object} context
 * @param {'ai'|'player'} side
 * @param {object} [weights]
 */
export function scoreSimulationForSide(simulation, context, side, weights = AI_SCORE_WEIGHTS) {
  const aiView = side === 'ai';
  const winner = simulation.winner;
  const won = aiView ? winner === 'enemy' : winner === 'player';
  const lost = aiView ? winner === 'player' : winner === 'enemy';

  const myHpAfter = aiView ? simulation.aiHpAfter : simulation.playerHpAfter;
  const oppHpAfter = aiView ? simulation.playerHpAfter : simulation.aiHpAfter;
  const myHpBefore = aiView ? simulation.aiHpBefore : simulation.playerHpBefore;
  const oppHpBefore = aiView ? simulation.playerHpBefore : simulation.aiHpBefore;

  const myFocusAfter = aiView ? simulation.aiFocusAfter : simulation.playerFocusAfter;
  const oppFocusAfter = aiView ? simulation.playerFocusAfter : simulation.aiFocusAfter;
  const myFieldsAfter = aiView ? simulation.aiFieldsAfter : simulation.playerFieldsAfter;
  const oppFieldsAfter = aiView ? simulation.playerFieldsAfter : simulation.aiFieldsAfter;
  const myFieldsBefore = aiView ? simulation.aiFieldsBefore : simulation.playerFieldsBefore;
  const oppFieldsBefore = aiView ? simulation.playerFieldsBefore : simulation.aiFieldsBefore;

  let score = 0;
  const terminal = simulation.terminalStatus;

  if (aiView) {
    if (terminal === 'ai_win_hp' || terminal === 'ai_win_fields' || terminal === 'ai_win_cards') {
      score += weights.matchWin;
    } else if (
      terminal === 'ai_loss_hp' ||
      terminal === 'ai_loss_fields' ||
      terminal === 'ai_loss_cards'
    ) {
      score += weights.matchLoss;
    }
    if (terminal === 'ai_threat_fields' || myFieldsAfter >= 2) {
      if (won) score += weights.claimVictoryThreshold * 0.35;
    }
    if (terminal === 'player_threat_fields') {
      score += weights.opponentClaimThreshold * 0.35;
    }
  } else {
    // punto di vista giocatore (per ranking risposte)
    if (oppHpAfter <= 0 && myHpAfter > 0) score += weights.matchWin;
    if (myHpAfter <= 0 && oppHpAfter > 0) score += weights.matchLoss;
    if (myFieldsAfter >= 3) score += weights.claimVictoryThreshold;
    if (oppFieldsAfter >= 3) score += weights.opponentClaimThreshold;
  }

  if (oppHpAfter <= 0 && myHpAfter > 0) score += weights.lethalCreated;
  if (myHpBefore > 0 && oppHpBefore > 0 && myHpAfter > 0 && /* prevented self lethal via win/trade */ false) {
    // placeholder kept for clarity
  }
  if (myHpAfter > 0 && oppHpBefore > 0 && simulation.playerHpAfter <= 0 === false) {
    // no-op
  }

  // Prevenzione letale: se senza questa mossa l'avversario poteva chiudere,
  // il fatto di restare vivi con HP bassi ha già valore via matchLoss evitato.
  if (myHpAfter > 0 && oppHpAfter <= 0) {
    score += weights.lethalCreated * 0.15;
  }

  score += won ? weights.duelWin : 0;
  score += lost ? weights.duelLoss : 0;

  const damageToOpp = Math.max(0, oppHpBefore - oppHpAfter);
  const damageToMe = Math.max(0, myHpBefore - myHpAfter);
  const healMe = Math.max(0, myHpAfter - myHpBefore);
  const healOpp = Math.max(0, oppHpAfter - oppHpBefore);

  score += damageToOpp * weights.damageToPlayerPerPoint;
  score += damageToMe * weights.damageToAiPerPoint;
  score += healMe * weights.healAiPerPoint;
  score += healOpp * weights.healPlayerPerPoint;

  score += myFocusAfter * weights.aiFocusRemainingPerPoint;
  score += oppFocusAfter * weights.playerFocusRemainingPerPoint;

  const myFieldGain = myFieldsAfter - myFieldsBefore;
  const oppFieldGain = oppFieldsAfter - oppFieldsBefore;
  score += myFieldGain * weights.aiFieldGain;
  score += oppFieldGain * weights.playerFieldGain;

  if (aiView) {
    if (simulation.aiAbilityTriggered) score += weights.activeTriggerTiePreference;
    if (simulation.aiBonusTriggered) score += weights.activeTriggerTiePreference * 0.5;
  } else if (simulation.playerAbilityTriggered) {
    score += weights.activeTriggerTiePreference;
  }

  return score;
}

/**
 * @param {object} simulation
 * @param {object} context
 * @param {object} aiAction
 * @param {object} profile
 * @param {object} [weights]
 */
export function scoreAIAction(simulation, context, aiAction, profile, weights = AI_SCORE_WEIGHTS) {
  let score = scoreSimulationForSide(simulation, context, 'ai', weights);

  const focusSpent = aiAction?.focus || 0;
  const efficiency = profile?.focusEfficiencyWeight ?? 0.7;
  score += focusSpent * weights.focusSpentPerPoint * efficiency;

  // Overdrive / effetti già riflessi nello stato: non ri-contare value nominale.
  score += futurePlanningPenalty(aiAction?.card, context, profile, weights);

  // Carta consumata: piccolo costo se ha alto valore futuro e trigger post-duello non usato bene
  const trigger = aiAction?.card?.ability?.trigger;
  if (trigger && POST_BATTLE.has(trigger)) {
    const helped =
      (trigger === 'conquest' && simulation.winner === 'enemy' && simulation.aiAbilityTriggered) ||
      (trigger === 'lastWish' && simulation.winner === 'player' && simulation.aiAbilityTriggered);
    if (!helped) score += weights.valuableCardConsumed * 0.4 * (profile?.futurePlanningWeight ?? 0.5);
  }

  // Terminal override markers for selection logic
  const terminal = simulation.terminalStatus;
  const isTerminalWin =
    terminal === 'ai_win_hp' || terminal === 'ai_win_fields' || terminal === 'ai_win_cards';
  const isTerminalLoss =
    terminal === 'ai_loss_hp' || terminal === 'ai_loss_fields' || terminal === 'ai_loss_cards';

  return {
    score,
    isTerminalWin,
    isTerminalLoss,
    simulation,
  };
}

/**
 * A domina B se stessa carta/campo, focus <=, e nessun aspetto peggiore.
 */
export function actionDominates(a, b) {
  if (!a || !b) return false;
  if (a.action.cardId !== b.action.cardId) return false;
  if (a.action.fieldIndex !== b.action.fieldIndex) return false;
  if (a.action.focus > b.action.focus) return false;

  const sa = a.simulation;
  const sb = b.simulation;
  if (!sa || !sb) return false;

  if (sa.aiHpAfter < sb.aiHpAfter) return false;
  if (sa.playerHpAfter > sb.playerHpAfter) return false;
  if (sa.aiFocusAfter < sb.aiFocusAfter) return false;
  if (sa.playerFocusAfter > sb.playerFocusAfter) return false;
  if (sa.aiFieldsAfter < sb.aiFieldsAfter) return false;
  if (sa.playerFieldsAfter > sb.playerFieldsAfter) return false;
  if (sa.winner !== sb.winner) return false;
  if (!!sa.aiAbilityTriggered !== !!sb.aiAbilityTriggered) return false;
  if ((sa.terminalStatus || null) !== (sb.terminalStatus || null)) return false;

  // A deve essere strettamente migliore in almeno un aspetto (focus speso o residuo)
  const strict =
    a.action.focus < b.action.focus ||
    sa.aiFocusAfter > sb.aiFocusAfter ||
    sa.aiHpAfter > sb.aiHpAfter ||
    sa.playerHpAfter < sb.playerHpAfter;

  return strict || a.action.focus < b.action.focus;
}

/**
 * @param {Array<{ action, simulation, score }>} scoredActions
 */
export function findDominatedActions(scoredActions) {
  const dominated = new Set();
  for (let i = 0; i < scoredActions.length; i += 1) {
    for (let j = 0; j < scoredActions.length; j += 1) {
      if (i === j) continue;
      if (actionDominates(scoredActions[i], scoredActions[j])) {
        dominated.add(scoredActions[j]);
      }
    }
  }
  return dominated;
}

/**
 * Ordinamento di tie-break tra mosse quasi equivalenti.
 */
export function compareScoredActions(a, b) {
  if (a.isTerminalWin !== b.isTerminalWin) return a.isTerminalWin ? -1 : 1;
  if (a.isTerminalLoss !== b.isTerminalLoss) return a.isTerminalLoss ? 1 : -1;

  const sa = a.simulation;
  const sb = b.simulation;
  if (sa && sb) {
    if (sa.aiFieldsAfter !== sb.aiFieldsAfter) return sb.aiFieldsAfter - sa.aiFieldsAfter;
    if (sa.aiHpAfter !== sb.aiHpAfter) return sb.aiHpAfter - sa.aiHpAfter;
    if (sa.playerHpAfter !== sb.playerHpAfter) return sa.playerHpAfter - sb.playerHpAfter;
    if (sa.aiFocusAfter !== sb.aiFocusAfter) return sb.aiFocusAfter - sa.aiFocusAfter;
    if (sa.playerFocusAfter !== sb.playerFocusAfter) {
      return sa.playerFocusAfter - sb.playerFocusAfter;
    }
  }

  if (a.action.focus !== b.action.focus) return a.action.focus - b.action.focus;

  const scoreDiff = (b.score || 0) - (a.score || 0);
  if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;

  return String(a.action.cardId).localeCompare(String(b.action.cardId));
}
