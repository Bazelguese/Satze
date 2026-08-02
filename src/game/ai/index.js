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
  computeLegalMaxFocus,
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
export {
  simulateAIDuel,
  projectFieldCounts,
  resolveTerminalStatus,
  buildSimulateAIDuelCacheKey,
} from './simulateAIDuel.js';
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
export { chooseAIField } from './chooseAIField.js';
export { getLegalFieldIndexes } from './legalFields.js';
export { chooseJointAIAction } from './chooseJointAIAction.js';
export { buildStrategicState, deriveOpeningPlayerFirst, findCardInState } from './strategicState.js';
export {
  projectPostDuelState,
  resolveNextInitiativeFromWinner,
} from './projectPostDuelState.js';
export { evaluateStrategicState, strategicEvalWeight } from './evaluateStrategicState.js';
export { scoreActionWithStrategicProjection } from './strategicScore.js';
export {
  resolveSearchDepth,
  evaluateActionWithSearch,
  scoreActionsWithSearch,
  chooseBestAiReplyAggregatingFocus,
  scoreAiActionAgainstFocusVariants,
  aggregatePlayerCardScores,
} from './searchGameTree.js';
export { normalizeScenarioProbabilities } from './generateOpponentScenarios.js';
export { publicStateHash } from './publicStateHash.js';
export {
  lightRankField,
  selectCandidateFields,
  playerFieldChoiceWeight,
} from './rankFields.js';
export { isAIDebugEnabled, buildAIDebugPayload, logAIDebug } from './aiDebug.js';
