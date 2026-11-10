// ============================================
// Livelli del motore a simulazione
// ============================================
//
// Leve: budget di simulazioni (forza, tempo), qualità delle politiche veloci,
// rumore nella scelta finale (errori credibili: sceglie azioni vicine alla migliore).
// Valori tarati con il banco di prova (npm run selfplay:ai): vedi
// Documentazione/PIANO_MIGLIORAMENTO_IA.md.

export const MC_PROFILES = {
  easy: {
    id: 'easy',
    rollouts: 300,
    policyQuality: 0.6,
    opponentQuality: 0.6,
    noise: 0.06,
  },
  medium: {
    id: 'medium',
    rollouts: 1500,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0.02,
  },
  hard: {
    id: 'hard',
    rollouts: 6000,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0,
  },
};

/** @param {string} difficulty */
export function getMcProfile(difficulty) {
  if (difficulty === 'chaos') return MC_PROFILES.medium;
  return MC_PROFILES[difficulty] || MC_PROFILES.medium;
}
