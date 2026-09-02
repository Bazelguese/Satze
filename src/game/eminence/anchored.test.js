import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createFocus } from './focusModel.js';
import { anchoredRequirement, isAnchored, snapshotAnchoredBySide } from './anchored.js';
import { SIDES } from './eminenceConstants.js';

test('Ancorato: soglia base 6 − Lega', () => {
  assert.equal(anchoredRequirement(5), 1);
  assert.equal(anchoredRequirement(4), 2);
  assert.equal(anchoredRequirement(3), 3);
  assert.equal(anchoredRequirement(2), 4);
});

test('Ancorato: gli aumenti del requisito si sommano senza cap', () => {
  assert.equal(anchoredRequirement(3, 2), 5);
  assert.equal(isAnchored({ focusInvested: 4, league: 3, thresholdDelta: 2 }), false);
  assert.equal(isAnchored({ focusInvested: 5, league: 3, thresholdDelta: 2 }), true);
});

test('Ancorato: contano solo gli FC investiti', () => {
  assert.equal(isAnchored({ focus: createFocus(2, 3), league: 3 }), false);
  assert.equal(isAnchored({ focus: createFocus(3, 0), league: 3 }), true);
});

test('Ancorato: lo snapshot è per lato e non ricalcola da solo', () => {
  const snapshot = snapshotAnchoredBySide(
    {
      [SIDES.PLAYER]: { persistent: { anchoredThresholdDelta: 0 } },
      [SIDES.ENEMY]: { persistent: { anchoredThresholdDelta: 1 } },
    },
    {
      focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
      leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
    },
  );
  assert.equal(snapshot[SIDES.PLAYER], true);
  assert.equal(snapshot[SIDES.ENEMY], false);
});
