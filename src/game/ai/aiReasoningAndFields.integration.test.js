import { describe, it, expect } from 'vitest';
import {
  formatAIReasoningEntry,
  formatAIReasoningLogText,
  buildAIDebugPayload,
} from './aiDebug.js';
import { evaluateFieldSelectionAdjustment } from './fieldStrategy.js';
import { buildStrategicState } from './strategicState.js';
import { makeCard, makeAIContext, neutralField } from './aiTestFixtures.js';

describe('formatAIReasoningEntry', () => {
  it('produce headline e considerazioni leggibili', () => {
    const selected = {
      action: {
        card: makeCard({ id: 7, name: 'Agente X' }),
        cardId: 7,
        focus: 4,
        fieldIndex: 1,
      },
      score: 1200,
      expectedScore: 1100,
      winProbability: 0.62,
      overinvestmentPenalty: 0,
      isTerminalWin: false,
      simulation: { winner: 'enemy' },
      budget: { fairShare: 3.6, ordinaryCap: 6 },
    };
    const debug = buildAIDebugPayload({
      difficulty: 'medium',
      selected,
      candidates: [
        selected,
        {
          ...selected,
          action: {
            ...selected.action,
            card: makeCard({ id: 8, name: 'Agente Y' }),
            cardId: 8,
            focus: 3,
          },
          score: 900,
        },
      ],
      context: {
        roundNumber: 2,
        isPlayerFirst: true,
        battlefields: [neutralField, { ...neutralField, id: 2, name: 'Campo Alpha' }],
      },
      extras: { fairShare: 3.6, ordinaryCap: 6, searchDepth: 1, searchNodes: 12 },
    });

    const entry = formatAIReasoningEntry(
      {
        card: selected.action.card,
        cardId: 7,
        focus: 4,
        fieldIndex: 1,
        score: 1200,
        debug,
      },
      {
        context: {
          roundNumber: 2,
          battlefields: [neutralField, { ...neutralField, id: 2, name: 'Campo Alpha' }],
        },
        kind: 'response',
      }
    );

    expect(entry.headline).toContain('Round 2');
    expect(entry.headline).toContain('Agente X');
    expect(entry.considerations.some((c) => c.startsWith('Cosa:'))).toBe(true);
    expect(entry.considerations.some((c) => /Perché|Mette \d+ FC/i.test(c))).toBe(true);
    expect(entry.considerations.every((c) => !/fair share|nodi|score -/i.test(c))).toBe(true);
    expect(formatAIReasoningLogText([entry])).toContain('Agente X');
  });

  it('spiega perché non un’altra carta quando i candidati ci sono', () => {
    const cardA = makeCard({
      id: 7,
      name: 'Agente X',
      ability: { trigger: 'intervention', effect: 'power', value: 2 },
      description: 'Intervento: +2 POT',
    });
    const cardB = makeCard({ id: 8, name: 'Agente Y' });
    const selected = {
      action: { card: cardA, cardId: 7, focus: 4, fieldIndex: 0 },
      score: 1200,
      winProbability: 0.7,
      isTerminalWin: false,
      isTerminalLoss: false,
      simulation: { winner: 'enemy', aiAbilityTriggered: true },
      budget: { fairShare: 3, ordinaryCap: 6 },
    };
    const other = {
      action: { card: cardB, cardId: 8, focus: 3, fieldIndex: 0 },
      score: 400,
      winProbability: 0.3,
      isTerminalWin: false,
      isTerminalLoss: false,
      simulation: { winner: 'player', aiAbilityTriggered: false },
    };
    const debug = buildAIDebugPayload({
      difficulty: 'hard',
      selected,
      candidates: [selected, other],
      context: {
        roundNumber: 1,
        isPlayerFirst: true,
        battlefields: [neutralField],
        player: { visibleCard: makeCard({ id: 1, name: 'Tua Carta' }) },
      },
      extras: { fairShare: 3, ordinaryCap: 6 },
    });
    expect(debug.whyNotCards?.length).toBeGreaterThan(0);
    expect(debug.visiblePlayerCardName).toBe('Tua Carta');
    expect(debug.selectedAbility).toMatch(/Intervento/i);

    const entry = formatAIReasoningEntry(
      { card: cardA, cardId: 7, focus: 4, fieldIndex: 0, score: 1200, debug },
      { kind: 'response', context: { roundNumber: 1, battlefields: [neutralField] } }
    );
    expect(entry.considerations.some((c) => c.includes('Non Agente Y'))).toBe(true);
    expect(entry.considerations.some((c) => c.includes('Tua Carta'))).toBe(true);
  });

  it('non loda Overdrive se a pochi FC il potere non parte', () => {
    const card = makeCard({
      id: 9,
      name: 'Draghetto Famelico',
      ability: { trigger: 'overdrive', effect: 'power', value: 2 },
      description: 'Overdrive: +2 POT',
    });
    const selected = {
      action: { card, cardId: 9, focus: 1, fieldIndex: 0 },
      score: 50,
      winProbability: 0,
      isTerminalWin: false,
      isTerminalLoss: false,
      simulation: { winner: 'player', aiAbilityTriggered: false },
      budget: { fairShare: 3, ordinaryCap: 5 },
    };
    const ctx = makeAIContext({
      roundNumber: 4,
      isPlayerFirst: true,
      currentFieldIndex: 0,
      field: neutralField,
      battlefields: [neutralField],
      enemyFieldsConquered: 2,
      ai: {
        hand: [card, makeCard({ id: 10 }), makeCard({ id: 11 })],
        usedCardIds: [],
        focusPool: 2,
        focus: 2,
        hp: 14,
        armyBonuses: {},
        toxin: null,
      },
      player: {
        hand: [makeCard({ id: 1, name: 'Tua' })],
        usedCardIds: [],
        focusPool: 8,
        focus: 8,
        hp: 16,
        armyBonuses: {},
        toxin: null,
        visibleCard: makeCard({ id: 1, name: 'Carrozziere' }),
      },
    });
    const debug = buildAIDebugPayload({
      difficulty: 'hard',
      selected,
      candidates: [selected],
      context: ctx,
      extras: { fairShare: 3, ordinaryCap: 5 },
    });
    expect(debug.triggerReady).toBe(false);
    expect(debug.abilityFired).toBe(false);

    const entry = formatAIReasoningEntry(
      { card, cardId: 9, focus: 1, fieldIndex: 0, score: 50, debug },
      { kind: 'response', context: ctx }
    );
    expect(entry.considerations.some((c) => /Overdrive.*non parte/i.test(c))).toBe(true);
    expect(entry.considerations.every((c) => !/potere di Draghetto Famelico parte/i.test(c))).toBe(
      true
    );
  });

  it('descrive Conquista come premio post-vittoria, non come trigger del confronto', () => {
    const card = makeCard({
      id: 11,
      name: 'Piromante',
      ability: { trigger: 'conquest', effect: 'directDamage', value: 3 },
      description: 'Conquista: 3 Danni dir.',
    });
    const selected = {
      action: { card, cardId: 11, focus: 5, fieldIndex: 0 },
      score: 2000,
      winProbability: 0.9,
      simulation: { winner: 'enemy', aiAbilityTriggered: true },
      budget: { fairShare: 4, ordinaryCap: 6 },
    };
    const debug = buildAIDebugPayload({
      difficulty: 'medium',
      selected,
      candidates: [selected],
      context: makeAIContext({
        roundNumber: 2,
        isPlayerFirst: true,
        field: neutralField,
        battlefields: [neutralField],
        ai: {
          hand: [card],
          usedCardIds: [],
          focusPool: 10,
          focus: 10,
          hp: 18,
          armyBonuses: {},
          toxin: null,
        },
      }),
      extras: { fairShare: 4, ordinaryCap: 6 },
    });
    const entry = formatAIReasoningEntry(
      { card, cardId: 11, focus: 5, debug },
      { kind: 'response' }
    );
    expect(entry.considerations.some((c) => /dopo/i.test(c) && /Conquista/i.test(c))).toBe(true);
    expect(entry.considerations.every((c) => !/potere di Piromante parte: è uno dei motivi/i.test(c))).toBe(
      true
    );
  });
});

