// ============================================
// Profili difficoltà IA (easy / medium / hard)
// ============================================

export const AI_PROFILES = {
  easy: {
    id: 'easy',
    label: 'Facile',

    ownActionLimitWhenFirst: 8,
    opponentResponseLimit: 2,

    worstCaseWeight: 0.15,
    futurePlanningWeight: 0.15,
    focusEfficiencyWeight: 0.45,

    selectionMode: 'top-band-random',
    topBandRatio: 0.4,
    scoreWindow: 1600,

    useDominanceFilter: false,
    useDominanceFilterWhenHiddenFocus: false,
    preferExactMinFocus: false,

    standardFocusBuffer: 0,
    ordinaryFocusBuffer: 0,
    earlyPoolShareCap: 0.3,
    riskWeight: 0.05,
    opponentScenarioCount: 2,
    ownVariantsPerCard: 2,
    allowMaxFocusScenario: false,
    overinvestmentLinearPenalty: 120,
    overinvestmentQuadraticPenalty: 60,

    opponentScenarioWeights: {
      economical: 0.45,
      standard: 0.55,
      pressure: 0,
      high: 0,
    },
  },

  medium: {
    id: 'medium',
    label: 'Normale',

    ownActionLimitWhenFirst: 12,
    opponentResponseLimit: 5,

    worstCaseWeight: 0.2,
    futurePlanningWeight: 0.7,
    focusEfficiencyWeight: 0.85,

    selectionMode: 'weighted-top',
    topCount: 3,
    scoreWindow: 550,

    useDominanceFilter: false,
    useDominanceFilterWhenHiddenFocus: false,
    preferExactMinFocus: true,

    standardFocusBuffer: 1,
    ordinaryFocusBuffer: 2,
    earlyPoolShareCap: 0.4,
    riskWeight: 0.2,
    opponentScenarioCount: 4,
    ownVariantsPerCard: 3,
    allowMaxFocusScenario: false,
    overinvestmentLinearPenalty: 90,
    overinvestmentQuadraticPenalty: 45,

    opponentScenarioWeights: {
      economical: 0.2,
      standard: 0.45,
      pressure: 0.25,
      high: 0.1,
    },
  },

  hard: {
    id: 'hard',
    label: 'Difficile',

    ownActionLimitWhenFirst: 16,
    opponentResponseLimit: 8,

    worstCaseWeight: 0.35,
    futurePlanningWeight: 1,
    focusEfficiencyWeight: 1,

    selectionMode: 'best',
    scoreWindow: 40,

    useDominanceFilter: false,
    useDominanceFilterWhenHiddenFocus: false,
    preferExactMinFocus: true,

    standardFocusBuffer: 2,
    ordinaryFocusBuffer: 3,
    earlyPoolShareCap: 0.5,
    riskWeight: 0.35,
    opponentScenarioCount: 6,
    ownVariantsPerCard: 4,
    allowMaxFocusScenario: true,
    overinvestmentLinearPenalty: 70,
    overinvestmentQuadraticPenalty: 30,

    opponentScenarioWeights: {
      economical: 0.15,
      standard: 0.35,
      pressure: 0.3,
      high: 0.2,
    },
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
