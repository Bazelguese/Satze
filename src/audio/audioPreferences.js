/** Preferenze audio (mute / volume SFX), persistite in localStorage. */

export const AUDIO_SETTINGS_STORAGE_KEY = 'satze_audio_settings';
export const AUDIO_SETTINGS_CHANGED_EVENT = 'satze-audio-settings-changed';
export const AUDIO_SETTINGS_SCHEMA_VERSION = 1;

/** @typedef {{
 *   schemaVersion: number,
 *   muted: boolean,
 *   sfxVolume: number,
 * }} AudioSettings */

/** @type {AudioSettings} */
export const DEFAULT_AUDIO_SETTINGS = {
  schemaVersion: AUDIO_SETTINGS_SCHEMA_VERSION,
  muted: false,
  sfxVolume: 0.7,
};

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function clampVolume(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_AUDIO_SETTINGS.sfxVolume;
  return Math.min(1, Math.max(0, n));
}

/**
 * @param {Partial<AudioSettings>|null|undefined} raw
 * @returns {AudioSettings}
 */
export function normalizeAudioSettings(raw) {
  const base = { ...DEFAULT_AUDIO_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  return {
    schemaVersion: AUDIO_SETTINGS_SCHEMA_VERSION,
    muted: Boolean(raw.muted),
    sfxVolume: clampVolume(raw.sfxVolume),
  };
}

/** @returns {AudioSettings} */
export function getAudioSettings() {
  const storage = readStorage();
  if (!storage) return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const raw = storage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    return normalizeAudioSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/**
 * @param {Partial<AudioSettings>} partial
 * @returns {AudioSettings}
 */
export function setAudioSettings(partial) {
  const next = normalizeAudioSettings({ ...getAudioSettings(), ...partial });
  const storage = readStorage();
  if (storage) {
    try {
      storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUDIO_SETTINGS_CHANGED_EVENT, { detail: next }));
  }
  return next;
}

/** @returns {AudioSettings} */
export function resetAudioSettings() {
  return setAudioSettings({ ...DEFAULT_AUDIO_SETTINGS });
}

export function isAudioMuted() {
  return getAudioSettings().muted;
}

export function getSfxVolume() {
  return getAudioSettings().sfxVolume;
}
