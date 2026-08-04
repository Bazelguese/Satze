import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDuelFieldSetup } from './duelFieldSetup.js';
import { applyDuelFieldLateEffects, resolveFieldArmyBonuses, MERIDIANO_SOLE_VERDE_BONUS } from '../battlefieldDeepEffects.js';
import { checkTrigger } from '../triggerLogic.js';
import { applyBattlefieldRoundAftermath } from '../fieldBattleAftermath.js';
import { getFieldSetupFlags } from '../battlefieldEffects.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';

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
    pImmune: false,
    eImmune: false,
    pHPCurrent: 20,
    eHPCurrent: 15,
    ...overrides,
  };
}

function field(id) {
  return ALL_BATTLEFIELDS.find((f) => f.id === id);
}

test('catalogo include campi 84–113', () => {
  assert.equal(ALL_BATTLEFIELDS.length, 113);
  assert.equal(field(84).name, 'Cimitero dei Colossi');
  assert.equal(field(89).tema, 'Apex');
  assert.equal(field(101).name, 'Ponte dei Tre Piloni');
  assert.equal(field(102).name, 'Faro di Vetta Grigia');
  assert.equal(field(113).name, 'Lago delle Sette Lune');
});

test('84: +5 VA a Lega più alta', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(
    duel,
    field(84),
    [],
    { league: 5, power: 5, damage: 3 },
    { league: 2, power: 5, damage: 3 },
    { isFirst: true },
    { isFirst: false }
  );
  assert.equal(duel.pAssaultMod, 5);
  assert.equal(duel.eAssaultMod, 0);
});

test('87: −1 POT a chi ha meno campi conquistati', () => {
  const duel = baseDuel({ pPower: 4, ePower: 4 });
  applyDuelFieldSetup(
    duel,
    field(87),
    [],
    { league: 2, power: 4, damage: 2 },
    { league: 2, power: 4, damage: 2 },
    { isFirst: true, playerFieldsConquered: 0, enemyFieldsConquered: 2 },
    { isFirst: false }
  );
  assert.equal(duel.pPower, 3);
  assert.equal(duel.ePower, 4);
});

test('88: invasioneAlwaysActive', () => {
  const flags = getFieldSetupFlags(field(88));
  assert.equal(flags.invasioneAlwaysActive, true);
  assert.equal(
    checkTrigger('invasione', { playerFieldsConquered: 0, fieldModifiers: flags }),
    true
  );
});

test('89: sostituisce Bonus Armata', () => {
  const raw = { trigger: 'invasione', effects: [{ effect: 'assaultValue', value: 5 }] };
  const r = resolveFieldArmyBonuses(field(89), true, true, raw, raw);
  assert.deepEqual(r.pArmyBonus, MERIDIANO_SOLE_VERDE_BONUS);
  assert.deepEqual(r.eArmyBonus, MERIDIANO_SOLE_VERDE_BONUS);
});

test('90: +4 VA a chi ha meno PV', () => {
  const duel = baseDuel({ pHPCurrent: 10, eHPCurrent: 20 });
  applyDuelFieldSetup(duel, field(90), [], { league: 2 }, { league: 2 }, { isFirst: true }, {});
  assert.equal(duel.pAssaultMod, 4);
});

test('94: stessa Lega spegne i Poteri', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(
    duel,
    field(94),
    [],
    { league: 3 },
    { league: 3 },
    { isFirst: true },
    {}
  );
  assert.equal(duel.pAbilityBlocked, true);
  assert.equal(duel.eAbilityBlocked, true);
});

test('96: DAN = Lega all’inizio', () => {
  const duel = baseDuel({ pDamage: 1, eDamage: 9 });
  applyDuelFieldSetup(
    duel,
    field(96),
    [],
    { league: 4, power: 5, damage: 1 },
    { league: 2, power: 5, damage: 9 },
    { isFirst: true },
    {}
  );
  assert.equal(duel.pDamage, 4);
  assert.equal(duel.eDamage, 2);
});

test('97: recupero FC perdente floor(investiti/2) max 3', () => {
  const r = applyBattlefieldRoundAftermath({
    field: field(97),
    winner: 'player',
    damageDealt: 2,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 4,
    pFocusUsed: 6,
    eFocusUsed: 5,
    battleLog: [],
  });
  assert.equal(r.eFCCurrent, 4 + 2); // floor(5/2)=2
});

test('99: clamp POT/DAN ±2 dal base', () => {
  const state = {
    pPower: 10,
    ePower: 1,
    pDamage: 8,
    eDamage: 0,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pImmune: false,
    eImmune: false,
  };
  applyDuelFieldLateEffects(field(99), state, { power: 5, damage: 3 }, { power: 5, damage: 3 }, []);
  assert.equal(state.pPower, 7);
  assert.equal(state.ePower, 3);
  assert.equal(state.pDamage, 5);
  assert.equal(state.eDamage, 1);
});

