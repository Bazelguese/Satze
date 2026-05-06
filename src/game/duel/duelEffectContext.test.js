import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDuelEffectContext } from './duelEffectContext.js';

test('createDuelEffectContext espone tutte le chiavi attese', () => {
  const checkTrigger = () => true;
  const playerContext = { a: 1 };
  const enemyContext = { b: 2 };
  const pAgent = { name: 'P' };
  const eAgent = { name: 'E' };
  const pArmyBonus = {};
  const eArmyBonus = {};
  const ctx = createDuelEffectContext({
    checkTrigger,
    playerContext,
    enemyContext,
    pAgent,
    eAgent,
    pArmyBonus,
    eArmyBonus,
    pHasBonus: true,
    eHasBonus: false,
    playerToxin: null,
    enemyToxin: null,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerFieldsConquered: 2,
    enemyFieldsConquered: 1,
  });
  assert.equal(ctx.checkTrigger, checkTrigger);
  assert.equal(ctx.playerContext, playerContext);
  assert.equal(ctx.pAgent, pAgent);
  assert.equal(ctx.playerFieldsConquered, 2);
  assert.deepEqual(ctx.playerUsedCards, []);
});
