// Ultimo desiderio / Conquista: poteri e bonus post-esito VA.
export function applyDuelPostBattleEffects({
  pAbilityBlocked,
  eAbilityBlocked,
  pBonusBlocked,
  eBonusBlocked,
  pHasBonus,
  eHasBonus,
  pArmyBonus,
  eArmyBonus,
  pAgent,
  eAgent,
  applyEffect,
  applyBonusEffects,
  checkTrigger,
  fieldOptions,
  playerContextPost,
  enemyContextPost,
  battleLog,
}) {
  let pPostAbilityTriggered = false;
  let ePostAbilityTriggered = false;
  let pPostBonusTriggered = false;
  let ePostBonusTriggered = false;

  if (
    !pAbilityBlocked &&
    pAgent.ability &&
    checkTrigger(pAgent.ability.trigger, playerContextPost) &&
    (pAgent.ability.trigger === 'lastWish' || pAgent.ability.trigger === 'conquest')
  ) {
    pPostAbilityTriggered = true;
    applyEffect(pAgent.ability.effect, pAgent.ability.value, 'player', 'Tuo Potere (post)', battleLog, {
      minDamage: pAgent.ability.minDamage,
      minPower: pAgent.ability.minPower,
      minAssault: pAgent.ability.minAssault,
      minHealth: pAgent.ability.minHealth,
      ...fieldOptions,
    });
  }
  if (
    !eAbilityBlocked &&
    eAgent.ability &&
    checkTrigger(eAgent.ability.trigger, enemyContextPost) &&
    (eAgent.ability.trigger === 'lastWish' || eAgent.ability.trigger === 'conquest')
  ) {
    ePostAbilityTriggered = true;
    applyEffect(eAgent.ability.effect, eAgent.ability.value, 'enemy', 'Potere IA (post)', battleLog, {
      minDamage: eAgent.ability.minDamage,
      minPower: eAgent.ability.minPower,
      minAssault: eAgent.ability.minAssault,
      minHealth: eAgent.ability.minHealth,
      ...fieldOptions,
    });
  }

  if (
    pHasBonus &&
    !pBonusBlocked &&
    pArmyBonus &&
    (pArmyBonus.trigger === 'lastWish' || pArmyBonus.trigger === 'conquest')
  ) {
    if (checkTrigger(pArmyBonus.trigger, playerContextPost)) {
      pPostBonusTriggered = true;
      applyBonusEffects(pArmyBonus, 'player', playerContextPost, `Bonus ${pAgent.army} (post)`, battleLog);
    }
  }
  if (
    eHasBonus &&
    !eBonusBlocked &&
    eArmyBonus &&
    (eArmyBonus.trigger === 'lastWish' || eArmyBonus.trigger === 'conquest')
  ) {
    if (checkTrigger(eArmyBonus.trigger, enemyContextPost)) {
      ePostBonusTriggered = true;
      applyBonusEffects(eArmyBonus, 'enemy', enemyContextPost, `Bonus ${eAgent.army} (post)`, battleLog);
    }
  }

  return {
    pPostAbilityTriggered,
    ePostAbilityTriggered,
    pPostBonusTriggered,
    ePostBonusTriggered,
  };
}
