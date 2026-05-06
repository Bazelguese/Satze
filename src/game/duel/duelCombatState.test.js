import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDuelCombatState, pickPostBattleFields } from './duelCombatState.js';

test('createDuelCombatState copia il duello e azzera il tracking', () => {
  const duel = {
    pPower: 3,
    ePower: 4,
    pDamage: 2,
    eDamage: 2,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pHPCurrent: 20,
    eHPCurrent: 18,
    pFCCurrent: 5,
    eFCCurrent: 5,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pImmune: false,
    eImmune: false,
  };
  const s = createDuelCombatState(duel);
  assert.equal(s.pPower, 3);
  assert.equal(s.ePower, 4);
  assert.equal(s.pHPCurrent, 20);
  assert.equal(s.pMinAssault, null);
  assert.equal(s.eMinAssault, null);
  assert.equal(s.pAbilityCopied, null);
  assert.equal(s.eAbilityCopied, null);
  assert.equal(s.pBonusCopied, null);
  assert.equal(s.eBonusCopied, null);
  assert.equal(s.playerToxinActivated, null);
  assert.equal(s.enemyToxinActivated, null);
});

test('pickPostBattleFields legge i campi aggiornati su state', () => {
  const duel = {
    pPower: 1,
    ePower: 1,
    pDamage: 1,
    eDamage: 1,
    pFocusUsed: 1,
    eFocusUsed: 1,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pHPCurrent: 10,
    eHPCurrent: 10,
    pFCCurrent: 2,
    eFCCurrent: 2,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pImmune: false,
    eImmune: false,
  };
  const s = createDuelCombatState(duel);
  s.pDamage = 7;
  s.pPower = 9;
  const pb = pickPostBattleFields(s);
  assert.equal(pb.pDamage, 7);
  assert.equal(pb.pPower, 9);
});
