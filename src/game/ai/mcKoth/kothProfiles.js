// ============================================
// Re della collina: livelli del motore a simulazione
// ============================================
// Da tarare al banco di prova (npm run selfplay:koth).

export const KOTH_MC_PROFILES = {
  easy: { id: 'easy', rollouts: 400, quality: 0.7, noise: 0.3, maxMs: 3000 },
  medium: { id: 'medium', rollouts: 1500, quality: 0.7, noise: 0.08, maxMs: 5000 },
  hard: { id: 'hard', rollouts: 4000, quality: 0.7, noise: 0, maxMs: 8000 },
};

/** @param {string} difficulty */
export function getKothMcProfile(difficulty) {
  if (difficulty === 'chaos') return KOTH_MC_PROFILES.medium;
  return KOTH_MC_PROFILES[difficulty] || KOTH_MC_PROFILES.medium;
}
