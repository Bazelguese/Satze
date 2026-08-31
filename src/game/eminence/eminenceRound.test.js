import { test } from 'node:test';
import assert from 'node:assert/strict';

import { REVEAL_GATES, EFFECT_TIMINGS, SIDES } from './eminenceConstants.js';
import { createEminenceMatchState } from './eminenceState.js';
import {
  changePresence,
  changeSidePresence,
  capturePresenceSnapshot,
} from './presence.js';
import {
  beginEminenceRound,
  selectEminenceAbility,
  areSelectionsComplete,
  mustChooseThisRound,
  completeGate,
  completeGeneralGate,
  isGateCompleted,
  getNextGate,
  resolveGateSequenceName,
  getSealedAbilityHypotheses,
  isSelectionPubliclyDetermined,
} from './eminenceRound.js';
import { selectPublicEminenceState } from './eminenceState.js';

const startRound = (playerId, enemyId, roundNumber = 1) =>
  beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: playerId, enemyEminenceId: enemyId }),
    { roundNumber }
  );

/** Porta un lato a una Presenza arbitraria prima dell'apertura del round. */
const startRoundWithPresence = (playerId, enemyId, { player = null, enemy = null } = {}) => {
  const base = createEminenceMatchState({ playerEminenceId: playerId, enemyEminenceId: enemyId });
  if (player !== null) base.player.presence = player;
  if (enemy !== null) base.enemy.presence = enemy;
  return beginEminenceRound(base, { roundNumber: 1 });
};

const chooseBoth = (matchState, playerAbility, enemyAbility) => {
  const first = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility);
  assert.equal(first.ok, true, `scelta giocatore rifiutata: ${first.reason}`);
  const second = selectEminenceAbility(first.matchState, SIDES.ENEMY, enemyAbility);
  assert.equal(second.ok, true, `scelta avversario rifiutata: ${second.reason}`);
  return second.matchState;
};

// ------------------------------------------------------------------
// Presenza (§2)
// ------------------------------------------------------------------

test('presenza: il guadagno non conta come spesa', () => {
  const base = { eminenceId: 'x', presence: 2, presenceSpentThisRound: 0, totalPresenceSpent: 0 };
  const { state, event } = changePresence(base, 2, { reason: 'test' });
  assert.equal(state.presence, 4);
  assert.equal(state.totalPresenceSpent, 0);
  assert.equal(event.countsAsSpend, false);
});

test('presenza: il costo aggiorna i contatori di spesa', () => {
  const base = { eminenceId: 'x', presence: 5, presenceSpentThisRound: 0, totalPresenceSpent: 1 };
  const { state } = changePresence(base, -3, { countsAsSpend: true });
  assert.equal(state.presence, 2);
  assert.equal(state.presenceSpentThisRound, 3);
  assert.equal(state.totalPresenceSpent, 4);
});

test('presenza: perdere Presenza non è spendere Presenza', () => {
  const base = { eminenceId: 'x', presence: 5, presenceSpentThisRound: 0, totalPresenceSpent: 0 };
  const { state } = changePresence(base, -2, { countsAsSpend: false });
  assert.equal(state.presence, 3);
  assert.equal(state.presenceSpentThisRound, 0);
  assert.equal(state.totalPresenceSpent, 0);
});

test('presenza: clamp a 0 e contatori allineati alla variazione reale', () => {
  const base = { eminenceId: 'x', presence: 1, presenceSpentThisRound: 0, totalPresenceSpent: 0 };
  const { state, event } = changePresence(base, -4, { countsAsSpend: true });
  assert.equal(state.presence, 0);
  assert.equal(state.presenceSpentThisRound, 1);
  assert.equal(event.requestedDelta, -4);
  assert.equal(event.appliedDelta, -1);
});

test('presenza: 0 può tornare a crescere', () => {
  const base = { eminenceId: 'x', presence: 0, presenceSpentThisRound: 0, totalPresenceSpent: 0 };
  assert.equal(changePresence(base, 2, {}).state.presence, 2);
});

test('presenza: variazione su un lato dello stato di partita', () => {
  const matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  const { matchState: next, event } = changeSidePresence(matchState, SIDES.ENEMY, 3, {});
  assert.equal(next.enemy.presence, 3);
  assert.equal(next.player.presence, 3);
  assert.equal(event.side, SIDES.ENEMY);
});

