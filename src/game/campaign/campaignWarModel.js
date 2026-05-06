// Stato guerra campagna: faglie, pressione per fazione, HQ, missione obbligatoria.

import { clamp } from './campaignMetaModel.js';

export const DEFAULT_CAMPAIGN_ID = 'orizzonte';

/**
 * @returns {import('./campaignWarTypes.js').CampaignWarState}
 */
export function createDefaultWarState() {
  return {
    campaignId: DEFAULT_CAMPAIGN_ID,
    playerArmy: "Figli dell'Orizzonte",
    hqIntegrity: 100,
    factionPressure: {},
    fissures: [],
    battlefieldsUnlockedThisRun: [],
    pendingMandatoryMissionKey: null,
    lastManagementDepth: 'full',
    narrativeFlags: [],
    moralChoiceQueue: [],
    completedFissureIds: [],
  };
}

/**
 * @param {Partial<import('./campaignWarTypes.js').CampaignWarState>|null|undefined} war
 */
export function mergeWarState(war) {
  const d = createDefaultWarState();
  if (!war || typeof war !== 'object') return d;
  return {
    ...d,
    ...war,
    factionPressure: { ...d.factionPressure, ...(war.factionPressure || {}) },
    fissures: Array.isArray(war.fissures) ? war.fissures.map((f) => ({ ...f })) : [...d.fissures],
    battlefieldsUnlockedThisRun: Array.isArray(war.battlefieldsUnlockedThisRun)
      ? [...war.battlefieldsUnlockedThisRun]
      : [...d.battlefieldsUnlockedThisRun],
    narrativeFlags: Array.isArray(war.narrativeFlags) ? [...war.narrativeFlags] : [...d.narrativeFlags],
    moralChoiceQueue: Array.isArray(war.moralChoiceQueue) ? [...war.moralChoiceQueue] : [...d.moralChoiceQueue],
    completedFissureIds: Array.isArray(war.completedFissureIds) ? [...war.completedFissureIds] : [...d.completedFissureIds],
  };
}

/**
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 * @param {string} faction
 * @param {number} delta
 */
export function addFactionPressure(war, faction, delta) {
  const fp = { ...war.factionPressure };
  const cur = fp[faction] ?? 0;
  fp[faction] = clamp(cur + delta, 0, 100);
  return { ...war, factionPressure: fp };
}
