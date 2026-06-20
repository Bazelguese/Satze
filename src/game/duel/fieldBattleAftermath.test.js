import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBattlefieldRoundAftermath } from '../fieldBattleAftermath.js';

test('vincitore player: danno al nemico poi Palude su entrambi', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { name: 'Palude Tossica' },
    winner: 'player',
    damageDealt: 3,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 6,
    eFCCurrent: 6,
    battleLog: log,
  });
  assert.equal(r.pHPCurrent, 19);
  assert.equal(r.eHPCurrent, 6);
  assert.ok(log.some((l) => l.includes('Palude Tossica')));
});

test('campo neutro: solo danno al perdente', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { id: 51, name: 'La Piana della Torre Caduta' },
    winner: 'player',
    damageDealt: 4,
    pHPCurrent: 20,
    eHPCurrent: 15,
    pFCCurrent: 5,
    eFCCurrent: 5,
    battleLog: log,
  });
  assert.equal(r.pHPCurrent, 20);
  assert.equal(r.eHPCurrent, 11);
});
