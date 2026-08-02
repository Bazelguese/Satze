import { checkTrigger, isPostBattleTrigger } from '../triggerLogic.js';

/** Il bonus copiato può applicare effetti in questa fase (pre-duello). */
export function isCopiedBonusTriggerActive(
  enemyBonus,
  context,
  fieldOptions = {},
  checkTriggerFn = checkTrigger
) {
  if (!enemyBonus?.effects?.length) return false;
  if (isPostBattleTrigger(enemyBonus.trigger) && !fieldOptions?.triggersIgnored) return false;
  if (fieldOptions?.triggersIgnored) return true;
  if (!enemyBonus.trigger) return true;
  return checkTriggerFn(enemyBonus.trigger, context);
}

/**
 * Vista potere per UI: Copia Bonus da carta sostituisce il testo del Potere
 * (non il Bonus armata).
 */
export function armyBonusAsCopiedAbilityDisplay(enemyBonus) {
  if (!enemyBonus) return null;
  return {
    trigger: null,
    effect: 'copiedArmyBonus',
    value: null,
    displayText: enemyBonus.description || '—',
    sourceBonus: enemyBonus,
  };
}

/**
 * Registra la copia del bonus armata.
 * @param {'bonus'|'ability'} [options.replaceSlot='bonus']
 *   - `bonus`: sostituisce lo slot Bonus (bonus armata Corte Rossa)
 *   - `ability`: sostituisce lo slot Potere dove compare l'effetto Copia Bonus
 */
export function registerCopiedBonus(
  state,
  target,
  enemyBonus,
  { context, fieldOptions, checkTriggerFn, replaceSlot = 'bonus' } = {}
) {
  const triggerActive =
    context != null
      ? isCopiedBonusTriggerActive(enemyBonus, context, fieldOptions, checkTriggerFn)
      : true;

  if (replaceSlot === 'ability') {
    const display = armyBonusAsCopiedAbilityDisplay(enemyBonus);
    if (target === 'player') {
      state.pAbilityCopied = display;
      state.pCopiedAbilityNotTriggered = !triggerActive;
    } else {
      state.eAbilityCopied = display;
      state.eCopiedAbilityNotTriggered = !triggerActive;
    }
    return;
  }

  if (target === 'player') {
    state.pBonusCopied = enemyBonus;
    state.pCopiedBonusNotTriggered = !triggerActive;
  } else {
    state.eBonusCopied = enemyBonus;
    state.eCopiedBonusNotTriggered = !triggerActive;
  }
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
  if (isPostBattleTrigger(enemyBonus.trigger) && !fieldOptions?.triggersIgnored) return;
  if (!fieldOptions?.triggersIgnored && !checkTriggerFn(enemyBonus.trigger, context)) return;

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
