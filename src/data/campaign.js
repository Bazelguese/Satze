// ============================================
// CAMPAIGN DATA - Run guerra + livelli + meta-layer
// ============================================

import { ARMY_SETS } from './cards';
import { mergeCampaignMeta, clamp } from '../game/campaign/campaignMetaModel.js';
import {
  transitionEnterMissionFromMenu,
  transitionAfterMissionVictory,
  transitionAfterMissionDefeat,
  transitionExitRewardsToManagement,
  transitionExitManagementToMap,
} from '../game/campaign/campaignMetaTransitions.js';
import { mergeWarState } from '../game/campaign/campaignWarModel.js';
import {
  applyWarStateAfterVictory,
  applyWarStateAfterDefeat,
  applyMandatoryDefenseIfNeeded,
  isCampaignRunLost,
} from '../game/campaign/campaignWarTick.js';
import { CAMPAIGN_LEVELS, isLevelUnlocked } from './campaignLevels.js';
import { CAMPAIGN_DEFAULT_FIGLI_DECK, CAMPAIGN_FIGLI_STARTING_POOL } from './campaignFigliDeck.js';
import { CAMPAIGN_NARRATIVE_EVENTS } from './campaignNarrative.js';
import {
  migrateLegacyCampaignProgressOnce,
  campaignSlotStorageKey,
  clampCampaignSlotIndex,
  clearCampaignSlotStorage,
} from './campaignSaves.js';

export { CAMPAIGN_LEVELS, isLevelUnlocked };
export { CAMPAIGN_SLOT_COUNT, clampCampaignSlotIndex } from './campaignSaves.js';

/** Etichette UI (legacy missionType). */
export const CAMPAIGN_MISSION_TYPE_LABELS = {
  standard: 'Standard',
  dominion: 'Dominio',
  annihilation: 'Annientamento',
};

export { CAMPAIGN_MISSION_KIND_LABELS } from '../game/campaign/campaignMissionKinds.js';

/** Etichette UI difficoltà IA campagna. */
export const CAMPAIGN_DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
  chaos: 'Caos',
};

function ensureCampaignDeckInitialized(progress) {
  const war = mergeWarState(progress.war);
  if (war.playerArmy !== "Figli dell'Orizzonte") return progress;
  const meta = mergeCampaignMeta(progress.meta);
  if (Array.isArray(meta.activeDeckCardIds) && meta.activeDeckCardIds.length > 0) return progress;
  const deck = [...CAMPAIGN_DEFAULT_FIGLI_DECK];
  const wSet = new Set(deck);
  const wh = CAMPAIGN_FIGLI_STARTING_POOL.filter((id) => !wSet.has(id));
  return {
    ...progress,
    meta: {
      ...meta,
      activeDeckCardIds: deck,
      warehouseCardIds: wh,
    },
  };
}

export function normalizeCampaignProgress(raw) {
  const base = {
    completedLevels: [],
    unlockedArmies: Object.keys(ARMY_SETS),
    unlockedDecks: {},
    unlockedBattlefields: [],
    meta: mergeCampaignMeta(null),
    war: mergeWarState(null),
  };
  if (!raw || typeof raw !== 'object') return ensureCampaignDeckInitialized(base);
  const merged = {
    ...base,
    ...raw,
    completedLevels: Array.isArray(raw.completedLevels) ? [...raw.completedLevels] : [],
    unlockedArmies: Array.isArray(raw.unlockedArmies) ? [...raw.unlockedArmies] : base.unlockedArmies,
    unlockedDecks: raw.unlockedDecks && typeof raw.unlockedDecks === 'object' ? { ...raw.unlockedDecks } : {},
    unlockedBattlefields: Array.isArray(raw.unlockedBattlefields) ? [...raw.unlockedBattlefields] : [],
    meta: mergeCampaignMeta(raw.meta),
    war: mergeWarState(raw.war),
  };
  return ensureCampaignDeckInitialized(merged);
}

