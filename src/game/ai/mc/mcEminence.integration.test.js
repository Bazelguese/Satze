import { describe, expect, it } from 'vitest';
import { deckPairForSeed } from '../../sim/selfPlay.js';
import { createHeadlessEminenceMatch, getEminencePolicy } from '../../sim/headlessEminenceMatch.js';
import { openEminenceRound } from '../../eminence/eminenceDuelGate.js';
import { createEminenceRolloutContext, sanitizeEminenceForAi } from './mcEminence.js';
import { chooseMonteCarloAction } from './mcSearch.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

/** Stato di inizio round con le scelte dei due lati già sigillate. */
function roundWithSelections(seed = 2) {
  const [player, enemy] = deckPairForSeed(seed);
  const state = createHeadlessEminenceMatch({ seed, player, enemy });
  let ms = openEminenceRound(state.eminenceMatchState, { roundNumber: 1, initiativeSide: 'enemy' }).matchState;
  const smart = getEminencePolicy('smart');
  for (const side of ['player', 'enemy']) ms = smart.select(ms, side, { game: state, paramContext: null, rng: () => 0.5 });
  return { ...state, isPlayerFirst: false, eminenceMatchState: ms };
}

describe('Eminenze nelle simulazioni (prova C)', () => {
  it('la scelta segreta dell\'avversario non arriva all\'IA', () => {
    const state = roundWithSelections();
    expect(state.eminenceMatchState.player.selectedAbilityId).toBeTruthy();
    const seen = sanitizeEminenceForAi(state.eminenceMatchState, 'enemy');
    expect(seen.player.selectedAbilityId).toBeNull();
    expect(seen.player.selectedParams).toBeNull();
    expect(seen.player.committedPresenceCost).toBe(0);
    // La propria scelta resta.
    expect(seen.enemy.selectedAbilityId).toBe(state.eminenceMatchState.enemy.selectedAbilityId);
  });

  it('l\'abilità avversaria si estrae fra le sue legali, con pesi che sommano a 1', () => {
    const ctx = createEminenceRolloutContext(roundWithSelections());
    expect(ctx.choices.length).toBeGreaterThan(0);
    expect(ctx.choices.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1);
  });

  it('con simulateEminences il motore decide una mossa legale', () => {
    const view = roundWithSelections();
    const decision = chooseMonteCarloAction(view, { rollouts: 120, policyQuality: 0.7, opponentQuality: 0.7, simulateEminences: true }, mulberry32(4));
    const available = view.enemyHand.map((c) => c.id);
    expect(available).toContain(decision.cardId);
    expect(decision.focus).toBeGreaterThanOrEqual(1);
  });
});
