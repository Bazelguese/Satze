import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApplyBonusEffects } from './duelBonusEffects.js';
import { checkTrigger } from '../triggerLogic.js';

test('fase onlyOwnEffects applica solo effetti propri, non enemyPower', () => {
  const calls = [];
  const applyEffect = (effect, value, target, source, log, opt) => {
    calls.push({ effect, value, target });
  };
  const state = {
    pBonusCopied: null,
    eBonusCopied: null,
  };
  const applyBonusEffects = createApplyBonusEffects({
    applyEffect,
    fieldOptions: {},
    checkTrigger,
    copyDisabled: false,
    state,
    pArmyBonus: null,
    eArmyBonus: null,
    pHasBonus: true,
    eHasBonus: false,
  });
  const bonus = {
    trigger: null,
    description: 'test',
    effects: [
      { effect: 'power', value: 1 },
      { effect: 'enemyPower', value: -1 },
    ],
  };
  applyBonusEffects(bonus, 'player', {}, 'Bonus', [], true, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].effect, 'power');
});

test('modalità legacy applica enemyPower', () => {
  const calls = [];
  const applyEffect = (effect, value, target, source, log, opt) => {
    calls.push(effect);
  };
  const state = { pBonusCopied: null, eBonusCopied: null };
  const applyBonusEffects = createApplyBonusEffects({
    applyEffect,
    fieldOptions: {},
    checkTrigger,
    copyDisabled: false,
    state,
    pArmyBonus: null,
    eArmyBonus: null,
    pHasBonus: true,
    eHasBonus: false,
  });
  const bonus = {
    trigger: null,
    description: 'test',
    effects: [{ effect: 'enemyPower', value: -1 }],
  };
  applyBonusEffects(bonus, 'player', {}, 'Bonus', [], false, false);
  assert.deepEqual(calls, ['enemyPower']);
});
