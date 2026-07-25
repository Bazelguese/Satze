// ============================================
// Motore decisionale IA (puro, senza React)
// ============================================

export { AI_SCORE_WEIGHTS, createSequenceRng, createConstantRng, defaultRng } from './aiConstants.js';
export { AI_PROFILES, getAIProfile } from './aiProfiles.js';
export { buildAIContext, validateAIContext } from './buildAIContext.js';
export {
  getAvailableCards,
  getLegalFocusRange,
  generateActionsForSide,
  generateAIActions,
  normalizeUsedIdSet,
  getReservedFocus,
} from './generateAIActions.js';
export { simulateAIDuel, projectFieldCounts, resolveTerminalStatus } from './simulateAIDuel.js';
export {
  scoreAIAction,
  scoreSimulationForSide,
  findDominatedActions,
  compareScoredActions,
  estimateFutureCardValue,
  actionDominates,
} from './scoreAIAction.js';
export {
  chooseAIAction,
  chooseWhenAIResponds,
  chooseWhenAILeads,
  lightRankAction,
} from './chooseAIAction.js';
export { chooseAIField, getLegalFieldIndexes } from './chooseAIField.js';
export { isAIDebugEnabled, buildAIDebugPayload, logAIDebug } from './aiDebug.js';
