import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PLACE_FX,
  DROP_PLACE_FX,
  CLICK_PLACE_FX,
  getPlaceFxPreference,
  setPlaceFxPreference,
  resolvePlaceFxForVia,
  needsTwoFaces,
  placeFxStyleClass,
  pickPlaceFx,
  PLACE_FX_STORAGE_KEY,
} from './placeFxPreference.js';

function mockLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe('placeFxPreference', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it('default e persistenza', () => {
    expect(getPlaceFxPreference()).toEqual(DEFAULT_PLACE_FX);
    setPlaceFxPreference({ drop: 'meteor', click: 'flip', style: 'thunder' });
    expect(getPlaceFxPreference()).toEqual({
      drop: 'meteor',
      click: 'flip',
      style: 'thunder',
    });
    expect(localStorage.getItem(PLACE_FX_STORAGE_KEY)).toBeTruthy();
  });

  it('ignora valori non validi', () => {
    setPlaceFxPreference({ drop: 'nope', click: 'also-nope', style: 'void' });
    expect(getPlaceFxPreference()).toEqual(DEFAULT_PLACE_FX);
  });

  it('resolvePlaceFxForVia con fallback', () => {
    expect(resolvePlaceFxForVia('drop', { drop: 'bounce', click: 'rise', style: null })).toBe('bounce');
    expect(resolvePlaceFxForVia('click', { drop: 'slam', click: 'spiral', style: null })).toBe('spiral');
    expect(pickPlaceFx(DROP_PLACE_FX, 'missing', 'slam')).toBe('slam');
    expect(pickPlaceFx(CLICK_PLACE_FX, 'missing', 'rise')).toBe('rise');
  });

  it('needsTwoFaces e classe stile', () => {
    expect(needsTwoFaces('flip')).toBe(true);
    expect(needsTwoFaces('whirlwind')).toBe(true);
    expect(needsTwoFaces('slam')).toBe(false);
    expect(placeFxStyleClass(null)).toBe('');
    expect(placeFxStyleClass('runic')).toBe(' fxstyle-runic');
  });
});
