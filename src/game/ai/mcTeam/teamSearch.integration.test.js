import { describe, it, expect } from 'vitest';
import { chooseTeamOpening, chooseTeamResponse, teamToMove } from './teamSearch.js';
import { createTeamMatchForSeed, runTeamPairing } from '../../sim/teamSelfPlay.js';
import { legalFieldIndexes, submitOpeningDeploy, teamSeats, PAIRINGS } from '../../teamDuel/teamDuel.js';
import { availableCards } from '../../multiSeat/multiSeatCore.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const SMALL = { rollouts: 120, quality: 0.7, noise: 0, topPerSeat: 2 };

describe('2v2 con il motore a simulazione', () => {
  it('apertura: due posti su Campi diversi, carte e FC legali', () => {
    const match = createTeamMatchForSeed(21);
    const { teamId } = teamToMove(match);
    const seats = teamSeats(match, teamId);
    const { choices } = chooseTeamOpening(match, teamId, SMALL, mulberry32(1), {
      aiSeatIds: seats.map((s) => s.id),
    });
    const [a, b] = seats.map((s) => choices[s.id]);
    expect(a.fieldIndex).not.toBe(b.fieldIndex);
    for (const [i, seat] of seats.entries()) {
      const c = [a, b][i];
      expect(legalFieldIndexes(match)).toContain(c.fieldIndex);
      expect(availableCards(seat).map((x) => x.id)).toContain(c.cardId);
      expect(c.focus).toBeGreaterThanOrEqual(1);
    }
    // La scelta è accettata dalle regole.
    expect(() => submitOpeningDeploy(match, choices)).not.toThrow();
  });

  it('risposta: disposizione valida e nessuna lettura dei FC dell’apertura', () => {
    const match = createTeamMatchForSeed(22);
    const opening = teamToMove(match).teamId;
    const openers = teamSeats(match, opening);
    const choices = Object.fromEntries(
      openers.map((s, i) => [s.id, { cardId: availableCards(s)[0].id, fieldIndex: legalFieldIndexes(match)[i], focus: 2 }])
    );
    const opened = submitOpeningDeploy(match, choices);
    const { teamId } = teamToMove(opened);
    const aiSeatIds = teamSeats(opened, teamId).map((s) => s.id);
    // Stessa partita con FC dell'apertura diversi: la risposta non deve cambiare.
    const other = {
      ...opened,
      plans: {
        ...opened.plans,
        [opening]: {
          ...opened.plans[opening],
          investments: Object.fromEntries(openers.map((s) => [s.id, 7])),
        },
      },
    };
    const r1 = chooseTeamResponse(opened, teamId, SMALL, mulberry32(3), { aiSeatIds });
    const r2 = chooseTeamResponse(other, teamId, SMALL, mulberry32(3), { aiSeatIds });
    expect([PAIRINGS.DIRECT, PAIRINGS.CROSSED]).toContain(r1.pairing);
    expect(r1).toEqual({ ...r2, stats: r1.stats });
  });

  it('partite complete nuova IA contro vecchia, senza errori', () => {
    const records = runTeamPairing({ a: 'mc-easy@rollouts=80', b: 'old-medium', seeds: [5] });
    expect(records).toHaveLength(2);
    for (const r of records) expect(['win', 'loss', 'draw']).toContain(r.outcome);
  }, 60000);
});
