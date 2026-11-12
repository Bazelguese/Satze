import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoundRules } from './eminenceRoundRules.js';
import { buildAgentMarks } from './eminenceAgentMarks.js';

const side = (eminenceId, revealedAbilityId) => ({ eminenceId, revealedAbilityId, selectedParams: null, persistent: {} });

test('nessuna regola senza stato o senza abilità rivelata', () => {
  assert.deepEqual(buildRoundRules(null), []);
  assert.deepEqual(buildRoundRules({ player: side('patto_grande_semaforo', null), enemy: side('corte_rossa', null) }), []);
});

test('Giallo: Imboscata e Turbo soddisfatti per tutti', () => {
  const [rule, ...rest] = buildRoundRules({ player: side('patto_grande_semaforo', 'semaforo_giallo'), enemy: side('corte_rossa', null) });
  assert.equal(rest.length, 0);
  assert.equal(rule.abilityName, 'Giallo');
  assert.equal(rule.ownerSide, 'player');
  assert.deepEqual(rule.lines, [{ kind: 'forced', triggers: ['Imboscata', 'Turbo'] }]);
});

test('Rosso: due righe, soddisfatti e vietati', () => {
  const [rule] = buildRoundRules({ player: side('corte_rossa', null), enemy: side('patto_grande_semaforo', 'semaforo_rosso') });
  assert.equal(rule.ownerSide, 'enemy');
  assert.deepEqual(rule.lines.map((l) => l.kind), ['forced', 'forbidden']);
  assert.deepEqual(rule.lines[1].triggers, ['Imboscata', 'Turbo']);
});

test('Silenzio: trigger sostituito con Magnanimo', () => {
  const [rule] = buildRoundRules({ player: side('orathai_primo_canto', 'orathai_silenzio'), enemy: side('corte_rossa', null) });
  assert.deepEqual(rule.lines, [{ kind: 'replaced', triggers: ['Magnanimo'] }]);
});

test('le abilità che toccano un solo Agente non sono regole del round', () => {
  assert.deepEqual(buildRoundRules({ player: side('patto_grande_semaforo', 'semaforo_verde'), enemy: side('calibri_quattro_fronti', null) }), []);
});

test('una regola del round non lascia anche il segno sugli Agenti', () => {
  const marks = buildAgentMarks({ player: side('patto_grande_semaforo', 'semaforo_rosso'), enemy: side('corte_rossa', null) });
  assert.deepEqual(marks, { player: [], enemy: [] });
});
