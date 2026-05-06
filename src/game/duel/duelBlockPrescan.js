// PRE-SCAN blockAbility/blockBonus prima degli altri poteri (Biblioteca: blockDisabled).
export function applyDuelBlockPrescan({
  blockDisabled,
  fieldName,
  pAgent,
  eAgent,
  state,
  battleLog,
  playerContext,
  enemyContext,
  triggersIgnored,
  duelCanTriggerAbility,
}) {
  if (!blockDisabled && pAgent.ability && duelCanTriggerAbility(pAgent.ability.trigger, playerContext, triggersIgnored)) {
    if (pAgent.ability.effect === 'blockAbility') {
      state.eAbilityBlocked = true;
      battleLog.push(`🚫 TU: Blocca Potere → Il Potere di ${eAgent.name} è disattivato!`);
    } else if (pAgent.ability.effect === 'blockBonus') {
      state.eBonusBlocked = true;
      battleLog.push(`🚫 TU: Blocca Bonus → Il Bonus di ${eAgent.army} è disattivato!`);
    }
  } else if (blockDisabled && pAgent.ability && (pAgent.ability.effect === 'blockAbility' || pAgent.ability.effect === 'blockBonus')) {
    battleLog.push(`🐛¡️ ${fieldName}: Il tuo Blocco non funziona qui!`);
  }

  if (!blockDisabled && eAgent.ability && duelCanTriggerAbility(eAgent.ability.trigger, enemyContext, triggersIgnored)) {
    if (eAgent.ability.effect === 'blockAbility') {
      state.pAbilityBlocked = true;
      battleLog.push(`🚫 IA: Blocca Potere → Il Potere di ${pAgent.name} è disattivato!`);
    } else if (eAgent.ability.effect === 'blockBonus') {
      state.pBonusBlocked = true;
      battleLog.push(`🚫 IA: Blocca Bonus → Il Bonus di ${pAgent.army} è disattivato!`);
    }
  }
}
