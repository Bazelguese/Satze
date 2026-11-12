import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneForNotice, scenesForDuelResult, sceneForDebtEscalation } from './abilitySceneTriggers.js';
import { ABILITY_SCENE_IDS, createAbilityScene } from './abilityScenes.js';
import { EMINENCES } from '../../data/eminences.js';

test('ogni scena corrisponde a un\'abilità o a uno Statico del catalogo', () => {
  const ids = new Set(Object.values(EMINENCES).flatMap((e) => [e.static?.id, ...e.abilities.map((a) => a.id)]));
  ABILITY_SCENE_IDS.forEach((id) => assert.ok(ids.has(id), id));
});

test('Ascensione: alla rivelazione, con la Presenza davvero spesa', () => {
  const matchState = { player: { presenceSpentThisRound: 5, selectedParams: null } };
  assert.deepEqual(sceneForNotice({ id: 'reveal:player:enclave_ascensione:GENERAL', presenceDelta: -3 }, { matchState, agentPowerBySide: { player: 4 } }),
    { id: 'enclave_ascensione', side: 'player', data: { spent: 5, basePower: 4 } });
  assert.equal(sceneForNotice({ id: 'effect:player:enclave_ascensione:X:hit' }, { matchState }), null);
});

test('Risposta: solo se la condizione è avverata', () => {
  assert.deepEqual(sceneForNotice({ id: 'effect:enemy:figli_risposta:BEFORE_TRIGGER_CHECK:hit', outcome: 'hit' }), { id: 'figli_risposta', side: 'enemy' });
  assert.equal(sceneForNotice({ id: 'effect:enemy:figli_risposta:BEFORE_TRIGGER_CHECK:miss', outcome: 'miss' }), null);
  assert.equal(sceneForNotice({ id: 'reveal:enemy:figli_risposta:GENERAL' }), null);
});

test('Caccia e Vendetta: la carta scelta, nella mano giusta', () => {
  const matchState = { enemy: { selectedParams: { preyCardId: 12 } }, player: { selectedParams: { cardId: 7 } } };
  assert.deepEqual(sceneForNotice({ id: 'reveal:enemy:mounthborn_caccia:GENERAL' }, { matchState }), { id: 'mounthborn_caccia', side: 'enemy', handSide: 'player', cardId: 12 });
  assert.deepEqual(sceneForNotice({ id: 'reveal:player:ratti_vendetta:DEPLOY' }, { matchState }), { id: 'ratti_vendetta', side: 'player', handSide: 'player', cardId: 7 });
  assert.equal(sceneForNotice({ id: 'reveal:player:mounthborn_caccia:GENERAL' }, { matchState }), null);
});

test('Cataclisma Verde: solo lo Statico al round 5', () => {
  assert.deepEqual(sceneForNotice({ id: 'static:player:ora_verde:5', roundNumber: 5 }, { currentFieldIndex: 2 }), { id: 'ora_verde', side: 'player', slotIndex: 2, data: {} });
  assert.equal(sceneForNotice({ id: 'static:player:ora_verde:3', roundNumber: 3 }), null);
});

test('le altre abilità e gli avvisi senza scena non avviano niente', () => {
  assert.equal(sceneForNotice({ id: 'reveal:player:corte_prestito:PRE_FIELD' }), null);
  assert.equal(sceneForNotice({ id: 'reveal:player:calibri_terra_bruciata:GENERAL' }), null);
  assert.equal(sceneForNotice(null), null);
});

test('risultato del Duello: Maledizione Inversa all\'avvio con le cifre vere, Terra Bruciata alla fine', () => {
  const matchState = { player: { eminenceId: 'calibri_quattro_fronti', revealedAbilityId: 'calibri_terra_bruciata' }, enemy: { eminenceId: 'khemet_maledizioni' } };
  const out = scenesForDuelResult({ fieldIndex: 3, winner: 'enemy', fieldDestroyed: true, statInversions: [
    { side: 'player', stat: 'VA', from: 5, to: -5 }, { side: 'enemy', stat: 'POT', from: 1, to: -1 }, { side: 'enemy', stat: 'DAN', from: -2, to: -2 },
  ] }, matchState);
  assert.deepEqual(out.start, [{ id: 'khemet_maledizione_inversa', side: 'enemy', slotIndex: 3, data: {
    own: [{ stat: 'POT', from: 1, to: -1 }, { stat: 'DAN', from: -2, to: -2 }], foe: [{ stat: 'VA', from: 5, to: -5 }] } }]);
  assert.deepEqual(out.end, [{ id: 'calibri_terra_bruciata', side: 'player', slotIndex: 3 }]);
  assert.deepEqual(scenesForDuelResult({ fieldIndex: 1, winner: 'player' }, matchState), { start: [], end: [] });
  assert.deepEqual(scenesForDuelResult(null), { start: [], end: [] });
});

test('Interessi: tutte le voci del Registro crescono insieme', () => {
  const debts = (amounts) => ({ eminenceId: 'corte_rossa', persistent: { endMatchDebts: amounts.map((amount, i) => ({ side: 'player', ownerSide: 'enemy', amount, source: i ? 'corte_rinforzo' : 'corte_prestito' })) } });
  const scene = sceneForDebtEscalation({ enemy: debts([2, 1]) }, { enemy: debts([4, 3]) });
  assert.equal(scene.id, 'corte_interessi');
  assert.equal(scene.side, 'enemy');
  assert.equal(scene.plateSide, 'player');
  assert.deepEqual(scene.data, { entries: [{ name: 'Prestito', from: 2, to: 4 }, { name: 'Rinforzo', from: 1, to: 3 }], totalBefore: 3, totalAfter: 7 });
  // una voce nuova non è «interessi»
  assert.equal(sceneForDebtEscalation({ enemy: debts([2]) }, { enemy: debts([2, 1]) }), null);
  assert.equal(sceneForDebtEscalation({ enemy: debts([2, 1]) }, { enemy: debts([2, 1]) }), null);
  assert.equal(sceneForDebtEscalation(null, null), null);
});

test('ogni scena si prepara e disegna senza errori lungo tutta la durata', () => {
  const calls = new Proxy({}, { get: (_, key) => (key === 'measureText' ? () => ({ width: 80 }) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  const g = { h: 900, pad: 600, own: [921, 323, 192, 281], foe: [488, 323, 192, 281], port: [800, 412], slot: [1260, 215, 321, 43], plate: [1430, 845, 155, 42], ann: [992, 780], hand: [[20, 113, 123, 178], [157, 100, 118, 172]], card: [157, 100, 118, 172] };
  const data = { spent: 4, basePower: 4, own: [{ stat: 'VA', from: 5, to: -5 }], foe: [{ stat: 'POT', from: 1, to: 1 }], entries: [{ name: 'Prestito', from: 2, to: 4 }], totalBefore: 2, totalAfter: 4 };
  ABILITY_SCENE_IDS.forEach((id) => {
    const scene = createAbilityScene(id, { g, data });
    for (let t = 0; t <= scene.duration; t += 110) scene.draw(calls, t);
  });
  assert.equal(createAbilityScene('corte_prestito', { g }), null);
});
