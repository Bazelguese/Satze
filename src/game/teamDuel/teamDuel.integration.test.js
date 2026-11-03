/**
 * 2v2 ad abbinamenti segreti — casi della specifica v0.2 (§10, §13).
 */
import { describe, it, expect } from 'vitest';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { createSeat, legalFocusRange } from '../multiSeat/multiSeatCore.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import {
  PAIRINGS,
  TEAM_DUEL_PHASES,
  advanceAfterRound,
  buildFronts,
  createTeamDuelMatch,
  legalFieldIndexes,
  resolveClaim,
  submitOpeningDeploy,
  submitResponseDeploy,
  submitTeamPlan,
  teamFieldCount,
} from './teamDuel.js';
import { aiOpeningDeploy, aiResponseDeploy, aiTeamPlan } from './teamDuelAI.js';

const neutral = ALL_BATTLEFIELDS.find((f) => f.id === 51);
const fields = Array.from({ length: 10 }, () => ({ ...neutral }));

function card(id, power, damage, league = 2) {
  return { id, name: id, army: 'Test', power, damage, league };
}

/** Mano con la carta di test in testa e quattro riempitivi della Lega indicata. */
function hand(seatId, main, league) {
  return [
    { ...main, league },
    ...[1, 2, 3, 4].map((i) => card(`${seatId}-f${i}`, 1, 1, league)),
  ];
}

/** Squadra B con Lega più bassa: apre B, risponde A (come l'esempio §10). */
function exampleMatch() {
  const seats = [
    createSeat({ id: 'A1', name: 'A1', team: 'A', army: 'Test', focus: 18, hand: hand('A1', card('A1x', 8, 2), 3) }),
    createSeat({ id: 'A2', name: 'A2', team: 'A', army: 'Test', focus: 18, hand: hand('A2', card('A2x', 5, 7), 3) }),
    createSeat({ id: 'B1', name: 'B1', team: 'B', army: 'Test', focus: 18, hand: hand('B1', card('B1x', 7, 5), 2) }),
    createSeat({ id: 'B2', name: 'B2', team: 'B', army: 'Test', focus: 18, hand: hand('B2', card('B2x', 7, 3), 2) }),
  ];
  return createTeamDuelMatch({ seats, battlefields: fields, rng: mulberry32(1) });
}

function deployExample(match) {
  let m = submitOpeningDeploy(match, {
    B1: { cardId: 'B1x', fieldIndex: 0 },
    B2: { cardId: 'B2x', fieldIndex: 1 },
  });
  m = submitResponseDeploy(m, { A1: { cardId: 'A1x' }, A2: { cardId: 'A2x' } });
  return m;
}

function play(match, { pairing, a = { A1: 1, A2: 6 }, b = { B1: 5, B2: 1 } }) {
  let m = deployExample(match);
  m = submitTeamPlan(m, 'B', { investments: b });
  m = submitTeamPlan(m, 'A', { investments: a, pairing });
  return m;
}

const fc = (m) => Object.fromEntries(m.seats.map((s) => [s.id, s.focus]));

