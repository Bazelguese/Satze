import { describe, it, expect } from 'vitest';
import { chooseKothCommit } from './kothSearch.js';
import { createKothMatchForSeed, runKothPairing } from '../../sim/kothSelfPlay.js';
import { currentCommitter, legalFieldIndexes, openerSeatId, submitCommit } from '../../kingOfHill/kingOfHill.js';
import { availableCards } from '../../multiSeat/multiSeatCore.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const SMALL = { rollouts: 120, quality: 0.7, noise: 0 };

describe('Re della collina con il motore a simulazione', () => {
  it('chi apre sceglie Campo, Agente e FC legali', () => {
    const match = createKothMatchForSeed(4);
    const who = currentCommitter(match);
    expect(who).toBe(openerSeatId(match));
    const { choice } = chooseKothCommit(match, who, SMALL, mulberry32(1));
    expect(legalFieldIndexes(match)).toContain(choice.fieldIndex);
    expect(() => submitCommit(match, who, choice)).not.toThrow();
  });

  it('chi sfida non legge i FC già posati', () => {
    const match = createKothMatchForSeed(6);
    const opener = currentCommitter(match);
    const card = availableCards(match.seats.find((s) => s.id === opener))[0];
    const after = submitCommit(match, opener, { cardId: card.id, investment: 2, fieldIndex: legalFieldIndexes(match)[0] });
    const who = currentCommitter(after);
    const other = { ...after, commits: { ...after.commits, [opener]: { ...after.commits[opener], investment: 9 } } };
    const a = chooseKothCommit(after, who, SMALL, mulberry32(2)).choice;
    const b = chooseKothCommit(other, who, SMALL, mulberry32(2)).choice;
    expect(a).toEqual(b);
    expect(a.fieldIndex).toBeNull();
    expect(() => submitCommit(after, who, a)).not.toThrow();
  });

  it('partite complete contro la vecchia IA, con 3 e 4 giocatori', () => {
    for (const players of [3, 4]) {
      const records = runKothPairing({ a: 'mc-easy@rollouts=60', b: 'old-medium', players, seeds: [8] });
      expect(records).toHaveLength(players);
    }
  }, 120000);
});
