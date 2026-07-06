import {
  applyCopiedBonusEffectsIfReady,
  registerCopiedBonus,
} from './duelCopyBonus.js';
import { canTriggerPreBattle } from './duelHelpers.js';
import { isPostBattleTrigger } from '../triggerLogic.js';

// Factory: applica effetti bonus armata (fasi own / enemy / legacy, copyBonus).
export function createApplyBonusEffects({
  applyEffect,
  fieldOptions,
  checkTrigger,
  copyDisabled,
  state,
  pArmyBonus,
  eArmyBonus,
  pHasBonus,
  eHasBonus,
  visualRecorder = null,
}) {
  return function applyBonusEffects(
    bonus,
    target,
    context,
    source,
    log,
    onlyOwnEffects = false,
    onlyEnemyEffects = false,
    postBattlePhase = false
  ) {
    const triggerSatisfied = postBattlePhase
      ? bonus &&
        isPostBattleTrigger(bonus.trigger) &&
        checkTrigger(bonus.trigger, context)
      : bonus &&
        canTriggerPreBattle(bonus.trigger, context, {
          triggersIgnored: fieldOptions?.triggersIgnored === true,
          resolveTrigger: checkTrigger,
        });
    if (!triggerSatisfied) return;

    if (bonus.effects[0].effect === 'copyBonus') {
      if (onlyOwnEffects) return;
      if (copyDisabled) {
        log.push(`🕳️ Fossa dei Traditori: Copia Bonus annullata`);
        return;
      }
      const enemyBonus = target === 'player' ? eArmyBonus : pArmyBonus;
      const enemyHasBonusActive = target === 'player' ? eHasBonus : pHasBonus;
      if (enemyHasBonusActive && enemyBonus) {
        log.push(`🔮 ${source}: Copia Bonus nemico (${enemyBonus.description})`);
        registerCopiedBonus(state, target, enemyBonus);
        visualRecorder?.pushCopyBonus(target, state);
        applyCopiedBonusEffectsIfReady(
          enemyBonus,
          target,
          context,
          source,
          log,
          applyEffect,
          fieldOptions,
          checkTrigger
        );
      }
      return;
    }

    const applyBonusEffect = (eff) => {
      const isOwnEffect = ['power', 'damage', 'assaultValue', 'focusCoin', 'heal', 'immune', 'powerAndDamage'].includes(
        eff.effect
      );
      const isEnemyEffect = ['enemyPower', 'enemyDamage', 'enemyAssault'].includes(eff.effect);
      const isSpecialEffect = ['toxin'].includes(eff.effect);
      const value =
        bonus.trigger === 'conquest' && fieldOptions?.conquestDouble && eff.value != null
          ? eff.value * 2
          : eff.value;

      const opt = {
        minDamage: eff.minDamage,
        minPower: eff.minPower,
        minAssault: eff.minAssault,
        minHealth: eff.minHealth,
        ...fieldOptions,
      };

      if (onlyOwnEffects && isOwnEffect) {
        applyEffect(eff.effect, value, target, source, log, opt);
      } else if (onlyEnemyEffects && isEnemyEffect) {
        applyEffect(eff.effect, value, target, source, log, opt);
      } else if (isSpecialEffect) {
        applyEffect(eff.effect, value, target, source, log, opt);
      } else if (!onlyOwnEffects && !onlyEnemyEffects) {
        applyEffect(eff.effect, value, target, source, log, opt);
      }
    };

    bonus.effects.forEach(applyBonusEffect);
    if (bonus.trigger === 'lastWish' && fieldOptions?.lastWishDouble) {
      bonus.effects.forEach(applyBonusEffect);
    }
  };
}
