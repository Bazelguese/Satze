// Flag e modificatori campo per id (CAMPI_MASTER + note implementazione)

/** @param {{ id?: number }} field */
export function buildFieldModifiers(field) {
  if (!field?.id) return {};
  const id = field.id;
  const m = {};

  if (id === 22) {
    m.gloriaAlwaysActive = true;
    m.vendettaAlwaysActive = true;
  }
  if (id === 39) m.rimontaAlwaysActive = true;
  if (id === 49) m.imboscataAlwaysActive = true;
  if (id === 45) m.interventoAlwaysActive = true;
  if (id === 31) m.magnanimoAlwaysActive = true;
  if (id === 41) m.allTriggersAlwaysActive = true;
  if (id === 29) m.overdriveThreshold = 4;
  if (id === 58) m.reckoningAlwaysActive = true;
  if (id === 72) m.turboAlwaysActive = true;
  if (id === 83) m.resistenzaAlwaysActive = true;
  if (id === 88) m.invasioneAlwaysActive = true;
  if (id === 59) m.swapImboscataIntervento = true;
  if (id === 73) m.invertTurboUltimaChance = true;
  if (id === 61) m.conquestDouble = true;
  if (id === 68) m.lastWishDouble = true;
  if (id === 74) m.circuitAbilityTriggers = true;
  if (id === 79) m.overdriveExtraPowerAndDamage = true;
  if (id === 62) m.winnerByFocusNotVa = true;
  if (id === 85) m.winnerByFinalPowerThenVa = true;
  if (id === 108) m.winnerByFinalDamageThenVa = true;
  if (id === 86) m.vaModifiersDouble = true;
  if (id === 67) m.focusHalvedInVa = true;
  if (id === 66) m.minFloorReduction = 1;
  if (id === 81) m.imposeDamageFromPower = true;
  if (id === 63) m.maxPower = 5;
  if (id === 112) m.maxFinalPower = 7;
  if (id === 77) m.secondPlayerAbilityBlocked = true;
  if (id === 98) m.positivePowerModifiersDisabled = true;
  if (id === 110) m.positiveDamageModifiersDisabled = true;
  if (id === 99) m.clampPowerDamageToBasePlusMinus2 = true;
  if (id === 100) m.maxFCByLeague = true;
  if (id === 114) m.overdriveDisabled = true;
  if (id === 115) m.toxinDisabled = true;
  if (id === 116) m.maxFocusCountedInVa = 6;
  if (id === 118) m.swapCopyImponi = true;
  if (id === 120) m.swapArmyBonuses = true;
  if (id === 121) m.conquestDisabled = true;

  return {
    ...m,
    triggersIgnored: m.allTriggersAlwaysActive === true,
    overdriveThreshold: m.overdriveThreshold || 5,
  };
}

/** @param {{ id?: number }} field @param {Object} playerContext @param {Object} enemyContext */
export function attachFieldModifiersToContexts(field, playerContext, enemyContext) {
  const fieldModifiers = buildFieldModifiers(field);
  playerContext.fieldModifiers = fieldModifiers;
  enemyContext.fieldModifiers = fieldModifiers;
  return fieldModifiers;
}

/** @param {{ id?: number }} field */
export function getFieldModifiers(field) {
  return buildFieldModifiers(field);
}

/** Campi che applicano un bonus quando Overdrive è attivo (FC ≥ soglia). */
export function fieldGrantsOverdriveBonus(field) {
  if (!field?.id) return false;
  if (getFieldModifiers(field).overdriveDisabled) return false;
  if (field.id === 44) return true; // Centrale Energetica: +1 DAN
  return Boolean(getFieldModifiers(field).overdriveExtraPowerAndDamage); // Camera Rituale (79)
}

/** @param {{ id?: number }} field */
export function getFieldSetupFlags(field) {
  const id = field?.id ?? 0;
  return {
    id,
    immuneDisabled: id === 28,
    blockDisabled: id === 24,
    copyDisabled: id === 27,
    directDamageDisabled: id === 43,
    modifiersDisabled: id === 32,
    maxDamage: id === 15 ? 4 : null,
    maxFC: id === 36 ? 3 : null,
    maxFCByLeague: id === 100,
    maxPower: id === 63 ? 5 : null,
    directDamageBonus: id === 33 ? 1 : 0,
    forceBothImmune: id === 80,
    minFloorReduction: id === 66 ? 1 : 0,
    imposeDamageFromPower: id === 81,
    positivePowerModifiersDisabled: id === 98,
    positiveDamageModifiersDisabled: id === 110,
    clampPowerDamageToBasePlusMinus2: id === 99,
    maxFinalPower: id === 112 ? 7 : null,
    vaModifiersDouble: id === 86,
    winnerByFinalPowerThenVa: id === 85,
    winnerByFinalDamageThenVa: id === 108,
    overdriveDisabled: id === 114,
    toxinDisabled: id === 115,
    maxFocusCountedInVa: id === 116 ? 6 : null,
    swapCopyImponi: id === 118,
    conquestDisabled: id === 121,
    ...getFieldModifiers(field),
  };
}

/**
 * Riduce i floor "min N" negli effetti POT (es. Mercato delle Anime).
 * @param {number} value
 * @param {number} min
 * @param {number} reduction
 */
export function applyFieldMinFloor(value, min, reduction = 0) {
  if (min == null || reduction <= 0) return Math.max(min ?? value, value);
  const adjustedMin = Math.max(1, min - reduction);
  return Math.max(adjustedMin, value);
}

/** Floor minimo effettivo per Poteri/Bonus (es. Fogna Maestra id 66). */
export function getEffectiveMinFloor(baseMin, minFloorReduction, fallbackWhenUndefined) {
  const raw = baseMin !== undefined ? baseMin : fallbackWhenUndefined;
  if (!minFloorReduction || minFloorReduction <= 0 || raw == null) return raw;
  return Math.max(1, raw - minFloorReduction);
}

export function getFieldMinFloorReduction(field) {
  return getFieldSetupFlags(field).minFloorReduction || 0;
}

/** Copia ability con min POT/DAN/VA ridotti dal campo (solo display o risoluzione). */
export function applyMinFloorReductionToAbility(ability, minFloorReduction = 0) {
  if (!ability || !minFloorReduction) return ability;
  const adj = (n) => getEffectiveMinFloor(n, minFloorReduction, undefined);
  return {
    ...ability,
    ...(ability.minPower != null ? { minPower: adj(ability.minPower) } : {}),
    ...(ability.minDamage != null ? { minDamage: adj(ability.minDamage) } : {}),
    ...(ability.minAssault != null ? { minAssault: adj(ability.minAssault) } : {}),
  };
}

/** Aggiorna `(min N)` nel testo bonus/descrizione come in risoluzione duello. */
export function applyMinFloorReductionToEffectText(text, minFloorReduction = 0) {
  if (!text || !minFloorReduction) return text;
  return String(text).replace(/\(min (\d+)\)/g, (_, n) => {
    const adjusted = Math.max(1, parseInt(n, 10) - minFloorReduction);
    return `(min ${adjusted})`;
  });
}
