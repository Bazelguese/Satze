import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getInitiativeSideOrder } from './duelInitiativeOrder.js';
import { applyDuelMainAbilities } from './duelMainAbilities.js';
import { applyDuelArmyBonusPhases } from './duelArmyBonusPhases.js';
import { canTriggerAbility } from './duelHelpers.js';

test('getInitiativeSideOrder: player first', () => {
  assert.deepEqual(getInitiativeSideOrder(true), ['player', 'enemy']);
});

test('getInitiativeSideOrder: enemy first', () => {
  assert.deepEqual(getInitiativeSideOrder(false), ['enemy', 'player']);
});

const baseCtx = { roundNumber: 1, fieldModifiers: {} };

function runMain(state, pAgent, eAgent, isPlayerFirst) {
  const calls = [];
  const applyEffect = (effect, value, target) => {
    calls.push({ effect, target });
  };
  applyDuelMainAbilities({
    state,
    pAgent,
    eAgent,
    applyEffect,
    battleLog: [],
    playerContext: baseCtx,
    enemyContext: baseCtx,
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
    fieldOptions: {},
    isPlayerFirst,
  });
  return calls;
}

test('poteri: isPlayerFirst true → player prima di enemy', () => {
  const calls = runMain(
    { pAbilityBlocked: false, eAbilityBlocked: false },
    { name: 'A', ability: { trigger: 'turbo', effect: 'power', value: 1 } },
    { name: 'B', ability: { trigger: 'turbo', effect: 'damage', value: 1 } },
    true
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].target, 'player');
  assert.equal(calls[1].target, 'enemy');
});

test('poteri: isPlayerFirst false → enemy prima di player', () => {
  const calls = runMain(
    { pAbilityBlocked: false, eAbilityBlocked: false },
    { name: 'A', ability: { trigger: 'turbo', effect: 'power', value: 1 } },
    { name: 'B', ability: { trigger: 'turbo', effect: 'damage', value: 1 } },
    false
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].target, 'enemy');
  assert.equal(calls[1].target, 'player');
});

test('bonus armata: ordine per iniziativa', () => {
  const calls = [];
  const applyBonusEffects = (bonus, target, context, source, log, onlyOwn, onlyEnemy) => {
    calls.push({ target, onlyOwn, onlyEnemy });
  };
  const bonus = { trigger: 'turbo', effects: [{ effect: 'power', value: 1 }] };

  applyDuelArmyBonusPhases({
    state: { pBonusBlocked: false, eBonusBlocked: false },
    pHasBonus: true,
    eHasBonus: true,
    pArmyBonus: bonus,
    eArmyBonus: bonus,
    pAgent: { army: 'P' },
    eAgent: { army: 'E' },
    playerContext: baseCtx,
    enemyContext: baseCtx,
    battleLog: [],
    applyBonusEffects,
    checkTrigger: () => true,
    isPlayerFirst: false,
  });

  assert.equal(calls.length, 4);
  assert.equal(calls[0].target, 'enemy');
  assert.equal(calls[2].target, 'player');
});
