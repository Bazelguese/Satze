/**
 * Ricerca multi-round: profondità, endgame, cache, privacy.
 */
import { describe, it, expect } from 'vitest';
import {
  getAIProfile,
  buildStrategicState,
  resolveSearchDepth,
  evaluateActionWithSearch,
  chooseAIIndependentAction,
  createConstantRng,
} from './index.js';
import { makeAIContext, makeCard } from './aiTestFixtures.js';

function makeTwoCardEndgame(difficulty = 'medium') {
  const playerCard = makeCard({ id: 100, name: 'P', power: 3, damage: 2 });
  const playerCard2 = makeCard({ id: 101, name: 'P2', power: 2, damage: 2 });
  const aiCard = makeCard({ id: 200, name: 'A', power: 4, damage: 3 });
  const aiCard2 = makeCard({ id: 201, name: 'A2', power: 2, damage: 2 });
  return makeAIContext({
    difficulty,
    roundNumber: 4,
    isPlayerFirst: true,
    openingPlayerFirst: true,
    player: {
      hand: [playerCard, playerCard2],
      usedCardIds: [],
      hp: 12,
      focusPool: 6,
      focus: 6,
      armyBonuses: {},
      toxin: null,
      visibleCard: playerCard,
    },
    ai: {
      hand: [aiCard, aiCard2],
      usedCardIds: [],
      hp: 12,
      focusPool: 6,
      focus: 6,
      armyBonuses: {},
      toxin: null,
    },
  });
}

describe('searchGameTree — commit 2', () => {
  it('profili: searchDepth 0/1/2 e beam stretto', () => {
    expect(getAIProfile('easy').searchDepth).toBe(0);
    expect(getAIProfile('medium').searchDepth).toBe(1);
    expect(getAIProfile('hard').searchDepth).toBe(2);
    expect(getAIProfile('medium').beamWidth).toBeLessThanOrEqual(14);
    expect(getAIProfile('hard').beamWidth).toBeLessThanOrEqual(16);
    expect(getAIProfile('medium').solveEndgameAtCardsRemaining).toBe(2);
  });

  it('resolveSearchDepth: base e endgame a 2 carte', () => {
    const mid = makeAIContext({
      difficulty: 'medium',
      player: {
        hand: [1, 2, 3, 4, 5].map((n) => makeCard({ id: 110 + n })),
        usedCardIds: [],
        hp: 20,
        focusPool: 18,
        focus: 18,
        armyBonuses: {},
        toxin: null,
        visibleCard: makeCard({ id: 111 }),
      },
      ai: {
        hand: [1, 2, 3, 4, 5].map((n) => makeCard({ id: 210 + n, power: 3, damage: 2 })),
        usedCardIds: [],
        hp: 20,
        focusPool: 18,
        focus: 18,
        armyBonuses: {},
        toxin: null,
      },
    });
    const midState = buildStrategicState(mid);
    expect(midState.aiRemainingCardIds.length).toBeGreaterThan(3);
    expect(resolveSearchDepth(getAIProfile('medium'), midState)).toBe(1);
    expect(resolveSearchDepth(getAIProfile('hard'), midState)).toBe(2);
    expect(resolveSearchDepth(getAIProfile('easy'), midState)).toBe(0);

    const endState = buildStrategicState(makeTwoCardEndgame('medium'));
    expect(endState.aiRemainingCardIds).toHaveLength(2);
    expect(endState.playerRemainingCardIds).toHaveLength(2);
    expect(resolveSearchDepth(getAIProfile('medium'), endState)).toBeGreaterThanOrEqual(2);
  });

  it('evaluateActionWithSearch: score finito e riuso cache', () => {
    const ctx = makeTwoCardEndgame('medium');
    const profile = {
      ...getAIProfile('medium'),
      beamWidth: 4,
      opponentScenarioCount: 2,
      ownVariantsPerCard: 2,
      ownActionLimitWhenFirst: 4,
    };
    const action = {
      card: ctx.ai.hand[0],
      cardId: ctx.ai.hand[0].id,
      focus: 2,
      fieldIndex: 0,
    };
    const stats = { nodes: 0, cacheHits: 0 };
    const tt = new Map();
    const cache = new Map();

    const a = evaluateActionWithSearch(ctx, action, profile, {
      depth: 1,
      cache,
      transpositionTable: tt,
      stats,
    });
    expect(Number.isFinite(a.score)).toBe(true);
    expect(stats.nodes).toBeGreaterThan(0);

    const nodesBefore = stats.nodes;
    const b = evaluateActionWithSearch(ctx, action, profile, {
      depth: 1,
      cache,
      transpositionTable: tt,
      stats,
    });
    expect(b.score).toBe(a.score);
    expect(stats.nodes).toBeGreaterThanOrEqual(nodesBefore);
  });

  it('choose con ricerca: deterministico e senza Focus privato', () => {
    const ctx = makeTwoCardEndgame('medium');
    const profile = {
      ...getAIProfile('medium'),
      selectionMode: 'best',
      beamWidth: 4,
      opponentScenarioCount: 2,
      ownVariantsPerCard: 2,
      ownActionLimitWhenFirst: 6,
    };

    const d1 = chooseAIIndependentAction(ctx, 'medium', {
      profile,
      rng: createConstantRng(0.1),
      includeSearch: true,
    });
    const d2 = chooseAIIndependentAction(ctx, 'medium', {
      profile,
      rng: createConstantRng(0.1),
      includeSearch: true,
    });

    expect(d1?.card).toBeTruthy();
    expect(d1.cardId).toBe(d2.cardId);
    expect(d1.focus).toBe(d2.focus);
    expect(d1.debug?.searchDepth).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(d1.debug || {}).includes('selectedFocus')).toBe(false);
  });

  it('easy resta depth 0 fuori endgame', () => {
    const playerVisible = makeCard({ id: 101, name: 'P', power: 2, damage: 2 });
    const ctx = makeAIContext({
      difficulty: 'easy',
      player: {
        hand: [playerVisible, ...[2, 3, 4, 5].map((n) => makeCard({ id: 100 + n }))],
        usedCardIds: [],
        hp: 20,
        focusPool: 18,
        focus: 18,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerVisible,
      },
      ai: {
        hand: [1, 2, 3, 4, 5].map((n) => makeCard({ id: 200 + n, power: 3, damage: 2 })),
        usedCardIds: [],
        hp: 20,
        focusPool: 18,
        focus: 18,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'easy', {
      rng: createConstantRng(0.2),
    });
    expect(decision?.card).toBeTruthy();
    expect(decision.debug?.searchDepth).toBe(0);
  });
});
