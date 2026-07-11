import { describe, it, expect } from 'vitest';
import { ALL_AGENTS } from '../data/cards.js';
import {
  GUIDED_ADVANCED_ROUNDS,
  GUIDED_DECKS,
  GUIDED_HANDS,
  GUIDED_INTRO_ROUNDS,
} from '../data/tutorialGuidedContent.js';
import {
  assertGuidedHandInDeck,
  buildGuidedHands,
  simulateGuidedDuel,
} from './guidedTutorialValidation.js';

function agentById(hand, id) {
  const card = hand.find((c) => c.id === id);
  if (!card) throw new Error(`Agente ${id} non in mano`);
  return card;
}

describe('tutorial guidato — esiti scriptati', () => {
  const introHands = buildGuidedHands(ALL_AGENTS, GUIDED_HANDS.intro);
  const advancedHands = buildGuidedHands(ALL_AGENTS, GUIDED_HANDS.advanced);

  it('mani pescate dai mazzi precostruiti coerenti', () => {
    expect(introHands.player).toHaveLength(5);
    expect(introHands.enemy).toHaveLength(5);
    assertGuidedHandInDeck(GUIDED_HANDS.intro.player, GUIDED_DECKS.intro.player);
    assertGuidedHandInDeck(GUIDED_HANDS.intro.enemy, GUIDED_DECKS.intro.enemy);
    assertGuidedHandInDeck(GUIDED_HANDS.advanced.player, GUIDED_DECKS.advanced.player);
    assertGuidedHandInDeck(GUIDED_HANDS.advanced.enemy, GUIDED_DECKS.advanced.enemy);

    introHands.player.forEach((card) => {
      expect(card.army).toBe(GUIDED_DECKS.intro.player.army);
    });
    introHands.enemy.forEach((card) => {
      expect(card.army).toBe(GUIDED_DECKS.intro.enemy.army);
    });
  });

  it('intro: R1 vittoria, R2 sconfitta, R3 vittoria (campi neutri)', () => {
    const outcomes = GUIDED_INTRO_ROUNDS.map((round) => {
      const result = simulateGuidedDuel({
        playerAgent: agentById(introHands.player, round.playerAgentId),
        enemyAgent: agentById(introHands.enemy, round.enemyAgentId),
        fieldIndex: round.fieldIndex,
        playerFocus: round.focus,
        enemyFocus: round.enemyFocus,
        roundNumber: round.round,
      });
      return result.winner;
    });
    expect(outcomes).toEqual(['player', 'enemy', 'player']);
  });

  it('avanzato: mano giocatore include Overdrive (R3)', () => {
    const r3 = GUIDED_ADVANCED_ROUNDS.find((r) => r.round === 3);
    const card = agentById(advancedHands.player, r3.playerAgentId);
    expect(card.ability?.trigger).toBe('overdrive');
    expect(card.name).toMatch(/Nucleo di Comando/i);
  });

  it('avanzato: R1 perdita controllata con FC minimo', () => {
    const round = GUIDED_ADVANCED_ROUNDS[0];
    const result = simulateGuidedDuel({
      playerAgent: agentById(advancedHands.player, round.playerAgentId),
      enemyAgent: agentById(advancedHands.enemy, round.enemyAgentId),
      fieldIndex: round.fieldIndex,
      playerFocus: round.focusMin,
      enemyFocus: round.enemyFocus,
      roundNumber: round.round,
    });
    expect(result.winner).toBe('enemy');
  });

  it('avanzato: R2 vittoria efficiente', () => {
    const round = GUIDED_ADVANCED_ROUNDS[1];
    const result = simulateGuidedDuel({
      playerAgent: agentById(advancedHands.player, round.playerAgentId),
      enemyAgent: agentById(advancedHands.enemy, round.enemyAgentId),
      fieldIndex: round.fieldIndex,
      playerFocus: round.focus,
      enemyFocus: round.enemyFocus,
      roundNumber: round.round,
    });
    expect(result.winner).toBe('player');
  });

  it('avanzato: R3 vittoria con Overdrive a 5 FC', () => {
    const round = GUIDED_ADVANCED_ROUNDS[2];
    const result = simulateGuidedDuel({
      playerAgent: agentById(advancedHands.player, round.playerAgentId),
      enemyAgent: agentById(advancedHands.enemy, round.enemyAgentId),
      fieldIndex: round.fieldIndex,
      playerFocus: round.focus,
      enemyFocus: round.enemyFocus,
      roundNumber: round.round,
    });
    expect(result.winner).toBe('player');
  });

  it('nessun PV a zero nei primi 3 round intro', () => {
    let playerHp = 25;
    let enemyHp = 25;
    GUIDED_INTRO_ROUNDS.forEach((round) => {
      const result = simulateGuidedDuel({
        playerAgent: agentById(introHands.player, round.playerAgentId),
        enemyAgent: agentById(introHands.enemy, round.enemyAgentId),
        fieldIndex: round.fieldIndex,
        playerFocus: round.focus,
        enemyFocus: round.enemyFocus,
        playerHp,
        enemyHp,
        roundNumber: round.round,
      });
      playerHp = result.finalPlayerHP;
      enemyHp = result.finalEnemyHP;
      expect(playerHp).toBeGreaterThan(0);
      expect(enemyHp).toBeGreaterThan(0);
    });
  });
});
