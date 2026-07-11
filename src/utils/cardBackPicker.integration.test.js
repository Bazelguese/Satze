import { describe, it, expect } from 'vitest';
import { CARD_BACK_IMAGES, pickDistinctCardBackPair } from './cardBackPicker';

describe('cardBackPicker', () => {
  it('CARD_BACK_IMAGES espone i 4 dorsi', () => {
    expect(CARD_BACK_IMAGES).toHaveLength(4);
    expect(CARD_BACK_IMAGES[0]).toContain('card-images/back/back1.png');
  });

  it('pickDistinctCardBackPair assegna dorsi diversi', () => {
    for (let i = 0; i < 20; i++) {
      const { playerCardBack, enemyCardBack } = pickDistinctCardBackPair();
      expect(playerCardBack).toBeTruthy();
      expect(enemyCardBack).toBeTruthy();
      expect(playerCardBack).not.toBe(enemyCardBack);
      expect(CARD_BACK_IMAGES).toContain(playerCardBack);
      expect(CARD_BACK_IMAGES).toContain(enemyCardBack);
    }
  });
});
