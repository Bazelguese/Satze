/** Preferenze Duel Layout Lab — localStorage. Non influenzano la partita finché non si promuove un skin. */

export const DUEL_LAYOUT_LAB_STORAGE_KEY = 'satze_duel_layout_lab';

export const STY_OPTIONS = [
  { id: 'sty-a', label: 'Strappo (ufficiale)', note: 'Produzione attuale' },
  { id: 'sty-b', label: 'Stile B', note: 'Già in satze-duello-2_5d.css, non wired' },
  { id: 'sty-c', label: 'Stile C', note: 'Già in satze-duello-2_5d.css, non wired' },
];

export const DEP_OPTIONS = [
  { id: 'dep-1', label: 'Profondità 1' },
  { id: 'dep-2', label: 'Profondità 2.5D (ufficiale)' },
];

export const MOV_OPTIONS = [
  { id: 'mov-0', label: 'Respiro off' },
  { id: 'mov-1', label: 'Respiro soft' },
  { id: 'mov-2', label: 'Respiro strong' },
];

/** Slot CSS per alternative art / layout WIP (classe sul root satze-scene). */
export const ALT_ART_OPTIONS = [
  { id: 'off', label: 'Off', className: '' },
  { id: 'layout-alt', label: 'layout-alt (WIP)', className: 'layout-alt' },
];

export const PHASE_OPTIONS = [
  { id: 'selectField', label: 'Select field' },
  { id: 'selectAgent', label: 'Select agent' },
  { id: 'battle', label: 'Battle strip' },
];

const DEFAULTS = {
  sty: 'sty-a',
  dep: 'dep-2',
  mov: 'mov-1',
  altArt: 'off',
  phase: 'selectAgent',
  showAgents: true,
  showHands: true,
};

function clampChoice(value, options, fallback) {
  return options.some((o) => o.id === value) ? value : fallback;
}

export function loadDuelLayoutLabPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(DUEL_LAYOUT_LAB_STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      sty: clampChoice(parsed?.sty, STY_OPTIONS, DEFAULTS.sty),
      dep: clampChoice(parsed?.dep, DEP_OPTIONS, DEFAULTS.dep),
      mov: clampChoice(parsed?.mov, MOV_OPTIONS, DEFAULTS.mov),
      altArt: clampChoice(parsed?.altArt, ALT_ART_OPTIONS, DEFAULTS.altArt),
      phase: clampChoice(parsed?.phase, PHASE_OPTIONS, DEFAULTS.phase),
      showAgents: parsed?.showAgents !== false,
      showHands: parsed?.showHands !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveDuelLayoutLabPrefs(prefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DUEL_LAYOUT_LAB_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export function resetDuelLayoutLabPrefs() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    window.localStorage.removeItem(DUEL_LAYOUT_LAB_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function resolveAltArtClass(altArtId) {
  return ALT_ART_OPTIONS.find((o) => o.id === altArtId)?.className || '';
}
