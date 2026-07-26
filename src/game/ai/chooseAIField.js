// ============================================
// Scelta Campo per l'IA — delega all'azione congiunta
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng } from './aiConstants.js';
import { chooseJointAIAction } from './chooseJointAIAction.js';
import { getLegalFieldIndexes } from './legalFields.js';

export { getLegalFieldIndexes } from './legalFields.js';

/**
 * Restituisce l'indice Campo della decisione congiunta.
 *
 * @param {object} context
 * @param {object|string} [profileOrDifficulty]
 * @param {{ rng?: () => number, jointDecisionOut?: { current: object|null } }} [options]
 * @returns {number|null}
 */
export function chooseAIField(context, profileOrDifficulty, options = {}) {
  const profile =
    typeof profileOrDifficulty === 'string' || profileOrDifficulty == null
      ? getAIProfile(profileOrDifficulty || context.difficulty || 'medium')
      : profileOrDifficulty;

  // Se non ci sono Campi legali, null
  if (!getLegalFieldIndexes(context).length && context.currentFieldIndex == null) {
    return null;
  }

  const joint = chooseJointAIAction(context, profile.id, {
    ...options,
    profile,
    rng: options.rng || defaultRng,
  });

  if (options.jointDecisionOut) {
    options.jointDecisionOut.current = joint;
  }

  return joint?.fieldIndex ?? null;
}
