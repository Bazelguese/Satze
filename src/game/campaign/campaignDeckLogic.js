// Regole mazzo campagna: Lega 30, max 10 carte, protagonista bloccato.

import { ARMY_SETS } from '../../data/cards.js';
import { CAMPAIGN_FIGLI_PROTAGONIST_ID } from '../../data/campaignFigliDeck.js';

/**
 * @param {number} cardId
 * @param {string} army
 */
export function getCampaignCard(cardId, army) {
  const set = ARMY_SETS[army];
  if (!set) return null;
  return set.find((c) => c.id === cardId) ?? null;
}

/**
 * @param {number} cardId
 * @returns {{ card: Object, army: string } | null}
 */
export function findCardByIdAnyArmy(cardId) {
  for (const army of Object.keys(ARMY_SETS)) {
    const c = getCampaignCard(cardId, army);
    if (c) return { card: c, army };
  }
  return null;
}

/**
 * @param {number[]} cardIds
 * @param {string} army
 */
export function totalLeagueForCampaignDeck(cardIds, army) {
  return cardIds.reduce((sum, id) => sum + (getCampaignCard(id, army)?.league ?? 0), 0);
}

/**
 * Scambio magazzino ↔ deck: con `removeFromDeckId` si sostituisce una carta del deck.
 * Senza rimozione: solo se deck &lt; 10 e Lega ≤ 30.
 * @param {number[]} deckIds
 * @param {number[]} warehouseIds
 * @param {number} fromWarehouseId
 * @param {number|null|undefined} removeFromDeckId
 * @param {string} army
 * @param {number} protagonistId
 */
export function swapCampaignDeckCard(
  deckIds,
  warehouseIds,
  fromWarehouseId,
  removeFromDeckId,
  army,
  protagonistId = CAMPAIGN_FIGLI_PROTAGONIST_ID
) {
  const deck = [...deckIds];
  const wh = [...warehouseIds];
  if (!wh.includes(fromWarehouseId)) return { deck: deckIds, warehouse: warehouseIds, error: 'non_in_magazzino' };
  if (deck.includes(fromWarehouseId)) return { deck: deckIds, warehouse: warehouseIds, error: 'gia_in_deck' };

  const addCard = getCampaignCard(fromWarehouseId, army);
  if (!addCard) return { deck: deckIds, warehouse: warehouseIds, error: 'carta_sconosciuta' };

  if (removeFromDeckId != null) {
    if (!deck.includes(removeFromDeckId)) return { deck: deckIds, warehouse: warehouseIds, error: 'rimozione_invalida' };
    if (removeFromDeckId === protagonistId) return { deck: deckIds, warehouse: warehouseIds, error: 'protagonista_bloccato' };

    const nextDeck = deck.filter((id) => id !== removeFromDeckId);
    const leagueAfter = totalLeagueForCampaignDeck([...nextDeck, fromWarehouseId], army);
    if (leagueAfter > 30) return { deck: deckIds, warehouse: warehouseIds, error: 'lega_30' };

    const nextWh = [...wh.filter((id) => id !== fromWarehouseId), removeFromDeckId];
    return {
      deck: [...nextDeck, fromWarehouseId],
      warehouse: nextWh,
      error: null,
    };
  }

  if (deck.length >= 10) return { deck: deckIds, warehouse: warehouseIds, error: 'serve_scambio' };
  const leagueAfter = totalLeagueForCampaignDeck([...deck, fromWarehouseId], army);
  if (leagueAfter > 30) return { deck: deckIds, warehouse: warehouseIds, error: 'lega_30' };

  return {
    deck: [...deck, fromWarehouseId],
    warehouse: wh.filter((id) => id !== fromWarehouseId),
    error: null,
  };
}

/**
 * @param {number[]} deckIds
 * @param {number[]} warehouseIds
 * @param {number} cardId
 * @param {number} protagonistId
 */
export function moveCardToWarehouse(deckIds, warehouseIds, cardId, protagonistId = CAMPAIGN_FIGLI_PROTAGONIST_ID) {
  if (cardId === protagonistId) return { deck: deckIds, warehouse: warehouseIds, error: 'protagonista_bloccato' };
  if (!deckIds.includes(cardId)) return { deck: deckIds, warehouse: warehouseIds, error: 'non_in_deck' };
  const deck = deckIds.filter((id) => id !== cardId);
  const wh = warehouseIds.includes(cardId) ? [...warehouseIds] : [...warehouseIds, cardId];
  return { deck, warehouse: wh, error: null };
}
