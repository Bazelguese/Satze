import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_CAMPAIGN_KEY,
  campaignSlotStorageKey,
  clampCampaignSlotIndex,
  migrateLegacyCampaignProgressOnce,
  resetCampaignLegacyMigrationFlagForTests,
} from './campaignSaves.js';

const store = new Map();

function installMockStorage() {
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

beforeEach(() => {
  store.clear();
  resetCampaignLegacyMigrationFlagForTests();
  installMockStorage();
});

test('clampCampaignSlotIndex', () => {
  assert.equal(clampCampaignSlotIndex(1), 1);
  assert.equal(clampCampaignSlotIndex(-1), 0);
  assert.equal(clampCampaignSlotIndex(99), 0);
});

test('migrazione legacy → slot 0 e rimozione chiave vecchia', () => {
  const legacy = JSON.stringify({ completedLevels: [1] });
  localStorage.setItem(LEGACY_CAMPAIGN_KEY, legacy);
  migrateLegacyCampaignProgressOnce();
  assert.equal(localStorage.getItem(LEGACY_CAMPAIGN_KEY), null);
  assert.equal(localStorage.getItem(campaignSlotStorageKey(0)), legacy);
});

test('chiavi slot indipendenti', () => {
  localStorage.setItem(campaignSlotStorageKey(0), '{"a":0}');
  localStorage.setItem(campaignSlotStorageKey(2), '{"a":2}');
  assert.equal(JSON.parse(localStorage.getItem(campaignSlotStorageKey(0))).a, 0);
  assert.equal(JSON.parse(localStorage.getItem(campaignSlotStorageKey(2))).a, 2);
});
