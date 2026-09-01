// Pipeline post-VA: danni (Nexus, Centrale), aftermath campo, sottrazione FC, oggetto battleResult.
import { applyBattlefieldRoundAftermath } from '../fieldBattleAftermath.js';
import { applyFocusSpendWithGuarantee } from '../legalFocusSpend.js';
import {
  applyDuelNexusMaxDamage,
  applyCentraleOverdriveDamage,
} from './duelDamagePipeline.js';
import { emitAftermathResourceEvents } from './battleFieldEventDiff.js';
import { BATTLE_PHASES, BATTLE_REVEAL_AT } from './battleEventEmit.js';
import { getPerfectFocusSide } from './perfectFocusBet.js';

export function runDuelDamageAftermathAndFcAdjust({
  battleLog,
  field,
  winner,
  maxDamage,
  overdriveThreshold,
  pFocusUsed,
  eFocusUsed,
  pDamage,
  eDamage,
  pHPCurrent,
  eHPCurrent,
  pFCCurrent,
  eFCCurrent,
  selectedFocus,
  enemySelectedFocus,
  playerAgentsRemainingAfter = 0,
  enemyAgentsRemainingAfter = 0,
  // Lati che non subiscono la parte per-Agente del Campo. L'aftermath di round resta fuori:
  // agisce sul giocatore dopo il Duello, non sull'Agente durante il Duello.
  fieldVeiledSides = [],
}) {
  if (battleLog && typeof battleLog.setContext === 'function') {
    battleLog.setContext(BATTLE_PHASES.post, BATTLE_REVEAL_AT.postFx);
  }

  let dm = applyDuelNexusMaxDamage(battleLog, maxDamage, pDamage, eDamage, fieldVeiledSides);
  let pD = dm.pDamage;
  let eD = dm.eDamage;
  dm = applyCentraleOverdriveDamage(
    battleLog,
    field.name,
    overdriveThreshold,
    pFocusUsed,
    eFocusUsed,
    pD,
    eD,
    fieldVeiledSides
  );
  pD = dm.pDamage;
  eD = dm.eDamage;

  let damageDealt = winner === 'player' ? pD : eD;

  const beforeAftermath = {
    pHP: pHPCurrent,
    eHP: eHPCurrent,
    pFC: pFCCurrent,
    eFC: eFCCurrent,
  };

  const aftermath = applyBattlefieldRoundAftermath({
    field,
    winner,
    damageDealt,
    pHPCurrent,
    eHPCurrent,
    pFCCurrent,
    eFCCurrent,
    battleLog,
    pFocusUsed,
    eFocusUsed,
  });

  emitAftermathResourceEvents(battleLog, field, beforeAftermath, {
    pHP: aftermath.pHPCurrent,
    eHP: aftermath.eHPCurrent,
    pFC: aftermath.pFCCurrent,
    eFC: aftermath.eFCCurrent,
  });

  return {
    pDamage: pD,
    eDamage: eD,
    damageDealt,
    finalPlayerHP: aftermath.pHPCurrent,
    finalEnemyHP: aftermath.eHPCurrent,
    // Mai sotto 1 FC per agente ancora da giocare (player e IA).
    finalPlayerFC: applyFocusSpendWithGuarantee(
      aftermath.pFCCurrent,
      selectedFocus,
      playerAgentsRemainingAfter
    ),
    finalEnemyFC: applyFocusSpendWithGuarantee(
      aftermath.eFCCurrent,
      enemySelectedFocus,
      enemyAgentsRemainingAfter
    ),
  };
}

/**
 * Costruisce `battleResult` (stesso shape di computeDuelResolution).
 * `assault` è l'oggetto restituito da runDuelAssaultCalculation.
 */
