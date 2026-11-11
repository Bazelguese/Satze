import test from 'node:test';
import assert from 'node:assert/strict';
import {
  playerFirstInRound,
  sideFirstInRound,
  countFuturePositionWindows,
} from './initiativeCalendar.js';
import { buildStrategicState } from './strategicState.js';
import { evaluateTriggerWindow } from './strategyPlanner.js';
import { estimateFutureCardValue } from './scoreAIAction.js';
import { makeAIContext, makeCard } from './aiTestFixtures.js';

test('calendario: alterna da openingPlayerFirst', () => {
  const source = { roundNumber: 1, openingPlayerFirst: true };
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((r) => playerFirstInRound(source, r)),
    [true, false, true, false, true]
  );
  assert.equal(sideFirstInRound(source, 'ai', 2), true);
});

test('calendario: profili campagna e alwaysPlayerFirst', () => {
  const assault = { roundNumber: 1, openingPlayerFirst: true, initiativeProfile: 'assault' };
  assert.deepEqual([1, 2, 3, 4].map((r) => playerFirstInRound(assault, r)), [true, true, false, true]);
  const always = { roundNumber: 1, openingPlayerFirst: false, campaignDuelMod: { alwaysPlayerFirst: true } };
  assert.equal(playerFirstInRound(always, 2), true);
  const strategic = { roundNumber: 1, openingPlayerFirst: false, _refs: { campaignDuelMod: { alwaysPlayerFirst: true } } };
  assert.equal(playerFirstInRound(strategic, 3), true);
});

test('calendario: senza apertura nota alterna dal turno corrente', () => {
  const source = { roundNumber: 3, isPlayerFirst: false };
  assert.deepEqual([3, 4, 5].map((r) => playerFirstInRound(source, r)), [false, true, false]);
});

test('finestre future: conta solo i turni coperti dalle carte rimaste', () => {
  // R2 con apertura giocatore: l'IA è prima al R2 e R4, seconda al R3 e R5.
  const source = { roundNumber: 2, openingPlayerFirst: true };
  assert.equal(countFuturePositionWindows(source, 'ai', true, 4), 1); // R3..R5: R4
  assert.equal(countFuturePositionWindows(source, 'ai', false, 4), 2); // R3, R5
  assert.equal(countFuturePositionWindows(source, 'ai', true, 2), 0); // solo R3
  assert.equal(countFuturePositionWindows(source, 'ai', true, 1), 0);
});

test('planner: Imboscata senza turni futuri da primi non va conservata', () => {
  const ambush = makeCard({ id: 210, ability: { trigger: 'imboscata', effect: 'power', value: 3 } });
  const filler = makeCard({ id: 211 });
  // R4, apertura IA (openingPlayerFirst=false): IA prima a R1,R3,R5; al R4 è seconda.
  const base = {
    roundNumber: 4,
    isPlayerFirst: true,
    openingPlayerFirst: false,
  };
  const withCards = (cards) =>
    buildStrategicState(
      makeAIContext({
        ...base,
        ai: { hand: cards, usedCardIds: [], hp: 20, focusPool: 6, focus: 6, armyBonuses: {}, toxin: null },
      })
    );
  // Due carte: R4 (ora, seconda) e R5 (prima) → una finestra futura
  const open = evaluateTriggerWindow(ambush, withCards([ambush, filler]), 'ai');
  assert.equal(open.ready, false);
  assert.ok(open.preserve > 0);
  // Una sola carta: nessun turno dopo questo → niente da conservare
  const closed = evaluateTriggerWindow(ambush, withCards([ambush]), 'ai');
  assert.equal(closed.preserve, 0);
  assert.equal(closed.reason, 'nessun-turno-futuro-da-primi');
});

test('valore futuro: Intervento vale se resta un turno da secondi', () => {
  const intervention = makeCard({ id: 220, ability: { trigger: 'intervention', effect: 'power', value: 3 } });
  const filler = makeCard({ id: 221 });
  const ctx = (round, opening, hand) =>
    makeAIContext({
      roundNumber: round,
      isPlayerFirst: opening === (round % 2 === 1),
      openingPlayerFirst: opening,
      ai: { hand, usedCardIds: [], hp: 20, focusPool: 6, focus: 6, armyBonuses: {}, toxin: null },
    });
  // R4, apertura giocatore → R5 giocatore primo: IA seconda al R5 → finestra disponibile
  const withWindow = estimateFutureCardValue(intervention, ctx(4, true, [intervention, filler]));
  // R4, apertura IA → R5 IA prima: nessuna finestra da secondi
  const withoutWindow = estimateFutureCardValue(intervention, ctx(4, false, [intervention, filler]));
  assert.ok(withWindow > withoutWindow);
});
