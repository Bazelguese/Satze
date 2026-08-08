import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_DISPLAY_SETTINGS,
  normalizeDisplaySettings,
  getDisplaySettings,
  setDisplaySettings,
  DISPLAY_SETTINGS_STORAGE_KEY,
} from './displaySettings.js';
import {
  resolveVfxQualityProfile,
  resolveOverdriveVariantForQuality,
  applyVfxQualityToDuelConfig,
} from './vfxQualityProfile.js';
import { computeViewportScale } from './viewportScale.js';

const memoryStore = new Map();
const localStorageMock = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => { memoryStore.set(k, String(v)); },
  removeItem: (k) => { memoryStore.delete(k); },
  clear: () => { memoryStore.clear(); },
};
globalThis.localStorage = localStorageMock;

describe('displaySettings', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('normalizes unknown values to defaults', () => {
    const n = normalizeDisplaySettings({
      displayMode: 'ultra',
      vfxQuality: 'ultra',
      uiScale: 50,
      resolutionPreset: '999x999',
    });
    expect(n.displayMode).toBe(DEFAULT_DISPLAY_SETTINGS.displayMode);
    expect(n.vfxQuality).toBe(DEFAULT_DISPLAY_SETTINGS.vfxQuality);
    expect(n.uiScale).toBe(DEFAULT_DISPLAY_SETTINGS.uiScale);
    expect(n.resolutionPreset).toBe(DEFAULT_DISPLAY_SETTINGS.resolutionPreset);
  });

  it('persists and reads settings', () => {
    setDisplaySettings({
      vfxQuality: 'low',
      uiScale: 90,
      reduceMotion: true,
      duelLayoutBreath: 'strong',
      cursorSize: 125,
      cursorTrailLength: 16,
      cursorTrailDuration: 700,
    });
    const s = getDisplaySettings();
    expect(s.vfxQuality).toBe('low');
    expect(s.uiScale).toBe(90);
    expect(s.reduceMotion).toBe(true);
    expect(s.duelLayoutBreath).toBe('strong');
    expect(s.cursorSize).toBe(125);
    expect(s.cursorTrailLength).toBe(16);
    expect(s.cursorTrailDuration).toBe(700);
  });

  it('falls back cursor presets to defaults when invalid', () => {
    const n = normalizeDisplaySettings({
      cursorSize: 50,
      cursorTrailLength: 99,
      cursorTrailDuration: 10,
    });
    expect(n.cursorSize).toBe(DEFAULT_DISPLAY_SETTINGS.cursorSize);
    expect(n.cursorTrailLength).toBe(DEFAULT_DISPLAY_SETTINGS.cursorTrailLength);
    expect(n.cursorTrailDuration).toBe(DEFAULT_DISPLAY_SETTINGS.cursorTrailDuration);
  });

  it('resolves duel layout breath class', async () => {
    const { resolveDuelLayoutBreathClass } = await import('./displaySettings.js');
    expect(resolveDuelLayoutBreathClass({ duelLayoutBreath: 'soft', reduceMotion: false }, {})).toBe('mov-1');
    expect(resolveDuelLayoutBreathClass({ duelLayoutBreath: 'strong', reduceMotion: false }, {})).toBe('mov-2');
    expect(resolveDuelLayoutBreathClass({ duelLayoutBreath: 'soft', reduceMotion: false }, { isResult: true })).toBe('mov-0');
    expect(resolveDuelLayoutBreathClass({ duelLayoutBreath: 'strong', reduceMotion: true }, {})).toBe('mov-0');
    expect(resolveDuelLayoutBreathClass({ duelLayoutBreath: 'off', reduceMotion: false }, {})).toBe('mov-0');
  });
});

describe('vfxQualityProfile', () => {
  it('reduceMotion forces low profile', () => {
    const p = resolveVfxQualityProfile({ vfxQuality: 'high', reduceMotion: true });
    expect(p.quality).toBe('low');
    expect(p.menuParticleCount).toBe(0);
    expect(p.clashVfxEnabled).toBe(false);
  });

  it('maps heavy overdrive down on medium', () => {
    const p = resolveVfxQualityProfile({ vfxQuality: 'medium', reduceMotion: false });
    expect(resolveOverdriveVariantForQuality('veil-columns-flood', p)).toBe('veil-columns');
    expect(resolveOverdriveVariantForQuality('heat-rise', p)).toBe('heat-rise');
  });

  it('zeroes zoom transition on low', () => {
    const p = resolveVfxQualityProfile({ vfxQuality: 'low', reduceMotion: false });
    const cfg = applyVfxQualityToDuelConfig(
      { zoomTransitionMs: 1500, zoomDelayMs: 400, rainbowIntervalMs: 50, rainbowStep: 0.05 },
      p,
    );
    expect(cfg.zoomTransitionMs).toBe(0);
    expect(cfg.zoomDelayMs).toBe(0);
    expect(cfg.rainbowStep).toBe(0);
  });
});

describe('computeViewportScale', () => {
  const W = 1920;
  const H = 1080;
  const vw = 1600;
  const vh = 900;
  const fit = Math.min(vw / W, vh / H);

  it('always uses contain fit (uiScale non zoomma il viewport)', () => {
    expect(computeViewportScale(vw, vh, W, H, 1)).toBeCloseTo(fit);
    expect(computeViewportScale(vw, vh, W, H, 1.25)).toBeCloseTo(fit);
    expect(computeViewportScale(vw, vh, W, H, 0.8)).toBeCloseTo(fit);
  });
});
