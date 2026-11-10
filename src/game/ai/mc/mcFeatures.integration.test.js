import { describe, it, expect } from 'vitest';
import { MC_FEATURE_NAMES, buildFeatureContext, moveFeatures, cheapTriggerReady } from './mcFeatures.js';
import { getLearnedWeights } from './learnedPolicy.js';
import { createFastPolicyAgent } from './mcPolicy.js';
import { viewForSide, availableCards } from '../../sim/headlessMatch.js';
import { createHeadlessMatch, listPresetDecks } from '../../sim/headlessSetup.js';
import { mulberry32 } from '../../../utils/seededRandom.js';

const decks = listPresetDecks();
const state = createHeadlessMatch({ seed: 4, player: decks[0], enemy: decks[20] });

describe('caratteristiche della politica addestrata', () => {
  it('un valore per nome, tutti finiti', () => {
    const view = viewForSide({ ...state, isPlayerFirst: false }, 'enemy');
    const ctx = buildFeatureContext(view);
    for (const card of ctx.cards) {
      const x = moveFeatures(view, card, 3, ctx);
      expect(x).toHaveLength(MC_FEATURE_NAMES.length);
      for (const v of x) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('Imboscata pronta solo con l’iniziativa; risposta con margine sull’Agente visibile', () => {
    const card = { id: 1, power: 4, damage: 2, ability: { trigger: 'imboscata' } };
    const lead = viewForSide({ ...state, isPlayerFirst: false }, 'enemy');
    const resp = viewForSide({ ...state, isPlayerFirst: true, currentFieldIndex: 0 }, 'enemy', state.playerHand[0]);
    expect(cheapTriggerReady(card, lead, buildFeatureContext(lead))).toBe(1);
    expect(cheapTriggerReady(card, resp, buildFeatureContext(resp))).toBe(0);
    const ctx = buildFeatureContext(resp);
    const idx = MC_FEATURE_NAMES.indexOf('respond');
    expect(moveFeatures(resp, availableCards(resp, 'enemy')[0], 2, ctx)[idx]).toBe(1);
  });

  it('pesi con caratteristiche diverse vengono rifiutati', () => {
    expect(getLearnedWeights({ features: ['x'], weights: [1] })).toBeNull();
    const ok = { features: MC_FEATURE_NAMES, weights: MC_FEATURE_NAMES.map(() => 0) };
    expect(getLearnedWeights(ok)).toHaveLength(MC_FEATURE_NAMES.length);
  });

  it('la politica addestrata sceglie mosse legali', () => {
    const view = viewForSide({ ...state, isPlayerFirst: false }, 'enemy');
    const agent = createFastPolicyAgent(mulberry32(1), { learnedWeights: MC_FEATURE_NAMES.map(() => 0.1) });
    const choice = agent.lead(view);
    expect(availableCards(view, 'enemy').map((c) => c.id)).toContain(choice.cardId);
    expect(choice.focus).toBeGreaterThanOrEqual(1);
  });
});
