// Applica poteri carta (dopo pre-scan block), esclusi blockAbility/blockBonus già gestiti.
import { canTriggerPreBattle } from './duelHelpers.js';
import { scaleConquestEffectValue } from '../battlefieldDeepEffects.js';
import { getInitiativeSideOrder, getDuelSideBundle } from './duelInitiativeOrder.js';

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
  fieldOptions = {},
  isPlayerFirst = true,
  visualRecorder = null,
}) {
  const {
    copyDisabled = false,
    modifiersDisabled = false,
    positivePowerModifiersDisabled = false,
    positiveDamageModifiersDisabled = false,
    directDamageDisabled = false,
    directDamageBonus = 0,
    minFloorReduction = 0,
  } = fieldOptions;

  const opt = (a) => ({
    minDamage: a.minDamage,
    minPower: a.minPower,
    minAssault: a.minAssault,
    minHealth: a.minHealth,
    stat: a.stat,
    copyDisabled,
    modifiersDisabled,
    positivePowerModifiersDisabled,
    positiveDamageModifiersDisabled,
    directDamageDisabled,
    directDamageBonus,
    minFloorReduction,
  });

  const canTriggerPreBattleAbility = (agent, context) =>
    canTriggerPreBattle(agent?.ability?.trigger, context, {
      triggersIgnored,
      resolveTrigger: (trigger, ctx) => duelCanTriggerAbility(trigger, ctx, false),
    });

  const sides = getInitiativeSideOrder(isPlayerFirst);
  const bundleArgs = {
    pAgent,
    eAgent,
    playerContext,
    enemyContext,
    pHasBonus: false,
    eHasBonus: false,
    pArmyBonus: null,
    eArmyBonus: null,
  };

  // Inversione: 1° giocatore → 2° giocatore, prima degli altri poteri
  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const agent = side.agent;
    if (
      !state[side.abilityBlocked] &&
      agent?.ability?.effect === 'inversion' &&
      canTriggerPreBattleAbility(agent, side.context)
    ) {
      if (sideKey === 'player') {
        state.pModifierInversion = true;
      } else {
        state.eModifierInversion = true;
      }
      battleLog.push(`🔄 ${side.labelSelf} (${agent.name}): Inversione attiva`);
      visualRecorder?.pushInversion(sideKey, state);
    }
  }

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const agent = side.agent;
    const ability = agent?.ability;

    if (
      !state[side.abilityBlocked] &&
      ability &&
      ability.effect !== 'blockAbility' &&
      ability.effect !== 'blockBonus' &&
      ability.effect !== 'inversion' &&
      canTriggerPreBattleAbility(agent, side.context)
    ) {
      const abilityValue =
        ability.trigger === 'conquest'
          ? scaleConquestEffectValue(ability.value, fieldOptions)
          : ability.value;
      const abilitySource = `${side.labelSelf} (${agent.name})`;
      applyEffect(ability.effect, abilityValue, sideKey, abilitySource, battleLog, opt(ability));
      if (ability.trigger === 'lastWish' && fieldOptions?.lastWishDouble) {
        applyEffect(ability.effect, abilityValue, sideKey, `${abilitySource} (2×)`, battleLog, opt(ability));
      }
      if (ability.effect === 'copyAbility' || ability.effect === 'copyBonus') {
        // Copia Bonus da Potere aggiorna lo slot Potere (come Copia Potere).
        visualRecorder?.pushCopyAbility(sideKey, state);
      }
      visualRecorder?.pushPower(sideKey, state);
    } else if (
      state[side.abilityBlocked] &&
      ability &&
      ability.effect !== 'blockAbility' &&
      ability.effect !== 'blockBonus'
    ) {
      battleLog.push(
        sideKey === 'player'
          ? `🐛¡️ TU: Potere BLOCCATO dall'avversario!`
          : `🐛¡️ IA: Potere BLOCCATO da te!`
      );
      visualRecorder?.pushPowerBlocked(sideKey, state);
    }
  }
}
