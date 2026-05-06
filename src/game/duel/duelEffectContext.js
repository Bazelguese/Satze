/**
 * Contesto immutabile (riferimenti) passato a `applyDuelPowerEffect` insieme a `state`.
 */
export function createDuelEffectContext({
  checkTrigger,
  playerContext,
  enemyContext,
  pAgent,
  eAgent,
  pArmyBonus,
  eArmyBonus,
  pHasBonus,
  eHasBonus,
  playerToxin,
  enemyToxin,
  playerUsedCards,
  enemyUsedCards,
  playerFieldsConquered,
  enemyFieldsConquered,
}) {
  return {
    checkTrigger,
    playerContext,
    enemyContext,
    pAgent,
    eAgent,
    pArmyBonus,
    eArmyBonus,
    pHasBonus,
    eHasBonus,
    playerToxin,
    enemyToxin,
    playerUsedCards,
    enemyUsedCards,
    playerFieldsConquered,
    enemyFieldsConquered,
  };
}
