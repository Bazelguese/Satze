import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelFieldSetup } from './duelFieldSetup.js';

function baseDuel(overrides = {}) {
  return {
    pPower: 5,
    ePower: 5,
    pDamage: 3,
    eDamage: 3,
    pFocusUsed: 2,
    eFocusUsed: 2,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pImmune: true,
    eImmune: true,
    ...overrides,
  };
}

test('Mura EMP azzera immune su duel', () => {
  const duel = baseDuel();
  const log = [];
  const pCtx = {};
  const eCtx = {};
  applyDuelFieldSetup(
    duel,
    { name: 'Mura EMP', category: 'values' },
    log,
    { name: 'P', league: 2 },
    { name: 'E', league: 2 },
    pCtx,
    eCtx
  );
  assert.equal(duel.pImmune, false);
  assert.equal(duel.eImmune, false);
  assert.ok(log.some((l) => l.includes('Mura EMP')));
});

test('Nexus Arcano espone maxDamage 4', () => {
  const duel = baseDuel();
  const flags = applyDuelFieldSetup(duel, { name: 'Nexus Arcano', category: 'limit' }, [], {}, {}, {}, {});
  assert.equal(flags.maxDamage, 4);
});

test('Anomalia Gravitazionale limita FC a 3', () => {
  const duel = baseDuel({ pFocusUsed: 6, eFocusUsed: 5 });
  const log = [];
  applyDuelFieldSetup(duel, { name: 'Anomalia Gravitazionale', category: 'values' }, log, {}, {}, {}, {}, {});
  assert.equal(duel.pFocusUsed, 3);
  assert.equal(duel.eFocusUsed, 3);
});

test('Crocevia dei Patti imposta triggersIgnored nei context', () => {
  const duel = baseDuel();
  const pCtx = {};
  const eCtx = {};
  applyDuelFieldSetup(duel, { name: 'Crocevia dei Patti', category: 'trigger' }, [], {}, {}, pCtx, eCtx);
  assert.equal(pCtx.fieldModifiers.triggersIgnored, true);
  assert.equal(eCtx.fieldModifiers.triggersIgnored, true);
});
