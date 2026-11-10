import { describe, it, expect } from 'vitest';
import { deckPairForSeed, runPairing } from './selfPlay.js';

describe('torneo IA contro IA', () => {
  it('ogni seme dà due mazzi di armate diverse, sempre gli stessi', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const [a, b] = deckPairForSeed(seed);
      expect(a.army).not.toBe(b.army);
      expect(deckPairForSeed(seed)).toEqual([a, b]);
    }
  });

  it('ogni seme si gioca due volte a lati scambiati, con gli stessi mazzi', () => {
    const records = runPairing({ a: 'greedy', b: 'random', seeds: [5, 6] });
    expect(records).toHaveLength(4);
    const [first, second] = records;
    expect(first.seed).toBe(second.seed);
    expect([first.aSide, second.aSide]).toEqual(['player', 'enemy']);
    expect(first.decks.player).toEqual(second.decks.player);
    expect(first.decks.enemy).toEqual(second.decks.enemy);
    expect(first.aOpened).not.toBe(second.aOpened);
    for (const r of records) expect(['win', 'loss', 'draw']).toContain(r.outcome);
  });
});

describe('varianti di profilo per esperimenti', () => {
  it('legge “livello@chiave=valore;…” con numeri, booleani e testo', async () => {
    const { parseAgentSpec } = await import('./simAgents.js');
    expect(parseAgentSpec('hard')).toEqual({ base: 'hard', overrides: null });
    expect(parseAgentSpec('hard@riskWeight=0.2;allowMaxFocusScenario=false;cardAggregation=weighted')).toEqual({
      base: 'hard',
      overrides: { riskWeight: 0.2, allowMaxFocusScenario: false, cardAggregation: 'weighted' },
    });
  });
});

describe('motore a simulazione nel banco di prova', () => {
  it('gioca partite complete con sole mosse legali', () => {
    const records = runPairing({ a: 'mc-hard@rollouts=60', b: 'greedy', seeds: [3] });
    expect(records).toHaveLength(2);
    for (const r of records) expect(r.statsA.fixes).toBe(0);
  });
});
