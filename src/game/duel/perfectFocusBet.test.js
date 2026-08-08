import test from 'node:test';
import assert from 'node:assert/strict';
import { getPerfectFocusSide, isPerfectFocusBet } from './perfectFocusBet.js';

function baseResult(over = {}) {
  return {
    winner: 'player',
    playerAgent: { id: 1, power: 3, damage: 2, league: 3, army: 'Orathai' },
    enemyAgent: { id: 2, power: 3, damage: 2, league: 3, army: 'Apex' },
    playerPower: 3,
    enemyPower: 3,
    playerPowerAfterEffects: 3,
    enemyPowerAfterEffects: 3,
    playerDamage: 2,
    enemyDamage: 2,
    playerAssaultMod: 0,
    enemyAssaultMod: 0,
    playerAssaultMinFinal: 3,
    enemyAssaultMinFinal: 3,
    playerFocusUsed: 3,
    enemyFocusUsed: 2,
    // 3*3+0=9 vs 3*2+0=6
    playerAssaultRaw: 9,
    enemyAssaultRaw: 6,
    playerAssault: 9,
    enemyAssault: 6,
    isPlayerFirst: true,
    field: { id: 1, name: 'Campo' },
    ...over,
  };
}

test('PERFECT: minimo FC per battere VA avversario', () => {
  const br = baseResult();
  assert.equal(isPerfectFocusBet(br, 'player'), true);
  assert.equal(getPerfectFocusSide(br), 'player');
});

test('non PERFECT: un FC di troppo', () => {
  const br = baseResult({
    playerFocusUsed: 4,
    playerAssaultRaw: 12,
    playerAssault: 12,
  });
  assert.equal(isPerfectFocusBet(br, 'player'), false);
  assert.equal(getPerfectFocusSide(br), null);
});

test('PERFECT a 1 FC con VA superiore', () => {
  const br = baseResult({
    playerFocusUsed: 1,
    enemyFocusUsed: 1,
    playerPower: 4,
    playerPowerAfterEffects: 4,
    playerAssaultRaw: 4,
    playerAssault: 4,
    enemyAssaultRaw: 3,
    enemyAssault: 3,
  });
  assert.equal(isPerfectFocusBet(br, 'player'), true);
});

test('non PERFECT: vittoria da pareggio VA con lega uguale', () => {
  const br = baseResult({
    playerFocusUsed: 2,
    enemyFocusUsed: 2,
    playerAssaultRaw: 6,
    enemyAssaultRaw: 6,
    playerAssault: 6,
    enemyAssault: 6,
    // lega uguale (3), POT uguale → secondo giocatore
    isPlayerFirst: false,
    winner: 'player',
  });
  assert.equal(isPerfectFocusBet(br, 'player'), false);
  assert.equal(getPerfectFocusSide(br), null);
});

test('IA PERFECT su winnerByFocusNotVa (+1 FC esatto)', () => {
  const br = baseResult({
    winner: 'enemy',
    playerFocusUsed: 2,
    enemyFocusUsed: 3,
    playerAssaultRaw: 6,
    enemyAssaultRaw: 9,
    playerAssault: 6,
    enemyAssault: 9,
    // A parità di FC il secondo giocatore vince: player è secondo → con 2 FC l'IA perde.
    isPlayerFirst: false,
    field: { id: 62, name: 'Focus' },
  });
  assert.equal(isPerfectFocusBet(br, 'enemy'), true);
  assert.equal(
    isPerfectFocusBet(
      {
        ...br,
        enemyFocusUsed: 4,
        enemyAssaultRaw: 12,
        enemyAssault: 12,
      },
      'enemy'
    ),
    false
  );
});

test('vittoria per POT finale: FC non decisivi → non PERFECT', () => {
  const br = baseResult({
    playerPower: 5,
    playerPowerAfterEffects: 5,
    enemyPower: 3,
    enemyPowerAfterEffects: 3,
    playerFocusUsed: 4,
    enemyFocusUsed: 2,
    playerAssaultRaw: 20,
    enemyAssaultRaw: 6,
    playerAssault: 20,
    enemyAssault: 6,
    field: { id: 85, name: 'POT' },
  });
  assert.equal(isPerfectFocusBet(br, 'player'), false);
});

test('perdente non riceve PERFECT', () => {
  const br = baseResult();
  assert.equal(isPerfectFocusBet(br, 'enemy'), false);
});
