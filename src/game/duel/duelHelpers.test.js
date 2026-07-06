import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTriggerPreBattle } from './duelHelpers.js';
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
