// ============================================
// Livelli del motore a simulazione
// ============================================
//
// Leve: budget di simulazioni (forza, tempo), qualità delle politiche veloci,
// rumore nella scelta finale (errori credibili: sceglie azioni vicine alla migliore).
// Valori tarati con il banco di prova (npm run selfplay:ai): vedi
// Documentazione/PIANO_MIGLIORAMENTO_IA.md.

export const MC_PROFILES = {
  // Scala provvisoria (Classico, 100 partite per misura): una sola IA, la forza scende con il
  // rumore. Difficile ~92% contro Casuale; il rumore alto riduce la forza più del budget.
  easy: {
    id: 'easy',
    rollouts: 300,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0.2,
    /** Tetto di tempo nel gioco (ms). Il worker aggiunge 4 s di margine: totale < 12 s di useAI. */
    maxMs: 2000,
  },
  medium: {
    id: 'medium',
    rollouts: 1500,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0.06,
    maxMs: 4000,
  },
  hard: {
    id: 'hard',
    rollouts: 6000,
    policyQuality: 0.7,
    opponentQuality: 0.7,
    noise: 0,
    // Con l'iniziativa: FC come gioco simultaneo (strategia mista), meno prevedibile.
    leadMode: 'matrix',
    matrixCombos: 5,
    matrixRollouts: 16,
    maxMs: 7000,
  },
};

/** @param {string} difficulty */
export function getMcProfile(difficulty) {
  if (difficulty === 'chaos') return MC_PROFILES.medium;
  return MC_PROFILES[difficulty] || MC_PROFILES.medium;
}
