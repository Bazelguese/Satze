import { checkTrigger, isPostBattleTrigger } from '../triggerLogic.js';

/** Registra la sostituzione del bonus armata (Copia Bonus). */
export function registerCopiedBonus(state, target, enemyBonus) {
  if (target === 'player') state.pBonusCopied = enemyBonus;
  else state.eBonusCopied = enemyBonus;
}

/**
 * Applica gli effetti del bonus sostituito se il trigger è risolvibile in questa fase.
 * I trigger post-duello (Conquista, Ultimo Desiderio) vanno risolti in applyDuelPostBattleEffects.
 */
export function applyCopiedBonusEffectsIfReady(
  enemyBonus,
  target,
  context,
  source,
  log,
  applyEffect,
  fieldOptions,
  checkTriggerFn = checkTrigger
) {
  if (!enemyBonus?.effects?.length) return;
  if (isPostBattleTrigger(enemyBonus.trigger)) return;
  if (!checkTriggerFn(enemyBonus.trigger, context)) return;

  enemyBonus.effects.forEach((eff) => {
    if (eff.effect === 'copyBonus') return;
    applyEffect(eff.effect, eff.value, target, `${source} (copiato)`, log, {
      minDamage: eff.minDamage,
      minPower: eff.minPower,
      minAssault: eff.minAssault,
      minHealth: eff.minHealth,
      ...fieldOptions,
    });
  });
}
