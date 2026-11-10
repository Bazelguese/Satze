// ============================================
// Motore a simulazione: scelta di Campo, Agente e FC
// ============================================
//
// Per ogni azione candidata gioca molte volte il resto della partita con una politica
// veloce (mcPolicy.js) e stima la probabilità di vittoria. Le mani sono visibili: le
// incognite simulate sono le scelte dell'avversario e i suoi FC nascosti.
//
// - Stessi semi di simulazione per tutti i candidati: i confronti sono meno rumorosi.
// - Eliminazione progressiva (successive halving): il budget si concentra sui candidati
//   migliori invece di dividerlo in parti uguali.
// - `noise`: scelta finale fra le azioni vicine alla migliore con pesi softmax
//   (temperatura in punti di probabilità di vittoria). 0 = sempre la migliore.
//
// Lo stato `view` ha la forma del motore di partita (src/game/sim/headlessMatch.js) e il
// punto di vista di chi decide: l'IA è il lato `enemy`. Non contiene mai i FC scelti
// dall'avversario.

import { mulberry32 } from '../../../utils/seededRandom.js';
import {
  availableCards,
  legalFieldIndexes,
  playHeadlessRound,
  resolveMatchEnd,
} from '../../sim/headlessMatch.js';
import { resolveRoundInitiative } from '../../duel/resolveRoundInitiative.js';
import { getLearnedWeights } from './learnedPolicy.js';
import {
  clampFocusFor,
  createFastPolicyAgent,
  fairShareFor,
  focusNeededToBeat,
  focusOptionsFor,
  sampleOpponentFocus,
} from './mcPolicy.js';

const MAX_ROUNDS = 12;

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function nextRoundState(after, round) {
  const nextRound = round + 1;
  return {
    ...after,
    roundNumber: nextRound,
    isPlayerFirst: resolveRoundInitiative({
      roundNumber: nextRound,
      openingPlayerFirst: after.openingPlayerFirst,
      initiativeProfile: null,
    }),
    currentFieldIndex: null,
    selectedAgent: null,
    enemyAgent: null,
  };
}

/** Prima decisione fissata, poi la politica veloce. */
function scripted(first, fallback) {
  let used = false;
  const take = (method) => (state) => {
    if (!used) {
      used = true;
      return first;
    }
    return fallback[method](state);
  };
  return { lead: take('lead'), respond: take('respond') };
}

function outcomeValue(end, state) {
  const base = end.winner === 'draw' ? 0.5 : end.winner === 'enemy' ? 1 : 0;
  return base + (state.enemyHP - state.playerHP) * 0.002;
}

/** La prima risposta dell'avversario segue `first` (scelta o agente), poi la politica. */
function firstResponseBy(first, policy) {
  let used = false;
  return {
    lead: (state) => policy.lead(state),
    respond(state) {
      if (used) return policy.respond(state);
      used = true;
      return typeof first.respond === 'function' ? first.respond(state) : first;
    },
  };
}

/**
 * Una simulazione completa a partire dalla scelta `candidate`.
 * @param {object|null} [opponentReply] - risposta avversaria fissata al primo turno (solo se
 *   l'IA ha l'iniziativa): { cardId, focus }
 */
