// Tipi missione campagna (design doc) + mapping verso duello / UI.

/** @typedef {'assault' | 'defense' | 'dominion' | 'annihilation' | 'special'} CampaignMissionKind */

export const CAMPAIGN_MISSION_KINDS = /** @type {const} */ ([
  'assault',
  'defense',
  'dominion',
  'annihilation',
  'special',
]);

export const CAMPAIGN_MISSION_KIND_LABELS = {
  assault: 'Assalto',
  defense: 'Difesa',
  dominion: 'Dominio',
  annihilation: 'Annientamento',
  special: 'Missione speciale',
};

/** Iniziativa primi due round (doc): assalto = giocatore, difesa = nemico, neutral = regola Lega core. */
export const CAMPAIGN_INITIATIVE_PROFILE = {
  assault: 'player_first_two',
  defense: 'enemy_first_two',
  neutral: 'league_core',
};

/**
 * @param {string|null|undefined} kind
 * @returns {'assault'|'defense'|'neutral'}
 */
export function resolveInitiativeProfileForKind(kind) {
  if (kind === 'assault') return 'assault';
  if (kind === 'defense') return 'defense';
  return 'neutral';
}

/**
 * @param {'assault'|'defense'|'neutral'} profile
 * @returns {{ initiativeProfile: 'assault'|'defense'|null, winCondition: 'default'|'annihilation_only'|null }}
 */
export function buildCampaignDuelModFromMission(kind) {
  const p = resolveInitiativeProfileForKind(kind);
  return {
    initiativeProfile: p === 'neutral' ? null : p,
    winCondition: kind === 'annihilation' ? 'annihilation_only' : 'default',
  };
}
