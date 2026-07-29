import { describe, it, expect } from 'vitest';
import { resolveTerminalStatus, simulateAIDuel } from './simulateAIDuel.js';
import { makeAIContext, makeCard, neutralField } from './aiTestFixtures.js';

describe('simulateAIDuel + tossina a fine turno', () => {
  it('supremazia: a parità PV spareggio campi (IA 3 vs TU 2)', () => {
    expect(
      resolveTerminalStatus(
        { roundNumber: 5, mode: 'classic' },
        {
          winner: 'player',
          aiHpAfter: 11,
          playerHpAfter: 11,
          aiFieldsAfter: 3,
          playerFieldsAfter: 2,
          aiCardsRemaining: 0,
          playerCardsRemaining: 0,
        }
      )
    ).toBe('ai_win_cards');
  });

  it('applica tossina attiva ai PV dopo il duello', () => {
    const playerCard = makeCard({ id: 100, power: 5, damage: 1, league: 3 });
    const aiCard = makeCard({ id: 200, power: 1, damage: 1, league: 2 });
    const ctx = makeAIContext({
      roundNumber: 5,
      field: neutralField,
      battlefields: [neutralField],
      player: {
        hand: [playerCard],
        usedCardIds: [],
        hp: 14,
        focusPool: 1,
        toxin: { value: 3, minHealth: 1, source: 'Ratti della Megera' },
        visibleCard: playerCard,
      },
      ai: {
        hand: [aiCard],
        usedCardIds: [],
        hp: 11,
        focusPool: 1,
        toxin: null,
      },
    });

    const sim = simulateAIDuel(
      ctx,
      { card: aiCard, focus: 1 },
      { card: playerCard, focus: 1 }
    );

    const expected = Math.max(1, sim.battleResult.finalPlayerHP - 3);
    expect(sim.playerHpAfter).toBe(expected);
    expect(sim.playerHpAfter).not.toBe(sim.battleResult.finalPlayerHP);
  });
});
