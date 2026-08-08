import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NASCENTE_ID,
  CAP,
  STAT_CAPS,
  createNascente,
  valore,
  lega,
  stadioVisivo,
  fcCost,
  acquire,
  upgradeEffect,
  upgradeStats,
  change,
  assembleNascenteCard,
} from './nascente.js';
import { generateNascenteDescription } from './descriptionGen.js';

// Criterio di accettazione 4: stato iniziale 2/2 nudo
test('stato iniziale: 2/2 nudo → L2, stadio 0, description vuota', () => {
  const n = createNascente();
  assert.equal(n.power, 2);
  assert.equal(n.damage, 2);
  assert.equal(n.trigger, null);
  assert.equal(lega(n), 2);
  assert.equal(stadioVisivo(n), 0);
  assert.equal(generateNascenteDescription(n), '');
  const card = assembleNascenteCard(n);
  assert.equal(card.id, NASCENTE_ID);
  assert.equal(card.ability, null);
  assert.equal(card.league, 2);
  assert.equal(card.description, '');
});

// Criterio di accettazione 5: acquisizione Turbo/+POT valore 1
test('acquisizione turbo/power value 1 → description "Potere: Turbo: +1 POT"', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 1);
  assert.equal(generateNascenteDescription(n), 'Potere: Turbo: +1 POT');
  const card = assembleNascenteCard(n);
  assert.deepEqual(card.ability, { trigger: 'turbo', effect: 'power', value: 1 });
  assert.equal(card.description, 'Potere: Turbo: +1 POT');
});

test('description per ogni effetto della matrice (template, non hardcoded)', () => {
  const base = createNascente();
  assert.equal(
    generateNascenteDescription(acquire(base, 'imboscata', 'directDamage', 3)),
    'Potere: Imboscata: 3 Danni dir.'
  );
  assert.equal(
    generateNascenteDescription(acquire(base, 'vendetta', 'focusCoin', 2)),
    'Potere: Vendetta: +2 FC'
  );
  assert.equal(
    generateNascenteDescription(acquire(base, 'invasione', 'enemyPower', 3)),
    'Potere: Invasione: -3 POT nem. (min 2)'
  );
});

test('acquisizione fuori matrice → errore', () => {
  assert.throws(() => acquire(createNascente(), 'conquest', 'power'));
  assert.throws(() => acquire(createNascente(), 'turbo', 'enemyDamage'));
});

test('valore e Lega derivati: formula spec', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 1);
  // 2*.5 + 2*.35 + 1*.5*.85 = 1 + 0.7 + 0.425 = 2.125 → L2
  assert.ok(Math.abs(valore(n) - 2.125) < 1e-9);
  assert.equal(lega(n), 2);
});

// Criterio di accettazione 6: crescita oltre 4.35 → L4 (con cap Atto la UI segnala)
test('crescita oltre soglia 4.35 → Lega 4', () => {
  let n = acquire(createNascente(), 'turbo', 'power', 1);
  n = upgradeStats(n, { power: 2, damage: 2 }); // 4 POT / 4 DAN
  n = upgradeEffect(n, 3); // value 4 (cap power)
  // 4*.5 + 4*.35 + 4*.5*.85 = 2 + 1.4 + 1.7 = 5.1 → L4
  assert.ok(valore(n) > 4.35);
  assert.equal(lega(n), 4);
  assert.equal(stadioVisivo(n), 2);
});

test('upgradeEffect non supera mai il cap del pool', () => {
  let n = acquire(createNascente(), 'vendetta', 'focusCoin', 1);
  n = upgradeEffect(n, 99);
  assert.equal(n.value, CAP.focusCoin);
});

test('upgradeStats rispetta i cap assoluti POT 7 / DAN 6', () => {
  let n = createNascente();
  n = upgradeStats(n, { power: 99, damage: 99 });
  assert.equal(n.power, STAT_CAPS.power);
  assert.equal(n.damage, STAT_CAPS.damage);
});

// Criterio di accettazione 7: un cambio non aumenta mai il valore in FC
test('cambio effetto: converte al gradino FC pari o inferiore', () => {
  let n = acquire(createNascente(), 'turbo', 'power', 1);
  n = upgradeEffect(n, 3); // power 4 → costo FC 2.0
  const cost = fcCost(n);
  const changed = change(n, { effect: 'focusCoin' }); // gradini 0.7/1.4/2.1 → 1.4 (v=2)
  assert.ok(changed);
  assert.equal(changed.value, 2);
  assert.ok(fcCost(changed) <= cost + 1e-9);
});

test('cambio effetto impossibile (nessun gradino convertibile) → null', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 1); // costo 0.5
  // focusCoin gradino minimo 0.7 > 0.5: cambio non ammesso
  assert.equal(change(n, { effect: 'focusCoin' }), null);
});

test('cambio trigger mantiene effetto e valore', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 2);
  const changed = change(n, { trigger: 'imboscata' });
  assert.equal(changed.trigger, 'imboscata');
  assert.equal(changed.effect, 'power');
  assert.equal(changed.value, 2);
  assert.ok(fcCost(changed) <= fcCost(n) + 1e-9);
});

test('cambio con trigger e effetto insieme → errore', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 1);
  assert.throws(() => change(n, { trigger: 'imboscata', effect: 'focusCoin' }));
});

test('assembleNascenteCard per enemyPower usa valore negativo e minPower', () => {
  const n = acquire(createNascente(), 'invasione', 'enemyPower', 3);
  const card = assembleNascenteCard(n);
  assert.deepEqual(card.ability, { trigger: 'invasione', effect: 'enemyPower', value: -3, minPower: 2 });
  assert.equal(card.description, 'Potere: Invasione: -3 POT nem. (min 2)');
});

test('la Lega non è mai memorizzata nello stato', () => {
  const n = acquire(createNascente(), 'turbo', 'power', 1);
  assert.equal(Object.prototype.hasOwnProperty.call(n, 'league'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(n, 'visualStage'), false);
});
