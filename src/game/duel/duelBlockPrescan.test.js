import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelBlockPrescan } from './duelBlockPrescan.js';
import { createDuelCombatState } from './duelCombatState.js';
import { canTriggerAbility } from './duelHelpers.js';

function baseDuel() {
  return {
    pPower: 1,
    ePower: 1,
    pDamage: 1,
    eDamage: 1,
    pFocusUsed: 1,
    eFocusUsed: 1,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pHPCurrent: 20,
    eHPCurrent: 20,
    pFCCurrent: 3,
    eFCCurrent: 3,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pImmune: false,
    eImmune: false,
  };
}

test('TU blockAbility → eAbilityBlocked', () => {
  const state = createDuelCombatState(baseDuel());
  const battleLog = [];
  applyDuelBlockPrescan({
    blockDisabled: false,
    fieldName: 'Campo',
    pAgent: { name: 'P', army: 'circolo', ability: { effect: 'blockAbility', trigger: null } },
    eAgent: { name: 'E', army: 'legione' },
    state,
    battleLog,
    playerContext: {},
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
  });
  assert.equal(state.eAbilityBlocked, true);
  assert.equal(state.pAbilityBlocked, false);
});

test('IA blockBonus → pBonusBlocked', () => {
  const state = createDuelCombatState(baseDuel());
  const battleLog = [];
  applyDuelBlockPrescan({
    blockDisabled: false,
    fieldName: 'Campo',
    pAgent: { name: 'P', army: 'circolo' },
    eAgent: { name: 'E', army: 'legione', ability: { effect: 'blockBonus', trigger: null } },
    state,
    battleLog,
    playerContext: {},
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
  });
  assert.equal(state.pBonusBlocked, true);
  assert.equal(state.eBonusBlocked, false);
});

test('blockDisabled: log avviso per blocco TU, nessuno stato bloccato', () => {
  const state = createDuelCombatState(baseDuel());
  const battleLog = [];
  applyDuelBlockPrescan({
    blockDisabled: true,
    fieldName: 'Biblioteca',
    pAgent: { name: 'P', army: 'x', ability: { effect: 'blockAbility', trigger: null } },
    eAgent: { name: 'E', army: 'y' },
    state,
    battleLog,
    playerContext: {},
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
  });
  assert.equal(state.eAbilityBlocked, false);
  assert.ok(battleLog.some((l) => l.includes('Biblioteca') && l.includes('Blocco')));
});
