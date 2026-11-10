import { describe, expect, it } from 'vitest';
import { playAiGame } from './aiMatchEngine.js';
import { createTournamentForPlayer, hasGameLog, playAiSeries, playPendingAiSeries, replaySavedAiGame, resolveTournamentCards } from './tournamentSetup.js';
import { getPendingAiMatches } from './tournamentLogic.js';
import { ARMY_DECKS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { selectBattlefields } from '../fieldLogic.js';
import { mulberry32 } from '../../utils/seededRandom.js';

function newTournament(seed, difficulty = 'easy', mode = 'classic') {
  return createTournamentForPlayer({
    playerArmy: 'Kethran',
    playerDeckKey: 'A',
    playerDeckName: ARMY_DECKS.Kethran.A.name,
    playerCardIds: ARMY_DECKS.Kethran.A.cards,
    settings: { difficulty, mode },
    rng: mulberry32(seed),
  });
}

describe('partita IA contro IA senza tavolo', () => {
  it('rispetta le regole: carte della mano una volta sola, FC legali, esito coerente', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = mulberry32(seed);
      const handA = resolveTournamentCards(ARMY_DECKS['Corte Rossa'].A.cards).slice(0, 5);
      const handB = resolveTournamentCards(ARMY_DECKS.Orathai.A.cards).slice(5, 10);
      const battlefields = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng });
      const game = playAiGame({ handA, handB, battlefields, difficulty: 'easy', rng });
      expect(['a', 'b', 'draw']).toContain(game.winner);
      expect(game.rounds.length).toBeGreaterThanOrEqual(1);
      expect(game.rounds.length).toBeLessThanOrEqual(5);
      const usedA = game.rounds.map((r) => r.a.cardId);
      const usedB = game.rounds.map((r) => r.b.cardId);
      expect(new Set(usedA).size).toBe(usedA.length);
      expect(new Set(usedB).size).toBe(usedB.length);
      expect(usedA.every((id) => handA.some((c) => c.id === id))).toBe(true);
      expect(usedB.every((id) => handB.some((c) => c.id === id))).toBe(true);
      expect(new Set(game.rounds.map((r) => r.fieldIndex)).size).toBe(game.rounds.length);
      for (const round of game.rounds) {
        expect(round.a.focus).toBeGreaterThanOrEqual(1);
        expect(round.b.focus).toBeGreaterThanOrEqual(1);
        expect(round.focus.a).toBeGreaterThanOrEqual(0);
        expect(round.focus.b).toBeGreaterThanOrEqual(0);
      }
      // l'iniziativa si alterna a partire da chi ha la Lega più bassa
      game.rounds.forEach((round, i) => expect(round.first).toBe((i % 2 === 0) === game.aFirst ? 'a' : 'b'));
      const last = game.rounds[game.rounds.length - 1];
      if (game.reason === 'fields' && game.rounds.length < 5) {
        expect(last.fields[game.winner]).toBeGreaterThanOrEqual(3);
      }
      if (game.reason === 'hp' && game.winner !== 'draw') {
        const loser = game.winner === 'a' ? 'b' : 'a';
        expect(game.final.hp[game.winner]).toBeGreaterThan(game.final.hp[loser]);
      }
    }
  });

  it('una serie giocata segue la regola delle mani e si può rigiocare identica', async () => {
    let t = newTournament(3);
    const match = getPendingAiMatches(t)[0];
    t = await playAiSeries(t, match.id, { rng: mulberry32(9) });
    const saved = t.rounds[match.round].find((m) => m.id === match.id);
    expect(saved.winnerId).toBe(saved.series.winner === 'a' ? saved.a : saved.b);
    const { games } = saved.series;
    expect(games.length).toBeGreaterThanOrEqual(2);
    for (const side of ['a', 'b']) {
      const deck = [...t.participants[saved[side]].cardIds].sort((x, y) => x - y);
      expect([...games[0].hands[side], ...games[1].hands[side]].sort((x, y) => x - y)).toEqual(deck);
    }
    for (const game of games) {
      expect(hasGameLog(game)).toBe(true);
      const replay = replaySavedAiGame(t, game);
      expect(replay.game.winner).toBe(game.winner);
      expect(replay.game.rounds).toEqual(game.rounds);
      expect(replay.game.frames.length).toBe(game.rounds.length);
    }
  });

  it('concludere il turno gioca tutte le serie IA pronte e fa avanzare il tabellone', async () => {
    let t = newTournament(5);
    const progress = [];
    t = await playPendingAiSeries(t, { rng: mulberry32(2), onProgress: (p) => progress.push(p.match.id) });
    // solo il turno in corso: le serie dei Quarti appena definite restano da giocare
    expect(getPendingAiMatches(t).every((m) => m.round === 1)).toBe(true);
    const humanPlaysOttavi = t.rounds[0].some((m) => !m.bye && (m.a === 'human' || m.b === 'human'));
    // i Quarti si definiscono solo quando anche la serie del giocatore è chiusa
    expect(t.rounds[1].every((m) => m.a && m.b)).toBe(!humanPlaysOttavi);
    expect(new Set(progress).size).toBeGreaterThanOrEqual(3);
    const aiDone = t.rounds[0].filter((m) => !m.bye && m.a !== 'human' && m.b !== 'human');
    expect(aiDone.every((m) => m.winnerId)).toBe(true);
  });
});
