import { describe, expect, it } from 'vitest';
import { createBattlefieldShuffleDealLayout } from './cardShuffleDealLayout';
import {
  resolveAlternateDiscardAnchor,
  resolveDeckOrigin,
  resolveRemainAnchor,
  rollShuffleFieldJitter,
  withShuffleJitter,
} from './shuffleFieldJitter';

describe('shuffleFieldJitter', () => {
  it('genera offset casuali solo per il mazzo iniziale', () => {
    const j = rollShuffleFieldJitter();
    expect(j.deck).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
    expect(j.remain).toBeUndefined();
  });

  it('posiziona gli scarti su-destra per il giocatore (rispetto al mazzo jitterato)', () => {
    const layout = withShuffleJitter(createBattlefieldShuffleDealLayout('player'), {
      deck: { x: 10, y: -5 },
    });
    const deck = resolveDeckOrigin(layout);
    const remain = resolveRemainAnchor(layout);
    expect(remain.x).toBeGreaterThan(deck.x);
    expect(remain.y).toBeLessThan(deck.y);
  });

  it('posiziona gli scarti speculari per il nemico', () => {
    const layout = withShuffleJitter(createBattlefieldShuffleDealLayout('enemy'), {
      deck: { x: 10, y: -5 },
    });
    const deck = resolveDeckOrigin(layout);
    const remain = resolveRemainAnchor(layout);
    expect(remain.x).toBeLessThan(deck.x);
    expect(remain.y).toBeGreaterThan(deck.y);
  });

  it('alternate usa lo stesso ancoraggio scarti', () => {
    const layout = createBattlefieldShuffleDealLayout('player');
    expect(resolveAlternateDiscardAnchor(layout)).toEqual(resolveRemainAnchor(layout));
  });
});
