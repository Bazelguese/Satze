import { test } from 'node:test';
import assert from 'node:assert/strict';

import { REVEAL_GATES, SIDES } from './eminenceConstants.js';
import {
  EMINENCE_MESSAGES,
  canonicalize,
  createNonce,
  sha256Hex,
  buildCommitmentInput,
  createCommitment,
  verifyCommitment,
  createCommitRevealState,
  withLocalCommitment,
  withRemoteCommitment,
  areCommitmentsExchanged,
  buildCommitMessage,
  buildGateMessage,
  recordLocalGateMessage,
  applyRemoteGateMessage,
  isRoundFullyRevealed,
} from './eminenceCommit.js';
import { createEminenceMatchState, selectPublicEminenceState } from './eminenceState.js';
import { beginEminenceRound, selectEminenceAbility } from './eminenceRound.js';

const MATCH_ID = 'match-1';

const selection = (overrides = {}) => ({
  matchId: MATCH_ID,
  roundNumber: 1,
  eminenceId: 'apex_sole_verde',
  abilityId: 'apex_disprezzo',
  params: null,
  ...overrides,
});

const publicStateFor = (eminenceId, abilityId) => {
  let matchState = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: eminenceId, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 1 }
  );
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, abilityId).matchState;
  return selectPublicEminenceState(matchState.player);
};

// ------------------------------------------------------------------
// Primitive
// ------------------------------------------------------------------

test('canonicalizzazione: l\'ordine delle chiavi non cambia la stringa', () => {
  assert.equal(
    canonicalize({ b: 1, a: { d: 2, c: 3 } }),
    canonicalize({ a: { c: 3, d: 2 }, b: 1 })
  );
});

test('canonicalizzazione: null e undefined non collidono con valori reali', () => {
  assert.notEqual(canonicalize({ slot: null }), canonicalize({ slot: 0 }));
});

test('nonce: due nonce consecutivi differiscono', () => {
  assert.notEqual(createNonce(), createNonce());
  assert.equal(createNonce(16).length, 32);
});

test('commitment: apre solo con l\'opening corretto', async () => {
  const { commitment, opening } = await createCommitment(selection());

  assert.equal(await verifyCommitment(commitment, opening), true);
  assert.equal(await verifyCommitment(commitment, { ...opening, abilityId: 'apex_furia' }), false);
  assert.equal(await verifyCommitment(commitment, { ...opening, nonce: createNonce() }), false);
});

test('commitment: il nonce impedisce di indovinare la scelta per forza bruta', async () => {
  // Senza nonce, l'insieme delle scelte è piccolo e l'hash sarebbe invertibile a tavolino.
  const a = await createCommitment(selection());
  const b = await createCommitment(selection());
  assert.notEqual(a.commitment, b.commitment);

  const guess = await sha256Hex(
    buildCommitmentInput({ ...selection(), nonce: 'nonce-indovinato' })
  );
  assert.notEqual(a.commitment, guess);
});

test('commitment: legato a partita e round, non riusabile altrove', async () => {
  const { commitment, opening } = await createCommitment(selection());
  assert.equal(await verifyCommitment(commitment, { ...opening, roundNumber: 2 }), false);
  assert.equal(await verifyCommitment(commitment, { ...opening, matchId: 'match-2' }), false);
});

// ------------------------------------------------------------------
// Scambio dei commitment
// ------------------------------------------------------------------

test('scambio: nessuna apertura è accettata prima che entrambi si siano impegnati', async () => {
  const { commitment, opening } = await createCommitment(selection());
  let state = withLocalCommitment(
    createCommitRevealState({ matchId: MATCH_ID, roundNumber: 1 }),
    { commitment, opening }
  );

  assert.equal(areCommitmentsExchanged(state), false);

  const result = await applyRemoteGateMessage(state, {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.GENERAL,
    opening,
  });
  assert.equal(result.reason, 'COMMITMENTS_NOT_EXCHANGED');
});

