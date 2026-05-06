// Flag per UI: trigger bonus/poteri soddisfatti e "non attivati" (pre-VA).
export function computeDuelTriggerUiFlags({
  state,
  pAgent,
  eAgent,
  pHasBonus,
  eHasBonus,
  pArmyBonus,
  eArmyBonus,
  playerContext,
  enemyContext,
  triggersIgnored,
  duelCanTriggerAbility,
  checkTrigger,
}) {
  const pBonusTriggerSatisfied = pHasBonus && pArmyBonus && checkTrigger(pArmyBonus.trigger, playerContext);
  const eBonusTriggerSatisfied = eHasBonus && eArmyBonus && checkTrigger(eArmyBonus.trigger, enemyContext);

  let pAbilityNotTriggered = false;
  let eAbilityNotTriggered = false;
  let pBonusNotTriggered = false;
  let eBonusNotTriggered = false;

  const pAbilityTriggerSatisfied =
    !state.pAbilityBlocked && pAgent.ability && duelCanTriggerAbility(pAgent.ability.trigger, playerContext, triggersIgnored);
  const eAbilityTriggerSatisfied =
    !state.eAbilityBlocked && eAgent.ability && duelCanTriggerAbility(eAgent.ability.trigger, enemyContext, triggersIgnored);

  if (
    pAgent.ability &&
    !state.pAbilityBlocked &&
    pAgent.ability.effect !== 'copyAbility' &&
    pAgent.ability.trigger !== 'conquest' &&
    pAgent.ability.trigger !== 'lastWish' &&
    !duelCanTriggerAbility(pAgent.ability.trigger, playerContext, triggersIgnored)
  ) {
    pAbilityNotTriggered = true;
  }
  if (
    eAgent.ability &&
    !state.eAbilityBlocked &&
    eAgent.ability.effect !== 'copyAbility' &&
    eAgent.ability.trigger !== 'conquest' &&
    eAgent.ability.trigger !== 'lastWish' &&
    !duelCanTriggerAbility(eAgent.ability.trigger, enemyContext, triggersIgnored)
  ) {
    eAbilityNotTriggered = true;
  }
  if (
    pHasBonus &&
    pArmyBonus &&
    !state.pBonusBlocked &&
    pArmyBonus.effects[0]?.effect !== 'copyBonus' &&
    pArmyBonus.trigger !== 'conquest' &&
    pArmyBonus.trigger !== 'lastWish' &&
    !checkTrigger(pArmyBonus.trigger, playerContext)
  ) {
    pBonusNotTriggered = true;
  }
  if (
    eHasBonus &&
    eArmyBonus &&
    !state.eBonusBlocked &&
    eArmyBonus.effects[0]?.effect !== 'copyBonus' &&
    eArmyBonus.trigger !== 'conquest' &&
    eArmyBonus.trigger !== 'lastWish' &&
    !checkTrigger(eArmyBonus.trigger, enemyContext)
  ) {
    eBonusNotTriggered = true;
  }

  return {
    pBonusTriggerSatisfied,
    eBonusTriggerSatisfied,
    pAbilityTriggerSatisfied,
    eAbilityTriggerSatisfied,
    pAbilityNotTriggered,
    eAbilityNotTriggered,
    pBonusNotTriggered,
    eBonusNotTriggered,
  };
}
