// ============================================
// Agenti per le partite senza interfaccia
// ============================================
//
// Ogni agente riceve lo stato dal proprio punto di vista (vedi viewForSide: chi decide
// è sempre il lato `enemy`) ed espone:
// - lead(view)    → { fieldIndex, cardId, focus }   quando ha l'iniziativa;
// - respond(view) → { cardId, focus }               quando vede l'Agente avversario.

import { buildAIInformationSet } from '../ai/buildAIInformationSet.js';
import { chooseAIAction } from '../ai/chooseAIAction.js';
import { chooseJointAIAction } from '../ai/chooseJointAIAction.js';
import { getAIProfile } from '../ai/aiProfiles.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { availableCards, legalFieldIndexes, legalFocusRange } from './headlessMatch.js';
import { chooseMonteCarloAction } from '../ai/mc/mcSearch.js';
import { getMcProfile } from '../ai/mc/mcProfiles.js';
import { getLearnedWeights } from '../ai/mc/learnedPolicy.js';
import fs from 'node:fs';

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

/** Quota "equa" di FC per carta, arrotondata, entro il range legale. */
function fairFocus(view) {
  const { maxFocus, pool, cardsRemaining } = legalFocusRange(view, 'enemy');
  const share = Math.round(pool / Math.max(1, cardsRemaining));
  return Math.max(1, Math.min(Math.max(1, maxFocus), share));
}

/**
 * IA del gioco, chiamata come in src/hooks/useAI.js:
 * - con l'iniziativa: decisione congiunta Campo + Agente + FC (chooseJointAIAction),
 *   riusata poi per lo schieramento;
 * - in risposta: chooseAIAction con il Campo fissato e l'Agente avversario visibile.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {{ seed?: number, label?: string, overrides?: object }} [options]
 *   overrides: parametri di profilo da sostituire (esperimenti), es. { riskWeight: 0.2 }
 */
export function createEngineAgent(difficulty, { seed = 1, label, overrides = null } = {}) {
  const rng = mulberry32(seed >>> 0);
  const profile = overrides ? { ...getAIProfile(difficulty), ...overrides } : undefined;
  const withDifficulty = (view) => ({ ...view, aiDifficulty: difficulty });
  return {
    id: label || `ia-${difficulty}`,
    kind: 'engine',
    difficulty,
    lead(view) {
      const context = buildAIInformationSet(withDifficulty({ ...view, currentFieldIndex: null }));
      const decision = chooseJointAIAction(context, difficulty, { rng, profile });
      return decision?.card
        ? { fieldIndex: decision.fieldIndex, cardId: decision.card.id, focus: decision.focus }
        : null;
    },
    respond(view) {
      const context = buildAIInformationSet(withDifficulty(view));
      const decision = chooseAIAction(context, difficulty, { rng, profile });
      return decision?.card ? { cardId: decision.card.id, focus: decision.focus } : null;
    },
  };
}

/**
 * Riferimento "casuale": Campo e Agente a caso, FC a caso fra 1 e il doppio della quota equa.
 */
export function createRandomAgent({ seed = 1, label = 'casuale' } = {}) {
  const rng = mulberry32(seed >>> 0);
  const choose = (view) => {
    const cards = availableCards(view, 'enemy');
    const { maxFocus } = legalFocusRange(view, 'enemy');
    const top = Math.max(1, Math.min(Math.max(1, maxFocus), fairFocus(view) * 2));
    return { card: pick(cards, rng), focus: 1 + Math.floor(rng() * top) };
  };
  return {
    id: label,
    kind: 'random',
    lead(view) {
      const { card, focus } = choose(view);
      return { fieldIndex: pick(legalFieldIndexes(view), rng), cardId: card.id, focus };
    },
    respond(view) {
      const { card, focus } = choose(view);
      return { cardId: card.id, focus };
    },
  };
}

/**
 * Riferimento "avido": gioca subito l'Agente con più POT (poi DAN), quota equa di FC,
 * primo Campo disponibile. Non guarda Campi, Poteri né l'Agente avversario.
 */
export function createGreedyAgent({ label = 'avido' } = {}) {
  const strongest = (view) =>
    [...availableCards(view, 'enemy')].sort(
      (a, b) => (b.power || 0) - (a.power || 0) || (b.damage || 0) - (a.damage || 0) || a.id - b.id
    )[0];
  return {
    id: label,
    kind: 'greedy',
    lead(view) {
      return {
        fieldIndex: legalFieldIndexes(view)[0],
        cardId: strongest(view).id,
        focus: fairFocus(view),
      };
    },
    respond(view) {
      return { cardId: strongest(view).id, focus: fairFocus(view) };
    },
  };
}

/**
 * Motore a simulazione (src/game/ai/mc). La vista è già dal punto di vista dell'IA.
 * @param {'easy'|'medium'|'hard'} difficulty
 */
export function createMonteCarloEngineAgent(difficulty, { seed = 1, label, overrides = null } = {}) {
  const rng = mulberry32(seed >>> 0);
  const params = { ...getMcProfile(difficulty), ...(overrides || {}) };
  if (params.weightsFile) {
    // Esperimenti: pesi alternativi da file JSON (scripts/ai-train-policy.mjs --weights-json).
    const weights = getLearnedWeights(JSON.parse(fs.readFileSync(params.weightsFile, 'utf8')));
    if (!weights) throw new Error(`Pesi non validi: ${params.weightsFile}`);
    params.policy = 'learned';
    params.learnedWeights = weights;
  }
  const decide = (view) => {
    const decision = chooseMonteCarloAction(view, params, rng);
    return decision
      ? { fieldIndex: decision.fieldIndex, cardId: decision.cardId, focus: decision.focus }
      : null;
  };
  return {
    id: label || `mc-${difficulty}`,
    kind: 'montecarlo',
    difficulty,
    lead: decide,
    respond: decide,
  };
}

function parseOverrideValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

/**
 * Varianti di profilo per esperimenti: 'hard@riskWeight=0.2;searchDepth=1'.
 * @returns {{ base: string, overrides: object|null }}
 */
export function parseAgentSpec(spec) {
  const [base, rest] = String(spec).split('@');
  if (!rest) return { base, overrides: null };
  const overrides = {};
  for (const pair of rest.split(';').filter(Boolean)) {
    const [key, value] = pair.split('=');
    overrides[key] = parseOverrideValue(value ?? '');
  }
  return { base, overrides };
}

/**
 * @param {string} spec - 'easy' | 'medium' | 'hard' (motore attuale), 'mc-easy' | 'mc-medium' |
 *   'mc-hard' (motore a simulazione), 'random' | 'greedy',
 *   con varianti di profilo opzionali: 'hard@riskWeight=0.2;searchDepth=1'
 */
export function createAgentFromSpec(spec, { seed = 1 } = {}) {
  const { base, overrides } = parseAgentSpec(spec);
  if (base === 'random') return createRandomAgent({ seed });
  if (base === 'greedy') return createGreedyAgent();
  const mc = /^mc-(easy|medium|hard)$/.exec(base);
  if (mc) {
    return createMonteCarloEngineAgent(mc[1], { seed, label: spec, overrides });
  }
  if (base === 'easy' || base === 'medium' || base === 'hard') {
    return createEngineAgent(base, { seed, label: spec, overrides });
  }
  throw new Error(`Agente sconosciuto: ${spec}`);
}
