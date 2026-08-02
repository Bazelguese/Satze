import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLegalMaxFocus,
  getReservedFocus,
  MIN_FOCUS_INVESTMENT,
  applyFocusSpendWithGuarantee,
  countAgentsRemainingAfterPlay,
} from './legalFocusSpend.js';

test('getReservedFocus: carte residue dopo la corrente', () => {
  assert.equal(getReservedFocus(5), 4);
  assert.equal(getReservedFocus(1), 0);
  assert.equal(getReservedFocus(0), 0);
});

test('MIN_FOCUS_INVESTMENT è 1', () => {
  assert.equal(MIN_FOCUS_INVESTMENT, 1);
});

test('computeLegalMaxFocus non inventa FC con pool vuoto', () => {
  assert.equal(computeLegalMaxFocus(0, 4), 0);
});

test('computeLegalMaxFocus: 3 agenti richiedono almeno 3 FC', () => {
  const agentsLeft = 3;
  const reserved = getReservedFocus(agentsLeft);
  assert.equal(reserved, 2);
  assert.equal(computeLegalMaxFocus(3, reserved), 1);
  assert.equal(computeLegalMaxFocus(2, reserved), 0);
});

test('applyFocusSpendWithGuarantee: non scende sotto gli agenti restanti', () => {
  assert.equal(applyFocusSpendWithGuarantee(3, 1, 2), 2);
  assert.equal(applyFocusSpendWithGuarantee(0, 1, 2), 2);
  assert.equal(applyFocusSpendWithGuarantee(5, 3, 0), 2);

  const hand = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.equal(countAgentsRemainingAfterPlay(hand, [], 1), 2);
  assert.equal(countAgentsRemainingAfterPlay(hand, [2], 1), 1);
});
