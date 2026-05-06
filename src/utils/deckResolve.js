/**
 * Risolve army + deckKey in array di carte complete (stessa logica di useGameFlow.startGame).
 */
import { ARMY_SETS, ARMY_DECKS } from '../data';
import { loadCustomDeck } from './deckManager';

const armyNames = () => Object.keys(ARMY_SETS);
const resolveCardIdsAcrossArmies = (cardIds, fallbackArmy = null) =>
  (Array.isArray(cardIds) ? cardIds : [])
    .map((cardId) => {
      for (const army of armyNames()) {
        const card = ARMY_SETS[army].find((c) => c.id === cardId);
        if (card) return { ...card, army: card.army || army };
      }
      return null;
    })
    .filter(Boolean)
    .map((card) => ({ ...card, army: card.army || fallbackArmy }));

export function resolveDeckCardsForArmy(selectedArmy, selectedDeckKey) {
  if (Array.isArray(selectedDeckKey)) {
    return resolveCardIdsAcrossArmies(selectedDeckKey, selectedArmy);
  }
  if (typeof selectedDeckKey === 'string' && selectedDeckKey.startsWith('custom_')) {
    const customDeckId = selectedDeckKey.replace('custom_', '');
    const customDeck = loadCustomDeck(customDeckId);
    if (!customDeck?.cards?.length) return [];
    return resolveCardIdsAcrossArmies(customDeck.cards, selectedArmy);
  }
  const playerDeck = ARMY_DECKS[selectedArmy]?.[selectedDeckKey];
  if (!playerDeck) return [];
  return resolveCardIdsAcrossArmies(playerDeck.cards, selectedArmy);
}
