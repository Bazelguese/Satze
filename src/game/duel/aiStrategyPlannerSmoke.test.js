import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateTriggerWindow } from '../ai/strategyPlanner.js';

test('il pianificatore strategico viene caricato e legge un trigger base', () => {
  const card = {
    id: 1,
    league: 3,
    power: 4,
    damage: 3,
    ability: { trigger: 'turbo', effect: 'power', value: 2 },
  };
  const context = {
    roundNumber: 1,
    isPlayerFirst: false,
    currentFieldIndex: 0,
    field: {},
    enemyFieldsConquered: 0,
    playerFieldsConquered: 0,
    ai: {
      hand: [card],
      usedCardIds: [],
      hp: 20,
      focusPool: 5,
    },
    player: {
      hand: [],
      usedCardIds: [],
      hp: 20,
      focusPool: 5,
    },
  };

  const window = evaluateTriggerWindow(card, context, 'ai', {
    card,
    focus: 1,
  });

  assert.equal(window.ready, true);
  assert.equal(window.trigger, 'turbo');
});
