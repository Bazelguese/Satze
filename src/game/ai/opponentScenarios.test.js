import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOpponentFocusValues,
  generateOpponentScenarios,
} from './generateOpponentScenarios.js';
import { getAIProfile } from './aiProfiles.js';
import { makeAIContext, makeCard, makeRound1BudgetFixture } from './aiTestFixtures.js';

test('scenari Focus: non includono automaticamente il massimo al round 1', () => {
  const context = makeRound1BudgetFixture('medium');
  const card = context.player.visibleCard;
  const values = generateOpponentFocusValues({
    context,
    card,
    profile: getAIProfile('medium'),
    allowMax: false,
  });
  const { maxFocus } = (() => {
    // legal max con 18 e 5 carte → reserved 4 → max 14
    return { maxFocus: 14 };
  })();
  assert.ok(!values.includes(maxFocus), `max ${maxFocus} non deve essere di default: ${values}`);
  assert.ok(values.includes(1));
});

test('Facile: solo bande economical/standard nei pesi', () => {
  const context = makeAIContext({
    isPlayerFirst: true,
    player: {
      focusPool: 18,
      focus: 18,
      hand: [
        makeCard({ id: 1 }),
        makeCard({ id: 2 }),
        makeCard({ id: 3 }),
        makeCard({ id: 4 }),
        makeCard({ id: 5 }),
      ],
      usedCardIds: [],
      hp: 20,
      armyBonuses: {},
      toxin: null,
      visibleCard: makeCard({ id: 1 }),
    },
  });
  const scenarios = generateOpponentScenarios(context, getAIProfile('easy'));
  assert.ok(scenarios.length >= 1);
  assert.ok(scenarios.every((s) => s.band === 'economical' || s.band === 'standard'));
  const sum = scenarios.reduce((a, s) => a + s.probability, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6);
});

test('Normale: scenario high non ha il peso maggiore', () => {
  const profile = getAIProfile('medium');
  assert.ok(profile.opponentScenarioWeights.standard > profile.opponentScenarioWeights.high);
  assert.ok(profile.opponentScenarioWeights.standard > profile.opponentScenarioWeights.economical);
});

test('con carta visibile gli scenari usano solo quella carta', () => {
  const visible = makeCard({ id: 77, name: 'Visible' });
  const other = makeCard({ id: 88, name: 'Other' });
  const context = makeAIContext({
    isPlayerFirst: true,
    player: {
      hand: [visible, other],
      usedCardIds: [],
      hp: 20,
      focusPool: 10,
      focus: 10,
      armyBonuses: {},
      toxin: null,
      visibleCard: visible,
    },
  });
  const scenarios = generateOpponentScenarios(context, getAIProfile('medium'));
  assert.ok(scenarios.every((s) => s.cardId === 77));
});

test('cinque carte nascoste: tutte rappresentate, non solo le prime in mano', () => {
  const cards = [50, 10, 40, 20, 30].map((n) =>
    makeCard({ id: n, name: `C${n}`, power: 2, damage: 2 })
  );
  const context = makeAIContext({
    isPlayerFirst: false,
    player: {
      hand: cards,
      usedCardIds: [],
      hp: 20,
      focusPool: 18,
      focus: 18,
      armyBonuses: {},
      toxin: null,
      visibleCard: null,
    },
  });
  const scenarios = generateOpponentScenarios(context, {
    ...getAIProfile('medium'),
    opponentScenarioCount: 4,
  });
  const ids = new Set(scenarios.map((s) => s.cardId));
  assert.equal(ids.size, 5);
  for (const c of cards) {
    assert.ok(ids.has(c.id), `manca carta ${c.id}`);
  }
});
