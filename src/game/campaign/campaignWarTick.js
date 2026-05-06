// Aggiornamenti guerra dopo missione / giorno: pressione, HQ, faglie.

import { clamp } from './campaignMetaModel.js';
import { mergeWarState } from './campaignWarModel.js';

/**
 * Dopo vittoria: riduce pressione fazione nemica, assottiglia faglie collegate.
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 * @param {Object} ctx — { enemyFaction?: string, fissureId?: string }
 */
export function applyWarStateAfterVictory(war, ctx = {}) {
  let w = mergeWarState(war);
  if (ctx.enemyFaction) {
    const fp = { ...w.factionPressure };
    const cur = fp[ctx.enemyFaction] ?? 0;
    fp[ctx.enemyFaction] = clamp(cur - 12, 0, 100);
    w = { ...w, factionPressure: fp };
  }
  if (ctx.fissureId) {
    w = {
      ...w,
      fissures: w.fissures.filter((f) => f.id !== ctx.fissureId),
    };
  }
  w.pendingMandatoryMissionKey = null;
  return w;
}

/**
 * Dopo sconfitta: pressione su, faglie peggiorano, HQ può calare se difesa fallisce.
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 * @param {Object} ctx
 */
export function applyWarStateAfterDefeat(war, ctx = {}) {
  let w = mergeWarState(war);
  if (ctx.enemyFaction) {
    const fp = { ...w.factionPressure };
    const cur = fp[ctx.enemyFaction] ?? 0;
    fp[ctx.enemyFaction] = clamp(cur + 18, 0, 100);
    w = { ...w, factionPressure: fp };
  }
  w = {
    ...w,
    fissures: w.fissures.map((f) =>
      f.factionKey === ctx.enemyFaction
        ? { ...f, severity: clamp(f.severity + 12, 0, 100), ignoredDays: f.ignoredDays + 1 }
        : { ...f, ignoredDays: f.ignoredDays + 1 }
    ),
  };
  if (ctx.mandatoryDefenseFailed) {
    w.hqIntegrity = clamp(w.hqIntegrity - 25, 0, 100);
  } else {
    w.hqIntegrity = clamp(w.hqIntegrity - 5, 0, 100);
  }
  return w;
}

/**
 * Controlla barre al 100% → missione difensiva obbligatoria.
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 */
export function applyMandatoryDefenseIfNeeded(war) {
  const w = mergeWarState(war);
  for (const [faction, val] of Object.entries(w.factionPressure)) {
    if (val >= 100) {
      return {
        ...w,
        pendingMandatoryMissionKey: `mandatory_defense_${faction}_${Date.now()}`,
      };
    }
  }
  return w;
}

/**
 * @param {import('./campaignWarTypes.js').CampaignWarState} war
 */
export function isCampaignRunLost(war) {
  const w = mergeWarState(war);
  return w.hqIntegrity <= 0;
}
