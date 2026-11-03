/**
 * Re della collina — casi della specifica v0.2 (§10, §13).
 */
import { describe, it, expect } from 'vitest';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { createSeat } from '../multiSeat/multiSeatCore.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import {
  KOTH_PHASES,
  advanceAfterContest,
  contestOrder,
  createKothMatch,
  currentCommitter,
  legalFieldIndexes,
  resolveClaim,
  seatFieldCount,
  submitCommit,
} from './kingOfHill.js';
import { aiCommit } from './kingOfHillAI.js';

const neutral = ALL_BATTLEFIELDS.find((f) => f.id === 51);
const fields = Array.from({ length: 5 }, () => ({ ...neutral }));

function card(id, power, damage, extra = {}) {
  return { id, name: id, army: 'Test', power, damage, league: 2, ...extra };
}

function seatWith(id, main) {
  return createSeat({
    id, name: id, army: 'Test', focus: 18,
    hand: [main, ...[1, 2, 3, 4].map((i) => card(`${id}-f${i}`, 1, 1))],
  });
}

function match3(a, b, c, extra = {}) {
  return createKothMatch({
    seats: [seatWith('A', a), seatWith('B', b), seatWith('C', c)],
    battlefields: fields,
    rng: mulberry32(1),
    initialOrder: ['A', 'B', 'C'],
    ...extra,
  });
}

function playContest(m, plan) {
  let x = m;
  for (const id of contestOrder(m)) {
    const p = plan[id];
    x = submitCommit(x, id, { cardId: p.cardId, investment: p.investment, fieldIndex: p.fieldIndex ?? null });
  }
  return x;
}

const hp = (m) => Object.fromEntries(m.seats.map((s) => [s.id, s.hp]));
const fc = (m) => Object.fromEntries(m.seats.map((s) => [s.id, s.focus]));

describe('Re della collina — esempi §10', () => {
  it('A: l’apertura mantiene la collina', () => {
    let m = match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5));
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 5, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 2 },
      C: { cardId: 'Cx', investment: 5 },
    });
    expect(m.phase).toBe(KOTH_PHASES.RESOLVED);
    expect(hp(m)).toEqual({ A: 25, B: 21, C: 21 });
    expect(fc(m)).toEqual({ A: 13, B: 16, C: 13 });
    expect(m.contestResult.conquerorSeatId).toBe('A');
    expect(seatFieldCount(m, 'A')).toBe(1);
    expect(m.contestResult.fights.map((f) => f.battleResult.playerAssault)).toEqual([35, 35]);
  });

  it('B: due vincitori diversi; B ha Gloria e Imboscata nel secondo scontro', () => {
    let m = match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5));
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 2, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 3 },
      C: { cardId: 'Cx', investment: 6 },
    });
    expect(hp(m)).toEqual({ A: 22, B: 20, C: 25 });
    expect(fc(m)).toEqual({ A: 16, B: 15, C: 12 });
    expect(m.contestResult.conquerorSeatId).toBe('C');
    const [f1, f2] = m.contestResult.fights;
    expect([f1.firstSeatId, f1.secondSeatId, f1.winnerSeatId]).toEqual(['A', 'B', 'B']);
    expect([f2.firstSeatId, f2.secondSeatId, f2.winnerSeatId]).toEqual(['B', 'C', 'C']);
    expect(f2.isFinal).toBe(true);
    expect(f1.isFinal).toBe(false);
  });

  for (const trigger of ['glory', 'imboscata']) {
    it(`B: ${trigger} non vale nel primo scontro e vale nel secondo`, () => {
      const b = card('Bx', 8, 3, { ability: { trigger, effect: 'power', value: 1 } });
      let m = match3(card('Ax', 7, 4), b, card('Cx', 6, 5));
      m = playContest(m, {
        A: { cardId: 'Ax', investment: 2, fieldIndex: 0 },
        B: { cardId: 'Bx', investment: 3 },
        C: { cardId: 'Cx', investment: 6 },
      });
      const [f1, f2] = m.contestResult.fights;
      // Primo scontro: B sfidante senza storia → 8×3. Secondo: B occupante dopo una vittoria → 9×3.
      expect(f1.battleResult.enemyAssault).toBe(24);
      expect(f2.battleResult.playerAssault).toBe(27);
    });
  }

  it('C: +2 POT riapplicato vale (7+2)×3 = 27 in ogni scontro', () => {
    const buff = card('Ax', 7, 4, { ability: { trigger: null, effect: 'power', value: 2 } });
    let m = match3(buff, card('Bx', 1, 1), card('Cx', 1, 1));
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 3, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 1 },
      C: { cardId: 'Cx', investment: 1 },
    });
    expect(m.contestResult.fights.map((f) => f.battleResult.playerAssault)).toEqual([27, 27]);
  });

  it('C: Cura 2 per due scontri: 17 → 19 → 21', () => {
    const healer = card('Ax', 7, 4, { ability: { trigger: null, effect: 'heal', value: 2 } });
    let m = match3(healer, card('Bx', 1, 1), card('Cx', 1, 1));
    m = { ...m, seats: m.seats.map((s) => (s.id === 'A' ? { ...s, hp: 17 } : s)) };
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 3, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 1 },
      C: { cardId: 'Cx', investment: 1 },
    });
    expect(m.contestResult.fights.map((f) => f.hpAfter.A)).toEqual([19, 21]);
  });

  it('D: a quattro, tre danni separati, un solo pagamento, una conquista; cura 17 → 23', () => {
    const healer = card('Ax', 7, 4, { ability: { trigger: null, effect: 'heal', value: 2 } });
    let m = createKothMatch({
      seats: [seatWith('A', healer), seatWith('B', card('Bx', 5, 3)), seatWith('C', card('Cx', 4, 3)), seatWith('D', card('Dx', 3, 3))],
      battlefields: fields,
      rng: mulberry32(1),
      initialOrder: ['A', 'B', 'C', 'D'],
    });
    m = { ...m, seats: m.seats.map((s) => (s.id === 'A' ? { ...s, hp: 17 } : s)) };
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 2, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 2 },
      C: { cardId: 'Cx', investment: 3 },
      D: { cardId: 'Dx', investment: 4 },
    });
    expect(m.contestResult.fights.length).toBe(3);
    expect(m.contestResult.fights.every((f) => f.winnerSeatId === 'A')).toBe(true);
    expect(hp(m)).toEqual({ A: 23, B: 21, C: 21, D: 21 });
    expect(fc(m).A).toBe(16);
    expect(m.contestResult.conquerorSeatId).toBe('A');
  });
});

