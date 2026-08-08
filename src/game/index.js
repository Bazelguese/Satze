// ============================================
// BARREL EXPORT - Logica di Gioco
// ============================================

export * from './triggerLogic';
export * from './fieldLogic';
export * from './toxinLogic';
export { computeDuelResolution } from './duelResolve.js';
export { buildDuelPhaseLogs } from './duelPhaseLogs.js';
export { countConqueredFields, checkImmunity, canTriggerAbility, countAttritionPriorCards, countInitialLeagueCards, resolveUsedCardId } from './duel/duelHelpers.js';
export { applyDuelFieldSetup } from './duel/duelFieldSetup.js';
export { applyDuelPowerEffect } from './duel/duelApplyEffect.js';
export { createApplyBonusEffects } from './duel/duelBonusEffects.js';
export { createDuelCombatState, pickPostBattleFields } from './duel/duelCombatState.js';
export { buildDuelTurnContexts } from './duel/duelTurnContexts.js';
export { createDuelEffectContext } from './duel/duelEffectContext.js';
export { applyDuelBlockPrescan } from './duel/duelBlockPrescan.js';
export { runDuelAssaultCalculation } from './duel/duelAssaultPhase.js';
export { resolveDuelWinnerByAssault } from './duel/duelWinnerResolve.js';
export { computeDuelTriggerUiFlags } from './duel/duelTriggerUiFlags.js';
export { applyDuelMainAbilities } from './duel/duelMainAbilities.js';
export { applyDuelArmyBonusPhases } from './duel/duelArmyBonusPhases.js';
export { applyDuelPostBattleEffects } from './duel/duelPostBattle.js';
export {
  applyDuelNexusMaxDamage,
  applyCentraleOverdriveDamage,
} from './duel/duelDamagePipeline.js';
export { runDuelDamageAftermathAndFcAdjust, buildDuelBattleResult } from './duel/duelResolutionFinish.js';
export { getPerfectFocusSide, isPerfectFocusBet } from './duel/perfectFocusBet.js';
export * from './campaign/index.js';