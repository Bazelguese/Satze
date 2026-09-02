import test from 'node:test';
import assert from 'node:assert/strict';

import {
  autoSelectForcedChoices,
  autoSelectFirstLegalAbility,
  advanceToNextRevealGate,
  prepareEminenceDuel,
  settleEminenceRound,
} from './eminenceDuelGate.js';
import { beginEminenceRound, selectEminenceAbility } from './eminenceRound.js';
import { createEminenceMatchState } from './eminenceState.js';
import {
  EMINENCE_FORMAT,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  REVEAL_GATES,
  SIDES,
} from './eminenceConstants.js';

function match({ player = 'apex_sole_verde', enemy = null, presence = {} } = {}) {
  let state = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: player,
    enemyEminenceId: enemy,
  });

  for (const [side, value] of Object.entries(presence)) {
    state = { ...state, [side]: { ...state[side], presence: value } };
  }

  return beginEminenceRound(state, { roundNumber: 1 });
}

/** Registra una scelta fallendo rumorosamente: una scelta illegale falserebbe il test. */
function choose(state, side, abilityId) {
  const attempt = selectEminenceAbility(state, side, abilityId);
  assert.equal(attempt.reason, null);
  return attempt.matchState;
}

test('sottosistema spento: la preparazione è trasparente', () => {
  const disabled = createEminenceMatchState({ format: EMINENCE_FORMAT.DISABLED });
  const result = prepareEminenceDuel(disabled);

  assert.equal(result.bundle, null);
  assert.equal(result.blocked, null);
  assert.equal(result.matchState, disabled);
});

test('scelta forzata: con una sola opzione legale viene registrata da sola', () => {
  // Patto parte da 0 Presenza: Rosso (-2) è illegale, restano Verde (+1) e Giallo (0).
  const two = match({ player: 'patto_grande_semaforo' });
  assert.equal(autoSelectForcedChoices(two)[SIDES.PLAYER].selectedAbilityId, null);

  // Mounthborn al round 1 ha 1 Presenza e una sola attiva a costo non negativo.
  const one = match({ player: 'mounthborn_fame' });
  assert.equal(
    autoSelectForcedChoices(one)[SIDES.PLAYER].selectedAbilityId,
    'mounthborn_gorgoglio'
  );
});

test('scelta forzata: un\'unica legale con parametri AT_SELECTION resta da decidere', () => {
  const state = match({ player: 'mascarada_organizzatore' });
  assert.equal(autoSelectForcedChoices(state)[SIDES.PLAYER].selectedAbilityId, null);
});

test('placeholder: con più opzioni legali prende la prima e sblocca il Duello', () => {
  const state = match({ player: 'patto_grande_semaforo' });
  const sealed = autoSelectFirstLegalAbility(state, SIDES.PLAYER);

  assert.equal(sealed[SIDES.PLAYER].selectedAbilityId, 'semaforo_verde');
  const prepared = prepareEminenceDuel(sealed);
  assert.equal(prepared.blocked, null);
});

test('placeholder: su Khemet la prima legale è +0 e non richiede slot', () => {
  const state = match({ player: 'khemet_maledizioni' });
  const sealed = autoSelectFirstLegalAbility(state, SIDES.PLAYER);
  assert.equal(sealed[SIDES.PLAYER].selectedAbilityId, 'khemet_devozione');
  const prepared = prepareEminenceDuel(sealed);
  assert.equal(prepared.blocked, null);
});

test('gate GENERAL bloccato finché una scelta libera resta pendente', () => {
  const state = match({ player: 'patto_grande_semaforo' });
  const result = prepareEminenceDuel(state);

  assert.equal(result.blocked, 'SELECTIONS_INCOMPLETE');
  assert.equal(result.bundle, null);
});

