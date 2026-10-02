import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDuelHpBursts,
  scheduleDuelHpEvents,
  displayedHpAt,
  HP_PROJECTILE_FLIGHT_MS,
  HP_PROJECTILE_GAP_MS,
} from './duelHpPresentation.js';

const field = { name: 'Miniera di Lacrime' };

test('DAN al perdente poi cura del Campo al vincitore', () => {
  const br = { winner: 'player', damageDealt: 4, finalPlayerHP: 20, finalEnemyHP: 17, field };
  const b = buildDuelHpBursts(br, { player: 18, enemy: 21 });
  assert.deepEqual(b.damage, { side: 'enemy', amount: 4 });
  assert.deepEqual(b.aftermath, [{ side: 'player', kind: 'heal', amount: 2, label: 'Miniera di Lacrime' }]);
});

test('perdita extra del vincitore (Nido di Spine) come raffica di colpi', () => {
  const br = { winner: 'enemy', damageDealt: 3, finalPlayerHP: 22, finalEnemyHP: 15, field: { name: 'Nido di Spine' } };
  const b = buildDuelHpBursts(br, { player: 25, enemy: 20 });
  assert.deepEqual(b.damage, { side: 'player', amount: 3 });
  assert.deepEqual(b.aftermath, [{ side: 'enemy', kind: 'hit', amount: 5, label: 'Nido di Spine' }]);
});

test('il DAN non scende sotto 0 PV', () => {
  const br = { winner: 'player', damageDealt: 6, finalPlayerHP: 10, finalEnemyHP: 0, field };
  const b = buildDuelHpBursts(br, { player: 10, enemy: 2 });
  assert.deepEqual(b.damage, { side: 'enemy', amount: 2 });
  assert.equal(b.aftermath.length, 0);
});

test('pareggio o danno nullo: nessun proiettile', () => {
  const b = buildDuelHpBursts({ winner: 'draw', damageDealt: 0, finalPlayerHP: 25, finalEnemyHP: 25 }, { player: 25, enemy: 25 });
  assert.equal(b.damage, null);
  assert.equal(b.aftermath.length, 0);
});

test('eventi punto per punto: il numero scende di uno a ogni colpo e la raffica conta', () => {
  const br = { winner: 'player', damageDealt: 3, finalPlayerHP: 20, finalEnemyHP: 18, field };
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
