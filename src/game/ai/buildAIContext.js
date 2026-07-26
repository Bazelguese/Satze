// ============================================
// Wrapper compatibile → information set sanitizzato
// ============================================

import {
  buildAIInformationSet,
  validateAIInformationSet,
  buildPublicDecisionKey,
} from './buildAIInformationSet.js';

/**
 * Costruisce il contesto IA.
 * Alias di buildAIInformationSet: non espone mai selectedFocus.
 *
 * @param {object} gameState
 */
export function buildAIContext(gameState) {
  return buildAIInformationSet(gameState);
}

export function validateAIContext(context, options = {}) {
  return validateAIInformationSet(context, options);
}

export { buildPublicDecisionKey };
