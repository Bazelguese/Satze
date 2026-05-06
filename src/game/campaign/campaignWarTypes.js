/**
 * @typedef {Object} CampaignFissure
 * @property {string} id
 * @property {string} factionKey — armata / fazione nemica
 * @property {number} severity — 0–100
 * @property {number} bornOnDay
 * @property {number} ignoredDays
 * @property {boolean} [mandatory]
 */

/**
 * @typedef {Object} CampaignWarState
 * @property {string} campaignId
 * @property {string} playerArmy — armata giocatore per questa run
 * @property {number} hqIntegrity — 0 = campagna persa (nemico alla sede)
 * @property {Object<string, number>} factionPressure — 0–100 per fazione nemica
 * @property {CampaignFissure[]} fissures
 * @property {string[]} battlefieldsUnlockedThisRun
 * @property {string|null} pendingMandatoryMissionKey — chiave missione difensiva obbligatoria
 * @property {'full'|'reduced'|'minimal'|'none'} lastManagementDepth
 * @property {string[]} narrativeFlags
 * @property {string[]} moralChoiceQueue
 * @property {string[]} completedFissureIds — missioni faglia completate
 */

export {};
