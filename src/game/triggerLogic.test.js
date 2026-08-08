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

test('alleato: false con solo la carta giocata della stessa Lega in mano iniziale', () => {
  assert.equal(checkTrigger('alleato', { ...base, playerInitialLeagueCount: 1 }), false);
});

test('alleato: true con 1+ altra carta della stessa Lega oltre alla carta giocata', () => {
  assert.equal(checkTrigger('alleato', { ...base, playerInitialLeagueCount: 2 }), true);
  assert.equal(checkTrigger('alleato', { ...base, playerInitialLeagueCount: 3 }), true);
});

test('rinforzi: false con meno di 2 altre carte della stessa Lega oltre alla carta giocata', () => {
  assert.equal(checkTrigger('rinforzi', { ...base, playerInitialLeagueCount: 1 }), false);
  assert.equal(checkTrigger('rinforzi', { ...base, playerInitialLeagueCount: 2 }), false);
});

test('rinforzi: true con 2+ altre carte della stessa Lega oltre alla carta giocata', () => {
  assert.equal(checkTrigger('rinforzi', { ...base, playerInitialLeagueCount: 3 }), true);
  assert.equal(checkTrigger('rinforzi', { ...base, playerInitialLeagueCount: 4 }), true);
});

test('overdriveDisabled: Overdrive non si attiva', () => {
  assert.equal(
    checkTrigger('overdrive', { ...base, focusCoins: 9, fieldModifiers: { overdriveDisabled: true } }),
    false
  );
});

test('conquestDisabled: Conquista non si attiva', () => {
  assert.equal(
    checkTrigger('conquest', { ...base, won: true, fieldModifiers: { conquestDisabled: true } }),
    false
  );
});