function buildWarehouseRewardItem(level) {
  if (!level.reward) return null;
  const id = `reward_${level.id}_${level.reward.type}_${String(level.reward.value)}_${Date.now()}`;
  const label =
    level.reward.type === 'achievement'
      ? `Obiettivo: ${level.reward.value}`
      : `Ricompensa: ${level.reward.value} (${level.name})`;
  return {
    id,
    kind: level.reward.type === 'achievement' ? 'achievement' : 'unlock',
    label,
    receivedAt: Date.now(),
  };
}

function applyUnlockReward(progress, level) {
  const r = level.reward;
  if (!r || r.type !== 'unlock') return progress;
  const next = { ...progress, unlockedBattlefields: [...progress.unlockedBattlefields] };
  if (r.value === 'battlefield' && typeof level.id === 'number') {
    const tag = `campaign_unlock_bf_${level.id}`;
    if (!next.unlockedBattlefields.includes(tag)) {
      next.unlockedBattlefields.push(tag);
    }
  }
  return next;
}

/**
 * @param {unknown} slotIndex — 0…2 (default 0 se assente per compatibilità interna)
 */
export function loadCampaignProgress(slotIndex = 0) {
  try {
    migrateLegacyCampaignProgressOnce();
    const slot = clampCampaignSlotIndex(slotIndex);
    const stored = localStorage.getItem(campaignSlotStorageKey(slot));
    if (!stored) {
      return normalizeCampaignProgress(null);
    }
    return normalizeCampaignProgress(JSON.parse(stored));
  } catch (error) {
    console.error('Errore nel caricare la progressione:', error);
    return normalizeCampaignProgress(null);
  }
}

/**
 * @param {ReturnType<typeof normalizeCampaignProgress>} progress
 * @param {unknown} slotIndex — 0…2
 */
