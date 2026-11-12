import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLastingStates } from './eminenceLastingStates.js';
import { createEminenceMatchState } from './eminenceState.js';

const match = () => createEminenceMatchState({ playerEminenceId: 'figli_domanda_senza_fine', enemyEminenceId: 'corte_rossa' });
const withPersistent = (state, side, patch) => ({ ...state, [side]: { ...state[side], persistent: { ...state[side].persistent, ...patch } } });
const words = (list) => list.map((entry) => `${entry.label}: ${entry.word}`);

test('nessuno stato a inizio Scontro o senza stato', () => {
  assert.deepEqual(buildLastingStates(null), { player: [], enemy: [] });
  assert.deepEqual(buildLastingStates(match()), { player: [], enemy: [] });
});

test('i debiti di fine Scontro si sommano in una sola voce sul lato che paga', () => {
  const state = withPersistent(match(), 'enemy', { endMatchDebts: [
    { side: 'enemy', amount: 2, dueAt: 'END_MATCH', source: 'x' },
    { side: 'enemy', amount: 1, dueAt: 'END_MATCH', source: 'x' },
  ] });
  const out = buildLastingStates(state);
  assert.deepEqual(words(out.enemy), ['Debito: −3 PV · a fine Scontro']);
  assert.equal(out.enemy[0].army, 'Corte Rossa');
  assert.deepEqual(out.player, []);
});

test('un debito registrato da un lato ma a carico dell\'altro va su chi paga; importo ignoto = da stabilire', () => {
  const state = withPersistent(match(), 'enemy', { endMatchDebts: [{ side: 'player', amount: null, dueAt: null, ownerSide: 'enemy' }] });
  const out = buildLastingStates(state);
  assert.deepEqual(words(out.player), ['Debito: PV da stabilire · a fine Duello']);
  assert.deepEqual(out.enemy, []);
});

test('soglia di Ancorato cambiata', () => {
  const out = buildLastingStates(withPersistent(match(), 'player', { anchoredThresholdDelta: 2 }));
  assert.deepEqual(words(out.player), ['Ancorato: soglia +2 FC']);
});

test('Bonus d\'Armata sostituito, con la durata', () => {
  const until = buildLastingStates(withPersistent(match(), 'player', { armyBonusOverride: { override: {}, until: 'OWN_WIN', source: null } }));
  assert.deepEqual(words(until.player), ["Bonus d'Armata: sostituito · fino a una vittoria"]);
  const forever = buildLastingStates(withPersistent(match(), 'player', { armyBonusOverride: { override: {}, until: null, source: null } }));
  assert.deepEqual(words(forever.player), ["Bonus d'Armata: sostituito · per tutto lo Scontro"]);
});

test('Eminenza bloccata: questo round o il prossimo', () => {
  const base = match();
  assert.deepEqual(words(buildLastingStates({ ...base, player: { ...base.player, blockedThisRound: true } }).player), ['Eminenza: bloccata · questo round']);
  assert.deepEqual(words(buildLastingStates({ ...base, enemy: { ...base.enemy, blockedNextRound: true } }).enemy), ['Eminenza: bloccata · prossimo round']);
});
