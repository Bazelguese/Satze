// ============================================
// PERSISTENZA RUN CAMPAGNA — slot condivisi (3)
// Riusa l'infrastruttura slot di src/data/campaignSaves.js.
// Il nuovo formato è riconoscibile da `actId`; i salvataggi del
// vecchio modello (pressione/HQ) sono segnalati come `legacy`.
// ============================================

import {
  campaignSlotStorageKey,
  clampCampaignSlotIndex,
  clearCampaignSlotStorage,
  CAMPAIGN_SLOT_COUNT,
} from '../../data/campaignSaves.js';
import { assertRunInvariants, createCampaignRun } from './campaignState.js';

export { CAMPAIGN_SLOT_COUNT, clampCampaignSlotIndex };

/**
 * Carica la run dallo slot. Restituisce null se vuoto, corrotto o legacy.
 * @param {number} slotIndex
 * @param {Object} act - dati dell'Atto (per validare le invarianti al load)
 */
export function loadCampaignRun(slotIndex, act) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(campaignSlotStorageKey(slotIndex));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.actId) return null; // legacy o corrotto
    assertRunInvariants(parsed, act);
    return parsed;
  } catch (e) {
    console.error('Errore caricamento run campagna:', e);
    return null;
  }
}

/**
 * Salva la run nello slot (criterio 8: ripresa identica).
 */
export function saveCampaignRun(run, slotIndex) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const toSave = { ...run, savedAt: Date.now() };
    localStorage.setItem(campaignSlotStorageKey(slotIndex), JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error('Errore salvataggio run campagna:', e);
    return false;
  }
}

/** Crea una run nuova e la salva subito nello slot. */
export function initializeCampaignRun(act, slotIndex, opts = {}) {
  const run = createCampaignRun(act, opts);
  saveCampaignRun(run, slotIndex);
  return run;
}

/** Cancella lo slot (nuova partita / elimina salvataggio). */
export function clearCampaignRun(slotIndex) {
  clearCampaignSlotStorage(slotIndex);
}

/**
 * Riepilogo slot per il menu campagna.
 * @returns {{ empty: boolean, legacy?: boolean, slotIndex: number, day?: number, daysLimit?: number, outcome?: string|null, missionsCompleted?: number, savedAt?: number|null }}
 */
export function getCampaignRunSummary(slotIndex) {
  const slot = clampCampaignSlotIndex(slotIndex);
  if (typeof localStorage === 'undefined') return { empty: true, slotIndex: slot };
  try {
    const raw = localStorage.getItem(campaignSlotStorageKey(slot));
    if (!raw) return { empty: true, slotIndex: slot };
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return { empty: true, slotIndex: slot, corrupt: true };
    if (!p.actId) return { empty: true, slotIndex: slot, legacy: true };
    return {
      empty: false,
      slotIndex: slot,
      day: p.day ?? 1,
      daysLimit: p.daysLimit ?? 14,
      outcome: p.outcome ?? null,
      missionsCompleted: (p.history || []).filter((h) => h.result === 'player').length,
      savedAt: p.savedAt ?? null,
    };
  } catch {
    return { empty: true, slotIndex: slot, corrupt: true };
  }
}
