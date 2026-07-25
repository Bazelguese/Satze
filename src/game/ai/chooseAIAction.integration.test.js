/**
 * Test di integrazione del motore IA (usa computeDuelResolution via Vite/Vitest).
 */
import { describe, it, expect } from 'vitest';
import { chooseAIAction, chooseWhenAIResponds } from './chooseAIAction.js';
import { simulateAIDuel } from './simulateAIDuel.js';
import { getAIProfile } from './aiProfiles.js';
import { createConstantRng, createSequenceRng } from './aiConstants.js';
import { makeAIContext, makeCard, neutralField } from './aiTestFixtures.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';

describe('chooseAIAction (integrazione)', () => {
  it('risposta: Difficile sceglie letale disponibile', () => {
    const killer = makeCard({ id: 300, name: 'Killer', power: 8, damage: 10, league: 3 });
    const weak = makeCard({ id: 301, name: 'Weak', power: 1, damage: 1, league: 1 });
    const player = makeCard({ id: 100, name: 'Prey', power: 1, damage: 1, league: 1 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 1,
        hp: 8,
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
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    expect(decision.cardId).toBe(killer.id);
    const sim = simulateAIDuel(context, decision, { card: player, focus: 1 });
    expect(sim.playerHpAfter).toBeLessThanOrEqual(0);
  });

  it('risposta: Normale sceglie letale disponibile', () => {
    const killer = makeCard({ id: 310, name: 'Killer', power: 8, damage: 10, league: 3 });
    const weak = makeCard({ id: 311, name: 'Weak', power: 1, damage: 1, league: 1 });
    const player = makeCard({ id: 110, name: 'Prey', power: 1, damage: 1, league: 1 });

    const context = makeAIContext({
      difficulty: 'medium',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 1,
        hp: 8,
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
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'medium', { rng: createConstantRng(0) });
    expect(decision.cardId).toBe(killer.id);
  });

  it('risposta: Facile non ignora letale sicuro', () => {
    const killer = makeCard({ id: 320, name: 'Killer', power: 8, damage: 10, league: 3 });
    const weak = makeCard({ id: 321, name: 'Weak', power: 1, damage: 1, league: 1 });
    const player = makeCard({ id: 120, name: 'Prey', power: 1, damage: 1, league: 1 });

    const context = makeAIContext({
      difficulty: 'easy',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 1,
        hp: 8,
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
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    for (const seed of [0, 0.2, 0.5, 0.9]) {
      const decision = chooseAIAction(context, 'easy', { rng: createConstantRng(seed) });
      expect(decision.cardId, `seed ${seed}`).toBe(killer.id);
    }
  });

  it('risposta: Difficile sceglie minimo Focus equivalente', () => {
    const aiCard = makeCard({ id: 400, name: 'Stable', power: 5, damage: 3, league: 2 });
    const player = makeCard({ id: 130, name: 'Soft', power: 1, damage: 1, league: 1 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 1,
        hp: 20,
        focus: 6,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [aiCard],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    expect(decision.cardId).toBe(aiCard.id);

    const sim = simulateAIDuel(context, decision, { card: player, focus: 1 });
    const plus = {
      card: aiCard,
      cardId: aiCard.id,
      focus: decision.focus + 1,
      fieldIndex: 0,
    };
    if (plus.focus <= 8) {
      const simPlus = simulateAIDuel(context, plus, { card: player, focus: 1 });
      expect(sim.winner).toBe(simPlus.winner);
      expect(sim.playerHpAfter).toBe(simPlus.playerHpAfter);
      expect(sim.aiHpAfter).toBe(simPlus.aiHpAfter);
    }
  });

  it('risposta: Overdrive — investe se migliora il confronto', () => {
    const overdriveCard = makeCard({
      id: 500,
      name: 'Over',
      power: 3,
      damage: 2,
      league: 2,
      ability: { trigger: 'overdrive', effect: 'power', value: 4 },
    });
    // VA giocatore 5×3=15; senza OD l'IA a 4 FC fa 12 e perde, a 5 FC attiva OD e vince.
    const player = makeCard({ id: 140, name: 'Mid', power: 5, damage: 2, league: 3 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 3,
        hp: 20,
        focus: 8,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [overdriveCard],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    expect(decision.focus).toBeGreaterThanOrEqual(5);
    const sim = simulateAIDuel(context, decision, { card: player, focus: 3 });
    expect(sim.winner).toBe('enemy');
    expect(sim.aiAbilityTriggered).toBe(true);
  });

  it('risposta: Difficile deterministica a parità di RNG/stato', () => {
    const context = makeAIContext({ difficulty: 'hard' });
    const a = chooseAIAction(context, 'hard', { rng: createConstantRng(0.42) });
    const b = chooseAIAction(context, 'hard', { rng: createConstantRng(0.42) });
    expect(a.cardId).toBe(b.cardId);
    expect(a.focus).toBe(b.focus);
  });

  it('apertura: imboscata valutata via simulazione reale', () => {
    const ambush = makeCard({
      id: 600,
      name: 'Ambush',
      power: 3,
      damage: 2,
      league: 2,
      ability: { trigger: 'imboscata', effect: 'power', value: 3 },
    });
    const player = makeCard({ id: 150, name: 'Answer', power: 3, damage: 2, league: 2 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: false,
      player: {
        selectedCard: null,
        selectedFocus: null,
        hp: 20,
        focus: 8,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [ambush],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    const sim = simulateAIDuel(context, decision, { card: player, focus: decision.focus });
    expect(typeof sim.aiAbilityTriggered).toBe('boolean');
  });

  it('risposta: intervention quando IA seconda', () => {
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
        selectedCard: player,
        selectedFocus: 2,
        hp: 20,
        focus: 8,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [interv],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const profile = getAIProfile('hard');
    const decision = chooseWhenAIResponds(context, profile, { rng: createConstantRng(0) });
    const sim = simulateAIDuel(context, decision, { card: player, focus: 2 });
    expect(sim.aiAbilityTriggered).toBe(true);
  });

  it('simulazione: usa il motore reale su Campo di gioco', () => {
    const odField = ALL_BATTLEFIELDS.find((f) => f.id === 74) || neutralField;
    const card = makeCard({
      id: 700,
      name: 'OD',
      power: 2,
      damage: 2,
      league: 2,
      ability: { trigger: 'overdrive', effect: 'damage', value: 2 },
    });
    const player = makeCard({ id: 170, name: 'P', power: 2, damage: 1, league: 1 });

    const context = makeAIContext({
      field: odField,
      battlefields: [odField],
      player: {
        selectedCard: player,
        selectedFocus: 2,
        hp: 20,
        focus: 8,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [card],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const at3 = simulateAIDuel(
      context,
      { card, cardId: card.id, focus: 3, fieldIndex: 0 },
      { card: player, focus: 2 }
    );
    const at5 = simulateAIDuel(
      context,
      { card, cardId: card.id, focus: 5, fieldIndex: 0 },
      { card: player, focus: 2 }
    );

    expect(at3.battleResult).toBeTruthy();
    expect(at5.battleResult).toBeTruthy();
  });

  it('apertura: Difficile evita carta facilmente punibile', () => {
    const glass = makeCard({ id: 800, name: 'Glass', power: 2, damage: 1, league: 1 });
    const solid = makeCard({ id: 801, name: 'Solid', power: 8, damage: 3, league: 3 });
    const punisher = makeCard({ id: 180, name: 'Punisher', power: 5, damage: 8, league: 3 });

    const context = makeAIContext({
      difficulty: 'hard',
      isPlayerFirst: false,
      player: {
        selectedCard: null,
        selectedFocus: null,
        hp: 20,
        focus: 8,
        hand: [punisher],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [glass, solid],
        usedCardIds: [],
        // Glass perde sempre e muore (DAN 8); Solid può superare VA 5×8 con 8×6.
        hp: 6,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'hard', { rng: createConstantRng(0) });
    expect(decision).toBeTruthy();
    expect(decision.cardId).toBe(solid.id);
    const worstPlayer = { card: punisher, focus: 8 };
    const sim = simulateAIDuel(context, decision, worstPlayer);
    expect(sim.terminalStatus).not.toBe('ai_loss_hp');
  });

  it('profili: Facile restituisce mossa legale anche con seed alto', () => {
    const aiCard = makeCard({ id: 900, name: 'Only', power: 5, damage: 3, league: 2 });
    const player = makeCard({ id: 190, name: 'Soft', power: 1, damage: 1, league: 1 });
    const context = makeAIContext({
      difficulty: 'easy',
      isPlayerFirst: true,
      player: {
        selectedCard: player,
        selectedFocus: 1,
        hp: 20,
        focus: 6,
        hand: [player],
        usedCardIds: [],
        armyBonuses: {},
        toxin: null,
      },
      ai: {
        hand: [aiCard],
        usedCardIds: [],
        hp: 20,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });

    const decision = chooseAIAction(context, 'easy', {
      rng: createSequenceRng([0.99, 0.99, 0.99]),
    });
    expect(decision).toBeTruthy();
    expect(decision.focus).toBeGreaterThanOrEqual(1);
    expect(decision.focus).toBeLessThanOrEqual(8);
  });
});
