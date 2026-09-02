import test from 'node:test';
import assert from 'node:assert/strict';

import { SIDES } from './eminenceConstants.js';
import {
  appendSlotCurse,
  applySlotCursesToDuel,
  cloneSlotCurses,
  collectSlotCurses,
  createEmptySlotCurseStatDeltas,
  mergeSlotCurseCounts,
  slotCurseStatDelta,
} from './slotCurses.js';

test('slot: lo 0 è uno slot valido e il clone non condivide i delta', () => {
  const stored = appendSlotCurse({}, 0, { deltas: { power: -1 }, leagueScaled: false, source: 'a' });
  assert.equal(stored['0'].length, 1);

  const cloned = cloneSlotCurses(stored);
  cloned['0'][0].deltas.power = 0;
  assert.equal(stored['0'][0].deltas.power, -1);
});

test('slot: senza indice la maledizione non viene scritta', () => {
  assert.deepEqual(appendSlotCurse({}, null, { leagueScaled: true }), {});
  assert.deepEqual(appendSlotCurse({ 1: [] }, undefined, { leagueScaled: true }), { 1: [] });
});

test('slot: −VA scala sulla Lega effettiva e si accumula', () => {
  const scaled = slotCurseStatDelta({ leagueScaled: true, deltas: {} }, 4);
  assert.equal(scaled.assaultValue, -4);
  assert.equal(scaled.power, 0);

  const flat = slotCurseStatDelta({ deltas: { power: -1, damage: -1, assaultValue: -1 } }, 9);
  assert.deepEqual(flat, { power: -1, damage: -1, assaultValue: -1 });

  const stacked = appendSlotCurse(
    appendSlotCurse({}, 2, { leagueScaled: true }),
    2,
    { deltas: { power: -1, damage: -1, assaultValue: -1 } },
  );
  assert.equal(stacked['2'].length, 2);
});

test('slot: le maledizioni di entrambi i lati colpiscono lo stesso indice', () => {
  const matchState = {
    [SIDES.PLAYER]: { persistent: { slotCurses: appendSlotCurse({}, 1, { leagueScaled: true }) } },
    [SIDES.ENEMY]: { persistent: { slotCurses: appendSlotCurse({}, 1, { deltas: { power: -1 } }) } },
  };
  assert.equal(collectSlotCurses(matchState, 1).length, 2);
  assert.equal(collectSlotCurses(matchState, 0).length, 0);
  assert.deepEqual(mergeSlotCurseCounts(
    matchState[SIDES.PLAYER].persistent.slotCurses,
    matchState[SIDES.ENEMY].persistent.slotCurses,
  ), { 1: 2 });
});

test('slot: l\'applicazione al duello è simmetrica e usa la Lega di ciascun lato', () => {
  const duel = { pPower: 5, pDamage: 3, pAssaultMod: 0, ePower: 5, eDamage: 3, eAssaultMod: 0 };
  applySlotCursesToDuel(duel, [{ leagueScaled: true, deltas: {} }], { player: 3, enemy: 5 });
  assert.equal(duel.pAssaultMod, -3);
  assert.equal(duel.eAssaultMod, -5);
  assert.equal(duel.pPower, 5);
  assert.equal(duel.ePower, 5);
});

test('slot: traccia i delta per finalizzazione Immune retroattiva', () => {
  const duel = { pPower: 5, pDamage: 3, pAssaultMod: 0, ePower: 5, eDamage: 3, eAssaultMod: 0 };
  const tracked = createEmptySlotCurseStatDeltas();
  applySlotCursesToDuel(
    duel,
    [{ deltas: { power: -1, damage: -1, assaultValue: -1 } }],
    { player: 2, enemy: 2 },
    tracked,
  );
  assert.deepEqual(tracked.player, { power: -1, damage: -1, assaultMod: -1 });
  assert.deepEqual(tracked.enemy, { power: -1, damage: -1, assaultMod: -1 });
});
