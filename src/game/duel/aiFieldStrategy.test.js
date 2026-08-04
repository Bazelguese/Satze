// Regressioni: negazione dei Campi e conservazione delle sinergie future.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFieldControl,
  evaluateFieldSelectionAdjustment,
} from '../ai/fieldStrategy.js';
import { lightRankField } from '../ai/rankFields.js';
import { AI_PROFILES } from '../ai/aiProfiles.js';

const neutralField = { id: 1, name: 'Neutro', category: 'neutral' };
const overdriveField = { id: 29, name: 'Soglia Ridotta', category: 'trigger' };

function makeState({ aiHand, playerHand, aiFocus = 8, playerFocus = 8 }) {
  return {
    difficulty: 'hard',
    roundNumber: 1,
    initiativeSide: 'ai',
    isPlayerFirst: false,
    lastWinner: null,
    aiHP: 20,
    playerHP: 20,
    aiFocus,
    playerFocus,
    enemyFieldsConquered: 0,
    playerFieldsConquered: 0,
    aiRemainingCardIds: aiHand.map((card) => card.id),
    playerRemainingCardIds: playerHand.map((card) => card.id),
    aiUsedCardIds: [],
    playerUsedCardIds: [],
    availableFieldIndexes: [0, 1],
    currentFieldIndex: null,
    _refs: {
      aiHand,
      playerHand,
      battlefields: [neutralField, overdriveField],
      aiArmyBonuses: {},
      playerArmyBonuses: {},
    },
  };
}

const weakCard = {
  id: 101,
  name: 'Carta neutra',
  power: 3,
  damage: 2,
  league: 2,
  ability: null,
};

const overdriveCard = {
  id: 201,
  name: 'Payoff Overdrive',
  power: 4,
  damage: 4,
  league: 4,
  ability: { trigger: 'overdrive', effect: 'assaultValue', value: 10 },
};

test('riconosce un Campo molto più utile alla mano avversaria', () => {
  const state = makeState({
    aiHand: [weakCard],
    playerHand: [overdriveCard],
  });

  const neutral = evaluateFieldControl(state, 0);
  const dangerous = evaluateFieldControl(state, 1);

  assert.ok(dangerous.playerThreat > neutral.playerThreat);
  assert.ok(dangerous.netControl < neutral.netControl);
});

test('premia la rimozione immediata di un Campo vantaggioso per il giocatore', () => {
  const state = makeState({
    aiHand: [weakCard],
    playerHand: [overdriveCard],
  });

  const neutral = evaluateFieldSelectionAdjustment(
    state,
    0,
    weakCard,
    AI_PROFILES.hard
  );
  const denial = evaluateFieldSelectionAdjustment(
    state,
    1,
    weakCard,
    AI_PROFILES.hard
  );

  assert.ok(denial.denialScore > neutral.denialScore);
  assert.ok(denial.score > neutral.score);
});

test('non spreca un Campo che una propria carta futura sfrutta meglio', () => {
  const aiOverdrive = { ...overdriveCard, id: 102 };
  const state = makeState({
    aiHand: [weakCard, aiOverdrive],
    playerHand: [{ ...weakCard, id: 301 }],
  });

  const useWithWrongCard = evaluateFieldSelectionAdjustment(
    state,
    1,
    weakCard,
    AI_PROFILES.hard
  );

  assert.ok(useWithWrongCard.reserveGap > 0);
  assert.ok(useWithWrongCard.preservePenalty > 0);
});

test('la ricerca futura tratta il Campo avversario come una minaccia reale', () => {
  const state = makeState({
    aiHand: [weakCard],
    playerHand: [overdriveCard],
  });

  const neutralRank = lightRankField(state, 0);
  const dangerousRank = lightRankField(state, 1);

  assert.ok(dangerousRank < neutralRank);
});
