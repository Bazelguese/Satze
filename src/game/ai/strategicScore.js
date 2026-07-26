// ============================================
// Blend punteggio duello + valutazione stato proiettato
// ============================================

import { buildStrategicState } from './strategicState.js';
import { projectPostDuelState } from './projectPostDuelState.js';
import { evaluateStrategicState, strategicEvalWeight } from './evaluateStrategicState.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import { aggregatePlayerCardScores } from './cardBeliefAggregation.js';

/**
 * Arricchisce un punteggio aggregato con la valutazione dello stato proiettato
 * sugli scenari avversari (stessa regola Hard/Normale/Facile sulle carte).
 */
export function scoreActionWithStrategicProjection({
  context,
  action,
  scenarios,
  duelAggregateScore,
  profile,
  cache,
}) {
  const strategicRoot = buildStrategicState(context);
  const weight = strategicEvalWeight(profile);
  if (!scenarios?.length) {
    return duelAggregateScore;
  }

  const byCard = new Map();
  for (const scenario of scenarios) {
    const id = scenario.cardId ?? scenario.card?.id;
    if (id == null) continue;
    if (!byCard.has(id)) byCard.set(id, []);
    byCard.get(id).push(scenario);
  }

  const cardScores = [];
  for (const [cardId, list] of byCard) {
    const focusSum =
      list.reduce((s, sc) => s + (sc.focusShare ?? sc.probability ?? 0), 0) || 1;
    let cardStrategic = 0;
    for (const scenario of list) {
      const share = (scenario.focusShare ?? scenario.probability ?? 0) / focusSum;
      const simulation = simulateAIDuel(
        context,
        action,
        { card: scenario.card, focus: scenario.focus },
        { cache }
      );
      const projected = projectPostDuelState(
        strategicRoot,
        simulation,
        action,
        { card: scenario.card, cardId: scenario.cardId, focus: scenario.focus }
      );
      const evalResult = evaluateStrategicState(projected, profile);
      cardStrategic += evalResult.score * share;
    }
    cardScores.push({ cardId, score: cardStrategic });
  }

  const strategicScore = aggregatePlayerCardScores(cardScores, profile);
  return duelAggregateScore * (1 - weight) + strategicScore * weight;
}
