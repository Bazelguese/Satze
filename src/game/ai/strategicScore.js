// ============================================
// Blend punteggio duello + valutazione stato proiettato
// ============================================

import { buildStrategicState } from './strategicState.js';
import { projectPostDuelState } from './projectPostDuelState.js';
import { evaluateStrategicState, strategicEvalWeight } from './evaluateStrategicState.js';
import { simulateAIDuel } from './simulateAIDuel.js';

/**
 * Arricchisce un punteggio aggregato con la valutazione dello stato proiettato
 * sugli scenari avversari (valore atteso).
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

  let expectedStrategic = 0;
  for (const scenario of scenarios) {
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
    expectedStrategic += evalResult.score * (scenario.probability || 0);
  }

  return duelAggregateScore * (1 - weight) + expectedStrategic * weight;
}
