// ============================================
// TORNEO — IA a simulazione per le partite tra IA
// ============================================
// Decisore per playAiGameAsync: ogni scelta la calcola il motore a simulazione nel worker,
// al livello del torneo e con il tratto (personalità) del partecipante. Senza worker (test,
// ambienti senza Worker) restituisce null e la partita usa il pianificatore precedente.

import { buildAIContext } from '../ai/buildAIContext.js';
import { isAiWorkerSupported, runMcDecisionInWorker } from '../ai/aiWorkerClient.js';
import { buildMcViewFromGameState, serializeMcView } from '../ai/mc/mcGameAdapter.js';
import { getMcProfile } from '../ai/mc/mcProfiles.js';
import { resolveTraitChoice } from '../ai/mc/mcTraits.js';
import { decisionView } from './aiMatchEngine.js';

/**
 * @param {{ difficulty: string, traits: { a?: string, b?: string }, rng?: () => number }} cfg
 * @returns {((state, side, lead) => Promise<{ fieldIndex, cardId, focus }|null>)|null}
 */
export function createTournamentMcDecider({ difficulty, traits = {}, rng = Math.random }) {
  if (!isAiWorkerSupported()) return null;
  return async (state, side, lead) => {
    const view = { ...decisionView(state, side, lead), aiDifficulty: difficulty };
    const decision = await runMcDecisionInWorker(
      serializeMcView(buildMcViewFromGameState(view)),
      buildAIContext(view),
      difficulty,
      {
        maxMs: getMcProfile(difficulty).maxMs,
        seed: Math.floor(rng() * 2 ** 32),
        trait: traits[side] || 'neutral',
      }
    );
    return decision?.card ? { fieldIndex: decision.fieldIndex, cardId: decision.cardId, focus: decision.focus } : null;
  };
}

/**
 * Tratti delle IA alla creazione del torneo: la scelta del menu vale per tutte, "Casuale"
 * estrae un tratto per ciascuna.
 * @param {string|null|undefined} choice
 * @param {() => number} rng
 */
export function tournamentAiTrait(choice, rng) {
  return resolveTraitChoice(choice || 'neutral', rng);
}