test('preparazione: apre il gate, paga la Presenza e compone il bundle', () => {
  // Cataclisma costa 4: la Presenza iniziale di Apex è 3, quindi serve un guadagno prima.
  const state = match({ player: 'apex_sole_verde', presence: { [SIDES.PLAYER]: 4 } });
  const chosen = choose(state, SIDES.PLAYER, 'apex_cataclisma');

  const result = prepareEminenceDuel(chosen, { initiativeSide: SIDES.PLAYER });

  assert.equal(result.blocked, null);
  assert.equal(result.matchState[SIDES.PLAYER].revealedAbilityId, 'apex_cataclisma');
  // Il costo si paga al reveal, non alla scelta.
  assert.equal(result.matchState[SIDES.PLAYER].presence, 0);
  assert.equal(result.matchState[SIDES.PLAYER].presenceSpentThisRound, 4);
  assert.equal(result.bundle.statDeltas[SIDES.PLAYER].power, 2);
  assert.equal(result.bundle.statDeltas[SIDES.PLAYER].damage, 2);
});

test('preparazione: i segmenti differiti arrivano al proprio checkpoint, non prima', () => {
  const state = match({ player: 'patto_grande_semaforo' });
  const chosen = choose(state, SIDES.PLAYER, 'semaforo_verde');

  const result = prepareEminenceDuel(chosen);

  // Il Semaforo dichiara BEFORE_TRIGGER_CHECK: se la raccolta per checkpoint non
  // funzionasse, l'overlay resterebbe vuoto.
  assert.equal(result.bundle.triggerRules.forceSatisfied.length, 1);
  assert.equal(result.bundle.triggerRules.forceForbidden.length, 1);
});

test('preparazione: un gate già superato non si riapre', () => {
  const state = match({ player: 'apex_sole_verde' });
  const chosen = choose(state, SIDES.PLAYER, 'apex_furia');

  const first = prepareEminenceDuel(chosen);
  const second = prepareEminenceDuel(first.matchState);

  assert.equal(first.matchState[SIDES.PLAYER].presence, 4);
  assert.equal(second.matchState[SIDES.PLAYER].presence, 4);
  assert.ok(second.bundle.hpDeltas.some((entry) => (
    entry.side === SIDES.PLAYER && entry.amount === -2
  )));
});

/** Arma un segmento differito senza passare da un'Eminenza reale del catalogo. */
function withPendingEffect(state, side, timing, segment) {
  return {
    ...state,
    [side]: {
      ...state[side],
      round: {
        ...state[side].round,
        pendingEffects: [
          ...state[side].round.pendingEffects,
          { ownerSide: side, abilityId: 'test_effetto', timing, consumed: false, segment },
        ],
      },
    },
  };
}

test('preparazione: i delta di Presenza da effetto non contano come spesa', () => {
  const state = withPendingEffect(match({ player: 'apex_sole_verde' }), SIDES.PLAYER,
    'BEFORE_TRIGGER_CHECK', { primitive: P.CHANGE_PRESENCE, target: T.SELF, delta: -1 });
  const chosen = choose(state, SIDES.PLAYER, 'apex_furia');

  const { matchState } = prepareEminenceDuel(chosen);

  // 3 iniziali, +1 da Furia, -1 dall'effetto.
  assert.equal(matchState[SIDES.PLAYER].presence, 3);
  assert.equal(matchState[SIDES.PLAYER].presenceSpentThisRound, 0);
  assert.equal(matchState[SIDES.PLAYER].totalPresenceSpent, 0);
});

test('preparazione: lo stato restituito è già pronto per lo snapshot di Presenza', () => {
  const state = withPendingEffect(match({ player: 'apex_sole_verde' }), SIDES.PLAYER,
    'BEFORE_TRIGGER_CHECK', { primitive: P.CHANGE_PRESENCE, target: T.SELF, delta: 2 });
  const chosen = choose(state, SIDES.PLAYER, 'apex_disprezzo');

  const { matchState, bundle } = prepareEminenceDuel(chosen);

  // Il guadagno Pre-Trigger deve essere già dentro: i trigger Eminenza lo leggono da qui.
  assert.equal(matchState[SIDES.PLAYER].presence, 3);
  assert.equal(bundle.presenceChanges.length, 1);
});

