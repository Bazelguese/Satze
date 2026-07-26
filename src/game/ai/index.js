// ============================================
// Motore decisionale IA (puro, senza React)
// ============================================

export {
  AI_SCORE_WEIGHTS,
  SCORE_TIE_EPSILON,
  INFORMATION_POLICY,
  createSequenceRng,
  createConstantRng,
  defaultRng,
} from './aiConstants.js';
export { AI_PROFILES, getAIProfile } from './aiProfiles.js';
export {
  buildAIInformationSet,
  validateAIInformationSet,
  buildPublicDecisionKey,
} from './buildAIInformationSet.js';
export { buildAIContext, validateAIContext } from './buildAIContext.js';
export {
  getAvailableCards,
  getLegalFocusRange,
  generateActionsForSide,
  generateStrategicFocusCandidates,
  generateStrategicActionsForSide,
  generateAIActions,
  normalizeUsedIdSet,
  getReservedFocus,
} from './generateAIActions.js';
export {
  estimateStandardFocus,
  getFairShare,
  getOrdinaryFocusCap,
  getFocusCapException,
  computeOverinvestmentPenalty,
} from './focusBudget.js';
export {
  generateOpponentScenarios,
  generateOpponentFocusValues,
} from './generateOpponentScenarios.js';
export { simulateAIDuel, projectFieldCounts, resolveTerminalStatus } from './simulateAIDuel.js';
export {
  scoreAIAction,
  scoreSimulationForSide,
  aggregateScenarioScores,
  findDominatedActions,
  compareScoredActions,
  estimateFutureCardValue,
  actionDominates,
} from './scoreAIAction.js';
export {
  chooseAIAction,
  chooseAIIndependentAction,
  chooseWhenAIResponds,
  chooseWhenAILeads,
} from './chooseAIAction.js';
export { lightRankAction, buildBalancedShortlist } from './aiPruning.js';
export { chooseAIField, getLegalFieldIndexes } from './chooseAIField.js';
export { isAIDebugEnabled, buildAIDebugPayload, logAIDebug } from './aiDebug.js';