function rollout(view, candidate, seed, params, opponentReply = null) {
  const rng = mulberry32(seed);
  const learnedWeights =
    params.policy === 'learned' ? params.learnedWeights || getLearnedWeights() : null;
  const policy = createFastPolicyAgent(rng, {
    quality: params.policyQuality,
    responder: params.responder,
    learnedWeights,
  });
  const opponentPolicy = createFastPolicyAgent(rng, {
    quality: params.opponentQuality,
    responder: params.responder,
    learnedWeights,
  });
  const opponentLeads = view.isPlayerFirst === true;
  let opponent = opponentPolicy;
  if (opponentLeads && view.selectedAgent) {
    // Agente avversario visibile: i suoi FC restano un'incognita.
    opponent = scripted(
      {
        fieldIndex: view.currentFieldIndex,
        cardId: view.selectedAgent.id,
        focus: sampleOpponentFocus(view, rng),
      },
      opponentPolicy
    );
  } else if (opponentLeads && view.currentFieldIndex != null) {
    // Campo già scelto, Agente avversario non ancora visibile: lo si simula su quel Campo.
    let first = true;
    opponent = {
      lead(state) {
        const choice = opponentPolicy.lead(state);
        if (first) {
          first = false;
          return { ...choice, fieldIndex: view.currentFieldIndex };
        }
        return choice;
      },
      respond: (state) => opponentPolicy.respond(state),
    };
  } else if (!opponentLeads && opponentReply) {
    opponent = firstResponseBy(opponentReply, opponentPolicy);
  } else if (!opponentLeads && params.rootResponder) {
    // Prima risposta avversaria più accurata della politica generica.
    const rootPolicy = createFastPolicyAgent(rng, {
      quality: params.rootOpponentQuality ?? 1,
      responder: params.rootResponder,
    });
    opponent = firstResponseBy(rootPolicy, opponentPolicy);
  }
  const agents = { enemy: scripted(candidate, policy), player: opponent };

  let state = { ...view, selectedAgent: null, enemyAgent: null };
  for (let guard = 0; guard < MAX_ROUNDS; guard += 1) {
    const { state: after } = playHeadlessRound(state, agents);
    const end = resolveMatchEnd(after, state.roundNumber);
    if (end) return outcomeValue(end, after);
    state = nextRoundState(after, state.roundNumber);
  }
  return 0.5;
}

const focusOptions = focusOptionsFor;

/**
 * Azioni candidate: Campo × Agente × FC. Se il Campo è già fissato (in risposta, o con
 * l'iniziativa quando il gioco ha già scelto il Campo) si varia solo Agente × FC.
 */
export function generateMcCandidates(view) {
  const fields =
    view.currentFieldIndex != null ? [view.currentFieldIndex] : legalFieldIndexes(view);
  const out = [];
  for (const fieldIndex of fields) {
    for (const card of availableCards(view, 'enemy')) {
      for (const focus of focusOptions(view, card)) {
        out.push({ fieldIndex, cardId: card.id, focus });
      }
    }
  }
  return out;
}

/**
 * Gioco a somma zero (righe: IA massimizza, colonne: avversario minimizza), risolto con
 * regret matching+. Restituisce le strategie medie e il valore del gioco.
 * @param {number[][]} matrix
 */
export function solveZeroSumGame(matrix, iterations = 2000) {
  const m = matrix.length;
  const n = matrix[0]?.length || 0;
  const regretRow = new Array(m).fill(0);
  const regretCol = new Array(n).fill(0);
  const sumRow = new Array(m).fill(0);
  const sumCol = new Array(n).fill(0);
  const normalize = (regrets) => {
    const total = regrets.reduce((acc, r) => acc + Math.max(0, r), 0);
    return total > 0
      ? regrets.map((r) => Math.max(0, r) / total)
      : regrets.map(() => 1 / regrets.length);
  };
  for (let t = 0; t < iterations; t += 1) {
    const x = normalize(regretRow);
    const y = normalize(regretCol);
    const rowPayoff = matrix.map((row) => row.reduce((acc, a, j) => acc + a * y[j], 0));
    const colPayoff = new Array(n).fill(0);
    for (let i = 0; i < m; i += 1) {
      for (let j = 0; j < n; j += 1) colPayoff[j] += x[i] * matrix[i][j];
    }
    const value = x.reduce((acc, xi, i) => acc + xi * rowPayoff[i], 0);
    for (let i = 0; i < m; i += 1) regretRow[i] = Math.max(0, regretRow[i] + rowPayoff[i] - value);
    for (let j = 0; j < n; j += 1) regretCol[j] = Math.max(0, regretCol[j] + value - colPayoff[j]);
    for (let i = 0; i < m; i += 1) sumRow[i] += x[i];
    for (let j = 0; j < n; j += 1) sumCol[j] += y[j];
  }
  const rowStrategy = sumRow.map((v) => v / iterations);
  const colStrategy = sumCol.map((v) => v / iterations);
  let value = 0;
  for (let i = 0; i < m; i += 1) {
    for (let j = 0; j < n; j += 1) value += rowStrategy[i] * matrix[i][j] * colStrategy[j];
  }
  return { rowStrategy, colStrategy, value };
}

