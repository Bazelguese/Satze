// Applica poteri carta (dopo pre-scan block), esclusi blockAbility/blockBonus già gestiti.
export function applyDuelMainAbilities({
  state,
  pAgent,
  eAgent,
  applyEffect,
  battleLog,
  playerContext,
  enemyContext,
  triggersIgnored,
  duelCanTriggerAbility,
  copyDisabled,
  modifiersDisabled,
  directDamageDisabled,
  directDamageBonus,
}) {
  const opt = (a) => ({
    minDamage: a.minDamage,
    minPower: a.minPower,
    minAssault: a.minAssault,
    minHealth: a.minHealth,
    stat: a.stat,
    copyDisabled,
    modifiersDisabled,
    directDamageDisabled,
    directDamageBonus,
  });

  // Inversione: attiva il flag prima che gli altri poteri (incluso il nemico) applichino modificatori
  if (
    !state.pAbilityBlocked &&
    pAgent?.ability?.effect === 'inversion' &&
    duelCanTriggerAbility(pAgent.ability.trigger, playerContext, triggersIgnored)
  ) {
    state.pModifierInversion = true;
    battleLog.push(`🔄 TU (${pAgent.name}): Inversione attiva`);
  }
  if (
    !state.eAbilityBlocked &&
    eAgent?.ability?.effect === 'inversion' &&
    duelCanTriggerAbility(eAgent.ability.trigger, enemyContext, triggersIgnored)
  ) {
    state.eModifierInversion = true;
    battleLog.push(`🔄 IA (${eAgent.name}): Inversione attiva`);
  }

  if (
    !state.pAbilityBlocked &&
    pAgent.ability &&
    pAgent.ability.effect !== 'blockAbility' &&
    pAgent.ability.effect !== 'blockBonus' &&
    pAgent.ability.effect !== 'inversion' &&
    duelCanTriggerAbility(pAgent.ability.trigger, playerContext, triggersIgnored)
  ) {
    applyEffect(pAgent.ability.effect, pAgent.ability.value, 'player', `TU (${pAgent.name})`, battleLog, opt(pAgent.ability));
  } else if (
    state.pAbilityBlocked &&
    pAgent.ability &&
    pAgent.ability.effect !== 'blockAbility' &&
    pAgent.ability.effect !== 'blockBonus'
  ) {
    battleLog.push(`🐛¡️ TU: Potere BLOCCATO dall'avversario!`);
  }

  if (
    !state.eAbilityBlocked &&
    eAgent.ability &&
    eAgent.ability.effect !== 'blockAbility' &&
    eAgent.ability.effect !== 'blockBonus' &&
    eAgent.ability.effect !== 'inversion' &&
    duelCanTriggerAbility(eAgent.ability.trigger, enemyContext, triggersIgnored)
  ) {
    applyEffect(eAgent.ability.effect, eAgent.ability.value, 'enemy', `IA (${eAgent.name})`, battleLog, opt(eAgent.ability));
  } else if (
    state.eAbilityBlocked &&
    eAgent.ability &&
    eAgent.ability.effect !== 'blockAbility' &&
    eAgent.ability.effect !== 'blockBonus'
  ) {
    battleLog.push(`🐛¡️ IA: Potere BLOCCATO da te!`);
  }
}
