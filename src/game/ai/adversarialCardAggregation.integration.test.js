/**
 * Commit 5 — aggregazione adversarial delle carte quando l'IA apre.
 */
import { describe, it, expect } from 'vitest';
import {
  chooseAIIndependentAction,
  createConstantRng,
  getAIProfile,
  evaluateActionWithSearch,
  aggregatePlayerCardScores,
  generateOpponentScenarios,
} from './index.js';
import { makeAIContext, makeCard, neutralField } from './aiTestFixtures.js';

describe('aggregatePlayerCardScores uniforme', () => {
  it('Difficile = min, Facile = media, non media uniforme in Difficile', () => {
    const cards = [
      { cardId: 1, score: 200 },
      { cardId: 2, score: -500 },
      { cardId: 3, score: 50 },
    ];
    expect(aggregatePlayerCardScores(cards, getAIProfile('hard'))).toBe(-500);
    expect(aggregatePlayerCardScores(cards, getAIProfile('easy'))).toBeCloseTo(-250 / 3, 5);
    expect(aggregatePlayerCardScores(cards, getAIProfile('hard'))).not.toBe(
      cards.reduce((s, c) => s + c.score, 0) / cards.length
    );
  });
});

describe('IA apre: Difficile rispetta il counter, Facile può ignorarlo', () => {
  function makeLeadContext() {
    const weak = (id) => makeCard({ id, name: `Weak${id}`, power: 1, damage: 1, league: 2 });
    // Counter imbattibile da Glass anche a Focus max; DAN alto = worst-case devastante
    const counter = makeCard({
      id: 555,
      name: 'Counter',
      power: 18,
      damage: 9,
      league: 1,
    });
    const glass = makeCard({
      id: 800,
      name: 'Glass',
      power: 7,
      damage: 6,
      league: 3,
      // Bruciarla contro il Counter è un disastro strategico
      ability: { trigger: 'ultimaChance', effect: 'power', value: 3 },
    });
    const solid = makeCard({
      id: 801,
      name: 'Solid',
      power: 5,
      damage: 2,
      league: 2,
    });

    return makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: false,
      openingPlayerFirst: false,
      currentFieldIndex: 0,
      field: neutralField,
      player: {
        hand: [weak(501), weak(502), weak(503), weak(504), counter],
        usedCardIds: [],
        hp: 16,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
        visibleCard: null,
      },
      ai: {
        hand: [glass, solid, makeCard({ id: 802, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 16,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
      },
    });
  }

  it('evaluateActionWithSearch: Difficile penalizza Glass per il counter', () => {
    const ctx = makeLeadContext();
    const scenarios = generateOpponentScenarios(ctx, {
      ...getAIProfile('hard'),
      opponentScenarioCount: 8,
    });
    expect(new Set(scenarios.map((s) => s.cardId)).has(555)).toBe(true);

    const glassAction = {
      card: ctx.ai.hand[0],
      cardId: 800,
      focus: 3,
      fieldIndex: 0,
    };
    const solidAction = {
      card: ctx.ai.hand[1],
      cardId: 801,
      focus: 3,
      fieldIndex: 0,
    };

    const hardGlass = evaluateActionWithSearch(ctx, glassAction, getAIProfile('hard'), {
      depth: 0,
      scenarios,
    });
    const hardSolid = evaluateActionWithSearch(ctx, solidAction, getAIProfile('hard'), {
      depth: 0,
      scenarios,
    });
    // Contro Counter (VA alta + DAN 7) Glass è peggiore in worst-case
    expect(hardSolid.score).toBeGreaterThan(hardGlass.score);

    const easyGlass = evaluateActionWithSearch(ctx, glassAction, getAIProfile('easy'), {
      depth: 0,
      scenarios,
    });
    const easySolid = evaluateActionWithSearch(ctx, solidAction, getAIProfile('easy'), {
      depth: 0,
      scenarios,
    });
    // In media Facile può ancora preferire Glass (4 matchup facili)
    expect(easyGlass.score).toBeGreaterThan(easySolid.score);
  });

  it('choose: Difficile evita Glass; Facile può sceglierlo', () => {
    const ctx = makeLeadContext();

    const hardProfile = {
      ...getAIProfile('hard'),
      selectionMode: 'best',
      searchDepth: 1,
      beamWidth: 8,
    };
    const scenarios = generateOpponentScenarios(ctx, {
      ...hardProfile,
      opponentScenarioCount: 8,
    });
    expect(new Set(scenarios.map((s) => s.cardId)).has(555)).toBe(true);

    const glassAction = { card: ctx.ai.hand[0], cardId: 800, focus: 1, fieldIndex: 0 };
    const solidAction = { card: ctx.ai.hand[1], cardId: 801, focus: 1, fieldIndex: 0 };
    const hardGlass = evaluateActionWithSearch(ctx, glassAction, hardProfile, {
      depth: 0,
      scenarios,
    });
    const hardSolid = evaluateActionWithSearch(ctx, solidAction, hardProfile, {
      depth: 0,
      scenarios,
    });
    expect(hardSolid.score).toBeGreaterThan(hardGlass.score);

    const hard = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardProfile,
      searchDepth: 1,
      includeSearch: true,
    });
    // Difficile considera il counter: non apre con Glass
    expect(hard?.cardId).not.toBe(800);

    const easy = chooseAIIndependentAction(ctx, 'easy', {
      rng: createConstantRng(0),
      profile: {
        ...getAIProfile('easy'),
        selectionMode: 'best',
        searchDepth: 0,
        topBandRatio: 1,
        scoreWindow: 5000,
      },
      includeSearch: false,
    });
    // Facile (media) può ignorare il counter e prendere Glass
    expect(easy?.cardId).toBe(800);
  });
});
