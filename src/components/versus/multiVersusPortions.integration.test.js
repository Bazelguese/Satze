import { describe, it, expect } from 'vitest';
import { buildVersusPortions } from './MultiVersusScreen.jsx';

const id = (name) => ({ eyebrow: '', name });
const deck = (army) => ({ army });

describe('buildVersusPortions', () => {
  it('2v2: secondo avversario, avversario, tu, compagno', () => {
    const out = buildVersusPortions({
      playerIdentity: id('Tu'), enemyIdentity: id('B1'), playerDeck: deck('a'), enemyDeck: deck('b'),
      playerAllies: [{ identity: id('A2'), deck: deck('c') }],
      enemyAllies: [{ identity: id('B2'), deck: deck('d') }],
    });
    expect(out.map((p) => p.identity.name)).toEqual(['B2', 'B1', 'Tu', 'A2']);
    expect(out.map((p) => p.role)).toEqual(['foe', 'foe', 'self', 'mate']);
  });
  it('Re della collina: sfidanti a sinistra, tu all’estrema destra', () => {
    const out = buildVersusPortions({
      playerIdentity: id('Tu'), enemyIdentity: id('P2'), playerDeck: deck('a'), enemyDeck: deck('b'),
      enemyAllies: [{ identity: id('P3'), deck: deck('c') }, { identity: id('P4'), deck: deck('d') }],
    });
    expect(out.map((p) => p.identity.name)).toEqual(['P3', 'P4', 'P2', 'Tu']);
  });
});
