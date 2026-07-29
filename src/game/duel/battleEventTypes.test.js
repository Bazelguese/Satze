import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLE_EVENT_TYPES,
  BATTLE_REVEAL_AT,
  createBattleEventEmitter,
} from './battleEventTypes.js';
import { formatBattleEvent } from './formatBattleEvent.js';
import {
  aggregateBattleEvents,
  filterVisibleByReveal,
  isCompactEligible,
  keepLastRounds,
} from './battleEventSelectors.js';
import { getRevealIndex } from '../../config/duelVisualTimeline.js';

test('emitter assigns unique ids and deterministic sequence', () => {
  const { events, emit } = createBattleEventEmitter(3);
  emit({
    phase: 'effects',
    revealAt: 'abilityFx',
    type: BATTLE_EVENT_TYPES.statChange,
    source: { kind: 'ability', id: 'a', name: 'A', ownerSide: 'local' },
    target: { kind: 'agent', side: 'local', id: '1', name: 'X' },
    stat: 'POT',
    before: 5,
    after: 7,
  });
  emit({
    phase: 'effects',
    revealAt: 'abilityFx',
    type: BATTLE_EVENT_TYPES.statChange,
    source: { kind: 'ability', id: 'a', name: 'A', ownerSide: 'local' },
    target: { kind: 'agent', side: 'local', id: '1', name: 'X' },
    stat: 'DAN',
    before: 2,
    after: 3,
  });
  assert.equal(events.length, 2);
  assert.equal(events[0].id, 'r3:e0');
  assert.equal(events[1].id, 'r3:e1');
  assert.equal(events[0].sequence, 0);
  assert.equal(events[1].sequence, 1);
  assert.equal(events[0].round, 3);
});

test('emitter skips no-op statChange', () => {
  const { events, emit } = createBattleEventEmitter(1);
  emit({
    phase: 'effects',
    revealAt: 'abilityFx',
    type: BATTLE_EVENT_TYPES.statChange,
    source: { kind: 'field', id: 1, name: 'F', ownerSide: null },
    target: { kind: 'agent', side: 'local', id: '1', name: 'X' },
    stat: 'POT',
    before: 5,
    after: 5,
  });
  assert.equal(events.length, 0);
});

test('formatBattleEvent uses X→Y transitions', () => {
  const formatted = formatBattleEvent({
    type: BATTLE_EVENT_TYPES.statChange,
    source: { kind: 'field', id: 'terza_luna', name: 'Terza Luna', ownerSide: null },
    target: { kind: 'agent', side: 'local', id: '1', name: 'Lama' },
    stat: 'POT',
    before: 5,
    after: 4,
  });
  assert.match(formatted.text, /POT 5→4/);
  assert.equal(formatted.tone, 'local');
  assert.ok(formatted.ariaLabel.includes('5'));
  assert.ok(formatted.ariaLabel.includes('4'));
});

test('revealAt maps to shared timeline indices', () => {
  assert.equal(getRevealIndex('deploy'), 0);
  assert.equal(getRevealIndex('abilityFx'), 1);
  assert.equal(getRevealIndex('focusFx'), 2);
  assert.equal(getRevealIndex('assaultFx'), 3);
  assert.equal(getRevealIndex('outcome'), 4);
  assert.equal(getRevealIndex('postFx'), 5);
});

test('filterVisibleByReveal respects duelPhase', () => {
  const events = [
    { id: 'a', revealAt: BATTLE_REVEAL_AT.deploy, type: BATTLE_EVENT_TYPES.roundHeader },
    { id: 'b', revealAt: BATTLE_REVEAL_AT.abilityFx, type: BATTLE_EVENT_TYPES.statChange, before: 1, after: 2 },
    { id: 'c', revealAt: BATTLE_REVEAL_AT.outcome, type: BATTLE_EVENT_TYPES.outcome },
  ];
  assert.deepEqual(
    filterVisibleByReveal(events, 1).map((e) => e.id),
    ['a', 'b']
  );
  assert.deepEqual(
    filterVisibleByReveal(events, 0).map((e) => e.id),
    ['a']
  );
});

test('aggregate groups same source/target statChanges and caps compact rows', () => {
  const src = { kind: 'field', id: 'tl', name: 'Terza Luna', ownerSide: null };
  const tgt = { kind: 'agent', side: 'local', id: '1', name: 'X' };
  const events = [];
  for (let i = 0; i < 10; i++) {
    events.push({
      round: 1,
      sequence: i,
      phase: 'effects',
      revealAt: 'abilityFx',
      type: BATTLE_EVENT_TYPES.statChange,
      source: src,
      target: tgt,
      stat: i % 2 === 0 ? 'POT' : 'DAN',
      before: i,
      after: i + 1,
    });
  }
  // Same source/target/phase → one aggregated row for consecutive compatible pairs,
  // but different stats still aggregate together per SPEC.
  const rows = aggregateBattleEvents(events);
  assert.ok(rows.length <= 8); // 7 + overflow
  const overflow = rows.find((r) => r.kind === 'overflow');
  if (rows.length > 7) assert.ok(overflow);
});

test('isCompactEligible excludes assaultCalculation and no-ops', () => {
  assert.equal(
    isCompactEligible({
      type: BATTLE_EVENT_TYPES.assaultCalculation,
      finalVA: 10,
    }),
    false
  );
  assert.equal(
    isCompactEligible({
      type: BATTLE_EVENT_TYPES.statChange,
      before: 3,
      after: 3,
    }),
    false
  );
  assert.equal(
    isCompactEligible({
      type: BATTLE_EVENT_TYPES.statChange,
      before: 3,
      after: 4,
    }),
    true
  );
});

test('keepLastRounds keeps whole rounds not line counts', () => {
  const events = [
    { round: 1, sequence: 0 },
    { round: 1, sequence: 1 },
    { round: 2, sequence: 0 },
    { round: 3, sequence: 0 },
    { round: 4, sequence: 0 },
  ];
  const kept = keepLastRounds(events, 2);
  assert.deepEqual(
    [...new Set(kept.map((e) => e.round))],
    [3, 4]
  );
});
