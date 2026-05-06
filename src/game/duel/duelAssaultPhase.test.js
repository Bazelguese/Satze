import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDuelAssaultCalculation } from './duelAssaultPhase.js';

test('runDuelAssaultCalculation calcola VA e appende log', () => {
  const log = [];
  const r = runDuelAssaultCalculation(log, {
    pAgent: { power: 3, league: 1 },
    eAgent: { power: 2, league: 2 },
    pPower: 4,
    ePower: 2,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pMinAssault: null,
    eMinAssault: null,
  });
  assert.equal(r.pAssaultRaw, 8);
  assert.equal(r.eAssaultRaw, 4);
  assert.equal(r.pAssault, 8);
  assert.equal(r.eAssault, 4);
  assert.ok(log.some((l) => l.includes('CALCOLO VA')));
  assert.ok(log.some((l) => l.includes('VA FINALE')));
});
