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

test('copyBonus sostituisce anche con trigger nemico non attivo in pre-duello', () => {
  const calls = [];
  const applyEffect = (effect, value, target, source, log, opt) => {
    calls.push({ effect, value, target });
  };
  const state = { pBonusCopied: null, eBonusCopied: null, pCopiedBonusNotTriggered: false };
  const applyBonusEffects = createApplyBonusEffects({
    applyEffect,
    fieldOptions: {},
    checkTrigger,
    copyDisabled: false,
    state,
    pArmyBonus: { trigger: null, effects: [{ effect: 'copyBonus' }] },
    eArmyBonus: {
      trigger: 'conquest',
      description: 'Conquista: +2 FC',
      effects: [{ effect: 'focusCoin', value: 2 }],
    },
    pHasBonus: true,
    eHasBonus: true,
  });
  const log = [];
  applyBonusEffects(
    { trigger: null, effects: [{ effect: 'copyBonus' }] },
    'player',
    {},
    'Bonus Corte Rossa',
    log,
    false,
    true
  );
  assert.ok(state.pBonusCopied);
  assert.equal(state.pBonusCopied.description, 'Conquista: +2 FC');
  assert.equal(state.pCopiedBonusNotTriggered, true);
  assert.equal(calls.length, 0);
  assert.ok(log.some((line) => line.includes('Copia Bonus nemico')));
});