export function saveCampaignProgress(progress, slotIndex = 0) {
  try {
    const slot = clampCampaignSlotIndex(slotIndex);
    const meta = mergeCampaignMeta(progress.meta);
    meta.savedAt = Date.now();
    const toSave = { ...progress, meta };
    localStorage.setItem(campaignSlotStorageKey(slot), JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('Errore nel salvare la progressione:', error);
    return false;
  }
}

/**
 * Riepilogo slot per menu (vuoto / giorno / HQ / ultimo salvataggio).
 * @param {unknown} slotIndex
 */
export function getCampaignSlotSummary(slotIndex) {
  migrateLegacyCampaignProgressOnce();
  const slot = clampCampaignSlotIndex(slotIndex);
  try {
    const raw = localStorage.getItem(campaignSlotStorageKey(slot));
    if (!raw) {
      return { empty: true, slotIndex: slot };
    }
    const p = normalizeCampaignProgress(JSON.parse(raw));
    const meta = mergeCampaignMeta(p.meta);
    const war = mergeWarState(p.war);
    const storyDone = (p.completedLevels || []).includes(8);
    return {
      empty: false,
      slotIndex: slot,
      day: meta.day ?? 1,
      segment: meta.segment ?? 'mission_select',
      hqIntegrity: typeof war.hqIntegrity === 'number' ? war.hqIntegrity : null,
      savedAt: meta.savedAt ?? null,
      storyLevelsCompleted: (p.completedLevels || []).filter((id) => typeof id === 'number' && id >= 1 && id <= 8).length,
      storyComplete: storyDone || meta.segment === 'campaign_won',
    };
  } catch {
    return { empty: true, slotIndex: slot, corrupt: true };
  }
}

/** Cancella solo lo slot indicato (nuova partita / elimina salvataggio). */
export function clearCampaignSlot(slotIndex) {
  clearCampaignSlotStorage(slotIndex);
}

/** Inizializza uno slot con progress fresco (nuova campagna). */
export function initializeCampaignSlotFresh(slotIndex) {
  const fresh = normalizeCampaignProgress(null);
  saveCampaignProgress(fresh, slotIndex);
  return fresh;
}

export function markCampaignMissionStarted(missionKey, slotIndex = 0) {
  let progress = loadCampaignProgress(slotIndex);
  progress = transitionEnterMissionFromMenu(progress, missionKey);
  saveCampaignProgress(progress, slotIndex);
}

/**
 * Dopo la schermata ricompense → segmento gestionale.
 */
export function acknowledgeCampaignRewards(slotIndex = 0) {
  let progress = loadCampaignProgress(slotIndex);
  if (progress.meta?.segment !== 'rewards') return progress;
  progress = transitionExitRewardsToManagement(progress);
  saveCampaignProgress(progress, slotIndex);
  return progress;
}

/**
 * Fine segmento gestionale → mappa missioni.
 */
export function acknowledgeCampaignManagementFinish(slotIndex = 0) {
  let progress = loadCampaignProgress(slotIndex);
  if (
    progress.meta?.segment !== 'management_full' &&
    progress.meta?.segment !== 'management_reduced' &&
    progress.meta?.segment !== 'management_minimal'
  ) {
    return progress;
  }
  progress = transitionExitManagementToMap(progress);
  saveCampaignProgress(progress, slotIndex);
  return progress;
}

function isStoryMissionId(id) {
  return typeof id === 'number' && id >= 1 && id < 900;
}

export function finalizeCampaignMissionVictory(campaignLevel, slotIndex = 0) {
  if (!campaignLevel) return false;
  const storyLevel = isStoryMissionId(campaignLevel.id)
    ? CAMPAIGN_LEVELS.find((l) => l.id === campaignLevel.id)
    : null;
  const levelForReward = storyLevel || campaignLevel;

  let progress = loadCampaignProgress(slotIndex);
  const alreadyCompleted = storyLevel
    ? progress.completedLevels.includes(storyLevel.id)
    : (progress.war?.completedFissureIds || []).includes(String(campaignLevel.id));

  if (!alreadyCompleted) {
    let progressWithUnlock = applyUnlockReward(progress, levelForReward);
    const warehouseItem = buildWarehouseRewardItem(levelForReward);
    progressWithUnlock = transitionAfterMissionVictory(progressWithUnlock, levelForReward, {
      warehouseItem: warehouseItem || undefined,
      rewardCardId: levelForReward.rewardCardId != null ? levelForReward.rewardCardId : undefined,
    });
    if (
      storyLevel &&
      storyLevel.reward?.type === 'achievement' &&
      storyLevel.reward?.value === 'campaign_complete'
    ) {
      const metaWon = mergeCampaignMeta(progressWithUnlock.meta);
      metaWon.segment = 'campaign_won';
      progressWithUnlock = { ...progressWithUnlock, meta: metaWon };
    }
    let war = mergeWarState(progressWithUnlock.war);
    war = applyWarStateAfterVictory(war, {
      enemyFaction: campaignLevel.enemyArmy,
      fissureId: campaignLevel._fissureId,
    });
    if (campaignLevel._mandatory) {
      war.pendingMandatoryMissionKey = null;
    }
    war.lastManagementDepth = 'full';
    war = applyMandatoryDefenseIfNeeded(war);
    if (!storyLevel) {
      war.completedFissureIds = [...(war.completedFissureIds || []), String(campaignLevel.id)];
    }
    progressWithUnlock = { ...progressWithUnlock, war };
    saveCampaignProgress(progressWithUnlock, slotIndex);
    return true;
  }

  const meta = mergeCampaignMeta(progress.meta);
  meta.day += 1;
  meta.pressure.player = Math.max(0, meta.pressure.player - 4);
  meta.currentMissionId = null;
  meta.segment = 'management_full';
  meta.managementDepth = 'full';
  saveCampaignProgress({ ...progress, meta }, slotIndex);
  return true;
}

export function finalizeCampaignMissionDefeat(campaignLevel = null, slotIndex = 0) {
  let progress = loadCampaignProgress(slotIndex);
  progress = transitionAfterMissionDefeat(progress);
  let war = mergeWarState(progress.war);
  war = applyWarStateAfterDefeat(war, {
    enemyFaction: campaignLevel?.enemyArmy,
    mandatoryDefenseFailed: campaignLevel?._mandatory === true,
  });
  war = applyMandatoryDefenseIfNeeded(war);
  let meta = mergeCampaignMeta(progress.meta);
  if (isCampaignRunLost(war)) {
    meta.segment = 'campaign_lost';
  }
  saveCampaignProgress({ ...progress, war, meta }, slotIndex);
  return true;
}

export function completeCampaignLevel(levelId, slotIndex = 0) {
  const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);
  if (!level) return false;
  return finalizeCampaignMissionVictory(level, slotIndex);
}

