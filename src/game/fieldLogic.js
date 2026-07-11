// ============================================
// LOGICA CAMPI DI BATTAGLIA — motore rarità v2
// ============================================

import { ALL_BATTLEFIELDS } from '../data/battlefields';
import {
  BATTLEFIELD_RARITA,
  BATTLEFIELD_SELECTION_DEFAULTS,
  declassRarita,
  getFieldRarita,
} from '../data/battlefieldMeta';
import { shuffleArray } from '../utils/shuffle';

const CLASSIC_FIELD_COUNT = 5;

/**
 * @param {number} slot
 * @param {number} raresPlaced
 * @param {boolean} specialPlaced
 * @param {typeof BATTLEFIELD_SELECTION_DEFAULTS} config
 * @param {() => number} rng
 */
export function rollBattlefieldRaritaTier(slot, raresPlaced, specialPlaced, config, rng) {
  const pS =
    slot >= config.SPECIAL_SLOT_MIN && !specialPlaced ? config.pS_base : 0;
  const pR = Math.max(config.f_R, config.pR_base * config.d ** raresPlaced);
  const roll = rng();

  if (roll < pS) return BATTLEFIELD_RARITA.SPECIAL;
  if (roll < pS + pR) return BATTLEFIELD_RARITA.RARO;
  return BATTLEFIELD_RARITA.COMUNE;
}

/**
 * Pesca uniforme da bucket; declassa se vuoto.
 * @returns {Object|null}
 */
export function pickFromRaritaBucket(eligible, tier, rng) {
  let currentTier = tier;
  const tried = new Set();

  while (currentTier && !tried.has(currentTier)) {
    tried.add(currentTier);
    const bucket = eligible.filter((f) => getFieldRarita(f) === currentTier);
    if (bucket.length) {
      return bucket[Math.floor(rng() * bucket.length)];
    }
    currentTier = declassRarita(currentTier);
  }

  if (!eligible.length) return null;
  return eligible[Math.floor(rng() * eligible.length)];
}

/**
 * Motore v2: 5 slot, rarità, vincolo minTurn su primi REVEAL_START slot.
 *
 * @param {string} mode
 * @param {Array} allBattlefields
 * @param {() => number} rng
 * @param {typeof BATTLEFIELD_SELECTION_DEFAULTS} [config]
 * @returns {Array}
 */
export function pickBattlefieldsByRarity(
  mode,
  allBattlefields,
  rng = Math.random,
  config = BATTLEFIELD_SELECTION_DEFAULTS
) {
  const random = typeof rng === 'function' ? rng : () => Math.random();

  if (mode === 'bareHands') {
    const neutral = allBattlefields.filter((b) => b.category === 'neutral');
    return shuffleArray(neutral).slice(0, CLASSIC_FIELD_COUNT);
  }

  const pool = allBattlefields.filter((b) => b.category !== 'neutral');
  const selected = [];
  let raresPlaced = 0;
  let specialPlaced = false;

  for (let slot = 0; slot < CLASSIC_FIELD_COUNT; slot++) {
    let eligible = pool.filter((f) => !selected.some((s) => s.id === f.id));
    if (slot < config.REVEAL_START) {
      eligible = eligible.filter((f) => f.minTurn === 1);
    }

    const tier = rollBattlefieldRaritaTier(slot, raresPlaced, specialPlaced, config, random);
    const pick = pickFromRaritaBucket(eligible, tier, random);
    if (!pick) break;

    selected.push(pick);
    const r = getFieldRarita(pick);
    if (r === BATTLEFIELD_RARITA.SPECIAL) specialPlaced = true;
    if (r === BATTLEFIELD_RARITA.RARO || r === BATTLEFIELD_RARITA.SPECIAL) raresPlaced += 1;
  }

  return selected;
}

/** @deprecated Usa pickBattlefieldsByRarity — wrapper per compat seed shuffle */
export function pickBattlefieldsWithPool(mode, allBattlefields, _poolConfig, rng) {
  return pickBattlefieldsByRarity(mode, allBattlefields, rng);
}

export const pickBattlefieldsWithShuffle = (mode, allBattlefields, shuffle, _poolConfig = null) => {
  const randomBag = shuffle(Array.from({ length: 64 }, (_, i) => (i + 0.5) / 64));
  let bagIndex = 0;
  const rng = () => randomBag[bagIndex++ % randomBag.length];
  return pickBattlefieldsByRarity(mode, allBattlefields, rng);
};

export const selectBattlefields = (
  mode = 'classic',
  allBattlefields = ALL_BATTLEFIELDS,
  options = {}
) => {
  const rng = options.rng ?? (() => Math.random());
  const config = { ...BATTLEFIELD_SELECTION_DEFAULTS, ...options.selectionConfig };
  return pickBattlefieldsByRarity(mode, allBattlefields, rng, config);
};

export { getFieldModifiers, fieldGrantsOverdriveBonus } from './battlefieldEffects.js';
