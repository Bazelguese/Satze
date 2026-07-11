// Ultimo desiderio / Conquista: poteri e bonus post-esito VA.
import { isPostBattleTrigger } from '../triggerLogic.js';
import { scaleConquestEffectValue } from '../battlefieldDeepEffects.js';
import { getInitiativeSideOrder, getDuelSideBundle } from './duelInitiativeOrder.js';

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
  triggersIgnored = false,
  playerContextPost,
  enemyContextPost,
  battleLog,
  state,
  isPlayerFirst = true,
  visualRecorder = null,
}) {
  if (triggersIgnored) {
    return {
      pPostAbilityTriggered: false,
      ePostAbilityTriggered: false,
      pPostBonusTriggered: false,
      ePostBonusTriggered: false,
    };
  }

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

  const sides = getInitiativeSideOrder(isPlayerFirst);
  const bundleArgs = {
    pAgent,
    eAgent,
    playerContext: playerContextPost,
    enemyContext: enemyContextPost,
    pHasBonus,
    eHasBonus,
    pArmyBonus,
    eArmyBonus,
  };

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const agent = side.agent;
    const contextPost = sideKey === 'player' ? playerContextPost : enemyContextPost;
    const abilityBlocked = sideKey === 'player' ? pAbilityBlocked : eAbilityBlocked;

    if (
      !abilityBlocked &&
      agent?.ability &&
      checkTrigger(agent.ability.trigger, contextPost) &&
      (agent.ability.trigger === 'lastWish' || agent.ability.trigger === 'conquest')
    ) {
      if (sideKey === 'player') pPostAbilityTriggered = true;
      else ePostAbilityTriggered = true;
      applyPostAbility(
        agent,
        sideKey,
        sideKey === 'player' ? 'Tuo Potere (post)' : 'Potere IA (post)',
        contextPost
      );
      visualRecorder?.pushPostPower(sideKey, state);
    }
  }

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const contextPost = sideKey === 'player' ? playerContextPost : enemyContextPost;
    const bonusBlocked = sideKey === 'player' ? pBonusBlocked : eBonusBlocked;

    if (
      side.hasBonus &&
      !bonusBlocked &&
      side.armyBonus &&
      isPostBattleTrigger(side.armyBonus.trigger) &&
      checkTrigger(side.armyBonus.trigger, contextPost)
    ) {
      if (sideKey === 'player') pPostBonusTriggered = true;
      else ePostBonusTriggered = true;
      applyBonusEffects(
        side.armyBonus,
        sideKey,
        contextPost,
        `Bonus ${side.agent.army} (post)`,
        battleLog,
        false,
        false,
        true
      );
      visualRecorder?.pushPostBonus(sideKey, state);
    }
  }

  const resolveCopiedPostBonus = (copiedBonus, target, contextPost, label) => {
    if (!copiedBonus || !isPostBattleTrigger(copiedBonus.trigger)) return false;
    if (!checkTrigger(copiedBonus.trigger, contextPost)) return false;
    applyBonusEffects(copiedBonus, target, contextPost, label, battleLog, false, false, true);
    return true;
  };

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const contextPost = sideKey === 'player' ? playerContextPost : enemyContextPost;
    const bonusBlocked = sideKey === 'player' ? pBonusBlocked : eBonusBlocked;
    const copiedKey = sideKey === 'player' ? 'pBonusCopied' : 'eBonusCopied';

    if (bonusBlocked || !state?.[copiedKey]) continue;

    if (
      resolveCopiedPostBonus(
        state[copiedKey],
        sideKey,
        contextPost,
        `Bonus copiato ${side.agent.army} (post)`
      )
    ) {
      if (sideKey === 'player') {
        pPostBonusTriggered = true;
        state.pCopiedBonusNotTriggered = false;
      } else {
        ePostBonusTriggered = true;
        state.eCopiedBonusNotTriggered = false;
      }
      visualRecorder?.pushPostBonus(sideKey, state);
    }
  }

  return {
    pPostAbilityTriggered,
    ePostAbilityTriggered,
    pPostBonusTriggered,
    ePostBonusTriggered,
  };
}
