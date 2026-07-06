// Ordine di risoluzione per iniziativa: 1° giocatore del turno → 2° giocatore.

/** @typedef {'player' | 'enemy'} DuelSide */

/**
 * @param {boolean} isPlayerFirst
 * @returns {[DuelSide, DuelSide]}
 */
export function getInitiativeSideOrder(isPlayerFirst) {
  return isPlayerFirst ? ['player', 'enemy'] : ['enemy', 'player'];
}

/**
 * Bundle lato duello per iterazione in ordine di iniziativa.
 * @param {DuelSide} side
 */
export function getDuelSideBundle(
  side,
  {
    pAgent,
    eAgent,
    playerContext,
    enemyContext,
    pHasBonus,
    eHasBonus,
    pArmyBonus,
    eArmyBonus,
  }
) {
  if (side === 'player') {
    return {
      side: 'player',
      agent: pAgent,
      context: playerContext,
      opponentAgent: eAgent,
      labelSelf: 'TU',
      labelOpp: 'IA',
      abilityBlocked: 'pAbilityBlocked',
      bonusBlocked: 'pBonusBlocked',
      opponentAbilityBlocked: 'eAbilityBlocked',
      opponentBonusBlocked: 'eBonusBlocked',
      hasBonus: pHasBonus,
      armyBonus: pArmyBonus,
    };
  }
  return {
    side: 'enemy',
    agent: eAgent,
    context: enemyContext,
    opponentAgent: pAgent,
    labelSelf: 'IA',
    labelOpp: 'TU',
    abilityBlocked: 'eAbilityBlocked',
    bonusBlocked: 'eBonusBlocked',
    opponentAbilityBlocked: 'pAbilityBlocked',
    opponentBonusBlocked: 'pBonusBlocked',
    hasBonus: eHasBonus,
    armyBonus: eArmyBonus,
  };
}
