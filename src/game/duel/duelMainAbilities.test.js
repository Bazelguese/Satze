import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelMainAbilities } from './duelMainAbilities.js';
import { canTriggerAbility } from './duelHelpers.js';

const baseCtx = { roundNumber: 1, fieldModifiers: {} };

function runMain(state, pAgent, eAgent, playerContext = baseCtx, enemyContext = baseCtx) {
  const calls = [];
  const applyEffect = (effect, value, target, source, log, opt) => {
    calls.push({ effect, value, target });
  };
  applyDuelMainAbilities({
    state,
    pAgent,
    eAgent,
    applyEffect,
    battleLog: [],
    playerContext,
    enemyContext,
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
    copyDisabled: false,
    modifiersDisabled: false,
    directDamageDisabled: false,
    directDamageBonus: 0,
  });
  return calls;
}

test('applica potere giocatore quando trigger turbo (round 1-2) soddisfatto', () => {
  const calls = runMain(
    { pAbilityBlocked: false, eAbilityBlocked: false },
    { name: 'A', ability: { trigger: 'turbo', effect: 'power', value: 2 } },
    { name: 'B' }
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].effect, 'power');
  assert.equal(calls[0].target, 'player');
});

test('non applica potere giocatore se bloccato', () => {
  const calls = runMain(
    { pAbilityBlocked: true, eAbilityBlocked: false },
    { name: 'A', ability: { trigger: 'turbo', effect: 'power', value: 1 } },
    { name: 'B' }
  );
  assert.equal(calls.length, 0);
});

test('applica potere IA quando trigger soddisfatto', () => {
  const calls = runMain(
    { pAbilityBlocked: false, eAbilityBlocked: false },
    { name: 'A' },
    { name: 'B', ability: { trigger: 'turbo', effect: 'damage', value: 1 } }
  );
  assert.ok(calls.some((c) => c.target === 'enemy' && c.effect === 'damage'));
});
