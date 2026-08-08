// ============================================
// Punteggio, dominanza e valore futuro carte
// ============================================

import { AI_SCORE_WEIGHTS, SCORE_TIE_EPSILON } from './aiConstants.js';
import { getAvailableCards } from './generateAIActions.js';
import { computeOverinvestmentPenalty } from './focusBudget.js';
import { aggregatePlayerCardScores } from './cardBeliefAggregation.js';

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
  // Conserva Vendetta/Gloria finché il setup (sconfitta/vittoria) non è pronto
  if (trigger === 'vendetta' && context.lastWinner !== 'player') {
    setup -= weights.futureTriggerSetup * 1.35;
  }
  if (trigger === 'glory' && context.lastWinner !== 'enemy') {
    setup -= weights.futureTriggerSetup * 1.1;
  }

  return (setup - consumed * 0.35 + keptValue * 0.02) * futureWeight;
}

/**
 * Punteggio di uno stato simulato dal punto di vista di un lato.
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
    if (oppHpAfter <= 0 && myHpAfter > 0) score += weights.matchWin;
    if (myHpAfter <= 0 && oppHpAfter > 0) score += weights.matchLoss;
    if (myFieldsAfter >= 3) score += weights.claimVictoryThreshold;
    if (oppFieldsAfter >= 3) score += weights.opponentClaimThreshold;
  }

  if (oppHpAfter <= 0 && myHpAfter > 0) score += weights.lethalCreated;
  if (myHpAfter > 0 && oppHpAfter <= 0) score += weights.lethalCreated * 0.15;

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

  // Evita doppio conteggio pesante: residuo Focus conta, spesa gestita a parte
  score += myFocusAfter * weights.aiFocusRemainingPerPoint * 0.55;
  score += oppFocusAfter * weights.playerFocusRemainingPerPoint * 0.55;

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
 * Aggrega punteggi di scenari: Focus dentro la carta, poi aggregatePlayerCardScores tra carte.
 */
