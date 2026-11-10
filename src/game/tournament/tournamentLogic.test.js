import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTournament,
  dealSeriesHand,
  describeHumanMatch,
  dealAiSeriesHands,
  getHumanMatch,
  getPendingAiMatches,
  getPendingGame,
  getTournamentStatus,
  handRuleForGame,
  humanSide,
  prepareHumanGame,
  recordAiSeries,
  recordHumanGameResult,
  seriesWinnerSide,
  tallySeries,
} from './tournamentLogic.js';

/** Generatore deterministico (mulberry32) per test ripetibili. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeParticipants() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i === 0 ? 'human' : `ai${i}`,
    name: i === 0 ? 'Tu' : `IA ${i}`,
    army: `Armata ${i}`,
    deckKey: 'A',
    deckName: `Mazzo ${i}`,
    cardIds: Array.from({ length: 10 }, (_, c) => i * 100 + c),
    isHuman: i === 0,
  }));
}

const DECK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Chiude tutte le serie tra IA pronte, con esiti decisi dal generatore (come farebbe il motore). */
function resolveAiMatches(tournament, rng) {
  let t = tournament;
  let pending = getPendingAiMatches(t);
  while (pending.length > 0) {
    const match = pending[0];
    const games = [];
    while (!tallySeries(games).winner) {
      games.push({ hands: dealAiSeriesHands(t, match, games, rng), winner: rng() < 0.5 ? 'a' : 'b', simulated: true });
    }
    t = recordAiSeries(t, match.id, games);
    pending = getPendingAiMatches(t);
  }
  return t;
}

test('regola delle mani: pesca, carte rimaste, rimischia', () => {
  assert.equal(handRuleForGame(1), 'draw');
  assert.equal(handRuleForGame(2), 'remainder');
  assert.equal(handRuleForGame(3), 'reshuffle');
});

test('partita 2: esattamente le 5 carte non pescate nella partita 1', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const rng = seeded(seed);
    const first = dealSeriesHand(DECK, [], rng);
    const second = dealSeriesHand(DECK, [first], rng);
    assert.equal(first.length, 5);
    assert.equal(second.length, 5);
    assert.deepEqual([...first, ...second].sort((a, b) => a - b), DECK);
  }
});

test('partita 3: 5 carte diverse pescate dal mazzo intero rimischiato', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const rng = seeded(seed);
    const first = dealSeriesHand(DECK, [], rng);
    const second = dealSeriesHand(DECK, [first], rng);
    const third = dealSeriesHand(DECK, [first, second], rng);
    assert.equal(new Set(third).size, 5);
    assert.ok(third.every((id) => DECK.includes(id)));
    third.forEach((id) => seen.add(id));
  }
  assert.equal(seen.size, 10, 'lo spareggio pesca da tutte e 10 le carte');
});

test('serie: chiusa a 2 vittorie, i pareggi non contano', () => {
  assert.equal(seriesWinnerSide({ games: [{ winner: 'a' }], winsA: 1, winsB: 0 }), null);
  assert.equal(seriesWinnerSide({ games: [{ winner: 'a' }, { winner: 'a' }], winsA: 2, winsB: 0 }), 'a');
  assert.equal(seriesWinnerSide({ games: [{ winner: 'a' }, { winner: 'b' }], winsA: 1, winsB: 1 }), null);
  // 1 vittoria e 2 pareggi: dopo 3 partite passa chi è avanti
  assert.equal(
    seriesWinnerSide({ games: [{ winner: 'b' }, { winner: 'draw' }, { winner: 'draw' }], winsA: 0, winsB: 1 }),
    'b'
  );
  // pari dopo 3 partite: si continua
  assert.equal(
    seriesWinnerSide({ games: [{ winner: 'a' }, { winner: 'b' }, { winner: 'draw' }], winsA: 1, winsB: 1 }),
    null
  );
});

test('tabellone: 12 partecipanti, 4 passaggi diretti, Quarti = passato contro vincitore', () => {
  const t = createTournament({ participants: makeParticipants(), rng: seeded(7) });
  assert.deepEqual(t.rounds.map((r) => r.length), [8, 4, 2, 1]);
  const byes = t.rounds[0].filter((m) => m.bye);
  const played = t.rounds[0].filter((m) => !m.bye);
  assert.equal(byes.length, 4);
  assert.equal(played.length, 4);
  const ids = [...byes.map((m) => m.a), ...played.flatMap((m) => [m.a, m.b])];
  assert.equal(new Set(ids).size, 12);
  t.rounds[0].forEach((m, i) => assert.equal(m.bye, i % 2 === 0));
});

test('validazione: numero partecipanti e mazzi da 10', () => {
  assert.throws(() => createTournament({ participants: makeParticipants().slice(0, 11) }));
  const bad = makeParticipants();
  bad[3].cardIds = bad[3].cardIds.slice(0, 9);
  assert.throws(() => createTournament({ participants: bad }));
});

test('le serie tra IA non si risolvono da sole: restano da giocare', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const rng = seeded(seed);
    const t = createTournament({ participants: makeParticipants(), rng });
    const played = t.rounds[0].filter((m) => !m.bye);
    const aiMatches = played.filter((m) => m.a !== 'human' && m.b !== 'human');
    assert.ok(aiMatches.every((m) => !m.winnerId));
    assert.deepEqual(getPendingAiMatches(t).map((m) => m.id).sort(), aiMatches.map((m) => m.id).sort());
    assert.equal(t.rounds[1].filter((m) => m.a && m.b).length, 0, 'i Quarti aspettano la fine degli Ottavi');
  }
});

