import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhaseAdvanceDelaysMs,
  duelPhase3NeedsWork,
} from './duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS } from './duelVisualConfig.js';

const vfx = { ...DUEL_VISUAL_DEFAULTS };

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

test('buildPhaseAdvanceDelaysMs: fase 3 corta senza mod né clamp', () => {
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
  assert.equal(d[3], vfx.phaseMs3Empty);
});

test('buildPhaseAdvanceDelaysMs: fase 3 piena con mod', () => {
  const br = { playerAssaultMod: 1, enemyAssaultMod: 0 };
  const d = buildPhaseAdvanceDelaysMs(vfx, 1, 1, br);
  assert.equal(d[3], vfx.phaseMs3);
});
