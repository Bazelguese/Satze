// ============================================
// Ricerca multi-round (beam + cache + endgame)
// ============================================

import { buildStrategicState, rebuildContextFromStrategicState } from './strategicState.js';
import { projectPostDuelState } from './projectPostDuelState.js';
import { evaluateStrategicState } from './evaluateStrategicState.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import { generateStrategicActionsForSide } from './generateAIActions.js';
import { generateOpponentScenarios } from './generateOpponentScenarios.js';
import { buildBalancedShortlist, lightRankAction } from './aiPruning.js';
import { publicStateHash } from './publicStateHash.js';
import { computeOverinvestmentPenalty, getOrdinaryFocusCap } from './focusBudget.js';

/**
 * Profondità = round futuri da esplorare dopo il duello corrente.
 * Con ≤ solveEndgameAtCardsRemaining carte: cerca fino alla fine.
 */
export function resolveSearchDepth(profile, state) {
  const aiCards = state.aiRemainingCardIds?.length ?? 0;
  const playerCards = state.playerRemainingCardIds?.length ?? 0;
  const cardsLeft = Math.min(aiCards, playerCards);
  const endAt = profile.solveEndgameAtCardsRemaining ?? 2;
  let depth = profile.searchDepth ?? 0;

  if (cardsLeft <= endAt) {
    return Math.max(depth, cardsLeft);
  }
  if (cardsLeft <= 3 && depth > 0) {
    depth = Math.max(depth, Math.min(2, cardsLeft - 1));
  }
  return depth;
}

function leanProfile(profile, beamWidth) {
  return {
    ...profile,
    selectionMode: 'best',
    opponentScenarioCount: Math.min(
      profile.opponentScenarioCount || 3,
      profile.id === 'hard' ? 4 : 3
    ),
    ownVariantsPerCard: Math.min(profile.ownVariantsPerCard || 2, 2),
    ownActionLimitWhenFirst: Math.min(profile.ownActionLimitWhenFirst || 8, beamWidth),
  };
}

function limitFields(indexes, maxFields) {
  if (!indexes?.length) return [];
  if (indexes.length <= maxFields) return indexes;
  return indexes.slice(0, maxFields);
}

function beamActions(context, profile, beamWidth) {
  const lean = leanProfile(profile, beamWidth);
  const actions = generateStrategicActionsForSide(
    context,
    'ai',
    lean,
    context.currentFieldIndex
  );
  if (!actions.length) return [];
  const shortlist = buildBalancedShortlist(actions, context, lean);
  return shortlist
    .map((action) => ({ action, pre: lightRankAction(action, context, 'ai') }))
    .sort((a, b) => b.pre - a.pre)
    .slice(0, beamWidth)
    .map((e) => e.action);
}

function aggregateRisk(values, probabilities, riskWeight) {
  let expected = 0;
  const pairs = [];
  for (let i = 0; i < values.length; i += 1) {
    const p = probabilities[i] || 0;
    expected += values[i] * p;
    pairs.push({ value: values[i], p });
  }
  if (!pairs.length) return expected;
  pairs.sort((a, b) => a.value - b.value);
  let acc = 0;
  let lower = pairs[0].value;
  for (const pair of pairs) {
    acc += pair.p;
    if (acc >= 0.25) {
      lower = pair.value;
      break;
    }
  }
  const rw = riskWeight ?? 0.2;
  return expected * (1 - rw) + lower * rw;
}

function leafScore(state, profile) {
  return evaluateStrategicState(state, profile).score;
}

/**
 * Valuta un'azione IA sul contesto corrente, con ricerca futura.
 * depth = round futuri da esplorare dopo questo duello.
 */
export function evaluateActionWithSearch(context, action, profile, options = {}) {
  const stats = options.stats || { nodes: 0, cacheHits: 0 };
  const duelCache = options.cache || new Map();
  const tt = options.transpositionTable || new Map();
  const rootState = options.rootState || buildStrategicState(context);
  const depth =
    options.depth != null ? options.depth : resolveSearchDepth(profile, rootState);
  const beamWidth = profile.beamWidth || 10;
  const lean = leanProfile(profile, beamWidth);

  const scenarios =
    options.scenarios || generateOpponentScenarios(context, lean);
  if (!scenarios.length) {
    return { score: leafScore(rootState, profile), stats, depth };
  }

  const values = [];
  const probs = [];

  for (const scenario of scenarios) {
    stats.nodes += 1;
    const simulation = simulateAIDuel(
      context,
      action,
      { card: scenario.card, focus: scenario.focus },
      { cache: duelCache }
    );
    const projected = projectPostDuelState(
      rootState,
      simulation,
      action,
      { card: scenario.card, cardId: scenario.cardId, focus: scenario.focus }
    );

    let childScore;
    if (projected.terminalStatus || depth <= 0) {
      childScore = leafScore(projected, profile);
    } else {
      childScore = valueState(projected, depth, profile, { duelCache, tt, stats });
    }
    values.push(childScore);
    probs.push(scenario.probability || 0);
  }

  let score = aggregateRisk(values, probs, profile.riskWeight);

  const budget = getOrdinaryFocusCap(context, 'ai', profile);
  score -= computeOverinvestmentPenalty(
    action.focus,
    budget.standardFocus,
    profile,
    context.roundNumber
  );

  return { score, stats, depth };
}

