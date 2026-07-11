import { describe, expect, it, beforeEach } from 'vitest';
import {
  CLASSIC_SHUFFLE_KIND,
  DEFAULT_SHUFFLE_KIND,
  getShuffleStyle,
  setShuffleStyle,
  isValidShuffleKind,
  pickRandomEnemyShuffleKind,
  pickRandomShuffleKind,
  resolveShuffleKindsForDuel,
  SHUFFLE_STYLE_OPTIONS,
} from './shuffleStylePreference';

function mockLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe('shuffleStylePreference', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it('espone classica + 9 stili dal kit', () => {
    expect(SHUFFLE_STYLE_OPTIONS.length).toBe(10);
    expect(SHUFFLE_STYLE_OPTIONS[0].key).toBe(CLASSIC_SHUFFLE_KIND);
    expect(isValidShuffleKind('fountain')).toBe(true);
    expect(isValidShuffleKind('unknown')).toBe(false);
  });

  it('persiste la scelta in localStorage', () => {
    expect(getShuffleStyle()).toBe(DEFAULT_SHUFFLE_KIND);
    setShuffleStyle('riffle');
    expect(getShuffleStyle()).toBe('riffle');
  });

  it('pickRandomShuffleKind restituisce una chiave valida', () => {
    for (let i = 0; i < 20; i++) {
      expect(isValidShuffleKind(pickRandomShuffleKind())).toBe(true);
    }
  });

  it('pickRandomEnemyShuffleKind evita lo stile del giocatore', () => {
    for (let i = 0; i < 30; i++) {
      expect(pickRandomEnemyShuffleKind('fountain')).not.toBe('fountain');
    }
  });

  it('resolveShuffleKindsForDuel assegna stili distinti', () => {
    setShuffleStyle('riffle');
    const kinds = resolveShuffleKindsForDuel();
    expect(kinds.playerShuffleKind).toBe('riffle');
    expect(kinds.enemyShuffleKind).not.toBe('riffle');
    expect(isValidShuffleKind(kinds.enemyShuffleKind)).toBe(true);
  });
});