test('scambio: il messaggio di commit non contiene la scelta', async () => {
  const { commitment, opening } = await createCommitment(selection());
  const state = withLocalCommitment(
    createCommitRevealState({ matchId: MATCH_ID, roundNumber: 1 }),
    { commitment, opening }
  );

  const message = buildCommitMessage(state);
  assert.equal(JSON.stringify(message).includes('apex_disprezzo'), false);
  assert.equal(JSON.stringify(message).includes(opening.nonce), false);
});

// ------------------------------------------------------------------
// Aperture ai gate
// ------------------------------------------------------------------

const exchanged = async (localSelection, remoteSelection) => {
  const local = await createCommitment(localSelection);
  const remote = await createCommitment(remoteSelection);
  let state = createCommitRevealState({ matchId: MATCH_ID, roundNumber: 1 });
  state = withLocalCommitment(state, local);
  state = withRemoteCommitment(state, remote.commitment);
  return { state, local, remote };
};

test('gate: al gate sbagliato si invia un passo esplicito, non silenzio', async () => {
  const { state } = await exchanged(selection(), selection());

  const atPreField = buildGateMessage(state, REVEAL_GATES.PRE_FIELD);
  assert.equal(atPreField.type, EMINENCE_MESSAGES.PASS);
  assert.equal(JSON.stringify(atPreField).includes('apex_disprezzo'), false);

  const atGeneral = buildGateMessage(state, REVEAL_GATES.GENERAL);
  assert.equal(atGeneral.type, EMINENCE_MESSAGES.OPEN);
});

test('gate: un\'abilità PRE_FIELD si apre al primo gate', async () => {
  const khemet = selection({ eminenceId: 'khemet_maledizioni', abilityId: 'khemet_devozione' });
  const { state } = await exchanged(khemet, khemet);

  assert.equal(buildGateMessage(state, REVEAL_GATES.PRE_FIELD).type, EMINENCE_MESSAGES.OPEN);
  assert.equal(buildGateMessage(state, REVEAL_GATES.GENERAL).type, EMINENCE_MESSAGES.PASS);
});

test('gate: apertura remota valida accettata', async () => {
  const { state, remote } = await exchanged(selection(), selection({ abilityId: 'apex_furia' }));

  const result = await applyRemoteGateMessage(
    state,
    { type: EMINENCE_MESSAGES.OPEN, matchId: MATCH_ID, roundNumber: 1, gate: REVEAL_GATES.GENERAL, opening: remote.opening },
    { remotePublicState: publicStateFor('apex_sole_verde', 'apex_furia') }
  );

  assert.equal(result.ok, true);
  assert.equal(result.state.remoteOpening.abilityId, 'apex_furia');
  assert.equal(result.state.remoteOpenedGate, REVEAL_GATES.GENERAL);
});

