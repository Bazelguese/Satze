import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableCards,
  getLegalFocusRange,
  generateActionsForSide,
  computeLegalMaxFocus,
} from './generateAIActions.js';
import { makeAIContext, makeCard } from './aiTestFixtures.js';

test('generazione: esclude carte già usate per id', () => {
  const a = makeCard({ id: 1 });
  const b = makeCard({ id: 2 });
  const available = getAvailableCards([a, b], [1]);
  assert.equal(available.length, 1);
  assert.equal(available[0].id, 2);
});

test('generazione: Focus interi legali e permette spendere fino al max UI', () => {
  const context = makeAIContext({
    ai: {
      hand: [makeCard({ id: 1 }), makeCard({ id: 2 })],
      usedCardIds: [],
      focusPool: 6,
      focus: 6,
      hp: 20,
      armyBonuses: {},
      toxin: null,
    },
  });
  const range = getLegalFocusRange(context, 'ai');
  // 2 carte → riservato 1 → max 5
  assert.equal(range.minFocus, 1);
  assert.equal(range.maxFocus, 5);
  assert.equal(range.reserved, 1);

  const actions = generateActionsForSide(context, 'ai', 0);
  const focuses = new Set(actions.map((a) => a.focus));
  assert.ok(focuses.has(1));
  assert.ok(focuses.has(5));
  assert.ok(!focuses.has(6));
  assert.ok(actions.every((a) => Number.isInteger(a.focus)));
  assert.ok(actions.every((a) => a.card && a.cardId === a.card.id));
});

test('generazione: con una sola carta può investire tutto il pool', () => {
  const context = makeAIContext({
    ai: {
      hand: [makeCard({ id: 9 })],
      usedCardIds: [],
      focusPool: 7,
      focus: 7,
      hp: 20,
      armyBonuses: {},
      toxin: null,
    },
  });
  const range = getLegalFocusRange(context, 'ai');
  assert.equal(range.reserved, 0);
  assert.equal(range.maxFocus, 7);
});

test('generazione: non muta mano o usedCards', () => {
  const hand = [makeCard({ id: 1 }), makeCard({ id: 2 })];
  const used = [];
  const context = makeAIContext({
    ai: { hand, usedCardIds: used, focus: 5, hp: 20, armyBonuses: {}, toxin: null },
  });
  generateActionsForSide(context, 'ai', 0);
  assert.equal(hand.length, 2);
  assert.equal(used.length, 0);
});

test('computeLegalMaxFocus: pool 0 non consente spendere 1', () => {
  assert.equal(computeLegalMaxFocus(0, 0), 0);
  assert.equal(computeLegalMaxFocus(0, 3), 0);
  assert.equal(computeLegalMaxFocus(-2, 0), 0);
});

test('computeLegalMaxFocus: riserva dura (1 FC per agente restante)', () => {
  // 2 agenti, pool 1 → reserved 1 → non legale (servirebbero 2)
  assert.equal(computeLegalMaxFocus(1, 1), 0);
  // 3 agenti, pool 2 → reserved 2 → non legale (servirebbero 3)
  assert.equal(computeLegalMaxFocus(2, 2), 0);
  // 3 agenti, pool 3 → reserved 2 → max 1
  assert.equal(computeLegalMaxFocus(3, 2), 1);
  // 5 agenti, 18 FC → reserved 4 → max 14
  assert.equal(computeLegalMaxFocus(18, 4), 14);
  // pool 6 reserved 1 → 5
  assert.equal(computeLegalMaxFocus(6, 1), 5);
});

test('generazione: pool 0 → nessuna azione Focus legale', () => {
  const context = makeAIContext({
    ai: {
      hand: [makeCard({ id: 1 }), makeCard({ id: 2 })],
      usedCardIds: [],
      focusPool: 0,
      focus: 0,
      hp: 20,
      armyBonuses: {},
      toxin: null,
    },
  });
  const range = getLegalFocusRange(context, 'ai');
  assert.equal(range.maxFocus, 0);
  assert.equal(generateActionsForSide(context, 'ai', 0).length, 0);
});
