import test from 'node:test';
import assert from 'node:assert/strict';

import { presenceNoticeDelta, stepPresenceToward } from './eminencePresenceLink.js';

test('avviso → Presenza: conta solo una variazione vera', () => {
  assert.equal(presenceNoticeDelta({ id: 'a', presenceDelta: -2 }), -2);
  assert.equal(presenceNoticeDelta({ id: 'a', presenceDelta: 1, outcome: 'hit' }), 1);
  assert.equal(presenceNoticeDelta({ id: 'a', presenceDelta: null }), 0);
  assert.equal(presenceNoticeDelta({ id: 'a', presenceDelta: 1, outcome: 'miss' }), 0);
  assert.equal(presenceNoticeDelta({ id: 'a', presenceDelta: 1, kind: 'setup' }), 0);
  assert.equal(presenceNoticeDelta(null), 0);
});

test('avviso → Presenza: il numero va verso il valore vero senza superarlo', () => {
  assert.equal(stepPresenceToward(3, 1, -2), 1);
  assert.equal(stepPresenceToward(3, 2, -2), 2);
  assert.equal(stepPresenceToward(1, 2, 1), 2);
  assert.equal(stepPresenceToward(1, 4, 1), 2);
  // lo stato non contiene ancora la variazione: il numero resta
  assert.equal(stepPresenceToward(1, 1, 1), 1);
  assert.equal(stepPresenceToward(2, 2, -1), 2);
  assert.equal(stepPresenceToward(null, 5, 1), 5);
});
