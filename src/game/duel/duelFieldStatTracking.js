// Traccia i delta statistici applicati dal Campo e li inverte in finalizzazione (Inversione).

export function createEmptyFieldStatDeltas() {
  return {
    player: { power: 0, damage: 0, assaultMod: 0 },
    enemy: { power: 0, damage: 0, assaultMod: 0 },
    invertible: true,
  };
}

export function computeFieldStatDeltas(before, after) {
  return {
    player: {
      power: after.pPower - before.pPower,
      damage: after.pDamage - before.pDamage,
      assaultMod: after.pAssaultMod - before.pAssaultMod,
    },
    enemy: {
      power: after.ePower - before.ePower,
      damage: after.eDamage - before.eDamage,
      assaultMod: after.eAssaultMod - before.eAssaultMod,
    },
    invertible: true,
  };
}

export function addFieldStatDelta(fieldStatDeltas, side, stat, delta) {
  if (!fieldStatDeltas || delta === 0) return;
  fieldStatDeltas[side][stat] += delta;
}
