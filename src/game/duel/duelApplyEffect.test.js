import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelPowerEffect } from './duelApplyEffect.js';

function minimalState(overrides = {}) {
  return {
    pPower: 5,
    ePower: 5,
    pDamage: 2,
    eDamage: 2,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pHPCurrent: 20,
    eHPCurrent: 20,
    pFCCurrent: 5,
    eFCCurrent: 5,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pImmune: false,
    eImmune: false,
    pMinAssault: null,
    eMinAssault: null,
    pAbilityCopied: null,
    eAbilityCopied: null,
    pBonusCopied: null,
    eBonusCopied: null,
    playerToxinActivated: null,
    enemyToxinActivated: null,
    ...overrides,
  };
}

const emptyCtx = {};

test('power (player) aumenta pPower e registra nel log', () => {
  const state = minimalState({ pPower: 5 });
  const log = [];
  applyDuelPowerEffect('power', 2, 'player', 'Test', log, {}, state, emptyCtx);
  assert.equal(state.pPower, 7);
  assert.equal(state.ePower, 5);
  assert.equal(log.length, 1);
  assert.match(log[0], /\+2 POT/);
  assert.match(log[0], /7/);
});

test('power (enemy) aumenta ePower', () => {
  const state = minimalState();
  const log = [];
  applyDuelPowerEffect('power', 1, 'enemy', 'IA', log, {}, state, emptyCtx);
  assert.equal(state.ePower, 6);
  assert.equal(state.pPower, 5);
});

test('directDamage (player → IA) riduce eHPCurrent rispettando bonus opzioni', () => {
  const state = minimalState({ eHPCurrent: 15 });
  const log = [];
  applyDuelPowerEffect(
    'directDamage',
    3,
    'player',
    'Test',
    log,
    { directDamageDisabled: false, directDamageBonus: 1 },
    state,
    emptyCtx
  );
  assert.equal(state.eHPCurrent, 11);
  assert.equal(state.pHPCurrent, 20);
  assert.ok(log.some((line) => line.includes('4') && line.includes('Danni dir')));
});

test('directDamage con directDamageDisabled non modifica PV', () => {
  const state = minimalState();
  const log = [];
  applyDuelPowerEffect(
    'directDamage',
    5,
    'player',
    'Test',
    log,
    { directDamageDisabled: true, directDamageBonus: 0 },
    state,
    emptyCtx
  );
  assert.equal(state.eHPCurrent, 20);
  assert.ok(log.some((l) => l.includes('Firewall') || l.includes('annullato')));
});

test('enemyPower (player→IA) riduce ePower se IA non immune', () => {
  const state = minimalState({ ePower: 5, eImmune: false });
  const log = [];
  applyDuelPowerEffect('enemyPower', -2, 'player', 'Test', log, {}, state, emptyCtx);
  assert.equal(state.ePower, 3);
});

test('enemyPower bloccato se bersaglio immune', () => {
  const state = minimalState({ ePower: 5, eImmune: true });
  const log = [];
  applyDuelPowerEffect('enemyPower', -2, 'player', 'Test', log, {}, state, emptyCtx);
  assert.equal(state.ePower, 5);
  assert.ok(log.some((l) => l.includes('BLOCCATO')));
});

test('toxin verso IA imposta enemyToxinActivated senza tossina preesistente', () => {
  const state = minimalState();
  const ctx = { playerToxin: null, enemyToxin: null };
  const log = [];
  applyDuelPowerEffect('toxin', 2, 'player', 'Test', log, { minHealth: 1 }, state, ctx);
  assert.ok(state.enemyToxinActivated);
  assert.equal(state.enemyToxinActivated.value, 2);
  assert.equal(state.enemyToxinActivated.minHealth, 1);
});

test('toxin stacka quando ctx.enemyToxin è già attivo', () => {
  const state = minimalState();
  const ctx = { playerToxin: null, enemyToxin: { value: 2, minHealth: 1 } };
  const log = [];
  applyDuelPowerEffect('toxin', 1, 'player', 'Test', log, { minHealth: 2 }, state, ctx);
  assert.equal(state.enemyToxinActivated.value, 3);
});
