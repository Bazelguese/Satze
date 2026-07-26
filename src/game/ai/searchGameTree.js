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
import {
  selectCandidateFields,
  playerFieldChoiceWeight,
} from './rankFields.js';

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

function groupScenariosByCardId(scenarios) {
  const map = new Map();
  for (const scenario of scenarios) {
    const id = scenario.cardId ?? scenario.card?.id;
    if (id == null) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(scenario);
  }
  return map;
}

/**
 * Valuta un'azione IA contro tutte le varianti Focus di una stessa carta (nessuna risposta diversa per Focus esatto).
 */
export function scoreAiActionAgainstFocusVariants(
  context,
  state,
  aiAction,
  focusScenarios,
  depth,
  profile,
  ctx
) {
  const values = [];
  const probs = [];
  let probSum = 0;
  for (const scenario of focusScenarios) {
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
    values.push(afterRoundValue(projected, depth, profile, ctx));
    const p = scenario.probability || 0;
    probs.push(p);
    probSum += p;
  }
  const norm = probSum > 0 ? probSum : 1;
  return aggregateRisk(
    values,
    probs.map((p) => p / norm),
    profile.riskWeight
  );
}

/**
 * Una sola risposta IA per carta visibile, aggregando i Focus possibili.
 * @returns {{ action: object|null, score: number }}
 */
export function chooseBestAiReplyAggregatingFocus(
  context,
  state,
  aiActions,
  cardScenarios,
  depth,
  profile,
  ctx
) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const aiAction of aiActions) {
    const score = scoreAiActionAgainstFocusVariants(
      context,
      state,
      aiAction,
      cardScenarios,
      depth,
      profile,
      ctx
    );
    if (score > bestScore) {
      bestScore = score;
      bestAction = aiAction;
    }
  }

  return { action: bestAction, score: bestScore };
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

  // Prior uniforme per carta; Focus solo dentro la carta
  const byCard = groupScenariosByCardId(scenarios);
  const cardValues = [];
  for (const [, cardScenarios] of byCard) {
    const values = [];
    const probs = [];
    let focusSum = 0;
    for (const scenario of cardScenarios) {
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
      const share = scenario.focusShare ?? scenario.probability ?? 0;
      probs.push(share);
      focusSum += share;
    }
    const norm = focusSum > 0 ? focusSum : 1;
    cardValues.push(
      aggregateRisk(
        values,
        probs.map((p) => p / norm),
        profile.riskWeight
      )
    );
  }

  let score =
    cardValues.length > 0
      ? cardValues.reduce((s, v) => s + v, 0) / cardValues.length
      : leafScore(rootState, profile);

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
  const fields = selectCandidateFields(state, maxFields, profile, 'ai');
  if (!fields.length) return leafScore(state, profile);

  const lean = leanProfile(profile, beamWidth);
  let best = -Infinity;

  for (const { index: fieldIndex } of fields) {
    const context = rebuildContextFromStrategicState(state, fieldIndex);
    context.isPlayerFirst = false;
    context.player.visibleCard = null;

    const actions = beamActions(context, profile, beamWidth);
    const scenarios = generateOpponentScenarios(context, lean);
    if (!actions.length || !scenarios.length) continue;

    for (const action of actions) {
      // Prior uniforme per carta; Focus normalizzati dentro ogni carta
      const byCard = groupScenariosByCardId(scenarios);
      const cardValues = [];
      for (const [, cardScenarios] of byCard) {
        const values = [];
        const probs = [];
        let focusSum = 0;
        for (const scenario of cardScenarios) {
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
          const share = scenario.focusShare ?? scenario.probability ?? 0;
          probs.push(share);
          focusSum += share;
        }
        const norm = focusSum > 0 ? focusSum : 1;
        cardValues.push(
          aggregateRisk(
            values,
            probs.map((p) => p / norm),
            profile.riskWeight
          )
        );
      }
      const score =
        cardValues.length > 0
          ? cardValues.reduce((s, v) => s + v, 0) / cardValues.length
          : leafScore(state, profile);
      if (score > best) best = score;
    }
  }

  return best === -Infinity ? leafScore(state, profile) : best;
}

