import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategicState, deriveOpeningPlayerFirst } from './strategicState.js';
import {
  projectPostDuelState,
  resolveProjectedInitiative,
} from './projectPostDuelState.js';
import { evaluateStrategicState } from './evaluateStrategicState.js';
import { makeAIContext, makeCard, neutralField } from './aiTestFixtures.js';

test('deriveOpeningPlayerFirst: core alternato', () => {
  assert.equal(deriveOpeningPlayerFirst(1, true), true);
  assert.equal(deriveOpeningPlayerFirst(2, false), true);
  assert.equal(deriveOpeningPlayerFirst(3, true), true);
  assert.equal(deriveOpeningPlayerFirst(1, false), false);
});

test('buildStrategicState: initiativeSide e carte residue', () => {
  const ctx = makeAIContext({
    isPlayerFirst: false,
    openingPlayerFirst: false,
    roundNumber: 1,
  });
  const state = buildStrategicState(ctx);
  assert.equal(state.initiativeSide, 'ai');
  assert.equal(state.isPlayerFirst, false);
  assert.ok(state.aiRemainingCardIds.length >= 1);
  assert.ok(state.availableFieldIndexes.includes(0));
});

test('projectPostDuelState: aggiorna PV, FC, carte, Campo, lastWinner, iniziativa', () => {
  const playerCard = makeCard({ id: 100, name: 'P', army: "Figli dell'Orizzonte" });
  const aiCard = makeCard({ id: 200, name: 'A', army: 'Kethran' });
  const ctx = makeAIContext({
    roundNumber: 1,
    isPlayerFirst: true,
    openingPlayerFirst: true,
    player: {
      hand: [playerCard, makeCard({ id: 101 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 10,
      focus: 10,
      armyBonuses: {},
      toxin: null,
      visibleCard: playerCard,
    },
    ai: {
      hand: [aiCard, makeCard({ id: 201 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 10,
      focus: 10,
      armyBonuses: {},
      toxin: null,
    },
  });
  const root = buildStrategicState(ctx);

  const simulation = {
    winner: 'enemy',
    playerHpAfter: 17,
    aiHpAfter: 20,
    playerFocusAfter: 8,
    aiFocusAfter: 7,
    terminalStatus: null,
    battleResult: {},
  };

  const projected = projectPostDuelState(
    root,
    simulation,
    { card: aiCard, cardId: 200, focus: 3, fieldIndex: 0 },
    { card: playerCard, cardId: 100, focus: 2 }
  );

  assert.equal(projected.roundNumber, 2);
  assert.equal(projected.playerHP, 17);
  assert.equal(projected.aiHP, 20);
  assert.equal(projected.playerFocus, 8);
  assert.equal(projected.aiFocus, 7);
  assert.ok(projected.aiUsedCardIds.includes(200));
  assert.ok(projected.playerUsedCardIds.includes(100));
  assert.ok(!projected.aiRemainingCardIds.includes(200));
  assert.equal(projected.lastWinner, 'enemy');
  assert.equal(projected.conqueredFields[0].winner, 'enemy');
  assert.equal(projected.enemyFieldsConquered, 1);
  // Alternanza da openingPlayerFirst (R1 giocatore → R2 IA), indipendente da chi vince
  assert.equal(projected.isPlayerFirst, false);
  assert.equal(projected.initiativeSide, 'ai');
  assert.equal(projected.currentFieldIndex, null);
});

test('iniziativa proiettata: core alterna da openingPlayerFirst', () => {
  const opening = buildStrategicState(makeAIContext({ roundNumber: 1, openingPlayerFirst: true }));
  assert.deepEqual(
    [2, 3, 4, 5].map((r) => resolveProjectedInitiative(opening, r)),
    [false, true, false, true]
  );
  const notOpening = buildStrategicState(
    makeAIContext({ roundNumber: 1, isPlayerFirst: false, openingPlayerFirst: false })
  );
  assert.deepEqual(
    [2, 3, 4, 5].map((r) => resolveProjectedInitiative(notOpening, r)),
    [true, false, true, false]
  );
});

test('iniziativa proiettata: profili campagna assault/defense', () => {
  const assault = buildStrategicState(
    makeAIContext({ roundNumber: 1, openingPlayerFirst: true, initiativeProfile: 'assault' })
  );
  assert.deepEqual(
    [2, 3, 4, 5].map((r) => resolveProjectedInitiative(assault, r)),
    [true, false, true, false]
  );
  const defense = buildStrategicState(
    makeAIContext({
      roundNumber: 1,
      isPlayerFirst: false,
      openingPlayerFirst: false,
      initiativeProfile: 'defense',
    })
  );
  assert.deepEqual(
    [2, 3, 4, 5].map((r) => resolveProjectedInitiative(defense, r)),
    [false, true, false, true]
  );
});

test('iniziativa proiettata: alwaysPlayerFirst forza il giocatore', () => {
  const ctx = makeAIContext({ roundNumber: 1, isPlayerFirst: true, openingPlayerFirst: true });
  const state = buildStrategicState({ ...ctx, campaignDuelMod: { alwaysPlayerFirst: true } });
  assert.deepEqual(
    [2, 3, 4].map((r) => resolveProjectedInitiative(state, r)),
    [true, true, true]
  );
});

test('projectPostDuelState: il vincitore del duello non cambia l’iniziativa', () => {
  const playerCard = makeCard({ id: 100 });
  const aiCard = makeCard({ id: 200 });
  const root = buildStrategicState(
    makeAIContext({ roundNumber: 2, isPlayerFirst: true, openingPlayerFirst: false })
  );
  const sim = (winner) => ({
    winner,
    playerHpAfter: 18,
    aiHpAfter: 18,
    playerFocusAfter: 5,
    aiFocusAfter: 5,
    terminalStatus: null,
    battleResult: {},
  });
  const project = (winner) =>
    projectPostDuelState(
      root,
      sim(winner),
      { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 },
      { card: playerCard, cardId: 100, focus: 2 }
    );
  // R3 con opening IA → sceglie prima l'IA, chiunque vinca
  for (const winner of ['player', 'enemy', null]) {
    const projected = project(winner);
    assert.equal(projected.roundNumber, 3);
    assert.equal(projected.isPlayerFirst, false);
    assert.equal(projected.initiativeSide, 'ai');
  }
});

test('projectPostDuelState: rivela un Campo aggiuntivo e aggiorna disponibili', () => {
  const f0 = { ...neutralField, id: 51, name: 'A' };
  const f1 = { ...neutralField, id: 52, name: 'B' };
  const f2 = { ...neutralField, id: 53, name: 'C' };
  const playerCard = makeCard({ id: 100 });
  const aiCard = makeCard({ id: 200 });
  const ctx = makeAIContext({
    roundNumber: 1,
    revealedFields: 1,
    battlefields: [f0, f1, f2],
    currentFieldIndex: 0,
    field: f0,
    player: {
      hand: [playerCard, makeCard({ id: 101 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 8,
      focus: 8,
      armyBonuses: {},
      toxin: null,
      visibleCard: playerCard,
    },
    ai: {
      hand: [aiCard, makeCard({ id: 201 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 8,
      focus: 8,
      armyBonuses: {},
      toxin: null,
    },
  });
  const root = buildStrategicState(ctx);
  assert.equal(root.revealedFields, 1);
  assert.deepEqual(root.availableFieldIndexes, [0]);

  const projected = projectPostDuelState(
    root,
    {
      winner: 'player',
      playerHpAfter: 20,
      aiHpAfter: 17,
      playerFocusAfter: 6,
      aiFocusAfter: 6,
      terminalStatus: null,
      battleResult: {},
    },
    { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 },
    { card: playerCard, cardId: 100, focus: 2 }
  );

  assert.equal(projected.revealedFields, 2);
  assert.ok(projected.availableFieldIndexes.includes(1));
  assert.ok(!projected.availableFieldIndexes.includes(0));
  assert.ok(!projected.availableFieldIndexes.includes(2));
  // Vince giocatore → perde IA → IA inizia
  assert.equal(projected.isPlayerFirst, false);
  assert.equal(projected.initiativeSide, 'ai');
});

test('projectPostDuelState: terminale per terzo Campo', () => {
  const aiCard = makeCard({ id: 200 });
  const playerCard = makeCard({ id: 100 });
  const ctx = makeAIContext({
    roundNumber: 3,
    openingPlayerFirst: true,
    isPlayerFirst: true,
    conqueredFields: {
      1: { winner: 'enemy', army: 'Kethran' },
      2: { winner: 'enemy', army: 'Kethran' },
    },
    enemyFieldsConquered: 2,
    playerFieldsConquered: 0,
    battlefields: [neutralField, neutralField, neutralField],
    revealedFields: 3,
    currentFieldIndex: 0,
    field: neutralField,
  });
  // rebuild counts from conquered in buildStrategicState via info set fields
  ctx.enemyFieldsConquered = 2;
  const root = buildStrategicState(ctx);
  root.enemyFieldsConquered = 2;
  root.availableFieldIndexes = [0];

  const projected = projectPostDuelState(
    root,
    {
      winner: 'enemy',
      playerHpAfter: 15,
      aiHpAfter: 18,
      playerFocusAfter: 5,
      aiFocusAfter: 5,
      terminalStatus: null,
      battleResult: {},
    },
    { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 },
    { card: playerCard, cardId: 100, focus: 2 }
  );

  assert.equal(projected.enemyFieldsConquered, 3);
  assert.equal(projected.terminalStatus, 'ai_win_fields');
});

test('evaluateStrategicState: terminale domina, iniziativa IA premia', () => {
  const ctx = makeAIContext({ isPlayerFirst: false, openingPlayerFirst: false });
  const state = buildStrategicState(ctx);
  const base = evaluateStrategicState(state, { id: 'medium', futurePlanningWeight: 0.7 });

  const withInit = { ...state, isPlayerFirst: false, initiativeSide: 'ai' };
  const withoutInit = { ...state, isPlayerFirst: true, initiativeSide: 'player' };
  const a = evaluateStrategicState(withInit, { id: 'medium', futurePlanningWeight: 0.7 });
  const b = evaluateStrategicState(withoutInit, { id: 'medium', futurePlanningWeight: 0.7 });
  assert.ok(a.score > b.score);

  const terminal = evaluateStrategicState(
    { ...state, terminalStatus: 'ai_win_hp' },
    { id: 'hard' }
  );
  assert.ok(terminal.score > 500000);
  assert.ok(base.parts);
});
