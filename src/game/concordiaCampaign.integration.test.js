import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import {
  CONCORDIA_ARMY,
  CONCORDIA_EMINENCE_ID,
  CONCORDIA_CARDS,
} from '../campaign/data/concordia.js';
import { createEminenceMatchState } from './eminence/eminenceState.js';
import {
  beginEminenceRound,
  selectEminenceAbility,
} from './eminence/eminenceRound.js';
import {
  prepareEminenceDuel,
  settleEminenceRound,
} from './eminence/eminenceDuelGate.js';
import { selectConcordiaAbility } from '../campaign/logic/concordiaAI.js';
function prepare(ability, presence = 4, side = 'player') {
  const state = createEminenceMatchState({
    playerEminenceId: side === 'player' ? CONCORDIA_EMINENCE_ID : null,
    enemyEminenceId: side === 'enemy' ? CONCORDIA_EMINENCE_ID : null,
  });
  state[side].presence = presence;
  const selected = selectEminenceAbility(
    beginEminenceRound(state, { roundNumber: 1 }),
    side,
    ability,
  );
  expect(selected.ok).toBe(true);
  const result = prepareEminenceDuel(selected.matchState);
  expect(result.blocked).toBe(null);
  return result;
}
const base = {
  field: ALL_BATTLEFIELDS.find((f) => f.id === 51),
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 25,
  enemyHP: 25,
  playerFocus: 18,
  enemyFocus: 18,
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
  selectedAgent: {
    id: 9101,
    name: 'Uno',
    army: CONCORDIA_ARMY,
    power: 1,
    damage: 1,
    league: 2,
    ability: null,
  },
  enemyAgent: {
    id: 107,
    name: 'Due',
    army: "Figli dell'Orizzonte",
    power: 1,
    damage: 1,
    league: 2,
    ability: null,
  },
};
describe('Concordia nel duello reale', () => {
  it('Serrate: +1 una volta, minimi POT/DAN, Statico soltanto al secondo', () => {
    const p = prepare('concordia_porte', 1);
    expect(p.matchState.player.presence).toBe(2);
    const { battleResult } = computeDuelResolution({
      ...base,
      eminenceBundle: p.bundle,
    });
    expect(battleResult.playerPower).toBe(1);
    expect(battleResult.enemyDamage).toBe(1);
    expect(
      settleEminenceRound(p.matchState, {
        initiativeSide: 'player',
        winner: 'draw',
      }).matchState.player.presence,
    ).toBe(2);
    const second = settleEminenceRound(p.matchState, {
      initiativeSide: 'enemy',
      winner: 'draw',
    });
    expect(second.matchState.player.presence).toBe(3);
    expect(
      settleEminenceRound(second.matchState, {
        initiativeSide: 'enemy',
        winner: 'draw',
      }).matchState.player.presence,
    ).toBe(3);
    const e = prepare('concordia_porte', 1, 'enemy');
    expect(
      settleEminenceRound(e.matchState, {
        initiativeSide: 'player',
        winner: 'draw',
      }).matchState.enemy.presence,
    ).toBe(3);
  });
  it('Seconda Campana forza Potere e Bonus senza produrre Presenza per primi', () => {
    const p = prepare('concordia_seconda', 2),
      selectedAgent = CONCORDIA_CARDS.find((c) => c.code === 'V02');
    const { battleResult } = computeDuelResolution({
      ...base,
      selectedAgent,
      playerArmyBonuses: { [CONCORDIA_ARMY]: true },
      eminenceBundle: p.bundle,
    });
    expect(battleResult.playerPower).toBe(selectedAgent.power + 3);
    expect(
      settleEminenceRound(p.matchState, {
        initiativeSide: 'player',
        winner: 'player',
      }).matchState.player.presence,
    ).toBe(0);
  });
  it('Blocco Potere non spegne Sortita +2/+2', () => {
    const p = prepare('concordia_sortita'),
      enemyAgent = {
        ...base.enemyAgent,
        ability: { trigger: null, effect: 'blockAbility', value: null },
      };
    const { battleResult } = computeDuelResolution({
      ...base,
      enemyAgent,
      eminenceBundle: p.bundle,
    });
    expect(battleResult.playerPower).toBe(3);
    expect(battleResult.playerDamage).toBe(3);
    expect(p.matchState.player.presence).toBe(0);
  });
  it('IA usa Sortita quando è pagabile, altrimenti accumula', () => {
    const s = createEminenceMatchState({
      enemyEminenceId: CONCORDIA_EMINENCE_ID,
    });
    s.enemy.presence = 4;
    const state = beginEminenceRound(s, { roundNumber: 3 }),
      ctx = {
        hand: CONCORDIA_CARDS.slice(0, 5),
        usedCards: [],
        choosesSecond: true,
        roundNumber: 3,
      };
    expect(selectConcordiaAbility(state, ctx).enemy.selectedAbilityId).toBe(
      'concordia_sortita',
    );
    state.enemy.presence = 1;
    state.enemy.selectionCheckpointPresence = 1;
    expect(selectConcordiaAbility(state, ctx).enemy.selectedAbilityId).toBe(
      'concordia_porte',
    );
  });
});