/**
 * Aggrega i valori per carta avversaria dopo risposta IA unica.
 * Difficile: carta peggiore per l'IA; Normale: pesi sulle carte sensate; Facile: media.
 * La prior di carta è uniforme (non dipende dal numero di Focus).
 */
export function aggregatePlayerCardScores(cardScores, profile) {
  if (!cardScores?.length) return -Infinity;

  if (profile?.id === 'hard') {
    return Math.min(...cardScores.map((c) => c.score));
  }

  if (profile?.id === 'easy') {
    return cardScores.reduce((sum, c) => sum + c.score, 0) / cardScores.length;
  }

  // Normale: distribuzione ponderata tra le carte più sensate (peggiori per l'IA)
  const scores = cardScores.map((c) => c.score);
  const worst = Math.min(...scores);
  const best = Math.max(...scores);
  const span = Math.max(1e-6, best - worst);
  const band = span * 0.5 + 40;
  const sensible = cardScores.filter((c) => c.score <= worst + band);
  const pool = sensible.length ? sensible : cardScores;

  let totalW = 0;
  let sum = 0;
  for (const c of pool) {
    const weight = (best - c.score) / span + 0.25;
    totalW += weight;
    sum += c.score * weight;
  }
  return totalW > 0 ? sum / totalW : worst;
}

/**
 * Giocatore a muovere: Campi adversariali + una sola risposta IA per carta (Focus aggregato).
 */
function valuePlayerToMove(state, depth, profile, ctx, beamWidth) {
  const maxFields = profile.id === 'easy' ? 1 : 2;
  const fieldEntries = selectCandidateFields(state, maxFields, profile, 'player');
  if (!fieldEntries.length) return leafScore(state, profile);

  const lean = leanProfile(profile, beamWidth);
  const fieldScores = [];
  const fieldRanks = fieldEntries.map((f) => f.rank);

  for (const { index: fieldIndex, rank } of fieldEntries) {
    const context = rebuildContextFromStrategicState(state, fieldIndex);
    context.isPlayerFirst = true;
    context.player.visibleCard = null;

    const scenarios = generateOpponentScenarios(context, lean);
    const aiActions = beamActions(context, profile, Math.min(beamWidth, 6));
    if (!scenarios.length || !aiActions.length) continue;

    const byCard = groupScenariosByCardId(scenarios);
    const cardScores = [];

    for (const [cardId, cardScenarios] of byCard) {
      // Focus rinormalizzati dentro la carta; prior carta separata
      const { score } = chooseBestAiReplyAggregatingFocus(
        context,
        state,
        aiActions,
        cardScenarios,
        depth,
        profile,
        ctx
      );
      if (!Number.isFinite(score)) continue;
      cardScores.push({
        cardId,
        score,
        cardPrior: cardScenarios[0]?.cardPrior ?? 1 / Math.max(1, byCard.size),
      });
    }

    if (!cardScores.length) continue;

    const fieldScore = aggregatePlayerCardScores(cardScores, profile);

    fieldScores.push({
      score: fieldScore,
      weight: playerFieldChoiceWeight(rank, fieldRanks, profile),
    });
  }

  if (!fieldScores.length) return leafScore(state, profile);

  if (profile.id === 'hard') {
    return Math.min(...fieldScores.map((f) => f.score));
  }

  if (profile.id === 'easy') {
    return fieldScores.reduce((s, f) => s + f.score, 0) / fieldScores.length;
  }

  const totalW = fieldScores.reduce((s, f) => s + f.weight, 0) || 1;
  return fieldScores.reduce((s, f) => s + f.score * (f.weight / totalW), 0);
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
