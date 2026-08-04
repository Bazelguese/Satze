import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROFILES } from '../ai/aiProfiles.js';
import {
  evaluateRemainingHandPlan,
  evaluateTriggerWindow,
  scoreImmediateCardPlan,
} from '../ai/strategyPlanner.js';

function makeContext(overrides = {}) {
  const turbo = {
    id: 1,
    name: 'Turbo',
    league: 3,
    power: 4,
    damage: 3,
    ability: { trigger: 'turbo', effect: 'assaultValue', value: 8 },
  };
  const late = {
    id: 2,
    name: 'Late payoff',
    league: 3,
    power: 4,
    damage: 3,
    ability: { trigger: 'ultimaChance', effect: 'power', value: 4 },
  };
  const sacrifice = {
    id: 3,
    name: 'Sacrifice',
    league: 2,
    power: 2,
    damage: 1,
    ability: null,
  };

  return {
    roundNumber: 2,
    isPlayerFirst: false,
    lastWinner: null,
    currentFieldIndex: 0,
    field: {},
    enemyFieldsConquered: 0,
    playerFieldsConquered: 0,
    ai: {
      hand: [turbo, late, sacrifice],
      usedCardIds: [],
      focusPool: 12,
      focus: 12,
      hp: 20,
    },
    player: {
      hand: [{ id: 9, league: 3, power: 4, damage: 3, ability: null }],
      usedCardIds: [],
      focusPool: 12,
      focus: 12,
      hp: 20,
      visibleCard: null,
    },
    ...overrides,
  };
}

test('il planner riconosce Turbo come finestra urgente prima della scadenza', () => {
  const context = makeContext();
  const turbo = context.ai.hand[0];
  const sacrifice = context.ai.hand[2];

  const turboScore = scoreImmediateCardPlan(
    { card: turbo, cardId: turbo.id, focus: 3, fieldIndex: 0 },
    context,
    'ai',
    AI_PROFILES.hard
  ).score;
  const sacrificeScore = scoreImmediateCardPlan(
    { card: sacrifice, cardId: sacrifice.id, focus: 1, fieldIndex: 0 },
    context,
    'ai',
    AI_PROFILES.hard
  ).score;

  assert.ok(turboScore > sacrificeScore);
});

test('il planner conserva Ultima Chance prima del round 5', () => {
  const context = makeContext({ roundNumber: 2 });
  const late = context.ai.hand[1];
  const sacrifice = context.ai.hand[2];

  const lateWindow = evaluateTriggerWindow(late, context, 'ai', {
    card: late,
    focus: 3,
  });
  assert.equal(lateWindow.ready, false);
  assert.ok(lateWindow.preserve > 0.5);

  const lateScore = scoreImmediateCardPlan(
    { card: late, cardId: late.id, focus: 3, fieldIndex: 0 },
    context,
    'ai',
    AI_PROFILES.hard
  ).score;
  const sacrificeScore = scoreImmediateCardPlan(
    { card: sacrifice, cardId: sacrifice.id, focus: 1, fieldIndex: 0 },
    context,
    'ai',
    AI_PROFILES.hard
  ).score;

  assert.ok(sacrificeScore > lateScore);
});

function makeStrategicState(lastWinner) {
  const vendetta = {
    id: 11,
    name: 'Vendetta payoff',
    league: 4,
    power: 4,
    damage: 4,
    ability: { trigger: 'vendetta', effect: 'powerAndDamage', value: 2 },
  };
  const other = {
    id: 12,
    name: 'Other',
    league: 2,
    power: 3,
    damage: 2,
    ability: null,
  };
  const opponent = {
    id: 21,
    name: 'Opponent',
    league: 3,
    power: 4,
    damage: 3,
    ability: null,
  };

  return {
    roundNumber: 3,
    isPlayerFirst: false,
    initiativeSide: 'ai',
    lastWinner,
    aiHP: 16,
    playerHP: 16,
    aiFocus: 8,
    playerFocus: 8,
    enemyFieldsConquered: 1,
    playerFieldsConquered: 1,
    aiRemainingCardIds: [11, 12],
    playerRemainingCardIds: [21],
    aiUsedCardIds: [99, 98],
    playerUsedCardIds: [88, 87],
    currentFieldIndex: null,
    _refs: {
      aiHand: [vendetta, other],
      playerHand: [opponent],
      battlefields: [],
    },
  };
}

test('una sconfitta precedente aumenta il valore reale di un payoff Vendetta', () => {
  const ready = evaluateRemainingHandPlan(
    makeStrategicState('player'),
    AI_PROFILES.hard
  );
  const notReady = evaluateRemainingHandPlan(
    makeStrategicState(null),
    AI_PROFILES.hard
  );

  const readyTotal = ready.handScore + ready.triggerScore + ready.initiativeScore;
  const waitingTotal =
    notReady.handScore + notReady.triggerScore + notReady.initiativeScore;

  assert.ok(readyTotal > waitingTotal);
});

test('il planner riconosce la catena economia Focus verso Overdrive', () => {
  const state = makeStrategicState(null);
  const focusGenerator = {
    id: 13,
    name: 'Economy',
    league: 3,
    power: 3,
    damage: 2,
    ability: { trigger: 'conquest', effect: 'focusCoin', value: 3 },
  };
  const overdrive = {
    id: 14,
    name: 'Overdrive',
    league: 4,
    power: 5,
    damage: 4,
    ability: { trigger: 'overdrive', effect: 'enemyAssault', value: -8 },
  };

  state._refs.aiHand = [focusGenerator, overdrive];
  state.aiRemainingCardIds = [13, 14];

  const plan = evaluateRemainingHandPlan(state, AI_PROFILES.hard);
  assert.ok(plan.synergyScore > 0);
});
