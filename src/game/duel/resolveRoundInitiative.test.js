import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoundInitiative } from './resolveRoundInitiative.js';

test('core: opening true → odd player, even enemy', () => {
  assert.equal(resolveRoundInitiative({ roundNumber: 1, openingPlayerFirst: true }), true);
  assert.equal(resolveRoundInitiative({ roundNumber: 2, openingPlayerFirst: true }), false);
  assert.equal(resolveRoundInitiative({ roundNumber: 3, openingPlayerFirst: true }), true);
  assert.equal(resolveRoundInitiative({ roundNumber: 4, openingPlayerFirst: true }), false);
  assert.equal(resolveRoundInitiative({ roundNumber: 5, openingPlayerFirst: true }), true);
});

test('core: opening false → odd enemy, even player', () => {
  assert.equal(resolveRoundInitiative({ roundNumber: 1, openingPlayerFirst: false }), false);
  assert.equal(resolveRoundInitiative({ roundNumber: 2, openingPlayerFirst: false }), true);
  assert.equal(resolveRoundInitiative({ roundNumber: 3, openingPlayerFirst: false }), false);
  assert.equal(resolveRoundInitiative({ roundNumber: 4, openingPlayerFirst: false }), true);
  assert.equal(resolveRoundInitiative({ roundNumber: 5, openingPlayerFirst: false }), false);
});

test('assault: player R1–R2, then enemy R3, player R4…', () => {
  const base = { openingPlayerFirst: true, initiativeProfile: 'assault' };
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 1 }), true);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 2 }), true);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 3 }), false);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 4 }), true);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 5 }), false);
});

test('defense: enemy R1–R2, then player R3, enemy R4…', () => {
  const base = { openingPlayerFirst: false, initiativeProfile: 'defense' };
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 1 }), false);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 2 }), false);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 3 }), true);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 4 }), false);
  assert.equal(resolveRoundInitiative({ ...base, roundNumber: 5 }), true);
});

test('idempotente: stesso round → stesso risultato (niente flip doppio)', () => {
  const args = { roundNumber: 3, openingPlayerFirst: false, initiativeProfile: null };
  assert.equal(resolveRoundInitiative(args), resolveRoundInitiative(args));
  assert.equal(resolveRoundInitiative(args), false);
});