export function buildDuelBattleResult({
  winner,
  pAgent,
  eAgent,
  assault,
  pAssaultMod,
  eAssaultMod,
  pPower,
  ePower,
  pDamage,
  eDamage,
  pFocusUsed,
  eFocusUsed,
  pArmyBonusActive,
  eArmyBonusActive,
  finalPHasBonus,
  finalEHasBonus,
  finalPAbilityTriggered,
  finalEAbilityTriggered,
  pAbilityBlocked,
  eAbilityBlocked,
  pBonusBlocked,
  eBonusBlocked,
  pAbilityCopied,
  eAbilityCopied,
  pCopiedAbilityNotTriggered,
  eCopiedAbilityNotTriggered,
  pBonusCopied,
  eBonusCopied,
  pCopiedBonusNotTriggered,
  eCopiedBonusNotTriggered,
  pAbilityNotTriggered,
  eAbilityNotTriggered,
  pBonusNotTriggered,
  eBonusNotTriggered,
  damageDealt,
  finalPlayerHP,
  finalEnemyHP,
  finalPlayerFC,
  finalEnemyFC,
  battleLog,
  phaseLogs,
  field,
  currentFieldIndex,
  playerToxinActivated,
  enemyToxinActivated,
  visualSteps = [],
  isPlayerFirst = true,
  events = [],
}) {
  const {
    pAssault,
    eAssault,
    pAssaultRaw,
    eAssaultRaw,
    pMinFinal,
    eMinFinal,
    pAssaultBase,
    eAssaultBase,
    pPowerAfterEffects,
    ePowerAfterEffects,
    pAssaultAfterFocus,
    eAssaultAfterFocus,
  } = assault;

  const result = {
    winner,
    playerAgent: pAgent,
    enemyAgent: eAgent,
    playerAssault: pAssault,
    enemyAssault: eAssault,
    playerAssaultRaw: pAssaultRaw,
    enemyAssaultRaw: eAssaultRaw,
    playerAssaultMinFinal: pMinFinal,
    enemyAssaultMinFinal: eMinFinal,
    playerAssaultBase: pAssaultBase,
    enemyAssaultBase: eAssaultBase,
    playerPowerAfterEffects: pPowerAfterEffects,
    enemyPowerAfterEffects: ePowerAfterEffects,
    playerAssaultAfterFocus: pAssaultAfterFocus,
    enemyAssaultAfterFocus: eAssaultAfterFocus,
    playerAssaultMod: pAssaultMod,
    enemyAssaultMod: eAssaultMod,
    playerPower: pPower,
    playerDamage: pDamage,
    enemyPower: ePower,
    enemyDamage: eDamage,
    playerFocusUsed: pFocusUsed,
    enemyFocusUsed: eFocusUsed,
    playerArmyBonusActive: pArmyBonusActive,
    enemyArmyBonusActive: eArmyBonusActive,
    playerHasBonus: finalPHasBonus,
    enemyHasBonus: finalEHasBonus,
    playerAbilityTriggered: finalPAbilityTriggered,
    enemyAbilityTriggered: finalEAbilityTriggered,
    playerAbilityBlocked: pAbilityBlocked,
    enemyAbilityBlocked: eAbilityBlocked,
    playerBonusBlocked: pBonusBlocked,
    enemyBonusBlocked: eBonusBlocked,
    playerAbilityCopied: pAbilityCopied,
    enemyAbilityCopied: eAbilityCopied,
    playerCopiedAbilityNotTriggered: pCopiedAbilityNotTriggered,
    enemyCopiedAbilityNotTriggered: eCopiedAbilityNotTriggered,
    playerBonusCopied: pBonusCopied,
    enemyBonusCopied: eBonusCopied,
    playerCopiedBonusNotTriggered: pCopiedBonusNotTriggered,
    enemyCopiedBonusNotTriggered: eCopiedBonusNotTriggered,
    playerAbilityNotTriggered: pAbilityNotTriggered,
    enemyAbilityNotTriggered: eAbilityNotTriggered,
    playerBonusNotTriggered: pBonusNotTriggered,
    enemyBonusNotTriggered: eBonusNotTriggered,
    damageDealt,
    finalPlayerHP,
    finalEnemyHP,
    finalPlayerFC,
    finalEnemyFC,
    logs: battleLog,
    phaseLogs,
    events,
    field,
    fieldIndex: currentFieldIndex,
    winnerArmy: winner === 'player' ? pAgent.army : eAgent.army,
    playerToxinActivated,
    enemyToxinActivated,
    visualSteps,
    isPlayerFirst,
  };

  result.perfectFocusSide = getPerfectFocusSide(result);
  return result;
}
