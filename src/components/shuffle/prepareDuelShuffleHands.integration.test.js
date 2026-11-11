import { describe, expect, it } from 'vitest';
import { computeShuffleDealFromSets } from './prepareDuelShuffleHands.js';
import { getDealtHandIndices } from './cardShuffleDealLayout.js';
import { ARMY_DECKS, ARMY_SETS } from '../../data/cards.js';

const deckOf = (army) => ARMY_DECKS[army].A.cards.map((id) => ({ ...ARMY_SETS[army].find((c) => c.id === id), army }));

describe('distribuzione con mani fisse (torneo, campagna)', () => {
  it('serve le carte nello stesso ordine in cui restano in mano', () => {
    const playerSet = deckOf('Kethran');
    const enemySet = deckOf('Orathai');
    // mani in un ordine diverso da quello del mazzo
    const playerHand = [7, 2, 9, 0, 4].map((i) => playerSet[i]);
    const enemyHand = [5, 8, 1, 6, 3].map((i) => enemySet[i]);
    const deal = computeShuffleDealFromSets(playerSet, enemySet, 'Kethran', 'Orathai', { playerHand, enemyHand });
    expect(deal.playerHand.map((c) => c.id)).toEqual(playerHand.map((c) => c.id));
    expect(getDealtHandIndices(deal.playerFinalOrder).map((i) => playerSet[i].id)).toEqual(playerHand.map((c) => c.id));
    expect(getDealtHandIndices(deal.enemyFinalOrder).map((i) => enemySet[i].id)).toEqual(enemyHand.map((c) => c.id));
    expect([...deal.playerFinalOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect([...deal.enemyFinalOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
