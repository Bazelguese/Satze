import { describe, it, expect } from 'vitest';
import {
  createShuffleDealLayout,
  fanSlot,
  getDealtHandIndices,
  getShuffleDealDurationMs,
  handSlot,
  SHUFFLE_DEAL_HAND_SIZE,
} from './cardShuffleDealLayout';
import { prepareDuelShuffleHands, prepareRandomDuelShuffleHands } from './prepareDuelShuffleHands';

describe('cardShuffleDealLayout', () => {
  it('crea layout distinti per giocatore e avversario', () => {
    const player = createShuffleDealLayout('player', { stageHeight: 280 });
    const enemy = createShuffleDealLayout('enemy', { stageHeight: 280 });

    expect(player.handY).toBeGreaterThan(enemy.handY);
    expect(player.side).toBe('player');
    expect(enemy.side).toBe('enemy');
  });

  it('fanSlot e handSlot sono simmetrici sul centro', () => {
    const layout = createShuffleDealLayout('player');
    const fanMid = fanSlot(4, 9, {
      stageCx: layout.stageCx,
      fanWidth: layout.fanWidth,
      archDepth: layout.fanArchDepth,
      rotSpread: layout.fanRotSpread,
      yBase: layout.yBase,
    });
    const handMid = handSlot(2, 5, {
      stageCx: layout.stageCx,
      handWidth: layout.handWidth,
      archDepth: layout.handArchDepth,
      rotSpread: layout.handRotSpread,
      handY: layout.handY,
    });

    expect(fanMid.x).toBeCloseTo(layout.stageCx, 0);
    expect(handMid.x).toBeCloseTo(layout.stageCx, 0);
    expect(fanMid.rot).toBe(0);
    expect(handMid.rot).toBe(0);
  });

  it('getDealtHandIndices estrae le prime 5 carte dell ordine finale', () => {
    const order = [3, 7, 1, 9, 0, 2, 4, 5, 6, 8];
    expect(getDealtHandIndices(order)).toEqual([3, 7, 1, 9, 0]);
    expect(getDealtHandIndices(order, 3)).toEqual([3, 7, 1]);
  });

  it('durata animazione include deal, pausa mazzetto e uscita', () => {
    expect(getShuffleDealDurationMs()).toBe(
      3490 + (SHUFFLE_DEAL_HAND_SIZE - 1) * 300 + 700 + 650 + 800
    );
  });
});

describe('prepareDuelShuffleHands', () => {
  it('inizializza duello con 10 carte e 5 in mano per entrambi', () => {
    const duel = prepareDuelShuffleHands({
      playerArmy: "Figli dell'Orizzonte",
      playerDeckKey: 'A',
      enemyArmy: 'Kethran',
      enemyDeckKey: 'A',
    });

    expect(duel.playerSet).toHaveLength(10);
    expect(duel.enemySet).toHaveLength(10);
    expect(duel.playerHand).toHaveLength(SHUFFLE_DEAL_HAND_SIZE);
    expect(duel.enemyHand).toHaveLength(SHUFFLE_DEAL_HAND_SIZE);
    expect(duel.playerFinalOrder).toHaveLength(10);
    expect(duel.enemyFinalOrder).toHaveLength(10);

    const playerHandFromOrder = getDealtHandIndices(duel.playerFinalOrder).map(
      (i) => duel.playerSet[i].id
    );
    const enemyHandFromOrder = getDealtHandIndices(duel.enemyFinalOrder).map(
      (i) => duel.enemySet[i].id
    );

    expect(duel.playerHand.map((c) => c.id)).toEqual(playerHandFromOrder);
    expect(duel.enemyHand.map((c) => c.id)).toEqual(enemyHandFromOrder);
    expect(duel.playerCardBack).toBeTruthy();
    expect(duel.enemyCardBack).toBeTruthy();
    expect(duel.playerCardBack).not.toBe(duel.enemyCardBack);
  });

  it('prepareRandomDuelShuffleHands sorteggia due mazzi distinti', () => {
    const duel = prepareRandomDuelShuffleHands();

    expect(duel.playerArmy).toBeTruthy();
    expect(duel.enemyArmy).toBeTruthy();
    expect(duel.playerArmy).not.toBe(duel.enemyArmy);
    expect(duel.playerDeckKey).toBeTruthy();
    expect(duel.enemyDeckKey).toBeTruthy();
    expect(duel.playerHand).toHaveLength(SHUFFLE_DEAL_HAND_SIZE);
    expect(duel.enemyHand).toHaveLength(SHUFFLE_DEAL_HAND_SIZE);
  });
});
