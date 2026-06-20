import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCopiedBonusEffectsIfReady,
  registerCopiedBonus,
} from './duelCopyBonus.js';

test('Copia Bonus: sostituisce sempre, anche se trigger nemico non attivo', () => {
  const state = { pBonusCopied: null, eBonusCopied: null };
  const enemyBonus = {
    trigger: 'conquest',
    description: 'Conquista: +2 FC',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  registerCopiedBonus(state, 'player', enemyBonus);
  assert.deepEqual(state.pBonusCopied, enemyBonus);
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
