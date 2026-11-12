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

/**
 * Maledizione Inversa: nel Duello combattuto sullo slot maledetto ogni modificatore di POT,
 * DAN e VA si inverte, per entrambi gli Agenti. Si lavora sul netto rispetto ai valori
 * stampati sulla carta: stat_finale = base - (stat_corrente - base).
 * Gli FC non sono modificatori e restano fuori dal conto (entrano nel VA più avanti).
 * Un lato Immune ignora le riduzioni prodotte dall'inversione.
 */
const STAT_LABELS = { power: 'POT', damage: 'DAN', assault: 'VA' };

export function applySlotStatInversion(state, { pAgent, eAgent } = {}, battleLog = []) {
  if (!state?.fullStatInversion) return false;
  let changed = false;
  const sides = [
    { agent: pAgent, side: 'player', immune: state.pImmune, label: 'TU', keys: { power: 'pPower', damage: 'pDamage', assault: 'pAssaultMod' } },
    { agent: eAgent, side: 'enemy', immune: state.eImmune, label: 'IA', keys: { power: 'ePower', damage: 'eDamage', assault: 'eAssaultMod' } },
  ];
  for (const side of sides) {
    const bases = {
      power: Number(side.agent?.power) || 0,
      damage: Number(side.agent?.damage) || 0,
      assault: 0,
    };
    for (const [stat, key] of Object.entries(side.keys)) {
      const current = state[key];
      let inverted = 2 * bases[stat] - current;
      if (stat === 'damage') inverted = Math.max(0, inverted);
      if (inverted === current) continue;
      // Registro per l'interfaccia: il netto di ogni statistica prima e dopo l'inversione.
      // Un lato Immune tiene la riduzione fuori: la voce resta, senza cambio di segno.
      const spared = side.immune && inverted < current;
      (state.statInversions ||= []).push({
        side: side.side,
        stat: STAT_LABELS[stat],
        from: current - bases[stat],
        to: (spared ? current : inverted) - bases[stat],
      });
      if (spared) continue;
      state[key] = inverted;
      battleLog.push?.(`🔄 Maledizione Inversa: ${side.label} ${stat.toUpperCase()} ${current} → ${inverted}`);
      changed = true;
    }
  }
  return changed;
}
