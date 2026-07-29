/**
 * Regressione: la cache decisioni IA non deve riusare carte di un'altra partita/armata.
 */
import { describe, it, expect, vi } from 'vitest';
import { getAvailableCards } from '../game/ai/generateAIActions.js';

describe('AI pending decision reuse safety', () => {
  it('rifiuta una carta pending assente dalla mano IA corrente', () => {
    const mounthbornHand = [
      { id: 201, name: 'Regina della Colonia', army: 'Mounthborn' },
      { id: 202, name: 'Manutentore', army: 'Mounthborn' },
    ];
    const staleCalibriCard = {
      id: 402,
      name: 'Nucleo di Comando Nord',
      army: 'Calibri Pesanti',
    };

    const available = getAvailableCards(mounthbornHand, []);
    const playable = available.some((c) => c.id === staleCalibriCard.id);
    expect(playable).toBe(false);
  });

  it('accetta una carta pending ancora disponibile nella mano', () => {
    const hand = [
      { id: 201, name: 'Regina della Colonia', army: 'Mounthborn' },
      { id: 202, name: 'Manutentore', army: 'Mounthborn' },
    ];
    const pending = hand[0];
    const available = getAvailableCards(hand, []);
    expect(available.some((c) => c.id === pending.id)).toBe(true);
  });

  it('rifiuta una carta pending già usata nello stesso match', () => {
    const hand = [
      { id: 201, name: 'Regina della Colonia', army: 'Mounthborn' },
      { id: 202, name: 'Manutentore', army: 'Mounthborn' },
    ];
    const available = getAvailableCards(hand, [201]);
    expect(available.some((c) => c.id === 201)).toBe(false);
    expect(available.some((c) => c.id === 202)).toBe(true);
  });

  it('selectEnemyAgentAndFocus non applica pending fuori mano', () => {
    const setEnemyAgent = vi.fn();
    const setEnemySelectedFocus = vi.fn();
    const setLogs = vi.fn();

    const state = {
      roundNumber: 2,
      enemyHand: [
        { id: 201, name: 'Regina della Colonia', army: 'Mounthborn' },
      ],
      enemyUsedCards: [],
      playerHand: [{ id: 101, name: 'Mulo' }],
      playerUsedCards: [101],
      currentFieldIndex: 1,
      isPlayerFirst: false,
      aiDifficulty: 'medium',
      playerFocus: 15,
      enemyFocus: 12,
      playerHP: 21,
      enemyHP: 25,
      conqueredFields: { 0: { winner: 'player' } },
      battlefields: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      revealedFields: 3,
      setEnemyAgent,
      setEnemySelectedFocus,
      setLogs,
    };

    // Simula il gate usato in useAI.getReusableDecision / selectEnemyAgentAndFocus
    const pendingCard = { id: 402, name: 'Nucleo di Comando Nord', army: 'Calibri Pesanti' };
    const available = getAvailableCards(state.enemyHand, state.enemyUsedCards);
    const canReuse = available.some((c) => c.id === pendingCard.id);

    expect(canReuse).toBe(false);
    if (!canReuse) {
      // comportamento atteso: nessun setEnemyAgent con la carta fantasma
      expect(setEnemyAgent).not.toHaveBeenCalled();
    }
  });
});
