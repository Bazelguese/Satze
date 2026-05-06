// Adattatore: missione campagna → parametri duello / startGame.

import { buildCampaignDuelModFromMission } from './campaignMissionKinds.js';

/**
 * @typedef {'standard' | 'dominion' | 'annihilation'} CampaignMissionTypeLegacy
 */

/**
 * Costruisce gli argomenti allineati a `startGame` / useGameFlow.
 *
 * @param {Object} campaignLevel — entry missione (storia o faglia)
 * @param {import('./campaignMetaTypes.js').CampaignMeta|null} [meta]
 * @returns {{
 *   mode: string,
 *   difficulty: string,
 *   enemyArmy: string,
 *   enemyDeckKey: string,
 *   missionType: string,
 *   missionKind: string,
 *   duelNotes: string[],
 *   campaignDuelMod: { initiativeProfile: 'assault'|'defense'|null, winCondition: 'default'|'annihilation_only'|null },
 * }}
 */
export function buildCampaignDuelLaunchConfig(campaignLevel, meta = null) {
  const missionKind =
    campaignLevel.missionKind ||
    (campaignLevel.missionType === 'dominion'
      ? 'dominion'
      : campaignLevel.missionType === 'annihilation'
        ? 'annihilation'
        : 'assault');
  const missionType = campaignLevel.missionType || 'standard';
  const notes = [];
  if (missionKind === 'dominion') {
    notes.push('Dominio: obiettivo campo specifico (estendere motore duello).');
  }
  if (missionKind === 'annihilation') {
    notes.push('Annientamento: vittoria solo a 0 PV nemico (se attivo nel duello).');
  }
  if (missionKind === 'assault') {
    notes.push('Assalto: iniziativa giocatore nei primi due turni (se attivo).');
  }
  if (missionKind === 'defense') {
    notes.push('Difesa: iniziativa nemico nei primi due turni (se attivo).');
  }
  if (meta?.pressure?.player != null && meta.pressure.player >= 70) {
    notes.push('Alta pressione giocatore (meta).');
  }
  const campaignDuelMod = buildCampaignDuelModFromMission(missionKind);
  return {
    mode: campaignLevel.gameMode || 'campaign',
    difficulty: campaignLevel.difficulty,
    enemyArmy: campaignLevel.enemyArmy,
    enemyDeckKey: campaignLevel.enemyDeck,
    missionType,
    missionKind,
    duelNotes: notes,
    campaignDuelMod,
  };
}

/**
 * @param {Object} campaignLevel
 * @param {import('./campaignMetaTypes.js').CampaignMeta|null} meta
 */
export function assertCampaignMissionContext(campaignLevel, meta) {
  if (!meta || meta.currentMissionId == null) return { ok: true };
  if (String(meta.currentMissionId) !== String(campaignLevel.id)) {
    return {
      ok: false,
      reason: `Missione meta (${meta.currentMissionId}) ≠ missione attiva (${campaignLevel.id}).`,
    };
  }
  return { ok: true };
}
