import { describe, it, expect } from 'vitest';
import { MC_TRAITS, MC_TRAIT_IDS, getMcTrait, resolveTraitChoice } from './mcTraits.js';
import { chooseMonteCarloAction } from './mcSearch.js';
import { viewForSide } from '../../sim/headlessMatch.js';
import { createHeadlessMatch, listPresetDecks } from '../../sim/headlessSetup.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const decks = listPresetDecks();
const SMALL = { rollouts: 400, policyQuality: 0.7, opponentQuality: 0.7, noise: 0 };

function leadView(seed) {
  const s = createHeadlessMatch({ seed, player: decks[4], enemy: decks[16] });
  return viewForSide({ ...s, isPlayerFirst: false }, 'enemy');
}

describe('personalità dell’IA', () => {
  it('Neutrale più otto tratti, ognuno con nome e descrizione', () => {
    expect(MC_TRAIT_IDS).toHaveLength(9);
    for (const id of MC_TRAIT_IDS) {
      expect(MC_TRAITS[id].name).toBeTruthy();
      expect(MC_TRAITS[id].description).toBeTruthy();
    }
    expect(getMcTrait('sconosciuto').id).toBe('neutral');
  });

  it('scelta del menu: id valido, Casuale estrae un tratto, altro → Neutrale', () => {
    expect(resolveTraitChoice('avaro')).toBe('avaro');
    expect(resolveTraitChoice(undefined)).toBe('neutral');
    const rng = mulberry32(3);
    const drawn = new Set(Array.from({ length: 200 }, () => resolveTraitChoice('random', rng)));
    expect(drawn.size).toBe(MC_TRAIT_IDS.length);
  });

  it('il Neutrale decide come senza tratto', () => {
    const view = leadView(9);
    const a = chooseMonteCarloAction(view, SMALL, mulberry32(5));
    const b = chooseMonteCarloAction(view, { ...SMALL, trait: 'neutral' }, mulberry32(5));
    expect([a.fieldIndex, a.cardId, a.focus]).toEqual([b.fieldIndex, b.cardId, b.focus]);
  });

  it('all’inizio l’Impetuoso investe in media più FC del Paziente', () => {
    let impetuoso = 0;
    let paziente = 0;
    for (let seed = 1; seed <= 6; seed += 1) {
      const view = leadView(seed);
      impetuoso += chooseMonteCarloAction(view, { ...SMALL, trait: 'impetuoso' }, mulberry32(seed)).focus;
      paziente += chooseMonteCarloAction(view, { ...SMALL, trait: 'paziente' }, mulberry32(seed)).focus;
    }
    expect(impetuoso).toBeGreaterThan(paziente);
  }, 60000);
});
