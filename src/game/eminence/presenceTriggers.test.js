import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkTrigger, createTriggerContext, EMINENCE_TRIGGERS, isEminenceTrigger } from '../triggerLogic.js';
import { capturePresenceSnapshot } from './presence.js';
import { createEminenceMatchState } from './eminenceState.js';
import { buildDuelTurnContexts } from '../duel/duelTurnContexts.js';
import { SIDES } from './eminenceConstants.js';

/** Contesto con Eminenza attiva su entrambi i lati. */
const ctx = (overrides = {}) => ({
  fieldModifiers: {},
  hasEminence: true,
  enemyHasEminence: true,
  playerPresence: 3,
  enemyPresence: 3,
  presenceSpent: 0,
  enemyPresenceSpent: 0,
  totalPresenceSpent: 0,
  enemyTotalPresenceSpent: 0,
  ...overrides,
});

// ------------------------------------------------------------------
// Registro
// ------------------------------------------------------------------

test('registro: sette trigger di Presenza', () => {
  assert.equal(EMINENCE_TRIGGERS.length, 7);
  assert.equal(isEminenceTrigger('digiuno'), true);
  assert.equal(isEminenceTrigger('overdrive'), false);
});

// ------------------------------------------------------------------
// Condizioni (§5)
// ------------------------------------------------------------------

test('manifestazione: hai speso Presenza in questo round', () => {
  assert.equal(checkTrigger('manifestazione', ctx({ presenceSpent: 2 })), true);
  assert.equal(checkTrigger('manifestazione', ctx({ presenceSpent: 0 })), false);
  // La spesa altrui non conta.
  assert.equal(checkTrigger('manifestazione', ctx({ enemyPresenceSpent: 4 })), false);
});

test('blasfemia: l\'avversario ha speso Presenza in questo round', () => {
  assert.equal(checkTrigger('blasfemia', ctx({ enemyPresenceSpent: 1 })), true);
  assert.equal(checkTrigger('blasfemia', ctx({ presenceSpent: 4 })), false);
});

test('fervore: soglia cumulativa di Scontro, non di round', () => {
  assert.equal(checkTrigger('fervore', ctx({ totalPresenceSpent: 2 })), false);
  assert.equal(checkTrigger('fervore', ctx({ totalPresenceSpent: 3 })), true);
  // Latch: la spesa cumulativa non decresce, quindi una volta acceso resta acceso.
  assert.equal(checkTrigger('fervore', ctx({ totalPresenceSpent: 9, presenceSpent: 0 })), true);
});

test('fervore: la soglia è configurabile dal Campo', () => {
  assert.equal(
    checkTrigger('fervore', ctx({ totalPresenceSpent: 2, fieldModifiers: { fervoreThreshold: 2 } })),
    true
  );
});

test('digiuno: Presenza esattamente a 0', () => {
  assert.equal(checkTrigger('digiuno', ctx({ playerPresence: 0 })), true);
  assert.equal(checkTrigger('digiuno', ctx({ playerPresence: 1 })), false);
});

test('digiuno: vale anche quando si arriva a 0 spendendo nello stesso round', () => {
  // Pagare il costo porta la Presenza a 0 prima dello snapshot: Digiuno è soddisfatto.
  assert.equal(checkTrigger('digiuno', ctx({ playerPresence: 0, presenceSpent: 2 })), true);
});

test('grazia: soglia alta di Presenza posseduta', () => {
  assert.equal(checkTrigger('grazia', ctx({ playerPresence: 4 })), false);
  assert.equal(checkTrigger('grazia', ctx({ playerPresence: 5 })), true);
});

test('ascendente e soggezione: confronto tra le due Presenze', () => {
  const ahead = ctx({ playerPresence: 5, enemyPresence: 2 });
  const behind = ctx({ playerPresence: 1, enemyPresence: 6 });
  const level = ctx({ playerPresence: 3, enemyPresence: 3 });

  assert.equal(checkTrigger('ascendente', ahead), true);
  assert.equal(checkTrigger('soggezione', ahead), false);
  assert.equal(checkTrigger('ascendente', behind), false);
  assert.equal(checkTrigger('soggezione', behind), true);
  // La parità non soddisfa nessuno dei due.
  assert.equal(checkTrigger('ascendente', level), false);
  assert.equal(checkTrigger('soggezione', level), false);
});

