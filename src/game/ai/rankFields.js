// ============================================
// Valutazione leggera Campi (senza slice sugli indici)
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import { findCardInState } from './strategicState.js';

/**
 * Punteggio leggero di un Campo dal punto di vista dell'IA (più alto = migliore per l'IA).
 */
export function lightRankField(state, fieldIndex) {
  const field = state._refs?.battlefields?.[fieldIndex];
  if (!field) return -1e9;

  let score = 0;
  const mods = getFieldModifiers(field);

  if (field.category === 'values') score += 4;
  if (field.category === 'trigger') score += 3;
  if (field.category === 'focus') score += 2;
  if (field.category === 'conditional') score += 2;
  if (field.category === 'limit') score -= 1;
  if (field.category === 'neutral') score += 1;

  // overdriveThreshold di default è 5 su tutti i Campi: conta solo specialità reali
  const overdriveSpecialty =
    mods.overdriveExtraPowerAndDamage === true || Number(mods.overdriveThreshold) === 4;
  if (overdriveSpecialty) score += 8;
  if (mods.winnerByFocusNotVa) score += 1;
  if (mods.maxFocus != null && mods.maxFocus <= 3) score -= 2;

  for (const id of state.aiRemainingCardIds || []) {
    const card = findCardInState(state, 'ai', id);
    if (!card) continue;
    const trigger = card.ability?.trigger;
    if (trigger === 'overdrive' && overdriveSpecialty) {
      score += 14;
    }
    if (trigger === 'imboscata' || trigger === 'intervention') score += 2;
    if ((card.power || 0) >= 5 && field.category === 'values') score += 3;
    if ((card.damage || 0) >= 5 && field.category === 'values') score += 2;
    if (field.tema && card.army && field.tema === card.army) score += 6;
  }

  for (const id of state.playerRemainingCardIds || []) {
    const card = findCardInState(state, 'player', id);
    if (!card) continue;
    if (field.tema && card.army && field.tema === card.army) score -= 3;
    if (card.ability?.trigger === 'overdrive' && overdriveSpecialty) {
      score -= 8;
    }
  }

  // Tie-break stabile, non per ordine di apparizione grezzo
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

  // Giocatore: Campi peggiori per l'IA (adversarial)
  const worstFirst = [...ranked].sort((a, b) => a.rank - b.rank || a.index - b.index);
  if (profile?.id === 'hard' || profile?.id === 'easy') {
    return worstFirst.slice(0, limit);
  }

  // Normale: mix dei peggiori + qualche alternativa
  const picks = [];
  for (const entry of worstFirst) {
    if (picks.length >= limit) break;
    picks.push(entry);
  }
  return picks;
}

/**
 * Peso con cui il giocatore sceglie un Campo (più alto se peggiore per l'IA).
 */
export function playerFieldChoiceWeight(rank, ranks, profile) {
  const max = Math.max(...ranks);
  const min = Math.min(...ranks);
  const span = Math.max(1e-6, max - min);
  // Invertito: rank basso (cattivo per IA) → peso alto
  const attractiveness = (max - rank) / span + 0.15;
  if (profile?.id === 'hard') {
    // Usato solo se serve distribuzione; hard usa min puro altrove
    return attractiveness * attractiveness;
  }
  return attractiveness;
}
