import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelPostBattleEffects } from './duelPostBattle.js';
import { checkTrigger } from '../triggerLogic.js';

test('conquista: applica potere post-battaglia al giocatore se vince', () => {
  const effects = [];
  const applyEffect = (effect, value, target, source, log, opts) => {
    effects.push({ effect, target });
  };
  const applyBonusEffects = () => {};
  const battleLog = [];
  applyDuelPostBattleEffects({
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pHasBonus: false,
    eHasBonus: false,
    pArmyBonus: null,
    eArmyBonus: null,
    pAgent: {
      name: 'P',
      ability: { trigger: 'conquest', effect: 'power', value: 2 },
    },
    eAgent: { name: 'E' },
    applyEffect,
    applyBonusEffects,
    checkTrigger,
    fieldOptions: {},
    playerContextPost: { won: true, lost: false },
    enemyContextPost: { won: false, lost: true },
    battleLog,
  });
  assert.ok(effects.some((e) => e.effect === 'power' && e.target === 'player'));
});

test('conquista: non applica potere post se il giocatore perde', () => {
  const effects = [];
  const applyEffect = (effect, value, target) => effects.push(effect);
  applyDuelPostBattleEffects({
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pHasBonus: false,
    eHasBonus: false,
    pArmyBonus: null,
    eArmyBonus: null,
    pAgent: {
      name: 'P',
      ability: { trigger: 'conquest', effect: 'power', value: 2 },
    },
    eAgent: { name: 'E' },
    applyEffect,
    applyBonusEffects: () => {},
    checkTrigger,
    fieldOptions: {},
    playerContextPost: { won: false, lost: true },
    enemyContextPost: { won: true, lost: false },
    battleLog: [],
  });
  assert.equal(effects.length, 0);
});
