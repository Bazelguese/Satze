// ============================================
// Helper per computeDuelResolution
// ============================================

import { checkTrigger } from '../triggerLogic.js';

export function countConqueredFields(conqueredFields, playerHand, enemyHand) {
  const playerFieldsConquered = Object.values(conqueredFields || {}).filter(
    (f) =>
      (typeof f === 'object' && f?.winner === 'player') ||
      (typeof f === 'string' && playerHand?.some((c) => c.army === f))
  ).length;
  const enemyFieldsConquered = Object.values(conqueredFields || {}).filter(
    (f) =>
      (typeof f === 'object' && f?.winner === 'enemy') ||
      (typeof f === 'string' && enemyHand?.some((c) => c.army === f))
  ).length;
  return { playerFieldsConquered, enemyFieldsConquered };
}

export function checkImmunity(agent, hasBonus, armyBonus, context) {
  if (hasBonus && armyBonus && armyBonus.effects) {
    const bonusTrigger = armyBonus.trigger;
    const bonusTriggerSatisfied = bonusTrigger ? checkTrigger(bonusTrigger, context) : true;
    if (bonusTriggerSatisfied) {
      for (const eff of armyBonus.effects) {
        if (eff.effect === 'immune') return true;
      }
    }
  }
  if (agent.ability && agent.ability.effect === 'immune') {
    const abilityTrigger = agent.ability.trigger;
    const abilityTriggerSatisfied = abilityTrigger ? checkTrigger(abilityTrigger, context) : true;
    if (abilityTriggerSatisfied) return true;
  }
  return false;
}

export function canTriggerAbility(trigger, ctx, triggersIgnored) {
  return triggersIgnored ? true : checkTrigger(trigger, ctx);
}
