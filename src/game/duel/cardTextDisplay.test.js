import test from 'node:test';
import assert from 'node:assert/strict';
import { getFieldSetupFlags } from '../battlefieldEffects.js';
import {
  resolveAbilityForDisplay,
  resolveAbilityForFieldDisplay,
  resolveArmyBonusForDisplay,
  formatGrantedAbilityDisplay,
  buildDisplayTriggerRules,
} from '../cardTextDisplay.js';

const ultimaChanceAbility = {
  trigger: 'ultimaChance',
  effect: 'directDamage',
  value: 4,
};

const figliBonus = {
  trigger: null,
  effects: [{ effect: 'enemyAssault', value: -5, minAssault: 6 }],
  description: '-5 VA nem. (min 6)',
};

const kethranBonus = {
  trigger: 'rimonta',
  effects: [{ effect: 'power', value: 2 }],
  description: 'Rimonta: +2 POT',
};

test('Il Circuito: 1° mostra Sfida al posto del trigger carta', () => {
  const mods = getFieldSetupFlags({ id: 74 });
  const view = resolveAbilityForFieldDisplay(ultimaChanceAbility, mods, { isFirst: true });
  assert.equal(view.trigger, 'sfida');
  assert.equal(view.effect, 'directDamage');
  assert.equal(view.value, 4);
});

test('Il Circuito prevale su REPLACE_TRIGGER Eminenza in display', () => {
  const mods = getFieldSetupFlags({ id: 74 });
  const rules = buildDisplayTriggerRules({
    triggerRules: {
      replacementsByCardId: {},
      persistentReplacementsByCardId: { 108: { trigger: 'debt' } },
    },
  });
  const view = resolveAbilityForDisplay(ultimaChanceAbility, {
    fieldMods: mods,
    isFirst: true,
    card: { id: 108 },
    triggerRules: rules,
  });
  assert.equal(view.trigger, 'sfida');
});

test('Debito persistente: mostra trigger Debito senza Circuito', () => {
  const rules = buildDisplayTriggerRules({
    matchState: {
      player: { persistent: { triggerReplacementsByCardId: { 108: { trigger: 'debt' } } } },
      enemy: { persistent: { triggerReplacementsByCardId: {} } },
    },
  });
  const view = resolveAbilityForDisplay(ultimaChanceAbility, {
    fieldMods: {},
    card: { id: 108 },
    triggerRules: rules,
  });
  assert.equal(view.trigger, 'debt');
});

test('Trono d’Ossidiana: Conquista valore ×2 in testo', () => {
  const mods = getFieldSetupFlags({ id: 61 });
  const view = resolveAbilityForDisplay(
    { trigger: 'conquest', effect: 'focusCoin', value: 2 },
    { fieldMods: mods }
  );
  assert.equal(view.value, 4);
});

test('Trono della Megera: Ultimo Desiderio valore ×2 in testo', () => {
  const mods = getFieldSetupFlags({ id: 68 });
  const view = resolveAbilityForDisplay(
    { trigger: 'lastWish', effect: 'directDamage', value: 3 },
    { fieldMods: mods }
  );
  assert.equal(view.value, 6);
});

test('Copia ↔ Imponi: scambia l’effetto stampato', () => {
  const mods = getFieldSetupFlags({ id: 118 });
  const view = resolveAbilityForFieldDisplay(
    { trigger: 'sfida', effect: 'copyPower', value: null },
    mods
  );
  assert.equal(view.effect, 'imponiPower');
});

test('Cattedrale del Decadimento: Bonus stampato sostituito', () => {
  const view = resolveArmyBonusForDisplay({
    field: { id: 70 },
    armyBonus: figliBonus,
    hasBonus: true,
    opponentArmyBonus: kethranBonus,
    opponentHasBonus: true,
  });
  assert.ok(view);
  assert.match(view.description, /Conquista: Tossina 2/);
});

test('Fogna Maestra: min sul Bonus ridotto nel testo', () => {
  const view = resolveArmyBonusForDisplay({
    field: { id: 66 },
    armyBonus: figliBonus,
    hasBonus: true,
    opponentArmyBonus: null,
    opponentHasBonus: false,
  });
  assert.ok(view);
  assert.match(view.description, /\(min 5\)/);
});

test('GRANT_POWER: formatGrantedAbilityDisplay', () => {
  const text = formatGrantedAbilityDisplay({
    trigger: null,
    effects: [
      { effect: 'power', value: 2 },
      { effect: 'damage', value: 2 },
    ],
  });
  assert.equal(text, '+2 POT, +2 DAN');
});
