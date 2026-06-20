// Flag e modificatori campo per id (CAMPI_MASTER + note implementazione)

/** @param {{ id?: number }} field */
export function getFieldModifiers(field) {
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
  if (id === 59) m.swapImboscataIntervento = true;
  if (id === 73) m.invertTurboUltimaChance = true;
  if (id === 61) m.conquestDouble = true;
  if (id === 68) m.lastWishDouble = true;
  if (id === 74) m.circuitAbilityTriggers = true;
  if (id === 79) m.overdriveExtraPowerAndDamage = true;
  if (id === 62) m.winnerByFocusNotVa = true;
  if (id === 67) m.focusHalvedInVa = true;
  if (id === 66) m.minFloorReduction = 1;
  if (id === 81) m.imposeDamageFromPower = true;
  if (id === 63) m.maxPower = 5;
  if (id === 77) m.secondPlayerAbilityBlocked = true;

  return m;
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
    maxPower: id === 63 ? 5 : null,
    directDamageBonus: id === 33 ? 1 : 0,
    forceBothImmune: id === 80,
    minFloorReduction: id === 66 ? 1 : 0,
    imposeDamageFromPower: id === 81,
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
