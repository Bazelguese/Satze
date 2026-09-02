// Effetti campo "deep" (61, 68, 70, 74, 79, 86, 89, 92, 99) — logica condivisa duello

/** Bonus sintetico su Cattedrale del Decadimento (id 70). */
export const CATTEDRALE_DECADIMENTO_BONUS = {
  trigger: 'conquest',
  effects: [{ effect: 'toxin', value: 2, minHealth: 10 }],
  description: 'Conquista: Tossina 2 (min 10)',
};

/** Bonus sostitutivo su Meridiano del Sole Verde (id 89). */
export const MERIDIANO_SOLE_VERDE_BONUS = {
  trigger: 'invasione',
  effects: [
    { effect: 'power', value: 2 },
    { effect: 'damage', value: 1 },
  ],
  description: 'Invasione: +2 POT, +1 DAN',
};

/**
 * Sostituisce / scambia i bonus armata su campi 70 / 89 / 120; altrimenti pass-through.
 */
export function resolveFieldArmyBonuses(field, pHasBonus, eHasBonus, pArmyBonus, eArmyBonus) {
  if (field?.id === 70) {
    return {
      pArmyBonus: pHasBonus ? CATTEDRALE_DECADIMENTO_BONUS : pArmyBonus,
      eArmyBonus: eHasBonus ? CATTEDRALE_DECADIMENTO_BONUS : eArmyBonus,
      pHasBonus,
      eHasBonus,
    };
  }
  if (field?.id === 89) {
    return {
      pArmyBonus: pHasBonus ? MERIDIANO_SOLE_VERDE_BONUS : pArmyBonus,
      eArmyBonus: eHasBonus ? MERIDIANO_SOLE_VERDE_BONUS : eArmyBonus,
      pHasBonus,
      eHasBonus,
    };
  }
  // Galleria Bellacqua (120): ciascun Agente con Bonus attivo usa il Bonus dell'altro
  if (field?.id === 120) {
    return {
      pArmyBonus: eArmyBonus,
      eArmyBonus: pArmyBonus,
      pHasBonus,
      eHasBonus,
    };
  }
  return { pArmyBonus, eArmyBonus, pHasBonus, eHasBonus };
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
export function applyFieldOverdriveBonuses(field, state, overdriveThreshold, battleLog, fieldStatDeltas = null) {
  if (field?.id === 114) return; // Grande Arena: Overdrive disattivato
  if (field?.id !== 79) return;
  const threshold = overdriveThreshold ?? 5;
  if (state.pFocusUsed >= threshold) {
    state.pPower += 1;
    state.pDamage += 1;
    if (fieldStatDeltas) {
      fieldStatDeltas.player.power += 1;
      fieldStatDeltas.player.damage += 1;
    }
    battleLog.push(
      `🔮 Camera Rituale: TU Overdrive attivo! +1 POT, +1 DAN → ${state.pPower}P/${state.pDamage}D`
    );
  }
  if (state.eFocusUsed >= threshold) {
    state.ePower += 1;
    state.eDamage += 1;
    if (fieldStatDeltas) {
      fieldStatDeltas.enemy.power += 1;
      fieldStatDeltas.enemy.damage += 1;
    }
    battleLog.push(
      `🔮 Camera Rituale: IA Overdrive attivo! +1 POT, +1 DAN → ${state.ePower}P/${state.eDamage}D`
    );
  }
}

/**
 * Effetti campo che dipendono da POT/DAN finali o che chiudono il pre-VA:
 * 92 (DAN più alta → −4 VA), 99 (±2 da base), 86 (×2 mod VA).
 */
export function applyDuelFieldLateEffects(field, state, pAgent, eAgent, battleLog, fieldStatDeltas = null) {
  const id = field?.id ?? 0;
  const fn = field?.name || 'Campo';

  if (id === 92) {
    if (state.pDamage > state.eDamage && !state.pImmune) {
      state.pAssaultMod -= 4;
      if (fieldStatDeltas) fieldStatDeltas.player.assaultMod -= 4;
    } else if (state.eDamage > state.pDamage && !state.eImmune) {
      state.eAssaultMod -= 4;
      if (fieldStatDeltas) fieldStatDeltas.enemy.assaultMod -= 4;
    }
    battleLog.push(`🏚️ ${fn}: −4 VA a chi ha DAN più alta`);
  }

  if (id === 99) {
    const clampStat = (value, base) => Math.max(base - 2, Math.min(base + 2, value));
    const pBasePower = pAgent?.power ?? state.pPower;
    const eBasePower = eAgent?.power ?? state.ePower;
    const pBaseDamage = pAgent?.damage ?? state.pDamage;
    const eBaseDamage = eAgent?.damage ?? state.eDamage;
    state.pPower = clampStat(state.pPower, pBasePower);
    state.ePower = clampStat(state.ePower, eBasePower);
    state.pDamage = clampStat(state.pDamage, pBaseDamage);
    state.eDamage = clampStat(state.eDamage, eBaseDamage);
    battleLog.push(`⛓️ ${fn}: POT/DAN entro ±2 dal base`);
  }

  if (id === 112) {
    const cap = 7;
    state.pPower = Math.min(state.pPower, cap);
    state.ePower = Math.min(state.ePower, cap);
    battleLog.push(`🌲 ${fn}: POT finale max ${cap}`);
  }

  // Corte di Akitsuna (117): +1 POT se Potere o Bonus disattivato
  if (id === 117) {
    if (state.pAbilityBlocked || state.pBonusBlocked) {
      state.pPower += 1;
      if (fieldStatDeltas) fieldStatDeltas.player.power += 1;
      battleLog.push(`🎭 ${fn}: TU Potere/Bonus disattivato · +1 POT → ${state.pPower}`);
    }
    if (state.eAbilityBlocked || state.eBonusBlocked) {
      state.ePower += 1;
      if (fieldStatDeltas) fieldStatDeltas.enemy.power += 1;
      battleLog.push(`🎭 ${fn}: IA Potere/Bonus disattivato · +1 POT → ${state.ePower}`);
    }
  }

  if (id === 86) {
    state.pAssaultMod *= 2;
    state.eAssaultMod *= 2;
    battleLog.push(`🦷 ${fn}: modificatori VA ×2`);
  }
}
