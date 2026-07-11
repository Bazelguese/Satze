import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDuelDamageAftermathAndFcAdjust, buildDuelBattleResult } from './duelResolutionFinish.js';

test('runDuelDamageAftermathAndFcAdjust: vincitore player, danno e FC finali', () => {
  const log = [];
  const r = runDuelDamageAftermathAndFcAdjust({
    battleLog: log,
    field: { name: 'Neutro' },
    winner: 'player',
    maxDamage: null,
    overdriveThreshold: 5,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pDamage: 4,
    eDamage: 2,
    pHPCurrent: 20,
    eHPCurrent: 12,
    pFCCurrent: 8,
    eFCCurrent: 8,
    selectedFocus: 2,
    enemySelectedFocus: 2,
  });
  assert.equal(r.damageDealt, 4);
  assert.equal(r.finalEnemyHP, 8);
  assert.equal(r.finalPlayerFC, 6);
  assert.equal(r.finalEnemyFC, 6);
});

test('runDuelDamageAftermathAndFcAdjust: Canyon · Ultimo Desiderio −2 PV al perdente', () => {
  const log = [];
  const r = runDuelDamageAftermathAndFcAdjust({
    battleLog: log,
    field: { id: 11, name: 'Canyon delle Lame' },
    winner: 'player',
    maxDamage: null,
    overdriveThreshold: 5,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pDamage: 3,
    eDamage: 2,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 8,
    eFCCurrent: 8,
    selectedFocus: 0,
    enemySelectedFocus: 0,
  });
  assert.equal(r.damageDealt, 3);
  assert.equal(r.finalEnemyHP, 5);
  assert.ok(log.some((l) => l.includes('Ultimo Desiderio')));
});

test('buildDuelBattleResult: shape minimo', () => {
  const assault = {
    pAssault: 10,
    eAssault: 5,
    pAssaultRaw: 10,
    eAssaultRaw: 5,
    pMinFinal: 3,
    eMinFinal: 2,
    pAssaultBase: 10,
    eAssaultBase: 5,
    pPowerAfterEffects: 5,
    ePowerAfterEffects: 4,
    pAssaultAfterFocus: 10,
    eAssaultAfterFocus: 5,
  };
  const br = buildDuelBattleResult({
    winner: 'player',
    pAgent: { name: 'P', army: 'A' },
    eAgent: { name: 'E', army: 'B' },
    assault,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pPower: 5,
    ePower: 4,
    pDamage: 3,
    eDamage: 2,
    pFocusUsed: 2,
    eFocusUsed: 2,
    finalPHasBonus: true,
    finalEHasBonus: false,
    pArmyBonusActive: true,
    eArmyBonusActive: false,
    finalPAbilityTriggered: false,
    finalEAbilityTriggered: false,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pAbilityCopied: null,
    eAbilityCopied: null,
    pCopiedAbilityNotTriggered: false,
    eCopiedAbilityNotTriggered: false,
    pBonusCopied: null,
    eBonusCopied: null,
    pCopiedBonusNotTriggered: false,
    eCopiedBonusNotTriggered: false,
    pAbilityNotTriggered: false,
    eAbilityNotTriggered: false,
    pBonusNotTriggered: false,
    eBonusNotTriggered: false,
    damageDealt: 3,
    finalPlayerHP: 20,
    finalEnemyHP: 7,
    finalPlayerFC: 5,
    finalEnemyFC: 5,
    battleLog: [],
    phaseLogs: [],
    field: { name: 'X' },
    currentFieldIndex: 0,
    playerToxinActivated: null,
    enemyToxinActivated: null,
  });
  assert.equal(br.winnerArmy, 'A');
  assert.equal(br.fieldIndex, 0);
  assert.equal(br.playerAssault, 10);
  assert.equal(br.playerAssaultRaw, 10);
  assert.equal(br.playerAssaultMinFinal, 3);
  assert.equal(br.enemyAssaultRaw, 5);
  assert.equal(br.playerArmyBonusActive, true);
  assert.equal(br.enemyArmyBonusActive, false);
});
