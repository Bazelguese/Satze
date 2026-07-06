// ============================================
// GESTIONE IMMAGINI - Solo path (file in public/card-images/)
// Nessun base64: bundle leggero, caricamento veloce.
// ============================================

const BASE = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
  ? import.meta.env.BASE_URL
  : './';

const typesDir = `${BASE}card-images/types/`;
const agentsDir = `${BASE}card-images/agents/`;
const AGENT_IMAGE_OVERRIDES = {
  // Swap richiesto: John l'Idraulico <-> Mr. Cavalca Via
  '904': agentsDir + '920.webp',
  '920': agentsDir + '904.webp',
};

const CARD_TYPE_KEYS = [
  'cosmic_hero', 'cosmic_mage', 'cosmic_spirit',
  'babel_king', 'babel_priest', 'babel_berserker',
  'devil_prince', 'devil_imp', 'devil_demon',
  'mech_titan', 'mech_drone', 'mech_golem',
  'mystic_arcane', 'mystic_oracle', 'mystic_spirit',
  'swarm_queen', 'swarm_beast', 'swarm_insect',
];

const AGENT_ID_RANGES = [
  [101, 120], [201, 220], [301, 320], [401, 420],
  [501, 520], [601, 620], [701, 720], [801, 820],
  [901, 930],
  [1001, 1030],
];

function buildCardImagePaths() {
  const out = {};
  for (const key of CARD_TYPE_KEYS) {
    out[key] = typesDir + key + '.webp';
  }
  return out;
}

function buildAgentImagePaths() {
  const out = {};
  for (const [start, end] of AGENT_ID_RANGES) {
    for (let id = start; id <= end; id++) {
      out[String(id)] = agentsDir + id + '.webp';
    }
  }
  Object.assign(out, AGENT_IMAGE_OVERRIDES);
  return out;
}

export const CARD_IMAGE_PATHS = buildCardImagePaths();
export const AGENT_IMAGE_PATHS = buildAgentImagePaths();

export const CARD_IMAGES = CARD_IMAGE_PATHS;
export const AGENT_IMAGES = AGENT_IMAGE_PATHS;

export function getCardImageUrl(cardType, agentId = null) {
  if (agentId != null && AGENT_IMAGE_PATHS[String(agentId)]) {
    return AGENT_IMAGE_PATHS[String(agentId)];
  }
  return CARD_IMAGE_PATHS[cardType] || null;
}
