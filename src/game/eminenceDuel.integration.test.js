/**
 * Test di integrazione: il bundle Eminenza attraversa la catena reale fino a
 * `computeDuelResolution`. Percorre l'intero innesto — catalogo, gate, primitive, overlay —
 * invece di iniettare un overlay costruito a mano.
 */
import { describe, it, expect } from 'vitest';

import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { createEminenceMatchState } from './eminence/eminenceState.js';
import {
  beginEminenceRound,
  collectPendingEffects,
  completeGate,
  selectEminenceAbility,
} from './eminence/eminenceRound.js';
import { applyEminenceSegments } from './eminence/primitiveHandlers.js';
import {
  EFFECT_TIMINGS,
  EMINENCE_FORMAT,
  REVEAL_GATES,
  SIDES,
} from './eminence/eminenceConstants.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);

function agent(name, army, ability) {
  return { name, army, power: 4, damage: 3, league: 2, ability };
}

const baseInput = {
  field: neutralField,
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 20,
  enemyHP: 20,
  playerFocus: 6,
  enemyFocus: 6,
  playerUsedCards: [],
  enemyUsedCards: [],
  // Il giocatore risponde. Imboscata è quindi naturalmente falsa per lui e vera per
  // l'avversario: lo stesso trigger cade sui due lati in modo opposto, e un overlay che
  // sbagliasse lato si vedrebbe subito.
  isPlayerFirst: false,
  lastWinner: null,
  playerArmyBonuses: {},
  enemyArmyBonuses: {},
  playerToxin: null,
  enemyToxin: null,
  roundNumber: 1,
  conqueredFields: {},
  playerHand: [],
  enemyHand: [],
  currentFieldIndex: 0,
  selectedAgent: agent('Tu', 'Patto degli Indocili', {
    trigger: 'imboscata',
    effect: 'power',
    value: 2,
  }),
  enemyAgent: agent('IA', 'Kethran', {
    trigger: 'imboscata',
    effect: 'power',
    value: 2,
  }),
};

/**
 * Esegue il round Eminenza fino al Duello e restituisce il bundle dovuto prima
 * del controllo dei trigger.
 */
function bundleForAbility(abilityId, { presence = null } = {}) {
  let matchState = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: 'patto_grande_semaforo',
    enemyEminenceId: null,
  });

  if (presence != null) {
    matchState = {
      ...matchState,
      [SIDES.PLAYER]: { ...matchState[SIDES.PLAYER], presence },
    };
  }

  matchState = beginEminenceRound(matchState, { roundNumber: 1 });

  const selection = selectEminenceAbility(matchState, SIDES.PLAYER, abilityId);
  expect(selection.ok).toBe(true);

  const opened = completeGate(selection.matchState, REVEAL_GATES.GENERAL, {
    initiativeSide: SIDES.ENEMY,
  });
  const { queue } = collectPendingEffects(opened.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {
    initiativeSide: SIDES.ENEMY,
  });

  return applyEminenceSegments([...opened.resolutionQueue, ...queue]);
}

describe('Eminenze nel Duello reale', () => {
  it('senza Eminenza il Duello si comporta come prima', () => {
    const { battleResult } = computeDuelResolution({ ...baseInput });

    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('Semaforo Verde accende Imboscata su chi non ha l\'iniziativa', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_verde'),
    });

    expect(battleResult.playerPower).toBe(6);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('Semaforo Rosso spegne Imboscata anche sul lato avversario', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_rosso', { presence: 2 }),
    });

    // Il divieto è di ambito globale e nasce dal giocatore: se il lato venisse letto male,
    // il Potere avversario resterebbe attivo a 6.
    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(4);
  });

  it('Semaforo Giallo non deposita regole e lascia il Duello identico al naturale', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_giallo'),
    });

    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('il lato si legge dal contesto: un overlay non travasa fra i due agenti', () => {
    const bundle = bundleForAbility('semaforo_verde');
    // Regole di ambito globale: devono valere per entrambi i lati, non per il solo autore.
    expect(bundle.triggerRules.forceSatisfied).toHaveLength(1);
    expect(bundle.triggerRules.forceForbidden).toHaveLength(1);
    expect(bundle.triggerRules.forceSatisfied[0].ownerSide).toBe(SIDES.PLAYER);
  });
});
