// ============================================
// COLLEZIONE — stato e operazioni (funzioni pure)
// Ogni operazione restituisce una nuova collezione senza modificare
// quella ricevuta. La persistenza è in collectionStorage.js.
//
// Forma dello stato:
//   { version, coins, dust, owned: number[], starterArmy, packsOpened }
// I doppioni non si accumulano: diventano subito polvere.
// ============================================

import { ARMY_SETS } from '../data/cards.js';
import { generatePack, generateStarterPacks } from './packGenerator.js';
import {
  PACK_TYPES,
  DUST_FROM_DUPLICATE,
  CRAFT_COST,
  MATCH_REWARDS,
  CAMPAIGN_MISSION_REWARD,
} from './collectionConfig.js';

export const COLLECTION_VERSION = 1;

/** Indice id → carta (con `army`) dell'intero catalogo. */
const CARD_INDEX = (() => {
  const index = new Map();
  for (const [army, cards] of Object.entries(ARMY_SETS)) {
    for (const card of cards) index.set(card.id, { ...card, army: card.army || army });
  }
  return index;
})();

export function getCatalogCard(cardId) {
  return CARD_INDEX.get(Number(cardId)) || null;
}

export function createCollection() {
  return { version: COLLECTION_VERSION, coins: 0, dust: 0, owned: [], starterArmy: null, packsOpened: 0 };
}

/**
 * Normalizza dati caricati (salvataggio corrotto o di una versione futura
 * del catalogo): scarta carte inesistenti e valori non validi.
 */
export function sanitizeCollection(raw) {
  const base = createCollection();
  if (!raw || typeof raw !== 'object') return base;
  const nonNegativeInt = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const owned = Array.isArray(raw.owned)
    ? [...new Set(raw.owned.map(Number).filter((id) => CARD_INDEX.has(id)))].sort((a, b) => a - b)
    : [];
  return {
    ...base,
    coins: nonNegativeInt(raw.coins),
    dust: nonNegativeInt(raw.dust),
    owned,
    starterArmy: typeof raw.starterArmy === 'string' && ARMY_SETS[raw.starterArmy] ? raw.starterArmy : null,
    packsOpened: nonNegativeInt(raw.packsOpened),
  };
}

export function ownsCard(collection, cardId) {
  return collection.owned.includes(Number(cardId));
}

export function hasClaimedStarter(collection) {
  return collection.starterArmy !== null;
}

/**
 * Aggiunge carte: le nuove entrano in collezione, i doppioni diventano polvere.
 * @returns {{ collection, results: Array<{ card, duplicate: boolean, dust: number }> }}
 */
export function addCards(collection, cardIds) {
  const owned = new Set(collection.owned);
  let dust = collection.dust;
  const results = cardIds.map((id) => {
    const card = getCatalogCard(id);
    if (!card) throw new Error(`Carta sconosciuta: ${id}`);
    if (owned.has(card.id)) {
      const gained = DUST_FROM_DUPLICATE[card.league] || 0;
      dust += gained;
      return { card, duplicate: true, dust: gained };
    }
    owned.add(card.id);
    return { card, duplicate: false, dust: 0 };
  });
  return {
    collection: { ...collection, dust, owned: [...owned].sort((a, b) => a - b) },
    results,
  };
}

export function earnCoins(collection, amount) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Importo non valido: ${amount}`);
  return { ...collection, coins: collection.coins + Math.floor(amount) };
}

export function packPrice(packTypeId) {
  const type = PACK_TYPES[packTypeId];
  if (!type) throw new Error(`Tipo di bustina sconosciuto: ${packTypeId}`);
  return type.price;
}

/**
 * Compra e apre una bustina.
 * @param {{ type: 'mista'|'armata', army?: string }} request
 * @returns {{ collection, results }}
 */
export function buyPack(collection, { type, army = null }, rng) {
  const packType = PACK_TYPES[type];
  if (!packType) throw new Error(`Tipo di bustina sconosciuto: ${type}`);
  if (packType.perArmy && !ARMY_SETS[army]) throw new Error(`Armata non valida: ${army}`);
  if (collection.coins < packType.price) throw new Error('Valuta insufficiente');

  const cards = generatePack({ army: packType.perArmy ? army : null }, rng);
  const paid = { ...collection, coins: collection.coins - packType.price, packsOpened: collection.packsOpened + 1 };
  return addCards(paid, cards.map((c) => c.id));
}

/**
 * Bustine iniziali, una volta sola per collezione.
 * @returns {{ collection, packs: Array<Array<{ card, duplicate, dust }>> }}
 */
export function claimStarterPacks(collection, army, rng) {
  if (hasClaimedStarter(collection)) throw new Error('Bustine iniziali già riscattate');
  if (!ARMY_SETS[army]) throw new Error(`Armata non valida: ${army}`);

  let next = { ...collection, starterArmy: army };
  const packs = generateStarterPacks(army, rng).map((pack) => {
    const { collection: updated, results } = addCards(next, pack.map((c) => c.id));
    next = updated;
    return results;
  });
  return { collection: next, packs };
}

export function craftCost(cardId) {
  const card = getCatalogCard(cardId);
  if (!card) throw new Error(`Carta sconosciuta: ${cardId}`);
  return CRAFT_COST[card.league];
}

/** Crea con la polvere una carta non posseduta. */
export function craftCard(collection, cardId) {
  const cost = craftCost(cardId);
  if (ownsCard(collection, cardId)) throw new Error('Carta già posseduta');
  if (collection.dust < cost) throw new Error('Polvere insufficiente');
  const { collection: next } = addCards({ ...collection, dust: collection.dust - cost }, [cardId]);
  return next;
}

/** Carte di un mazzo che il giocatore non possiede. */
export function missingDeckCards(collection, cardIds) {
  return cardIds.map(Number).filter((id) => !ownsCard(collection, id));
}

export function isDeckOwned(collection, cardIds) {
  return missingDeckCards(collection, cardIds).length === 0;
}

/** @param {'ai'|'multiplayer'} mode */
export function matchReward(mode, won) {
  const table = MATCH_REWARDS[mode];
  if (!table) throw new Error(`Modalità sconosciuta: ${mode}`);
  return won ? table.win : table.loss;
}

export function campaignMissionReward() {
  return CAMPAIGN_MISSION_REWARD;
}
