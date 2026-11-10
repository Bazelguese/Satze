// ============================================
// Re della collina: livelli del motore a simulazione
// ============================================
// Tarati al banco di prova (npm run selfplay:koth, 3 giocatori, 90 partite per misura;
// l'agente in esame contro due avversari, quota alla pari 33%):
//   Difficile contro 2 Normali 62% · Normale contro 2 Facili 48% ·
//   Facile contro 2 vecchie IA "Casuale" 46% · nuova Difficile contro 2 vecchie Difficili 96%.
// Nel tutti-contro-tutti i vantaggi si diluiscono: i numeri non sono confrontabili 1:1 con
// l'1v1 e il 2v2, conta che i livelli siano ordinati e distanziati.

export const KOTH_MC_PROFILES = {
  easy: { id: 'easy', rollouts: 400, quality: 0.7, noise: 0.5, maxMs: 3000 },
  medium: { id: 'medium', rollouts: 1500, quality: 0.7, noise: 0.2, maxMs: 5000 },
  hard: { id: 'hard', rollouts: 4000, quality: 0.7, noise: 0, maxMs: 8000 },
};

/** @param {string} difficulty */
export function getKothMcProfile(difficulty) {
  if (difficulty === 'chaos') return KOTH_MC_PROFILES.medium;
  return KOTH_MC_PROFILES[difficulty] || KOTH_MC_PROFILES.medium;
}
