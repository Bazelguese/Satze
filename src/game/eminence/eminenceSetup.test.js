import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMatchEminenceState,
  resolveEminenceFormat,
  resolveSideEminence,
} from './eminenceSetup.js';
import { EMINENCE_FORMAT, SIDES } from './eminenceConstants.js';
import { isEminenceSubsystemEnabled } from './eminenceState.js';

const deckOf = (army, count) => Array.from({ length: count }, (_, i) => ({ id: `${army}-${i}`, army }));
const APEX_DECK = deckOf('Apex', 10);
const SPLIT_DECK = [...deckOf('Apex', 5), ...deckOf('Patto degli Indocili', 5)];

test('formato: il default disattiva il sottosistema', () => {
  assert.equal(resolveEminenceFormat(null), EMINENCE_FORMAT.DISABLED);
  assert.equal(resolveEminenceFormat({}), EMINENCE_FORMAT.DISABLED);
  assert.equal(
    resolveEminenceFormat({ eminenceFormat: EMINENCE_FORMAT.REQUIRED }),
    EMINENCE_FORMAT.REQUIRED
  );
});

test('formato disattivato: nessuna Eminenza viene risolta', () => {
  const resolution = resolveSideEminence(APEX_DECK, 'apex_sole_verde', EMINENCE_FORMAT.DISABLED);
  assert.equal(resolution.eminenceId, null);

  const { matchState } = createMatchEminenceState({
    format: EMINENCE_FORMAT.DISABLED,
    playerDeck: APEX_DECK,
    enemyDeck: APEX_DECK,
  });
  assert.equal(isEminenceSubsystemEnabled(matchState), false);
});

test('scelta registrata: viene rispettata se il mazzo la rende eleggibile', () => {
  const resolution = resolveSideEminence(SPLIT_DECK, 'patto_grande_semaforo');
  assert.equal(resolution.eminenceId, 'patto_grande_semaforo');
  assert.equal(resolution.derived, false);
  assert.equal(resolution.ambiguous, false);
});

test('scelta registrata: rifiutata se l\'Armata non è eleggibile', () => {
  const resolution = resolveSideEminence(APEX_DECK, 'patto_grande_semaforo');
  assert.equal(resolution.eminenceId, null);
  assert.equal(resolution.reason, 'ARMY_NOT_ELIGIBLE');
});

test('deduzione: mazzo mono-Armata ha una risposta univoca', () => {
  const resolution = resolveSideEminence(APEX_DECK, null);
  assert.equal(resolution.eminenceId, 'apex_sole_verde');
  assert.equal(resolution.derived, true);
  assert.equal(resolution.ambiguous, false);
});

test('deduzione: un 5-5 resta ambiguo e lo dichiara', () => {
  const resolution = resolveSideEminence(SPLIT_DECK, null);
  assert.equal(resolution.ambiguous, true);
  assert.equal(resolution.candidates.length, 2);
  // Deterministico: due avvii con lo stesso mazzo non devono divergere.
  assert.equal(resolveSideEminence(SPLIT_DECK, null).eminenceId, resolution.eminenceId);
});

test('nessuna Armata eleggibile: il lato resta senza Eminenza con motivo esplicito', () => {
  const resolution = resolveSideEminence([...deckOf('Apex', 4), ...deckOf('Khemet', 4)], null);
  assert.equal(resolution.eminenceId, null);
  assert.equal(resolution.reason, 'NO_ELIGIBLE_ARMY');
});

test('setup completo: i due lati ricevono la propria Eminenza e la Presenza iniziale', () => {
  const { matchState } = createMatchEminenceState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerDeck: APEX_DECK,
    enemyDeck: deckOf('Patto degli Indocili', 10),
  });

  assert.equal(isEminenceSubsystemEnabled(matchState), true);
  assert.equal(matchState[SIDES.PLAYER].eminenceId, 'apex_sole_verde');
  assert.equal(matchState[SIDES.PLAYER].presence, 3);
  assert.equal(matchState[SIDES.ENEMY].eminenceId, 'patto_grande_semaforo');
  assert.equal(matchState[SIDES.ENEMY].presence, 0);
});
