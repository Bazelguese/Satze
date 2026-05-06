/**
 * @typedef {Object} CampaignWarehouseItem
 * @property {string} id
 * @property {string} kind — es. 'reward', 'resource', 'unlock'
 * @property {string} [label]
 * @property {number} [receivedAt]
 */

/**
 * @typedef {Object} CampaignMeta
 * @property {number} day — giorno narrativo della campagna
 * @property {number} rifts — faglie / instabilità accumulate
 * @property {{ player: number, world: number }} pressure — barre 0–100 (meta; non modificano il duello core)
 * @property {CampaignWarehouseItem[]} warehouse
 * @property {'idle'|'mission_select'|'in_mission'|'rewards'|'management'|'management_full'|'management_reduced'|'management_minimal'|'campaign_lost'|'campaign_won'} segment
 * @property {number} [savedAt] — timestamp ultimo salvataggio (slot)
 * @property {number|string|null} currentMissionId
 * @property {'full'|'reduced'|'minimal'|null} [managementDepth]
 * @property {number[]|null} activeDeckCardIds — mazzo attivo campagna (opzionale)
 * @property {number[]} warehouseCardIds — magazzino carte (ID numerici mazzo)
 * @property {string[]} narrativeSeenIds — id eventi narrativi già risolti
 * @property {number} missionsCompleted — missioni vinte (contatore meta)
 */

export {};
