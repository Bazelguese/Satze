import { describe, it, expect } from 'vitest';
import { waitingAgents, scontroTransition, kothScontri } from './scontroQueue.js';

const s = (p, pc, e, ec) => ({ playerSeatId: p, playerCardId: pc, enemySeatId: e, enemyCardId: ec });

describe('coda degli scontri', () => {
  it('2v2: il secondo fronte aspetta dietro, poi avanzano entrambi', () => {
    const scontri = [s('A1', 1, 'B1', 7), s('A2', 2, 'B2', 8)];
    expect(waitingAgents(scontri, 0)).toEqual({
      player: [{ seatId: 'A2', cardId: 2, entersAt: 1 }],
      enemy: [{ seatId: 'B2', cardId: 8, entersAt: 1 }],
    });
    expect(waitingAgents(scontri, 1)).toEqual({ player: [], enemy: [] });
    expect(scontroTransition(scontri, 0)).toEqual({
      enter: { player: 'advance', enemy: 'advance' },
      leaves: { player: true, enemy: true },
    });
    expect(scontroTransition(scontri, 1)).toBeNull();
  });

  it('Re della collina: il vincitore resta, la coda intera aspetta in ordine', () => {
    // P2 occupa, P3 e P4 sfidano: P2 vince entrambi.
    const scontri = [s('P2', 20, 'P3', 30), s('P2', 20, 'P4', 40)];
    expect(waitingAgents(scontri, 0).enemy).toEqual([{ seatId: 'P4', cardId: 40, entersAt: 1 }]);
    expect(scontroTransition(scontri, 0)).toEqual({
      enter: { player: 'stay', enemy: 'advance' },
      leaves: { player: false, enemy: true },
    });
  });

  it('Re della collina: il vincitore cambia lato quando arriva lo sfidante umano o lascia il tuo lato', () => {
    // P1 (umano) sfida P2 e perde; poi P2 (occupante) passa a destra contro P3, poi P4.
    const scontri = [s('P1', 10, 'P2', 20), s('P2', 20, 'P3', 30), s('P2', 20, 'P4', 40)];
    const w = waitingAgents(scontri, 0);
    expect(w.player).toEqual([]);
    expect(w.enemy).toEqual([
      { seatId: 'P3', cardId: 30, entersAt: 1 },
      { seatId: 'P4', cardId: 40, entersAt: 2 },
    ]);
    expect(scontroTransition(scontri, 0)).toEqual({
      enter: { player: 'swap', enemy: 'advance' },
      leaves: { player: true, enemy: false },
    });
  });

  it('kothScontri legge le carte dal lato giusto', () => {
    const fights = [{ playerSeatId: 'P1', enemySeatId: 'P2', firstSeatId: 'P2', secondSeatId: 'P1', firstCardId: 20, secondCardId: 10 }];
    expect(kothScontri({ fights })).toEqual([s('P1', 10, 'P2', 20)]);
  });
});
