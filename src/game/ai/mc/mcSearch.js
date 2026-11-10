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
import {
  clampFocusFor,
  createFastPolicyAgent,
  estimateVisibleAssault,
  fairShareFor,
  focusNeededToBeat,
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

/** Una simulazione completa a partire dalla scelta `candidate`. */
function rollout(view, candidate, seed, params) {
  const rng = mulberry32(seed);
  const policy = createFastPolicyAgent(rng, {
    quality: params.policyQuality,
    responder: params.responder,
  });
  const opponentPolicy = createFastPolicyAgent(rng, {
    quality: params.opponentQuality,
    responder: params.responder,
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

function focusOptions(view, card) {
  const fair = fairShareFor(view, 'enemy');
  const values = [1, fair - 1, fair, fair + 1, fair + 3];
  if (view.selectedAgent) {
    const need = focusNeededToBeat(card, estimateVisibleAssault(view));
    values.push(need, need + 1);
  }
  return [...new Set(values.map((v) => clampFocusFor(view, 'enemy', v)))];
}

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

