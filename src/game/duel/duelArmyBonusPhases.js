// Fase 1: bonus sulle proprie stat; fase 2: sulle stat nemiche.
export function applyDuelArmyBonusPhases({
  state,
  pHasBonus,
  eHasBonus,
  pArmyBonus,
  eArmyBonus,
  pAgent,
  eAgent,
  playerContext,
  enemyContext,
  battleLog,
  applyBonusEffects,
  checkTrigger,
}) {
  if (pHasBonus && !state.pBonusBlocked) {
    const bonusTriggered = pArmyBonus && checkTrigger(pArmyBonus.trigger, playerContext);
    if (bonusTriggered) {
      applyBonusEffects(pArmyBonus, 'player', playerContext, `Bonus ${pAgent.army}`, battleLog, true, false);
    }
  }
  if (eHasBonus && !state.eBonusBlocked) {
    const bonusTriggered = eArmyBonus && checkTrigger(eArmyBonus.trigger, enemyContext);
    if (bonusTriggered) {
      applyBonusEffects(eArmyBonus, 'enemy', enemyContext, `Bonus ${eAgent.army}`, battleLog, true, false);
    }
  }

  if (pHasBonus && !state.pBonusBlocked && pArmyBonus && checkTrigger(pArmyBonus.trigger, playerContext)) {
    applyBonusEffects(pArmyBonus, 'player', playerContext, `Bonus ${pAgent.army}`, battleLog, false, true);
  }
  if (eHasBonus && !state.eBonusBlocked && eArmyBonus && checkTrigger(eArmyBonus.trigger, enemyContext)) {
    applyBonusEffects(eArmyBonus, 'enemy', enemyContext, `Bonus ${eAgent.army}`, battleLog, false, true);
  }
}
