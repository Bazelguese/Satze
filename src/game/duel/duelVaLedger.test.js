import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDuelVaLedgerRows, duelVaLedgerAt, VA_LEDGER_COLORS } from './duelVaLedger.js';

function va(side, before, after, source) {
  return { type: 'resourceChange', stat: 'VA', phase: 'effects', revealAt: 'abilityFx', target: { kind: 'agent', side }, source, before, after };
}
const step = (kind, side, pMod, eMod, pPow = 6, ePow = 5) => ({ kind, side, playerPower: pPow, enemyPower: ePow, playerAssaultMod: pMod, enemyAssaultMod: eMod });

const base = {
  winner: 'player',
  playerAgent: { name: 'Sorethai, il Primo Ancorante', power: 6, army: 'Orizzonte', ability: { trigger: 'overdrive' } },
  enemyAgent: { name: 'Ion', power: 5, army: 'Corte', ability: { trigger: 'turbo' } },
  playerFocusUsed: 5, enemyFocusUsed: 2,
  field: { name: 'Biblioteca Proibita' },
};

test('modificatori con fonte, colore e step in cui compaiono', () => {
  const br = {
    ...base,
    visualSteps: [step('deploy', null, 0, 5), step('power', 'player', 0, -3), step('preVa', null, 0, -3)],
    events: [
      va('opponent', 0, 5, { kind: 'field', name: 'Biblioteca Proibita', ownerSide: null }),
      va('opponent', 5, -3, { kind: 'ability', name: 'TU (Sorethai, il Primo Ancorante)', ownerSide: 'local' }),
    ],
    enemyAssaultMod: -3, enemyAssaultRaw: 7, enemyAssaultMinFinal: 5, enemyAssault: 7,
  };
  const r = buildDuelVaLedgerRows(br, 'enemy');
  assert.deepEqual(r.mods.map((m) => [m.v, m.label, m.color, m.arriveStep]), [
    [5, '◈ Biblioteca Proibita', VA_LEDGER_COLORS.field, 0],
    [-8, '★ Overdrive', VA_LEDGER_COLORS.ability, 1],
  ]);
  assert.equal(r.floor, null);
  // fase 0: solo il Campo; fase 1 step 1: anche il Potere, ancora spento
  assert.deepEqual(duelVaLedgerAt(r, { duelPhase: 0 }).mods.map((m) => m.arrived), [true, false]);
  const p1 = duelVaLedgerAt(r, { duelPhase: 1, duelEffectStep: 1 });
  assert.deepEqual(p1.mods.map((m) => [m.arrived, m.on]), [[true, false], [true, false]]);
  assert.equal(p1.va, null);
  assert.equal(p1.fc, null);
});

test('FC contati moneta per moneta, poi i modificatori entrano nel totale uno alla volta', () => {
  const br = {
    ...base,
    visualSteps: [step('deploy', null, 0, 0), step('bonus', 'enemy', 4, 0), step('preVa', null, 4, 0)],
    events: [va('local', 0, 4, { kind: 'bonus', name: 'Bonus Orizzonte', ownerSide: 'local' })],
    playerAssaultMod: 4, playerAssaultRaw: 34, playerAssaultMinFinal: 6, playerAssault: 34,
  };
  const r = buildDuelVaLedgerRows(br, 'player');
  assert.equal(r.mods[0].label, '✠ Bonus Orizzonte');
  assert.deepEqual([0, 2, 5].map((c) => duelVaLedgerAt(r, { duelPhase: 2, coinsShown: c })).map((s) => [s.fc, s.va]), [[0, 0], [2, 12], [5, 30]]);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 3, resolved: 0 }).va, 30);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 3, resolved: 1 }).va, 34);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 4 }).va, 34);
});

test('minimo di schieramento: ultima riga, porta il totale al minimo', () => {
  const br = {
    ...base,
    visualSteps: [step('deploy', null, 0, 0), step('power', 'player', 0, -8), step('preVa', null, 0, -8)],
    events: [va('opponent', 0, -8, { kind: 'ability', name: 'TU (Sorethai)', ownerSide: 'local' })],
    enemyAssaultMod: -8, enemyAssaultRaw: 2, enemyAssaultMinFinal: 6, enemyAssault: 6,
  };
  const r = buildDuelVaLedgerRows(br, 'enemy');
  assert.deepEqual(r.floor, { min: 6, raw: 2 });
  assert.equal(duelVaLedgerAt(r, { duelPhase: 3, resolved: 1 }).floor.arrived, true);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 3, resolved: 1 }).va, 2);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 3, resolved: 2 }).va, 6);
});

test('copia: colore verde e nome dell\'armata da cui è copiato', () => {
  const br = {
    ...base,
    visualSteps: [step('deploy', null, 0, 0), step('copyBonus', 'enemy', -5, 0), step('preVa', null, -5, 0)],
    events: [va('local', 0, -5, { kind: 'bonus', name: 'IA Bonus (copiato)', ownerSide: 'opponent' })],
    playerAssaultMod: -5, playerAssaultRaw: 25, playerAssault: 25,
  };
  const m = buildDuelVaLedgerRows(br, 'player').mods[0];
  assert.equal(m.color, VA_LEDGER_COLORS.copied);
  assert.equal(m.label, '✠ Bonus Orizzonte');
});

test('mod dichiarato senza evento: riga generica che fa tornare i conti', () => {
  const br = { ...base, visualSteps: [step('deploy', null, 0, 0), step('preVa', null, 3, 0)], events: [], playerAssaultMod: 3, playerAssault: 33 };
  const r = buildDuelVaLedgerRows(br, 'player');
  assert.deepEqual(r.mods.map((m) => [m.v, m.arriveStep]), [[3, 1]]);
});

test('Campo che dimezza gli FC nel VA: prima riga del Calcolo, poi gli FC contati', () => {
  const br = {
    ...base,
    field: { name: 'Reggia del Custode' },
    visualSteps: [step('deploy', null, 0, 0), step('preVa', null, 0, 0)],
    events: [{ type: 'assaultCalculation', target: { side: 'local' }, basePower: 6, focus: 3 }],
    playerAssaultMod: 0, playerAssaultRaw: 18, playerAssaultMinFinal: 6, playerAssault: 18,
  };
  const r = buildDuelVaLedgerRows(br, 'player');
  assert.deepEqual(r.mods.map((m) => [m.v, m.label]), [[-12, '◈ Reggia del Custode · FC 3/5']]);
  assert.equal(duelVaLedgerAt(r, { duelPhase: 2, coinsShown: 5 }).mods[0].arrived, false);
  assert.deepEqual(['fc', 'va'].map((k) => duelVaLedgerAt(r, { duelPhase: 3, resolved: 0 })[k]), [5, 30]);
  assert.deepEqual(['fc', 'fcCounted', 'va'].map((k) => duelVaLedgerAt(r, { duelPhase: 3, resolved: 1 })[k]), [3, 3, 18]);
});
