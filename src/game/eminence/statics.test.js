// Statici: condizioni dichiarative, armamento a inizio round e operazioni sul tabellone.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EFFECT_TIMINGS, SIDES } from './eminenceConstants.js';
import { matchesCondition, createConditionContext } from './effectConditions.js';
import { applyFieldOperations } from './fieldOperations.js';
import { createEminenceMatchState } from './eminenceState.js';
import { beginEminenceRound, collectPendingEffects } from './eminenceRound.js';
import { openEminenceRound } from './eminenceDuelGate.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';

const APEX = 'apex_sole_verde';
const PATTO = 'patto_grande_semaforo';

const fixedRng = (value = 0) => () => value;

// ------------------------------------------------------------------
// Condizioni
// ------------------------------------------------------------------

test('condizione: assente equivale a sempre vera', () => {
  assert.equal(matchesCondition(null, {}), true);
  assert.equal(matchesCondition(undefined, { roundNumber: 1 }), true);
});

test('condizione: uguaglianza, appartenenza, intervallo e negazione', () => {
  assert.equal(matchesCondition({ roundNumber: 5 }, { roundNumber: 5 }), true);
  assert.equal(matchesCondition({ roundNumber: 5 }, { roundNumber: 4 }), false);

  assert.equal(matchesCondition({ winner: ['player', 'draw'] }, { winner: 'draw' }), true);
  assert.equal(matchesCondition({ winner: ['player', 'draw'] }, { winner: 'enemy' }), false);

  assert.equal(matchesCondition({ roundNumber: { min: 3 } }, { roundNumber: 5 }), true);
  assert.equal(matchesCondition({ roundNumber: { min: 3, max: 4 } }, { roundNumber: 5 }), false);

  assert.equal(matchesCondition({ winner: { not: 'draw' } }, { winner: 'player' }), true);
  assert.equal(matchesCondition({ winner: { not: 'draw' } }, { winner: 'draw' }), false);
});

test('condizione: più chiavi vanno soddisfatte tutte', () => {
  const context = { roundNumber: 5, winner: 'player' };
  assert.equal(matchesCondition({ roundNumber: 5, winner: 'player' }, context), true);
  assert.equal(matchesCondition({ roundNumber: 5, winner: 'enemy' }, context), false);
});

test('condizione: un termine ignoto al checkpoint fallisce in modo rumoroso', () => {
  // Restituire `false` renderebbe l'Eminenza inerte senza dire perché.
  assert.throws(() => matchesCondition({ winner: 'player' }, { roundNumber: 5 }), /non disponibile/);
});

test('condizione: roundNumber è sempre nel contesto di base', () => {
  assert.deepEqual(createConditionContext({ roundNumber: 4 }), { roundNumber: 4 });
  assert.equal(createConditionContext(null).roundNumber, null);
});

// ------------------------------------------------------------------
// Armamento degli Statici
// ------------------------------------------------------------------

test('statico: i segmenti vengono armati a ogni inizio round', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  const state = beginEminenceRound(base, { roundNumber: 1 });

  const armed = state.player.round.pendingEffects;
  assert.equal(armed.length, 1);
  assert.equal(armed[0].isStatic, true);
  assert.equal(armed[0].ownerSide, SIDES.PLAYER);
  assert.equal(armed[0].timing, EFFECT_TIMINGS.ROUND_START);

  // Il Patto non ha Statico: nessun segmento fantasma.
  assert.equal(state.enemy.round.pendingEffects.length, 0);
});

test('statico: non richiede scelta né gate, quindi matura a round appena aperto', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  const state = beginEminenceRound(base, { roundNumber: 5 });

  const collected = collectPendingEffects(state, EFFECT_TIMINGS.ROUND_START, {});
  assert.equal(collected.queue.length, 1);
});

test('statico: la condizione di round filtra senza lasciare il segmento armato', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  const state = beginEminenceRound(base, { roundNumber: 4 });

  const collected = collectPendingEffects(state, EFFECT_TIMINGS.ROUND_START, {});
  assert.equal(collected.queue.length, 0);

  // Consumato comunque: il suo checkpoint è passato e non deve riemergere più avanti.
  assert.equal(collected.matchState.player.round.pendingEffects[0].consumed, true);
});

test('statico: un\'Eminenza bloccata non produce nemmeno lo Statico', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  base.player.blockedNextRound = true;

  const state = beginEminenceRound(base, { roundNumber: 5 });
  assert.equal(state.player.blockedThisRound, true);
  assert.equal(state.player.round.pendingEffects.length, 0);
});

test('statico: i segmenti non si accumulano di round in round', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  let state = beginEminenceRound(base, { roundNumber: 1 });
  state = beginEminenceRound(state, { roundNumber: 2 });
  state = beginEminenceRound(state, { roundNumber: 3 });

  assert.equal(state.player.round.pendingEffects.length, 1);
});

