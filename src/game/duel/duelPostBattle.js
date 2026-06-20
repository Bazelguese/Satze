// Ultimo desiderio / Conquista: poteri e bonus post-esito VA.
import { isPostBattleTrigger } from '../triggerLogic.js';
import { scaleConquestEffectValue } from '../battlefieldDeepEffects.js';

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
  state,
}) {
  let pPostAbilityTriggered = false;
  let ePostAbilityTriggered = false;
  let pPostBonusTriggered = false;
  let ePostBonusTriggered = false;

  const applyPostAbility = (agent, target, source, contextPost) => {
    const opts = {
      minDamage: agent.ability.minDamage,
      minPower: agent.ability.minPower,
      minAssault: agent.ability.minAssault,
      minHealth: agent.ability.minHealth,
      ...fieldOptions,
    };
    const value =
      agent.ability.trigger === 'conquest'
        ? scaleConquestEffectValue(agent.ability.value, fieldOptions)
        : agent.ability.value;
    applyEffect(agent.ability.effect, value, target, source, battleLog, opts);
    if (agent.ability.trigger === 'lastWish' && fieldOptions?.lastWishDouble) {
      applyEffect(agent.ability.effect, value, target, `${source} (2×)`, battleLog, opts);
    }
  };

  if (
    !pAbilityBlocked &&
    pAgent.ability &&
    checkTrigger(pAgent.ability.trigger, playerContextPost) &&
    (pAgent.ability.trigger === 'lastWish' || pAgent.ability.trigger === 'conquest')
  ) {
    pPostAbilityTriggered = true;
    applyPostAbility(pAgent, 'player', 'Tuo Potere (post)', playerContextPost);
  }
  if (
    !eAbilityBlocked &&
    eAgent.ability &&
    checkTrigger(eAgent.ability.trigger, enemyContextPost) &&
    (eAgent.ability.trigger === 'lastWish' || eAgent.ability.trigger === 'conquest')
  ) {
    ePostAbilityTriggered = true;
    applyPostAbility(eAgent, 'enemy', 'Potere IA (post)', enemyContextPost);
  }

  if (
    pHasBonus &&
    !pBonusBlocked &&
    pArmyBonus &&
    isPostBattleTrigger(pArmyBonus.trigger)
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
    isPostBattleTrigger(eArmyBonus.trigger)
  ) {
    if (checkTrigger(eArmyBonus.trigger, enemyContextPost)) {
      ePostBonusTriggered = true;
      applyBonusEffects(eArmyBonus, 'enemy', enemyContextPost, `Bonus ${eAgent.army} (post)`, battleLog);
    }
  }

  const resolveCopiedPostBonus = (copiedBonus, target, contextPost, label) => {
    if (!copiedBonus || !isPostBattleTrigger(copiedBonus.trigger)) return false;
    if (!checkTrigger(copiedBonus.trigger, contextPost)) return false;
    applyBonusEffects(copiedBonus, target, contextPost, label, battleLog);
    return true;
  };

  if (!pBonusBlocked && state?.pBonusCopied) {
    if (
      resolveCopiedPostBonus(
        state.pBonusCopied,
        'player',
        playerContextPost,
        `Bonus copiato ${pAgent.army} (post)`
      )
    ) {
      pPostBonusTriggered = true;
    }
  }
  if (!eBonusBlocked && state?.eBonusCopied) {
    if (
      resolveCopiedPostBonus(
        state.eBonusCopied,
        'enemy',
        enemyContextPost,
        `Bonus copiato ${eAgent.army} (post)`
      )
    ) {
      ePostBonusTriggered = true;
    }
  }

  return {
    pPostAbilityTriggered,
    ePostAbilityTriggered,
    pPostBonusTriggered,
    ePostBonusTriggered,
  };
}
