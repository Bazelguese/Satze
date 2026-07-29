import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhaseAdvanceDelaysMs,
  duelPhase3NeedsWork,
  computeFocusCoinSequenceDurationMs,
  computeFocusCoinAppearDelayMs,
  computeFocusCoinStepIntervalMs,
  isDuelPhaseActive,
  getNextDuelPhase,
  computePhase0DurationMs,
  getRevealIndex,
  BATTLE_REVEAL_AT_TO_PHASE,
} from './duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS, DUEL_PHASE4_MIN_MS, computeDynamicClashVfx } from './duelVisualConfig.js';

const vfx = { ...DUEL_VISUAL_DEFAULTS };

test('getRevealIndex maps battle-log revealAt to duelPhase indices', () => {
  assert.equal(getRevealIndex('deploy'), 0);
  assert.equal(getRevealIndex('abilityFx'), 1);
  assert.equal(getRevealIndex('postFx'), 5);
  assert.equal(BATTLE_REVEAL_AT_TO_PHASE.outcome, 4);
});


test('duelPhase3NeedsWork: false senza mod e raw >= min', () => {
  assert.equal(
    duelPhase3NeedsWork({
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      playerAssaultRaw: 10,
      enemyAssaultRaw: 8,
      playerAssaultMinFinal: 3,
      enemyAssaultMinFinal: 2,
    }),
    false
  );
});

test('duelPhase3NeedsWork: true con mod', () => {
  assert.equal(duelPhase3NeedsWork({ playerAssaultMod: -2, enemyAssaultMod: 0 }), true);
});

test('duelPhase3NeedsWork: true se raw sotto min', () => {
  assert.equal(
    duelPhase3NeedsWork({
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      playerAssaultRaw: 2,
      enemyAssaultRaw: 8,
      playerAssaultMinFinal: 5,
      enemyAssaultMinFinal: 2,
    }),
    true
  );
});

test('buildPhaseAdvanceDelaysMs: fase 3 saltata senza mod né clamp', () => {
  const br = {
    playerAssaultMod: 0,
    enemyAssaultMod: 0,
    playerPower: 5,
    playerFocusUsed: 2,
    enemyPower: 4,
    enemyFocusUsed: 2,
    playerAssaultRaw: 10,
    enemyAssaultRaw: 8,
    playerAssaultMinFinal: 3,
    enemyAssaultMinFinal: 2,
    playerAgent: { power: 3 },
    enemyAgent: { power: 2 },
  };
  const d = buildPhaseAdvanceDelaysMs(vfx, 2, 2, br);
  assert.equal(d[3], 0);
  assert.equal(getNextDuelPhase(2, br), 4);
});

test('buildPhaseAdvanceDelaysMs: fase 3 piena con mod', () => {
  const br = { playerAssaultMod: 1, enemyAssaultMod: 0 };
  const d = buildPhaseAdvanceDelaysMs(vfx, 1, 1, br);
  assert.equal(d[3], vfx.phaseMs3);
});

test('buildPhaseAdvanceDelaysMs: fase 4 dinamica accelera con gap alto', () => {
  const br = {
    playerAssault: 20,
    enemyAssault: 5,
    playerFocusUsed: 2,
    enemyFocusUsed: 2,
  };
  const dyn = computeDynamicClashVfx(br);
  const d = buildPhaseAdvanceDelaysMs(vfx, 2, 2, br);
  const expected = Math.max(DUEL_PHASE4_MIN_MS, Math.round(vfx.phaseMs4 / dyn.clashSpeed));
  assert.ok(dyn.clashSpeed > 1);
  assert.equal(d[4], expected);
  assert.ok(d[4] < vfx.phaseMs4);
});

