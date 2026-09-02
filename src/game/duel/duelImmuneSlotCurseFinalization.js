// Finalizzazione Immune sulle Maledizioni di slot (Khemet): stesso modello dell'Inversione sul Campo.

/**
 * Annulla i debuff statistici delle Maledizioni di slot per i lati Immune.
 * Le maledizioni si applicano al deploy; se Immune si attiva dopo (bonus Overdrive, Potere…)
 * o era già attivo, i malus vengono rimossi retroattivamente.
 *
 * Solo i delta negativi vengono neutralizzati (Immune non tocca buff).
 */
export function applyImmuneSlotCurseFinalization(state, slotCurseStatDeltas, battleLog) {
  if (!slotCurseStatDeltas) return false;

  let changed = false;
  const sides = [
    {
      key: 'player',
      immuneFlag: 'pImmune',
      label: 'TU',
      powerKey: 'pPower',
      damageKey: 'pDamage',
      assaultKey: 'pAssaultMod',
    },
    {
      key: 'enemy',
      immuneFlag: 'eImmune',
      label: 'IA',
      powerKey: 'ePower',
      damageKey: 'eDamage',
      assaultKey: 'eAssaultMod',
    },
  ];

  for (const side of sides) {
    if (!state[side.immuneFlag]) continue;
    const delta = slotCurseStatDeltas[side.key];
    if (!delta) continue;

    if (delta.power < 0) {
      const before = state[side.powerKey];
      state[side.powerKey] -= delta.power;
      if (battleLog?.push) {
        battleLog.push(
          `🛡️ Immune (Maledizione slot): ${side.label} annulla ${delta.power} POT (${before} → ${state[side.powerKey]})`
        );
      }
      changed = true;
    }
    if (delta.damage < 0) {
      const before = state[side.damageKey];
      state[side.damageKey] = Math.max(0, state[side.damageKey] - delta.damage);
      if (battleLog?.push) {
        battleLog.push(
          `🛡️ Immune (Maledizione slot): ${side.label} annulla ${delta.damage} DAN (${before} → ${state[side.damageKey]})`
        );
      }
      changed = true;
    }
    if (delta.assaultMod < 0) {
      const before = state[side.assaultKey];
      state[side.assaultKey] -= delta.assaultMod;
      if (battleLog?.push) {
        battleLog.push(
          `🛡️ Immune (Maledizione slot): ${side.label} annulla ${delta.assaultMod} VA (${before} → ${state[side.assaultKey]})`
        );
      }
      changed = true;
    }
  }

  return changed;
}
