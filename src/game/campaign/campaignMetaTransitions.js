// Transizioni meta campagna: missione → ricompense / gestione (logica pura).
import { clamp, mergeCampaignMeta } from './campaignMetaModel.js';

/**
 * Quando il giocatore sceglie una missione dalla mappa campagna.
 * @param {Object} progress — oggetto progress normalizzato
 * @param {number|string} missionKey — id livello storia o id missione faglia
 */
export function transitionEnterMissionFromMenu(progress, missionKey) {
  const meta = mergeCampaignMeta(progress.meta);
  meta.currentMissionId = missionKey;
  meta.segment = 'in_mission';
  return { ...progress, meta };
}

/**
 * Dopo vittoria partita campagna: aggiorna meta, completamento, magazzino.
 * @param {Object} progress
 * @param {import('../../data/campaign.js').CampaignLevel} level
 * @param {Object} rewardContext — { warehouseItem }
 */
export function transitionAfterMissionVictory(progress, level, rewardContext = {}) {
  const meta = mergeCampaignMeta(progress.meta);
  meta.day += 1;
  meta.missionsCompleted = (meta.missionsCompleted || 0) + 1;
  meta.pressure.player = clamp(meta.pressure.player - 8, 0, 100);
  meta.pressure.world = clamp(meta.pressure.world - 3, 0, 100);
  meta.rifts = Math.max(0, meta.rifts - 1);
  meta.currentMissionId = null;
  meta.segment = 'rewards';
  const warehouse = [...meta.warehouse];
  if (rewardContext.warehouseItem) {
    warehouse.push(rewardContext.warehouseItem);
  }
  meta.warehouse = warehouse;

  if (rewardContext.rewardCardId != null && typeof rewardContext.rewardCardId === 'number') {
    const wc = [...(meta.warehouseCardIds || [])];
    if (!wc.includes(rewardContext.rewardCardId)) {
      wc.push(rewardContext.rewardCardId);
    }
    meta.warehouseCardIds = wc;
  }

  const completedLevels = [...progress.completedLevels];
  if (typeof level.id === 'number' && !completedLevels.includes(level.id)) {
    completedLevels.push(level.id);
  }

  return {
    ...progress,
    completedLevels,
    meta,
  };
}

/**
 * Dopo sconfitta: pressione e faglie peggiorano.
 */
export function transitionAfterMissionDefeat(progress) {
  const meta = mergeCampaignMeta(progress.meta);
  meta.pressure.player = clamp(meta.pressure.player + 12, 0, 100);
  meta.pressure.world = clamp(meta.pressure.world + 6, 0, 100);
  meta.rifts += 1;
  meta.currentMissionId = null;
  meta.segment = 'management_reduced';
  meta.managementDepth = 'reduced';
  return { ...progress, meta };
}

/**
 * Dopo ricompense → segmento gestionale (deck, magazzino, eventi).
 */
export function transitionExitRewardsToManagement(progress) {
  const meta = mergeCampaignMeta(progress.meta);
  meta.segment = 'management_full';
  meta.managementDepth = 'full';
  return { ...progress, meta };
}

/**
 * Fine segmento gestionale → mappa missioni.
 */
export function transitionExitManagementToMap(progress) {
  const meta = mergeCampaignMeta(progress.meta);
  meta.segment = 'mission_select';
  meta.managementDepth = null;
  return { ...progress, meta };
}

/**
 * @deprecated Usare transitionExitRewardsToManagement + transitionExitManagementToMap
 */
export function transitionExitRewardsToMap(progress) {
  return transitionExitManagementToMap(transitionExitRewardsToManagement(progress));
}
