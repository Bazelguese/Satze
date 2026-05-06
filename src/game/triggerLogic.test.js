import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTrigger } from './triggerLogic.js';

const base = { fieldModifiers: {} };

test('reckoning: false su 1° e 2° duello (contatori 1–2)', () => {
  assert.equal(
    checkTrigger('reckoning', { ...base, cardsPlayed: 1, enemyCardsPlayed: 1 }),
    false
  );
  assert.equal(
    checkTrigger('reckoning', { ...base, cardsPlayed: 2, enemyCardsPlayed: 2 }),
    false
  );
});

test('reckoning: true dal 3° duello (contatori ≥ 3)', () => {
  assert.equal(
    checkTrigger('reckoning', { ...base, cardsPlayed: 3, enemyCardsPlayed: 3 }),
    true
  );
});
