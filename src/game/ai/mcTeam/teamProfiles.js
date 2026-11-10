// ============================================
// 2v2: livelli del motore a simulazione
// ============================================
//
// Una decisione di squadra copre due posti: budget e tempi sono più alti dell'1v1.
// Tarati al banco di prova (npm run selfplay:team, 100 partite per misura, Classico):
//   Difficile–Normale 69,5% · Normale–Facile 62,5% · Facile–vecchia IA "Casuale" 73%.
// Tutti i livelli battono la vecchia IA Difficile del 2v2 (96-99% prima della taratura).
// Leve: noise (scelta finale fra le combinazioni), seatNoise (scelta dei candidati di ogni
// posto), rollouts.

export const TEAM_MC_PROFILES = {
  easy: { id: 'easy', rollouts: 400, quality: 0.7, noise: 0.5, seatNoise: 0.2, topPerSeat: 3, maxMs: 3000 },
  medium: { id: 'medium', rollouts: 2000, quality: 0.7, noise: 0.3, seatNoise: 0.04, topPerSeat: 3, maxMs: 5000 },
  hard: { id: 'hard', rollouts: 5000, quality: 0.7, noise: 0, topPerSeat: 3, maxMs: 8000 },
};

/** @param {string} difficulty */
export function getTeamMcProfile(difficulty) {
  if (difficulty === 'chaos') return TEAM_MC_PROFILES.medium;
  return TEAM_MC_PROFILES[difficulty] || TEAM_MC_PROFILES.medium;
}
