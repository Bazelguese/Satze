// ============================================
// COSTANTI - Difficoltà IA
// ============================================

/**
 * Configurazioni delle difficoltà dell'IA
 */
export const AI_DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Senza occhi',
    description: 'Facile',
    icon: '😴',
    color: '#10b981', // green-500
    longDescription: 'L\'IA gioca in modo semplice e prevedibile, ideale per imparare.',
    // Strategia selezione agente
    agentStrategy: 'random', // random, best, worst, balanced
    // Strategia focus coin
    focusMultiplier: 0.8, // base * multiplier
    focusVariance: 1, // 0 o +1
  },
  medium: {
    id: 'medium',
    name: 'Mezzo ubriaco',
    description: 'Medio',
    icon: '🍺',
    color: '#f59e0b', // amber-500
    longDescription: 'L\'IA ha una strategia bilanciata con qualche errore occasionale.',
    agentStrategy: 'balanced', // top 3 con randomicità
    focusMultiplier: 1.2,
    focusVariance: 2, // -1, 0, o +1
  },
  hard: {
    id: 'hard',
    name: 'Sfavorito',
    description: 'Difficile',
    icon: '🔥',
    color: '#ef4444', // red-500
    longDescription: 'L\'IA gioca in modo aggressivo e ottimizzato, una sfida seria.',
    agentStrategy: 'best', // sempre la migliore carta
    focusMultiplier: 1.5,
    focusVariance: 1, // 0 o +1
  },
  chaos: {
    id: 'chaos',
    name: 'Il folle',
    description: 'Stile bizzarro',
    icon: '🎭',
    color: '#a855f7', // purple-500
    longDescription: 'L\'IA usa strategie imprevedibili e inaspettate, puro caos!',
    agentStrategy: 'chaos', // completamente imprevedibile
    focusMultiplier: null, // usa strategia speciale
    focusVariance: null,
  },
};

/**
 * Difficoltà di default
 */
export const DEFAULT_AI_DIFFICULTY = 'medium';

/**
 * Ottiene la configurazione di una difficoltà
 * @param {string} difficultyId - ID della difficoltà
 * @returns {Object} Configurazione della difficoltà
 */
export const getDifficultyConfig = (difficultyId) => {
  return AI_DIFFICULTIES[difficultyId] || AI_DIFFICULTIES[DEFAULT_AI_DIFFICULTY];
};

/**
 * Ottiene tutte le difficoltà come array
 * @returns {Array} Array di configurazioni difficoltà
 */
export const getAllDifficulties = () => {
  return Object.values(AI_DIFFICULTIES);
};

/**
 * Nomi delle difficoltà per i log
 */
export const DIFFICULTY_NAMES = {
  easy: 'Senza occhi (Facile)',
  medium: 'Mezzo ubriaco (Medio)',
  hard: 'Sfavorito (Difficile)',
  chaos: 'Il folle (Stile bizzarro)',
};
