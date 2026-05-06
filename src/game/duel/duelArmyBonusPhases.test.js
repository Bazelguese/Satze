import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelArmyBonusPhases } from './duelArmyBonusPhases.js';
import { checkTrigger } from '../triggerLogic.js';

const ctxRound1 = { roundNumber: 1, fieldModifiers: {} };

test('fase own + enemy: bonus turbo (round 1-2) applicato due volte (own + enemy stats)', () => {
  const calls = [];
  const pArmyBonus = { trigger: 'turbo', effects: [{ effect: 'power', value: 1 }] };
  const applyBonusEffects = (bonus, target, context, source, log, onlyOwn, onlyEnemy) => {
    calls.push({ onlyOwn, onlyEnemy, target });
  };
  applyDuelArmyBonusPhases({
    state: { pBonusBlocked: false, eBonusBlocked: false },
    pHasBonus: true,
    eHasBonus: false,
    pArmyBonus,
    eArmyBonus: null,
    pAgent: { army: 'Test' },
    eAgent: { army: 'X' },
    playerContext: ctxRound1,
    enemyContext: ctxRound1,
    battleLog: [],
    applyBonusEffects,
    checkTrigger,
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].onlyOwn, true);
  assert.equal(calls[0].onlyEnemy, false);
  assert.equal(calls[1].onlyOwn, false);
  assert.equal(calls[1].onlyEnemy, true);
});

test('bonus bloccato: nessuna chiamata', () => {
  const calls = [];
  const applyBonusEffects = () => calls.push(1);
  applyDuelArmyBonusPhases({
    state: { pBonusBlocked: true, eBonusBlocked: false },
    pHasBonus: true,
    eHasBonus: false,
    pArmyBonus: { trigger: 'turbo', effects: [{ effect: 'power', value: 1 }] },
    eArmyBonus: null,
    pAgent: { army: 'Test' },
    eAgent: { army: 'X' },
    playerContext: ctxRound1,
    enemyContext: ctxRound1,
    battleLog: [],
    applyBonusEffects,
    checkTrigger,
  });
  assert.equal(calls.length, 0);
});