describe('field selection weights', () => {
  it('hard pesa denial Campo più di easy a parità di stato', () => {
    const playerThreatCard = makeCard({
      id: 101,
      name: 'Threat',
      power: 8,
      damage: 6,
      ability: { trigger: 'imboscata', effect: 'power', value: 3 },
    });
    const weakAi = makeCard({ id: 201, name: 'Filler', power: 2, damage: 1, ability: null });
    const strongAiLater = makeCard({
      id: 202,
      name: 'Combo',
      power: 7,
      damage: 5,
      ability: { trigger: 'imboscata', effect: 'power', value: 3 },
    });

    const triggerField = {
      id: 1,
      name: 'Campo Trigger Test',
      category: 'trigger',
      tema: null,
      ability: null,
    };

    const ctx = makeAIContext({
      playerFieldsConquered: 1,
      battlefields: [triggerField],
      field: triggerField,
      currentFieldIndex: 0,
      player: {
        hand: [playerThreatCard],
        usedCardIds: [],
        hp: 20,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
        visibleCard: null,
      },
      ai: {
        hand: [weakAi, strongAiLater],
        usedCardIds: [],
        hp: 20,
        focusPool: 12,
        focus: 12,
        armyBonuses: {},
        toxin: null,
      },
    });

    const state = buildStrategicState(ctx);
    const hard = evaluateFieldSelectionAdjustment(state, 0, weakAi, { id: 'hard' });
    const easy = evaluateFieldSelectionAdjustment(state, 0, weakAi, { id: 'easy' });

    expect(hard.denialScore).toBeGreaterThan(easy.denialScore);
    expect(hard.denialScore).toBeGreaterThan(500);
  });
});
