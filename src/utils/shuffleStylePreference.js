import { SHUFFLE_META } from '../components/shuffle/shuffleKit';

export const SHUFFLE_STYLE_STORAGE_KEY = 'satze_shuffle_style';
export const CLASSIC_SHUFFLE_KIND = 'classic';
export const DEFAULT_SHUFFLE_KIND = 'overhandCut';

export const SHUFFLE_STYLE_OPTIONS = [
  {
    key: CLASSIC_SHUFFLE_KIND,
    title: 'Classica',
    sub: 'FAN',
    desc: 'Ventaglio e rimescolamento rapido (animazione originale).',
  },
  ...SHUFFLE_META,
];

const VALID_KEYS = new Set(SHUFFLE_STYLE_OPTIONS.map((o) => o.key));

export function isValidShuffleKind(kind) {
  return VALID_KEYS.has(kind);
}

function readStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

export function getShuffleStyle() {
  const storage = readStorage();
  if (!storage) return DEFAULT_SHUFFLE_KIND;
  try {
    const stored = storage.getItem(SHUFFLE_STYLE_STORAGE_KEY);
    return stored && isValidShuffleKind(stored) ? stored : DEFAULT_SHUFFLE_KIND;
  } catch {
    return DEFAULT_SHUFFLE_KIND;
  }
}

export function setShuffleStyle(kind) {
  if (!isValidShuffleKind(kind)) return;
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.setItem(SHUFFLE_STYLE_STORAGE_KEY, kind);
  } catch {
    /* ignore quota */
  }
}

export function getShuffleStyleMeta(kind) {
  return SHUFFLE_STYLE_OPTIONS.find((o) => o.key === kind) ?? SHUFFLE_STYLE_OPTIONS[1];
}

/** Stile shuffle casuale (classica + 9 kit) — usato per l'avversario. */
export function pickRandomShuffleKind() {
  const idx = Math.floor(Math.random() * SHUFFLE_STYLE_OPTIONS.length);
  return SHUFFLE_STYLE_OPTIONS[idx].key;
}

/** Shuffle avversario casuale, mai uguale a quello del giocatore se possibile. */
export function pickRandomEnemyShuffleKind(excludeKind = null) {
  const pool = excludeKind
    ? SHUFFLE_STYLE_OPTIONS.filter((o) => o.key !== excludeKind)
    : SHUFFLE_STYLE_OPTIONS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].key;
}

/** Coppia stili per un duello: giocatore = scelta, avversario = random diverso. */
export function resolveShuffleKindsForDuel(playerKind = getShuffleStyle()) {
  return {
    playerShuffleKind: playerKind,
    enemyShuffleKind: pickRandomEnemyShuffleKind(playerKind),
  };
}