test('86: raddoppia modificatori VA', () => {
  const state = {
    pPower: 5,
    ePower: 5,
    pDamage: 3,
    eDamage: 3,
    pAssaultMod: 5,
    eAssaultMod: -3,
    pImmune: false,
    eImmune: false,
  };
  applyDuelFieldLateEffects(field(86), state, {}, {}, []);
  assert.equal(state.pAssaultMod, 10);
  assert.equal(state.eAssaultMod, -6);
});

test('100: FC max = Lega per lato', () => {
  const duel = baseDuel({ pFocusUsed: 5, eFocusUsed: 4 });
  applyDuelFieldSetup(
    duel,
    field(100),
    [],
    { league: 2 },
    { league: 3 },
    { isFirst: true },
    {}
  );
  assert.equal(duel.pFocusUsed, 2);
  assert.equal(duel.eFocusUsed, 3);
});

test('101: +4 VA con esattamente 3 FC', () => {
  const duel = baseDuel({ pFocusUsed: 3, eFocusUsed: 2 });
  applyDuelFieldSetup(duel, field(101), [], { league: 2 }, { league: 2 }, { isFirst: true }, {});
  assert.equal(duel.pAssaultMod, 4);
  assert.equal(duel.eAssaultMod, 0);
});

test('85 / 98 flags esposti', () => {
  assert.equal(getFieldSetupFlags(field(85)).winnerByFinalPowerThenVa, true);
  assert.equal(getFieldSetupFlags(field(98)).positivePowerModifiersDisabled, true);
});

test('102: +3 VA al 2° giocato', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(duel, field(102), [], { league: 2 }, { league: 2 }, { isFirst: true }, {});
  assert.equal(duel.pAssaultMod, 0);
  assert.equal(duel.eAssaultMod, 3);
});

test('104: +5 VA a chi ha meno campi', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(
    duel,
    field(104),
    [],
    { league: 2 },
    { league: 2 },
    { isFirst: true, playerFieldsConquered: 0, enemyFieldsConquered: 2 },
    {}
  );
  assert.equal(duel.pAssaultMod, 5);
});

test('105: stessa Lega · +1 DAN', () => {
  const duel = baseDuel({ pDamage: 2, eDamage: 2 });
  applyDuelFieldSetup(duel, field(105), [], { league: 3 }, { league: 3 }, { isFirst: true }, {});
  assert.equal(duel.pDamage, 3);
  assert.equal(duel.eDamage, 3);
});

test('107: +3 VA al 1° giocato', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(duel, field(107), [], { league: 2 }, { league: 2 }, { isFirst: true }, {});
  assert.equal(duel.pAssaultMod, 3);
});

test('108 / 110 / 112 flags', () => {
  assert.equal(getFieldSetupFlags(field(108)).winnerByFinalDamageThenVa, true);
  assert.equal(getFieldSetupFlags(field(110)).positiveDamageModifiersDisabled, true);
  assert.equal(getFieldSetupFlags(field(112)).maxFinalPower, 7);
});

test('109: Bonus Armata disattivati', () => {
  const duel = baseDuel();
  applyDuelFieldSetup(duel, field(109), [], { league: 2 }, { league: 2 }, { isFirst: true }, {});
  assert.equal(duel.pBonusBlocked, true);
  assert.equal(duel.eBonusBlocked, true);
});

test('112: POT finale max 7', () => {
  const state = {
    pPower: 10,
    ePower: 8,
    pDamage: 3,
    eDamage: 3,
    pAssaultMod: 0,
    eAssaultMod: 0,
    pImmune: false,
    eImmune: false,
  };
  applyDuelFieldLateEffects(field(112), state, {}, {}, []);
  assert.equal(state.pPower, 7);
  assert.equal(state.ePower, 7);
});

test('103 / 106 / 113 aftermath', () => {
  const terme = applyBattlefieldRoundAftermath({
    field: field(103),
    winner: 'player',
    damageDealt: 2,
    pHPCurrent: 18,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 5,
    battleLog: [],
  });
  assert.equal(terme.pHPCurrent, 20);
  assert.equal(terme.eHPCurrent, 8);

  const porto = applyBattlefieldRoundAftermath({
    field: field(106),
    winner: 'enemy',
    damageDealt: 1,
    pHPCurrent: 20,
    eHPCurrent: 15,
    pFCCurrent: 4,
    eFCCurrent: 3,
    battleLog: [],
  });
  assert.equal(porto.eFCCurrent, 4);

  const lago = applyBattlefieldRoundAftermath({
    field: field(113),
    winner: 'player',
    damageDealt: 3,
    pHPCurrent: 20,
    eHPCurrent: 10,
    pFCCurrent: 5,
    eFCCurrent: 2,
    battleLog: [],
  });
  assert.equal(lago.eFCCurrent, 3);
  assert.equal(lago.eHPCurrent, 8); // 10-3+1
});
