// ============================================
// Valutazione Campi per entrambe le mani
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import { evaluateFieldControl } from './fieldStrategy.js';

/**
 * Punteggio di un Campo dal punto di vista dell'IA (più alto = migliore per l'IA).
 * Include sia le opportunità della mano IA sia il pericolo che il Campo resti
 * disponibile per una futura scelta del giocatore.
 */
export function lightRankField(state, fieldIndex) {
  const field = state._refs?.battlefields?.[fieldIndex];
  if (!field) return -1e9;

  const control = evaluateFieldControl(state, fieldIndex);
  const mods = getFieldModifiers(field);
  let score = control.netControl * 1.8;

  // Piccoli correttivi generali; il nucleo del punteggio deriva dalle carte.
  if (field.category === 'neutral') score += 1;
  if (field.category === 'limit') score -= 1;
  if (mods.winnerByFocusNotVa) score += 1;

  // Tie-break stabile, non per ordine di apparizione grezzo.
  score -= (field.id || fieldIndex) * 0.001;
  return score;
}

/**
 * Seleziona candidati Campo senza slice sui primi indici.
 * @param {'ai'|'player'} chooser
 * @returns {{ index: number, rank: number }[]}
 */
export function selectCandidateFields(state, maxFields, profile, chooser = 'ai') {
  const indexes = state.availableFieldIndexes || [];
  if (!indexes.length) return [];

  const ranked = indexes
    .map((index) => ({ index, rank: lightRankField(state, index) }))
    .sort((a, b) => b.rank - a.rank || a.index - b.index);

  const limit = Math.max(1, maxFields || 1);
  if (ranked.length <= limit) return ranked;

  if (chooser === 'ai') {
    return ranked.slice(0, limit);
  }

  // Giocatore: Campi peggiori per l'IA, cioè più favorevoli alla sua mano.
  const worstFirst = [...ranked].sort((a, b) => a.rank - b.rank || a.index - b.index);
  if (profile?.id === 'hard' || profile?.id === 'easy') {
    return worstFirst.slice(0, limit);
  }

  return worstFirst.slice(0, limit);
}

/**
 * Peso con cui il giocatore sceglie un Campo (più alto se peggiore per l'IA).
 */
export function playerFieldChoiceWeight(rank, ranks, profile) {
  const max = Math.max(...ranks);
  const min = Math.min(...ranks);
  const span = Math.max(1e-6, max - min);
  const attractiveness = (max - rank) / span + 0.15;
  if (profile?.id === 'hard') {
    return attractiveness * attractiveness;
  }
  return attractiveness;
}
