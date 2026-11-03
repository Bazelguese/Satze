// ============================================================
// Preparazione dei posti IA aggiuntivi (armata, mazzo, mano)
// ============================================================

import { ARMY_DECKS, ARMY_SETS } from '../../data/index.js';
import { dealHand } from './multiSeatCore.js';

/** Carte di un mazzo precostruito, risolte su tutte le armate (come nel duello base). */
export function resolveDeckCards(army, deckKey) {
  const ids = ARMY_DECKS[army]?.[deckKey]?.cards || [];
  const armies = Object.keys(ARMY_SETS);
  return ids
    .map((id) => {
      for (const name of armies) {
        const card = ARMY_SETS[name].find((c) => c.id === id);
        if (card) return { ...card, army: card.army || name };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Armata e mazzo casuali per un posto IA, evitando le armate già al tavolo.
 * @param {string[]} takenArmies
 * @param {() => number} rng
 */
export function pickAiArmyDeck(takenArmies, rng) {
  const armies = Object.keys(ARMY_DECKS);
  const free = armies.filter((a) => !takenArmies.includes(a));
  const pool = free.length > 0 ? free : armies;
  const army = pool[Math.floor(rng() * pool.length)];
  const keys = Object.keys(ARMY_DECKS[army]);
  const deckKey = keys[Math.floor(rng() * keys.length)];
  const deckCards = resolveDeckCards(army, deckKey);
  return { army, deckKey, deckCards, hand: dealHand(deckCards, rng) };
}

/** Nome mostrato di un'armata (prima parola significativa in maiuscolo per l'HUD). */
export function armyShortName(army) {
  return String(army || '').replace(/^(L'|La |Il |I |Gli |Le )/i, '');
}
