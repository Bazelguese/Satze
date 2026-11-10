// ============================================
// 2v2: livelli del motore a simulazione
// ============================================
//
// Una decisione di squadra copre due posti: budget e tempi sono più alti dell'1v1.
// Valori da tarare al banco di prova (scripts/ai-selfplay-team.mjs).

export const TEAM_MC_PROFILES = {
  easy: { id: 'easy', rollouts: 600, quality: 0.7, noise: 0.08, topPerSeat: 2, maxMs: 3000 },
  medium: { id: 'medium', rollouts: 2000, quality: 0.7, noise: 0.02, topPerSeat: 3, maxMs: 5000 },
  hard: { id: 'hard', rollouts: 5000, quality: 0.7, noise: 0, topPerSeat: 3, maxMs: 8000 },
};

/** @param {string} difficulty */
export function getTeamMcProfile(difficulty) {
  if (difficulty === 'chaos') return TEAM_MC_PROFILES.medium;
  return TEAM_MC_PROFILES[difficulty] || TEAM_MC_PROFILES.medium;
}