/**
 * Valore di uno stato in cui sta per iniziare un nuovo round (depth >= 1).
 */
function valueState(state, depth, profile, ctx) {
  if (state.terminalStatus) {
    return leafScore(state, profile);
  }
  if (depth <= 0) {
    return leafScore(state, profile);
  }

  const key = publicStateHash(state, depth);
  if (ctx.tt.has(key)) {
    ctx.stats.cacheHits += 1;
    return ctx.tt.get(key);
  }

  ctx.stats.nodes += 1;
  const beamWidth = profile.beamWidth || 10;
  const value =
    state.initiativeSide === 'ai'
      ? valueAiToMove(state, depth, profile, ctx, beamWidth)
      : valuePlayerToMove(state, depth, profile, ctx, beamWidth);

  ctx.tt.set(key, value);
  return value;
}

function afterRoundValue(projected, depth, profile, ctx) {
  if (projected.terminalStatus || depth <= 1) {
    return leafScore(projected, profile);
  }
  return valueState(projected, depth - 1, profile, ctx);
}

function valueAiToMove(state, depth, profile, ctx, beamWidth) {
  const maxFields = profile.id === 'hard' ? 3 : 2;
  const fields = limitFields(state.availableFieldIndexes || [], maxFields);
  if (!fields.length) return leafScore(state, profile);

  const lean = leanProfile(profile, beamWidth);
  let best = -Infinity;

  for (const fieldIndex of fields) {
    const context = rebuildContextFromStrategicState(state, fieldIndex);
    context.isPlayerFirst = false;
    context.player.visibleCard = null;

    const actions = beamActions(context, profile, beamWidth);
    const scenarios = generateOpponentScenarios(context, lean);
    if (!actions.length || !scenarios.length) continue;

    for (const action of actions) {
      const values = [];
      const probs = [];
      for (const scenario of scenarios) {
        ctx.stats.nodes += 1;
        const simulation = simulateAIDuel(
          context,
          action,
          { card: scenario.card, focus: scenario.focus },
          { cache: ctx.duelCache }
        );
        const projected = projectPostDuelState(
          state,
          simulation,
          action,
          { card: scenario.card, cardId: scenario.cardId, focus: scenario.focus }
        );
        values.push(afterRoundValue(projected, depth, profile, ctx));
        probs.push(scenario.probability || 0);
      }
      const score = aggregateRisk(values, probs, profile.riskWeight);
      if (score > best) best = score;
    }
  }

  return best === -Infinity ? leafScore(state, profile) : best;
}

function valuePlayerToMove(state, depth, profile, ctx, beamWidth) {
  const maxFields = profile.id === 'easy' ? 1 : 2;
  const fields = limitFields(state.availableFieldIndexes || [], maxFields);
  if (!fields.length) return leafScore(state, profile);

  const lean = leanProfile(profile, beamWidth);
  const values = [];
  const probs = [];
  let totalWeight = 0;

  for (const fieldIndex of fields) {
    const context = rebuildContextFromStrategicState(state, fieldIndex);
    context.isPlayerFirst = true;
    context.player.visibleCard = null;

    const scenarios = generateOpponentScenarios(context, lean);
    const aiActions = beamActions(context, profile, Math.min(beamWidth, 6));
    if (!scenarios.length || !aiActions.length) continue;

    for (const scenario of scenarios) {
      const weight = (scenario.probability || 0) / fields.length;
      totalWeight += weight;

      let bestReply = -Infinity;
      for (const aiAction of aiActions) {
        ctx.stats.nodes += 1;
        const simulation = simulateAIDuel(
          context,
          aiAction,
          { card: scenario.card, focus: scenario.focus },
          { cache: ctx.duelCache }
        );
        const projected = projectPostDuelState(
          state,
          simulation,
          aiAction,
          { card: scenario.card, cardId: scenario.cardId, focus: scenario.focus }
        );
        const child = afterRoundValue(projected, depth, profile, ctx);
        if (child > bestReply) bestReply = child;
      }
      if (bestReply === -Infinity) bestReply = leafScore(state, profile);
      values.push(bestReply);
      probs.push(weight);
    }
  }

  if (!values.length) return leafScore(state, profile);

  const norm = totalWeight > 0 ? totalWeight : 1;
  return aggregateRisk(
    values,
    probs.map((p) => p / norm),
    profile.riskWeight
  );
}

/**
 * Assegna punteggi di ricerca a una shortlist di azioni radice.
 */
export function scoreActionsWithSearch(context, actions, profile, options = {}) {
  const stats = options.stats || { nodes: 0, cacheHits: 0 };
  const duelCache = options.cache || new Map();
  const tt = options.transpositionTable || new Map();
  const rootState = buildStrategicState(context);
  const depth = resolveSearchDepth(profile, rootState);
  const scenarios = generateOpponentScenarios(
    context,
    leanProfile(profile, profile.beamWidth || 10)
  );

  return actions.map((action) => {
    const { score } = evaluateActionWithSearch(context, action, profile, {
      depth,
      rootState,
      cache: duelCache,
      transpositionTable: tt,
      stats,
      scenarios,
    });
    return {
      action,
      score,
      searchDepth: depth,
      stats,
    };
  });
}
