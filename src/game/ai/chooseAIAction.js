// ============================================
// Selezione mossa IA — Focus giocatore nascosto
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng, AI_SCORE_WEIGHTS, SCORE_TIE_EPSILON } from './aiConstants.js';
import {
  getAvailableCards,
  generateStrategicActionsForSide,
} from './generateAIActions.js';
import { getOrdinaryFocusCap } from './focusBudget.js';
import { generateOpponentScenarios } from './generateOpponentScenarios.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import {
  scoreAIAction,
  aggregateScenarioScores,
  compareScoredActions,
} from './scoreAIAction.js';
import { lightRankAction, buildBalancedShortlist } from './aiPruning.js';
import { buildAIDebugPayload, isAIDebugEnabled, logAIDebug } from './aiDebug.js';

export { lightRankAction, buildBalancedShortlist } from './aiPruning.js';

function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return entries[0]?.item ?? null;
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return entries[entries.length - 1]?.item ?? null;
}

function selectFromScored(sorted, profile, rng) {
  if (!sorted.length) return null;

  const best = sorted[0];
  const terminalWins = sorted.filter((s) => s.isTerminalWin);
  if (terminalWins.length) {
    terminalWins.sort((a, b) => compareScoredActions(a, b));
    return terminalWins[0];
  }

  if (sorted.some((s) => s.isTerminalLoss) && sorted.some((s) => !s.isTerminalLoss)) {
    sorted = sorted.filter((s) => !s.isTerminalLoss);
  }

  const mode = profile.selectionMode;

  if (mode === 'best') {
    const windowed = sorted.filter(
      (s) => best.score - s.score <= Math.max(profile.scoreWindow || 40, SCORE_TIE_EPSILON)
    );
    windowed.sort((a, b) => compareScoredActions(a, b));
    if (windowed.length <= 1) return windowed[0] || best;
    const top = windowed.filter((s) => Math.abs(s.score - best.score) <= SCORE_TIE_EPSILON);
    if (top.length <= 1) return windowed[0];
    return top[Math.floor(rng() * top.length)];
  }

  if (mode === 'weighted-top') {
    const pool = sorted
      .filter((s) => best.score - s.score <= (profile.scoreWindow || 550))
      .slice(0, profile.topCount || 3);
    if (!pool.length) return best;
    if (pool[0].isTerminalWin) return pool[0];
    const weights = [0.6, 0.27, 0.13];
    return (
      pickWeighted(
        pool.map((item, index) => ({ item, weight: weights[index] ?? 0.05 })),
        rng
      ) || best
    );
  }

  const ratio = profile.topBandRatio ?? 0.4;
  const byWindow = sorted.filter((s) => best.score - s.score <= (profile.scoreWindow || 1600));
  const bandSize = Math.max(1, Math.ceil(sorted.length * ratio));
  const pool = (byWindow.length ? byWindow : sorted).slice(0, bandSize);
  if (pool[0]?.isTerminalWin) return pool[0];
  const lethal = pool.find((s) => s.simulation?.terminalStatus === 'ai_win_hp');
  if (lethal) return lethal;

  return (
    pickWeighted(
      pool.map((item, index) => ({ item, weight: Math.max(1, pool.length - index) })),
      rng
    ) || best
  );
}

function finalizeDecision(chosen, scored, profile, context, extras = {}) {
  if (!chosen) return null;
  const debug = buildAIDebugPayload({
    difficulty: profile.id,
    selected: chosen,
    candidates: scored,
    context,
    extras,
  });
  if (isAIDebugEnabled()) logAIDebug(debug);

  return {
    card: chosen.action.card,
    cardId: chosen.action.cardId,
    focus: chosen.action.focus,
    fieldIndex: chosen.action.fieldIndex,
    score: chosen.score,
    debug,
  };
}

/**
 * Entry point unico: nessuna lettura del Focus privato del giocatore.
 */