export function aggregateScenarioScores(scenarioScores, profile) {
  if (!scenarioScores.length) {
    return { expectedScore: 0, lowerPercentileScore: 0, finalScore: 0, winProbability: 0 };
  }

  const byCard = new Map();
  for (const entry of scenarioScores) {
    const id = entry.cardId ?? entry.card?.id ?? '_';
    if (!byCard.has(id)) byCard.set(id, []);
    byCard.get(id).push(entry);
  }

  const cardScores = [];
  let winProb = 0;

  for (const [cardId, list] of byCard) {
    const focusSum =
      list.reduce((s, e) => s + (e.focusShare ?? e.probability ?? 0), 0) || 1;
    let cardExpected = 0;
    let cardWin = 0;
    const focusValues = [];
    for (const entry of list) {
      const share = (entry.focusShare ?? entry.probability ?? 0) / focusSum;
      cardExpected += entry.score * share;
      if (entry.won) cardWin += share;
      focusValues.push(entry.score);
    }
    // Prior carta uniforme nel contributo a winProb
    winProb += cardWin / byCard.size;
    cardScores.push({ cardId, score: cardExpected, focusValues });
  }

  const expected = aggregatePlayerCardScores(cardScores, profile);

  const allSorted = [...scenarioScores].sort((a, b) => a.score - b.score);
  const idx = Math.min(
    allSorted.length - 1,
    Math.max(0, Math.floor(allSorted.length * 0.25))
  );
  const lowerPercentileScore = allSorted[idx].score;
  const riskWeight = profile?.riskWeight ?? 0.2;

  // Difficile: il "expected" è già worst-card; rischio sul worst-case globale
  const finalScore =
    profile?.id === 'hard'
      ? expected * (1 - riskWeight * 0.5) + lowerPercentileScore * (riskWeight * 0.5)
      : expected * (1 - riskWeight) + lowerPercentileScore * riskWeight;

  return {
    expectedScore: expected,
    lowerPercentileScore,
    finalScore,
    winProbability: winProb,
  };
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

  const standardFocus = aiAction?.meta?.standardFocus;
  const cardsRemaining = aiAction?.meta?.cardsRemaining;
  const overinvest =
    standardFocus != null
      ? computeOverinvestmentPenalty(
          aiAction.focus,
          standardFocus,
          profile,
          context.roundNumber,
          cardsRemaining
        )
      : 0;
  score -= overinvest;

  // Vittoria di Pirro: conquistare un Campo bruciando la riserva con ancora molti duelli
  const futureDuels = Math.max(0, (cardsRemaining || 1) - 1);
  const aiFields = context.enemyFieldsConquered || 0;
  const excessVsStd = Math.max(0, (aiAction?.focus || 0) - (standardFocus || 1));
  if (
    futureDuels >= 2 &&
    aiFields < 2 &&
    excessVsStd >= 3 &&
    simulation.winner === 'enemy' &&
    !['ai_win_hp', 'ai_win_fields', 'ai_win_cards'].includes(simulation.terminalStatus)
  ) {
    const planW = profile?.futurePlanningWeight ?? 0.7;
    score -= excessVsStd * futureDuels * 220 * planW;
  }

  // Lieve costo Focus (non doppiare la penalità progressiva)
  const efficiency = profile?.focusEfficiencyWeight ?? 0.7;
  score += (aiAction?.focus || 0) * weights.focusSpentPerPoint * efficiency * 0.35;

  score += futurePlanningPenalty(aiAction?.card, context, profile, weights);

  const trigger = aiAction?.card?.ability?.trigger;
  if (trigger && POST_BATTLE.has(trigger)) {
    const helped =
      (trigger === 'conquest' && simulation.winner === 'enemy' && simulation.aiAbilityTriggered) ||
      (trigger === 'lastWish' && simulation.winner === 'player' && simulation.aiAbilityTriggered);
    if (!helped) score += weights.valuableCardConsumed * 0.4 * (profile?.futurePlanningWeight ?? 0.5);
  }

  const terminal = simulation.terminalStatus;
  const isTerminalWin =
    terminal === 'ai_win_hp' || terminal === 'ai_win_fields' || terminal === 'ai_win_cards';
  const isTerminalLoss =
    terminal === 'ai_loss_hp' || terminal === 'ai_loss_fields' || terminal === 'ai_loss_cards';

  return {
    score,
    overinvestmentPenalty: overinvest,
    isTerminalWin,
    isTerminalLoss,
    simulation,
  };
}

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

  return a.action.focus < b.action.focus;
}

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
 * Score decrescente; tie-break solo entro SCORE_TIE_EPSILON.
 */
export function compareScoredActions(a, b, epsilon = SCORE_TIE_EPSILON) {
  const scoreDiff = (b.score || 0) - (a.score || 0);
  if (Math.abs(scoreDiff) > epsilon) return scoreDiff;

  if (a.isTerminalWin !== b.isTerminalWin) return a.isTerminalWin ? -1 : 1;
  if (a.isTerminalLoss !== b.isTerminalLoss) return a.isTerminalLoss ? 1 : -1;

  if (a.action.focus !== b.action.focus) return a.action.focus - b.action.focus;

  const sa = a.simulation;
  const sb = b.simulation;
  if (sa && sb) {
    if (sa.aiFocusAfter !== sb.aiFocusAfter) return sb.aiFocusAfter - sa.aiFocusAfter;
    if (sa.aiHpAfter !== sb.aiHpAfter) return sb.aiHpAfter - sa.aiHpAfter;
    if (sa.playerHpAfter !== sb.playerHpAfter) return sa.playerHpAfter - sb.playerHpAfter;
    if (!!sa.aiAbilityTriggered !== !!sb.aiAbilityTriggered) {
      return sa.aiAbilityTriggered ? -1 : 1;
    }
  }

  return String(a.action.cardId).localeCompare(String(b.action.cardId));
}
