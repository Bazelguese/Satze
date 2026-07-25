// ============================================
// Selezione mossa IA (risponde / apre)
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng, AI_SCORE_WEIGHTS } from './aiConstants.js';
import { generateActionsForSide, getAvailableCards } from './generateAIActions.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import {
  scoreAIAction,
  scoreSimulationForSide,
  findDominatedActions,
  compareScoredActions,
  estimateFutureCardValue,
} from './scoreAIAction.js';
import { buildAIDebugPayload, isAIDebugEnabled, logAIDebug } from './aiDebug.js';

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

/**
 * Pre-ranking leggero (non decide l'esito): solo per pruning.
 */
export function lightRankAction(action, context, side = 'ai') {
  const card = action.card;
  const focus = action.focus || 1;
  let score = (card.power || 0) * focus + (card.damage || 0) * 1.5;
  score += estimateFutureCardValue(card, context) * 0.15;
  score -= focus * 0.4;

  const trigger = card.ability?.trigger;
  if (trigger === 'overdrive' && focus >= 5) score += 8;
  if (trigger === 'opportunista' && side === 'ai' && (context.player.selectedFocus || 0) >= 5) {
    score += 6;
  }
  if (trigger === 'intervention' && context.isPlayerFirst && side === 'ai') score += 5;
  if (trigger === 'imboscata' && !context.isPlayerFirst && side === 'ai') score += 5;

  // Importanza Campo / HP bassi
  if ((context.player.hp || 0) <= (card.damage || 0) + 2) score += 12;
  if ((context.enemyFieldsConquered || 0) >= 2 && side === 'ai') score += 10;
  if ((context.playerFieldsConquered || 0) >= 2 && side === 'ai') score += 8;

  return score;
}

function selectFromScored(sorted, profile, rng) {
  if (!sorted.length) return null;

  const best = sorted[0];
  const terminalWins = sorted.filter((s) => s.isTerminalWin);
  if (terminalWins.length) {
    terminalWins.sort(compareScoredActions);
    return terminalWins[0];
  }

  // Difesa terminale: se la migliore previene una loss e altre no, preferiscila
  if (best.isTerminalLoss === false) {
    const nonLoss = sorted.filter((s) => !s.isTerminalLoss);
    if (nonLoss.length && sorted.some((s) => s.isTerminalLoss)) {
      // continua sul pool non-loss
      sorted = nonLoss;
    }
  }

  const mode = profile.selectionMode;

  if (mode === 'best') {
    const windowed = sorted.filter((s) => best.score - s.score <= (profile.scoreWindow || 40));
    windowed.sort(compareScoredActions);
    if (windowed.length <= 1) return windowed[0] || best;
    // Pareggi sostanziali: preferExactMinFocus già in compare; RNG solo se resta parità
    const top = windowed.filter((s) => Math.abs(s.score - best.score) <= 0.01);
    if (top.length <= 1) return windowed[0];
    const idx = Math.floor(rng() * top.length);
    return top[idx];
  }

  if (mode === 'weighted-top') {
    const topCount = profile.topCount || 3;
    const pool = sorted
      .filter((s) => best.score - s.score <= (profile.scoreWindow || 550))
      .slice(0, topCount);
    if (!pool.length) return best;
    if (pool[0].isTerminalWin) return pool[0];
    const weights = [0.6, 0.27, 0.13];
    const entries = pool.map((item, index) => ({
      item,
      weight: weights[index] ?? 0.05,
    }));
    return pickWeighted(entries, rng) || best;
  }

  // top-band-random (easy)
  const ratio = profile.topBandRatio ?? 0.4;
  const byWindow = sorted.filter((s) => best.score - s.score <= (profile.scoreWindow || 1600));
  const bandSize = Math.max(1, Math.ceil(sorted.length * ratio));
  const pool = (byWindow.length ? byWindow : sorted).slice(0, bandSize);
  if (pool[0]?.isTerminalWin) return pool[0];
  // Letale sicuro: non ignorare per casualità
  const lethal = pool.find(
    (s) =>
      s.simulation?.terminalStatus === 'ai_win_hp' ||
      (s.simulation?.playerHpAfter <= 0 && s.simulation?.aiHpAfter > 0)
  );
  if (lethal) return lethal;

  const entries = pool.map((item, index) => ({
    item,
    weight: Math.max(1, pool.length - index),
  }));
  return pickWeighted(entries, rng) || best;
}

