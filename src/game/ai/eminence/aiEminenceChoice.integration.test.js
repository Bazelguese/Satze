import { describe, expect, it } from 'vitest';
import { createEminenceMatchState } from '../../eminence/eminenceState.js';
import { openEminenceRound } from '../../eminence/eminenceDuelGate.js';
import { EMINENCE_IDS, getEminence } from '../../../data/eminences.js';
import {
  chooseAiDealResponse,
  chooseAiEminenceSelection,
  orderSetupPreyCandidates,
  rankAiEminenceAbilities,
} from './aiEminenceChoice.js';

const card = (id, power, damage, trigger = 'glory') => ({ id, league: 3, power, damage, ability: { trigger, effect: 'power', value: 1 } });
const playerHand = [card(1, 2, 2), card(2, 6, 5), card(3, 3, 3), card(4, 4, 2), card(5, 3, 1)];
const enemyHand = [card(11, 3, 3), card(12, 4, 3), card(13, 5, 4), card(14, 2, 2), card(15, 3, 2)];

function game(overrides = {}) {
  return {
    playerHand,
    enemyHand,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerHP: 25,
    enemyHP: 25,
    conqueredFields: {},
    battlefields: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    roundNumber: 1,
    isPlayerFirst: true,
    ...overrides,
  };
}

const paramContext = (g) => ({
  ownUndeployedCardIds: g.playerHand.filter((c) => !g.playerUsedCards.includes(c.id)).map((c) => c.id),
  enemyUndeployedCardIds: g.enemyHand.filter((c) => !g.enemyUsedCards.includes(c.id)).map((c) => c.id),
  slotCount: 5,
  slots: [0, 1, 2, 3, 4].map((index) => ({ index, conquered: false, revealed: true })),
});

/** Round aperto con la Presenza e lo stato persistente voluti per l'IA. */
function roundState(enemyEminenceId, { presence = 1, persistent = {}, playerEminenceId = 'apex_sole_verde', roundNumber = 1 } = {}) {
  let ms = createEminenceMatchState({ playerEminenceId, enemyEminenceId });
  ms = openEminenceRound(ms, { roundNumber, initiativeSide: 'player' }).matchState;
  return {
    ...ms,
    enemy: {
      ...ms.enemy,
      presence,
      selectionCheckpointPresence: presence,
      persistent: { ...ms.enemy.persistent, ...persistent },
    },
  };
}

const rngZero = () => 0;

