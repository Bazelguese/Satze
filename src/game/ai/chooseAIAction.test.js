import test from 'node:test';
import assert from 'node:assert/strict';
import { compareScoredActions } from './scoreAIAction.js';
import { SCORE_TIE_EPSILON } from './aiConstants.js';
import { lightRankAction, buildBalancedShortlist } from './aiPruning.js';
import { generateStrategicActionsForSide } from './generateAIActions.js';
import { getAIProfile } from './aiProfiles.js';
import { makeRound1BudgetFixture, makeCard } from './aiTestFixtures.js';

test('compare: score 1000 precede 900 anche con meno Focus sulla seconda', () => {
  const a = {
    score: 1000,
    isTerminalWin: false,
    isTerminalLoss: false,
    action: { cardId: 1, focus: 6, fieldIndex: 0 },
    simulation: null,
  };
  const b = {
    score: 900,
    isTerminalWin: false,
    isTerminalLoss: false,
    action: { cardId: 2, focus: 2, fieldIndex: 0 },
    simulation: null,
  };
  assert.ok(compareScoredActions(a, b) < 0);
  assert.equal(SCORE_TIE_EPSILON, 5);
});

test('lightRank: non premia sistematicamente il Focus massimo', () => {
  const context = makeRound1BudgetFixture('medium');
  const card = context.ai.hand[0];
  const low = lightRankAction({ card, cardId: card.id, focus: 4 }, context, 'ai');
  const high = lightRankAction({ card, cardId: card.id, focus: 14 }, context, 'ai');
  assert.ok(low > high, `atteso low>${high}? low=${low} high=${high}`);
});

test('shortlist non esatta: ogni carta ha ≥1 variante e ≤ ownVariantsPerCard', () => {
  const context = makeRound1BudgetFixture('medium');
  // La risposta a una carta visibile usa intenzionalmente tutti i Focus legali.
  // Questo test riguarda invece la normale potatura quando l’IA apre il duello.
  context.isPlayerFirst = false;
  context.player.visibleCard = null;

  const profile = getAIProfile('medium');
  const actions = generateStrategicActionsForSide(context, 'ai', profile, 0);
  const shortlist = buildBalancedShortlist(actions, context, profile);
  const byCard = new Map();
  for (const a of shortlist) {
    byCard.set(a.cardId, (byCard.get(a.cardId) || 0) + 1);
  }
  for (const card of context.ai.hand) {
    assert.ok(byCard.has(card.id), `carta ${card.id} assente dalla shortlist`);
    assert.ok(byCard.get(card.id) <= profile.ownVariantsPerCard);
  }
});

test('lightRank: non usa selectedFocus', () => {
  const context = makeRound1BudgetFixture('medium');
  context.player.selectedFocus = 99;
  const card = makeCard({ id: 200, power: 5, damage: 3 });
  assert.doesNotThrow(() => lightRankAction({ card, cardId: 200, focus: 4 }, context, 'ai'));
});
