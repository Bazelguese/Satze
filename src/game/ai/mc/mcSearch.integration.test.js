import { describe, it, expect } from 'vitest';
import { chooseMonteCarloAction, generateMcCandidates, solveZeroSumGame } from './mcSearch.js';
import { getMcProfile } from './mcProfiles.js';
import {
  viewForSide,
  legalFieldIndexes,
  availableCards,
} from '../../sim/headlessMatch.js';
import { createHeadlessMatch, listPresetDecks } from '../../sim/headlessSetup.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const decks = listPresetDecks();

function startState(seed = 17) {
  return createHeadlessMatch({ seed, player: decks[1], enemy: decks[7] });
}

const SMALL = { rollouts: 120, policyQuality: 0.7, opponentQuality: 0.7, noise: 0 };

describe('motore a simulazione', () => {
  it('con l’iniziativa propone Campo, Agente e FC legali', () => {
    const view = viewForSide({ ...startState(), isPlayerFirst: false }, 'enemy');
    const decision = chooseMonteCarloAction(view, SMALL, mulberry32(1));
    expect(legalFieldIndexes(view)).toContain(decision.fieldIndex);
    expect(availableCards(view, 'enemy').map((c) => c.id)).toContain(decision.cardId);
    expect(decision.focus).toBeGreaterThanOrEqual(1);
    expect(decision.stats.rollouts).toBeGreaterThan(0);
  });

  it('in risposta resta sul Campo scelto dall’avversario', () => {
    const state = { ...startState(), isPlayerFirst: true, currentFieldIndex: 1 };
    const view = viewForSide(state, 'enemy', state.playerHand[0]);
    const candidates = generateMcCandidates(view);
    expect(new Set(candidates.map((c) => c.fieldIndex))).toEqual(new Set([1]));
    const decision = chooseMonteCarloAction(view, SMALL, mulberry32(2));
    expect(decision.fieldIndex).toBe(1);
  });

  it('stesso seme → stessa decisione', () => {
    const view = viewForSide({ ...startState(5), isPlayerFirst: false }, 'enemy');
    const a = chooseMonteCarloAction(view, SMALL, mulberry32(9));
    const b = chooseMonteCarloAction(view, SMALL, mulberry32(9));
    expect([a.fieldIndex, a.cardId, a.focus]).toEqual([b.fieldIndex, b.cardId, b.focus]);
  });

  it('la vista non porta i FC dell’avversario e la decisione non ne dipende', () => {
    const state = { ...startState(8), isPlayerFirst: true, currentFieldIndex: 0 };
    const view = viewForSide(state, 'enemy', state.playerHand[2]);
    expect(view).not.toHaveProperty('selectedFocus');
    const a = chooseMonteCarloAction(view, SMALL, mulberry32(4));
    const b = chooseMonteCarloAction({ ...view, selectedFocus: 9 }, SMALL, mulberry32(4));
    expect([a.cardId, a.focus]).toEqual([b.cardId, b.focus]);
  });

  it('con maxMs si ferma presto e decide con i dati raccolti', () => {
    const view = viewForSide({ ...startState(3), isPlayerFirst: false }, 'enemy');
    const decision = chooseMonteCarloAction(
      view,
      { ...getMcProfile('hard'), rollouts: 1e7, maxMs: 30 },
      mulberry32(6)
    );
    expect(decision.stats.timedOut).toBe(true);
    expect(decision.stats.ms).toBeLessThan(2000);
    expect(legalFieldIndexes(view)).toContain(decision.fieldIndex);
  });

  it('gioco a somma zero: sasso-carta-forbici e strategia dominante', () => {
    const rps = solveZeroSumGame([
      [0, -1, 1],
      [1, 0, -1],
      [-1, 1, 0],
    ]);
    expect(Math.abs(rps.value)).toBeLessThan(0.02);
    for (const p of rps.rowStrategy) expect(Math.abs(p - 1 / 3)).toBeLessThan(0.05);
    const dominant = solveZeroSumGame([
      [0.8, 0.7],
      [0.2, 0.3],
    ]);
    expect(dominant.rowStrategy[0]).toBeGreaterThan(0.95);
    expect(dominant.value).toBeGreaterThan(0.65);
  });

  it('apertura come gioco simultaneo: mossa legale e FC fra le opzioni', () => {
    const view = viewForSide({ ...startState(12), isPlayerFirst: false }, 'enemy');
    const decision = chooseMonteCarloAction(
      view,
      { ...SMALL, leadMode: 'matrix', matrixCombos: 2, matrixRollouts: 2 },
      mulberry32(8)
    );
    expect(decision.stats.leadMode).toBe('matrix');
    expect(legalFieldIndexes(view)).toContain(decision.fieldIndex);
    expect(availableCards(view, 'enemy').map((c) => c.id)).toContain(decision.cardId);
    expect(decision.focus).toBeGreaterThanOrEqual(1);
  });
});
