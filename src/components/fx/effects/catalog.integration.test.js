import { describe, expect, it } from 'vitest';
import { FX_CATALOG } from './catalog.js';
import { FX_EFFECTS } from './index.js';

describe('catalogo degli effetti carta', () => {
  it('elenca gli stessi effetti di FX_EFFECTS, nello stesso ordine e con gli stessi nomi', () => {
    const fromEffects = FX_EFFECTS.map((fx) => ({ id: fx.id, label: fx.label, kind: fx.kind, army: fx.army ?? null }));
    expect(FX_CATALOG).toEqual(fromEffects);
  });

  it('ogni effetto d\'armata ha un\'armata diversa', () => {
    const armies = FX_CATALOG.filter((fx) => fx.army).map((fx) => fx.army);
    expect(new Set(armies).size).toBe(armies.length);
  });
});
