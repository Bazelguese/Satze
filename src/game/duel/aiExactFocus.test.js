import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROFILES } from '../ai/aiProfiles.js';
import {
  generateStrategicActionsForSide,
  generateStrategicFocusCandidates,
  shouldUseExactFocusSearch,
} from '../ai/generateAIActions.js';
import { buildBalancedShortlist } from '../ai/aiPruning.js';

function makeContext(overrides = {}) {
  const aiHand = [
    { id: 101, name: 'A', power: 5, damage: 3, ability: null },
    { id: 102, name: 'B', power: 3, damage: 5, ability: null },
    { id: 103, name: 'C', power: 4, damage: 4, ability: null },
  ];
  const playerCard = { id: 201, name: 'P', power: 5, damage: 4, ability: null };

  return {
    roundNumber: 2,
    isPlayerFirst: true,
    currentFieldIndex: 0,
    field: {},
    enemyFieldsConquered: 0,
    playerFieldsConquered: 0,
    ai: {
      hand: aiHand,
      usedCardIds: [],
      focusPool: 8,
      focus: 8,
      hp: 20,
    },
    player: {
      hand: [playerCard],
      usedCardIds: [],
      visibleCard: playerCard,
      focusPool: 8,
      focus: 8,
      hp: 20,
    },
    ...overrides,
  };
}

test('Normale enumera ogni Focus legale quando risponde a una carta visibile', () => {
  const context = makeContext();
  const profile = AI_PROFILES.medium;

  assert.equal(shouldUseExactFocusSearch(context, profile), true);

  const result = generateStrategicFocusCandidates(context, context.ai.hand[0], profile);
  assert.equal(result.exactSearch, true);
  assert.deepEqual(result.focuses, [1, 2, 3, 4, 5, 6]);
});

test('Facile mantiene la potatura euristica', () => {
  const context = makeContext();
  const profile = AI_PROFILES.easy;

  assert.equal(shouldUseExactFocusSearch(context, profile), false);

  const result = generateStrategicFocusCandidates(context, context.ai.hand[0], profile);
  assert.equal(result.exactSearch, false);
  assert.ok(result.focuses.length < 6);
});

test('la shortlist conserva tutte le puntate durante la ricerca esatta', () => {
  const context = makeContext();
  const profile = AI_PROFILES.medium;
  const actions = generateStrategicActionsForSide(context, 'ai', profile, 0);
  const shortlist = buildBalancedShortlist(actions, context, profile);

  assert.equal(actions.length, 18);
  assert.equal(shortlist.length, actions.length);

  for (const card of context.ai.hand) {
    const focuses = shortlist
      .filter((action) => action.cardId === card.id)
      .map((action) => action.focus);
    assert.deepEqual(focuses, [1, 2, 3, 4, 5, 6]);
  }
});

test('Difficile attiva la ricerca esatta in una minaccia territoriale anche aprendo', () => {
  const context = makeContext({
    isPlayerFirst: false,
    enemyFieldsConquered: 2,
    player: {
      ...makeContext().player,
      visibleCard: null,
    },
  });

  assert.equal(shouldUseExactFocusSearch(context, AI_PROFILES.hard), true);
});
