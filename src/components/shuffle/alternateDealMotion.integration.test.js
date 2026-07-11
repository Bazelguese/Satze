import { describe, expect, it } from 'vitest';
import {
  getDealtHandIndices,
  getRemainDeckIndices,
  SHUFFLE_DEAL_HAND_SIZE,
  createBattlefieldShuffleDealLayout,
} from './cardShuffleDealLayout';
import { scheduleAlternateBattlefieldDeal } from './alternateDealMotion';

describe('alternate deal hand consistency', () => {
  const order = [3, 7, 1, 9, 0, 8, 2, 6, 4, 5];
  const handSize = SHUFFLE_DEAL_HAND_SIZE;

  it('mano e scarti condividono la stessa partizione del deal standard', () => {
    expect(getDealtHandIndices(order)).toEqual([3, 7, 1, 9, 0]);
    expect(getRemainDeckIndices(order)).toEqual([8, 2, 6, 4, 5]);
  });

  it('scheduleAlternateBattlefieldDeal consegna order[0..4] in mano e order[5..9] agli scarti', () => {
    const layout = createBattlefieldShuffleDealLayout('player');
    const patches = new Map();
    const after = (_ms, fn) => fn();
    const setCard = (deckIndex, patch) => {
      patches.set(deckIndex, { ...(patches.get(deckIndex) ?? {}), ...patch });
    };

    scheduleAlternateBattlefieldDeal({
      after,
      setCard,
      layout,
      order,
      handSize,
      deckSize: 10,
      startMs: 0,
      dealScale: 1,
    });

    const handIds = getDealtHandIndices(order);
    const discardIds = getRemainDeckIndices(order);

    handIds.forEach((id) => {
      expect(patches.get(id)?.flipped).toBe(true);
      expect(patches.get(id)?.opacity).toBe(1);
    });

    discardIds.forEach((id) => {
      expect(patches.get(id)?.flipped).toBe(false);
    });

    expect(handIds.every((id) => patches.has(id))).toBe(true);
    expect(discardIds.every((id) => patches.has(id))).toBe(true);
  });
});
