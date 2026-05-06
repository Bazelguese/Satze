// Pressione / display per righe mappa campagna (faglie + factionPressure).

import { mergeWarState } from './campaignWarModel.js';

/**
 * Pressione 0–100 mostrata per una missione (faglia: max tra barra fazione e severità faglia).
 * @param {Object} mission
 * @param {import('./campaignWarTypes.js').CampaignWarState|null|undefined} war
 */
export function getMissionDisplayPressure(mission, war) {
  const w = mergeWarState(war);
  const enemy = mission?.enemyArmy;
  let p = typeof enemy === 'string' ? (w.factionPressure[enemy] ?? 0) : 0;
  if (mission?._source === 'fissure' && mission._fissureId) {
    const f = w.fissures.find((x) => x.id === mission._fissureId);
    if (f) p = Math.max(p, f.severity ?? 0);
  }
  return Math.min(100, Math.round(p));
}

/**
 * @param {Object} mission
 * @param {import('./campaignWarTypes.js').CampaignWarState|null|undefined} war
 */
export function isMissionMandatory(mission, war) {
  if (mission?._mandatory) return true;
  const w = mergeWarState(war);
  if (mission?._source === 'fissure' && mission._fissureId) {
    const f = w.fissures.find((x) => x.id === mission._fissureId);
    if (f?.mandatory) return true;
  }
  return getMissionDisplayPressure(mission, war) >= 100;
}
