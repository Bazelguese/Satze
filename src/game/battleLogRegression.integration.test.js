import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import {
  eventsInPhase,
  hasFieldRule,
  hasStatChange,
} from './duel/battleEventAssert.js';

function agent(name, army, overrides = {}) {
  return { name, army, power: 5, damage: 3, league: 2, id: overrides.id ?? name, ...overrides };
}

const baseInput = {
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
  roundNumber: 2,
  conqueredFields: {},
  playerHand: [],
  enemyHand: [],
  currentFieldIndex: 0,
};

function fieldByName(name) {
  return ALL_BATTLEFIELDS.find((f) => f.name === name);
}

describe('battle log events â€” regressioni D1', () => {
  it('Altopiano delle Tre Lune emette statChange in fase effects, non nel result', () => {
    const field = ALL_BATTLEFIELDS.find((f) => f.id === 2);
    expect(field).toBeTruthy();
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte"),
      enemyAgent: agent('IA', 'Kethran'),
    });
    const lunaChanges = (battleResult.events || []).filter(
      (e) =>
        e.type === 'statChange' &&
        (String(e.source?.id) === String(field.id) || e.source?.name === field.name)
    );
    expect(lunaChanges.length).toBeGreaterThan(0);
    expect(lunaChanges.every((e) => e.phase === 'effects')).toBe(true);
    expect(lunaChanges.every((e) => e.revealAt === 'abilityFx')).toBe(true);
    expect(eventsInPhase(lunaChanges, 'result').length).toBe(0);
  });

  it('campo cap-FC emette regola o transizione FC senza dipende dal nome visuale', () => {
    const field =
      ALL_BATTLEFIELDS.find((f) => f.id === 36) ||
      fieldByName('Il Pozzo Gravitazionale');
    expect(field).toBeTruthy();
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field,
      selectedFocus: 5,
      enemySelectedFocus: 5,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte"),
      enemyAgent: agent('IA', 'Kethran'),
    });
    const byId = hasFieldRule(battleResult.events, 'maxFC', field.id);
    const fcCap = (battleResult.events || []).some(
      (e) =>
        e.type === 'statChange' &&
        e.stat === 'FC' &&
        String(e.source?.id) === String(field.id)
    );
    expect(byId || fcCap).toBe(true);
    // Rename visuale non rompe: classificazione via id
    const renamed = { ...field, name: 'Campo Rinominato XYZ' };
    const { battleResult: renamedResult } = computeDuelResolution({
      ...baseInput,
      field: renamed,
      selectedFocus: 5,
      enemySelectedFocus: 5,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte"),
      enemyAgent: agent('IA', 'Kethran'),
    });
    expect(hasFieldRule(renamedResult.events, 'maxFC', field.id) || hasStatChange(renamedResult.events, { stat: 'FC' })).toBe(
      true
    );
  });

  it('Nebulosa / Sanctum / Gran Corno producono eventi di campo (id-based)', () => {
    const idsOrNames = [
      { id: 1, name: 'Gran Corno' },
      { name: 'Nebulosa dei Ricordi' },
      { name: "Sanctum dell'Equilibrio" },
    ];
    for (const ref of idsOrNames) {
      const field =
        (ref.id != null && ALL_BATTLEFIELDS.find((f) => f.id === ref.id)) ||
        fieldByName(ref.name);
      expect(field).toBeTruthy();
      const { battleResult } = computeDuelResolution({
        ...baseInput,
        field,
        selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 6 }),
        enemyAgent: agent('IA', 'Kethran', { power: 6 }),
      });
      const fromField = (battleResult.events || []).some(
        (e) =>
          String(e.source?.id) === String(field.id) &&
          (e.type === 'statChange' || e.type === 'fieldRule' || e.type === 'resourceChange')
      );
      expect(fromField).toBe(true);
    }
  });

  it('blocco immune emette block solo quando l\'effetto Ã¨ annullato', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: ALL_BATTLEFIELDS.find((f) => f.id === 51),
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", {
        ability: { trigger: null, effect: 'enemyPower', value: -2 },
      }),
      enemyAgent: agent('IA', 'Kethran', {
        ability: { trigger: null, effect: 'immune' },
      }),
    });
    const immuneBlocks = (battleResult.events || []).filter(
      (e) => e.type === 'block' && e.blockedBy === 'immune'
    );
    expect(immuneBlocks.length).toBeGreaterThan(0);
    expect(battleResult.events.some((e) => e.debugNote === 'Immune attivo')).toBe(false);
  });
});

