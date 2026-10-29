// ============================================
// COLLEZIONE — stato e operazioni (funzioni pure)
// Ogni operazione restituisce una nuova collezione senza modificare
// quella ricevuta. La persistenza è in collectionService.js.
//
// Forma dello stato:
//   { version, coins, dust, owned: number[],
//     skins: { [cardId]: string[] },     skin sbloccate oltre alla standard
//     equipped: { [cardId]: string },    faccia scelta per la partita
//     starterArmy, packsOpened, lastFreePackDay }
// I doppioni non si accumulano: diventano subito polvere. Una skin nuova
// su una carta già posseduta si sblocca a parte e non è un doppione.
// ============================================

import { ARMY_SETS } from '../data/cards.js';
import { generatePack, generateStarterPacks, cardPool } from './packGenerator.js';
import {
  PACK_TYPES,
  OFFERS,
  SKINS,
  DUST_FROM_DUPLICATE,
  CRAFT_COST,
  MATCH_REWARDS,
  CAMPAIGN_MISSION_REWARD,
} from './collectionConfig.js';

export const COLLECTION_VERSION = 2;

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
  return {
    version: COLLECTION_VERSION, coins: 0, dust: 0, owned: [], skins: {}, equipped: {},
    starterArmy: null, packsOpened: 0, lastFreePackDay: null,
  };
}

/** Skin che una carta può avere (la standard sempre, Eldritch/Arcana solo se esiste la faccia). */
export function skinsForCard(cardId, skinCatalog = new Map()) {
  const alt = skinCatalog.get(Number(cardId));
  return ['standard', 'foil', ...(alt ? [alt] : [])];
}

/**
 * Normalizza dati caricati (salvataggio corrotto, vecchia versione o catalogo
 * cambiato): scarta carte inesistenti, skin non valide e valori non validi.
 * @param {Map<number,string>} [skinCatalog] - se passato, valida anche Eldritch/Arcana
 */
export function sanitizeCollection(raw, skinCatalog = null) {
  const base = createCollection();
  if (!raw || typeof raw !== 'object') return base;
  const nonNegativeInt = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const owned = Array.isArray(raw.owned)
    ? [...new Set(raw.owned.map(Number).filter((id) => CARD_INDEX.has(id)))].sort((a, b) => a - b)
    : [];
  const ownedSet = new Set(owned);
  const allowed = (id, skin) =>
    skin !== 'standard' && Boolean(SKINS[skin]) &&
    (!skinCatalog || skinsForCard(id, skinCatalog).includes(skin));

  const skins = {};
  if (raw.skins && typeof raw.skins === 'object') {
    for (const [key, list] of Object.entries(raw.skins)) {
      const id = Number(key);
      if (!ownedSet.has(id) || !Array.isArray(list)) continue;
      const valid = [...new Set(list)].filter((s) => allowed(id, s));
      if (valid.length) skins[id] = valid;
    }
  }
  const equipped = {};
  if (raw.equipped && typeof raw.equipped === 'object') {
    for (const [key, skin] of Object.entries(raw.equipped)) {
      const id = Number(key);
      if (skins[id]?.includes(skin)) equipped[id] = skin;
    }
  }
  return {
    ...base,
    coins: nonNegativeInt(raw.coins),
    dust: nonNegativeInt(raw.dust),
    owned,
    skins,
    equipped,
    starterArmy: typeof raw.starterArmy === 'string' && ARMY_SETS[raw.starterArmy] ? raw.starterArmy : null,
    packsOpened: nonNegativeInt(raw.packsOpened),
    lastFreePackDay: typeof raw.lastFreePackDay === 'string' ? raw.lastFreePackDay : null,
  };
}

export function ownsCard(collection, cardId) {
  return collection.owned.includes(Number(cardId));
}

/** Skin possedute per una carta, standard compresa (vuoto se la carta non è posseduta). */
export function ownedSkins(collection, cardId) {
  if (!ownsCard(collection, cardId)) return [];
  return ['standard', ...(collection.skins[Number(cardId)] || [])];
}

/** Faccia da usare in partita per una carta. */
export function equippedSkin(collection, cardId) {
  return collection.equipped[Number(cardId)] || 'standard';
}

export function hasClaimedStarter(collection) {
  return collection.starterArmy !== null;
}

/**
 * Aggiunge carte estratte o create.
 * - carta nuova → entra in collezione (con la sua skin, se non standard);
 * - carta posseduta con skin nuova → si sblocca solo la skin;
 * - altrimenti è un doppione → polvere.
 * @param {Array<number|{ id: number, skin?: string }>} drops
 * @returns {{ collection, results: Array<{ card, skin, newCard, newSkin, duplicate, dust }> }}
 */
