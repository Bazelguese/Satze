import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDuelTurnContexts } from './duelTurnContexts.js';

test('buildDuelTurnContexts: simmetria enemyContext', () => {
  const pAgent = { league: 2 };
  const eAgent = { league: 3 };
  const { playerContext, enemyContext } = buildDuelTurnContexts({
    isPlayerFirst: true,
    lastWinner: 'player',
    selectedFocus: 2,
    enemySelectedFocus: 1,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerHP: 20,
    enemyHP: 18,
    pAgent,
    eAgent,
    playerFieldsConquered: 2,
    enemyFieldsConquered: 1,
    roundNumber: 3,
  });
  assert.equal(playerContext.isFirst, true);
  assert.equal(enemyContext.isFirst, false);
  assert.equal(playerContext.playerHP, 20);
  assert.equal(enemyContext.playerHP, 18);
  assert.equal(enemyContext.playerFieldsConquered, 1);
  assert.equal(playerContext.roundNumber, 3);
});
