/**
 * Commit 4 — test end-to-end sul planner reale (chooseAI* / chooseJoint*).
 */
import { describe, it, expect } from 'vitest';
import {
  chooseAIIndependentAction,
  chooseJointAIAction,
  chooseAIAction,
  createConstantRng,
  getAIProfile,
  getOrdinaryFocusCap,
  simulateAIDuel,
  aggregatePlayerCardScores,
} from './index.js';
import { makeAIContext, makeCard, makeRound1BudgetFixture, neutralField } from './aiTestFixtures.js';

function hardBest(profileExtra = {}) {
  return {
    ...getAIProfile('hard'),
    selectionMode: 'best',
    scoreWindow: 20,
    ...profileExtra,
  };
}

function field(id, name, category = 'neutral', tema = 'generico') {
  return { ...neutralField, id, name, category, tema };
}

describe('aggregazione carte avversarie (valuePlayerToMove)', () => {
  it('Difficile prende il peggiore; Facile la media; Normale pesa le carte sensate', () => {
    const cards = [
      { cardId: 1, score: 100 },
      { cardId: 2, score: 10 },
      { cardId: 3, score: 40 },
    ];
    expect(aggregatePlayerCardScores(cards, getAIProfile('hard'))).toBe(10);
    expect(aggregatePlayerCardScores(cards, getAIProfile('easy'))).toBeCloseTo(50, 5);
    const medium = aggregatePlayerCardScores(cards, getAIProfile('medium'));
    expect(medium).toBeGreaterThanOrEqual(10);
    expect(medium).toBeLessThan(100);
    // Più vicino al peggiore che al migliore (giocatore adversarial)
    expect(medium).toBeLessThan(50);
  });
});

