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
}) {
  return function applyBonusEffects(
    bonus,
    target,
    context,
    source,
    log,
    onlyOwnEffects = false,
    onlyEnemyEffects = false
  ) {
    if (!bonus || !checkTrigger(bonus.trigger, context)) return;

    if (bonus.effects[0].effect === 'copyBonus') {
      if (onlyOwnEffects) return;
      if (copyDisabled) {
        log.push(`🕳️ Fossa dei Traditori: Copia Bonus annullata`);
        return;
      }
      const enemyBonus = target === 'player' ? eArmyBonus : pArmyBonus;
      const enemyHasBonusActive = target === 'player' ? eHasBonus : pHasBonus;
      if (enemyHasBonusActive && enemyBonus) {
        if (!checkTrigger(enemyBonus.trigger, context)) {
          log.push(`🔮 ${source}: Bonus nemico copiato (${enemyBonus.description}) ma trigger non soddisfatto`);
          return;
        }
        log.push(`🔮 ${source}: Copia Bonus nemico (${enemyBonus.description})`);
        if (target === 'player') {
          state.pBonusCopied = enemyBonus;
        } else {
          state.eBonusCopied = enemyBonus;
        }
        enemyBonus.effects.forEach((eff) => {
          applyEffect(eff.effect, eff.value, target, source + ' (copiato)', log, {
            minDamage: eff.minDamage,
            minPower: eff.minPower,
            minAssault: eff.minAssault,
            minHealth: eff.minHealth,
            ...fieldOptions,
          });
        });
      }
      return;
    }

    bonus.effects.forEach((eff) => {
      const isOwnEffect = ['power', 'damage', 'assaultValue', 'focusCoin', 'heal', 'immune', 'powerAndDamage'].includes(
        eff.effect
      );
      const isEnemyEffect = ['enemyPower', 'enemyDamage', 'enemyAssault'].includes(eff.effect);
      const isSpecialEffect = ['toxin'].includes(eff.effect);

      const opt = {
        minDamage: eff.minDamage,
        minPower: eff.minPower,
        minAssault: eff.minAssault,
        minHealth: eff.minHealth,
        ...fieldOptions,
      };

      if (onlyOwnEffects && isOwnEffect) {
        applyEffect(eff.effect, eff.value, target, source, log, opt);
      } else if (onlyEnemyEffects && isEnemyEffect) {
        applyEffect(eff.effect, eff.value, target, source, log, opt);
      } else if (isSpecialEffect) {
        applyEffect(eff.effect, eff.value, target, source, log, opt);
      } else if (!onlyOwnEffects && !onlyEnemyEffects) {
        applyEffect(eff.effect, eff.value, target, source, log, opt);
      }
    });
  };
}
