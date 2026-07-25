// ============================================
// Profili difficoltà IA (easy / medium / hard)
// ============================================

export const AI_PROFILES = {
  easy: {
    id: 'easy',
    label: 'Facile',

    ownActionLimitWhenFirst: 6,
    opponentResponseLimit: 1,

    worstCaseWeight: 0.15,
    futurePlanningWeight: 0.15,
    focusEfficiencyWeight: 0.45,

    selectionMode: 'top-band-random',
    topBandRatio: 0.4,
    scoreWindow: 1600,

    useDominanceFilter: false,
    preferExactMinFocus: false,
  },

  medium: {
    id: 'medium',
    label: 'Normale',

    ownActionLimitWhenFirst: 10,
    opponentResponseLimit: 5,

    worstCaseWeight: 0.55,
    futurePlanningWeight: 0.7,
    focusEfficiencyWeight: 0.85,

    selectionMode: 'weighted-top',
    topCount: 3,
    scoreWindow: 550,

    useDominanceFilter: true,
    preferExactMinFocus: true,
  },

  hard: {
    id: 'hard',
    label: 'Difficile',

    ownActionLimitWhenFirst: 18,
    opponentResponseLimit: Infinity,

    worstCaseWeight: 0.85,
    futurePlanningWeight: 1,
    focusEfficiencyWeight: 1,

    selectionMode: 'best',
    scoreWindow: 40,

    useDominanceFilter: true,
    preferExactMinFocus: true,
  },
};

/**
 * @param {string} difficulty
 * @returns {typeof AI_PROFILES.medium}
 */
export function getAIProfile(difficulty) {
  if (difficulty === 'chaos') return AI_PROFILES.medium;
  return AI_PROFILES[difficulty] || AI_PROFILES.medium;
}
