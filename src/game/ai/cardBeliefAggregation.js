// ============================================
// Aggregazione credenze sulle carte avversarie
// ============================================

/**
 * Aggrega i valori per carta avversaria.
 * Difficile: carta peggiore per l'IA;
 * Normale: pesi sulle carte sensate (peggiori per l'IA);
 * Facile: media semplice.
 *
 * @param {{ cardId?: number, score: number }[]} cardScores
 * @param {{ id?: string }} profile
 */
export function aggregatePlayerCardScores(cardScores, profile) {
  if (!cardScores?.length) return -Infinity;

  if (profile?.id === 'hard') {
    return Math.min(...cardScores.map((c) => c.score));
  }

  if (profile?.id === 'easy') {
    return cardScores.reduce((sum, c) => sum + c.score, 0) / cardScores.length;
  }

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
