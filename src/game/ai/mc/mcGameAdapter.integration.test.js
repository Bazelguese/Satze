import { describe, it, expect } from 'vitest';
import {
  buildMcViewFromGameState,
  chooseMonteCarloDecision,
  isMonteCarloSupported,
  serializeMcView,
} from './mcGameAdapter.js';
import { createHeadlessMatch, listPresetDecks } from '../../sim/headlessSetup.js';

const decks = listPresetDecks();

function gameState(extra = {}) {
  const s = createHeadlessMatch({ seed: 31, player: decks[2], enemy: decks[9] });
  return {
    ...s,
    gameMode: 'classic',
    aiDifficulty: 'hard',
    selectedFocus: 7,
    enemySelectedFocus: 3,
    ...extra,
  };
}

describe('adattatore motore a simulazione', () => {
  it('si usa in Classico e Mani nude contro l’IA locale, non in Campagna né online', () => {
    expect(isMonteCarloSupported(gameState())).toBe(true);
    expect(isMonteCarloSupported(gameState({ gameMode: 'bareHands' }))).toBe(true);
    expect(isMonteCarloSupported(gameState({ campaignDuelMod: { initiativeProfile: 'assault' } }))).toBe(false);
    expect(isMonteCarloSupported(gameState({ gameMode: 'campaign' }))).toBe(false);
    expect(isMonteCarloSupported(gameState({ aiDifficulty: 'multiplayer' }))).toBe(false);
  });

  it('la vista non contiene i FC del giocatore; il suo Agente solo se ha schierato per primo', () => {
    const base = gameState();
    const agent = base.playerHand[0];
    const leading = buildMcViewFromGameState({ ...base, isPlayerFirst: false, selectedAgent: agent });
    expect(leading.selectedAgent).toBeNull();
    const responding = buildMcViewFromGameState({ ...base, isPlayerFirst: true, selectedAgent: agent, currentFieldIndex: 0 });
    expect(responding.selectedAgent).toBe(agent);
    for (const view of [leading, responding]) {
      expect(view).not.toHaveProperty('selectedFocus');
      expect(view).not.toHaveProperty('enemySelectedFocus');
    }
  });

  it('decisione nella forma di useAI, anche dopo la serializzazione per il worker', () => {
    const view = serializeMcView(buildMcViewFromGameState({ ...gameState(), isPlayerFirst: false }));
    const decision = chooseMonteCarloDecision(view, 'easy', { seed: 5, maxMs: 3000 });
    expect(decision.card?.id).toBe(decision.cardId);
    expect(view.enemyHand.map((c) => c.id)).toContain(decision.cardId);
    expect(decision.fieldIndex).not.toBeNull();
    expect(decision.focus).toBeGreaterThanOrEqual(1);
    expect(decision.debug.engine).toBe('montecarlo');
  });

  it('la personalità arriva al motore e compare nel debug', () => {
    const view = serializeMcView(buildMcViewFromGameState({ ...gameState(), isPlayerFirst: false }));
    const decision = chooseMonteCarloDecision(view, 'easy', { seed: 5, maxMs: 3000, trait: 'avaro' });
    expect(decision.debug.trait).toBe('avaro');
  });
});

describe('vincoli di schieramento delle Eminenze nel motore a simulazione', () => {
  it('Caccia: l\'Agente imposto è l\'unico candidato; senza vincoli restano tutti', async () => {
    const { buildMcViewFromGameState } = await import('./mcGameAdapter.js');
    const { generateMcCandidates } = await import('./mcSearch.js');
    const hand = [{ id: 1, league: 2, power: 3, damage: 2 }, { id: 2, league: 2, power: 3, damage: 2 }];
    const base = {
      battlefields: [{ id: 51 }], currentFieldIndex: 0, enemyHand: hand, playerHand: [],
      enemyUsedCards: [], playerUsedCards: [], enemyFocus: 6, playerFocus: 6, playerHP: 20, enemyHP: 20,
    };
    const free = buildMcViewFromGameState(base);
    expect(free.enemyDeployableCardIds).toBeNull();
    expect(new Set(generateMcCandidates(free).map((c) => c.cardId))).toEqual(new Set([1, 2]));

    const forced = buildMcViewFromGameState({
      ...base,
      eminenceMatchState: { enemy: { round: { deployConstraints: { forcedCardId: 2, bannedCardIds: [], revivedCardIds: [] } } } },
    });
    expect(forced.enemyDeployableCardIds).toEqual([2]);
    expect(new Set(generateMcCandidates(forced).map((c) => c.cardId))).toEqual(new Set([2]));
  });
});
