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
    state: { pBonusCopied: null, eBonusCopied: null },
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
    state: { pBonusCopied: null, eBonusCopied: null },
  });
  assert.equal(effects.length, 0);
});

test('bonus copiato Conquista: applica effetti post se il copiatore vince', () => {
  const bonusCalls = [];
  const applyBonusEffects = (bonus, target, context, source, log) => {
    bonusCalls.push({ effect: bonus.effects[0].effect, target, won: context.won });
  };
  const copiedBonus = {
    trigger: 'conquest',
    description: 'Conquista: +2 FC',
    effects: [{ effect: 'focusCoin', value: 2 }],
  };
  applyDuelPostBattleEffects({
    pAbilityBlocked: false,
    eAbilityBlocked: false,
    pBonusBlocked: false,
    eBonusBlocked: false,
    pHasBonus: true,
    eHasBonus: false,
    pArmyBonus: { trigger: null, effects: [{ effect: 'copyBonus' }] },
    eArmyBonus: null,
    pAgent: { name: 'P', army: "Corte Rossa" },
    eAgent: { name: 'E', army: "L'Enclave delle Scaglie" },
    applyEffect: () => {},
    applyBonusEffects,
    checkTrigger,
    fieldOptions: {},
    playerContextPost: { won: true, lost: false },
    enemyContextPost: { won: false, lost: true },
    battleLog: [],
    state: { pBonusCopied: copiedBonus, eBonusCopied: null },
  });
  assert.equal(bonusCalls.length, 1);
  assert.equal(bonusCalls[0].effect, 'focusCoin');
  assert.equal(bonusCalls[0].won, true);
});
