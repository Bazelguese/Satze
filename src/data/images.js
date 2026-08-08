// ============================================
// GESTIONE IMMAGINI - Solo path (file in public/card-images/)
// Nessun base64: bundle leggero, caricamento veloce.
// ============================================

const BASE = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
  ? import.meta.env.BASE_URL
  : './';

const typesDir = `${BASE}card-images/types/`;
const agentsDir = `${BASE}card-images/agents/`;
const nascenteDir = `${BASE}card-images/nascente/`;

/** Id riservato del Nascente (non è in cards.js). */
export const NASCENTE_AGENT_ID = 9001;

/**
 * Arte campagna del Nascente per stadio visivo (0=L2 … 3=L5).
 * Sorgente: carte/Campagna/01-horizon/P01–P04 → public/card-images/nascente/stadio-N.webp
 */
export function getNascenteStageImageUrl(stageIndex = 0) {
  const i = Math.max(0, Math.min(3, Number(stageIndex) || 0));
  return `${nascenteDir}stadio-${i}.webp`;
}

/** Stadio 0–3 dalla Lega del Nascente (L2→0 … L5→3). */
export function nascenteStageFromLeague(league) {
  return Math.max(0, Math.min(3, (Number(league) || 2) - 2));
}

const AGENT_IMAGE_OVERRIDES = {
  // Swap richiesto: John l'Idraulico <-> Mr. Cavalca Via
  '904': agentsDir + '920.webp',
  '920': agentsDir + '904.webp',
  // Nascente: chiave base + varianti per stadio (usate da getCardSprite)
  '9001': getNascenteStageImageUrl(0),
  '9001-s0': getNascenteStageImageUrl(0),
  '9001-s1': getNascenteStageImageUrl(1),
  '9001-s2': getNascenteStageImageUrl(2),
  '9001-s3': getNascenteStageImageUrl(3),
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
  [101, 130], [201, 230], [301, 330], [401, 430],
  [501, 530], [601, 630], [701, 730], [801, 830],
  [901, 930],
  [1001, 1030],
  [1101, 1130],
  [1201, 1230],
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

const preloadedImageUrls = new Set();

/** Precarica texture agenti (menu / galleria) senza montare React. */
export function preloadCardImagesForAgents(agents, resolveSprite) {
  if (!agents?.length || typeof resolveSprite !== 'function') return;
  for (let i = 0; i < agents.length; i += 1) {
    const agent = agents[i];
    const spriteInfo = resolveSprite(agent);
    const url = getCardImageUrl(spriteInfo?.type, spriteInfo?.agentId);
    if (!url || preloadedImageUrls.has(url)) continue;
    preloadedImageUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
