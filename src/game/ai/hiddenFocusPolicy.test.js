import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAIInformationSet,
  buildPublicDecisionKey,
  validateAIInformationSet,
} from './buildAIInformationSet.js';
import { INFORMATION_POLICY } from './aiConstants.js';
import { makeCard } from './aiTestFixtures.js';

function makeGameState(overrides = {}) {
  const playerCard = makeCard({ id: 10, name: 'P' });
  const aiCard = makeCard({ id: 20, name: 'E' });
  return {
    aiDifficulty: 'medium',
    gameMode: 'classic',
    roundNumber: 1,
    lastWinner: null,
    isPlayerFirst: true,
    currentFieldIndex: 0,
    battlefields: [{ id: 51, name: 'Neutro', category: 'neutral' }],
    conqueredFields: {},
    revealedFields: 1,
    playerHand: [playerCard],
    enemyHand: [aiCard],
    playerUsedCards: [],
    enemyUsedCards: [],
    playerHP: 20,
    enemyHP: 20,
    playerFocus: 18,
    enemyFocus: 18,
    playerArmyBonuses: {},
    enemyArmyBonuses: {},
    playerToxin: null,
    enemyToxin: null,
    selectedAgent: playerCard,
    selectedFocus: 2,
    campaignDuelMod: null,
    ...overrides,
  };
}

test('information set: policy hidden-player-focus e niente selectedFocus', () => {
  const info = buildAIInformationSet(makeGameState({ selectedFocus: 12 }));
  assert.equal(info.informationPolicy, INFORMATION_POLICY);
  assert.equal('selectedFocus' in info.player, false);
  assert.equal('selectedCard' in info.player, false);
  assert.ok(info.player.visibleCard);
  assert.equal(info.player.visibleCard.id, 10);
  assert.equal(info.player.focusPool, 18);
});

test('decisionKey invariante al Focus privato', () => {
  const a = buildAIInformationSet(makeGameState({ selectedFocus: 1 }));
  const b = buildAIInformationSet(makeGameState({ selectedFocus: 12 }));
  assert.equal(buildPublicDecisionKey(a), buildPublicDecisionKey(b));
});

test('IA che apre: visibleCard assente', () => {
  const info = buildAIInformationSet(
    makeGameState({ isPlayerFirst: false, selectedAgent: makeCard({ id: 99 }) })
  );
  assert.equal(info.player.visibleCard, null);
});

test('validate segnala selectedFocus se reintrodotto a mano', () => {
  const info = buildAIInformationSet(makeGameState());
  info.player.selectedFocus = 5;
  const issues = validateAIInformationSet(info, { warn: () => {} });
  assert.ok(issues.some((i) => i.includes('selectedFocus')));
});

test('Proxy: lettura selectedFocus sul player non prevista nel motore', () => {
  const info = buildAIInformationSet(makeGameState({ selectedFocus: 9 }));
  let touched = false;
  info.player = new Proxy(info.player, {
    get(target, prop, receiver) {
      if (prop === 'selectedFocus') {
        touched = true;
        throw new Error('accesso Focus privato');
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  // Accessi leciti
  assert.equal(info.player.focusPool, 18);
  assert.ok(info.player.visibleCard);
  assert.equal(touched, false);
  assert.throws(() => info.player.selectedFocus, /Focus privato/);
});