test('presenza: lo snapshot è simmetrico e già campionato', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = changeSidePresence(matchState, SIDES.ENEMY, 4, {}).matchState;

  const snapshot = capturePresenceSnapshot(matchState);
  assert.equal(snapshot.player.playerPresence, 3);
  assert.equal(snapshot.player.enemyPresence, 4);
  assert.equal(snapshot.enemy.playerPresence, 4);
  assert.equal(snapshot.enemy.enemyPresence, 3);

  // Campionato, non vivo: mutare lo stato dopo non tocca lo snapshot.
  const mutated = changeSidePresence(matchState, SIDES.ENEMY, 5, {}).matchState;
  assert.equal(mutated.enemy.presence, 9);
  assert.equal(snapshot.player.enemyPresence, 4);
});

// ------------------------------------------------------------------
// Apertura del round e scelta segreta (§2.2, §2.3)
// ------------------------------------------------------------------

test('round: il checkpoint di selezione parte dalla Presenza di inizio round', () => {
  const matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  assert.equal(matchState.player.selectionCheckpointPresence, 3);
  assert.equal(matchState.enemy.selectionCheckpointPresence, 0);
});

test('round: sequenza dei gate normale, Campo prima degli Agenti', () => {
  const matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  assert.equal(matchState.gateProgress.sequenceName, 'FIELD_FIRST');
  assert.equal(getNextGate(matchState.gateProgress), REVEAL_GATES.PRE_FIELD);
});

test('round: lo Statico di Mascarada riordina i gate, Agenti prima del Campo', () => {
  const matchState = startRound('mascarada_organizzatore', 'apex_sole_verde');
  assert.equal(resolveGateSequenceName(matchState), 'AGENTS_FIRST');
  assert.deepEqual(matchState.gateProgress.sequence, [
    REVEAL_GATES.PRE_AGENT,
    REVEAL_GATES.PRE_FIELD,
    REVEAL_GATES.GENERAL,
  ]);
});

test('scelta: un\'abilità a costo superiore alla Presenza è illegale', () => {
  const matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  const result = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_cataclisma');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'INSUFFICIENT_PRESENCE');
  assert.equal(result.matchState.player.selectedAbilityId, null);
});

test('scelta: la selezione registra snapshot e prenotazione di costo', () => {
  const matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  const { matchState: next, ok } = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_disprezzo');

  assert.equal(ok, true);
  assert.equal(next.player.selectedAbilityId, 'apex_disprezzo');
  assert.equal(next.player.selectionSnapshotPresence, 3);
  assert.equal(next.player.committedPresenceCost, 2);
  // Prenotazione di legalità, non spesa pubblica anticipata.
  assert.equal(next.player.presence, 3);
  assert.equal(next.player.presenceSpentThisRound, 0);
});

test('scelta: non si può scegliere due volte nello stesso round', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_furia').matchState;
  const second = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_disprezzo');
  assert.equal(second.reason, 'ALREADY_SELECTED');
});

test('scelta: un\'Eminenza bloccata non sceglie e non impedisce il proseguimento', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = {
    ...matchState,
    player: { ...matchState.player, blockedThisRound: true },
  };

  assert.equal(mustChooseThisRound(matchState, SIDES.PLAYER), false);
  assert.equal(selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_furia').reason, 'EMINENCE_BLOCKED');

  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  assert.equal(areSelectionsComplete(matchState), true);
});

test('scelta: entrambi devono aver scelto prima di qualunque apertura', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_furia').matchState;

  assert.equal(areSelectionsComplete(matchState), false);
  const blocked = completeGate(matchState, REVEAL_GATES.GENERAL, {});
  assert.equal(blocked.blocked, 'SELECTIONS_INCOMPLETE');
  assert.equal(isGateCompleted(blocked.matchState.gateProgress, REVEAL_GATES.GENERAL), false);
});

// ------------------------------------------------------------------
// Reveal e pagamento (§2.4, §2.5, §3.5)
// ------------------------------------------------------------------

test('reveal: un gate apre solo i commitment che gli appartengono', () => {
  let matchState = startRound('khemet_maledizioni', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'khemet_maledizione_va', 'apex_furia');

  const { matchState: afterPreField } = completeGate(matchState, REVEAL_GATES.PRE_FIELD, {});

  assert.equal(afterPreField.player.revealedAbilityId, 'khemet_maledizione_va');
  assert.equal(afterPreField.player.presence, 0);
  // Apex è GENERAL: resta sigillata e non ha ancora pagato nulla.
  assert.equal(afterPreField.enemy.revealedAbilityId, null);
  assert.equal(afterPreField.enemy.presence, 3);
});

