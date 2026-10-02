import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';
import { buildDuelHpBursts, scheduleDuelHpEvents, displayedHpAt } from './duel/duelHpPresentation.js';

const baseInput = {
  selectedFocus: 4,
  enemySelectedFocus: 1,
  playerHP: 18,
  enemyHP: 20,
  playerFocus: 12,
  enemyFocus: 12,
  playerUsedCards: [],
  enemyUsedCards: [],
  isPlayerFirst: true,
  lastWinner: null,
  playerArmyBonuses: {},
  enemyArmyBonuses: {},
  playerToxin: null,
  enemyToxin: null,
  roundNumber: 3,
  conqueredFields: {},
  playerHand: [],
  enemyHand: [],
  currentFieldIndex: 0,
};

const byId = (id) => ALL_AGENTS.find((a) => a.id === id);
const fieldByName = (name) => ALL_BATTLEFIELDS.find((f) => f.name === name);

describe('PV nel risultato: raffiche per fonte sul motore vero', () => {
  it('Conquista: Cura 2 dell\'Agente e Miniera di Lacrime: due raffiche, una per fonte', () => {
    const field = fieldByName('Miniera di Lacrime');
    const jerome = byId(1212); // Conquista: Cura 2
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field,
      selectedAgent: jerome,
      enemyAgent: { ...byId(101), power: 1, ability: null },
    });
    expect(battleResult.winner).toBe('player');
    const start = { player: baseInput.playerHP, enemy: baseInput.enemyHP };
    const b = buildDuelHpBursts(battleResult, start);
    const heals = b.aftermath.filter((x) => x.side === 'player' && x.kind === 'heal');
    expect(heals.map((h) => h.label).sort()).toEqual([jerome.name, 'Miniera di Lacrime'].sort());
    expect(heals.every((h) => h.amount === 2)).toBe(true);
    const ev = scheduleDuelHpEvents(battleResult, start);
    expect(displayedHpAt(ev, start, Infinity)).toEqual({ player: battleResult.finalPlayerHP, enemy: battleResult.finalEnemyHP });
  });

  it('su tutti i Campi la sequenza arriva sempre ai PV finali del motore', () => {
    const start = { player: baseInput.playerHP, enemy: baseInput.enemyHP };
    const pairs = [[1212, 101], [101, 211], [112, 311], [1125, 116]];
    for (const field of ALL_BATTLEFIELDS) {
      for (const [p, e] of pairs) {
        const { battleResult } = computeDuelResolution({ ...baseInput, field, selectedAgent: byId(p), enemyAgent: byId(e) });
        const ev = scheduleDuelHpEvents(battleResult, start);
        expect(displayedHpAt(ev, start, Infinity), `${field.name} · ${p} vs ${e}`).toEqual({
          player: battleResult.finalPlayerHP,
          enemy: battleResult.finalEnemyHP,
        });
        // un punto alla volta, sempre
        for (const x of ev) expect(Math.abs(x.to - x.from)).toBe(1);
      }
    }
  });
});
