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
  claimStarterPacks,
  craftCard,
  earnCoins,
  matchReward,
  campaignMissionReward,
} from './collectionState.js';

export const COLLECTION_STORAGE_KEY = 'satze_collection_v1';

/**
 * @param {{ storage?: Storage, rng?: () => number, key?: string }} [opts]
 */
export function createLocalCollectionService({
  storage = globalThis.localStorage,
  rng = Math.random,
  key = COLLECTION_STORAGE_KEY,
} = {}) {
  const load = () => {
    if (!storage) return createCollection();
    try {
      const raw = storage.getItem(key);
      return raw ? sanitizeCollection(JSON.parse(raw)) : createCollection();
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
    async getCollection() {
      return load();
    },
    async claimStarterPacks(army) {
      const { collection, packs } = claimStarterPacks(load(), army, rng);
      return { collection: save(collection), packs };
    },
    async buyPack(request) {
      const { collection, results } = buyPack(load(), request, rng);
      return { collection: save(collection), results };
    },
    async craftCard(cardId) {
      return save(craftCard(load(), cardId));
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