export function chooseAIIndependentAction(context, difficulty, options = {}) {
  const profile =
    options.profile || getAIProfile(difficulty || context.difficulty || 'medium');
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();
  const weights = options.weights || AI_SCORE_WEIGHTS;

  const available = getAvailableCards(context.ai.hand, context.ai.usedCardIds);
  if (!available.length) return null;
  if (!context.field) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[AI] chooseAIIndependentAction: Campo assente');
    }
    return null;
  }

  const strategic = generateStrategicActionsForSide(
    context,
    'ai',
    profile,
    context.currentFieldIndex
  );
  if (!strategic.length) return null;

  const shortlist = buildBalancedShortlist(strategic, context, profile);
  const scenarios = generateOpponentScenarios(context, profile);

  if (!scenarios.length) {
    const fallback = shortlist[0];
    return finalizeDecision(
      {
        action: fallback,
        score: 0,
        isTerminalWin: false,
        isTerminalLoss: false,
        simulation: null,
      },
      [],
      profile,
      context
    );
  }

  const budget = getOrdinaryFocusCap(context, 'ai', profile);
  const scored = [];

  for (const action of shortlist) {
    const scenarioScores = [];
    for (const scenario of scenarios) {
      const simulation = simulateAIDuel(
        context,
        action,
        { card: scenario.card, focus: scenario.focus },
        { cache }
      );
      const base = scoreAIAction(simulation, context, action, profile, weights);
      scenarioScores.push({
        score: base.score,
        probability: scenario.probability,
        won: simulation.winner === 'enemy',
        simulation,
        focus: scenario.focus,
        band: scenario.band,
      });
    }

    const agg = aggregateScenarioScores(scenarioScores, profile);
    const representative =
      scenarioScores.slice().sort((a, b) => a.score - b.score)[
        Math.floor(scenarioScores.length * 0.25)
      ]?.simulation || scenarioScores[0].simulation;

    const meta = scoreAIAction(representative, context, action, profile, weights);
    const overinvestmentPenalty = meta.overinvestmentPenalty || 0;

    scored.push({
      action,
      simulation: representative,
      score: agg.finalScore,
      expectedScore: agg.expectedScore,
      lowerPercentileScore: agg.lowerPercentileScore,
      winProbability: agg.winProbability,
      overinvestmentPenalty,
      isTerminalWin: scenarioScores.every((s) => {
        const t = s.simulation.terminalStatus;
        return t === 'ai_win_hp' || t === 'ai_win_fields' || t === 'ai_win_cards';
      }),
      isTerminalLoss: scenarioScores.some((s) => {
        const t = s.simulation.terminalStatus;
        return t === 'ai_loss_hp' || t === 'ai_loss_fields' || t === 'ai_loss_cards';
      }),
      dominated: false,
      budget,
      exceptionReason: action.meta?.exceptionReason || null,
      scenariosConsidered: scenarios.length,
    });
  }

  // Dominanza disattivata con Focus nascosti (stesso set di scenari: opzionale soft)
  scored.sort((a, b) => compareScoredActions(a, b));
  const chosen = selectFromScored(scored, profile, rng);
  return finalizeDecision(chosen, scored, profile, context, {
    fairShare: budget.fairShare,
    ordinaryCap: budget.ordinaryCap,
    scenarios: scenarios.map((s) => ({
      cardId: s.cardId,
      focus: s.focus,
      band: s.band,
      probability: Number(s.probability.toFixed(3)),
    })),
  });
}

/** @deprecated usare chooseAIIndependentAction */
export function chooseWhenAIResponds(context, profile, options = {}) {
  return chooseAIIndependentAction(context, profile?.id || context.difficulty, {
    ...options,
    profile,
  });
}

/** @deprecated usare chooseAIIndependentAction */
export function chooseWhenAILeads(context, profile, options = {}) {
  return chooseAIIndependentAction(context, profile?.id || context.difficulty, {
    ...options,
    profile,
  });
}

/**
 * Entry point motore decisionale.
 */
export function chooseAIAction(context, difficulty, options = {}) {
  return chooseAIIndependentAction(context, difficulty, options);
}