// ------------------------------------------------------------------
// Assenza di Eminenza (§1.2)
// ------------------------------------------------------------------

test('assenza di Eminenza: nessun trigger di Presenza è soddisfacibile', () => {
  const none = ctx({ hasEminence: false, enemyHasEminence: false, playerPresence: null, enemyPresence: null });
  for (const trigger of EMINENCE_TRIGGERS) {
    assert.equal(checkTrigger(trigger, none), false, `${trigger} soddisfatto senza Eminenza`);
  }
});

test('assenza di Eminenza: il fallback tecnico non equivale a Digiuno', () => {
  // Il punto delicato: "nessuna Eminenza" non è "Presenza 0".
  assert.equal(checkTrigger('digiuno', ctx({ hasEminence: false, playerPresence: 0 })), false);
});

test('assenza di Eminenza: il contesto di default non soddisfa nulla', () => {
  const base = createTriggerContext({});
  assert.equal(base.hasEminence, false);
  assert.equal(base.playerPresence, null);
  for (const trigger of EMINENCE_TRIGGERS) {
    assert.equal(checkTrigger(trigger, base), false, `${trigger} soddisfatto su contesto vuoto`);
  }
});

test('assenza di Eminenza su un solo lato: i confronti restano insoddisfatti', () => {
  const oneSided = ctx({ enemyHasEminence: false, enemyPresence: null, playerPresence: 4 });
  assert.equal(checkTrigger('ascendente', oneSided), false);
  assert.equal(checkTrigger('soggezione', oneSided), false);
  assert.equal(checkTrigger('blasfemia', oneSided), false);
  // I trigger che guardano solo sé stessi continuano invece a funzionare.
  assert.equal(checkTrigger('grazia', oneSided), false);
  assert.equal(checkTrigger('digiuno', ctx({ enemyHasEminence: false, playerPresence: 0 })), true);
});

// ------------------------------------------------------------------
// Snapshot canonico (§8.1)
// ------------------------------------------------------------------

test('snapshot: i contesti dei due lati sono speculari', () => {
  const matchState = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  matchState[SIDES.PLAYER].presenceSpentThisRound = 2;
  matchState[SIDES.PLAYER].totalPresenceSpent = 4;

  const snapshot = capturePresenceSnapshot(matchState);
  const { playerContext, enemyContext } = buildDuelTurnContexts({
    isPlayerFirst: true,
    lastWinner: null,
    selectedFocus: 1,
    enemySelectedFocus: 1,
    playerUsedCards: [],
    enemyUsedCards: [],
    playerHP: 25,
    enemyHP: 25,
    pAgent: { id: 1, league: 3 },
    eAgent: { id: 2, league: 3 },
    playerFieldsConquered: 0,
    enemyFieldsConquered: 0,
    roundNumber: 1,
    presenceSnapshot: snapshot,
    playerHasEminence: true,
    enemyHasEminence: true,
  });

  assert.equal(playerContext.playerPresence, 3);
  assert.equal(playerContext.enemyPresence, 0);
  assert.equal(enemyContext.playerPresence, 0);
  assert.equal(enemyContext.enemyPresence, 3);

  assert.equal(checkTrigger('ascendente', playerContext), true);
  assert.equal(checkTrigger('soggezione', enemyContext), true);
  assert.equal(checkTrigger('digiuno', enemyContext), true);
  assert.equal(checkTrigger('manifestazione', playerContext), true);
  assert.equal(checkTrigger('blasfemia', enemyContext), true);
  assert.equal(checkTrigger('fervore', playerContext), true);
});

test('snapshot: una variazione successiva non retroagisce sui trigger', () => {
  const matchState = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'apex_sole_verde',
  });

  const snapshot = capturePresenceSnapshot(matchState);
  matchState[SIDES.PLAYER].presence = 9;

  const context = { ...snapshot[SIDES.PLAYER], fieldModifiers: {}, hasEminence: true, enemyHasEminence: true };
  // La Presenza reale è salita a 9, ma il contesto continua a valere 3.
  assert.equal(checkTrigger('grazia', context), false);
  assert.equal(checkTrigger('ascendente', context), false);
});
