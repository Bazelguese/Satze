import { describe, it, expect } from 'vitest';
import { ARMY_COLORS } from '../data/armies.js';
import { getHandAccentColor } from './deckManager.js';

function mockHand(counts) {
  return Object.entries(counts).flatMap(([army, n]) =>
    Array.from({ length: n }, () => ({ army })),
  );
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

describe('getHandAccentColor — fusione oklch', () => {
  it('mono-armata: restituisce accent puro', () => {
    const hand = mockHand({ Kethran: 5 });
    expect(getHandAccentColor(hand, ARMY_COLORS)).toBe(ARMY_COLORS.Kethran.accent);
  });

  it('misto Kethran+Orathai: saturazione alta (non fango RGB)', () => {
    const hand = mockHand({ Kethran: 3, Orathai: 2 });
    const fused = getHandAccentColor(hand, ARMY_COLORS);
    const { s } = hexToHsl(fused);
    expect(s).toBeGreaterThanOrEqual(48);
    expect(fused).not.toBe('#a9c762');
  });

  it('misto Corte Rossa+Orathai: non grigio-rosa spento', () => {
    const hand = mockHand({ 'Corte Rossa': 3, Orathai: 2 });
    const fused = getHandAccentColor(hand, ARMY_COLORS);
    const { s } = hexToHsl(fused);
    expect(s).toBeGreaterThanOrEqual(48);
    expect(fused).not.toBe('#a47b85');
  });

  it('misto Kethran+Orathai: resta vicino al dominante (tinta leggera)', () => {
    const hand = mockHand({ Kethran: 3, Orathai: 2 });
    const fused = getHandAccentColor(hand, ARMY_COLORS);
    const dominant = hexToHsl(ARMY_COLORS.Kethran.accent);
    const { h } = hexToHsl(fused);
    const hueDelta = Math.abs(((h - dominant.h + 540) % 360) - 180);
    expect(hueDelta).toBeLessThan(35);
  });

  it('mano vuota: fallback', () => {
    expect(getHandAccentColor([], ARMY_COLORS, '#112233')).toBe('#112233');
  });
});
