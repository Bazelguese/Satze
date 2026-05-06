// Pipeline post-VA: danni (Nexus, Centrale, Canyon), aftermath campo, sottrazione FC, oggetto battleResult.
import { applyBattlefieldRoundAftermath } from '../fieldBattleAftermath.js';
import {
  applyDuelNexusMaxDamage,
  applyCentraleOverdriveDamage,
  applyCanyonWinnerDamageBonus,
} from './duelDamagePipeline.js';

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
}) {
  let dm = applyDuelNexusMaxDamage(battleLog, maxDamage, pDamage, eDamage);
  let pD = dm.pDamage;
  let eD = dm.eDamage;
  dm = applyCentraleOverdriveDamage(
    battleLog,
    field.name,
    overdriveThreshold,
    pFocusUsed,
    eFocusUsed,
    pD,
    eD
  );
  pD = dm.pDamage;
  eD = dm.eDamage;

  let damageDealt = winner === 'player' ? pD : eD;
  damageDealt = applyCanyonWinnerDamageBonus(battleLog, field.name, damageDealt);

  const aftermath = applyBattlefieldRoundAftermath({
    field,
    winner,
    damageDealt,
    pHPCurrent,
    eHPCurrent,
    pFCCurrent,
    eFCCurrent,
    battleLog,
  });

  return {
    pDamage: pD,
    eDamage: eD,
    damageDealt,
    finalPlayerHP: aftermath.pHPCurrent,
    finalEnemyHP: aftermath.eHPCurrent,
    finalPlayerFC: aftermath.pFCCurrent - selectedFocus,
    finalEnemyFC: aftermath.eFCCurrent - enemySelectedFocus,
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
  pBonusCopied,
  eBonusCopied,
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

  return {
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
    playerBonusCopied: pBonusCopied,
    enemyBonusCopied: eBonusCopied,
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
    field,
    fieldIndex: currentFieldIndex,
    winnerArmy: winner === 'player' ? pAgent.army : eAgent.army,
    playerToxinActivated,
    enemyToxinActivated,
  };
}