test('gate: un\'apertura che non corrisponde al commitment viene respinta', async () => {
  const { state, remote } = await exchanged(selection(), selection({ abilityId: 'apex_furia' }));

  // L'avversario prova a cambiare idea dopo aver visto la mossa altrui.
  const tampered = { ...remote.opening, abilityId: 'apex_disprezzo' };
  const result = await applyRemoteGateMessage(state, {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.GENERAL,
    opening: tampered,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'COMMITMENT_MISMATCH');
});

test('gate: non si può aprire una capacità a un gate che non è il suo', async () => {
  const { state, remote } = await exchanged(selection(), selection());

  // apex_disprezzo è GENERAL: aprirla a PRE_FIELD anticiperebbe informazione.
  const result = await applyRemoteGateMessage(state, {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.PRE_FIELD,
    opening: remote.opening,
  });

  assert.equal(result.reason, 'WRONG_GATE');
});

test('gate: un\'apertura illegale alla Presenza del checkpoint viene respinta', async () => {
  // Apex parte a 3 Presenza: il -4 non era selezionabile.
  const cheat = selection({ abilityId: 'apex_cataclisma' });
  const { state, remote } = await exchanged(selection(), cheat);

  const result = await applyRemoteGateMessage(
    state,
    { type: EMINENCE_MESSAGES.OPEN, matchId: MATCH_ID, roundNumber: 1, gate: REVEAL_GATES.GENERAL, opening: remote.opening },
    { remotePublicState: publicStateFor('apex_sole_verde', 'apex_furia') }
  );

  assert.equal(result.reason, 'ILLEGAL_AT_SELECTION');
});

test('gate: un\'Eminenza diversa da quella registrata viene respinta', async () => {
  const swapped = selection({ eminenceId: 'khemet_maledizioni', abilityId: 'khemet_devozione' });
  const { state, remote } = await exchanged(selection(), swapped);

  const result = await applyRemoteGateMessage(
    state,
    { type: EMINENCE_MESSAGES.OPEN, matchId: MATCH_ID, roundNumber: 1, gate: REVEAL_GATES.PRE_FIELD, opening: remote.opening },
    { remotePublicState: publicStateFor('apex_sole_verde', 'apex_furia') }
  );

  assert.equal(result.reason, 'EMINENCE_MISMATCH');
});

test('gate: un\'apertura di un altro round viene respinta', async () => {
  const { state, remote } = await exchanged(selection(), selection());

  const result = await applyRemoteGateMessage(state, {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 2,
    gate: REVEAL_GATES.GENERAL,
    opening: remote.opening,
  });

  assert.equal(result.reason, 'ROUND_MISMATCH');
});

test('gate: non si apre due volte nello stesso round', async () => {
  const { state, remote } = await exchanged(selection(), selection());
  const message = {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.GENERAL,
    opening: remote.opening,
  };

  const first = await applyRemoteGateMessage(state, message);
  assert.equal(first.ok, true);

  const second = await applyRemoteGateMessage(first.state, message);
  assert.equal(second.reason, 'ALREADY_OPENED');
});

test('gate: il passo remoto viene registrato ed è informazione pubblica', async () => {
  const { state } = await exchanged(selection(), selection());

  const result = await applyRemoteGateMessage(state, {
    type: EMINENCE_MESSAGES.PASS,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.PRE_FIELD,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.state.remotePassedGates, [REVEAL_GATES.PRE_FIELD]);
});

// ------------------------------------------------------------------
// Chiusura del round
// ------------------------------------------------------------------

test('chiusura: un round è completo solo quando entrambi i commitment sono aperti', async () => {
  const { state, remote } = await exchanged(selection(), selection());
  assert.equal(isRoundFullyRevealed(state), false);

  let next = recordLocalGateMessage(state, buildGateMessage(state, REVEAL_GATES.GENERAL));
  assert.equal(isRoundFullyRevealed(next), false);

  const applied = await applyRemoteGateMessage(next, {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: MATCH_ID,
    roundNumber: 1,
    gate: REVEAL_GATES.GENERAL,
    opening: remote.opening,
  });

  assert.equal(isRoundFullyRevealed(applied.state), true);
});

test('chiusura: passare tutti i gate senza aprire lascia il round incompleto', async () => {
  const { state } = await exchanged(selection(), selection());

  let next = state;
  for (const gate of [REVEAL_GATES.PRE_FIELD, REVEAL_GATES.PRE_AGENT]) {
    next = recordLocalGateMessage(next, buildGateMessage(next, gate));
    const applied = await applyRemoteGateMessage(next, {
      type: EMINENCE_MESSAGES.PASS,
      matchId: MATCH_ID,
      roundNumber: 1,
      gate,
    });
    next = applied.state;
  }

  assert.equal(isRoundFullyRevealed(next), false);
  assert.deepEqual(next.passedGates, [REVEAL_GATES.PRE_FIELD, REVEAL_GATES.PRE_AGENT]);
});
