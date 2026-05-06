import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDuelTriggerUiFlags } from './duelTriggerUiFlags.js';
import { checkTrigger } from '../triggerLogic.js';
import { canTriggerAbility } from './duelHelpers.js';

const baseState = {
  pAbilityBlocked: false,
  eAbilityBlocked: false,
  pBonusBlocked: false,
  eBonusBlocked: false,
};

test('trigger conquest non imposta pAbilityNotTriggered anche se check fallirebbe', () => {
  const r = computeDuelTriggerUiFlags({
    state: baseState,
    pAgent: { ability: { trigger: 'conquest', effect: 'power', value: 1 } },
    eAgent: {},
    pHasBonus: false,
    eHasBonus: false,
    pArmyBonus: null,
    eArmyBonus: null,
    playerContext: {},
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: () => false,
    checkTrigger,
  });
  assert.equal(r.pAbilityNotTriggered, false);
});

test('turbo (round 1-2) non soddisfatto → pAbilityNotTriggered', () => {
  const r = computeDuelTriggerUiFlags({
    state: baseState,
    pAgent: { ability: { trigger: 'turbo', effect: 'power', value: 1 } },
    eAgent: {},
    pHasBonus: false,
    eHasBonus: false,
    pArmyBonus: null,
    eArmyBonus: null,
    playerContext: { roundNumber: 5, fieldModifiers: {} },
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
    checkTrigger,
  });
  assert.equal(r.pAbilityNotTriggered, true);
});

test('bonus soddisfatto: pBonusTriggerSatisfied true', () => {
  const bonus = { trigger: 'turbo', effects: [{ effect: 'power', value: 1 }] };
  const r = computeDuelTriggerUiFlags({
    state: baseState,
    pAgent: {},
    eAgent: {},
    pHasBonus: true,
    eHasBonus: false,
    pArmyBonus: bonus,
    eArmyBonus: null,
    playerContext: { roundNumber: 1, fieldModifiers: {} },
    enemyContext: {},
    triggersIgnored: false,
    duelCanTriggerAbility: canTriggerAbility,
    checkTrigger,
  });
  assert.equal(r.pBonusTriggerSatisfied, true);
});
