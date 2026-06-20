/**
 * Test di integrazione: esegue `computeDuelResolution` con la catena reale di moduli (Vite resolver).
 * I test in `duel/*.test.js` sono unitari: funzioni isolate con Node --test.
 */
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);
const nexusField = ALL_BATTLEFIELDS.find((f) => f.name === 'Nexus Arcano');
const canyonField = ALL_BATTLEFIELDS.find((f) => f.name === 'Canyon delle Lame');
const paludeField = ALL_BATTLEFIELDS.find((f) => f.name === 'Palude Tossica');
const ossidianaField = ALL_BATTLEFIELDS.find((f) => f.id === 61);
const megeraThroneField = ALL_BATTLEFIELDS.find((f) => f.id === 68);
const cattedraleField = ALL_BATTLEFIELDS.find((f) => f.id === 70);
const circuitoField = ALL_BATTLEFIELDS.find((f) => f.id === 74);
const cameraRitualeField = ALL_BATTLEFIELDS.find((f) => f.id === 79);

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
      expect.objectContaining({ value: 1, minHealth: 10 })
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

  it('Trono d\'Ossidiana raddoppia gli effetti Conquista', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: ossidianaField,
      selectedAgent: agent('Tu', 'Ratti della Megera', { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { 'Ratti della Megera': true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 2, minHealth: 10 })
    );
  });

  it('Trono della Megera attiva Ultimo Desiderio due volte', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: megeraThroneField,
      selectedAgent: agent('Tu', 'Khemet', {
        power: 1,
        damage: 1,
        ability: { trigger: 'lastWish', effect: 'focusCoin', value: 2 },
      }),
      enemyAgent: agent('IA', 'Kethran', { power: 9, damage: 4 }),
    });
    expect(battleResult.winner).toBe('enemy');
    expect(battleResult.finalPlayerFC).toBe(8);
    expect(battleResult.logs.filter((l) => l.includes('Ultimo Desiderio') || l.includes('(2×)')).length).toBeGreaterThan(0);
  });

  it('Cattedrale del Decadimento sostituisce il bonus armata con Tossina 2', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: cattedraleField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { "Figli dell'Orizzonte": true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 2, minHealth: 10 })
    );
  });

  it('Il Circuito fa attivare il Potere del primo con trigger Sfida', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: circuitoField,
      isPlayerFirst: true,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", {
        power: 5,
        damage: 3,
        league: 2,
        ability: { trigger: 'intervention', effect: 'power', value: 3 },
      }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1, league: 4 }),
    });
    expect(battleResult.playerPower).toBe(8);
    expect(battleResult.logs.some((l) => l.includes('TU (Tu)') && l.includes('+3 POT'))).toBe(true);
  });

  it('Camera Rituale aggiunge +1 POT e +1 DAN con Overdrive attivo', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: cameraRitualeField,
      selectedFocus: 5,
      enemySelectedFocus: 5,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 5, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 5, damage: 3 }),
    });
    expect(battleResult.logs.some((l) => l.includes('Camera Rituale') && l.includes('Overdrive'))).toBe(true);
    expect(battleResult.playerAssault).toBe(30);
    expect(battleResult.playerPower).toBe(6);
    expect(battleResult.playerDamage).toBe(4);
  });
});
