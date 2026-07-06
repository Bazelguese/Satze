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

test('Ziqqurat Spezzata: perdente +1 FC e vincitore −1 FC', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { id: 23, name: 'Ziqqurat Spezzata' },
    winner: 'player',
    damageDealt: 2,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 4,
    battleLog: log,
  });
  assert.equal(r.pFCCurrent, 4);
  assert.equal(r.eFCCurrent, 5);
});

test('Canyon delle Lame: Ultimo Desiderio −2 PV al perdente', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { id: 11, name: 'Canyon delle Lame' },
    winner: 'player',
    damageDealt: 3,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 5,
    battleLog: log,
  });
  assert.equal(r.eHPCurrent, 5);
  assert.ok(log.some((l) => l.includes('Ultimo Desiderio')));
});

test('Altare del Sacrificio: Conquista −2 PV al vincitore', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { id: 17, name: 'Altare del Sacrificio' },
    winner: 'player',
    damageDealt: 3,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 5,
    battleLog: log,
  });
  assert.equal(r.pHPCurrent, 18);
  assert.equal(r.eHPCurrent, 7);
  assert.ok(log.some((l) => l.includes('Conquista') && l.includes('−2 PV')));
});

test('Deposito di Rottami: perdente +2 FC', () => {
  const log = [];
  const r = applyBattlefieldRoundAftermath({
    field: { id: 30, name: 'Deposito di Rottami' },
    winner: 'enemy',
    damageDealt: 2,
    pHPCurrent: 18,
    eHPCurrent: 20,
    pFCCurrent: 3,
    eFCCurrent: 6,
    battleLog: log,
  });
  assert.equal(r.pFCCurrent, 5);
  assert.equal(r.eFCCurrent, 6);
});
