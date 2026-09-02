import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyImmuneSlotCurseFinalization } from './duelImmuneSlotCurseFinalization.js';
import { createEmptySlotCurseStatDeltas } from '../eminence/slotCurses.js';

test('applyImmuneSlotCurseFinalization: annulla debuff maledizione slot per lato Immune', () => {
  const slotCurseStatDeltas = createEmptySlotCurseStatDeltas();
  slotCurseStatDeltas.player.assaultMod = -3;
  slotCurseStatDeltas.player.power = -1;
  slotCurseStatDeltas.player.damage = -1;
  slotCurseStatDeltas.enemy.assaultMod = -5;

  const state = {
    pPower: 4,
    pDamage: 2,
    pAssaultMod: -3,
    pImmune: true,
    ePower: 5,
    eDamage: 3,
    eAssaultMod: -5,
    eImmune: false,
  };
  const log = [];
  const changed = applyImmuneSlotCurseFinalization(state, slotCurseStatDeltas, log);

  assert.equal(changed, true);
  assert.equal(state.pPower, 5);
  assert.equal(state.pDamage, 3);
  assert.equal(state.pAssaultMod, 0);
  assert.equal(state.eAssaultMod, -5);
  assert.ok(log.some((line) => line.includes('Immune (Maledizione slot)')));
});

test('applyImmuneSlotCurseFinalization: Immune attivato dopo le maledizioni (retroattivo)', () => {
  const slotCurseStatDeltas = createEmptySlotCurseStatDeltas();
  slotCurseStatDeltas.player.assaultMod = -2;

  const state = {
    pPower: 5,
    pDamage: 3,
    pAssaultMod: -2,
    pImmune: true,
    ePower: 5,
    eDamage: 3,
    eAssaultMod: 0,
    eImmune: false,
  };

  applyImmuneSlotCurseFinalization(state, slotCurseStatDeltas, []);
  assert.equal(state.pAssaultMod, 0);
});

test('applyImmuneSlotCurseFinalization: senza Immune non modifica nulla', () => {
  const slotCurseStatDeltas = createEmptySlotCurseStatDeltas();
  slotCurseStatDeltas.player.power = -1;

  const state = {
    pPower: 4,
    pDamage: 3,
    pAssaultMod: 0,
    pImmune: false,
    ePower: 5,
    eDamage: 3,
    eAssaultMod: 0,
    eImmune: false,
  };

  const changed = applyImmuneSlotCurseFinalization(state, slotCurseStatDeltas, []);
  assert.equal(changed, false);
  assert.equal(state.pPower, 4);
});
