import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_BATTLEFIELDS,
  BATTLEFIELD_TEMA_TO_ANIMATION,
  getBattlefieldAnimationType,
  getBattlefieldEntranceTheme,
} from './battlefields.js';

test('campi generico usano animazione default', () => {
  assert.equal(getBattlefieldAnimationType(1), 'default');
  assert.equal(getBattlefieldAnimationType(51), 'default');
  assert.equal(getBattlefieldEntranceTheme(1), 'default');
});

test('armate con mappa dedicata usano animazione tematica', () => {
  for (const field of ALL_BATTLEFIELDS) {
    const expected = BATTLEFIELD_TEMA_TO_ANIMATION[field.tema];
    if (!expected) continue;
    assert.equal(
      getBattlefieldAnimationType(field.id),
      expected,
      `campo ${field.id} (${field.name}) tema "${field.tema}"`
    );
  }
});

test('Enclave, Ratti, Patto, Khemet, Apex → animazioni dedicate', () => {
  assert.equal(getBattlefieldAnimationType(60), 'occhio');
  assert.equal(getBattlefieldAnimationType(70), 'sciame');
  assert.equal(getBattlefieldAnimationType(74), 'rivolta');
  assert.equal(getBattlefieldAnimationType(79), 'cerchi');
  assert.equal(getBattlefieldAnimationType(84), 'artigli');
  assert.equal(getBattlefieldAnimationType(88), 'artigli');
});

test('esempi armate con animazione attiva', () => {
  assert.equal(getBattlefieldAnimationType(22), 'frammenti');
  assert.equal(getBattlefieldAnimationType(19), 'swirl');
  assert.equal(getBattlefieldAnimationType(25), 'sipario');
  assert.equal(getBattlefieldAnimationType(44), 'hud');
  assert.equal(getBattlefieldAnimationType(58), 'onda');
  assert.equal(getBattlefieldAnimationType(49), 'morsi');
});

test('id inesistente → default', () => {
  assert.equal(getBattlefieldAnimationType(999), 'default');
});