describe('planner E2E comportamentale', () => {
  it('conserva Ultima Chance quando esiste una buona alternativa', () => {
    const filler = makeCard({ id: 901, name: 'Filler', power: 5, damage: 4, league: 2 });
    const ultima = makeCard({
      id: 902,
      name: 'Ultima',
      power: 4,
      damage: 3,
      league: 3,
      ability: { trigger: 'ultimaChance', effect: 'power', value: 3 },
    });
    const playerCard = makeCard({ id: 100, power: 1, damage: 1, league: 1 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 1,
      isPlayerFirst: true,
      player: {
        hand: [playerCard, makeCard({ id: 101 }), makeCard({ id: 102 })],
        usedCardIds: [],
        hp: 20,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerCard,
      },
      ai: {
        hand: [filler, ultima, makeCard({ id: 903, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 20,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    expect(decision?.cardId).not.toBe(902);
  });

  it('usa Turbo prima della scadenza', () => {
    const turbo = makeCard({
      id: 910,
      name: 'Turbo',
      power: 3,
      damage: 3,
      league: 2,
      ability: { trigger: 'turbo', effect: 'power', value: 2 },
    });
    const late = makeCard({
      id: 911,
      name: 'Late',
      power: 4,
      damage: 3,
      league: 2,
      ability: { trigger: 'ultimaChance', effect: 'power', value: 2 },
    });
    const playerCard = makeCard({ id: 110, power: 3, damage: 2, league: 2 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: true,
      player: {
        hand: [playerCard, makeCard({ id: 111 }), makeCard({ id: 112 })],
        usedCardIds: [],
        hp: 18,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerCard,
      },
      ai: {
        hand: [turbo, late, makeCard({ id: 912, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 18,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    expect(decision?.cardId).toBe(910);
  });

  it('effettua un sacrificio economico che prepara Vendetta e iniziativa', () => {
    // Beater imbattibile ora: anche Vendetta senza trigger perde. Chaff a 1 FC è il sacrificio.
    const chaff = makeCard({ id: 920, name: 'Chaff', power: 1, damage: 1, league: 1 });
    const vendetta = makeCard({
      id: 921,
      name: 'Vendetta',
      power: 4,
      damage: 3,
      league: 3,
      ability: { trigger: 'vendetta', effect: 'power', value: 2 },
    });
    const beater = makeCard({ id: 120, name: 'Beater', power: 12, damage: 8, league: 1 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: true,
      lastWinner: null,
      player: {
        hand: [beater, makeCard({ id: 121, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 16,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
        visibleCard: beater,
      },
      ai: {
        hand: [chaff, vendetta],
        usedCardIds: [],
        hp: 16,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest({ searchDepth: 2, beamWidth: 12 }),
    });
    expect(decision?.cardId).toBe(920);
    expect(decision?.focus).toBeLessThanOrEqual(2);
    const sim = simulateAIDuel(
      ctx,
      { card: decision.card, cardId: decision.cardId, focus: decision.focus },
      { card: beater, focus: 3 }
    );
    expect(sim.winner).toBe('player');
  });

  it('rifiuta il sacrificio quando può ottenere una vittoria efficiente', () => {
    const ace = makeCard({ id: 930, name: 'Ace', power: 7, damage: 8, league: 3 });
    const filler = makeCard({ id: 931, name: 'Filler', power: 2, damage: 2, league: 1 });
    const weak = makeCard({ id: 130, name: 'Weak', power: 1, damage: 1, league: 1 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: true,
      player: {
        hand: [weak, makeCard({ id: 131 })],
        usedCardIds: [],
        hp: 5,
        focusPool: 4,
        focus: 4,
        armyBonuses: {},
        toxin: null,
        visibleCard: weak,
      },
      ai: {
        hand: [ace, filler],
        usedCardIds: [],
        hp: 18,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    expect(decision?.cardId).toBe(930);
    const sim = simulateAIDuel(
      ctx,
      { card: decision.card, cardId: decision.cardId, focus: decision.focus },
      { card: weak, focus: 1 }
    );
    expect(sim.winner).toBe('enemy');
    expect(sim.playerHpAfter).toBeLessThanOrEqual(0);
  });

  it('conserva almeno 5 FC per un Overdrive futuro quando conveniente', () => {
    // Now vince facilmente; OD va tenuto per dopo con budget ≥5
    const od = makeCard({
      id: 940,
      name: 'Overdrive',
      power: 2,
      damage: 2,
      league: 2,
      ability: { trigger: 'overdrive', effect: 'power', value: 2 },
    });
    const now = makeCard({ id: 941, name: 'Now', power: 6, damage: 4, league: 2 });
    const playerCard = makeCard({ id: 140, power: 2, damage: 1, league: 2 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 1,
      isPlayerFirst: true,
      player: {
        hand: [playerCard, makeCard({ id: 141 }), makeCard({ id: 142 })],
        usedCardIds: [],
        hp: 20,
        focusPool: 14,
        focus: 14,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerCard,
      },
      ai: {
        hand: [now, od, makeCard({ id: 942, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 20,
        focusPool: 14,
        focus: 14,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    expect(decision?.cardId).toBe(941);
    const remaining = 14 - decision.focus;
    expect(remaining).toBeGreaterThanOrEqual(5);
  });

  it('sceglie un Campo che abilita la migliore carta futura', () => {
    const odField = field(79, 'Centrale Energetica', 'focus', "Figli dell'Orizzonte");
    const badField = field(1, 'Limite', 'limit', 'generico');
    const midField = field(51, 'Neutro', 'neutral', 'generico');
    const odCard = makeCard({
      id: 950,
      name: 'OD',
      army: "Figli dell'Orizzonte",
      power: 3,
      damage: 3,
      ability: { trigger: 'overdrive', effect: 'power', value: 2 },
    });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 1,
      isPlayerFirst: false,
      currentFieldIndex: null,
      field: null,
      battlefields: [badField, odField, midField],
      revealedFields: 3,
      player: {
        hand: [
          makeCard({ id: 150, power: 2, damage: 2 }),
          makeCard({ id: 151, power: 2, damage: 2 }),
        ],
        usedCardIds: [],
        hp: 18,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
        visibleCard: null,
      },
      ai: {
        hand: [odCard, makeCard({ id: 951, power: 2, damage: 2 })],
        usedCardIds: [],
        hp: 18,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
      },
    });
    const joint = chooseJointAIAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest({ beamWidth: 8 }),
    });
    expect(joint?.fieldIndex).toBe(1);
  });

  it('trova letale e terzo Campo', () => {
    const finisher = makeCard({ id: 960, name: 'Finisher', power: 4, damage: 6, league: 3 });
    const other = makeCard({ id: 961, name: 'Other', power: 2, damage: 2, league: 1 });
    const weak = makeCard({ id: 160, name: 'Weak', power: 1, damage: 1, league: 1 });
    const lethalCtx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 3,
      isPlayerFirst: true,
      player: {
        hand: [weak],
        usedCardIds: [],
        hp: 4,
        focusPool: 3,
        focus: 3,
        armyBonuses: {},
        toxin: null,
        visibleCard: weak,
      },
      ai: {
        hand: [finisher, other],
        usedCardIds: [],
        hp: 16,
        focusPool: 6,
        focus: 6,
        armyBonuses: {},
        toxin: null,
      },
    });
    const lethal = chooseAIIndependentAction(lethalCtx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    const lethalSim = simulateAIDuel(
      lethalCtx,
      { card: lethal.card, cardId: lethal.cardId, focus: lethal.focus },
      { card: weak, focus: 1 }
    );
    expect(lethalSim.playerHpAfter).toBeLessThanOrEqual(0);

    const fieldWinCtx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 3,
      isPlayerFirst: true,
      enemyFieldsConquered: 2,
      conqueredFields: {
        1: { winner: 'enemy', army: 'Kethran' },
        2: { winner: 'enemy', army: 'Kethran' },
      },
      battlefields: [neutralField, neutralField, neutralField],
      revealedFields: 3,
      currentFieldIndex: 0,
      field: neutralField,
      player: {
        hand: [weak, makeCard({ id: 161 })],
        usedCardIds: [],
        hp: 14,
        focusPool: 6,
        focus: 6,
        armyBonuses: {},
        toxin: null,
        visibleCard: weak,
      },
      ai: {
        hand: [finisher, other],
        usedCardIds: [],
        hp: 14,
        focusPool: 6,
        focus: 6,
        armyBonuses: {},
        toxin: null,
      },
    });
    const fieldWin = chooseAIIndependentAction(fieldWinCtx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    const fieldSim = simulateAIDuel(
      fieldWinCtx,
      { card: fieldWin.card, cardId: fieldWin.cardId, focus: fieldWin.focus, fieldIndex: 0 },
      { card: weak, focus: 1 }
    );
    expect(fieldSim.winner).toBe('enemy');
    expect(
      fieldSim.terminalStatus === 'ai_win_fields' || fieldSim.aiFieldsAfter >= 3
    ).toBe(true);
  });

  it('non investe 12 FC al primo round senza eccezione', () => {
    const ctx = makeRound1BudgetFixture('hard');
    const decision = chooseAIAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: hardBest(),
    });
    const budget = getOrdinaryFocusCap(ctx, 'ai', getAIProfile('hard'));
    expect(decision.focus).toBeLessThan(12);
    expect(decision.focus).toBeLessThanOrEqual(budget.ordinaryCap + 1);
  });
});
