import { describe, expect, it } from 'vitest';
import { ALL_BATTLEFIELDS } from '../data/battlefields';
import { BATTLEFIELD_RARITA, BATTLEFIELD_REVEAL_START } from '../data/battlefieldMeta';
import {
  pickBattlefieldsByRarity,
  pickFromRaritaBucket,
  rollBattlefieldRaritaTier,
  selectBattlefields,
} from './fieldLogic';
import { mulberry32 } from '../utils/seededRandom';

describe('fieldLogic — motore rarità v2', () => {
  it('seleziona 5 campi classici senza duplicati', () => {
    const fields = selectBattlefields('classic', ALL_BATTLEFIELDS);
    expect(fields).toHaveLength(5);
    expect(new Set(fields.map((f) => f.id)).size).toBe(5);
    fields.forEach((f) => expect(f.category).not.toBe('neutral'));
  });

  it('primi REVEAL_START slot hanno minTurn 1', () => {
    for (let seed = 0; seed < 30; seed++) {
      const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng: mulberry32(seed) });
      for (let i = 0; i < BATTLEFIELD_REVEAL_START; i++) {
        expect(fields[i].minTurn).toBe(1);
      }
    }
  });

  it('massimo 1 special per pescata', () => {
    for (let seed = 0; seed < 50; seed++) {
      const fields = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng: mulberry32(seed + 100) });
      const specials = fields.filter((f) => f.rarita === BATTLEFIELD_RARITA.SPECIAL);
      expect(specials.length).toBeLessThanOrEqual(1);
    }
  });

  it('bareHands estrae solo neutri', () => {
    const fields = selectBattlefields('bareHands', ALL_BATTLEFIELDS);
    expect(fields).toHaveLength(5);
    fields.forEach((f) => expect(f.category).toBe('neutral'));
  });

  it('catalogo master ha 121 campi', () => {
    expect(ALL_BATTLEFIELDS).toHaveLength(121);
  });

  it('stesso seed → stessa selezione', () => {
    const a = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng: mulberry32(999) });
    const b = selectBattlefields('classic', ALL_BATTLEFIELDS, { rng: mulberry32(999) });
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id));
  });

  it('declassa tier se bucket vuoto', () => {
    const onlyComuni = ALL_BATTLEFIELDS.filter((f) => f.rarita === BATTLEFIELD_RARITA.COMUNE && f.category !== 'neutral');
    const pick = pickFromRaritaBucket(onlyComuni, BATTLEFIELD_RARITA.SPECIAL, () => 0.5);
    expect(pick.rarita).toBe(BATTLEFIELD_RARITA.COMUNE);
  });

  it('rollBattlefieldRaritaTier rispetta cap special', () => {
    const tier = rollBattlefieldRaritaTier(0, 0, true, {
      pR_base: 0.4,
      d: 0.5,
      f_R: 0.1,
      pS_base: 0.99,
      SPECIAL_SLOT_MIN: 0,
      REVEAL_START: 3,
    }, () => 0.01);
    expect(tier).not.toBe(BATTLEFIELD_RARITA.SPECIAL);
  });
});

describe('Mani nude con più di 5 Campi (2v2)', () => {
  it('ripete i 5 neutri: ognuno compare due volte, come oggetti distinti', async () => {
    const { selectBattlefields } = await import('./fieldLogic.js');
    const fields = selectBattlefields('bareHands', ALL_BATTLEFIELDS, { fieldCount: 10 });
    expect(fields).toHaveLength(10);
    fields.forEach((f) => expect(f.category).toBe('neutral'));
    const conta = new Map();
    for (const f of fields) conta.set(f.id, (conta.get(f.id) || 0) + 1);
    expect([...conta.values()]).toEqual([2, 2, 2, 2, 2]);
    expect(new Set(fields).size).toBe(10); // indexOf trova sempre lo slot giusto
    // Nel primo giro ci sono tutti e 5 i neutri: niente doppioni tra i 6 Campi scoperti all'inizio oltre il necessario.
    expect(new Set(fields.slice(0, 5).map((f) => f.id)).size).toBe(5);
  });

  it('una partita 2v2 in Mani nude si crea senza errori', async () => {
    const { selectBattlefields } = await import('./fieldLogic.js');
    const { createTeamDuelMatch, TEAM_DUEL_CONFIG } = await import('./teamDuel/teamDuel.js');
    const { createSeat } = await import('./multiSeat/multiSeatCore.js');
    const { ALL_AGENTS } = await import('../data/cards.js');
    const mano = (k) => ALL_AGENTS.slice(k * 5, k * 5 + 5);
    const seats = [
      createSeat({ id: 'A1', name: 'A1', team: 'A', army: 'X', focus: 18, hand: mano(0) }),
      createSeat({ id: 'A2', name: 'A2', team: 'A', army: 'X', focus: 18, hand: mano(1) }),
      createSeat({ id: 'B1', name: 'B1', team: 'B', army: 'X', focus: 18, hand: mano(2) }),
      createSeat({ id: 'B2', name: 'B2', team: 'B', army: 'X', focus: 18, hand: mano(3) }),
    ];
    const battlefields = selectBattlefields('bareHands', ALL_BATTLEFIELDS, { fieldCount: TEAM_DUEL_CONFIG.fieldCount });
    expect(() => createTeamDuelMatch({ seats, battlefields, rng: Math.random, mode: 'bareHands' })).not.toThrow();
  });
});
