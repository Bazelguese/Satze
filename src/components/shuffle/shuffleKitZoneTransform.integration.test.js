import { describe, expect, it } from 'vitest';
import { createBattlefieldShuffleDealLayout } from './cardShuffleDealLayout';
import { buildShuffleKitGeometry } from './shuffleKitGeometry';
import { createShuffleZoneTransform } from './shuffleKitZoneTransform';
import { withShuffleJitter } from './shuffleFieldJitter';

describe('shuffleKit zone transform', () => {
  it('usa un palco locale ristretto, non il viewport intero', () => {
    const layout = createBattlefieldShuffleDealLayout('player');
    const g = buildShuffleKitGeometry(layout);
    expect(g.stageW).toBeLessThan(700);
    expect(g.stageH).toBeLessThan(500);
    expect(g.stageW).toBeGreaterThan(400);
    expect(g.stageW).toBe(g.zoneW);
    expect(g.stageH).toBe(g.zoneH);
  });

  it('specchia le coordinate orizzontali locali per il nemico', () => {
    const playerLayout = createBattlefieldShuffleDealLayout('player');
    const enemyLayout = createBattlefieldShuffleDealLayout('enemy');
    const playerG = buildShuffleKitGeometry(playerLayout);
    const enemyG = buildShuffleKitGeometry(enemyLayout);
    const playerTf = createShuffleZoneTransform(playerLayout, playerG);
    const enemyTf = createShuffleZoneTransform(enemyLayout, enemyG);

    const localX = playerG.deck.x + 80;
    const localY = playerG.deck.y + 40;
    const playerPt = playerTf.mapPoint(localX, localY);
    const enemyPt = enemyTf.mapPoint(localX, localY);

    const playerDlx = playerPt.x - playerLayout.deckPos.x;
    const enemyDlx = enemyPt.x - enemyLayout.deckPos.x;
    expect(Math.sign(playerDlx)).not.toBe(Math.sign(enemyDlx));
  });

  it('mappa il centro mazzo locale sul deckPos del campo (con jitter)', () => {
    const layout = withShuffleJitter(createBattlefieldShuffleDealLayout('player'), {
      deck: { x: 12, y: -8 },
      remain: { x: 0, y: 0 },
    });
    const g = buildShuffleKitGeometry(layout);
    const tf = createShuffleZoneTransform(layout, g);
    const mapped = tf.mapPoint(g.deck.x, g.deck.y);
    expect(mapped.x).toBeCloseTo(layout.deckPos.x + 12, 0);
    expect(mapped.y).toBeCloseTo(layout.deckPos.y - 8, 0);
  });

  it('mantiene spread orizzontale (dlx su asse X schermo)', () => {
    const layout = createBattlefieldShuffleDealLayout('player');
    const g = buildShuffleKitGeometry(layout);
    const tf = createShuffleZoneTransform(layout, g);
    const center = tf.mapPoint(g.deck.x, g.deck.y);
    const right = tf.mapPoint(g.deck.x + 100, g.deck.y);
    expect(right.x - center.x).toBeCloseTo(100, 0);
    expect(right.y - center.y).toBeCloseTo(0, 0);
  });

  it('specchia verticale per nemico (fontana verso il basso)', () => {
    const playerLayout = createBattlefieldShuffleDealLayout('player');
    const enemyLayout = createBattlefieldShuffleDealLayout('enemy');
    const playerG = buildShuffleKitGeometry(playerLayout);
    const enemyG = buildShuffleKitGeometry(enemyLayout);
    const playerTf = createShuffleZoneTransform(playerLayout, playerG);
    const enemyTf = createShuffleZoneTransform(enemyLayout, enemyG);

    const localUpY = playerG.deck.y - 100;
    const playerUp = playerTf.mapPoint(playerG.deck.x, localUpY);
    const enemyUp = enemyTf.mapPoint(enemyG.deck.x, localUpY);
    const playerCenter = playerTf.mapPoint(playerG.deck.x, playerG.deck.y);
    const enemyCenter = enemyTf.mapPoint(enemyG.deck.x, enemyG.deck.y);

    expect(playerUp.y).toBeLessThan(playerCenter.y);
    expect(enemyUp.y).toBeGreaterThan(enemyCenter.y);
  });
});
