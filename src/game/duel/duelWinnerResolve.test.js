import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDuelWinnerByAssault } from './duelWinnerResolve.js';

const baseAgents = { pAgent: { league: 2, power: 5 }, eAgent: { league: 3, power: 4 } };

test('vince chi ha VA maggiore', () => {
  const log = [];
  const w = resolveDuelWinnerByAssault({
    pAssault: 10,
    eAssault: 5,
    ...baseAgents,
    isPlayerFirst: true,
    battleLog: log,
  });
  assert.equal(w, 'player');
});

test('parità VA: vince Lega più bassa', () => {
  const log = [];
  const w = resolveDuelWinnerByAssault({
    pAssault: 8,
    eAssault: 8,
    pAgent: { league: 1, power: 5 },
    eAgent: { league: 2, power: 3 },
    isPlayerFirst: true,
    battleLog: log,
  });
  assert.equal(w, 'player');
});

test('parità VA e Lega: vince POT più bassa', () => {
  const log = [];
  const w = resolveDuelWinnerByAssault({
    pAssault: 8,
    eAssault: 8,
    pAgent: { league: 2, power: 3 },
    eAgent: { league: 2, power: 5 },
    isPlayerFirst: true,
    battleLog: log,
  });
  assert.equal(w, 'player');
});

test('parità VA, Lega e POT: vince chi ha giocato per secondo', () => {
  const log = [];
  assert.equal(
    resolveDuelWinnerByAssault({
      pAssault: 5,
      eAssault: 5,
      pAgent: { league: 2, power: 4 },
      eAgent: { league: 2, power: 4 },
      isPlayerFirst: true,
      battleLog: log,
    }),
    'enemy'
  );
  const log2 = [];
  assert.equal(
    resolveDuelWinnerByAssault({
      pAssault: 5,
      eAssault: 5,
      pAgent: { league: 2, power: 4 },
      eAgent: { league: 2, power: 4 },
      isPlayerFirst: false,
      battleLog: log2,
    }),
    'player'
  );
});
