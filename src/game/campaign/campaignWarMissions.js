// Missioni disponibili sulla mappa: storia (CAMPAIGN_LEVELS) + faglie generate.

import { CAMPAIGN_LEVELS, isLevelUnlocked } from '../../data/campaignLevels.js';
import { mergeWarState } from './campaignWarModel.js';

/**
 * Genera faglie seed per il prototipo (struttura; contenuti da rifinire).
 * @param {number} day
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 */
export function seedFissuresForDay(day, war) {
  const w = mergeWarState(war);
  if (w.fissures.length > 0) return w;
  const factions = ['Kethran', 'Corte Rossa', 'Calibri Pesanti'].filter((f) => f !== w.playerArmy);
  const base = day;
  const stamp = Date.now();
  w.fissures = factions.slice(0, 2).map((faction, i) => ({
    id: `rift_${base}_${i}_${stamp}`,
    factionKey: faction,
    severity: 15 + i * 5,
    bornOnDay: day,
    ignoredDays: 0,
    mandatory: false,
  }));
  return w;
}

/**
 * Costruisce un oggetto "livello" compatibile con campaignLevel per una faglia.
 * @param {import('./campaignWarTypes.js').CampaignFissure} fissure
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 */
export function buildMissionFromFissure(fissure, war) {
  return {
    id: `mission_${fissure.id}`,
    name: `Faglia — ${fissure.factionKey}`,
    description: 'Missione generata da faglia (prototipo).',
    playerArmy: war.playerArmy,
    enemyArmy: fissure.factionKey,
    enemyDeck: 'A',
    difficulty: 'medium',
    missionKind: 'assault',
    missionType: 'standard',
    reward: { type: 'unlock', value: 'deck' },
    _source: 'fissure',
    _fissureId: fissure.id,
  };
}

/**
 * Missioni obbligatorie (difesa) quando una barra è al massimo — placeholder.
 */
export function buildMandatoryDefenseMission(war) {
  const key = war.pendingMandatoryMissionKey;
  if (!key) return null;
  const enemy =
    war.playerArmy === "Figli dell'Orizzonte" ? 'Kethran' : "Figli dell'Orizzonte";
  return {
    id: key,
    name: 'Assedio alla sede',
    description: 'Missione difensiva obbligatoria: il fronte è collassato.',
    playerArmy: war.playerArmy,
    enemyArmy: enemy,
    enemyDeck: 'B',
    difficulty: 'hard',
    missionKind: 'defense',
    missionType: 'standard',
    reward: { type: 'unlock', value: 'deck' },
    _source: 'mandatory',
    _mandatory: true,
  };
}

/**
 * @param {Object} progress
 * @returns {{ missions: Object[], war: import('./campaignWarTypes.js').CampaignWarState }}
 */
export function getAvailableCampaignMissions(progress) {
  const completedLevels = Array.isArray(progress?.completedLevels) ? progress.completedLevels : [];
  const war = mergeWarState(progress?.war);
  const metaDay = progress?.meta?.day ?? 1;
  const warWithFissures = seedFissuresForDay(metaDay, war);

  if (warWithFissures.pendingMandatoryMissionKey) {
    const m = buildMandatoryDefenseMission(warWithFissures);
    return { missions: m ? [m] : [], war: warWithFissures };
  }

  /** @type {Object[]} */
  const missions = [];

  for (const level of CAMPAIGN_LEVELS) {
    if (completedLevels.includes(level.id)) continue;
    if (!isLevelUnlocked(level, completedLevels)) continue;
    missions.push({
      ...level,
      missionKind: level.missionKind || level.missionType || 'assault',
      _source: 'story',
    });
    break;
  }

  const doneFissures = new Set(progress?.war?.completedFissureIds || []);
  for (const f of warWithFissures.fissures) {
    const mid = `mission_${f.id}`;
    if (doneFissures.has(mid)) continue;
    missions.push(buildMissionFromFissure(f, warWithFissures));
  }

  return { missions, war: warWithFissures };
}
