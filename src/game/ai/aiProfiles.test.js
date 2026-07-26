import test from 'node:test';
import assert from 'node:assert/strict';
import { getAIProfile, AI_PROFILES } from './aiProfiles.js';
import { getAllDifficulties, getDifficultyConfig } from '../../utils/aiConstants.js';
import { actionDominates, compareScoredActions } from './scoreAIAction.js';
import { makeCard } from './aiTestFixtures.js';

test('profili: easy/medium/hard presenti; chaos ricade su medium', () => {
  assert.equal(getAIProfile('easy').id, 'easy');
  assert.equal(getAIProfile('medium').label, 'Normale');
  assert.equal(getAIProfile('hard').selectionMode, 'best');
  assert.equal(getAIProfile('chaos').id, 'medium');
  assert.equal(AI_PROFILES.hard.useDominanceFilterWhenHiddenFocus, false);
  assert.equal(AI_PROFILES.medium.ordinaryFocusBuffer, 2);
});

test('UI difficoltà: tre opzioni, Normale, senza chaos', () => {
  const diffs = getAllDifficulties();
  assert.equal(diffs.length, 3);
  assert.ok(diffs.every((d) => d.id !== 'chaos'));
  assert.equal(getDifficultyConfig('medium').description, 'Normale');
  assert.equal(getDifficultyConfig('chaos').id, 'medium');
});

test('dominanza: stesso risultato con più Focus è dominato', () => {
  const card = makeCard({ id: 1 });
  const sim = {
    winner: 'enemy',
    aiHpAfter: 18,
    playerHpAfter: 16,
    aiFocusAfter: 5,
    playerFocusAfter: 4,
    aiFieldsAfter: 1,
    playerFieldsAfter: 0,
    aiAbilityTriggered: false,
    terminalStatus: null,
  };
  const a = {
    action: { card, cardId: 1, focus: 3, fieldIndex: 0 },
    simulation: { ...sim, aiFocusAfter: 5 },
  };
  const b = {
    action: { card, cardId: 1, focus: 5, fieldIndex: 0 },
    simulation: { ...sim, aiFocusAfter: 3 },
  };
  assert.equal(actionDominates(a, b), true);
  assert.equal(actionDominates(b, a), false);
});

test('compare: preferisce meno Focus a parità', () => {
  const card = makeCard({ id: 2 });
  const baseSim = {
    winner: 'enemy',
    aiHpAfter: 20,
    playerHpAfter: 17,
    aiFocusAfter: 4,
    playerFocusAfter: 4,
    aiFieldsAfter: 1,
    playerFieldsAfter: 0,
    terminalStatus: null,
  };
  const a = {
    action: { card, cardId: 2, focus: 2, fieldIndex: 0 },
    simulation: baseSim,
    score: 100,
    isTerminalWin: false,
    isTerminalLoss: false,
  };
  const b = {
    action: { card, cardId: 2, focus: 4, fieldIndex: 0 },
    simulation: baseSim,
    score: 100,
    isTerminalWin: false,
    isTerminalLoss: false,
  };
  assert.ok(compareScoredActions(a, b) < 0);
});
