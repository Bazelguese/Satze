// ============================================
// COLLEZIONE — servizio usato dall'interfaccia
// Oggi (opzione A) tutto gira in locale e si salva in localStorage.
// Per passare all'opzione B (collezione sul server) basterà fornire un
// servizio con la stessa interfaccia asincrona che chiama il server:
// l'interfaccia non deve sapere dove vivono i dati.
// ============================================

import {
  createCollection,
  sanitizeCollection,
  buyPack,
  buyOffer,
  claimStarterPacks,
  craftCard,
  setEquippedSkin,
  earnCoins,
  matchReward,
  campaignMissionReward,
} from './collectionState.js';

export const COLLECTION_STORAGE_KEY = 'satze_collection_v1';

/** Giorno locale nel formato YYYY-MM-DD (per la bustina del giorno). */
export function localDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * @param {{ storage?: Storage, rng?: () => number, key?: string,
 *           skinCatalog?: Map<number,string>, today?: () => string }} [opts]
 */
export function createLocalCollectionService({
  storage = globalThis.localStorage,
  rng = Math.random,
  key = COLLECTION_STORAGE_KEY,
  skinCatalog = new Map(),
  today = () => localDay(),
} = {}) {
  const load = () => {
    if (!storage) return createCollection();
    try {
      const raw = storage.getItem(key);
      return raw ? sanitizeCollection(JSON.parse(raw), skinCatalog) : createCollection();
    } catch (e) {
      console.error('Errore caricamento collezione:', e);
      return createCollection();
    }
  };

  const save = (collection) => {
    if (storage) storage.setItem(key, JSON.stringify(collection));
    return collection;
  };

  return {
    today,
    async getCollection() {
      return load();
    },
    async claimStarterPacks(army) {
      const { collection, packs } = claimStarterPacks(load(), army, rng);
      return { collection: save(collection), packs };
    },
    /** @param {{ type: string, army?: string, trigger?: string }} request */
    async buyPack(request) {
      const { collection, results } = buyPack(load(), request, rng, skinCatalog);
      return { collection: save(collection), results };
    },
    async buyOffer(offerId, params = {}) {
      const { collection, packs } = buyOffer(load(), offerId, rng, { skinCatalog, today: today(), params });
      return { collection: save(collection), packs };
    },
    async craftCard(cardId) {
      return save(craftCard(load(), cardId));
    },
    async setEquippedSkin(cardId, skin) {
      return save(setEquippedSkin(load(), cardId, skin));
    },
    /** @param {'ai'|'multiplayer'} mode */
    async rewardMatch(mode, won) {
      const amount = matchReward(mode, won);
      return { collection: save(earnCoins(load(), amount)), amount };
    },
    async rewardCampaignMission() {
      const amount = campaignMissionReward();
      return { collection: save(earnCoins(load(), amount)), amount };
    },
  };
}
