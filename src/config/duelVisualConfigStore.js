// ============================================
// Persistenza override VFX duello (localStorage)
// ============================================

import {
  DUEL_VISUAL_DEFAULTS,
  DUEL_VISUAL_DEFAULTS_VERSION,
  DUEL_VISUAL_STORAGE_KEY,
  DUEL_VFX_CHANGED_EVENT,
  mergeDuelVisualConfig,
} from './duelVisualConfig.js';

const STORAGE_VERSION_KEY = '__version';

function safeParse(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}

export function loadDuelVisualOverrides() {
  if (typeof window === 'undefined') return {};
  const parsed = safeParse(window.localStorage.getItem(DUEL_VISUAL_STORAGE_KEY));
  return parsed || {};
}

function stripStorageMeta(overrides) {
  if (!overrides || typeof overrides !== 'object') return {};
  const { [STORAGE_VERSION_KEY]: _v, ...rest } = overrides;
  return rest;
}

function persistOverrides(next) {
  if (typeof window === 'undefined') return;
  const payload = { ...next, [STORAGE_VERSION_KEY]: DUEL_VISUAL_DEFAULTS_VERSION };
  const keys = Object.keys(payload).filter((k) => k !== STORAGE_VERSION_KEY);
  if (keys.length === 0) {
    window.localStorage.removeItem(DUEL_VISUAL_STORAGE_KEY);
  } else {
    window.localStorage.setItem(DUEL_VISUAL_STORAGE_KEY, JSON.stringify(payload));
  }
}

/** Allinea override localStorage se i default di timing sono stati aggiornati. */
function migrateDuelVisualOverrides(overrides) {
  const version = Number(overrides?.[STORAGE_VERSION_KEY]) || 1;
  if (version >= DUEL_VISUAL_DEFAULTS_VERSION) {
    return stripStorageMeta(overrides);
  }
  const next = stripStorageMeta(overrides);
  for (const key of Object.keys(DUEL_VISUAL_DEFAULTS)) {
    delete next[key];
  }
  persistOverrides(next);
  return next;
}

export function getDuelVisualConfig() {
  const raw = loadDuelVisualOverrides();
  const migrated = migrateDuelVisualOverrides(raw);
  return mergeDuelVisualConfig(migrated);
}

/**
 * @param {Record<string, unknown>} partial — solo chiavi note; altre ignorate al merge
 */
export function saveDuelVisualOverrides(partial) {
  if (typeof window === 'undefined') return;
  const current = stripStorageMeta(loadDuelVisualOverrides());
  const next = { ...current };
  for (const key of Object.keys(partial)) {
    if (key in DUEL_VISUAL_DEFAULTS) {
      const v = partial[key];
      if (v === undefined || v === '') delete next[key];
      else next[key] = v;
    }
  }
  persistOverrides(next);
  window.dispatchEvent(new CustomEvent(DUEL_VFX_CHANGED_EVENT));
}

export function resetDuelVisualOverrides() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DUEL_VISUAL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(DUEL_VFX_CHANGED_EVENT));
}