test('buildPhaseAdvanceDelaysMs: fase 4 dinamica rallenta con gap nullo', () => {
  const br = {
    playerAssault: 10,
    enemyAssault: 10,
    playerFocusUsed: 1,
    enemyFocusUsed: 1,
  };
  const dyn = computeDynamicClashVfx(br);
  const d = buildPhaseAdvanceDelaysMs(vfx, 1, 1, br);
  const expected = Math.max(DUEL_PHASE4_MIN_MS, Math.round(vfx.phaseMs4 / dyn.clashSpeed));
  assert.ok(dyn.clashSpeed < 1);
  assert.equal(d[4], expected);
  assert.ok(d[4] > vfx.phaseMs4);
});

test('buildPhaseAdvanceDelaysMs: fallback robusto con dati non numerici', () => {
  const br = {
    playerAssault: 'n/a',
    enemyAssault: undefined,
    playerFocusUsed: null,
    enemyFocusUsed: 'x',
  };
  const dyn = computeDynamicClashVfx(br);
  const d = buildPhaseAdvanceDelaysMs(vfx, 0, 0, br);
  assert.equal(dyn.clashSpeed, 0.7);
  assert.equal(dyn.intensity, 0.3);
  assert.ok(Number.isFinite(d[4]));
  assert.ok(d[4] >= DUEL_PHASE4_MIN_MS);
});

test('buildPhaseAdvanceDelaysMs: usa fallback default se vfx corrotto', () => {
  const badVfx = {
    phaseMs0: 'abc',
    phaseMs1: null,
    focusCoinStepMs: 'x',
    focusPhaseBufferMs: undefined,
    phaseMs3: 'nan',
    phaseMs3Empty: 'nan',
    phaseMs4: 'nan',
    phaseMs5: {},
  };
  const d = buildPhaseAdvanceDelaysMs(badVfx, 2, 1, {
    playerAssault: 10,
    enemyAssault: 10,
    playerFocusUsed: 2,
    enemyFocusUsed: 1,
    playerAssaultMod: 0,
    enemyAssaultMod: 0,
    playerAssaultRaw: 10,
    enemyAssaultRaw: 8,
    playerAssaultMinFinal: 3,
    enemyAssaultMinFinal: 2,
  });
  assert.equal(d[0], computePhase0DurationMs(badVfx, {
    playerAssaultMod: 0,
    enemyAssaultMod: 0,
    playerAssaultRaw: 10,
    enemyAssaultRaw: 8,
    playerAssaultMinFinal: 3,
    enemyAssaultMinFinal: 2,
  }));
  assert.equal(d[1], 0);
  assert.equal(d[2], computeFocusCoinSequenceDurationMs(2, badVfx) + DUEL_VISUAL_DEFAULTS.focusPhaseBufferMs);
  assert.ok(d[4] >= DUEL_PHASE4_MIN_MS);
  assert.equal(d[5], 0);
});

test('isDuelPhaseActive: salta fase 1 senza visualSteps', () => {
  const br = { playerFocusUsed: 3, enemyFocusUsed: 2, visualSteps: [{ kind: 'deploy' }, { kind: 'preVa' }] };
  assert.equal(isDuelPhaseActive(1, br), false);
  assert.equal(getNextDuelPhase(0, br), 2);
});

test('isDuelPhaseActive: salta fase 5 senza post-duello', () => {
  const br = {
    visualSteps: [{ kind: 'deploy' }, { kind: 'preVa' }],
    playerFocusUsed: 1,
    enemyFocusUsed: 1,
  };
  assert.equal(isDuelPhaseActive(5, br), false);
  assert.equal(getNextDuelPhase(4, br), 6);
});

test('focus coin: intervalli decrescenti (lento → veloce)', () => {
  const total = 6;
  const intervals = Array.from({ length: total - 1 }, (_, i) =>
    computeFocusCoinStepIntervalMs(i, total, vfx)
  );
  assert.ok(intervals[0] > intervals[intervals.length - 1]);
  assert.equal(
    computeFocusCoinAppearDelayMs(total - 1, total, vfx),
    intervals.reduce((a, b) => a + b, 0)
  );
});
