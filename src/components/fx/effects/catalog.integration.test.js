import { describe, expect, it } from 'vitest';
import { FX_CATALOG } from './catalog.js';
import { FX_EFFECTS } from './index.js';
import { ARMY_COLORS } from '../../../data/armies.js';

describe('catalogo degli effetti carta', () => {
  it('elenca gli stessi effetti di FX_EFFECTS, nello stesso ordine e con gli stessi nomi', () => {
    const fromEffects = FX_EFFECTS.map((fx) => ({ id: fx.id, label: fx.label, kind: fx.kind, army: fx.army ?? null, role: fx.role ?? null }));
    expect(FX_CATALOG).toEqual(fromEffects);
  });

  it('ogni armata ha al più una sconfitta (gli ingressi possono avere più varianti)', () => {
    const armies = FX_CATALOG.filter((fx) => fx.role === 'defeat').map((fx) => fx.army);
    expect(new Set(armies).size).toBe(armies.length);
  });

  it('gli ingressi d\'armata sono effetti in entrata', () => {
    for (const fx of FX_CATALOG.filter((f) => f.role === 'entry')) expect(fx.kind).toBe('in');
  });

  it('ogni armata giocabile ha la sua sconfitta', () => {
    const withDefeat = new Set(FX_CATALOG.filter((fx) => fx.role === 'defeat').map((fx) => fx.army));
    for (const army of Object.keys(ARMY_COLORS)) expect(withDefeat.has(army)).toBe(true);
  });
});