describe('2v2 — preparazione', () => {
  it('apre la squadra con la somma Lega più bassa', () => {
    const m = exampleMatch();
    expect(m.openingTeam).toBe('B');
    expect(m.teams.A.hp).toBe(50);
    expect(m.revealedFields).toBe(6);
    expect(legalFieldIndexes(m)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('i due compagni dell’apertura devono scegliere Campi diversi', () => {
    expect(() => submitOpeningDeploy(exampleMatch(), {
      B1: { cardId: 'B1x', fieldIndex: 0 },
      B2: { cardId: 'B2x', fieldIndex: 0 },
    })).toThrow(/Campi diversi/);
  });

  it('non si può scegliere un Campo non rivelato', () => {
    expect(() => submitOpeningDeploy(exampleMatch(), {
      B1: { cardId: 'B1x', fieldIndex: 0 },
      B2: { cardId: 'B2x', fieldIndex: 7 },
    })).toThrow(/non disponibile/);
  });
});

describe('2v2 — esempio §10', () => {
  it('diretta: A 45, B 43; Campi 1–1; FC 17/12/13/17', () => {
    const m = play(exampleMatch(), { pairing: PAIRINGS.DIRECT });
    expect(m.phase).toBe(TEAM_DUEL_PHASES.RESOLVED);
    expect(m.teams.A.hp).toBe(45);
    expect(m.teams.B.hp).toBe(43);
    expect(teamFieldCount(m, 'A')).toBe(1);
    expect(teamFieldCount(m, 'B')).toBe(1);
    expect(fc(m)).toEqual({ A1: 17, A2: 12, B1: 13, B2: 17 });
    const [x, y] = m.roundResult.fronts;
    expect([x.firstSeatId, x.secondSeatId, x.winnerSeatId]).toEqual(['B1', 'A1', 'B1']);
    expect([y.firstSeatId, y.secondSeatId, y.winnerSeatId]).toEqual(['B2', 'A2', 'A2']);
    expect(x.battleResult.playerAssault).toBe(35);
    expect(x.battleResult.enemyAssault).toBe(8);
  });

  it('incrociata: A 45, B 48; stessi FC', () => {
    const m = play(exampleMatch(), { pairing: PAIRINGS.CROSSED });
    expect(m.teams.A.hp).toBe(45);
    expect(m.teams.B.hp).toBe(48);
    expect(fc(m)).toEqual({ A1: 17, A2: 12, B1: 13, B2: 17 });
    expect(m.conqueredFields[0].owner).toBe('B');
    expect(m.conqueredFields[1].owner).toBe('A');
  });

  it('B scambia i FC: diretta A infligge 2 e B 3; incrociata A 7 e B 3', () => {
    const swap = { B1: 1, B2: 5 };
    const d = play(exampleMatch(), { pairing: PAIRINGS.DIRECT, b: swap });
    expect(50 - d.teams.B.hp).toBe(2);
    expect(50 - d.teams.A.hp).toBe(3);
    const c = play(exampleMatch(), { pairing: PAIRINGS.CROSSED, b: swap });
    expect(50 - c.teams.B.hp).toBe(7);
    expect(50 - c.teams.A.hp).toBe(3);
  });

  it('B investe 3 + 3: A1 perde e A2 vince in entrambe le disposizioni', () => {
    for (const pairing of [PAIRINGS.DIRECT, PAIRINGS.CROSSED]) {
      const m = play(exampleMatch(), { pairing, b: { B1: 3, B2: 3 } });
      const byA = Object.fromEntries(m.roundResult.fronts.map((f) => [f.secondSeatId, f.winnerSeatId === f.secondSeatId]));
      expect(byA).toEqual({ A1: false, A2: true });
    }
  });
});

describe('2v2 — regole del turno', () => {
  it('solo la risposta sceglie la disposizione', () => {
    const m = deployExample(exampleMatch());
    expect(() => submitTeamPlan(m, 'B', { investments: { B1: 2, B2: 2 }, pairing: PAIRINGS.DIRECT })).toThrow(/solo la risposta/);
    expect(() => submitTeamPlan(m, 'A', { investments: { A1: 2, A2: 2 } })).toThrow(/disposizione/);
  });

  it('investimenti non validi sono rifiutati', () => {
    const m = deployExample(exampleMatch());
    for (const bad of [0, -1, 1.5, 15]) {
      expect(() => submitTeamPlan(m, 'B', { investments: { B1: bad, B2: 2 } })).toThrow(/non valido/);
    }
    expect(legalFocusRange(m.seats.find((s) => s.id === 'B1'))).toEqual({ min: 1, max: 14 });
  });

  it('un piano bloccato non si può ripresentare', () => {
    let m = deployExample(exampleMatch());
    m = submitTeamPlan(m, 'B', { investments: { B1: 2, B2: 2 } });
    expect(() => submitTeamPlan(m, 'B', { investments: { B1: 3, B2: 3 } })).toThrow(/già bloccato/);
  });

  it('l’ordine con cui le squadre bloccano il piano non cambia il risultato', () => {
    let a = deployExample(exampleMatch());
    a = submitTeamPlan(a, 'B', { investments: { B1: 5, B2: 1 } });
    a = submitTeamPlan(a, 'A', { investments: { A1: 1, A2: 6 }, pairing: PAIRINGS.DIRECT });
    let b = deployExample(exampleMatch());
    b = submitTeamPlan(b, 'A', { investments: { A1: 1, A2: 6 }, pairing: PAIRINGS.DIRECT });
    b = submitTeamPlan(b, 'B', { investments: { B1: 5, B2: 1 } });
    expect(b.teams).toEqual(a.teams);
    expect(fc(b)).toEqual(fc(a));
  });

  it('a VA, Lega e POT pari vince l’Agente della risposta', () => {
    const seats = [
      createSeat({ id: 'A1', name: 'A1', team: 'A', army: 'Test', focus: 18, hand: hand('A1', card('A1x', 6, 3), 3) }),
      createSeat({ id: 'A2', name: 'A2', team: 'A', army: 'Test', focus: 18, hand: hand('A2', card('A2x', 6, 3), 3) }),
      createSeat({ id: 'B1', name: 'B1', team: 'B', army: 'Test', focus: 18, hand: hand('B1', card('B1x', 6, 3), 2) }),
      createSeat({ id: 'B2', name: 'B2', team: 'B', army: 'Test', focus: 18, hand: hand('B2', card('B2x', 6, 3), 2) }),
    ].map((s) => ({ ...s, hand: s.hand.map((c, i) => (i === 0 ? { ...c, league: 3 } : c)) }));
    let m = createTeamDuelMatch({ seats, battlefields: fields, rng: mulberry32(2) });
    m = submitOpeningDeploy(m, { B1: { cardId: 'B1x', fieldIndex: 0 }, B2: { cardId: 'B2x', fieldIndex: 1 } });
    m = submitResponseDeploy(m, { A1: { cardId: 'A1x' }, A2: { cardId: 'A2x' } });
    m = submitTeamPlan(m, 'B', { investments: { B1: 2, B2: 2 } });
    m = submitTeamPlan(m, 'A', { investments: { A1: 2, A2: 2 }, pairing: PAIRINGS.CROSSED });
    expect(m.roundResult.fronts.every((f) => f.winnerSeatId === f.secondSeatId)).toBe(true);
  });

  it('dopo il turno l’apertura passa all’altra squadra e si rivelano 2 Campi', () => {
    const m = advanceAfterRound(play(exampleMatch(), { pairing: PAIRINGS.DIRECT }));
    expect(m.phase).toBe(TEAM_DUEL_PHASES.OPENING_DEPLOY);
    expect(m.openingTeam).toBe('A');
    expect(m.roundNumber).toBe(2);
    expect(m.revealedFields).toBe(8);
    expect(legalFieldIndexes(m)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('Gloria e Vendetta seguono la storia di ciascun giocatore', () => {
    const m = play(exampleMatch(), { pairing: PAIRINGS.DIRECT });
    const prev = Object.fromEntries(m.seats.map((s) => [s.id, s.previousResult]));
    expect(prev).toEqual({ A1: 'lost', A2: 'won', B1: 'won', B2: 'lost' });
  });

  it('la diretta e l’incrociata usano gli stessi fronti dell’apertura', () => {
    const m = deployExample(exampleMatch());
    expect(buildFronts(m, PAIRINGS.DIRECT).map((f) => [f.firstSeatId, f.secondSeatId, f.fieldIndex])).toEqual([
      ['B1', 'A1', 0], ['B2', 'A2', 1],
    ]);
    expect(buildFronts(m, PAIRINGS.CROSSED).map((f) => [f.firstSeatId, f.secondSeatId, f.fieldIndex])).toEqual([
      ['B1', 'A2', 0], ['B2', 'A1', 1],
    ]);
  });
});

describe('2v2 — fine partita', () => {
  function withState(patch) {
    const m = play(exampleMatch(), { pairing: PAIRINGS.DIRECT });
    return { ...m, ...patch };
  }

  it('entrambe a 0 PV: pareggio', () => {
    const m = advanceAfterRound(withState({ teams: { A: { id: 'A', hp: 0, maxHp: 50 }, B: { id: 'B', hp: 0, maxHp: 50 } } }));
    expect(m.result).toMatchObject({ winner: 'draw', reason: 'hp' });
  });

  it('5 Campi al turno 3: reclamo, poi vittoria se si reclama', () => {
    const conquered = Object.fromEntries([0, 1, 2, 3, 4].map((i) => [i, { owner: 'A' }]));
    const m = advanceAfterRound(withState({ roundNumber: 3, conqueredFields: conquered }));
    expect(m.phase).toBe(TEAM_DUEL_PHASES.CLAIM);
    expect(m.claim.team).toBe('A');
    expect(resolveClaim(m, 'claim').result).toMatchObject({ winner: 'A', reason: 'fields' });
    const cont = resolveClaim(m, 'continue');
    expect(cont.phase).toBe(TEAM_DUEL_PHASES.OPENING_DEPLOY);
    expect(cont.roundNumber).toBe(4);
  });

  it('5 Campi al turno 5: nessuna vittoria territoriale, decidono i PV', () => {
    const conquered = Object.fromEntries([0, 1, 2, 3, 4].map((i) => [i, { owner: 'A' }]));
    const m = advanceAfterRound(withState({
      roundNumber: 5,
      conqueredFields: conquered,
      teams: { A: { id: 'A', hp: 10, maxHp: 50 }, B: { id: 'B', hp: 20, maxHp: 50 } },
    }));
    expect(m.result).toMatchObject({ winner: 'B', reason: 'hp' });
  });

  it('turno 5 a PV pari: decidono i Campi, poi pareggio', () => {
    const teams = { A: { id: 'A', hp: 20, maxHp: 50 }, B: { id: 'B', hp: 20, maxHp: 50 } };
    const m = advanceAfterRound(withState({ roundNumber: 5, teams, conqueredFields: { 0: { owner: 'B' } } }));
    expect(m.result).toMatchObject({ winner: 'B', reason: 'fields' });
    const d = advanceAfterRound(withState({ roundNumber: 5, teams, conqueredFields: {} }));
    expect(d.result).toMatchObject({ winner: 'draw' });
  });
});

describe('2v2 — Vita simultanea', () => {
  it('le cure di un fronte non superano il massimo della somma finale', () => {
    const healer = { ...card('A1x', 9, 2), ability: { trigger: null, effect: 'heal', value: 3 } };
    const seats = [
      createSeat({ id: 'A1', name: 'A1', team: 'A', army: 'Test', focus: 18, hand: hand('A1', healer, 3) }),
      createSeat({ id: 'A2', name: 'A2', team: 'A', army: 'Test', focus: 18, hand: hand('A2', card('A2x', 1, 1), 3) }),
      createSeat({ id: 'B1', name: 'B1', team: 'B', army: 'Test', focus: 18, hand: hand('B1', card('B1x', 1, 1), 2) }),
      createSeat({ id: 'B2', name: 'B2', team: 'B', army: 'Test', focus: 18, hand: hand('B2', card('B2x', 9, 4), 2) }),
    ];
    let m = createTeamDuelMatch({ seats, battlefields: fields, rng: mulberry32(3) });
    m = { ...m, teams: { ...m.teams, A: { ...m.teams.A, hp: 49 } } };
    m = submitOpeningDeploy(m, { B1: { cardId: 'B1x', fieldIndex: 0 }, B2: { cardId: 'B2x', fieldIndex: 1 } });
    m = submitResponseDeploy(m, { A1: { cardId: 'A1x' }, A2: { cardId: 'A2x' } });
    m = submitTeamPlan(m, 'B', { investments: { B1: 1, B2: 5 } });
    m = submitTeamPlan(m, 'A', { investments: { A1: 5, A2: 1 }, pairing: PAIRINGS.DIRECT });
    // A1 cura 3 e vince contro B1; A2 perde contro B2 e subisce 4: 49 − 4 + 3 = 48.
    expect(m.roundResult.hpDelta.A).toBe(-1);
    expect(m.teams.A.hp).toBe(48);
  });
});

describe('2v2 — partita completa con IA', () => {
  it('quattro IA giocano fino alla fine senza errori', () => {
    const rng = mulberry32(42);
    const profiles = ['equilibrato', 'aggressivo', 'prudente', 'calcolatore'];
    const seats = ['A1', 'A2', 'B1', 'B2'].map((id, i) => createSeat({
      id, name: id, team: id[0], army: 'Test', focus: 18, aiProfile: profiles[i],
      hand: [1, 2, 3, 4, 5].map((k) => card(`${id}-${k}`, 2 + ((k * (i + 3)) % 7), 1 + ((k + i) % 5), 1 + (k % 4))),
    }));
    let m = createTeamDuelMatch({ seats, battlefields: fields, rng });
    let guard = 0;
    while (m.phase !== TEAM_DUEL_PHASES.GAME_OVER && guard < 50) {
      guard += 1;
      if (m.phase === TEAM_DUEL_PHASES.OPENING_DEPLOY) {
        const [s1, s2] = m.seats.filter((s) => s.team === m.openingTeam);
        const d1 = aiOpeningDeploy(m, s1.id, rng);
        const d2 = aiOpeningDeploy(m, s2.id, rng, [d1.fieldIndex]);
        m = submitOpeningDeploy(m, { [s1.id]: d1, [s2.id]: d2 });
      } else if (m.phase === TEAM_DUEL_PHASES.RESPONSE_DEPLOY) {
        const rs = m.seats.filter((s) => s.team !== m.openingTeam);
        m = submitResponseDeploy(m, Object.fromEntries(rs.map((s) => [s.id, aiResponseDeploy(m, s.id, rng)])));
      } else if (m.phase === TEAM_DUEL_PHASES.PLANNING) {
        m = submitTeamPlan(m, m.openingTeam, aiTeamPlan(m, m.openingTeam, rng));
        const responder = m.openingTeam === 'A' ? 'B' : 'A';
        m = submitTeamPlan(m, responder, aiTeamPlan(m, responder, rng));
      } else if (m.phase === TEAM_DUEL_PHASES.RESOLVED) {
        m = advanceAfterRound(m);
      } else if (m.phase === TEAM_DUEL_PHASES.CLAIM) {
        m = resolveClaim(m, 'claim');
      }
    }
    expect(m.phase).toBe(TEAM_DUEL_PHASES.GAME_OVER);
    expect(m.result.winner).toMatch(/^(A|B|draw)$/);
    expect(m.history.length).toBeGreaterThan(0);
    for (const seat of m.seats) expect(seat.usedCardIds.length).toBe(m.history.length);
  });
});

describe('2v2 — prospettiva del giocatore', () => {
  it('con perspectiveTeam A la squadra A è sul lato player e i risultati non cambiano', () => {
    for (const pairing of [PAIRINGS.DIRECT, PAIRINGS.CROSSED]) {
      const plain = play(exampleMatch(), { pairing });
      const persp = play({ ...exampleMatch(), perspectiveTeam: 'A' }, { pairing });
      expect(persp.teams).toEqual(plain.teams);
      expect(fc(persp)).toEqual(fc(plain));
      for (const front of persp.roundResult.fronts) {
        expect(front.playerSeatId.startsWith('A')).toBe(true);
        expect(front.battleResult.winner === 'player').toBe(front.winnerTeam === 'A');
      }
    }
  });
});
