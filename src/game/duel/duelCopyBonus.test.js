import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCopiedBonusEffectsIfReady,
  registerCopiedBonus,
} from './duelCopyBonus.js';

test('Copia Bonus: sostituisce sempre, anche se trigger nemico non attivo', () => {
  const state = { pBonusCopied: null, eBonusCopied: null, pCopiedBonusNotTriggered: false };
  const enemyBonus = {
    trigger: 'conquest',
    description: 'Conquista: +2 FC',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  registerCopiedBonus(state, 'player', enemyBonus, { context: {}, fieldOptions: {} });
  assert.deepEqual(state.pBonusCopied, enemyBonus);
  assert.equal(state.pCopiedBonusNotTriggered, true);
});

test('Copia Bonus da Potere: sostituisce lo slot Potere, non il Bonus armata', () => {
  const state = {
    pBonusCopied: null,
    eBonusCopied: null,
    pAbilityCopied: null,
    pCopiedAbilityNotTriggered: false,
    pCopiedBonusNotTriggered: false,
  };
  const enemyBonus = {
    trigger: 'conquest',
    description: 'Conquista: +2 FC',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  registerCopiedBonus(state, 'player', enemyBonus, {
    context: {},
    fieldOptions: {},
    replaceSlot: 'ability',
  });
  assert.equal(state.pBonusCopied, null);
  assert.equal(state.pAbilityCopied?.effect, 'copiedArmyBonus');
  assert.equal(state.pAbilityCopied?.displayText, 'Conquista: +2 FC');
  assert.equal(state.pAbilityCopied?.sourceBonus, enemyBonus);
  assert.equal(state.pCopiedAbilityNotTriggered, true);
});

test('Copia Bonus: trigger pre-duello attivo → copia considerata attiva', () => {
  const state = { pBonusCopied: null, eBonusCopied: null, pCopiedBonusNotTriggered: false };
  const enemyBonus = {
    trigger: null,
    description: '-5 VA nem.',
    effects: [{ effect: 'enemyAssault', value: -5 }],
  };
  registerCopiedBonus(state, 'player', enemyBonus, { context: {}, fieldOptions: {} });
  assert.equal(state.pCopiedBonusNotTriggered, false);
});

test('Copia Bonus: effetti post-duello differiti senza won nel contesto', () => {
  const calls = [];
  const applyEffect = (effect) => calls.push(effect);
  const enemyBonus = {
    trigger: 'conquest',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  applyCopiedBonusEffectsIfReady(
    enemyBonus,
    'player',
    { won: undefined },
    'Bonus',
    [],
    applyEffect,
    {}
  );
  assert.equal(calls.length, 0);
});

test('Copia Bonus: bonus sempre attivo applicato subito', () => {
  const calls = [];
  const applyEffect = (effect, value) => calls.push({ effect, value });
  const enemyBonus = {
    trigger: null,
    effects: [{ effect: 'enemyAssault', value: -5, minAssault: 6 }],
  };
  applyCopiedBonusEffectsIfReady(
    enemyBonus,
    'player',
    {},
    'Bonus',
    [],
    applyEffect,
    {}
  );
  assert.deepEqual(calls, [{ effect: 'enemyAssault', value: -5 }]);
});

test('Copia Bonus: Conquista non applicata in fase pre-duello anche con won nel contesto', () => {
  const calls = [];
  const applyEffect = (effect) => calls.push(effect);
  const enemyBonus = {
    trigger: 'conquest',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  applyCopiedBonusEffectsIfReady(
    enemyBonus,
    'player',
    { won: true },
    'Bonus',
    [],
    applyEffect,
    {}
  );
  assert.equal(calls.length, 0);
});
