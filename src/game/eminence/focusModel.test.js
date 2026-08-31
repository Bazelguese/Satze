import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FOCUS_READINGS,
  createFocus,
  grantTemporaryFocus,
  clearTemporaryFocus,
  readFocus,
  buildFocusContextFields,
} from './focusModel.js';
import { checkTrigger } from '../triggerLogic.js';
import { buildDuelTurnContexts } from '../duel/duelTurnContexts.js';

const ctx = (overrides = {}) => ({ fieldModifiers: {}, ...overrides });

// ------------------------------------------------------------------
// Modello
// ------------------------------------------------------------------

test('modello: l\'effettivo è la somma di investiti e temporanei', () => {
  const focus = createFocus(3, 2);
  assert.deepEqual(focus, { invested: 3, temporary: 2, effective: 5 });
});

test('modello: i temporanei si accumulano e poi svaniscono a fine Duello', () => {
  let focus = grantTemporaryFocus(createFocus(2, 0), 3);
  assert.equal(focus.effective, 5);
  assert.equal(focus.invested, 2);

  focus = clearTemporaryFocus(focus);
  assert.deepEqual(focus, { invested: 2, temporary: 0, effective: 2 });
});

test('modello: valori negativi non producono FC negativi', () => {
  assert.deepEqual(createFocus(-3, -1), { invested: 0, temporary: 0, effective: 0 });
});

// ------------------------------------------------------------------
// Tabella delle letture (§6)
// ------------------------------------------------------------------

test('tabella: VA, Overdrive e contributi di Campo usano l\'effettivo', () => {
  const focus = createFocus(2, 3);
  assert.equal(readFocus(focus, FOCUS_READINGS.VA), 5);
  assert.equal(readFocus(focus, FOCUS_READINGS.OVERDRIVE), 5);
  assert.equal(readFocus(focus, FOCUS_READINGS.FIELD_FC_CONTRIBUTION), 5);
});

test('tabella: Opportunista, Accumulo e Ancorato usano solo l\'investito', () => {
  const focus = createFocus(2, 3);
  assert.equal(readFocus(focus, FOCUS_READINGS.OPPORTUNISTA), 2);
  assert.equal(readFocus(focus, FOCUS_READINGS.ACCUMULO), 2);
  assert.equal(readFocus(focus, FOCUS_READINGS.ANCORATO), 2);
});

test('tabella: il massimo legale spendibile ignora i temporanei', () => {
  assert.equal(readFocus(createFocus(4, 4), FOCUS_READINGS.LEGAL_SPEND_POOL), 4);
});

test('tabella: una lettura non dichiarata è un errore, non un default silenzioso', () => {
  assert.throws(() => readFocus(createFocus(1, 1), 'QUALCOSA_DI_NUOVO'), /Lettura FC non dichiarata/);
});

// ------------------------------------------------------------------
// Effetto sui trigger esistenti
// ------------------------------------------------------------------

test('Overdrive: gli FC temporanei possono soddisfarlo', () => {
  const fields = buildFocusContextFields(createFocus(2, 3), createFocus(0, 0));
  assert.equal(checkTrigger('overdrive', ctx(fields)), true);
});

test('Overdrive: senza temporanei il comportamento è quello di sempre', () => {
  assert.equal(checkTrigger('overdrive', ctx({ focusCoins: 4 })), false);
  assert.equal(checkTrigger('overdrive', ctx({ focusCoins: 5 })), true);
});

test('Opportunista: gli FC temporanei dell\'avversario non lo soddisfano', () => {
  // L'avversario ha 5 FC effettivi ma ne ha investiti solo 2 dal proprio pool.
  const fields = buildFocusContextFields(createFocus(0, 0), createFocus(2, 3));
  assert.equal(fields.enemyEffectiveFocus, 5);
  assert.equal(checkTrigger('opportunista', ctx(fields)), false);
});

test('Opportunista: resta soddisfatto dai soli FC realmente investiti', () => {
  const fields = buildFocusContextFields(createFocus(0, 0), createFocus(5, 0));
  assert.equal(checkTrigger('opportunista', ctx(fields)), true);
});

test('asimmetria: la stessa concessione soddisfa Overdrive e non Opportunista', () => {
  // Il caso della Corte Rossa -4 su un Agente avversario: gli fa scattare Overdrive
  // senza far scattare il proprio Opportunista.
  const beneficiary = buildFocusContextFields(createFocus(2, 3), createFocus(1, 0));
  const opponent = buildFocusContextFields(createFocus(1, 0), createFocus(2, 3));

  assert.equal(checkTrigger('overdrive', ctx(beneficiary)), true);
  assert.equal(checkTrigger('opportunista', ctx(opponent)), false);
});

// ------------------------------------------------------------------
// Integrazione nei contesti di duello
// ------------------------------------------------------------------

const turnContextParams = (extra = {}) => ({
  isPlayerFirst: true,
  lastWinner: null,
  selectedFocus: 2,
  enemySelectedFocus: 1,
  playerUsedCards: [],
  enemyUsedCards: [],
  playerHP: 25,
  enemyHP: 25,
  pAgent: { id: 1, league: 3 },
  eAgent: { id: 2, league: 4 },
  playerFieldsConquered: 0,
  enemyFieldsConquered: 0,
  roundNumber: 2,
  ...extra,
});

test('contesti: senza Eminenze il Focus investito resta il valore storico', () => {
  const { playerContext, enemyContext } = buildDuelTurnContexts(turnContextParams());

  assert.equal(playerContext.focusCoins, 2);
  assert.equal(playerContext.enemyFocusCoins, 1);
  assert.equal(playerContext.effectiveFocus, 2);
  assert.equal(enemyContext.focusCoins, 1);
  assert.equal(enemyContext.effectiveFocus, 1);
});

test('contesti: i temporanei entrano nell\'effettivo di entrambi i lati, in modo speculare', () => {
  const { playerContext, enemyContext } = buildDuelTurnContexts(
    turnContextParams({ playerTemporaryFocus: 3, enemyTemporaryFocus: 1 })
  );

  assert.equal(playerContext.focusInvested, 2);
  assert.equal(playerContext.effectiveFocus, 5);
  assert.equal(playerContext.enemyEffectiveFocus, 2);

  assert.equal(enemyContext.focusInvested, 1);
  assert.equal(enemyContext.effectiveFocus, 2);
  assert.equal(enemyContext.enemyEffectiveFocus, 5);
});
