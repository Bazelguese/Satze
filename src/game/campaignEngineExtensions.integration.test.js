/**
 * Test delle tre estensioni motore ammesse dalla campagna (SPEC_PROTOTIPO_CAMPAGNA §5):
 *  1. Carta senza abilità (`ability: null`) attraversa il duello senza eccezioni.
 *  2. Numero di Campi per missione (`fields: n`, default 5).
 *  3. PV per missione (`enemyLife` / `playerLife`, default 25) — passthrough del motore.
 */
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { selectBattlefields } from './fieldLogic.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { hasOutcome } from './duel/battleEventAssert.js';
import { mulberry32 } from '../utils/seededRandom.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);

function nakedAgent(name, army, overrides = {}) {
  return {
    name,
    army,
    power: 4,
    damage: 3,
    league: 2,
    ability: null,
    ...overrides,
  };
}

const baseInput = {
  field: neutralField,
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 25,
  enemyHP: 25,
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

describe('estensione 1 — carta senza abilità (ability: null)', () => {
  it('completa un duello senza eccezioni e contende il Campo', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: nakedAgent('Nascente', "Figli dell'Orizzonte"),
      enemyAgent: nakedAgent('Nemico', 'Kethran', { power: 3, damage: 2 }),
    });
    expect(['player', 'enemy']).toContain(battleResult.winner);
    expect(battleResult.playerAssault).toBeGreaterThan(0);
    expect(battleResult.enemyAssault).toBeGreaterThan(0);
    expect(hasOutcome(battleResult.events)).toBe(true);
    // Nessun trigger valutato: nessun evento di abilità del giocatore
    const abilityEvents = battleResult.events.filter(
      (e) => e.type === 'abilityTrigger' || e.type === 'abilityEffect'
    );
    expect(abilityEvents).toHaveLength(0);
  });

  it('convive con un avversario dotato di abilità', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: nakedAgent('Nascente', "Figli dell'Orizzonte"),
      enemyAgent: {
        name: 'Abile',
        army: 'Kethran',
        power: 3,
        damage: 2,
        league: 2,
        ability: { trigger: 'turbo', effect: 'power', value: 2 },
      },
    });
    expect(['player', 'enemy']).toContain(battleResult.winner);
    expect(battleResult.finalPlayerHP).toBeGreaterThanOrEqual(0);
    expect(battleResult.finalEnemyHP).toBeGreaterThanOrEqual(0);
  });
});

describe('estensione 2 — numero di Campi per missione (fields: n)', () => {
  it('fieldCount 3 seleziona esattamente 3 campi senza duplicati', () => {
    const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, {
      rng: mulberry32(7),
      fieldCount: 3,
    });
    expect(fields).toHaveLength(3);
    expect(new Set(fields.map((f) => f.id)).size).toBe(3);
  });

  it('fieldCount assente → default 5', () => {
    const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng: mulberry32(7) });
    expect(fields).toHaveLength(5);
  });

  it('fieldCount 7 seleziona 7 campi', () => {
    const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, {
      rng: mulberry32(11),
      fieldCount: 7,
    });
    expect(fields).toHaveLength(7);
  });

  it('fieldCount non valido → default 5', () => {
    const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, {
      rng: mulberry32(3),
      fieldCount: 0,
    });
    expect(fields).toHaveLength(5);
  });

  it('bareHands rispetta fieldCount', () => {
    const fields = selectBattlefields('bareHands', ALL_BATTLEFIELDS, { fieldCount: 3 });
    expect(fields).toHaveLength(3);
    fields.forEach((f) => expect(f.category).toBe('neutral'));
  });
});

describe('estensione 3 — PV per missione (enemyLife)', () => {
  it('il motore parte dai PV passati in input (12) e li riduce coerentemente', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      enemyHP: 12,
      selectedAgent: nakedAgent('Forte', "Figli dell'Orizzonte", { power: 7, damage: 6 }),
      enemyAgent: nakedAgent('Debole', 'Kethran', { power: 1, damage: 1 }),
      selectedFocus: 3,
      enemySelectedFocus: 1,
    });
    expect(battleResult.finalEnemyHP).toBeLessThanOrEqual(12);
    expect(battleResult.finalPlayerHP).toBeLessThanOrEqual(25);
  });
});
