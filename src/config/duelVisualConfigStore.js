// ============================================
// Persistenza override VFX duello (localStorage)
// ============================================

import {
  DUEL_VISUAL_DEFAULTS,
  DUEL_VISUAL_STORAGE_KEY,
  DUEL_VFX_CHANGED_EVENT,
  mergeDuelVisualConfig,
} from './duelVisualConfig.js';

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

export function getDuelVisualConfig() {
  return mergeDuelVisualConfig(loadDuelVisualOverrides());
}

/**
 * @param {Record<string, unknown>} partial — solo chiavi note; altre ignorate al merge
 */
export function saveDuelVisualOverrides(partial) {
  if (typeof window === 'undefined') return;
  const current = loadDuelVisualOverrides();
  const next = { ...current };
  for (const key of Object.keys(partial)) {
    if (key in DUEL_VISUAL_DEFAULTS) {
      const v = partial[key];
      if (v === undefined || v === '') delete next[key];
      else next[key] = v;
    }
  }
  if (Object.keys(next).length === 0) {
    window.localStorage.removeItem(DUEL_VISUAL_STORAGE_KEY);
  } else {
    window.localStorage.setItem(DUEL_VISUAL_STORAGE_KEY, JSON.stringify(next));
  }
  window.dispatchEvent(new CustomEvent(DUEL_VFX_CHANGED_EVENT));
}

export function resetDuelVisualOverrides() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DUEL_VISUAL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(DUEL_VFX_CHANGED_EVENT));
}
