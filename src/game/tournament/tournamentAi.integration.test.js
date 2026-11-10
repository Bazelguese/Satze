import { describe, it, expect } from 'vitest';
import { createTournamentForPlayer, resolveTournamentCards } from './tournamentSetup.js';
import { playAiGame, playAiGameAsync } from './aiMatchEngine.js';
import { createTournamentMcDecider } from './tournamentAi.js';
import { ARMY_DECKS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { MC_TRAIT_IDS } from '../ai/mc/mcTraits.js';
import { mulberry32 } from '../../utils/seededRandom.js';

function newTournament(personality) {
  return createTournamentForPlayer({
    playerArmy: 'Kethran',
    playerDeckKey: 'A',
    playerDeckName: 'x',
    playerCardIds: ARMY_DECKS.Kethran.A.cards,
    settings: { difficulty: 'medium', mode: 'classic', personality },
    rng: mulberry32(5),
  });
}

const aiOf = (t) => Object.values(t.participants).filter((p) => !p.isHuman);

describe('torneo: personalità delle IA', () => {
  it('un tratto per tutte, Neutrale di base, Casuale per ciascuna', () => {
    expect(aiOf(newTournament('avaro')).every((p) => p.aiTrait === 'avaro')).toBe(true);
    expect(aiOf(newTournament(undefined)).every((p) => p.aiTrait === 'neutral')).toBe(true);
    const random = aiOf(newTournament('random')).map((p) => p.aiTrait);
    expect(random.every((id) => MC_TRAIT_IDS.includes(id))).toBe(true);
    expect(new Set(random).size).toBeGreaterThan(1);
  });
});

describe('torneo: partite tra IA con decisore esterno', () => {
  const cfg = () => ({
    handA: resolveTournamentCards(ARMY_DECKS.Kethran.A.cards.slice(0, 5)),
    handB: resolveTournamentCards(ARMY_DECKS.Kethran.B.cards.slice(0, 5)),
    battlefields: ALL_BATTLEFIELDS.filter((f) => f.category !== 'neutral').slice(0, 5),
    mode: 'classic',
    difficulty: 'easy',
    rng: mulberry32(9),
  });

  it('senza worker non c’è decisore e la partita usa il pianificatore', () => {
    expect(createTournamentMcDecider({ difficulty: 'easy' })).toBeNull();
  });

  it('le scelte del decisore vengono rese legali; se fallisce si usa il pianificatore', async () => {
    let calls = 0;
    const silly = async () => {
      calls += 1;
      if (calls % 3 === 0) throw new Error('worker giù');
      return { fieldIndex: 99, cardId: -1, focus: 99 };
    };
    const game = await playAiGameAsync(cfg(), async () => {}, silly);
    expect(calls).toBeGreaterThan(0);
    expect(['a', 'b', 'draw']).toContain(game.winner);
    // La partita giocata si rigioca identica dalle scelte salvate (spettatore).
    const replay = playAiGame({ ...cfg(), script: { aFirst: game.aFirst, rounds: game.rounds } });
    expect(replay.winner).toBe(game.winner);
    expect(replay.rounds.map((r) => r.a.cardId)).toEqual(game.rounds.map((r) => r.a.cardId));
  });
});
