import test from 'node:test';
import assert from 'node:assert/strict';
import { warpClashTime, clashCardMotion, clashCamera, clashImpactFx, CLASH_CONTACT_PX } from './duelClashMotion.js';

const cfg = { winner: 'player', start: 64 * 1.05, baseScale: 1.05 };

test('tempo deformato: monotono, rallenta all\'impatto, da 0 a 1', () => {
  let prev = -1;
  for (let u = 0; u <= 1.0001; u += 0.01) {
    const w = warpClashTime(Math.min(1, u));
    assert.ok(w >= prev);
    prev = w;
  }
  assert.equal(warpClashTime(0), 0);
  assert.ok(Math.abs(warpClashTime(1) - 1) < 1e-9);
  // tra 0.52 e 0.572 il tempo quasi si ferma
  assert.ok(warpClashTime(0.572) - warpClashTime(0.52) < 0.011);
});

test('le carte si toccano al centro, poi il vincitore torna al suo posto e lo sconfitto vola via', () => {
  const atContact = clashCardMotion(0.55, cfg);
  assert.ok(Math.abs(atContact.player.x + CLASH_CONTACT_PX) < 1);
  assert.ok(Math.abs(atContact.enemy.x - CLASH_CONTACT_PX) < 1);
  const end = clashCardMotion(1, cfg);
  assert.ok(Math.abs(end.player.x - cfg.start) < 0.5, `vincitore a ${end.player.x}`);
  assert.equal(end.player.rot, 0);
  assert.ok(end.enemy.x < -(cfg.start + 15), `sconfitto a ${end.enemy.x}`);
  assert.ok(end.enemy.rot < -20 && end.enemy.opacity < 1);
});

test('camera: zoom solo attorno all\'impatto, poi torna a 1; titolo dopo l\'impatto', () => {
  assert.equal(clashCamera(0, 0, 0).scale, 1);
  assert.ok(clashCamera(0.53, warpClashTime(0.53), 0).scale > 1.3);
  const end = clashCamera(1, 1, 0);
  assert.equal(end.scale, 1);
  assert.equal(end.bars, 0);
  assert.equal(clashImpactFx(0.4, 0, 0).title, 0);
  assert.ok(clashImpactFx(0.8, 0, 1).title > 0.9);
});
