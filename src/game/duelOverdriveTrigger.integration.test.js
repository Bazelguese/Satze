import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';
import { overdriveCoinThreshold } from './duel/duelOverdriveTrigger.js';

const baseInput = {
  selectedFocus: 5, enemySelectedFocus: 2, playerHP: 18, enemyHP: 20, playerFocus: 12, enemyFocus: 12,
  playerUsedCards: [], enemyUsedCards: [], isPlayerFirst: true, lastWinner: null,
  playerArmyBonuses: {}, enemyArmyBonuses: {}, playerToxin: null, enemyToxin: null,
  roundNumber: 3, conqueredFields: {}, playerHand: [], enemyHand: [], currentFieldIndex: 0,
};
const byId = (id) => ALL_AGENTS.find((a) => a.id === id);
const field = (name) => ALL_BATTLEFIELDS.find((f) => f.name === name);
const plain = ALL_BATTLEFIELDS.find((f) => !/overdrive/i.test(`${f.effect || ''} ${f.name}`) && f.id !== 29 && f.id !== 44);
const sorethai = byId(101); // Potere: Overdrive: -8 VA nem. (min 6)
const vega = byId(116); // Potere senza Overdrive

const run = (over) => computeDuelResolution({ ...baseInput, field: plain, selectedAgent: sorethai, enemyAgent: vega, ...over }).battleResult;

describe('Overdrive sulla carta nel duello', () => {
  it('Potere Overdrive con 5 FC: si accende alla 5ª moneta', () => {
    expect(overdriveCoinThreshold(run({}), 'player')).toBe(5);
  });
  it('con 4 FC non si accende; senza un effetto Overdrive nemmeno', () => {
    expect(overdriveCoinThreshold(run({ selectedFocus: 4 }), 'player')).toBeNull();
    expect(overdriveCoinThreshold(run({ enemySelectedFocus: 6 }), 'enemy')).toBeNull();
  });
  it('Nucleo del Reattore abbassa la soglia a 4 FC', () => {
    expect(overdriveCoinThreshold(run({ field: field('Nucleo del Reattore'), selectedFocus: 4 }), 'player')).toBe(4);
  });
  it('Centrale Energetica dà un bonus Overdrive a chiunque arrivi alla soglia', () => {
    expect(overdriveCoinThreshold(run({ field: field('Centrale Energetica'), enemySelectedFocus: 5 }), 'enemy')).toBe(5);
  });
  it('Potere Overdrive bloccato: niente effetto', () => {
    const br = run({});
    expect(overdriveCoinThreshold({ ...br, playerAbilityBlocked: true }, 'player')).toBeNull();
  });
});
