// ============================================
// TORNEO — logica pura (nessuna dipendenza da React o dai dati carte)
// ============================================
// Eliminazione diretta a 12 partecipanti, ogni incontro al meglio delle 3.
// Regola delle mani dentro una serie (mazzo da 10 bloccato):
//   partita 1 → 5 carte pescate a caso
//   partita 2 → le 5 carte NON pescate nella partita 1
//   partita 3 → mazzo rimischiato, 5 carte a caso (spareggio)
// PV e FC ripartono da capo a ogni partita (lo fa l'avvio partita standard).
// Le serie tra IA si giocano davvero (aiMatchEngine.js) e si registrano qui.
// ============================================

export const TOURNAMENT_SIZE = 12;
export const TOURNAMENT_HAND_SIZE = 5;
export const TOURNAMENT_DECK_SIZE = 10;
/** Al meglio delle 3: servono 2 vittorie. */
export const SERIES_WINS_NEEDED = 2;
export const SERIES_MAX_GAMES = 3;

export const ROUND_NAMES = ['Ottavi', 'Quarti', 'Semifinali', 'Finale'];

function shuffled(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function emptySeries() {
  return { games: [], winsA: 0, winsB: 0, winner: null };
}

function makeMatch(round, index, a = null, b = null) {
  return { id: `r${round}m${index}`, round, index, a, b, bye: false, series: emptySeries(), winnerId: null };
}

/** Regola di pesca della partita numero `gameNumber` (1-based) di una serie. */
export function handRuleForGame(gameNumber) {
  if (gameNumber === 1) return 'draw';
  if (gameNumber === 2) return 'remainder';
  return 'reshuffle';
}

/**
 * Mano della prossima partita per un mazzo, date le mani già giocate nella serie.
 * @param {number[]} deckIds - le 10 carte del mazzo bloccato
 * @param {number[][]} previousHands - mani delle partite precedenti, in ordine
 */
export function dealSeriesHand(deckIds, previousHands, rng = Math.random) {
  const rule = handRuleForGame(previousHands.length + 1);
  if (rule === 'remainder') {
    const first = new Set(previousHands[0]);
    return deckIds.filter((id) => !first.has(id));
  }
  return shuffled(deckIds, rng).slice(0, TOURNAMENT_HAND_SIZE);
}

/** Una serie è chiusa a 2 vittorie; dopo 3 partite vince chi è avanti (i pareggi non contano). */
export function seriesWinnerSide(series) {
  if (series.winsA >= SERIES_WINS_NEEDED) return 'a';
  if (series.winsB >= SERIES_WINS_NEEDED) return 'b';
  const played = series.games.filter((g) => g.winner).length;
  if (played >= SERIES_MAX_GAMES && series.winsA !== series.winsB) {
    return series.winsA > series.winsB ? 'a' : 'b';
  }
  return null;
}

/**
 * Crea il torneo. Tabellone a 16 posti con 4 passaggi diretti: agli Ottavi 8 partecipanti
 * giocano e 4 passano il turno; ogni Quarto oppone chi è passato a chi ha vinto.
 * @param {{ participants: object[], settings?: object, rng?: () => number }} cfg
 *   participants: 12 voci { id, name, army, deckKey, deckName, cardIds, isHuman }
 *   In locale l'umano è uno; online possono essere di più. `humanId` è il punto di vista
 *   di chi guarda il tabellone (il primo umano, finché non lo si cambia con `withViewer`).
 */
export function createTournament({ participants, settings = {}, rng = Math.random }) {
  if (!Array.isArray(participants) || participants.length !== TOURNAMENT_SIZE) {
    throw new Error(`Il torneo richiede ${TOURNAMENT_SIZE} partecipanti.`);
  }
  if (participants.filter((p) => p.isHuman).length < 1) {
    throw new Error('Il torneo richiede almeno un giocatore umano.');
  }
  for (const p of participants) {
    if (!Array.isArray(p.cardIds) || p.cardIds.length !== TOURNAMENT_DECK_SIZE || new Set(p.cardIds).size !== TOURNAMENT_DECK_SIZE) {
      throw new Error(`Mazzo non valido per ${p.name}: servono ${TOURNAMENT_DECK_SIZE} carte diverse.`);
    }
  }

  const order = shuffled(participants.map((p) => p.id), rng);
  const byes = order.slice(0, 4);
  const playing = order.slice(4);

  const round0 = [];
  for (let i = 0; i < 4; i++) {
    const byeMatch = makeMatch(0, i * 2, byes[i], null);
    byeMatch.bye = true;
    byeMatch.winnerId = byes[i];
    round0.push(byeMatch);
    round0.push(makeMatch(0, i * 2 + 1, playing[i * 2], playing[i * 2 + 1]));
  }
  const rounds = [round0];
  for (let r = 1, size = 4; size >= 1; r++, size /= 2) {
    rounds.push(Array.from({ length: size }, (_, i) => makeMatch(r, i)));
  }

  const tournament = {
    version: 1,
    settings,
    participants: Object.fromEntries(participants.map((p) => [p.id, { ...p, cardIds: [...p.cardIds] }])),
    humanId: participants.find((p) => p.isHuman).id,
    rounds,
    championId: null,
  };
  return advanceTournament(tournament);
}

function clone(tournament) {
  return JSON.parse(JSON.stringify(tournament));
}

function findMatch(tournament, matchId) {
  for (const round of tournament.rounds) {
    const m = round.find((x) => x.id === matchId);
    if (m) return m;
  }
  return null;
}

/** Incontro con almeno un partecipante guidato da una persona (non lo giocano le IA da sole). */
function involvesHuman(tournament, match) {
  return Boolean(tournament.participants[match.a]?.isHuman || tournament.participants[match.b]?.isHuman);
}

/** Incontro di chi guarda il tabellone. */
function involvesViewer(tournament, match) {
  return match.a === tournament.humanId || match.b === tournament.humanId;
}

/** Lo stesso torneo dal punto di vista di un altro partecipante (tornei online). */
export function withViewer(tournament, participantId) {
  return { ...tournament, humanId: participantId };
}

/** Il giocatore è ancora in corsa finché non perde una serie. */
export function isHumanEliminated(tournament) {
  return tournament.rounds.some((round) =>
    round.some((m) => m.winnerId && involvesViewer(tournament, m) && m.winnerId !== tournament.humanId)
  );
}

/**
 * Porta avanti il tabellone: quando tutti gli incontri di un turno hanno un vincitore, li
 * promuove al turno successivo. Le serie tra IA non si risolvono da sole: vanno giocate
 * (guardandole o concludendo il turno) e registrate con `recordAiSeries`.
 */
function advanceInPlace(tournament) {
  for (let r = 0; r < tournament.rounds.length; r++) {
    const round = tournament.rounds[r];
    if (round.some((m) => !m.winnerId)) return tournament;
    const next = tournament.rounds[r + 1];
    if (!next) {
      tournament.championId = round[0].winnerId;
      return tournament;
    }
    next.forEach((m, i) => {
      m.a = round[i * 2].winnerId;
      m.b = round[i * 2 + 1].winnerId;
    });
  }
  return tournament;
}

export function advanceTournament(tournament) {
  return advanceInPlace(clone(tournament));
}

/** Incontri tra IA pronti da giocare (entrambi i partecipanti noti, nessun vincitore). */
export function getPendingAiMatches(tournament) {
  return tournament.rounds.flatMap((round) =>
    round.filter((m) => !m.winnerId && m.a && m.b && !involvesHuman(tournament, m))
  );
}

export function getMatch(tournament, matchId) {
  return findMatch(tournament, matchId);
}

/**
 * Mani della prossima partita di una serie tra IA, con la stessa regola del giocatore.
 * @returns {{ a: number[], b: number[] }}
 */
export function dealAiSeriesHands(tournament, match, games, rng = Math.random) {
  return {
    a: dealSeriesHand(tournament.participants[match.a].cardIds, games.map((g) => g.hands.a), rng),
    b: dealSeriesHand(tournament.participants[match.b].cardIds, games.map((g) => g.hands.b), rng),
  };
}

/** Punteggio e vincitore di una serie a partire dalle sue partite concluse. */
export function tallySeries(games) {
  const series = { games, winsA: 0, winsB: 0, winner: null };
  for (const g of games) {
    if (g.winner === 'a') series.winsA += 1;
    if (g.winner === 'b') series.winsB += 1;
  }
  series.winner = seriesWinnerSide(series);
  return series;
}

/**
 * Registra una serie tra IA giocata per intero.
 * @param {object[]} games - partite concluse { hands, winner, ... } in ordine
 */
export function recordAiSeries(tournament, matchId, games) {
  const next = clone(tournament);
  const match = findMatch(next, matchId);
  if (!match || match.winnerId || involvesHuman(next, match)) return next;
  const series = tallySeries(games);
  if (!series.winner) throw new Error('Serie incompleta: nessun vincitore.');
  match.series = series;
  match.winnerId = series.winner === 'a' ? match.a : match.b;
  return advanceInPlace(next);
}

/** L'incontro che il giocatore deve giocare adesso, o null (eliminato / torneo finito). */
export function getHumanMatch(tournament) {
  for (const round of tournament.rounds) {
    const m = round.find((x) => !x.winnerId && x.a && x.b && involvesViewer(tournament, x));
    if (m) return m;
  }
  return null;
}

/** Incontri aperti in cui gioca almeno una persona (tornei online: possono essere più d'uno). */
export function getOpenHumanMatches(tournament) {
  return tournament.rounds.flatMap((round) =>
    round.filter((m) => !m.winnerId && m.a && m.b && involvesHuman(tournament, m))
  );
}

/** Lato ('a' | 'b') del giocatore in un incontro. */
export function humanSide(tournament, match) {
  return match.a === tournament.humanId ? 'a' : 'b';
}

/** Partita in attesa di esito nell'incontro (mani già assegnate), o null. */
export function getPendingGame(match) {
  const last = match.series.games[match.series.games.length - 1];
  return last && !last.winner ? last : null;
}

function prepareInPlace(tournament, match, rng) {
  if (!match || match.winnerId || getPendingGame(match)) return;
  const { games } = match.series;
  games.push({
    hands: {
      a: dealSeriesHand(tournament.participants[match.a].cardIds, games.map((g) => g.hands.a), rng),
      b: dealSeriesHand(tournament.participants[match.b].cardIds, games.map((g) => g.hands.b), rng),
    },
    winner: null,
  });
}

/**
 * Assegna le mani della prossima partita di un incontro. Idempotente: se una partita è già
 * in attesa di esito le sue mani restano quelle (anche dopo un abbandono o un
 * ricaricamento), così non si può ripescare.
 */
export function prepareMatchGame(tournament, matchId, rng = Math.random) {
  const next = clone(tournament);
  prepareInPlace(next, findMatch(next, matchId), rng);
  return next;
}

/** Come `prepareMatchGame`, per l'incontro di chi guarda il tabellone. */
export function prepareHumanGame(tournament, rng = Math.random) {
  const next = clone(tournament);
  prepareInPlace(next, getHumanMatch(next), rng);
  return next;
}

/**
 * Registra l'esito della partita in attesa di un incontro.
 * @param {'a'|'b'|'draw'} winner
 * @param {number|null} [gameIndex] - se dato, l'esito vale solo per quella partita: un
 *   doppione arrivato in ritardo (due client che riferiscono la stessa partita) viene ignorato
 */
export function recordMatchGameResult(tournament, matchId, winner, gameIndex = null) {
  const next = clone(tournament);
  const match = findMatch(next, matchId);
  const game = match && !match.winnerId ? getPendingGame(match) : null;
  if (!game) return next;
  if (gameIndex != null && gameIndex !== match.series.games.length - 1) return next;
  game.winner = winner === 'a' || winner === 'b' ? winner : 'draw';
  if (game.winner === 'a') match.series.winsA += 1;
  if (game.winner === 'b') match.series.winsB += 1;
  const winnerSide = seriesWinnerSide(match.series);
  if (winnerSide) {
    match.series.winner = winnerSide;
    match.winnerId = winnerSide === 'a' ? match.a : match.b;
  }
  return advanceInPlace(next);
}

/**
 * Registra l'esito della partita in attesa nell'incontro di chi guarda il tabellone.
 * @param {'human'|'opponent'|'draw'} outcome
 */
export function recordHumanGameResult(tournament, outcome) {
  const match = getHumanMatch(tournament);
  if (!match) return clone(tournament);
  const side = humanSide(tournament, match);
  const other = side === 'a' ? 'b' : 'a';
  return recordMatchGameResult(tournament, match.id, outcome === 'human' ? side : outcome === 'opponent' ? other : 'draw');
}

/**
 * Un giocatore lascia il torneo: il suo esercito passa a un'IA, che prosegue al suo posto.
 * La partita che aveva in corso resta in attesa con le stesse mani.
 */
export function convertToAi(tournament, participantId) {
  const next = clone(tournament);
  const p = next.participants[participantId];
  if (p?.isHuman) {
    p.isHuman = false;
    p.takenOver = true;
  }
  return next;
}

/** Stato del giocatore nel torneo. */
export function getTournamentStatus(tournament) {
  if (tournament.championId === tournament.humanId) return 'champion';
  if (isHumanEliminated(tournament)) return 'eliminated';
  return 'active';
}

/** Riassunto dell'incontro del giocatore per l'interfaccia. */
export function describeHumanMatch(tournament) {
  const match = getHumanMatch(tournament);
  if (!match) return null;
  const side = humanSide(tournament, match);
  const opponentId = side === 'a' ? match.b : match.a;
  const pending = getPendingGame(match);
  const gameNumber = match.series.games.length + (pending ? 0 : 1);
  return {
    match,
    side,
    opponent: tournament.participants[opponentId],
    roundName: ROUND_NAMES[match.round],
    gameNumber,
    handRule: handRuleForGame(gameNumber),
    humanWins: side === 'a' ? match.series.winsA : match.series.winsB,
    opponentWins: side === 'a' ? match.series.winsB : match.series.winsA,
    resuming: Boolean(pending),
  };
}
