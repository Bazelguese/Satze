import test from 'node:test';
import assert from 'node:assert/strict';

import { ARMY_ENTRY, resolveArmyEntrySlug } from '../../lib/eminenzaEntry.js';

test('ingresso: risolve i nomi canonici del catalogo', () => {
  assert.equal(resolveArmyEntrySlug('Apex'), 'apex');
  assert.equal(resolveArmyEntrySlug('Patto degli Indocili'), 'indocili');
  assert.equal(resolveArmyEntrySlug("Figli dell'Orizzonte"), 'orizzonte');
  assert.equal(resolveArmyEntrySlug('Ratti della Megera'), 'ratti');
  assert.equal(resolveArmyEntrySlug("L'Enclave delle Scaglie"), 'enclave');
  assert.equal(resolveArmyEntrySlug('Corte Rossa'), 'corte');
  assert.equal(resolveArmyEntrySlug('Calibri Pesanti'), 'calibri');
});

test('ingresso: accetta anche gli slug brevi del pacchetto DS', () => {
  assert.equal(resolveArmyEntrySlug('Indocili'), 'indocili');
  assert.equal(resolveArmyEntrySlug('Orizzonte'), 'orizzonte');
  assert.equal(resolveArmyEntrySlug('Enclave'), 'enclave');
});

test('ingresso: fallback ad apex se sconosciuta', () => {
  assert.equal(resolveArmyEntrySlug(null), 'apex');
  assert.equal(resolveArmyEntrySlug('Ignota'), 'apex');
});

test('ingresso: copre tutte le armate con entry dedicata', () => {
  const slugs = [...new Set(Object.values(ARMY_ENTRY))].sort();
  assert.deepEqual(slugs, [
    'apex', 'calibri', 'corte', 'enclave', 'indocili', 'kethran',
    'khemet', 'mascarada', 'mounthborn', 'orathai', 'orizzonte', 'ratti',
  ]);
});
