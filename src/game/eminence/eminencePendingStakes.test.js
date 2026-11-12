import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPendingStakes } from './eminencePendingStakes.js';
import { EMINENCES } from '../../data/eminences.js';

const side = (eminenceId, revealedAbilityId, selectedParams = null) => ({ eminenceId, revealedAbilityId, selectedParams, persistent: {} });
const idOf = (eminenceId, name) => EMINENCES[eminenceId].abilities.find((a) => a.name === name).id;
const stakes = (eminenceId, name, params) => buildPendingStakes({
  player: side(eminenceId, idOf(eminenceId, name), params),
  enemy: side('calibri_quattro_fronti', null),
});
const lines = (list) => list.map((s) => `${s.condition} → ${s.payoff}`);

test('niente in sospeso senza stato o senza abilità rivelata', () => {
  assert.deepEqual(buildPendingStakes(null), []);
  assert.deepEqual(buildPendingStakes({ player: side('corte_rossa', null), enemy: side('corte_rossa', null) }), []);
});

test('Verde: se si attiva Turbo o Intervento', () => {
  const out = stakes('patto_grande_semaforo', 'Verde');
  assert.deepEqual(lines(out), ['Se si attiva Turbo o Intervento → +1 Presenza']);
  assert.equal(out[0].tone, 'gain');
  assert.equal(out[0].ownerSide, 'player');
});

test('Scommessa: la condizione segue il pronostico scelto; senza pronostico niente riga', () => {
  assert.deepEqual(lines(stakes('mascarada_organizzatore', 'Scommessa', { pronostico: 'VITTORIA_AVVERSARIA' })), ['Se perde il Duello → +1 Presenza']);
  assert.deepEqual(lines(stakes('mascarada_organizzatore', 'Scommessa', { pronostico: 'PAREGGIO' })), ['Se il Duello finisce pari → +1 Presenza']);
  assert.deepEqual(stakes('mascarada_organizzatore', 'Scommessa'), []);
});

test('Furto di Reliquie: due esiti sulla stessa condizione in una riga sola', () => {
  assert.deepEqual(lines(stakes('enclave_ascensione', 'Furto di Reliquie')), ["Se vince il Duello → −2 Presenza all'avversario, +1 Presenza"]);
});

test('Fame: due condizioni, entrambe una perdita', () => {
  const out = stakes('mounthborn_fame', 'Fame');
  assert.deepEqual(lines(out), ['Se non vince il Duello → perde 2 PV', 'Se vince il Duello, non contro una Preda → perde 2 PV']);
  assert.ok(out.every((s) => s.tone === 'loss'));
});

test('ogni condizione di fine Duello delle abilità in catalogo ha la sua riga', () => {
  for (const eminence of Object.values(EMINENCES)) {
    for (const ability of eminence.abilities) {
      const wanted = new Set((ability.segments || [])
        .filter((seg) => seg.timing === 'AFTER_DUEL_OUTCOME' && seg.condition)
        .map((seg) => JSON.stringify(seg.condition))).size;
      if (!wanted) continue;
      const out = stakes(eminence.id, ability.name, { pronostico: 'VITTORIA_PROPRIA' });
      assert.equal(out.length, wanted, `${eminence.id} · ${ability.name}`);
    }
  }
});

test('a Duello deciso ogni riga porta il suo esito; prima resta in sospeso', () => {
  const state = { player: side('mounthborn_fame', idOf('mounthborn_fame', 'Fame')), enemy: side('calibri_quattro_fronti', null) };
  assert.deepEqual(buildPendingStakes(state).map((s) => s.outcome), [null, null]);
  const segs = EMINENCES.mounthborn_fame.abilities.find((a) => a.name === 'Fame').segments;
  const outcomes = [
    { side: 'player', abilityId: idOf('mounthborn_fame', 'Fame'), condition: segs[0].condition, hit: true },
    { side: 'player', abilityId: idOf('mounthborn_fame', 'Fame'), condition: segs[1].condition, hit: false },
    { side: 'enemy', abilityId: idOf('mounthborn_fame', 'Fame'), condition: segs[1].condition, hit: true },
  ];
  assert.deepEqual(buildPendingStakes(state, outcomes).map((s) => s.outcome), ['hit', 'miss']);
});
