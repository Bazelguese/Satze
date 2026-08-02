import { describe, expect, it } from 'vitest';
import { ALL_BATTLEFIELDS } from '../data/battlefields';
import { ARMY_SETS } from '../data/cards';
import {
  hydrateBattlefieldsFromPayload,
  normalizeOnlineMatchPayload,
  buildOnlineMatchPayload,
  calcInitialBonuses,
  buildShuffleDealSetupFromMatch,
} from './onlineMatch';

describe('onlineMatch', () => {
  it('hydrateBattlefieldsFromPayload risolve gli id canonici', () => {
    const picked = ALL_BATTLEFIELDS.slice(0, 5);
    const minimal = picked.map((f) => ({ id: f.id, name: 'CORROTTO' }));
    const hydrated = hydrateBattlefieldsFromPayload(minimal, ALL_BATTLEFIELDS);
    expect(hydrated).toHaveLength(5);
    expect(hydrated[0].name).toBe(picked[0].name);
    expect(hydrated[0].effect).toBe(picked[0].effect);
  });

  it('normalizeOnlineMatchPayload rigetta payload senza campi', () => {
    expect(() => normalizeOnlineMatchPayload({ battlefields: [] }, ALL_BATTLEFIELDS)).toThrow(
      /campi di battaglia/
    );
  });

  it('calcInitialBonuses: Patto con 1 carta, altre armate con 2+', () => {
    const patto = { ...ARMY_SETS['Patto degli Indocili'][0], army: 'Patto degli Indocili' };
    const kethran = { ...ARMY_SETS.Kethran[0], army: 'Kethran' };

    expect(calcInitialBonuses([patto])).toEqual({ 'Patto degli Indocili': true });
    expect(calcInitialBonuses([patto, patto])).toEqual({ 'Patto degli Indocili': true });
    expect(calcInitialBonuses([patto, kethran])).toEqual({
      'Patto degli Indocili': true,
      Kethran: false,
    });
    expect(calcInitialBonuses([kethran, kethran])).toEqual({ Kethran: true });
  });

  it('build + normalize producono 5 campi coerenti', () => {
    const armies = Object.keys(ARMY_SETS);
    const hostArmy = armies[0];
    const guestArmy = armies[1];
    const match = buildOnlineMatchPayload(
      hostArmy,
      'A',
      guestArmy,
      'A',
      'classic',
      12345,
      ALL_BATTLEFIELDS
    );
    const normalized = normalizeOnlineMatchPayload(match, ALL_BATTLEFIELDS);
    expect(normalized.battlefields).toHaveLength(5);
    expect(normalized.hostPlayerHand).toHaveLength(5);
    expect(normalized.hostEnemyHand).toHaveLength(5);
    expect(normalized.battlefields.map((f) => f.id)).toEqual(
      match.battlefields.map((f) => f.id)
    );
    expect(normalized.hostPlayerSet).toHaveLength(10);
    expect(normalized.hostEnemySet).toHaveLength(10);
    expect(normalized.hostPlayerFinalOrder).toHaveLength(10);
    expect(normalized.hostEnemyFinalOrder).toHaveLength(10);
    expect(normalized.playerCardBack).toBeTruthy();
    expect(normalized.enemyCardBack).toBeTruthy();
  });

  it('buildShuffleDealSetupFromMatch inverte prospettiva per guest', () => {
    const armies = Object.keys(ARMY_SETS);
    const match = buildOnlineMatchPayload(
      armies[0],
      'A',
      armies[1],
      'A',
      'classic',
      999,
      ALL_BATTLEFIELDS
    );
    const normalized = normalizeOnlineMatchPayload(match, ALL_BATTLEFIELDS);
    const hostSetup = buildShuffleDealSetupFromMatch('host', normalized);
    const guestSetup = buildShuffleDealSetupFromMatch('guest', normalized);

    expect(hostSetup.playerHand.map((c) => c.id)).toEqual(
      normalized.hostPlayerHand.map((c) => c.id)
    );
    expect(guestSetup.playerHand.map((c) => c.id)).toEqual(
      normalized.hostEnemyHand.map((c) => c.id)
    );
    expect(guestSetup.playerFinalOrder).toEqual(normalized.hostEnemyFinalOrder);
    expect(guestSetup.playerCardBack).toBe(normalized.enemyCardBack);
  });
});