export function addCards(collection, drops) {
  const owned = new Set(collection.owned);
  const skins = { ...collection.skins };
  let dust = collection.dust;
  const results = drops.map((drop) => {
    const { id, skin = 'standard' } = typeof drop === 'object' ? drop : { id: drop };
    const card = getCatalogCard(id);
    if (!card) throw new Error(`Carta sconosciuta: ${id}`);
    if (!SKINS[skin]) throw new Error(`Skin sconosciuta: ${skin}`);

    const newCard = !owned.has(card.id);
    const cardSkins = skins[card.id] || [];
    const newSkin = skin !== 'standard' && !cardSkins.includes(skin);
    owned.add(card.id);
    if (newSkin) skins[card.id] = [...cardSkins, skin];

    const duplicate = !newCard && !newSkin;
    const gained = duplicate ? DUST_FROM_DUPLICATE[card.league] || 0 : 0;
    dust += gained;
    return { card, skin, newCard, newSkin, duplicate, dust: gained };
  });
  return {
    collection: { ...collection, dust, owned: [...owned].sort((a, b) => a - b), skins },
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

function assertPackParams(type, { army, trigger } = {}) {
  const def = PACK_TYPES[type];
  if (!def) throw new Error(`Tipo di bustina sconosciuto: ${type}`);
  if (def.param === 'army' && !ARMY_SETS[army]) throw new Error(`Armata non valida: ${army}`);
  if (def.param === 'trigger' && !cardPool({ trigger }).length) throw new Error(`Potere non valido: ${trigger}`);
}

/** Apre `count` bustine già pagate. */
function openPacks(collection, type, params, count, rng, skinCatalog) {
  let next = { ...collection, packsOpened: collection.packsOpened + count };
  const packs = [];
  for (let i = 0; i < count; i++) {
    const cards = generatePack(type, params, rng, skinCatalog);
    const { collection: updated, results } = addCards(next, cards.map((c) => ({ id: c.id, skin: c.skin })));
    next = updated;
    packs.push(results);
  }
  return { collection: next, packs };
}

/**
 * Compra e apre una bustina.
 * @param {{ type: string, army?: string, trigger?: string }} request
 * @returns {{ collection, results }}
 */
export function buyPack(collection, { type, ...params }, rng, skinCatalog = new Map()) {
  assertPackParams(type, params);
  const price = PACK_TYPES[type].price;
  if (collection.coins < price) throw new Error('Valuta insufficiente');
  const paid = { ...collection, coins: collection.coins - price };
  const { collection: next, packs } = openPacks(paid, type, params, 1, rng, skinCatalog);
  return { collection: next, results: packs[0] };
}

/** La bustina del giorno è ancora disponibile? `today` nel formato YYYY-MM-DD. */
export function canClaimDaily(collection, today) {
  return collection.lastFreePackDay !== today;
}

/**
 * Riscatta un'offerta (più bustine o la bustina del giorno).
 * @returns {{ collection, packs: Array<Array<result>> }}
 */
export function buyOffer(collection, offerId, rng, { skinCatalog = new Map(), today = null, params = {} } = {}) {
  const offer = OFFERS[offerId];
  if (!offer) throw new Error(`Offerta sconosciuta: ${offerId}`);
  assertPackParams(offer.packType, params);
  if (offer.daily) {
    if (!today) throw new Error('Data mancante per la bustina del giorno');
    if (!canClaimDaily(collection, today)) throw new Error('Bustina del giorno già riscattata');
  }
  if (collection.coins < offer.price) throw new Error('Valuta insufficiente');
  const paid = {
    ...collection,
    coins: collection.coins - offer.price,
    ...(offer.daily ? { lastFreePackDay: today } : {}),
  };
  return openPacks(paid, offer.packType, params, offer.count, rng, skinCatalog);
}

/**
 * Bustine iniziali, una volta sola per collezione.
 * @returns {{ collection, packs: Array<Array<result>> }}
 */
export function claimStarterPacks(collection, army, rng) {
  if (hasClaimedStarter(collection)) throw new Error('Bustine iniziali già riscattate');
  if (!ARMY_SETS[army]) throw new Error(`Armata non valida: ${army}`);

  let next = { ...collection, starterArmy: army };
  const packs = generateStarterPacks(army, rng).map((pack) => {
    const { collection: updated, results } = addCards(next, pack.map((c) => ({ id: c.id, skin: c.skin })));
    next = updated;
    return results;
  });
  return { collection: next, packs };
}

/** Sceglie la faccia da usare in partita per una carta posseduta. */
export function setEquippedSkin(collection, cardId, skin) {
  const id = Number(cardId);
  if (!ownedSkins(collection, id).includes(skin)) throw new Error('Skin non posseduta');
  const equipped = { ...collection.equipped };
  if (skin === 'standard') delete equipped[id];
  else equipped[id] = skin;
  return { ...collection, equipped };
}

export function craftCost(cardId) {
  const card = getCatalogCard(cardId);
  if (!card) throw new Error(`Carta sconosciuta: ${cardId}`);
  return CRAFT_COST[card.league];
}

/** Crea con la polvere una carta non posseduta (faccia standard). */
export function craftCard(collection, cardId) {
  const cost = craftCost(cardId);
  if (ownsCard(collection, cardId)) throw new Error('Carta già posseduta');
  if (collection.dust < cost) throw new Error('Polvere insufficiente');
  const { collection: next } = addCards({ ...collection, dust: collection.dust - cost }, [Number(cardId)]);
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
