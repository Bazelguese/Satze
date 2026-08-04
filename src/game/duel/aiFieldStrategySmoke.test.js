import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateFieldControl } from '../ai/fieldStrategy.js';

test('il valutatore strategico dei Campi viene caricato', () => {
  assert.equal(typeof evaluateFieldControl, 'function');
});