describe('Re della collina — regole', () => {
  it('la posa segue l’ordine e solo l’apertura sceglie il Campo', () => {
    const m = match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5));
    expect(currentCommitter(m)).toBe('A');
    expect(() => submitCommit(m, 'B', { cardId: 'Bx', investment: 2 })).toThrow(/turno di posa/);
    const m1 = submitCommit(m, 'A', { cardId: 'Ax', investment: 2, fieldIndex: 1 });
    expect(m1.phase).toBe(KOTH_PHASES.COMMITS);
    expect(() => submitCommit(m1, 'B', { cardId: 'Bx', investment: 2, fieldIndex: 2 })).toThrow(/solo l’apertura/);
  });

  it('Conquista si attiva solo nello scontro finale', () => {
    const conq = card('Ax', 9, 2, { ability: { trigger: 'conquest', effect: 'heal', value: 3 } });
    let m = match3(conq, card('Bx', 1, 1), card('Cx', 1, 1));
    m = { ...m, seats: m.seats.map((s) => (s.id === 'A' ? { ...s, hp: 10 } : s)) };
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 3, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 1 },
      C: { cardId: 'Cx', investment: 1 },
    });
    expect(m.contestResult.fights.map((f) => f.hpAfter.A)).toEqual([10, 13]);
  });

  it('a VA, Lega e POT pari vince lo sfidante', () => {
    let m = match3(card('Ax', 5, 3), card('Bx', 5, 3), card('Cx', 1, 1));
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 2, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 2 },
      C: { cardId: 'Cx', investment: 1 },
    });
    expect(m.contestResult.fights[0].winnerSeatId).toBe('B');
  });

  it('Campi: 3 visibili, poi +1 per contesa; il Campo usato non si rigioca', () => {
    let m = match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5));
    expect(legalFieldIndexes(m)).toEqual([0, 1, 2]);
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 2, fieldIndex: 1 },
      B: { cardId: 'Bx', investment: 2 },
      C: { cardId: 'Cx', investment: 2 },
    });
    m = advanceAfterContest(m);
    expect(m.roundNumber).toBe(2);
    expect(legalFieldIndexes(m)).toEqual([0, 2, 3]);
    expect(contestOrder(m)).toEqual(['B', 'C', 'A']);
  });

  it('un vincitore a 0 PV lascia il posto vuoto e il prossimo subentra senza scontro', () => {
    // B batte A ma il Campo gli toglie 5 PV e muore; C subentra senza scontro e conquista.
    let m = match3(card('Ax', 1, 1), card('Bx', 9, 3), card('Cx', 1, 1));
    m = { ...m, seats: m.seats.map((s) => (s.id === 'B' ? { ...s, hp: 2 } : s)) };
    // Nido di Spine: il vincitore perde 5 PV.
    const spine = ALL_BATTLEFIELDS.find((f) => f.name === 'Nido di Spine');
    m = { ...m, battlefields: m.battlefields.map((f, i) => (i === 0 ? { ...spine } : f)) };
    m = playContest(m, {
      A: { cardId: 'Ax', investment: 1, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 3 },
      C: { cardId: 'Cx', investment: 1 },
    });
    const f1 = m.contestResult.fights[0];
    expect(f1.winnerSeatId).toBe('B');
    expect(m.seats.find((s) => s.id === 'B').eliminated).toBe(true);
    expect(m.contestResult.fights.length).toBe(1);
    expect(m.contestResult.vacancies).toEqual([{ seatId: 'C', afterFight: 1 }]);
    expect(m.contestResult.conquerorSeatId).toBe('C');
  });

  it('3 Campi alla contesa 3: reclamo; un solo vivo vince', () => {
    let m = match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5));
    m = { ...m, phase: KOTH_PHASES.RESOLVED, roundNumber: 3, conqueredFields: { 0: { owner: 'A' }, 1: { owner: 'A' }, 2: { owner: 'A' } } };
    const c = advanceAfterContest(m);
    expect(c.phase).toBe(KOTH_PHASES.CLAIM);
    expect(resolveClaim(c, 'claim').result.winners).toEqual(['A']);
    const solo = advanceAfterContest({ ...m, conqueredFields: {}, seats: m.seats.map((s) => (s.id === 'A' ? s : { ...s, hp: 0, eliminated: true })) });
    expect(solo.result).toMatchObject({ winners: ['A'], reason: 'hp' });
  });

  it('fine contesa 5: più PV fra i vivi, poi Campi, poi vittoria condivisa', () => {
    const base = { ...match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5)), phase: KOTH_PHASES.RESOLVED, roundNumber: 5 };
    const withHp = (a, b, c) => ({ ...base, seats: base.seats.map((s) => ({ ...s, hp: { A: a, B: b, C: c }[s.id] })) });
    expect(advanceAfterContest(withHp(10, 20, 5)).result.winners).toEqual(['B']);
    expect(advanceAfterContest({ ...withHp(20, 20, 5), conqueredFields: { 0: { owner: 'A' } } }).result.winners).toEqual(['A']);
    const shared = advanceAfterContest(withHp(20, 20, 5)).result;
    expect(shared.winners).toEqual(['A', 'B']);
    expect(shared.shared).toBe(true);
  });
});

