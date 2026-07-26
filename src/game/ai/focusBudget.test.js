import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateStandardFocus,
  getOrdinaryFocusCap,
  getFocusCapException,
  computeOverinvestmentPenalty,
} from './focusBudget.js';
import { getAIProfile } from './aiProfiles.js';
import { makeCard, makeAIContext, makeRound1BudgetFixture } from './aiTestFixtures.js';

test('quota standard: 18 FC / 5 carte → Facile 4, Normale 5, Difficile 6', () => {
  assert.equal(
    estimateStandardFocus({ focusPool: 18, cardsRemaining: 5, profile: getAIProfile('easy') }),
    4
  );
  assert.equal(
    estimateStandardFocus({ focusPool: 18, cardsRemaining: 5, profile: getAIProfile('medium') }),
    5
  );
  assert.equal(
    estimateStandardFocus({ focusPool: 18, cardsRemaining: 5, profile: getAIProfile('hard') }),
    6
  );
});

test('cap ordinario round 1: Normale ≤6, Difficile ≤7', () => {
  const mediumCtx = makeRound1BudgetFixture('medium');
  const hardCtx = makeRound1BudgetFixture('hard');
  const med = getOrdinaryFocusCap(mediumCtx, 'ai', getAIProfile('medium'));
  const hard = getOrdinaryFocusCap(hardCtx, 'ai', getAIProfile('hard'));
  assert.equal(med.fairShare, 4);
  assert.equal(med.ordinaryCap, 6);
  assert.equal(hard.ordinaryCap, 7);
});

test('eccezione Overdrive soglia entro cap+1', () => {
  const card = makeCard({
    id: 1,
    ability: { trigger: 'overdrive', effect: 'power', value: 2 },
  });
  const context = makeAIContext({
    roundNumber: 1,
    ai: {
      hand: [card, makeCard({ id: 2 }), makeCard({ id: 3 }), makeCard({ id: 4 }), makeCard({ id: 5 })],
      usedCardIds: [],
      focusPool: 18,
      focus: 18,
      hp: 20,
      armyBonuses: {},
      toxin: null,
    },
  });
  const profile = getAIProfile('medium');
  const budget = getOrdinaryFocusCap(context, 'ai', profile);
  // ordinaryCap 6; soglia 5 → consentita
  const ok = getFocusCapException(
    context,
    { card, focus: 5, cardId: 1 },
    profile,
    budget
  );
  assert.equal(ok.allowed, true);

  const denied = getFocusCapException(
    context,
    { card, focus: 12, cardId: 1 },
    profile,
    budget
  );
  assert.equal(denied.allowed, false);
});

test('ultima carta può investire tutto', () => {
  const card = makeCard({ id: 9 });
  const context = makeAIContext({
    ai: {
      hand: [card],
      usedCardIds: [],
      focusPool: 10,
      focus: 10,
      hp: 20,
      armyBonuses: {},
      toxin: null,
    },
  });
  const profile = getAIProfile('medium');
  const budget = getOrdinaryFocusCap(context, 'ai', profile);
  const ex = getFocusCapException(
    context,
    { card, focus: budget.legalMax, cardId: 9 },
    profile,
    budget
  );
  assert.equal(ex.allowed, true);
  assert.equal(ex.reason, 'ultima-carta');
});

test('penalità sovrainvestimento cresce in modo non lineare', () => {
  const profile = getAIProfile('medium');
  const p3 = computeOverinvestmentPenalty(8, 5, profile, 1);
  const p2 = computeOverinvestmentPenalty(7, 5, profile, 1);
  assert.ok(p3 > p2);
  assert.ok(p3 > 0);
});
