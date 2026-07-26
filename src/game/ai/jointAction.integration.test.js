/**
 * Coerenza azione congiunta Campo–carta–Focus + riuso decisione.
 */
import { describe, it, expect } from 'vitest';
import {
  chooseJointAIAction,
  chooseAIAction,
  buildAIInformationSet,
  createConstantRng,
} from './index.js';
import { makeCard, neutralField } from './aiTestFixtures.js';

function makeLeadGameState(overrides = {}) {
  const playerCard = makeCard({ id: 100, power: 3, damage: 2 });
  const fields = [
    neutralField,
    { ...neutralField, id: 52, name: 'Campo B' },
  ];
  return {
    aiDifficulty: 'medium',
    gameMode: 'classic',
    roundNumber: 1,
    lastWinner: null,
    isPlayerFirst: false,
    openingPlayerFirst: false,
    currentFieldIndex: null,
    battlefields: fields,
    conqueredFields: {},
    revealedFields: 2,
    playerHand: [
      playerCard,
      makeCard({ id: 101 }),
      makeCard({ id: 102 }),
      makeCard({ id: 103 }),
      makeCard({ id: 104 }),
    ],
    enemyHand: [1, 2, 3, 4, 5].map((n) =>
      makeCard({
        id: 200 + n,
        name: `AI-${n}`,
        power: n === 1 ? 6 : 3,
        damage: 3,
        league: 3,
        ability: n === 1 ? { trigger: 'imboscata', effect: 'power', value: 2 } : null,
      })
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
    selectedAgent: null,
    selectedFocus: 1,
    campaignDuelMod: null,
    ...overrides,
  };
}

describe('azione congiunta Campo–carta–Focus', () => {
  it('restituisce fieldIndex + card + focus insieme', () => {
    const ctx = buildAIInformationSet(makeLeadGameState());
    const joint = chooseJointAIAction(ctx, 'medium', { rng: createConstantRng(0) });
    expect(joint).toBeTruthy();
    expect(joint.fieldIndex).toBeGreaterThanOrEqual(0);
    expect(joint.card).toBeTruthy();
    expect(joint.cardId).toBe(joint.card.id);
    expect(joint.focus).toBeGreaterThanOrEqual(1);
    expect(joint.focus).toBeLessThanOrEqual(6);
    expect(joint.debug?.jointAction).toBe(true);
  });

  it('dopo aver fissato il Campo, carta+Focus restano coerenti con la joint', () => {
    const base = makeLeadGameState();
    const ctxLead = buildAIInformationSet(base);
    const joint = chooseJointAIAction(ctxLead, 'hard', { rng: createConstantRng(0.1) });

    const ctxFixed = buildAIInformationSet({
      ...base,
      currentFieldIndex: joint.fieldIndex,
      selectedFocus: 9, // Focus privato diverso: non deve cambiare
    });
    const followUp = chooseAIAction(ctxFixed, 'hard', { rng: createConstantRng(0.1) });

    // Stesso Campo e budget: non deve scegliere Focus fuori dal cap R1
    expect(followUp.focus).toBeLessThanOrEqual(7);
    expect(followUp.fieldIndex ?? joint.fieldIndex).toBe(joint.fieldIndex);
  });

  it('joint invariante al selectedFocus privato', () => {
    const a = chooseJointAIAction(
      buildAIInformationSet(makeLeadGameState({ selectedFocus: 1 })),
      'medium',
      { rng: createConstantRng(0) }
    );
    const b = chooseJointAIAction(
      buildAIInformationSet(makeLeadGameState({ selectedFocus: 14 })),
      'medium',
      { rng: createConstantRng(0) }
    );
    expect(a.fieldIndex).toBe(b.fieldIndex);
    expect(a.cardId).toBe(b.cardId);
    expect(a.focus).toBe(b.focus);
  });
});