test('reveal: il delta base viene applicato all\'apertura, non alla selezione', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_disprezzo', 'semaforo_verde');

  assert.equal(matchState.player.presence, 3);

  const { matchState: revealed } = completeGeneralGate(matchState, {});
  assert.equal(revealed.player.presence, 1);
  assert.equal(revealed.player.presenceSpentThisRound, 2);
  assert.equal(revealed.enemy.presence, 1);
  assert.equal(revealed.enemy.presenceSpentThisRound, 0);
});

test('reveal: il pagamento è atomico rispetto allo snapshot delle scelte', () => {
  // Entrambi spendono nella stessa finestra. Chi risolve per primo non deve poter rendere
  // impagabile la scelta dell'altro: i due delta nascono dallo stesso stato pre-gate.
  let matchState = startRound('apex_sole_verde', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'apex_disprezzo', 'apex_disprezzo');

  const withPlayerFirst = completeGeneralGate(matchState, { initiativeSide: SIDES.PLAYER });
  const withEnemyFirst = completeGeneralGate(matchState, { initiativeSide: SIDES.ENEMY });

  assert.equal(withPlayerFirst.matchState.player.presence, 1);
  assert.equal(withPlayerFirst.matchState.enemy.presence, 1);
  assert.deepEqual(
    [withEnemyFirst.matchState.player.presence, withEnemyFirst.matchState.enemy.presence],
    [1, 1]
  );
});

test('reveal: la risoluzione segue l\'iniziativa anche se il pagamento è simultaneo', () => {
  let matchState = startRound('apex_sole_verde', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'apex_furia', 'apex_furia');

  const playerFirst = completeGeneralGate(matchState, { initiativeSide: SIDES.PLAYER });
  const enemyFirst = completeGeneralGate(matchState, { initiativeSide: SIDES.ENEMY });

  assert.equal(playerFirst.resolutionQueue[0].ownerSide, SIDES.PLAYER);
  assert.equal(enemyFirst.resolutionQueue[0].ownerSide, SIDES.ENEMY);
  assert.equal(playerFirst.resolutionQueue.length, enemyFirst.resolutionQueue.length);
});

test('reveal: i segmenti differiti vengono armati, non risolti', () => {
  let matchState = startRound('patto_grande_semaforo', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'semaforo_verde', 'apex_furia');

  const { matchState: revealed, resolutionQueue } = completeGeneralGate(matchState, {});

  // Il Semaforo opera a BEFORE_TRIGGER_CHECK: due segmenti in coda, zero immediati.
  const pending = revealed.player.round.pendingEffects;
  assert.equal(pending.length, 2);
  assert.ok(pending.every((entry) => entry.timing === EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK));
  assert.ok(pending.every((entry) => entry.consumed === false));
  assert.ok(resolutionQueue.every((entry) => entry.ownerSide !== SIDES.PLAYER));

  // Apex +1 opera invece subito dopo il reveal.
  assert.equal(resolutionQueue.length, 2);
  assert.ok(resolutionQueue.every((entry) => entry.timing === EFFECT_TIMINGS.AFTER_REVEAL));
});

test('reveal: i segmenti portano l\'id dell\'Eminenza sorgente', () => {
  let matchState = startRoundWithPresence('apex_sole_verde', 'patto_grande_semaforo', { player: 4 });
  matchState = chooseBoth(matchState, 'apex_cataclisma', 'semaforo_giallo');

  const { resolutionQueue } = completeGeneralGate(matchState, {});
  assert.equal(resolutionQueue.length, 2);
  assert.ok(resolutionQueue.every((entry) => entry.sourceEminenceId === 'apex_sole_verde'));
});

test('reveal: un gate risulta superato anche quando nessuno apre', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_furia', 'semaforo_verde');

  const { matchState: afterPreField, events } = completeGate(matchState, REVEAL_GATES.PRE_FIELD, {});

  assert.equal(isGateCompleted(afterPreField.gateProgress, REVEAL_GATES.PRE_FIELD), true);
  assert.equal(events.find((e) => e.type === 'GATE_COMPLETED').revealCount, 0);
});

test('reveal: completare due volte lo stesso gate non ha effetto', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_disprezzo', 'semaforo_verde');

  const first = completeGeneralGate(matchState, {});
  const second = completeGeneralGate(first.matchState, {});

  assert.equal(second.matchState.player.presence, first.matchState.player.presence);
  assert.equal(second.events.length, 0);
});

// ------------------------------------------------------------------
// Deduzioni pubbliche (§3.2, §10.4)
// ------------------------------------------------------------------

