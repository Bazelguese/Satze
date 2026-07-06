// Flag per UI: trigger bonus/poteri soddisfatti e "non attivati" (pre-VA).
import { canTriggerPreBattle } from './duelHelpers.js';
import { isPostBattleTrigger } from '../triggerLogic.js';

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
  const pBonusTriggerSatisfied =
    pHasBonus &&
    pArmyBonus &&
    canTriggerPreBattle(pArmyBonus.trigger, playerContext, { triggersIgnored, resolveTrigger: checkTrigger });
  const eBonusTriggerSatisfied =
    eHasBonus &&
    eArmyBonus &&
    canTriggerPreBattle(eArmyBonus.trigger, enemyContext, { triggersIgnored, resolveTrigger: checkTrigger });

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
    !isPostBattleTrigger(pAgent.ability.trigger) &&
    !canTriggerPreBattle(pAgent.ability.trigger, playerContext, {
      triggersIgnored,
      resolveTrigger: (trigger, ctx) => duelCanTriggerAbility(trigger, ctx, false),
    })
  ) {
    pAbilityNotTriggered = true;
  }
  if (
    eAgent.ability &&
    !state.eAbilityBlocked &&
    eAgent.ability.effect !== 'copyAbility' &&
    !isPostBattleTrigger(eAgent.ability.trigger) &&
    !canTriggerPreBattle(eAgent.ability.trigger, enemyContext, {
      triggersIgnored,
      resolveTrigger: (trigger, ctx) => duelCanTriggerAbility(trigger, ctx, false),
    })
  ) {
    eAbilityNotTriggered = true;
  }
  if (
    pHasBonus &&
    pArmyBonus &&
    !state.pBonusBlocked &&
    pArmyBonus.effects[0]?.effect !== 'copyBonus' &&
    !isPostBattleTrigger(pArmyBonus.trigger) &&
    !canTriggerPreBattle(pArmyBonus.trigger, playerContext, { triggersIgnored, resolveTrigger: checkTrigger })
  ) {
    pBonusNotTriggered = true;
  }
  if (
    eHasBonus &&
    eArmyBonus &&
    !state.eBonusBlocked &&
    eArmyBonus.effects[0]?.effect !== 'copyBonus' &&
    !isPostBattleTrigger(eArmyBonus.trigger) &&
    !canTriggerPreBattle(eArmyBonus.trigger, enemyContext, { triggersIgnored, resolveTrigger: checkTrigger })
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
