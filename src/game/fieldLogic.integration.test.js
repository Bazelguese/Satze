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
