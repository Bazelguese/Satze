// ============================================
// Livelli del motore a simulazione
// ============================================
//
// Leve: budget di simulazioni (forza, tempo), qualità delle politiche veloci,
// rumore nella scelta finale (errori credibili: sceglie azioni vicine alla migliore).
// Valori tarati con il banco di prova (npm run selfplay:ai): vedi
// Documentazione/PIANO_MIGLIORAMENTO_IA.md.

export const MC_PROFILES = {
  // Scala tarata al banco di prova (100 partite per misura, semi 6000-6049, lati scambiati):
  //                       Classico   Mani nude   obiettivo
  //   Difficile–Normale     70%        76%        70-80%
  //   Normale–Facile        68%        62%        70-80%
  //   Facile–Casuale        85%        79%        ≥80%
  //   Difficile–Casuale     95%
  // Vedi Documentazione/PIANO_MIGLIORAMENTO_IA.md.
  easy: {
    id: 'easy',
    rollouts: 300,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    // Errori credibili: a volte sceglie una mossa vicina alla migliore, non una a caso.
    noise: 0.08,
    /** Tetto di tempo nel gioco (ms). Il worker aggiunge 4 s di margine: totale < 12 s di useAI. */
    maxMs: 2000,
  },
  medium: {
    id: 'medium',
    // La Difficile della prima versione: politica scritta a mano, apertura come gioco
    // simultaneo (strategia mista sui FC).
    rollouts: 6000,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0,
    leadMode: 'matrix',
    matrixCombos: 5,
    matrixRollouts: 16,
    maxMs: 7000,
  },
  hard: {
    id: 'hard',
    rollouts: 6000,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0,
    // Simulazioni con la politica addestrata (learnedPolicyWeights.js). L'apertura simultanea
    // non va combinata con la politica addestrata (misurato: nessun guadagno).
    policy: 'learned',
    maxMs: 7000,
  },
};

/** @param {string} difficulty */
export function getMcProfile(difficulty) {
  if (difficulty === 'chaos') return MC_PROFILES.medium;
  return MC_PROFILES[difficulty] || MC_PROFILES.medium;
}
