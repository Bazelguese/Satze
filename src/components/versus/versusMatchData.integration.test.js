import { describe, it, expect } from 'vitest';
import { buildDuelVersusData, buildVersusIdentity } from './versusMatchData.js';

const set = (ids) => ids.map((id) => ({ id }));

describe('buildDuelVersusData', () => {
  it('non mostra il VS in campagna', () => {
    expect(buildDuelVersusData({ gameMode: 'campaign', playerArmy: 'Kethran' })).toBeNull();
  });

  it('contro l’IA: TU vs IA con difficoltà, chiave del mazzo IA e carte dei set', () => {
    const data = buildDuelVersusData({
      difficulty: 'hard',
      playerArmy: 'Kethran',
      playerDeckKey: 'custom_abc',
      playerSet: set([1, 2, 3]),
      enemyArmy: 'Apex',
      enemyDeckKey: 'B',
      enemySet: set([7, 8]),
      eminenceMatchState: { format: 'required', player: { eminenceId: 'kethran_altare' }, enemy: { eminenceId: null } },
    });
    expect(data.playerIdentity.name).toBe('TU');
    expect(data.enemyIdentity.name).toBe('IA');
    expect(data.enemyIdentity.sub).toContain('Difficile');
    expect(data.playerDeck).toEqual({ army: 'Kethran', deckKey: 'custom_abc', cardIds: [1, 2, 3] });
    expect(data.enemyDeck).toEqual({ army: 'Apex', deckKey: 'B', cardIds: [7, 8] });
    expect(data.eminenceFormat).toBe('required');
    expect(data.playerEminenceId).toBe('kethran_altare');
    expect(data.enemyEminenceId).toBeNull();
  });

  it('il mazzo hub (array di id) non passa come chiave', () => {
    const data = buildDuelVersusData({ playerArmy: 'Kethran', playerDeckKey: [1, 2], playerSet: set([1, 2]) });
    expect(data.playerDeck.deckKey).toBeNull();
    expect(data.playerDeck.cardIds).toEqual([1, 2]);
  });

  it('online: la chiave personalizzata dell’avversario non viene mai risolta sul nostro storage', () => {
    const data = buildDuelVersusData({
      isOnline: true,
      selfName: 'Bazel',
      peerName: 'Mario',
      enemyArmy: 'Orathai',
      enemySet: set([10, 11, 12]),
      peerDeck: { army: 'Orathai', deckKey: 'custom_xyz', deckName: 'Il Bosco', coverCardId: 11 },
    });
    expect(data.playerIdentity.name).toBe('Bazel');
    expect(data.enemyIdentity.name).toBe('Mario');
    expect(data.enemyDeck).toEqual({
      army: 'Orathai',
      deckKey: null,
      cardIds: [10, 11, 12],
      name: 'Il Bosco',
      coverCardId: 11,
    });
  });

  it('online: precostruito avversario tenuto, copertina scartata se non è nel mazzo', () => {
    const data = buildDuelVersusData({
      isOnline: true,
      enemySet: set([10, 11]),
      peerDeck: { army: 'Apex', deckKey: 'A', coverCardId: 99 },
    });
    expect(data.enemyDeck.deckKey).toBe('A');
    expect(data.enemyDeck.coverCardId).toBeNull();
  });

  it('senza stato Eminenze o in formato senza Eminenze: nessuna Eminenza', () => {
    expect(buildDuelVersusData({}).eminenceFormat).toBe('disabled');
    expect(buildDuelVersusData({ eminenceMatchState: { format: 'disabled' } }).eminenceFormat).toBe('disabled');
  });
});

describe('buildVersusIdentity', () => {
  it('online senza nomi usa etichette di riserva', () => {
    const id = buildVersusIdentity({ isOnline: true });
    expect(id.player.name).toBe('Giocatore');
    expect(id.enemy.name).toBe('Avversario');
  });
});
