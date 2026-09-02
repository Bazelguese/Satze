import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyInversionFieldFinalization } from './duelInversionFinalization.js';
import { computeFieldStatDeltas } from './duelFieldStatTracking.js';

test('applyInversionFieldFinalization: inverte malus campo −1 POT, −3 VA', () => {
  const state = {
    pPower: 2,
    pAssaultMod: -3,
    pDamage: 2,
    pModifierInversion: true,
    ePower: 3,
    eAssaultMod: -3,
    eDamage: 3,
    eModifierInversion: false,
  };
  const fieldStatDeltas = computeFieldStatDeltas(
    { pPower: 3, pDamage: 2, pAssaultMod: 0, ePower: 4, eDamage: 3, eAssaultMod: 0 },
    { pPower: 2, pDamage: 2, pAssaultMod: -3, ePower: 3, eDamage: 3, eAssaultMod: -3 }
  );
  const log = [];
  const changed = applyInversionFieldFinalization(state, fieldStatDeltas, log, 'Undicesima Megalopoli');

  assert.equal(changed, true);
  assert.equal(state.pPower, 4);
  assert.equal(state.pAssaultMod, 3);
  assert.equal(state.ePower, 3);
  assert.equal(state.eAssaultMod, -3);
  assert.ok(log.some((line) => line.includes('Inversione')));
});

test('applyInversionFieldFinalization: inverte buff campo +1 POT', () => {
  const state = {
    pPower: 4,
    pAssaultMod: 0,
    pDamage: 2,
    pModifierInversion: true,
    ePower: 4,
    eAssaultMod: 0,
    eDamage: 2,
    eModifierInversion: false,
  };
  const fieldStatDeltas = computeFieldStatDeltas(
    { pPower: 3, pDamage: 2, pAssaultMod: 0, ePower: 3, eDamage: 2, eAssaultMod: 0 },
    { pPower: 4, pDamage: 2, pAssaultMod: 0, ePower: 4, eDamage: 2, eAssaultMod: 0 }
  );
  applyInversionFieldFinalization(state, fieldStatDeltas, [], 'Campo');
  assert.equal(state.pPower, 2);
});

test('applyInversionFieldFinalization: nessun effetto se invertible=false (swap campo)', () => {
  const state = {
    pPower: 2,
    pAssaultMod: 0,
    pDamage: 3,
    pModifierInversion: true,
    ePower: 3,
    eAssaultMod: 0,
    eDamage: 2,
    eModifierInversion: false,
  };
  const fieldStatDeltas = {
    player: { power: -1, damage: 1, assaultMod: 0 },
    enemy: { power: 1, damage: -1, assaultMod: 0 },
    invertible: false,
  };
  const changed = applyInversionFieldFinalization(state, fieldStatDeltas, [], 'Specchio');
  assert.equal(changed, false);
  assert.equal(state.pPower, 2);
});
