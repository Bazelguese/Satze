import { describe, expect, it } from 'vitest';
import { deckPairForSeed } from './selfPlay.js';
import { createAgentFromSpec } from './simAgents.js';
import {
  createHeadlessEminenceMatch,
  playHeadlessEminenceMatch,
  playHeadlessEminenceRound,
  getEminencePolicy,
} from './headlessEminenceMatch.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { getEminence } from '../../data/eminences.js';
import { selectEminenceAbility } from '../eminence/eminenceRound.js';

function match(seed) {
  const [player, enemy] = deckPairForSeed(seed);
  return createHeadlessEminenceMatch({ seed, player, enemy });
}

const greedy = () => ({ player: createAgentFromSpec('greedy'), enemy: createAgentFromSpec('greedy') });

describe('partite senza interfaccia con le Eminenze', () => {
  it('ogni lato riceve l\'Eminenza del proprio mazzo', () => {
    const state = match(3);
    expect(getEminence(state.eminenceMatchState.player.eminenceId)).toBeTruthy();
    expect(getEminence(state.eminenceMatchState.enemy.eminenceId)).toBeTruthy();
  });

  it('partite intere, con entrambe le politiche, senza mosse da correggere', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const result = playHeadlessEminenceMatch(match(seed), greedy(), { player: 'smart', enemy: 'first' }, {
        rng: mulberry32(seed),
      });
      expect(['player', 'enemy', 'draw']).toContain(result.winner);
      for (const round of result.rounds) {
        expect(round.fixes, `seme ${seed} turno ${round.round}`).toEqual([]);
        // Ogni lato con un'Eminenza sceglie un'abilità a ogni turno (nessun lato è bloccato qui).
        expect(round.abilities.length, `seme ${seed} turno ${round.round}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('è riproducibile con lo stesso seme', () => {
    const run = () => playHeadlessEminenceMatch(match(5), greedy(), { player: 'smart', enemy: 'smart' }, { rng: mulberry32(5) });
    const a = run();
    const b = run();
    expect(a.winner).toBe(b.winner);
    expect(a.rounds.map((r) => r.abilities)).toEqual(b.rounds.map((r) => r.abilities));
  });

  it('Caccia obbliga davvero l\'avversario a schierare la carta scelta', () => {
    // Seme 1: l'IA (lato enemy) ha Mounthborn.
    const base = match(1);
    expect(base.eminenceMatchState.enemy.eminenceId).toBe('mounthborn_fame');
    const ms = base.eminenceMatchState;
    const ready = { ...base, eminenceMatchState: { ...ms, enemy: { ...ms.enemy, presence: 3, selectionCheckpointPresence: 3 } } };
    // Si impone la carta più debole: l'avido da solo schiererebbe la più forte.
    const strength = (c) => (c.power || 0) * 1.2 + (c.damage || 0);
    const prey = [...base.playerHand].sort((x, y) => strength(x) - strength(y))[0].id;
    const huntPolicy = {
      ...getEminencePolicy('first'),
      select: (state, side, options) => {
        if (side !== 'enemy') return getEminencePolicy('first').select(state, side, options);
        const attempt = selectEminenceAbility(state, 'enemy', 'mounthborn_caccia', { preyCardId: prey });
        expect(attempt.ok).toBe(true);
        return attempt.matchState;
      },
    };
    const { record } = playHeadlessEminenceRound(ready, greedy(), { player: huntPolicy, enemy: huntPolicy });
    expect(record.abilities.find((a) => a.side === 'enemy').abilityId).toBe('mounthborn_caccia');
    expect(record.player.cardId).toBe(prey);
  });
});
