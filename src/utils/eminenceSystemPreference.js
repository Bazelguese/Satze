// Preferenze sistema Eminenza (timing cinematics / avvisi).
// Accesso lab: ?eminenceSystemLab=1
// Persistenza: localStorage — lette in partita da announcements / MarkFlight / satze.

export const EMINENCE_SYSTEM_STORAGE_KEY = 'satze_eminence_system';

/** Default allineati alle costanti canoniche del codice. */
export const EMINENCE_SYSTEM_DEFAULTS = Object.freeze({
  announceHoldMs: 10000,
  sparkReadMs: 1400,
  sparkNoticeGapMs: 320,
  markFlightMs: 900,
  markTrailLingerMs: 560,
});

export const EMINENCE_SYSTEM_TUNABLES = [
  {
    key: 'announceHoldMs',
    label: 'Durata avviso (ms)',
    group: 'Avvisi',
    min: 2000,
    max: 20000,
    step: 250,
    desc: 'Tempo totale in cui resta aperto il banner Eminenza (timer + chiusura coda scintille).',
  },
  {
    key: 'sparkReadMs',
    label: 'Pausa lettura post-scintilla (ms)',
    group: 'Scintille',
    min: 200,
    max: 4000,
    step: 100,
    desc: 'Legacy lab (non chiude più il banner). La chiusura segue «Durata avviso».',
  },
  {
    key: 'sparkNoticeGapMs',
    label: 'Gap tra avvisi (ms)',
    group: 'Scintille',
    min: 0,
    max: 1500,
    step: 40,
    desc: 'Vuoto tra la chiusura di un avviso e l’apertura del successivo.',
  },
  {
    key: 'markFlightMs',
    label: 'Durata volo saetta (ms)',
    group: 'Scintille',
    min: 200,
    max: 2000,
    step: 50,
    desc: 'Tempo di volo della saetta (trail + spark).',
  },
  {
    key: 'markTrailLingerMs',
    label: 'Scia residua (ms)',
    group: 'Scintille',
    min: 0,
    max: 1500,
    step: 40,
    desc: 'Quanto la scia resta dopo l’arrivo, prima di sfumare.',
  },
];

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function readRaw() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EMINENCE_SYSTEM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Snapshot completo (default + override utente). */
export function getEminenceSystemPrefs() {
  const raw = readRaw();
  const next = { ...EMINENCE_SYSTEM_DEFAULTS };
  for (const tunable of EMINENCE_SYSTEM_TUNABLES) {
    if (raw[tunable.key] == null) continue;
    next[tunable.key] = clamp(raw[tunable.key], tunable.min, tunable.max);
  }
  return next;
}

export function setEminenceSystemPrefs(partial) {
  const current = getEminenceSystemPrefs();
  const merged = { ...current };
  for (const tunable of EMINENCE_SYSTEM_TUNABLES) {
    if (partial?.[tunable.key] == null) continue;
    merged[tunable.key] = clamp(partial[tunable.key], tunable.min, tunable.max);
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(EMINENCE_SYSTEM_STORAGE_KEY, JSON.stringify(merged));
  }
  return merged;
}

export function resetEminenceSystemPrefs() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(EMINENCE_SYSTEM_STORAGE_KEY);
  }
  return { ...EMINENCE_SYSTEM_DEFAULTS };
}

export function getEminenceAnnounceHoldMs() {
  return getEminenceSystemPrefs().announceHoldMs;
}

export function getEminenceSparkReadMs() {
  return getEminenceSystemPrefs().sparkReadMs;
}

export function getEminenceSparkNoticeGapMs() {
  return getEminenceSystemPrefs().sparkNoticeGapMs;
}

export function getEminenceMarkFlightMs() {
  return getEminenceSystemPrefs().markFlightMs;
}

export function getEminenceMarkTrailLingerMs() {
  return getEminenceSystemPrefs().markTrailLingerMs;
}
