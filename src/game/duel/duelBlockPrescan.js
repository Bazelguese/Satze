// PRE-SCAN blockAbility/blockBonus prima degli altri poteri (Biblioteca: blockDisabled).
import { canTriggerPreBattle } from './duelHelpers.js';
import { getInitiativeSideOrder, getDuelSideBundle } from './duelInitiativeOrder.js';

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
  isPlayerFirst = true,
  visualRecorder = null,
}) {
  const canTriggerPreBattleBlock = (agent, context) =>
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

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    const agent = side.agent;

    if (!agent?.ability || !canTriggerPreBattleBlock(agent, side.context)) continue;

    if (blockDisabled && (agent.ability.effect === 'blockAbility' || agent.ability.effect === 'blockBonus')) {
      if (sideKey === 'player') {
        battleLog.push(`🐛¡️ ${fieldName}: Il tuo Blocco non funziona qui!`);
      }
      continue;
    }

    if (blockDisabled) continue;

    if (agent.ability.effect === 'blockAbility') {
      state[side.opponentAbilityBlocked] = true;
      battleLog.push(
        `🚫 ${side.labelSelf}: Blocca Potere → Il Potere di ${side.opponentAgent.name} è disattivato!`
      );
      visualRecorder?.pushBlock(sideKey, state);
    } else if (agent.ability.effect === 'blockBonus') {
      state[side.opponentBonusBlocked] = true;
      battleLog.push(
        `🚫 ${side.labelSelf}: Blocca Bonus → Il Bonus di ${side.opponentAgent.army} è disattivato!`
      );
      visualRecorder?.pushBlock(sideKey, state);
    }
  }
}