test('serie IA registrata: punteggio, vincitore e avanzamento a turno completo', () => {
  const rng = seeded(4);
  let t = createTournament({ participants: makeParticipants(), rng });
  const match = getPendingAiMatches(t)[0];
  const first = dealAiSeriesHands(t, match, [], rng);
  const games = [{ hands: first, winner: 'b', simulated: true }];
  assert.throws(() => recordAiSeries(t, match.id, games), /incompleta/);
  const second = dealAiSeriesHands(t, match, games, rng);
  assert.deepEqual([...first.a, ...second.a].sort((x, y) => x - y), [...t.participants[match.a].cardIds].sort((x, y) => x - y));
  games.push({ hands: second, winner: 'b', simulated: true });
  t = recordAiSeries(t, match.id, games);
  const saved = t.rounds[0].find((m) => m.id === match.id);
  assert.equal(saved.winnerId, match.b);
  assert.equal(saved.series.winsB, 2);
  assert.equal(saved.series.winsA, 0);
  // registrarla due volte non cambia nulla
  assert.deepEqual(recordAiSeries(t, match.id, games), t);
});

test('il giocatore con passaggio diretto aspetta che gli Ottavi siano conclusi', () => {
  let found = false;
  for (let seed = 1; seed <= 60 && !found; seed++) {
    const rng = seeded(seed);
    let t = createTournament({ participants: makeParticipants(), rng });
    if (!t.rounds[0].some((m) => m.bye && m.a === 'human')) continue;
    found = true;
    assert.equal(getHumanMatch(t), null);
    assert.equal(getTournamentStatus(t), 'active');
    t = resolveAiMatches(t, rng);
    const match = getHumanMatch(t);
    assert.equal(match.round, 1);
  }
  assert.ok(found, 'almeno un seme assegna il passaggio diretto al giocatore');
});

test('le mani in attesa non cambiano se si ripete la preparazione (niente ripesca)', () => {
  const rng = seeded(3);
  let t = prepareHumanGame(resolveAiMatches(createTournament({ participants: makeParticipants(), rng }), rng), rng);
  const before = getPendingGame(getHumanMatch(t)).hands;
  t = prepareHumanGame(t, rng);
  t = prepareHumanGame(t, rng);
  assert.deepEqual(getPendingGame(getHumanMatch(t)).hands, before);
  assert.equal(getHumanMatch(t).series.games.length, 1);
});

test('serie del giocatore: partita 2 con le carte rimaste, anche per l\'avversario', () => {
  const rng = seeded(11);
  let t = prepareHumanGame(resolveAiMatches(createTournament({ participants: makeParticipants(), rng }), rng), rng);
  const first = getPendingGame(getHumanMatch(t)).hands;
  t = recordHumanGameResult(t, 'opponent', rng);
  assert.equal(describeHumanMatch(t).gameNumber, 2);
  assert.equal(describeHumanMatch(t).handRule, 'remainder');
  t = prepareHumanGame(t, rng);
  const match = getHumanMatch(t);
  const second = getPendingGame(match).hands;
  for (const side of ['a', 'b']) {
    const deck = t.participants[match[side]].cardIds;
    assert.deepEqual([...first[side], ...second[side]].sort((x, y) => x - y), [...deck].sort((x, y) => x - y));
  }
});

test('vincere tutte le serie porta al titolo; il mazzo resta quello iniziale', () => {
  const rng = seeded(21);
  const participants = makeParticipants();
  let t = createTournament({ participants, rng });
  let guard = 0;
  while (getTournamentStatus(t) === 'active' && guard++ < 50) {
    t = resolveAiMatches(t, rng);
    t = prepareHumanGame(t, rng);
    t = recordHumanGameResult(t, 'human', rng);
  }
  assert.equal(getTournamentStatus(t), 'champion');
  assert.equal(t.championId, 'human');
  assert.deepEqual(t.participants.human.cardIds, participants[0].cardIds);
});

test('perdere una serie elimina il giocatore e il torneo arriva comunque a un campione', () => {
  const rng = seeded(5);
  let t = resolveAiMatches(createTournament({ participants: makeParticipants(), rng }), rng);
  t = recordHumanGameResult(prepareHumanGame(t, rng), 'opponent', rng);
  assert.equal(getTournamentStatus(t), 'active');
  t = recordHumanGameResult(prepareHumanGame(t, rng), 'opponent', rng);
  assert.equal(getTournamentStatus(t), 'eliminated');
  assert.equal(getHumanMatch(t), null);
  assert.equal(t.championId, null, 'il torneo prosegue tra le IA');
  t = resolveAiMatches(t, rng);
  assert.ok(t.championId && t.championId !== 'human');
});

test('1-1 porta allo spareggio con mazzo rimischiato', () => {
  const rng = seeded(9);
  let t = resolveAiMatches(createTournament({ participants: makeParticipants(), rng }), rng);
  t = recordHumanGameResult(prepareHumanGame(t, rng), 'human', rng);
  t = recordHumanGameResult(prepareHumanGame(t, rng), 'opponent', rng);
  const info = describeHumanMatch(t);
  assert.equal(info.gameNumber, 3);
  assert.equal(info.handRule, 'reshuffle');
  assert.equal(info.humanWins, 1);
  assert.equal(info.opponentWins, 1);
  t = prepareHumanGame(t, rng);
  const match = getHumanMatch(t);
  const side = humanSide(t, match);
  assert.equal(new Set(getPendingGame(match).hands[side]).size, 5);
});