// ------------------------------------------------------------------
// Ora Verde end-to-end sul modello di stato
// ------------------------------------------------------------------

test('apertura round: al round 5 lo Statico produce una sostituzione di Campo', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  const { bundle } = openEminenceRound(base, { roundNumber: 5 });

  assert.equal(bundle.fieldOperations.length, 1);
  assert.equal(bundle.fieldOperations[0].operation, 'REPLACE');
  assert.equal(bundle.fieldOperations[0].source, 'ora_verde');
});

test('apertura round: prima del round 5 non produce nulla', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  for (const roundNumber of [1, 2, 3, 4]) {
    assert.equal(openEminenceRound(base, { roundNumber }).bundle, null, `round ${roundNumber}`);
  }
});

test('apertura round: senza sottosistema attivo è un passaggio a vuoto', () => {
  const disabled = createEminenceMatchState({ format: 'disabled' });
  const result = openEminenceRound(disabled, { roundNumber: 5 });
  assert.equal(result.bundle, null);
  assert.equal(result.matchState, disabled);
});

// ------------------------------------------------------------------
// Operazioni sul tabellone
// ------------------------------------------------------------------

const board = (...ids) => ids.map((id) => ALL_BATTLEFIELDS.find((f) => f.id === id));

test('tabellone: la sostituzione colpisce solo gli slot non conquistati', () => {
  const battlefields = board(1, 2, 3, 4, 5);
  const { battlefields: next, changes } = applyFieldOperations(
    [{ operation: 'REPLACE', fieldId: 89 }],
    { battlefields, conqueredFields: { 0: {}, 1: {}, 2: {}, 3: {} }, rng: fixedRng() }
  );

  assert.deepEqual(changes, [{ slot: 4, fromId: 5, toId: 89, source: null }]);
  assert.equal(next[4].id, 89);
  assert.deepEqual(next.slice(0, 4).map((f) => f.id), [1, 2, 3, 4]);
});

test('tabellone: con più slot aperti tutti diventano del tema richiesto', () => {
  const battlefields = board(1, 2, 3, 4, 5);
  const { battlefields: next } = applyFieldOperations(
    [{ operation: 'REPLACE', fieldArmy: 'Apex' }],
    { battlefields, conqueredFields: { 0: {}, 1: {}, 2: {} }, rng: fixedRng() }
  );

  assert.equal(next[3].tema, 'Apex');
  assert.equal(next[4].tema, 'Apex');
  assert.notEqual(next[3].id, next[4].id);
});

test('tabellone: non introduce un doppione di un Campo già presente', () => {
  const battlefields = board(1, 2, 3, 4, 89);
  const { battlefields: next, skipped } = applyFieldOperations(
    [{ operation: 'REPLACE', fieldId: 89 }],
    { battlefields, conqueredFields: { 0: {}, 1: {}, 2: {}, 3: {} }, rng: fixedRng() }
  );

  assert.equal(next, battlefields);
  assert.equal(skipped[0].reason, 'NO_CANDIDATE_FIELD');
});

test('tabellone: senza slot aperti la sostituzione viene registrata come saltata', () => {
  const battlefields = board(1, 2);
  const { battlefields: next, skipped } = applyFieldOperations(
    [{ operation: 'REPLACE', fieldId: 89 }],
    { battlefields, conqueredFields: { 0: {}, 1: {} }, rng: fixedRng() }
  );

  assert.equal(next, battlefields);
  assert.equal(skipped[0].reason, 'NO_OPEN_SLOT');
});

test('tabellone: nessuna operazione lascia intatto il riferimento', () => {
  const battlefields = board(1, 2, 3);
  assert.equal(applyFieldOperations([], { battlefields }).battlefields, battlefields);
  assert.equal(applyFieldOperations(null, { battlefields }).battlefields, battlefields);
});

test('tabellone: un\'operazione senza implementazione fallisce in modo rumoroso', () => {
  assert.throws(
    () => applyFieldOperations([{ operation: 'DESTROY' }], { battlefields: board(1, 2) }),
    /senza implementazione/
  );
});

test('tabellone: il bundle dell\'Ora Verde produce davvero il Campo atteso', () => {
  const base = createEminenceMatchState({ playerEminenceId: APEX, enemyEminenceId: PATTO });
  const { bundle } = openEminenceRound(base, { roundNumber: 5 });

  const battlefields = board(1, 2, 3, 4, 5);
  const { battlefields: next } = applyFieldOperations(bundle.fieldOperations, {
    battlefields,
    conqueredFields: { 0: {}, 1: {}, 2: {}, 3: {} },
    rng: fixedRng(),
  });

  assert.equal(next[4].tema, 'Apex');
});