describe('IA: scelta dell\'abilità Eminenza', () => {
  it('non prende più sempre la prima abilità: con Presenza alta a metà Scontro spende', () => {
    const g = game({ roundNumber: 3, enemyUsedCards: [11, 12] });
    let spending = 0;
    for (const id of EMINENCE_IDS) {
      const ms = roundState(id, { presence: 6, roundNumber: 3 });
      const next = chooseAiEminenceSelection(ms, 'enemy', { game: g, paramContext: paramContext(g), rng: rngZero });
      const chosen = next.enemy.selectedAbilityId;
      expect(chosen, id).toBeTruthy();
      const ability = getEminence(id).abilities.find((a) => a.id === chosen);
      if ((ability.presenceDelta || 0) < 0) spending += 1;
    }
    expect(spending).toBeGreaterThanOrEqual(10);
  });

  it('con poca Presenza e molti Duelli davanti usa la ricarica per un colpo forte', () => {
    const g = game();
    const ms = roundState('apex_sole_verde', { presence: 2 });
    const ranking = rankAiEminenceAbilities(ms, 'enemy', { game: g, paramContext: paramContext(g), rng: rngZero });
    // Preghiera Ululata (−3) vale di più quanti più Duelli restano: con 2 Presenza conviene
    // ricaricare ora (Cielo Smeraldino costa poco) invece di spendere tutto in Disprezzo.
    expect(ranking[0].abilityId).toBe('apex_cielo_smeraldino');
  });

  it('all\'ultimo Duello non accumula Presenza', () => {
    const g = game({ roundNumber: 5, enemyUsedCards: [11, 12, 13, 14] });
    const ms = roundState('calibri_quattro_fronti', { presence: 2, roundNumber: 5 });
    const ranking = rankAiEminenceAbilities(ms, 'enemy', { game: g, paramContext: paramContext(g), rng: rngZero });
    expect(ranking[0].abilityId).not.toBe('calibri_fermo_macchine');
  });

  it('non perde PV che possono chiudere lo Scontro', () => {
    const g = game({ enemyHP: 2 });
    const ms = roundState('kethran_altare', { presence: 0 });
    const ranking = rankAiEminenceAbilities(ms, 'enemy', { game: g, paramContext: paramContext(g), rng: rngZero });
    expect(ranking.find((r) => r.abilityId === 'kethran_sacrificio').value).toBeLessThan(-5);
  });

  it('Sacrificio vale se accende Rimonta (Bonus di Kethran), non se Kethran è già sotto', () => {
    const value = (g) => rankAiEminenceAbilities(roundState('kethran_altare', { presence: 0 }), 'enemy', {
      game: g, paramContext: paramContext(g), rng: rngZero,
    }).find((r) => r.abilityId === 'kethran_sacrificio').value;
    const bonus = { enemyArmyBonuses: { Kethran: true } };
    expect(value(game({ ...bonus, enemyHP: 20, playerHP: 20 }))).toBeGreaterThan(0);
    expect(value(game({ ...bonus, enemyHP: 15, playerHP: 20 }))).toBeLessThan(0);
    expect(value(game({ enemyHP: 20, playerHP: 20 }))).toBeLessThan(0);
  });

  it('Logoramento cresce con i Duelli persi; Terra Bruciata quando l\'avversario sta per vincere sui Campi', () => {
    const g = game({
      roundNumber: 3,
      enemyUsedCards: [11, 12],
      playerUsedCards: [1, 3],
      conqueredFields: { 0: { winner: 'player' }, 1: { winner: 'player' } },
    });
    const ms = roundState('calibri_quattro_fronti', {
      presence: 4,
      roundNumber: 3,
      persistent: { duelRecord: { won: 0, lost: 2, draw: 0 } },
    });
    const ranking = rankAiEminenceAbilities(ms, 'enemy', { game: g, paramContext: paramContext(g), rng: rngZero });
    expect(ranking.find((r) => r.abilityId === 'calibri_logoramento').value).toBeCloseTo(1.7);
    expect(ranking[0].abilityId).toBe('calibri_terra_bruciata');
  });

  it('bersagli: Seduzione vieta la carta più forte, Caccia impone la più debole', () => {
    const g = game();
    const ratti = rankAiEminenceAbilities(roundState('ratti_bella_malelabbra', { presence: 3 }), 'enemy', {
      game: g, paramContext: paramContext(g), rng: rngZero,
    });
    expect(ratti.find((r) => r.abilityId === 'ratti_seduzione').params.cardId).toBe(2);

    const mounthborn = rankAiEminenceAbilities(roundState('mounthborn_fame', { presence: 3 }), 'enemy', {
      game: g, paramContext: paramContext(g), rng: rngZero,
    });
    expect(mounthborn.find((r) => r.abilityId === 'mounthborn_caccia').params.preyCardId).toBe(1);
    expect(mounthborn.find((r) => r.abilityId === 'mounthborn_gorgoglio').params.preyCardId).toBe(2);
  });

  it('Preda iniziale: la carta più forte del giocatore viene prima', () => {
    expect(orderSetupPreyCandidates([1, 2, 3, 4, 5], playerHand)[0]).toBe(2);
  });

  it('la scelta resta legale con Presenza 0', () => {
    const g = game();
    for (const id of EMINENCE_IDS) {
      const ms = roundState(id, { presence: 0 });
      const next = chooseAiEminenceSelection(ms, 'enemy', { game: g, paramContext: paramContext(g) });
      const chosen = getEminence(id).abilities.find((a) => a.id === next.enemy.selectedAbilityId);
      expect(chosen, id).toBeTruthy();
      expect(chosen.presenceDelta, id).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('IA: risposte alle Offerte', () => {
  const offer = (source, extra = {}) => ({ mode: 'OFFER', kind: 'OFFER', ownerSide: 'player', recipientSide: 'enemy', source, choices: null, mustAccept: false, ...extra });
  const corte = (debts = []) => {
    const ms = createEminenceMatchState({ playerEminenceId: 'corte_rossa', enemyEminenceId: 'apex_sole_verde' });
    return { ...ms, player: { ...ms.player, persistent: { ...ms.player.persistent, endMatchDebts: debts } } };
  };
  const debt = (amount) => ({ side: 'enemy', ownerSide: 'player', amount, dueAt: 'END_MATCH', basis: 'FIXED' });

  it('accetta il Prestito con PV alti, lo rifiuta se il Registro diventerebbe letale', () => {
    expect(chooseAiDealResponse(offer('corte_prestito'), corte(), game()).dealAccepted).toBe(true);
    expect(chooseAiDealResponse(offer('corte_prestito'), corte([debt(2), debt(2)]), game({ enemyHP: 5 })).dealAccepted).toBe(false);
  });

  it('rifiuta gli Interessi quando può, li accetta quando è obbligata', () => {
    const ms = corte([debt(2), debt(2)]);
    expect(chooseAiDealResponse(offer('corte_interessi'), ms, game()).dealAccepted).toBe(false);
    expect(chooseAiDealResponse(offer('corte_interessi', { mustAccept: true }), ms, game()).dealAccepted).toBe(true);
  });

  it('Rinforzo: sceglie una variante ammessa', () => {
    const res = chooseAiDealResponse(offer('corte_rinforzo', { choices: ['damage', 'power'] }), corte(), game());
    expect(res.dealAccepted).toBe(true);
    expect(['damage', 'power']).toContain(res.dealChoice);
  });

  it('Corteggiamento: per seconda nei primi due turni, per prima dopo', () => {
    const deal = offer('ratti_corteggiamento', { kind: 'CHOICE', choices: ['first', 'second'] });
    expect(chooseAiDealResponse(deal, corte(), game({ roundNumber: 1 }))).toEqual({ dealAccepted: true, dealChoice: 'second' });
    expect(chooseAiDealResponse(deal, corte(), game({ roundNumber: 3 }))).toEqual({ dealAccepted: true, dealChoice: 'first' });
  });
});
