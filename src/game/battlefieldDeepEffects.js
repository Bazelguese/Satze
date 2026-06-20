// Effetti campo "deep" (61, 68, 70, 74, 79) — logica condivisa duello

/** Bonus sintetico su Cattedrale del Decadimento (id 70). */
export const CATTEDRALE_DECADIMENTO_BONUS = {
  trigger: 'conquest',
  effects: [{ effect: 'toxin', value: 2, minHealth: 10 }],
  description: 'Conquista: Tossina 2 (min 10)',
};

/**
 * Sostituisce i bonus armata su campo 70; altrimenti pass-through.
 */
export function resolveFieldArmyBonuses(field, pHasBonus, eHasBonus, pArmyBonus, eArmyBonus) {
  if (field?.id !== 70) {
    return { pArmyBonus, eArmyBonus, pHasBonus, eHasBonus };
  }
  return {
    pArmyBonus: pHasBonus ? CATTEDRALE_DECADIMENTO_BONUS : pArmyBonus,
    eArmyBonus: eHasBonus ? CATTEDRALE_DECADIMENTO_BONUS : eArmyBonus,
    pHasBonus,
    eHasBonus,
  };
}

/**
 * Wrapper per check trigger Potere: Il Circuito (74) sostituisce il trigger carta.
 */
export function createDuelCanTriggerAbility(checkTrigger, field) {
  return (trigger, ctx, triggersIgnored) => {
    if (triggersIgnored) return true;
    const mods = ctx?.fieldModifiers || {};
    if (field?.id === 74 && mods.circuitAbilityTriggers && trigger) {
      const circuitTrigger = ctx.isFirst ? 'sfida' : 'sopraffare';
      return checkTrigger(circuitTrigger, ctx);
    }
    return checkTrigger(trigger, ctx);
  };
}

/** Moltiplicatore valore per effetti Conquista (Trono d'Ossidiana, id 61). */
export function scaleConquestEffectValue(value, fieldOptions) {
  if (value == null || !fieldOptions?.conquestDouble) return value;
  return value * 2;
}

/** Camera Rituale (79): Overdrive attivo → +1 POT e +1 DAN prima del VA. */
export function applyFieldOverdriveBonuses(field, state, overdriveThreshold, battleLog) {
  if (field?.id !== 79) return;
  const threshold = overdriveThreshold ?? 5;
  if (state.pFocusUsed >= threshold) {
    state.pPower += 1;
    state.pDamage += 1;
    battleLog.push(
      `🔮 Camera Rituale: TU Overdrive attivo! +1 POT, +1 DAN → ${state.pPower}P/${state.pDamage}D`
    );
  }
  if (state.eFocusUsed >= threshold) {
    state.ePower += 1;
    state.eDamage += 1;
    battleLog.push(
      `🔮 Camera Rituale: IA Overdrive attivo! +1 POT, +1 DAN → ${state.ePower}P/${state.eDamage}D`
    );
  }
}