function finalizeDecision(chosen, scored, profile, context) {
  if (!chosen) return null;
  const debug = buildAIDebugPayload({
    difficulty: profile.id,
    selected: chosen,
    candidates: scored,
    context,
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
 * IA che risponde: carta e Focus giocatore noti.
 */
export function chooseWhenAIResponds(context, profile, options = {}) {
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();
  const weights = options.weights || AI_SCORE_WEIGHTS;

  const playerCard = context.player.selectedCard;
  const playerFocus = context.player.selectedFocus;
  if (!playerCard || playerFocus == null || playerFocus < 1) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[AI] chooseWhenAIResponds: carta/Focus giocatore mancanti');
    }
    return null;
  }

  const playerAction = { card: playerCard, focus: playerFocus };
  const actions = generateActionsForSide(context, 'ai', context.currentFieldIndex);
  if (!actions.length) return null;

  const scored = [];
  for (const action of actions) {
    const simulation = simulateAIDuel(context, action, playerAction, { cache });
    const scoredAction = scoreAIAction(simulation, context, action, profile, weights);
    scored.push({
      action,
      simulation,
      score: scoredAction.score,
      isTerminalWin: scoredAction.isTerminalWin,
      isTerminalLoss: scoredAction.isTerminalLoss,
      dominated: false,
    });
  }

  let working = scored;
  if (profile.useDominanceFilter) {
    const dominated = findDominatedActions(scored);
    for (const entry of scored) {
      entry.dominated = dominated.has(entry);
    }
    working = scored.filter((s) => !s.dominated);
    if (!working.length) working = scored;
  }

  working.sort(compareScoredActions);
  const chosen = selectFromScored(working, profile, rng);
  return finalizeDecision(chosen, scored.sort(compareScoredActions), profile, context);
}

/**
 * IA che apre: valuta risposte avversarie dalla mano visibile.
 */
export function chooseWhenAILeads(context, profile, options = {}) {
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();
  const weights = options.weights || AI_SCORE_WEIGHTS;

  const aiActions = generateActionsForSide(context, 'ai', context.currentFieldIndex);
  if (!aiActions.length) return null;

  // Passaggio A — pre-ranking
  const rankedOwn = aiActions
    .map((action) => ({ action, pre: lightRankAction(action, context, 'ai') }))
    .sort((a, b) => b.pre - a.pre);

  const ownLimit = profile.ownActionLimitWhenFirst || 10;
  const shortlist = rankedOwn.slice(0, Math.min(ownLimit, rankedOwn.length)).map((e) => e.action);

  const playerActionsAll = generateActionsForSide(context, 'player', context.currentFieldIndex);
  const rankedPlayer = playerActionsAll
    .map((action) => ({ action, pre: lightRankAction(action, context, 'player') }))
    .sort((a, b) => b.pre - a.pre);

  const responseLimit = profile.opponentResponseLimit;
  const playerShortlist =
    responseLimit === Infinity
      ? rankedPlayer.map((e) => e.action)
      : rankedPlayer.slice(0, Math.min(responseLimit || 1, rankedPlayer.length)).map((e) => e.action);

  // Se non ci sono risposte (mano vuota), fallback simulazione con carta fantasma impossibile → evita
  if (!playerShortlist.length) {
    // Senza risposte possibili, scegli per light rank
    const fallback = shortlist[0];
    if (!fallback) return null;
    return {
      card: fallback.card,
      cardId: fallback.cardId,
      focus: fallback.focus,
      fieldIndex: fallback.fieldIndex,
      score: 0,
      debug: null,
    };
  }

  const scored = [];

  for (const aiAction of shortlist) {
    const responseScores = [];
    for (const playerAction of playerShortlist) {
      const simulation = simulateAIDuel(context, aiAction, playerAction, { cache });
      const aiScore = scoreAIAction(simulation, context, aiAction, profile, weights).score;
      // Score dal POV giocatore per ordinare risposte (usato indirettamente via robust)
      const playerScore = scoreSimulationForSide(simulation, context, 'player', weights);
      responseScores.push({ simulation, aiScore, playerScore, playerAction });
    }

    // Ordina risposte per forza del giocatore (peggio per l'IA = playerScore alto)
    responseScores.sort((a, b) => b.playerScore - a.playerScore);

    const worst = responseScores[0];
    const topN = responseScores.slice(0, Math.min(5, responseScores.length));
    const avg =
      topN.reduce((sum, r) => sum + r.aiScore, 0) / Math.max(1, topN.length);
    const worstCaseWeight = profile.worstCaseWeight ?? 0.55;
    const robustScore = worst.aiScore * worstCaseWeight + avg * (1 - worstCaseWeight);

    const representative = worst.simulation;
    const meta = scoreAIAction(representative, context, aiAction, profile, weights);

    scored.push({
      action: aiAction,
      simulation: representative,
      score: robustScore,
      isTerminalWin: meta.isTerminalWin && responseScores.every((r) => {
        const t = r.simulation.terminalStatus;
        return t === 'ai_win_hp' || t === 'ai_win_fields' || t === 'ai_win_cards';
      }),
      isTerminalLoss: responseScores.some((r) => {
        const t = r.simulation.terminalStatus;
        return t === 'ai_loss_hp' || t === 'ai_loss_fields' || t === 'ai_loss_cards';
      }),
      dominated: false,
      responseVariance: Math.max(...responseScores.map((r) => r.aiScore)) -
        Math.min(...responseScores.map((r) => r.aiScore)),
    });
  }

  let working = scored;
  if (profile.useDominanceFilter) {
    const dominated = findDominatedActions(scored);
    for (const entry of scored) entry.dominated = dominated.has(entry);
    working = scored.filter((s) => !s.dominated);
    if (!working.length) working = scored;
  }

  // Preferisci minor varianza a parità
  working.sort((a, b) => {
    const primary = compareScoredActions(a, b);
    if (primary !== 0) return primary;
    return (a.responseVariance || 0) - (b.responseVariance || 0);
  });

  const chosen = selectFromScored(working, profile, rng);
  return finalizeDecision(chosen, scored.sort(compareScoredActions), profile, context);
}

/**
 * Entry point motore decisionale.
 *
 * @param {object} context
 * @param {string} [difficulty]
 * @param {{ rng?: () => number, cache?: Map, weights?: object }} [options]
 */
export function chooseAIAction(context, difficulty, options = {}) {
  const profile =
    options.profile || getAIProfile(difficulty || context.difficulty || 'medium');
  const available = getAvailableCards(context.ai.hand, context.ai.usedCardIds);
  if (!available.length) return null;

  if (!context.field) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[AI] chooseAIAction: Campo assente');
    }
    return null;
  }

  if (context.isPlayerFirst) {
    return chooseWhenAIResponds(context, profile, options);
  }
  return chooseWhenAILeads(context, profile, options);
}
