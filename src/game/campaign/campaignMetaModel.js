// Modello meta campagna (giorni, pressione, faglie, magazzino) — logica pura, senza React.

/**
 * @returns {import('./campaignMetaTypes.js').CampaignMeta}
 */
export function createDefaultCampaignMeta() {
  return {
    day: 1,
    rifts: 0,
    pressure: { player: 0, world: 0 },
    warehouse: [],
    warehouseCardIds: [],
    narrativeSeenIds: [],
    missionsCompleted: 0,
    segment: 'mission_select',
    currentMissionId: null,
    activeDeckCardIds: null,
    managementDepth: null,
  };
}

/**
 * @param {number} v
 * @param {number} min
 * @param {number} max
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * @param {Partial<import('./campaignMetaTypes.js').CampaignMeta>} meta
 */
export function mergeCampaignMeta(meta) {
  const d = createDefaultCampaignMeta();
  if (!meta) return d;
  return {
    ...d,
    ...meta,
    pressure: { ...d.pressure, ...(meta.pressure || {}) },
    warehouse: Array.isArray(meta.warehouse) ? [...meta.warehouse] : [...d.warehouse],
    warehouseCardIds: Array.isArray(meta.warehouseCardIds)
      ? [...meta.warehouseCardIds]
      : [...d.warehouseCardIds],
    narrativeSeenIds: Array.isArray(meta.narrativeSeenIds)
      ? [...meta.narrativeSeenIds]
      : [...d.narrativeSeenIds],
    missionsCompleted:
      meta.missionsCompleted !== undefined && meta.missionsCompleted !== null
        ? meta.missionsCompleted
        : d.missionsCompleted,
    managementDepth: meta.managementDepth !== undefined ? meta.managementDepth : d.managementDepth,
  };
}
