import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDuelNexusMaxDamage,
  applyCentraleOverdriveDamage,
  applyCanyonWinnerDamageBonus,
} from './duelDamagePipeline.js';

test('applyDuelNexusMaxDamage: nessun cap se maxDamage null', () => {
  const log = [];
  const r = applyDuelNexusMaxDamage(log, null, 8, 9);
  assert.deepEqual(r, { pDamage: 8, eDamage: 9 });
  assert.equal(log.length, 0);
});

test('applyDuelNexusMaxDamage: entrambi sopra soglia', () => {
  const log = [];
  const r = applyDuelNexusMaxDamage(log, 4, 9, 6);
  assert.deepEqual(r, { pDamage: 4, eDamage: 4 });
  assert.equal(log.length, 2);
});

test('applyCentraleOverdriveDamage: ignora altri campi', () => {
  const log = [];
  const r = applyCentraleOverdriveDamage(log, 'Passo', 5, 5, 5, 3, 3);
  assert.deepEqual(r, { pDamage: 3, eDamage: 3 });
  assert.equal(log.length, 0);
});

test('applyCentraleOverdriveDamage: overdrive su Centrale Energetica', () => {
  const log = [];
  const r = applyCentraleOverdriveDamage(log, 'Centrale Energetica', 5, 5, 5, 2, 2);
  assert.deepEqual(r, { pDamage: 3, eDamage: 3 });
  assert.ok(log.some((l) => l.includes('Overdrive')));
});

test('applyCanyonWinnerDamageBonus: solo Canyon', () => {
  const log = [];
  assert.equal(applyCanyonWinnerDamageBonus(log, 'Neutro', 4), 4);
  assert.equal(applyCanyonWinnerDamageBonus(log, 'Canyon delle Lame', 3), 5);
  assert.ok(log.some((l) => l.includes('Canyon delle Lame')));
});
