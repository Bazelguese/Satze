/** Preferenze video / display (Electron-first). */

export const DISPLAY_SETTINGS_STORAGE_KEY = 'satze_display_settings';
export const DISPLAY_SETTINGS_CHANGED_EVENT = 'satze-display-settings-changed';
export const DISPLAY_SETTINGS_SCHEMA_VERSION = 1;

export const DISPLAY_MODES = /** @type {const} */ (['windowed', 'fullscreen', 'borderless']);
export const VFX_QUALITY_LEVELS = /** @type {const} */ (['high', 'medium', 'low']);
/** Densità UI menù (80–125%). Non zoomma/croppa il viewport. */
export const UI_SCALE_PRESETS = /** @type {const} */ ([80, 90, 100, 110, 125]);
/** Scala cursore custom (%). */
export const CURSOR_SIZE_PRESETS = /** @type {const} */ ([75, 100, 125, 150]);
/** Lunghezza scia (n. punti). */
export const CURSOR_TRAIL_LENGTH_PRESETS = /** @type {const} */ ([5, 10, 16]);
/** Durata scia in ms (quanto resta visibile a cursore fermo). */
export const CURSOR_TRAIL_DURATION_PRESETS = /** @type {const} */ ([200, 400, 700]);
/** Respiro layout duello 2.5D: off / soft (mov-1) / strong (mov-2). */
export const DUEL_LAYOUT_BREATH_LEVELS = /** @type {const} */ (['off', 'soft', 'strong']);


export const RESOLUTION_PRESETS = [
  { key: 'native', label: 'Nativa (monitor)' },
  { key: '1280x720', label: '1280 × 720', width: 1280, height: 720 },
  { key: '1366x768', label: '1366 × 768', width: 1366, height: 768 },
  { key: '1600x900', label: '1600 × 900', width: 1600, height: 900 },
  { key: '1920x1080', label: '1920 × 1080', width: 1920, height: 1080 },
  { key: '2560x1440', label: '2560 × 1440', width: 2560, height: 1440 },
];

/** @typedef {{
 *   schemaVersion: number,
 *   displayMode: typeof DISPLAY_MODES[number],
 *   resolutionPreset: string,
 *   customResolution: { width: number, height: number } | null,
 *   vfxQuality: typeof VFX_QUALITY_LEVELS[number],
 *   uiScale: typeof UI_SCALE_PRESETS[number],
 *   reduceMotion: boolean,
 *   duelLayoutBreath: typeof DUEL_LAYOUT_BREATH_LEVELS[number],
 *   cursorSize: typeof CURSOR_SIZE_PRESETS[number],
 *   cursorTrailLength: typeof CURSOR_TRAIL_LENGTH_PRESETS[number],
 *   cursorTrailDuration: typeof CURSOR_TRAIL_DURATION_PRESETS[number],
 *   eminenceFoil: boolean,
 * }} DisplaySettings */

/** @type {DisplaySettings} */
export const DEFAULT_DISPLAY_SETTINGS = {
  schemaVersion: DISPLAY_SETTINGS_SCHEMA_VERSION,
  displayMode: 'windowed',
  resolutionPreset: 'native',
  customResolution: null,
  vfxQuality: 'high',
  uiScale: 100,
  reduceMotion: false,
  duelLayoutBreath: 'soft',
  cursorSize: 100,
  cursorTrailLength: 10,
  cursorTrailDuration: 400,
  /** Lamina foil sulle Eminenze del giocatore in partita. */
  eminenceFoil: false,
};

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function isDisplayMode(v) {
  return DISPLAY_MODES.includes(v);
}

function isVfxQuality(v) {
  return VFX_QUALITY_LEVELS.includes(v);
}

function isUiScale(v) {
  return UI_SCALE_PRESETS.includes(Number(v));
}

function isDuelLayoutBreath(v) {
  return DUEL_LAYOUT_BREATH_LEVELS.includes(v);
}

function isCursorSize(v) {
  return CURSOR_SIZE_PRESETS.includes(Number(v));
}

function isCursorTrailLength(v) {
  return CURSOR_TRAIL_LENGTH_PRESETS.includes(Number(v));
}

function isCursorTrailDuration(v) {
  return CURSOR_TRAIL_DURATION_PRESETS.includes(Number(v));
}

function isResolutionPreset(v) {
  return typeof v === 'string' && RESOLUTION_PRESETS.some((p) => p.key === v);
}

/**
 * @param {unknown} raw
 * @returns {DisplaySettings}
 */
