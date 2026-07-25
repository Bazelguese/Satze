/**
 * Profilo presentazione derivato da display settings.
 * Non altera regole di gioco: solo densità effetti / timing UI.
 */

import { getDisplaySettings } from './displaySettings.js';

const LIGHT_OVERDRIVE = new Set(['veil-columns', 'heat-rise', 'ember-field', 'prism-halo', 'surge-bloom']);
const HEAVY_OVERDRIVE_FALLBACK = 'veil-columns';
const STATIC_OVERDRIVE = 'ember-field';

/**
 * @typedef {{
 *   quality: 'high' | 'medium' | 'low',
 *   menuParticleCount: number,
 *   menuBlurPx: number,
 *   menuGlowEnabled: boolean,
 *   menuParallaxEnabled: boolean,
 *   menuSigilAnimation: boolean,
 *   overdriveMode: 'full' | 'light' | 'static',
 *   clashVfxEnabled: boolean,
 *   clashIntensityMul: number,
 *   rainbowEnabled: boolean,
 *   zoomTransitionMsMul: number,
 *   zoomDelayMsMul: number,
 * }} VfxQualityProfile
 */

/** @param {'high'|'medium'|'low'} quality @returns {VfxQualityProfile} */
function profileForQuality(quality) {
  if (quality === 'low') {
    return {
      quality: 'low',
      menuParticleCount: 0,
      menuBlurPx: 0,
      menuGlowEnabled: false,
      menuParallaxEnabled: false,
      menuSigilAnimation: false,
      overdriveMode: 'static',
      clashVfxEnabled: false,
      clashIntensityMul: 0,
      rainbowEnabled: false,
      zoomTransitionMsMul: 0,
      zoomDelayMsMul: 0,
    };
  }
  if (quality === 'medium') {
    return {
      quality: 'medium',
      menuParticleCount: 50,
      menuBlurPx: 12,
      menuGlowEnabled: true,
      menuParallaxEnabled: true,
      menuSigilAnimation: true,
      overdriveMode: 'light',
      clashVfxEnabled: true,
      clashIntensityMul: 0.6,
      rainbowEnabled: false,
      zoomTransitionMsMul: 0.5,
      zoomDelayMsMul: 0.5,
    };
  }
  return {
    quality: 'high',
    menuParticleCount: 100,
    menuBlurPx: 26,
    menuGlowEnabled: true,
    menuParallaxEnabled: true,
    menuSigilAnimation: true,
    overdriveMode: 'full',
    clashVfxEnabled: true,
    clashIntensityMul: 1,
    rainbowEnabled: true,
    zoomTransitionMsMul: 1,
    zoomDelayMsMul: 1,
  };
}

/**
 * @param {{ vfxQuality?: string, reduceMotion?: boolean } | null | undefined} settings
 * @returns {VfxQualityProfile}
 */
export function resolveVfxQualityProfile(settings) {
  const s = settings || getDisplaySettings();
  const quality = s.reduceMotion ? 'low' : s.vfxQuality || 'high';
  const safe = quality === 'medium' || quality === 'low' ? quality : 'high';
  return profileForQuality(safe);
}

/** @returns {VfxQualityProfile} */
export function getVfxQualityProfile() {
  return resolveVfxQualityProfile(getDisplaySettings());
}

/**
 * Adatta la variante overdrive al profilo qualità.
 * @param {string} variant
 * @param {VfxQualityProfile} [profile]
 */
export function resolveOverdriveVariantForQuality(variant, profile = getVfxQualityProfile()) {
  if (profile.overdriveMode === 'static') return STATIC_OVERDRIVE;
  if (profile.overdriveMode === 'light') {
    return LIGHT_OVERDRIVE.has(variant) ? variant : HEAVY_OVERDRIVE_FALLBACK;
  }
  return variant;
}

/**
 * Scala i timing presentazione duello in base al profilo.
 * @template {Record<string, unknown>} T
 * @param {T} config
 * @param {VfxQualityProfile} [profile]
 * @returns {T}
 */
export function applyVfxQualityToDuelConfig(config, profile = getVfxQualityProfile()) {
  const next = { ...config };
  const zoomMs = Number(config.zoomTransitionMs);
  const zoomDelay = Number(config.zoomDelayMs);

  if (profile.zoomTransitionMsMul <= 0) {
    next.zoomTransitionMs = 0;
    next.zoomDelayMs = 0;
  } else {
    if (Number.isFinite(zoomMs)) {
      next.zoomTransitionMs = Math.max(0, Math.round(zoomMs * profile.zoomTransitionMsMul));
    }
    if (Number.isFinite(zoomDelay)) {
      next.zoomDelayMs = Math.max(0, Math.round(zoomDelay * profile.zoomDelayMsMul));
    }
  }

  if (!profile.rainbowEnabled) {
    // Intervallo enorme: di fatto disattiva il tick arcobaleno nei loop esistenti
    next.rainbowIntervalMs = 1e9;
    next.rainbowStep = 0;
  }

  return next;
}
