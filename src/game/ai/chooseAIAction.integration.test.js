/**
 * Test di integrazione del motore IA (Focus nascosti + budget).
 */
import { describe, it, expect } from 'vitest';
import {
  chooseAIAction,
  chooseAIIndependentAction,
  buildAIInformationSet,
  buildPublicDecisionKey,
  chooseAIField,
  createConstantRng,
  getAIProfile,
} from './index.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import { makeAIContext, makeCard, makeRound1BudgetFixture, neutralField } from './aiTestFixtures.js';

describe('chooseAIAction — Focus nascosti e budget', () => {
  it('stessa decisione con selectedFocus 1 e 12 (via information set)', () => {
    const playerCard = makeCard({ id: 100, power: 3, damage: 2 });
    const baseState = {
      aiDifficulty: 'medium',
      gameMode: 'classic',
      roundNumber: 1,
      lastWinner: null,
      isPlayerFirst: true,
      currentFieldIndex: 0,
      battlefields: [neutralField],
      conqueredFields: {},
      revealedFields: 1,
      playerHand: [playerCard, makeCard({ id: 101 }), makeCard({ id: 102 }), makeCard({ id: 103 }), makeCard({ id: 104 })],
      enemyHand: [1, 2, 3, 4, 5].map((n) =>
        makeCard({ id: 200 + n, name: `AI-${n}`, power: 4, damage: 3, league: 3 })
      ),
      playerUsedCards: [],
      enemyUsedCards: [],
      playerHP: 20,
      enemyHP: 20,
      playerFocus: 18,
      enemyFocus: 18,
      playerArmyBonuses: {},
      enemyArmyBonuses: {},
      playerToxin: null,
      enemyToxin: null,
      selectedAgent: playerCard,
      campaignDuelMod: null,
    };

    const ctxA = buildAIInformationSet({ ...baseState, selectedFocus: 1 });
    const ctxB = buildAIInformationSet({ ...baseState, selectedFocus: 12 });
    expect(buildPublicDecisionKey(ctxA)).toBe(buildPublicDecisionKey(ctxB));

    const a = chooseAIAction(ctxA, 'medium', { rng: createConstantRng(0) });
    const b = chooseAIAction(ctxB, 'medium', { rng: createConstantRng(0) });
    expect(a.cardId).toBe(b.cardId);
    expect(a.focus).toBe(b.focus);
    expect(a.fieldIndex).toBe(b.fieldIndex);
  });

  it('regressione: Normale round1 18FC/5carte → focus ≤ 6', () => {
    const context = makeRound1BudgetFixture('medium');
    const decision = chooseAIIndependentAction(context, 'medium', {
      rng: createConstantRng(0),
    });
    expect(decision).toBeTruthy();
    expect(decision.focus).toBeLessThanOrEqual(6);
    expect(decision.debug?.ordinaryCap).toBe(6);
  });

  it('regressione: Difficile round1 18FC/5carte → focus ≤ 7', () => {
    const context = makeRound1BudgetFixture('hard');
    const decision = chooseAIIndependentAction(context, 'hard', {
      rng: createConstantRng(0),
    });
    expect(decision).toBeTruthy();
    expect(decision.focus).toBeLessThanOrEqual(7);
  });

  it('scelta Campo invariante al Focus privato', () => {
    const playerCard = makeCard({ id: 100, power: 3, damage: 2 });
    const fields = [neutralField, { ...neutralField, id: 52, name: 'B' }];
    const baseState = {
      aiDifficulty: 'hard',
      gameMode: 'classic',
      roundNumber: 1,
      lastWinner: null,
      isPlayerFirst: false,
      currentFieldIndex: null,
      battlefields: fields,
      conqueredFields: {},
      revealedFields: 2,
      playerHand: [playerCard],
      enemyHand: [makeCard({ id: 200, power: 4, damage: 3 })],
      playerUsedCards: [],
      enemyUsedCards: [],
      playerHP: 20,
      enemyHP: 20,
      playerFocus: 10,
      enemyFocus: 10,
      playerArmyBonuses: {},
      enemyArmyBonuses: {},
      playerToxin: null,
      enemyToxin: null,
      selectedAgent: null,
      campaignDuelMod: null,
    };
    const a = chooseAIField(buildAIInformationSet({ ...baseState, selectedFocus: 2 }), 'hard', {
      rng: createConstantRng(0),
    });
    const b = chooseAIField(buildAIInformationSet({ ...baseState, selectedFocus: 11 }), 'hard', {
      rng: createConstantRng(0),
    });
    expect(a).toBe(b);
  });

  it('risposta: Difficile sceglie letale disponibile', () => {
    const killer = makeCard({ id: 300, name: 'Killer', power: 8, damage: 10, league: 3 });
    const weak = makeCard({ id: 301, name: 'Weak', power: 1, damage: 1, league: 1 });
    const player = makeCard({ id: 100, name: 'Prey', power: 1, damage: 1, league: 1 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: true,
      player: {
        visibleCard: player,
        hp: 8,
        focusPool: 6,
        focus: 6,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [killer, weak],
        usedCardIds: [],
        hp: 20,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision.cardId).toBe(killer.id);
  });

  it('ultima carta può superare il cap ordinario', () => {
    const card = makeCard({ id: 900, power: 5, damage: 3 });
    const player = makeCard({ id: 190, power: 4, damage: 2 });
    const context = makeAIContext({
      difficulty: 'medium',
      isPlayerFirst: true,
      player: {
        visibleCard: player,
        hand: [player],
        usedCardIds: [],
        hp: 20,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [card],
        usedCardIds: [],
        hp: 20,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIAction(context, 'medium', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    // Legal max = 10; può usare oltre ordinaryCap grazie a ultima-carta
    expect(decision.focus).toBeGreaterThanOrEqual(1);
  });

  it('deterministica a parità di RNG/stato pubblico', () => {
    const context = makeRound1BudgetFixture('hard');
    const a = chooseAIAction(context, 'hard', { rng: createConstantRng(0.42) });
    const b = chooseAIAction(context, 'hard', { rng: createConstantRng(0.42) });
    expect(a.cardId).toBe(b.cardId);
    expect(a.focus).toBe(b.focus);
  });

  it('debug non espone selectedFocus', () => {
    const context = makeRound1BudgetFixture('medium');
    const decision = chooseAIAction(context, 'medium', { rng: createConstantRng(0) });
    const dump = JSON.stringify(decision.debug || {});
    expect(dump.includes('selectedFocus')).toBe(false);
    expect(decision.debug.informationPolicy).toBe('hidden-player-focus');
  });

  it('metriche round1: media Focus entro target per difficoltà', () => {
    const difficulties = [
      { id: 'easy', maxP95: 5 },
      { id: 'medium', maxP95: 6 },
      { id: 'hard', maxP95: 7 },
    ];
    for (const { id, maxP95 } of difficulties) {
      const focuses = [];
      for (let i = 0; i < 30; i += 1) {
        const context = makeRound1BudgetFixture(id);
        const decision = chooseAIAction(context, id, {
          rng: createConstantRng((i * 0.037) % 1),
        });
        focuses.push(decision.focus);
      }
      const avg = focuses.reduce((a, b) => a + b, 0) / focuses.length;
      const sorted = [...focuses].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      expect(p95).toBeLessThanOrEqual(maxP95);
      expect(avg).toBeLessThanOrEqual(maxP95);
    }
  });

  it('intervention ancora valutabile via simulazione (carta pubblica)', () => {
    const interv = makeCard({
      id: 610,
      name: 'Inter',
      power: 3,
      damage: 2,
      league: 2,
      ability: { trigger: 'intervention', effect: 'power', value: 3 },
    });
    const player = makeCard({ id: 160, name: 'Lead', power: 3, damage: 2, league: 2 });
    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: true,
      player: {
        visibleCard: player,
        hand: [player],
        usedCardIds: [],
        hp: 20,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [interv],
        usedCardIds: [],
        hp: 20,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    const sim = simulateAIDuel(context, decision, { card: player, focus: 2 });
    expect(sim.aiAbilityTriggered).toBe(true);
  });
});
