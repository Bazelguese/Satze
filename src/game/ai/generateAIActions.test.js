import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableCards,
  getLegalFocusRange,
  generateActionsForSide,
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
