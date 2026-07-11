import { describe, it, expect } from 'vitest';
import {
  getEnemyHandCardCenter,
  getPlayerHandCardCenter,
  getEnemyAgentDeckCenter,
  getPlayerAgentDeckCenter,
  getDeckExitTarget,
  HAND_CARD_W,
  HAND_CARD_H,
  IA_CARD_POSITIONS,
  PLAYER_CARD_POSITIONS,
  getHandAxis,
  BATTLEFIELD_VIEWPORT,
} from './battlefieldHandLayout';
import { getDuelAgentCardCenter } from './duelClashLayout';

describe('battlefieldHandLayout', () => {
  it('centri IA corrispondono a left/top + metà carta', () => {
    const c0 = getEnemyHandCardCenter(0);
    expect(c0.x).toBe(IA_CARD_POSITIONS[0].left + HAND_CARD_W / 2);
    expect(c0.y).toBe(IA_CARD_POSITIONS[0].top + HAND_CARD_H / 2);
  });

  it('centri giocatore corrispondono a right/bottom nel triangolo basso-destra', () => {
    const c0 = getPlayerHandCardCenter(0);
    const p = PLAYER_CARD_POSITIONS[0];
    const zoneW = 1071;
    const zoneH = 459;
    const ox = 1920 - zoneW;
    const oy = 1080 - zoneH;
    const left = zoneW - p.right - HAND_CARD_W;
    const top = zoneH - p.bottom - HAND_CARD_H;
    expect(c0.x).toBeCloseTo(ox + left + HAND_CARD_W / 2, 0);
    expect(c0.y).toBeCloseTo(oy + top + HAND_CARD_H / 2, 0);
  });

  it('mazzo shuffle è inclinato sull\'asse della mano', () => {
    const playerAxis = getHandAxis('player');
    const enemyAxis = getHandAxis('enemy');
    const playerDeck = getPlayerAgentDeckCenter();
    const enemyDeck = getEnemyAgentDeckCenter();

    expect(playerDeck.rot).toBeCloseTo(playerAxis.angleDeg, 1);
    expect(enemyDeck.rot).toBeCloseTo(enemyAxis.angleDeg, 1);
    expect(playerDeck.y).toBeLessThan(820);
    expect(enemyDeck.y).toBeGreaterThan(360);
  });

  it('mazzi spostati in modo speculare verso il centro campo', () => {
    const playerDeck = getPlayerAgentDeckCenter();
    const enemyDeck = getEnemyAgentDeckCenter();
    const playerBaseY =
      getDuelAgentCardCenter('player').y +
      (getPlayerHandCardCenter(0).y - getDuelAgentCardCenter('player').y) * 0.58;
    const enemyBaseY =
      getDuelAgentCardCenter('enemy').y +
      (getEnemyHandCardCenter(0).y - getDuelAgentCardCenter('enemy').y) * 0.58;

    expect(playerDeck.y).toBeCloseTo(playerBaseY - 80, 0);
    expect(enemyDeck.y).toBeCloseTo(enemyBaseY + 80, 0);
    expect(playerDeck.y).toBeLessThan(playerBaseY);
    expect(enemyDeck.y).toBeGreaterThan(enemyBaseY);
  });

  it('mazzetto residuo esce verso l angolo della mano e fuori dallo schermo', () => {
    const playerExit = getDeckExitTarget('player');
    const enemyExit = getDeckExitTarget('enemy');

    expect(playerExit.x).toBeGreaterThan(BATTLEFIELD_VIEWPORT.width);
    expect(playerExit.y).toBeGreaterThan(BATTLEFIELD_VIEWPORT.height * 0.75);
    expect(enemyExit.x).toBeLessThan(0);
    expect(enemyExit.y).toBeLessThan(BATTLEFIELD_VIEWPORT.height * 0.35);
  });
});
