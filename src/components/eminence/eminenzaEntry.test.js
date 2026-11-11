import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARMY_ENTRY,
  EMINENCE_ENTRY_STYLE_BY_ID,
  EMINENCE_ENTRY_STYLE_DEFAULT,
  EMINENCE_ENTRY_STYLES,
  resolveArmyEntrySlug,
  resolveEminenceEntryStyle,
} from '../../lib/eminenzaEntry.js';
import { EMINENCES } from '../../data/eminences.js';

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

test('stile ingresso: override valido, poi scelta per Eminenza, poi default', () => {
  assert.equal(resolveEminenceEntryStyle('x', 'campo'), 'campo');
  assert.equal(resolveEminenceEntryStyle('x', 'agenti'), 'agenti');
  assert.equal(resolveEminenceEntryStyle('x', 'boh'), EMINENCE_ENTRY_STYLE_DEFAULT);
  assert.equal(resolveEminenceEntryStyle(null), EMINENCE_ENTRY_STYLE_DEFAULT);
});

test('stile ingresso: le scelte per Eminenza puntano a id e stili esistenti', () => {
  const styles = new Set(Object.values(EMINENCE_ENTRY_STYLES));
  for (const [id, style] of Object.entries(EMINENCE_ENTRY_STYLE_BY_ID)) {
    assert.ok(EMINENCES[id], `Eminenza sconosciuta: ${id}`);
    assert.ok(styles.has(style), `stile sconosciuto per ${id}: ${style}`);
  }
});
