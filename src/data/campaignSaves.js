// ============================================
// CAMPAIGN SAVE SLOTS — localStorage (3 slot indipendenti)
// ============================================

/** @type {number} */
export const CAMPAIGN_SLOT_COUNT = 3;

export const LEGACY_CAMPAIGN_KEY = 'satze_campaign_progress';

/** @param {unknown} slotIndex */
export function clampCampaignSlotIndex(slotIndex) {
  const n = Number(slotIndex);
  if (!Number.isFinite(n) || n < 0 || n >= CAMPAIGN_SLOT_COUNT) return 0;
  return Math.floor(n);
}

/** @param {unknown} slotIndex */
export function campaignSlotStorageKey(slotIndex) {
  return `satze_campaign_slot_${clampCampaignSlotIndex(slotIndex)}`;
}

let legacyMigrationRanThisSession = false;

/** Per test: ripristina il flag di migrazione legacy. */
export function resetCampaignLegacyMigrationFlagForTests() {
  legacyMigrationRanThisSession = false;
}

/**
 * Migrazione una tantum: `satze_campaign_progress` → slot 0, poi rimozione legacy.
 * Se lo slot 0 è già occupato, elimina solo la chiave legacy.
 */
export function migrateLegacyCampaignProgressOnce() {
  if (legacyMigrationRanThisSession) return;
  legacyMigrationRanThisSession = true;
  if (typeof localStorage === 'undefined') return;
  try {
    const legacy = localStorage.getItem(LEGACY_CAMPAIGN_KEY);
    if (!legacy) return;
    const slot0Key = campaignSlotStorageKey(0);
    if (!localStorage.getItem(slot0Key)) {
      localStorage.setItem(slot0Key, legacy);
    }
    localStorage.removeItem(LEGACY_CAMPAIGN_KEY);
  } catch (e) {
    console.error('Errore migrazione salvataggio campagna legacy:', e);
  }
}

/**
 * @param {unknown} slotIndex
 */
export function clearCampaignSlotStorage(slotIndex) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(campaignSlotStorageKey(slotIndex));
  } catch (e) {
    console.error('Errore cancellazione slot campagna:', e);
  }
}
