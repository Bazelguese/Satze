import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTournament,
  dealSeriesHand,
  describeHumanMatch,
  convertToAi,
  dealAiSeriesHands,
  getHumanMatch,
  getOpenHumanMatches,
  prepareMatchGame,
  recordMatchGameResult,
  withViewer,
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

// ── Torneo online: più giocatori nello stesso tabellone ──

function makeOnlineParticipants(humans = 3) {
  return makeParticipants().map((p, i) => (i < humans ? { ...p, id: `h${i}`, isHuman: true, slot: i, playerName: `G${i}` } : { ...p, isHuman: false }));
}

test('online: più giocatori, ognuno vede il proprio incontro', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const t = createTournament({ participants: makeOnlineParticipants(3), rng: seeded(seed) });
    const humanMatches = getOpenHumanMatches(t);
    for (const id of ['h0', 'h1', 'h2']) {
      const mine = getHumanMatch(withViewer(t, id));
      if (mine) assert.ok(humanMatches.some((m) => m.id === mine.id));
      assert.equal(getTournamentStatus(withViewer(t, id)), 'active');
    }
    // le serie con una persona non le giocano le IA da sole
    const pendingAi = getPendingAiMatches(t);
    assert.ok(pendingAi.every((m) => !t.participants[m.a].isHuman && !t.participants[m.b].isHuman));
    assert.ok(humanMatches.every((m) => !pendingAi.some((x) => x.id === m.id)));
  }
});

test('online: esito registrato una volta sola anche se lo riferiscono entrambi', () => {
  const rng = seeded(8);
  let t = createTournament({ participants: makeOnlineParticipants(4), rng });
  const match = getOpenHumanMatches(t)[0];
  t = prepareMatchGame(t, match.id, rng);
  const hands = getPendingGame(getOpenHumanMatches(t).find((m) => m.id === match.id)).hands;
  assert.deepEqual(getPendingGame(prepareMatchGame(t, match.id, rng).rounds.flat().find((m) => m.id === match.id)).hands, hands);
  t = recordMatchGameResult(t, match.id, 'a', 0);
  // doppione della stessa partita, arrivato dopo che la successiva è già stata servita
  t = prepareMatchGame(t, match.id, rng);
  t = recordMatchGameResult(t, match.id, 'a', 0);
  const saved = t.rounds.flat().find((m) => m.id === match.id);
  assert.equal(saved.series.winsA, 1);
  assert.equal(saved.winnerId, null);
  t = recordMatchGameResult(t, match.id, 'a', 1);
  assert.equal(t.rounds.flat().find((m) => m.id === match.id).winnerId, match.a);
});

test("online: chi lascia passa all'IA e la sua serie torna tra quelle delle IA", () => {
  let found = false;
  for (let seed = 1; seed <= 40 && !found; seed++) {
    const rng = seeded(seed);
    let t = createTournament({ participants: makeOnlineParticipants(1), rng });
    const match = getOpenHumanMatches(t)[0];
    if (!match) continue;
    found = true;
    t = prepareMatchGame(t, match.id, rng);
    const held = getPendingGame(t.rounds.flat().find((m) => m.id === match.id)).hands;
    t = convertToAi(t, 'h0');
    assert.equal(t.participants.h0.isHuman, false);
    assert.equal(t.participants.h0.takenOver, true);
    assert.equal(getOpenHumanMatches(t).length, 0);
    const pending = getPendingAiMatches(t).find((m) => m.id === match.id);
    assert.ok(pending, "la serie è ora tra quelle delle IA");
    assert.deepEqual(getPendingGame(pending).hands, held, 'la partita in sospeso tiene le stesse mani');
  }
  assert.ok(found);
});