test('chiusura: un blocco pianificato ricade sul round successivo', () => {
  const state = withPendingEffect(
    match({ player: 'apex_sole_verde', enemy: 'patto_grande_semaforo' }),
    SIDES.PLAYER,
    'POST_BATTLE',
    { primitive: P.BLOCK_EMINENCE, target: T.OPPONENT, duration: 'NEXT_ROUND' }
  );

  const { matchState } = settleEminenceRound(state);

  assert.equal(matchState[SIDES.ENEMY].blockedNextRound, true);
  assert.equal(matchState[SIDES.ENEMY].blockedThisRound, false);

  const nextRound = beginEminenceRound(matchState, { roundNumber: 2 });
  assert.equal(nextRound[SIDES.ENEMY].blockedThisRound, true);
});

test('chiusura: i checkpoint post-Duello producono un bundle separato', () => {
  const state = withPendingEffect(match({ player: 'apex_sole_verde' }), SIDES.PLAYER,
    'BEFORE_CONQUEST', { primitive: P.LOSE_HP, target: T.OPPONENT, amount: 3 });

  const { bundle } = settleEminenceRound(state);

  assert.equal(bundle.hpDeltas.length, 1);
  assert.equal(bundle.hpDeltas[0].side, SIDES.ENEMY);
  assert.equal(bundle.hpDeltas[0].amount, -3);
});

test('chiusura: senza segmenti post-Duello non produce alcun bundle', () => {
  assert.equal(settleEminenceRound(match({ player: 'apex_sole_verde' })).bundle, null);
});

test('reveal: il lato umano non viene riempito in automatico', () => {
  const base = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: 'corte_rossa',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  base.player.presence = 4;
  let state = beginEminenceRound(base, { roundNumber: 1 });
  state = choose(state, SIDES.PLAYER, 'corte_debito_eterno');
  state = choose(state, SIDES.ENEMY, 'semaforo_giallo');

  const prepared = prepareEminenceDuel(state, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 301 },
  });
  assert.equal(prepared.blocked, 'REVEAL_PARAMS_INCOMPLETE');
  assert.equal(prepared.matchState.player.selectedParams?.cardId ?? null, null);
});

test('reveal: il lato senza UI riceve l\'Agente confermato mancante', () => {
  const base = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: 'patto_grande_semaforo',
    enemyEminenceId: 'corte_rossa',
  });
  base.enemy.presence = 4;
  let state = beginEminenceRound(base, { roundNumber: 1 });
  state = choose(state, SIDES.PLAYER, 'semaforo_giallo');
  state = choose(state, SIDES.ENEMY, 'corte_debito_eterno');

  const prepared = prepareEminenceDuel(state, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 301 },
  });
  assert.equal(prepared.blocked, null);
  assert.equal(prepared.matchState.enemy.selectedParams.cardId, 301);
});

test('GENERAL già aperto: PV e FC del reveal restano nel bundle del Duello', () => {
  let state = match({ player: 'apex_sole_verde', enemy: 'patto_grande_semaforo' });
  state = choose(state, SIDES.PLAYER, 'apex_furia');
  state = choose(state, SIDES.ENEMY, 'semaforo_giallo');
  state = advanceToNextRevealGate(state).matchState;
  state = advanceToNextRevealGate(state).matchState;
  state = advanceToNextRevealGate(state).matchState;
  assert.equal(state.player.revealedAbilityId, 'apex_furia');

  const prepared = prepareEminenceDuel(state, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 301 },
  });
  assert.equal(prepared.blocked, null);
  assert.ok(prepared.bundle.hpDeltas.some((entry) => (
    entry.side === SIDES.PLAYER && entry.amount === -2
  )));
  assert.equal(prepared.bundle.statDeltas[SIDES.PLAYER].power, 1);
});

test('gate GENERAL: la coda rispetta l\'iniziativa dichiarata', () => {
  let state = match({ player: 'apex_sole_verde', enemy: 'apex_sole_verde' });
  state = choose(state, SIDES.PLAYER, 'apex_furia');
  state = choose(state, SIDES.ENEMY, 'apex_furia');

  const result = prepareEminenceDuel(state, { initiativeSide: SIDES.ENEMY });
  const reveals = result.events.filter((event) => event.type === 'REVEAL');

  assert.equal(reveals[0].side, SIDES.ENEMY);
  assert.equal(reveals[1].side, SIDES.PLAYER);
  assert.equal(result.events.at(-1).gate, REVEAL_GATES.GENERAL);
});
