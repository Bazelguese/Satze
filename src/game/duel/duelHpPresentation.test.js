import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuelHpBursts,
  scheduleDuelHpEvents,
  displayedHpAt,
  HP_PROJECTILE_FLIGHT_MS,
  HP_PROJECTILE_GAP_MS,
  HP_SOURCE_STAGGER_MS,
} from './duelHpPresentation.js';

const field = { id: 4, name: 'Miniera di Lacrime' };

/** Evento PV come lo scrive il motore (battleEventEmit.emitResourceChange). */
function pv(side, before, after, source, { phase = 'post', revealAt = 'postFx' } = {}) {
  return { type: 'resourceChange', stat: 'PV', phase, revealAt, target: { kind: 'player', side }, source, before, after };
}
const fieldSrc = { kind: 'field', id: '4', name: 'Miniera di Lacrime', ownerSide: null };

test('DAN al perdente, poi la cura del Campo al vincitore (aftermath misurato prima del DAN)', () => {
  const br = {
    winner: 'player', damageDealt: 4, finalPlayerHP: 20, finalEnemyHP: 17, field,
    events: [pv('opponent', 21, 17, fieldSrc), pv('local', 18, 20, fieldSrc)],
  };
  const b = buildDuelHpBursts(br, { player: 18, enemy: 21 });
  assert.deepEqual(b.damage, { side: 'enemy', amount: 4 });
  assert.deepEqual(b.aftermath.map(({ side, kind, amount, label }) => ({ side, kind, amount, label })), [
    { side: 'player', kind: 'heal', amount: 2, label: 'Miniera di Lacrime' },
  ]);
});

test('due fonti di cura (Potere e Campo): due raffiche separate, con il loro nome', () => {
  const ability = { kind: 'ability', id: 'TU (Tecnico di Prima Linea)', name: 'TU (Tecnico di Prima Linea)', ownerSide: 'local' };
  const br = {
    winner: 'player', damageDealt: 3, finalPlayerHP: 22, finalEnemyHP: 18, field,
    events: [pv('local', 18, 20, ability), pv('opponent', 21, 18, fieldSrc), pv('local', 20, 22, fieldSrc)],
  };
  const start = { player: 18, enemy: 21 };
  const b = buildDuelHpBursts(br, start);
  assert.deepEqual(b.aftermath.map(({ kind, amount, label }) => [kind, amount, label]), [
    ['heal', 2, 'Tecnico di Prima Linea'],
    ['heal', 2, 'Miniera di Lacrime'],
  ]);
  const ev = scheduleDuelHpEvents(br, start).filter((e) => e.cause === 'aftermath');
  const groups = [...new Set(ev.map((e) => e.group))];
  assert.equal(groups.length, 2);
  // partono insieme, sfalsate: il numero sale comunque di uno alla volta
  const first = groups.map((g) => ev.find((e) => e.group === g).t);
  assert.equal(first[1] - first[0], HP_SOURCE_STAGGER_MS);
  assert.deepEqual(ev.map((e) => e.to), [19, 20, 21, 22]);
  // ognuna ha il suo posto (le etichette non si sovrappongono)
  assert.notEqual(ev.find((e) => e.group === groups[0]).slot, ev.find((e) => e.group === groups[1]).slot);
});

test('perdita extra del vincitore (Nido di Spine) come raffica di colpi', () => {
  const nido = { kind: 'field', id: '9', name: 'Nido di Spine', ownerSide: null };
  const br = {
    winner: 'enemy', damageDealt: 3, finalPlayerHP: 22, finalEnemyHP: 15, field: { name: 'Nido di Spine' },
    events: [pv('local', 25, 22, nido), pv('opponent', 20, 15, nido)],
  };
  const b = buildDuelHpBursts(br, { player: 25, enemy: 20 });
  assert.deepEqual(b.damage, { side: 'player', amount: 3 });
  assert.deepEqual(b.aftermath.map(({ side, kind, amount, label }) => [side, kind, amount, label]), [['enemy', 'hit', 5, 'Nido di Spine']]);
});

test('quel che il log non spiega (Eminenze a fine duello) diventa una fonte a sé', () => {
  const br = {
    winner: 'player', damageDealt: 2, finalPlayerHP: 24, finalEnemyHP: 23, eminenceOutcomeNotices: [{}],
    events: [pv('opponent', 25, 23, fieldSrc)],
  };
  const b = buildDuelHpBursts(br, { player: 25, enemy: 25 });
  assert.deepEqual(b.damage, { side: 'enemy', amount: 2 });
  assert.deepEqual(b.aftermath.map(({ side, kind, amount, label }) => [side, kind, amount, label]), [['player', 'hit', 1, 'Eminenza']]);
});

test('il DAN non scende sotto 0 PV; senza log vale il DAN dichiarato', () => {
  const b = buildDuelHpBursts({ winner: 'player', damageDealt: 6, finalPlayerHP: 10, finalEnemyHP: 0 }, { player: 10, enemy: 2 });
  assert.deepEqual(b.damage, { side: 'enemy', amount: 2 });
  assert.equal(b.aftermath.length, 0);
});

test('pareggio o danno nullo: nessun proiettile', () => {
  const b = buildDuelHpBursts({ winner: 'draw', damageDealt: 0, finalPlayerHP: 25, finalEnemyHP: 25 }, { player: 25, enemy: 25 });
  assert.equal(b.damage, null);
  assert.equal(b.aftermath.length, 0);
});

test('eventi punto per punto: il numero scende di uno a ogni colpo e la raffica conta', () => {
  const br = {
    winner: 'player', damageDealt: 3, finalPlayerHP: 20, finalEnemyHP: 18, field,
    events: [pv('opponent', 21, 18, fieldSrc), pv('local', 18, 20, fieldSrc)],
  };
  const start = { player: 18, enemy: 21 };
  const ev = scheduleDuelHpEvents(br, start);
  const hits = ev.filter((e) => e.cause === 'damage');
  assert.deepEqual(hits.map((e) => [e.from, e.to, e.n]), [[21, 20, 1], [20, 19, 2], [19, 18, 3]]);
  assert.equal(hits[0].t, HP_PROJECTILE_FLIGHT_MS);
  assert.equal(hits[1].t - hits[0].t, HP_PROJECTILE_GAP_MS);
  const heals = ev.filter((e) => e.cause === 'aftermath');
  assert.deepEqual(heals.map((e) => [e.to, e.n, e.kind]), [[19, 1, 'heal'], [20, 2, 'heal']]);
  assert.ok(heals[0].t > hits[2].t);
  assert.deepEqual(displayedHpAt(ev, start, 0), { player: 18, enemy: 21 });
  assert.deepEqual(displayedHpAt(ev, start, hits[1].t), { player: 18, enemy: 19 });
  assert.deepEqual(displayedHpAt(ev, start, 1e9), { player: 20, enemy: 18 });
});