/** Risposte plausibili dell'avversario a un nostro Agente visibile (FC nostri ignoti). */
function opponentReplies(view, ourCard) {
  const ourAssault = (ourCard.power || 0) * fairShareFor(view, 'enemy');
  const fair = fairShareFor(view, 'player');
  const replies = [];
  for (const card of availableCards(view, 'player')) {
    const need = focusNeededToBeat(card, ourAssault);
    const focuses = new Set(
      [1, fair, need, need + 2].map((f) => clampFocusFor(view, 'player', f))
    );
    for (const focus of focuses) replies.push({ cardId: card.id, focus });
  }
  return replies;
}

function sampleIndex(weights, rng) {
  let roll = rng() * weights.reduce((acc, w) => acc + w, 0);
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Apertura come gioco simultaneo: per i migliori (Campo, Agente) dello stadio precedente,
 * tabella FC dell'IA × risposte avversarie riempita con simulazioni, risolta a somma zero.
 */
function matrixLeadStage(view, ranked, params, rng, seeds, deadline) {
  const combos = [];
  const seen = new Set();
  for (const c of ranked) {
    const key = `${c.fieldIndex}:${c.cardId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combos.push({ fieldIndex: c.fieldIndex, cardId: c.cardId });
    if (combos.length >= (params.matrixCombos || 3)) break;
  }
  const perCell = Math.max(1, params.matrixRollouts || 8);
  while (seeds.length < perCell) seeds.push((rng() * 2 ** 32) >>> 0);
  let spent = 0;
  let best = null;
  for (const combo of combos) {
    const ourCard = availableCards(view, 'enemy').find((c) => c.id === combo.cardId);
    const rows = focusOptions(view, ourCard);
    const cols = opponentReplies(view, ourCard);
    const matrix = rows.map(() => new Array(cols.length).fill(0));
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = 0; j < cols.length; j += 1) {
        let total = 0;
        for (let k = 0; k < perCell; k += 1) {
          total += rollout(view, { ...combo, focus: rows[i] }, seeds[k], params, cols[j]);
        }
        matrix[i][j] = total / perCell;
        spent += perCell;
      }
      if (deadline && nowMs() > deadline) break;
    }
    const game = solveZeroSumGame(matrix);
    if (!best || game.value > best.value) best = { ...combo, rows, game, value: game.value };
    if (deadline && nowMs() > deadline) break;
  }
  if (!best) return null;
  const focus = best.rows[sampleIndex(best.game.rowStrategy, rng)];
  return { fieldIndex: best.fieldIndex, cardId: best.cardId, focus, mean: best.value, spent };
}

function pickWithNoise(ranked, noise, rng) {
  if (!noise || ranked.length === 1) return ranked[0];
  const best = ranked[0].mean;
  const weights = ranked.map((c) => Math.exp((c.mean - best) / noise));
  let roll = rng() * weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < ranked.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return ranked[i];
  }
  return ranked[0];
}

/**
 * @param {object} view - stato dal punto di vista dell'IA (lato `enemy`)
 * @param {{
 *   rollouts: number,          budget totale di simulazioni per decisione
 *   policyQuality?: number,    qualità della politica veloce per l'IA
 *   opponentQuality?: number,  qualità della politica veloce per l'avversario
 *   noise?: number,            temperatura della scelta finale (0 = migliore)
 *   responder?: 'heuristic'|'simulate', come rispondono le politiche veloci
 *   maxMs?: number,            tempo massimo (anytime): oltre, si sceglie con i dati raccolti
 *   rootResponder?, rootOpponentQuality?: politica della prima risposta avversaria
 *   leadMode?: 'matrix', matrixCombos?, matrixRollouts?: apertura come gioco simultaneo
 *   policy?: 'learned', learnedWeights?: politica addestrata nelle simulazioni
 *   onCandidates?: (view, ranked) => void, per raccogliere dati di addestramento
 * }} params
 * @param {() => number} rng
 * @returns {{ fieldIndex: number, cardId: number, focus: number, mean: number, stats: object }|null}
 */
export function chooseMonteCarloAction(view, params, rng) {
  const candidates = generateMcCandidates(view).map((c) => ({ ...c, total: 0, n: 0, mean: 0 }));
  if (!candidates.length) return null;
  if (candidates.length === 1) return { ...candidates[0], stats: { rollouts: 0, candidates: 1 } };

  const started = nowMs();
  const budget = Math.max(candidates.length, Number(params.rollouts) || 0);
  const phases = Math.max(1, Math.ceil(Math.log2(candidates.length)));
  const seeds = [];
  let alive = candidates;
  let spent = 0;
  let timedOut = false;

  for (let phase = 0; phase < phases && alive.length > 1 && !timedOut; phase += 1) {
    const perCandidate = Math.max(1, Math.floor(budget / (phases * alive.length)));
    for (const candidate of alive) {
      const target = candidate.n + perCandidate;
      while (candidate.n < target) {
        // Stessi semi per tutti i candidati (numeri casuali comuni).
        while (seeds.length <= candidate.n) seeds.push((rng() * 2 ** 32) >>> 0);
        candidate.total += rollout(view, candidate, seeds[candidate.n], params);
        candidate.n += 1;
        spent += 1;
        if (params.maxMs && (spent & 7) === 0 && nowMs() - started > params.maxMs) {
          timedOut = true;
          break;
        }
      }
      candidate.mean = candidate.total / candidate.n;
      if (timedOut) break;
    }
    const measured = alive.filter((c) => c.n > 0).sort((a, b) => b.mean - a.mean);
    alive = measured.slice(0, Math.max(1, Math.ceil(measured.length / 2)));
  }

  // A parità di stima vince il candidato misurato con più simulazioni.
  const ranked = candidates
    .filter((c) => c.n > 0)
    .sort((a, b) => b.mean - a.mean || b.n - a.n);
  // Senza rumore: la stima migliore fra i candidati misurati abbastanza (almeno il 60%
  // delle simulazioni del più misurato), così una stima fortunata su pochi dati non vince.
  const maxN = ranked.reduce((m, c) => Math.max(m, c.n), 0);
  const reliable = ranked.filter((c) => c.n >= maxN * 0.6);
  // Raccolta dati per l'addestramento della politica (scripts/ai-train-policy.mjs).
  params.onCandidates?.(view, ranked);

  // Con l'iniziativa: eventuale stadio a gioco simultaneo sui FC.
  if (params.leadMode === 'matrix' && view.isPlayerFirst !== true && !timedOut) {
    const deadline = params.maxMs ? started + params.maxMs : null;
    const lead = matrixLeadStage(view, reliable.concat(ranked), params, rng, seeds, deadline);
    if (lead) {
      return {
        fieldIndex: lead.fieldIndex,
        cardId: lead.cardId,
        focus: lead.focus,
        mean: lead.mean,
        stats: {
          rollouts: spent + lead.spent,
          candidates: candidates.length,
          ms: nowMs() - started,
          timedOut: Boolean(deadline && nowMs() > deadline),
          leadMode: 'matrix',
        },
      };
    }
  }

  const chosen = params.noise ? pickWithNoise(ranked, params.noise, rng) : reliable[0];
  return {
    fieldIndex: chosen.fieldIndex,
    cardId: chosen.cardId,
    focus: chosen.focus,
    mean: chosen.mean,
    stats: {
      rollouts: spent,
      candidates: candidates.length,
      ms: nowMs() - started,
      timedOut,
    },
  };
}

