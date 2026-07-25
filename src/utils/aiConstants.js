// ============================================
// COSTANTI - Difficoltà IA (UI / selezione)
// ============================================

/**
 * Configurazioni delle difficoltà dell'IA giocabili.
 * La strategia tattica vive in src/game/ai/aiProfiles.js.
 */
export const AI_DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Senza occhi',
    description: 'Facile',
    icon: 'eye',
    color: '#10b981',
    longDescription: 'Gioca correttamente, ma pianifica poco e commette errori tattici.',
  },
  medium: {
    id: 'medium',
    name: 'Mezzo ubriaco',
    description: 'Normale',
    icon: 'dice',
    color: '#f59e0b',
    longDescription: 'Valuta trigger, Campi e risorse con una strategia equilibrata.',
  },
  hard: {
    id: 'hard',
    name: 'Sfavorito',
    description: 'Difficile',
    icon: 'flame',
    color: '#ef4444',
    longDescription: 'Analizza le risposte visibili, conserva risorse e punisce gli errori.',
  },
};

/**
 * Difficoltà di default
 */
export const DEFAULT_AI_DIFFICULTY = 'medium';

/**
 * Ottiene la configurazione di una difficoltà.
 * `chaos` (salvataggi / campagna legacy) ricade su medium.
 * @param {string} difficultyId
 * @returns {Object}
 */
export const getDifficultyConfig = (difficultyId) => {
  if (difficultyId === 'chaos') {
    return AI_DIFFICULTIES.medium;
  }
  return AI_DIFFICULTIES[difficultyId] || AI_DIFFICULTIES[DEFAULT_AI_DIFFICULTY];
};

/**
 * Difficoltà giocabili in UI (senza chaos).
 * @returns {Array}
 */
export const getAllDifficulties = () => {
  return Object.values(AI_DIFFICULTIES);
};

/**
 * Nomi delle difficoltà per i log
 */
export const DIFFICULTY_NAMES = {
  easy: 'Senza occhi (Facile)',
  medium: 'Mezzo ubriaco (Normale)',
  hard: 'Sfavorito (Difficile)',
  chaos: 'Mezzo ubriaco (Normale)',
};
