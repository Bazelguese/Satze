import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createLabSession,
  labOpenRound,
  labChooseAbilities,
  labAdvanceGate,
  labSettle,
  sessionView,
  listLabEminences,
  auditImplementedStandards,
} from './eminenceSystemLabLogic.js';

test('system lab: lista implementate non vuota', () => {
  const list = listLabEminences();
  assert.ok(list.length >= 2);
  assert.ok(list.every((entry) => entry.abilities.length >= 1));
});

test('system lab: pipeline Apex vs Semaforo fino al settle', () => {
  let session = createLabSession({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    roundNumber: 3,
  });
  session = labOpenRound(session);
  assert.equal(session.error, null);
  session = labChooseAbilities(session, {
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_giallo',
  });
  assert.equal(session.error, null);

  session = labAdvanceGate(session);
  assert.equal(session.error, null);
  session = labAdvanceGate(session);
  assert.equal(session.error, null);
  session = labAdvanceGate(session);
  assert.equal(session.error, null);

  session = labSettle(session, { winner: 'player' });
  assert.equal(session.error, null);

  const view = sessionView(session);
  assert.equal(view.phase, 'settled');
  assert.ok(view.history.length >= 5);
});

test('system lab: audit restituisce una riga per Eminenza', () => {
  const rows = auditImplementedStandards();
  assert.equal(rows.length, listLabEminences().length);
});
