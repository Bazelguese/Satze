/**
 * Opzioni di `computeDuelResolution` per le modalità a più posti (2v2, Re della collina).
 * Ogni opzione ha un default che lascia il duello base identico: qui si verifica sia
 * l'effetto dell'opzione sia l'assenza di cambiamenti senza di essa.
 */
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);

function agent(name, overrides = {}) {
  return { id: `t-${name}`, name, army: 'Test', power: 5, damage: 3, league: 2, ...overrides };
}

const base = {
  field: neutralField,
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 20,
  enemyHP: 20,
  playerFocus: 10,
  enemyFocus: 10,
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

const alwaysHeal2 = agent('Curatore', { ability: { trigger: null, effect: 'heal', value: 2 } });
const plain = agent('Semplice');

describe('computeDuelResolution — massimo PV per lato', () => {
  it('senza opzione le cure restano limitate a 25', () => {
    const { battleResult } = computeDuelResolution({
      ...base, playerHP: 24, selectedAgent: alwaysHeal2, enemyAgent: plain,
      selectedFocus: 5, enemySelectedFocus: 1,
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(25);
  });

  it('con playerMaxHP 50 una cura a 40 PV porta a 42', () => {
    const { battleResult } = computeDuelResolution({
      ...base, playerHP: 40, playerMaxHP: 50, selectedAgent: alwaysHeal2, enemyAgent: plain,
      selectedFocus: 5, enemySelectedFocus: 1,
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(42);
  });

  it('senza opzione, a 40 PV, la cura riporta a 25 (comportamento base invariato)', () => {
    const { battleResult } = computeDuelResolution({
      ...base, playerHP: 40, selectedAgent: alwaysHeal2, enemyAgent: plain,
      selectedFocus: 5, enemySelectedFocus: 1,
    });
    expect(battleResult.finalPlayerHP).toBe(25);
  });
});

describe('computeDuelResolution — esito precedente per lato', () => {
  const gloryPower = agent('Glorioso', { ability: { trigger: 'glory', effect: 'power', value: 3 } });
  const vendettaPower = agent('Vendicatore', { ability: { trigger: 'vendetta', effect: 'power', value: 3 } });

  it('entrambi i lati possono avere Gloria se entrambi hanno vinto il proprio scontro', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: gloryPower, enemyAgent: { ...gloryPower, id: 't-g2' },
      playerPreviousResult: 'won', enemyPreviousResult: 'won',
    });
    expect(battleResult.playerPower).toBe(8);
    expect(battleResult.enemyPower).toBe(8);
  });

  it('entrambi i lati possono avere Vendetta', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: vendettaPower, enemyAgent: { ...vendettaPower, id: 't-v2' },
      playerPreviousResult: 'lost', enemyPreviousResult: 'lost',
    });
    expect(battleResult.playerPower).toBe(8);
    expect(battleResult.enemyPower).toBe(8);
  });

  it('senza opzione si usa lastWinner come nel duello base', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: gloryPower, enemyAgent: { ...vendettaPower, id: 't-v3' },
      lastWinner: 'player',
    });
    expect(battleResult.playerPower).toBe(8);
    expect(battleResult.enemyPower).toBe(5 + 3);
  });

  it('null significa nessuno scontro precedente', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: gloryPower, enemyAgent: { ...vendettaPower, id: 't-v4' },
      lastWinner: 'player', playerPreviousResult: null, enemyPreviousResult: null,
    });
    expect(battleResult.playerPower).toBe(5);
    expect(battleResult.enemyPower).toBe(5);
  });
});

describe('computeDuelResolution — Conquista disattivabile', () => {
  const conquestHeal = agent('Conquistatore', { ability: { trigger: 'conquest', effect: 'heal', value: 3 } });

  it('senza opzione Conquista cura il vincitore', () => {
    const { battleResult } = computeDuelResolution({
      ...base, playerHP: 10, selectedAgent: conquestHeal, enemyAgent: plain,
      selectedFocus: 5, enemySelectedFocus: 1,
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(13);
  });

  it('con conquestTriggerSuppressed la vittoria non attiva Conquista', () => {
    const { battleResult } = computeDuelResolution({
      ...base, playerHP: 10, selectedAgent: conquestHeal, enemyAgent: plain,
      selectedFocus: 5, enemySelectedFocus: 1, conquestTriggerSuppressed: true,
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(10);
  });
});

describe('computeDuelResolution — investimento già pagato', () => {
  it('senza opzione i FC investiti si sottraggono dalla riserva', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: plain, enemyAgent: { ...plain, id: 't-p2' },
      selectedFocus: 4, enemySelectedFocus: 2,
    });
    expect(battleResult.finalPlayerFC).toBe(6);
    expect(battleResult.finalEnemyFC).toBe(8);
  });

  it('con playerFocusPrepaid la riserva non scende ma il VA usa l’investimento', () => {
    const { battleResult } = computeDuelResolution({
      ...base, selectedAgent: plain, enemyAgent: { ...plain, id: 't-p3' },
      selectedFocus: 4, enemySelectedFocus: 2, playerFocusPrepaid: true,
    });
    expect(battleResult.finalPlayerFC).toBe(10);
    expect(battleResult.finalEnemyFC).toBe(8);
    expect(battleResult.playerAssault).toBe(20);
  });
});
