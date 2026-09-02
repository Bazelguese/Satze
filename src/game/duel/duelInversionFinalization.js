// Finalizzazione Inversione sui modificatori del Campo (REGOLE §3.5).

/**
 * Inverte il netto dei modificatori statistici applicati dal Campo per i lati con Inversione attiva.
 * Formula: stat_finale = stat_dopo_campo - 2 × delta_campo  (equivalente a riflettere il delta).
 */
export function applyInversionFieldFinalization(state, fieldStatDeltas, battleLog, fieldName = 'Campo') {
  if (!fieldStatDeltas?.invertible) return false;

  let changed = false;
  const sides = [
    { key: 'player', inversionFlag: 'pModifierInversion', label: 'TU', powerKey: 'pPower', damageKey: 'pDamage', assaultKey: 'pAssaultMod' },
    { key: 'enemy', inversionFlag: 'eModifierInversion', label: 'IA', powerKey: 'ePower', damageKey: 'eDamage', assaultKey: 'eAssaultMod' },
  ];

  for (const side of sides) {
    if (!state[side.inversionFlag]) continue;
    const delta = fieldStatDeltas[side.key];
    if (!delta) continue;

    const powerAdj = -2 * delta.power;
    const damageAdj = -2 * delta.damage;
    const assaultAdj = -2 * delta.assaultMod;

    if (powerAdj !== 0) {
      const before = state[side.powerKey];
      state[side.powerKey] += powerAdj;
      battleLog.push(
        `🔄 Inversione (${fieldName}): ${side.label} malus/bonus campo POT ${delta.power} → ${powerAdj > 0 ? '+' : ''}${powerAdj} POT (${before} → ${state[side.powerKey]})`
      );
      changed = true;
    }
    if (damageAdj !== 0) {
      const before = state[side.damageKey];
      state[side.damageKey] = Math.max(0, state[side.damageKey] + damageAdj);
      battleLog.push(
        `🔄 Inversione (${fieldName}): ${side.label} malus/bonus campo DAN ${delta.damage} → ${damageAdj > 0 ? '+' : ''}${damageAdj} DAN (${before} → ${state[side.damageKey]})`
      );
      changed = true;
    }
    if (assaultAdj !== 0) {
      const before = state[side.assaultKey];
      state[side.assaultKey] += assaultAdj;
      battleLog.push(
        `🔄 Inversione (${fieldName}): ${side.label} malus/bonus campo VA ${delta.assaultMod} → ${assaultAdj > 0 ? '+' : ''}${assaultAdj} VA (${before} → ${state[side.assaultKey]})`
      );
      changed = true;
    }
  }

  return changed;
}
