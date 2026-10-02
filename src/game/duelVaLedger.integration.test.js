import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';
import { buildDuelVaLedgerRows, duelVaLedgerAt } from './duel/duelVaLedger.js';

const baseInput = {
  selectedFocus: 5, enemySelectedFocus: 2, playerHP: 18, enemyHP: 20, playerFocus: 12, enemyFocus: 12,
  playerUsedCards: [], enemyUsedCards: [], isPlayerFirst: true, lastWinner: null,
  playerArmyBonuses: {}, enemyArmyBonuses: {}, playerToxin: null, enemyToxin: null,
  roundNumber: 3, conqueredFields: {}, playerHand: [], enemyHand: [], currentFieldIndex: 0,
};

describe('Scheda VA sul motore vero', () => {
  it('la conta (POT × FC + modificatori, poi minimo) arriva sempre al VA del motore', () => {
    const agents = ALL_AGENTS.filter((_, i) => i % 4 === 0).slice(0, 30);
    let withMods = 0;
    for (const field of ALL_BATTLEFIELDS) {
      for (let i = 0; i < agents.length; i += 2) {
        const p = agents[i];
        const e = agents[(i * 7 + 3) % agents.length];
        const { battleResult: br } = computeDuelResolution({ ...baseInput, field, selectedAgent: p, enemyAgent: e });
        for (const side of ['player', 'enemy']) {
          const rows = buildDuelVaLedgerRows(br, side);
          if (rows.mods.some((m) => m.row !== 'other')) withMods += 1;
          expect(rows.mods.every((m) => m.row !== 'other'), `${field.name} · ${p.name} vs ${e.name} · ${side}: mod senza fonte`).toBe(true);
          const n = rows.mods.length + (rows.floor ? 1 : 0);
          const end = duelVaLedgerAt(rows, { duelPhase: 3, resolved: n });
          expect(end.va, `${field.name} · ${p.name} vs ${e.name} · ${side}`).toBe(side === 'player' ? br.playerAssault : br.enemyAssault);
        }
      }
    }
    expect(withMods).toBeGreaterThan(0);
  });
});
