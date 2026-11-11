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
    toxinDisabled = false,
    swapCopyImponi = false,
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
    ...fieldOptions,
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
      // Sotto Maledizione Inversa una carta Inversione non inverte di nuovo.
      !state.fullStatInversion &&
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

  // Poteri risolti in questo passaggio, per gli effetti Eminenza che ne dipendono (Eco).
  const powerActivated = { player: false, enemy: false };

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
      powerActivated[sideKey] = true;
      // Debito X: il Potere si attiva senza bisogno del trigger, e chi lo controlla paga X PV
      // quando si attiva. Un Potere bloccato non arriva qui, quindi non si paga.
      if (ability.trigger === 'debt') {
        applyEffect('selfDamage', ability.debtAmount ?? 2, sideKey, `${abilitySource} (Debito)`, battleLog, {});
      }
      if (ability.trigger === 'lastWish' && fieldOptions?.lastWishDouble) {
        applyEffect(ability.effect, abilityValue, sideKey, `${abilitySource} (2×)`, battleLog, opt(ability));
      }
      if (ability.effect === 'copyAbility' || ability.effect === 'copyBonus') {
        // Copia Bonus da Potere aggiorna lo slot Potere (come Copia Potere).
        visualRecorder?.pushCopyAbility(sideKey, state);
      }
      visualRecorder?.pushPower(sideKey, state);
    }

    const granted = agent?.grantedAbility;
    if (
      !state[side.abilityBlocked]
      && granted
      && canTriggerPreBattleAbility({ ability: granted }, side.context)
    ) {
      const grantedSource = `${side.labelSelf} (${agent.name})`;
      for (const eff of granted.effects || []) {
        const grantedValue =
          granted.trigger === 'conquest'
            ? scaleConquestEffectValue(eff.value, fieldOptions)
            : eff.value;
        applyEffect(eff.effect, grantedValue, sideKey, grantedSource, battleLog, opt(eff));
      }
      visualRecorder?.pushPower(sideKey, state);
    } else if (
      state[side.abilityBlocked] &&
      (
        (ability && ability.effect !== 'blockAbility' && ability.effect !== 'blockBonus')
        || granted
      )
    ) {
      battleLog.push(
        sideKey === 'player'
          ? `🐛¡️ TU: Potere BLOCCATO dall'avversario!`
          : `🐛¡️ IA: Potere BLOCCATO da te!`
      );
      visualRecorder?.pushPowerBlocked(sideKey, state);
    }
  }

  // Eco (Eminenza): se il Potere dell'Agente nemico si è attivato, si attiva anche per il
  // tuo Agente. Si risolve dopo entrambi i Poteri, così l'iniziativa non conta. I Poteri che
  // agiscono su altri Poteri (Blocca, Copia, Inversione) non hanno nulla da ripetere.
  for (const sideKey of sides) {
    const echoFlag = sideKey === 'player' ? 'pEchoEnemyPower' : 'eEchoEnemyPower';
    if (!state[echoFlag]) continue;
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const enemySide = sideKey === 'player' ? 'enemy' : 'player';
    const sourceAgent = sideKey === 'player' ? eAgent : pAgent;
    const echoed = sourceAgent?.ability;
    if (!powerActivated[enemySide] || !echoed || state[side.abilityBlocked]) continue;
    if (ECHO_SKIPPED_EFFECTS.has(echoed.effect)) continue;
    const echoedValue = echoed.trigger === 'conquest'
      ? scaleConquestEffectValue(echoed.value, fieldOptions)
      : echoed.value;
    applyEffect(echoed.effect, echoedValue, sideKey, `${side.labelSelf} (Eco: ${sourceAgent.name})`, battleLog, opt(echoed));
    visualRecorder?.pushPower(sideKey, state);
  }
}

const ECHO_SKIPPED_EFFECTS = new Set(['blockAbility', 'blockBonus', 'inversion', 'copyAbility', 'copyBonus']);
