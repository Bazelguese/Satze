// ============================================
// Pesi della politica addestrata (motore a simulazione)
// ============================================

import { LEARNED_POLICY } from './learnedPolicyWeights.js';
import { MC_FEATURE_NAMES } from './mcFeatures.js';

/**
 * Pesi addestrati, solo se corrispondono alle caratteristiche attuali; altrimenti null
 * (il motore torna alla politica euristica).
 */
export function getLearnedWeights(policy = LEARNED_POLICY) {
  if (!Array.isArray(policy?.weights)) return null;
  const sameFeatures =
    Array.isArray(policy.features) &&
    policy.features.length === MC_FEATURE_NAMES.length &&
    policy.features.every((name, i) => name === MC_FEATURE_NAMES[i]);
  return sameFeatures ? policy.weights : null;
}
