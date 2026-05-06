/**
 * Test di integrazione: esegue `computeDuelResolution` con la catena reale di moduli (Vite resolver).
 * I test in `duel/*.test.js` sono unitari: funzioni isolate con Node --test.
 */
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.name === 'Passo delle Termopili');
const nexusField = ALL_BATTLEFIELDS.find((f) => f.name === 'Nexus Arcano');
const canyonField = ALL_BATTLEFIELDS.find((f) => f.name === 'Canyon delle Lame');
const paludeField = ALL_BATTLEFIELDS.find((f) => f.name === 'Palude Tossica');

function agent(name, army, overrides = {}) {
  return {
    name,
    army,
    power: 5,
    damage: 3,
    league: 2,
    ...overrides,
  };
}

const baseInput = {
  field: neutralField,
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 20,
  enemyHP: 20,
  playerFocus: 6,
  enemyFocus: 6,
  playerUsedCards: [],
  enemyUsedCards: [],
  isPlayerFirst: true,
  lastWinner: null,
  playerArmyBonuses: {},
  enemyArmyBonuses: {},
  playerToxin: null,
  enemyToxin: null,
  roundNumber: 1,
  conqueredFields: {},
  playerHand: [],
  enemyHand: [],
  currentFieldIndex: 0,
};

describe('computeDuelResolution (integrazione)', () => {
  it('completa un duello neutro e restituisce esito coerente', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte"),
      enemyAgent: agent('IA', 'Kethran', { power: 3, damage: 2 }),
    });
    expect(['player', 'enemy']).toContain(battleResult.winner);
    expect(battleResult.playerAssault).toBeGreaterThan(0);
    expect(battleResult.enemyAssault).toBeGreaterThan(0);
    expect(battleResult.logs.length).toBeGreaterThan(3);
    expect(battleResult.finalPlayerHP).toBeGreaterThanOrEqual(0);
    expect(battleResult.finalEnemyHP).toBeGreaterThanOrEqual(0);
  });

  it('con POT nettamente superiore il giocatore vince lo scontro', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 4 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerAssault).toBeGreaterThan(battleResult.enemyAssault);
  });

  it('Nexus Arcano tappa il DAN a 4 nel risultato', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: nexusField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 8, damage: 9 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerDamage).toBe(4);
    expect(battleResult.logs.some((l) => l.includes('Nexus Arcano') && l.includes('max'))).toBe(true);
  });

  it('Canyon delle Lame aggiunge +2 al DAN inflitto al perdente', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: canyonField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerDamage).toBe(3);
    expect(battleResult.damageDealt).toBe(5);
    expect(battleResult.logs.some((l) => l.includes('Canyon delle Lame') && l.includes('+2'))).toBe(true);
  });

  it('bonus Conquista (Ratti della Megera) attiva tossina sull\'IA a vittoria', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', 'Ratti della Megera', { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { 'Ratti della Megera': true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 2, minHealth: 4 })
    );
    expect(battleResult.logs.some((l) => l.includes('Tossina') && l.includes('IA'))).toBe(true);
  });

  it('Palude Tossica toglie 1 PV a entrambi dopo lo scontro', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: paludeField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(19);
    expect(battleResult.logs.some((l) => l.includes('Palude Tossica'))).toBe(true);
  });
});
