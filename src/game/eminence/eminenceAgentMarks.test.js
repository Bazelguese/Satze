import test from 'node:test';
import assert from 'node:assert/strict';

import { EMINENCES } from '../../data/eminences.js';
import { buildAgentMarks } from './eminenceAgentMarks.js';

const idOf = (eminenceName, abilityName) => {
  const eminence = Object.values(EMINENCES).find((e) => e.name === eminenceName);
  return [eminence.id, eminence.abilities.find((a) => a.name === abilityName).id];
};
const state = (owner, eminenceName, abilityName, extra = {}) => {
  const [eminenceId, revealedAbilityId] = idOf(eminenceName, abilityName);
  return { [owner]: { eminenceId, revealedAbilityId, selectedParams: null, persistent: {}, ...extra } };
};
const words = (list) => list.map((m) => `${m.word}${m.conditional ? '?' : ''}`);

test('segni: niente stato, niente abilità rivelata', () => {
  assert.deepEqual(buildAgentMarks(null), { player: [], enemy: [] });
  const [eminenceId] = idOf('La Fame', 'Fame');
  assert.deepEqual(buildAgentMarks({ player: { eminenceId, revealedAbilityId: null } }), { player: [], enemy: [] });
});

test('segni: sul proprio Agente e su quello nemico', () => {
  const own = buildAgentMarks(state('player', 'Il Comando dei Quattro Fronti', 'Fermo Macchine'));
  assert.deepEqual(words(own.player), ['Potere bloccato']);
  assert.deepEqual(own.enemy, []);
  const foe = buildAgentMarks(state('player', "L'Organizzatore degli Incontri", 'Vendere il Colpo'));
  assert.deepEqual(words(foe.enemy), ['+1 FC temporanei']);
  assert.equal(foe.enemy[0].ownerSide, 'player');
  const swap = buildAgentMarks(state('enemy', 'La Fame', 'Frenesia della Fame'));
  assert.deepEqual(words(swap.enemy), ['Potere sostituito']);
});

test('segni: le regole del round (Semaforo) non stanno sugli Agenti ma sulla targa del round', () => {
  const marks = buildAgentMarks(state('player', 'Il Grande Semaforo', 'Rosso'));
  assert.deepEqual(marks, { player: [], enemy: [] });
});

test('segni: le Offerte contano solo se accettate, e nella variante scelta', () => {
  const refused = buildAgentMarks(state('enemy', 'Sanguinaccio, il Registro', 'Rinforzo', { selectedParams: { dealAccepted: false } }));
  assert.deepEqual(refused.player, []);
  const accepted = buildAgentMarks(state('enemy', 'Sanguinaccio, il Registro', 'Rinforzo', { selectedParams: { dealAccepted: true, dealChoice: 'power' } }));
  assert.deepEqual(words(accepted.player), ['+1 POT']);
});

test('segni: condizioni che si decidono nel Duello restano in forse', () => {
  const marks = buildAgentMarks(state('player', 'La Domanda Senza Fine', 'Risposta'));
  assert.deepEqual(words(marks.player).sort(), ['Immune?', 'Trigger soddisfatto?']);
});

test('segni: Bonus sostituito da un round precedente', () => {
  const [eminenceId] = idOf('Il Sole Verde', 'Disprezzo');
  const marks = buildAgentMarks({ player: { eminenceId, revealedAbilityId: null, persistent: { armyBonusOverride: { override: {} } } } });
  assert.deepEqual(words(marks.player), ['Bonus sostituito']);
});