export function resetCampaignRunForTesting(slotIndex = 0) {
  const fresh = normalizeCampaignProgress(null);
  saveCampaignProgress(fresh, slotIndex);
  return fresh;
}

/** Costante allineata al design doc (pressione giornaliera sui fronti). */
export const CAMPAIGN_DAY_PRESSURE_GROWTH = 15;

/**
 * Avanza il giorno di guerra: +pressione su ogni faglia attiva e sulla barra fazione collegata.
 * Può innescare missione difensiva obbligatoria se una barra raggiunge 100.
 * @returns {ReturnType<typeof loadCampaignProgress>}
 */
/**
 * Salva mazzo attivo e magazzino carte (campagna Figli / meta).
 */
export function saveCampaignDeckAndWarehouse(activeDeckCardIds, warehouseCardIds, slotIndex = 0) {
  let p = loadCampaignProgress(slotIndex);
  let meta = mergeCampaignMeta(p.meta);
  meta.activeDeckCardIds = [...activeDeckCardIds];
  meta.warehouseCardIds = [...warehouseCardIds];
  saveCampaignProgress({ ...p, meta }, slotIndex);
}

/**
 * @param {string} eventId
 * @param {string} choiceKey
 */
export function applyCampaignNarrativeChoice(eventId, choiceKey, slotIndex = 0) {
  const ev = CAMPAIGN_NARRATIVE_EVENTS[eventId];
  if (!ev) return loadCampaignProgress(slotIndex);
  const ch = ev.choices.find((c) => c.key === choiceKey);
  if (!ch) return loadCampaignProgress(slotIndex);
  let p = loadCampaignProgress(slotIndex);
  let war = mergeWarState(p.war);
  war = ch.apply(war);
  war = mergeWarState(war);
  let meta = mergeCampaignMeta(p.meta);
  const seen = new Set(meta.narrativeSeenIds || []);
  seen.add(eventId);
  meta.narrativeSeenIds = [...seen];
  saveCampaignProgress({ ...p, war, meta }, slotIndex);
  return loadCampaignProgress(slotIndex);
}

export function advanceCampaignWarDay(slotIndex = 0) {
  let progress = loadCampaignProgress(slotIndex);
  if (progress.meta?.segment !== 'mission_select') {
    return progress;
  }
  let meta = mergeCampaignMeta(progress.meta);
  let war = mergeWarState(progress.war);
  const G = CAMPAIGN_DAY_PRESSURE_GROWTH;
  meta.day = (meta.day || 1) + 1;

  const fp = { ...war.factionPressure };
  const newFissures = war.fissures.map((f) => {
    const ns = clamp((f.severity ?? 0) + G, 0, 100);
    fp[f.factionKey] = Math.max(fp[f.factionKey] ?? 0, ns);
    return { ...f, severity: ns, ignoredDays: (f.ignoredDays ?? 0) + 1 };
  });
  war = { ...war, fissures: newFissures, factionPressure: fp };
  war = applyMandatoryDefenseIfNeeded(war);
  saveCampaignProgress({ ...progress, meta, war }, slotIndex);
  return loadCampaignProgress(slotIndex);
}