export function normalizeDisplaySettings(raw) {
  const base = { ...DEFAULT_DISPLAY_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const o = /** @type {Record<string, unknown>} */ (raw);

  if (isDisplayMode(o.displayMode)) base.displayMode = o.displayMode;
  if (isResolutionPreset(o.resolutionPreset)) base.resolutionPreset = o.resolutionPreset;
  if (isVfxQuality(o.vfxQuality)) base.vfxQuality = o.vfxQuality;
  if (isUiScale(o.uiScale)) {
    base.uiScale = /** @type {typeof UI_SCALE_PRESETS[number]} */ (Number(o.uiScale));
  }
  if (typeof o.reduceMotion === 'boolean') base.reduceMotion = o.reduceMotion;
  if (typeof o.eminenceFoil === 'boolean') base.eminenceFoil = o.eminenceFoil;
  if (isDuelLayoutBreath(o.duelLayoutBreath)) base.duelLayoutBreath = o.duelLayoutBreath;
  if (isCursorSize(o.cursorSize)) {
    base.cursorSize = /** @type {typeof CURSOR_SIZE_PRESETS[number]} */ (Number(o.cursorSize));
  }
  if (isCursorTrailLength(o.cursorTrailLength)) {
    base.cursorTrailLength = /** @type {typeof CURSOR_TRAIL_LENGTH_PRESETS[number]} */ (Number(o.cursorTrailLength));
  }
  if (isCursorTrailDuration(o.cursorTrailDuration)) {
    base.cursorTrailDuration = /** @type {typeof CURSOR_TRAIL_DURATION_PRESETS[number]} */ (Number(o.cursorTrailDuration));
  }

  if (
    o.customResolution &&
    typeof o.customResolution === 'object' &&
    Number.isFinite(/** @type {{width?: unknown}} */ (o.customResolution).width) &&
    Number.isFinite(/** @type {{height?: unknown}} */ (o.customResolution).height)
  ) {
    base.customResolution = {
      width: Math.round(Number(/** @type {{width: number}} */ (o.customResolution).width)),
      height: Math.round(Number(/** @type {{height: number}} */ (o.customResolution).height)),
    };
  }

  base.schemaVersion = DISPLAY_SETTINGS_SCHEMA_VERSION;
  return base;
}

/** @returns {DisplaySettings} */
export function getDisplaySettings() {
  const storage = readStorage();
  if (!storage) return { ...DEFAULT_DISPLAY_SETTINGS };
  try {
    const raw = storage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_SETTINGS };
    return normalizeDisplaySettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
}

/**
 * @param {Partial<DisplaySettings>} partial
 * @returns {DisplaySettings}
 */
export function setDisplaySettings(partial) {
  const next = normalizeDisplaySettings({ ...getDisplaySettings(), ...partial });
  const storage = readStorage();
  if (storage) {
    try {
      storage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  applyDisplaySettingsToDom(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DISPLAY_SETTINGS_CHANGED_EVENT, { detail: next }));
  }
  return next;
}

/** @returns {DisplaySettings} */
export function resetDisplaySettings() {
  return setDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS });
}

/** Payload inviato a Electron per ridimensionare la finestra. */
export function toElectronDisplayPayload(settings = getDisplaySettings()) {
  const s = normalizeDisplaySettings(settings);
  return {
    displayMode: s.displayMode,
    resolutionPreset: s.resolutionPreset,
    customResolution: s.customResolution,
  };
}

/**
 * Applica scala UI + classe reduce-motion sul document.
 * @param {DisplaySettings} [settings]
 */
export function applyDisplaySettingsToDom(settings = getDisplaySettings()) {
  if (typeof document === 'undefined') return;
  const s = normalizeDisplaySettings(settings);
  const root = document.documentElement;
  root.style.setProperty('--satze-ui-scale', String(s.uiScale / 100));
  root.classList.toggle('satze-reduce-motion', s.reduceMotion);
  document.body?.classList.toggle('satze-reduce-motion', s.reduceMotion);
}

/**
 * Trattamento visuale Eminenza in partita per lato.
 * Il giocatore locale usa la preferenza; l'avversario solo se `opponentFoil` è true (es. MP).
 * @param {'player'|'enemy'} side
 * @param {DisplaySettings | null | undefined} [settings]
 * @param {{ opponentFoil?: boolean }} [opts]
 * @returns {'arena'|'holo'}
 */
export function resolveEminenceCardLife(side, settings, opts = {}) {
  const s = normalizeDisplaySettings(settings || getDisplaySettings());
  if (side === 'player') return s.eminenceFoil ? 'holo' : 'arena';
  return opts.opponentFoil ? 'holo' : 'arena';
}

/**
 * Classe CSS `mov-*` per il respiro del layout duello.
 * In fase result o con reduceMotion → sempre `mov-0`.
 * @param {DisplaySettings | null | undefined} settings
 * @param {{ isResult?: boolean }} [opts]
 * @returns {'mov-0'|'mov-1'|'mov-2'}
 */
export function resolveDuelLayoutBreathClass(settings, opts = {}) {
  const s = normalizeDisplaySettings(settings || getDisplaySettings());
  if (opts.isResult || s.reduceMotion || s.duelLayoutBreath === 'off') return 'mov-0';
  if (s.duelLayoutBreath === 'strong') return 'mov-2';
  return 'mov-1';
}

export function hasElectronDisplayApi() {
  return typeof window !== 'undefined' && !!window.electronAPI?.display?.apply;
}

/**
 * @param {DisplaySettings} [settings]
 * @returns {Promise<{ ok: boolean, error?: string, warning?: string }>}
 */
export async function applyElectronDisplay(settings = getDisplaySettings()) {
  if (!hasElectronDisplayApi()) {
    return { ok: false, error: 'API display non disponibile (avvia il client Electron).' };
  }
  try {
    const result = await window.electronAPI.display.apply(toElectronDisplayPayload(settings));
    return result && typeof result === 'object' ? result : { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
