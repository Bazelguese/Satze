import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategicState, deriveOpeningPlayerFirst } from './strategicState.js';
import { projectPostDuelState } from './projectPostDuelState.js';
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
  // opening true → R2 player first = false
  assert.equal(projected.isPlayerFirst, false);
  assert.equal(projected.initiativeSide, 'ai');
  assert.equal(projected.currentFieldIndex, null);
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
