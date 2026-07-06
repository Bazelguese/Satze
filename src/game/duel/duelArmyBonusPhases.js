// Bonus armata pre-VA: per ogni giocatore in ordine di iniziativa, own stat poi enemy stat.
import { canTriggerPreBattle } from './duelHelpers.js';
import { getInitiativeSideOrder, getDuelSideBundle } from './duelInitiativeOrder.js';

export function applyDuelArmyBonusPhases({
  state,
  pHasBonus,
  eHasBonus,
  pArmyBonus,
  eArmyBonus,
  pAgent,
  eAgent,
  playerContext,
  enemyContext,
  battleLog,
  applyBonusEffects,
  checkTrigger,
  triggersIgnored = false,
  isPlayerFirst = true,
  visualRecorder = null,
}) {
  const canTriggerPreBattleBonus = (bonus, context) =>
    canTriggerPreBattle(bonus?.trigger, context, { triggersIgnored, resolveTrigger: checkTrigger });

  const sides = getInitiativeSideOrder(isPlayerFirst);
  const bundleArgs = {
    pAgent,
    eAgent,
    playerContext,
    enemyContext,
    pHasBonus,
    eHasBonus,
    pArmyBonus,
    eArmyBonus,
  };

  for (const sideKey of sides) {
    const side = getDuelSideBundle(sideKey, bundleArgs);
    if (!side.hasBonus || state[side.bonusBlocked] || !side.armyBonus) continue;
    if (!canTriggerPreBattleBonus(side.armyBonus, side.context)) continue;

    const source = `Bonus ${side.agent.army}`;
    applyBonusEffects(side.armyBonus, sideKey, side.context, source, battleLog, true, false);
    applyBonusEffects(side.armyBonus, sideKey, side.context, source, battleLog, false, true);
    visualRecorder?.pushBonus(sideKey, state);
  }
}