describe('Re della collina — partita completa con IA', () => {
  for (const players of [3, 4]) {
    it(`${players} IA giocano fino alla fine senza errori`, () => {
      const rng = mulberry32(7 + players);
      const ids = ['P1', 'P2', 'P3', 'P4'].slice(0, players);
      const profiles = ['equilibrato', 'aggressivo', 'prudente', 'calcolatore'];
      const seats = ids.map((id, i) => createSeat({
        id, name: id, army: 'Test', focus: 18, aiProfile: profiles[i],
        hand: [1, 2, 3, 4, 5].map((k) => card(`${id}-${k}`, 2 + ((k * (i + 3)) % 7), 1 + ((k + i) % 5))),
      }));
      let m = createKothMatch({ seats, battlefields: fields, rng });
      let guard = 0;
      while (m.phase !== KOTH_PHASES.GAME_OVER && guard < 100) {
        guard += 1;
        if (m.phase === KOTH_PHASES.COMMITS) {
          const id = currentCommitter(m);
          m = submitCommit(m, id, aiCommit(m, id, rng));
        } else if (m.phase === KOTH_PHASES.RESOLVED) {
          m = advanceAfterContest(m);
        } else if (m.phase === KOTH_PHASES.CLAIM) {
          m = resolveClaim(m, 'claim');
        }
      }
      expect(m.phase).toBe(KOTH_PHASES.GAME_OVER);
      expect(Array.isArray(m.result.winners)).toBe(true);
    });
  }
});

describe('Re della collina — prospettiva del giocatore', () => {
  it('lo sfidante della prospettiva è sul lato player e i risultati non cambiano', () => {
    const plan = {
      A: { cardId: 'Ax', investment: 2, fieldIndex: 0 },
      B: { cardId: 'Bx', investment: 3 },
      C: { cardId: 'Cx', investment: 6 },
    };
    const plain = playContest(match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5)), plan);
    const persp = playContest({ ...match3(card('Ax', 7, 4), card('Bx', 8, 3), card('Cx', 6, 5)), perspectiveSeatId: 'C' }, plan);
    expect(hp(persp)).toEqual(hp(plain));
    expect(fc(persp)).toEqual(fc(plain));
    const last = persp.contestResult.fights[1];
    expect(last.playerSeatId).toBe('C');
    expect(last.battleResult.winner).toBe('player');
    expect(last.battleResult.playerAssault).toBe(36);
  });
});
