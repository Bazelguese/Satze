import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTriggerPreBattle, countInitialLeagueCards } from './duelHelpers.js';
import { checkTrigger } from '../triggerLogic.js';

test('canTriggerPreBattle: conquest bloccato senza Crocevia', () => {
  assert.equal(canTriggerPreBattle('conquest', { won: true }, { resolveTrigger: checkTrigger }), false);
});

test('canTriggerPreBattle: Crocevia ignora condizione conquest', () => {
  assert.equal(
    canTriggerPreBattle('conquest', { won: false }, { triggersIgnored: true, resolveTrigger: checkTrigger }),
    true
  );
});

test('canTriggerPreBattle: Gloria forzata da fieldModifiers via checkTrigger', () => {
  const ctx = { wonPrevious: false, fieldModifiers: { gloriaAlwaysActive: true } };
  assert.equal(canTriggerPreBattle('glory', ctx, { resolveTrigger: checkTrigger }), true);
});

test('countInitialLeagueCards: conta carte stessa Lega in mano iniziale (Rinforzi richiede 2 oltre alla giocata)', () => {
  const l4a = { id: 901, league: 4 };
  const l4b = { id: 903, league: 4 };
  const l2a = { id: 915, league: 2 };
  const l2b = { id: 916, league: 2 };
  const l2c = { id: 917, league: 2 };
  const l2d = { id: 920, league: 2 };
  const l2e = { id: 921, league: 2 };
  const hand = [l4b, l2a, l2b, l2c, l2d];

  assert.equal(countInitialLeagueCards([], hand, l4a), 2);
  assert.equal(countInitialLeagueCards([l4b], [l2a, l2b, l2c, l2d], l4a), 2);
  assert.equal(countInitialLeagueCards([], hand, l2a), 4);
  assert.equal(countInitialLeagueCards([], [l4a, l2b, l2c, l2d, l2e], l4a), 1);
});
