import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDuelVisualRecorder,
  countDuelEffectSteps,
  countDuelPostEffectSteps,
  getPreVaStepIndex,
  extractAssaultModDeltas,
} from './duelVisualSteps.js';

test('createDuelVisualRecorder: deploy + power + bonus + preVa in ordine', () => {
  const pAgent = { power: 5, damage: 3 };
  const eAgent = { power: 4, damage: 2 };
  const rec = createDuelVisualRecorder(pAgent, eAgent);
  const state = { pPower: 5, ePower: 4, pDamage: 3, eDamage: 2, pAssaultMod: 0, eAssaultMod: 0 };

  rec.pushPower('player', { ...state, pPower: 7 });
  rec.pushBonus('enemy', { ...state, ePower: 6, eDamage: 4 });
  rec.pushPreVa({ ...state, pPower: 7, ePower: 6, eDamage: 4 });

  assert.equal(rec.steps.length, 4);
  assert.equal(rec.steps[0].kind, 'deploy');
  assert.equal(rec.steps[1].kind, 'power');
  assert.equal(rec.steps[2].kind, 'bonus');
  assert.equal(rec.steps[3].kind, 'preVa');
  assert.equal(countDuelEffectSteps(rec.steps), 2);
  assert.equal(getPreVaStepIndex(rec.steps), 3);
  assert.equal(countDuelPostEffectSteps(rec.steps), 0);
});

test('post-duello: step dopo preVa', () => {
  const rec = createDuelVisualRecorder({ power: 5, damage: 3 }, { power: 4, damage: 2 });
  const state = { pPower: 7, ePower: 4, pDamage: 3, eDamage: 2, pAssaultMod: 0, eAssaultMod: 0 };
  rec.pushPreVa(state);
  rec.pushPostPower('player', { ...state, pPower: 9 });
  assert.equal(countDuelPostEffectSteps(rec.steps), 1);
  assert.equal(rec.steps[2].kind, 'postPower');
  assert.equal(rec.steps[2].playerPower, 9);
});

test('extractAssaultModDeltas: incrementi fino a preVa', () => {
  const rec = createDuelVisualRecorder({ power: 5, damage: 3 }, { power: 4, damage: 2 });
  const s0 = { pPower: 5, ePower: 4, pDamage: 3, eDamage: 2, pAssaultMod: 0, eAssaultMod: 0 };
  rec.pushPower('player', { ...s0, pAssaultMod: 2 });
  rec.pushBonus('player', { ...s0, pAssaultMod: 5 });
  rec.pushPreVa({ ...s0, pAssaultMod: 5 });
  const deltas = extractAssaultModDeltas(rec.steps, true);
  assert.equal(deltas.length, 2);
  assert.equal(deltas[0].delta, 2);
  assert.equal(deltas[1].delta, 3);
  assert.equal(deltas[1].cumulative, 5);
});