test('deduzione: a inizio round le ipotesi sono le sole abilità legali al checkpoint', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_furia', 'semaforo_verde');

  const playerView = selectPublicEminenceState(matchState.player);
  // Apex a 3 Presenza: -4 era illegale alla selezione.
  assert.deepEqual(
    getSealedAbilityHypotheses(playerView, matchState.gateProgress),
    ['apex_furia', 'apex_disprezzo']
  );

  // Il Grande Semaforo a 0 Presenza non poteva scegliere Rosso.
  const enemyView = selectPublicEminenceState(matchState.enemy);
  assert.deepEqual(
    getSealedAbilityHypotheses(enemyView, matchState.gateProgress),
    ['semaforo_verde', 'semaforo_giallo']
  );
});

test('deduzione: usa la Presenza al checkpoint, non quella corrente', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_furia', 'semaforo_verde');

  // Uno Statico avversario porta l'Apex a 6 Presenza dopo la scelta segreta.
  matchState = changeSidePresence(matchState, SIDES.PLAYER, 3, { reason: 'statico' }).matchState;
  assert.equal(matchState.player.presence, 6);

  const playerView = selectPublicEminenceState(matchState.player);
  const hypotheses = getSealedAbilityHypotheses(playerView, matchState.gateProgress);

  // Con la Presenza corrente -4 sembrerebbe possibile; al checkpoint non lo era.
  assert.equal(hypotheses.includes('apex_cataclisma'), false);
  assert.deepEqual(hypotheses, ['apex_furia', 'apex_disprezzo']);
});

test('deduzione: superare un gate senza apertura restringe le ipotesi', () => {
  // Mounthborn parte a 1 Presenza, dove solo il +0 è legale: qui serve una Presenza
  // che renda davvero ambigua la scelta, altrimenti non c'è nulla da restringere.
  let matchState = startRoundWithPresence('mounthborn_fame', 'apex_sole_verde', { player: 3 });
  matchState = chooseBoth(matchState, 'mounthborn_frenesia', 'apex_furia');

  const before = getSealedAbilityHypotheses(
    selectPublicEminenceState(matchState.player),
    matchState.gateProgress
  );
  assert.equal(before.length, 3);

  const { matchState: afterPreAgent } = completeGate(matchState, REVEAL_GATES.PRE_AGENT, {});
  const after = getSealedAbilityHypotheses(
    selectPublicEminenceState(afterPreAgent.player),
    afterPreAgent.gateProgress
  );

  assert.deepEqual(after, ['mounthborn_frenesia', 'mounthborn_cannibalismo']);
  assert.equal(isSelectionPubliclyDetermined(selectPublicEminenceState(afterPreAgent.player), afterPreAgent.gateProgress), false);
});

test('deduzione: una curva può rendere la scelta determinata anche senza gate anticipati', () => {
  // Mounthborn: Presenza iniziale 1 con curva +0 / -2 / -2. Al round 1 esiste una sola
  // scelta legale, quindi la sua Eminenza è pubblica pur avendo due attive a GENERAL.
  // È una proprietà dell'economia, non dei gate, e non la copre l'invariante di catalogo.
  let matchState = startRound('mounthborn_fame', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'mounthborn_gorgoglio', 'apex_furia');

  const view = selectPublicEminenceState(matchState.player);
  assert.deepEqual(getSealedAbilityHypotheses(view, matchState.gateProgress), ['mounthborn_gorgoglio']);
  assert.equal(isSelectionPubliclyDetermined(view, matchState.gateProgress), true);
});

test('deduzione: Khemet è a informazione aperta dopo PRE_FIELD', () => {
  let matchState = startRound('khemet_maledizioni', 'apex_sole_verde');
  matchState = chooseBoth(matchState, 'khemet_devozione', 'apex_furia');

  const { matchState: afterPreField } = completeGate(matchState, REVEAL_GATES.PRE_FIELD, {});
  const view = selectPublicEminenceState(afterPreField.player);

  // Nessuna deduzione silenziosa: il +0 è stato aperto esplicitamente allo stesso gate.
  assert.equal(view.revealedAbilityId, 'khemet_devozione');
  assert.deepEqual(getSealedAbilityHypotheses(view, afterPreField.gateProgress), ['khemet_devozione']);
  assert.equal(isSelectionPubliclyDetermined(view, afterPreField.gateProgress), true);
});

test('deduzione: dopo il reveal l\'ipotesi è una sola', () => {
  let matchState = startRound('apex_sole_verde', 'patto_grande_semaforo');
  matchState = chooseBoth(matchState, 'apex_disprezzo', 'semaforo_verde');

  const { matchState: revealed } = completeGeneralGate(matchState, {});
  assert.deepEqual(
    getSealedAbilityHypotheses(selectPublicEminenceState(revealed.player), revealed.gateProgress),
    ['apex_disprezzo']
  );
});
