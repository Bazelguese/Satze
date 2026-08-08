// ============================================
// Costanti e pesi del motore decisionale IA
// ============================================

export const AI_SCORE_WEIGHTS = {
  matchWin: 100000,
  matchLoss: -100000,

  claimVictoryThreshold: 15000,
  opponentClaimThreshold: -17000,

  lethalCreated: 20000,
  lethalPrevented: 15000,

  duelWin: 1400,
  duelLoss: -950,

  damageToPlayerPerPoint: 260,
  damageToAiPerPoint: -300,

  healAiPerPoint: 170,
  healPlayerPerPoint: -180,

  aiFocusRemainingPerPoint: 45,
  playerFocusRemainingPerPoint: -35,

  aiFieldGain: 2400,
  playerFieldGain: -2700,

  activeTriggerTiePreference: 40,
  futureTriggerSetup: 120,

  focusSpentPerPoint: -18,
  wastedFocusPerPoint: -160,

  valuableCardConsumed: -100,
};

export const AI_MIN_FOCUS = 1;
export const AI_FIELDS_TO_WIN = 3;
export const AI_SUPREMACY_ROUND = 5;

/** Tie-break solo entro questa finestra di punteggio. */
export const SCORE_TIE_EPSILON = 5;

/** Moltiplicatori penalità sovrainvestimento per round. */
export const OVERINVESTMENT_ROUND_MULTIPLIER = {
  1: 1.55,
  2: 1.5,
  3: 1.1,
  4: 0.7,
  5: 0.35,
};

export const INFORMATION_POLICY = 'hidden-player-focus';

/** RNG di default (solo adapter / runtime). Nei test iniettare un RNG deterministico. */
export function defaultRng() {
  return Math.random();
}

/**
 * RNG a sequenza ciclica per test deterministici.
 * @param {number[]} values
 */
export function createSequenceRng(values) {
  const list = Array.isArray(values) && values.length > 0 ? values : [0];
  let index = 0;
  return () => {
    const value = list[index % list.length];
    index += 1;
    return value;
  };
}

/**
 * RNG costante.
 * @param {number} value
 */
export function createConstantRng(value = 0) {
  return () => value;
}
