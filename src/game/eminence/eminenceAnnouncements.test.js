import test from 'node:test';
import assert from 'node:assert/strict';

import {
  noticesFromRoundStart,
  noticesFromSetupPending,
  noticesFromRevealEvents,
  noticesFromAppliedEffects,
  noticesFromDeployedMarkResolution,
  abilityAnnouncesAtReveal,
} from './eminenceAnnouncements.js';
import { openEminenceRound, advanceToNextRevealGate, settleEminenceRound, commitEminenceSetupChoice, prepareEminenceDuel } from './eminenceDuelGate.js';
import { beginEminenceRound, selectEminenceAbility } from './eminenceRound.js';
import { createEminenceMatchState } from './eminenceState.js';
import { EMINENCE_FORMAT, REVEAL_GATES, SIDES } from './eminenceConstants.js';

function opened(player, enemy, roundNumber = 1) {
  return openEminenceRound(
    createEminenceMatchState({
      format: EMINENCE_FORMAT.REQUIRED,
      playerEminenceId: player,
      enemyEminenceId: enemy,
    }),
    { roundNumber },
  );
}

function bothChosen(matchState, playerAbility, enemyAbility, playerParams = null) {
  const player = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility, playerParams);
  assert.equal(player.ok, true, player.reason);
  const enemy = selectEminenceAbility(player.matchState, SIDES.ENEMY, enemyAbility);
  assert.equal(enemy.ok, true, enemy.reason);
  return enemy.matchState;
}

test('avviso setup: lo Statico di La Fame si annuncia prima della scelta Preda, non dopo il lock', () => {
  const { matchState } = opened('mounthborn_fame', 'patto_grande_semaforo', 1);
  const notices = noticesFromSetupPending(matchState);

  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, 'setup');
  assert.equal(notices[0].phase, 'SETUP');
  assert.equal(notices[0].phaseLabel, 'Preparazione');
  assert.equal(notices[0].side, SIDES.PLAYER);
  assert.equal(notices[0].sourceName, 'La Fame');
  assert.equal(notices[0].name, 'Istinto Predatorio');

  const locked = commitEminenceSetupChoice(matchState, SIDES.PLAYER, { preyCardId: 102 });
  assert.equal(locked.ok, true);
  assert.equal(noticesFromSetupPending(locked.matchState).length, 0);
});

test('avviso statico: uno Statico che riordina i gate compare ogni round', () => {
  const { matchState, appliedEffects } = opened('mascarada_organizzatore', 'patto_grande_semaforo', 1);
  const notices = noticesFromRoundStart(matchState, appliedEffects);

  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, 'static');
  assert.equal(notices[0].phase, 'PASSIVE');
  assert.equal(notices[0].phaseDetail, 'Regola attiva');
  assert.equal(notices[0].side, SIDES.PLAYER);
  assert.equal(notices[0].name, 'Ordine degli Incontri');
  assert.equal(notices[0].sourceName, 'L\'Organizzatore degli Incontri');
});

test('avviso statico: uno Statico a condizione compare solo quando il segmento matura', () => {
  const early = opened('apex_sole_verde', 'patto_grande_semaforo', 4);
  assert.equal(noticesFromRoundStart(early.matchState, early.appliedEffects).length, 0);

  const late = opened('apex_sole_verde', 'patto_grande_semaforo', 5);
  const notices = noticesFromRoundStart(late.matchState, late.appliedEffects);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, 'static');
  assert.equal(notices[0].phaseDetail, 'Scatta ora · Round 5');
  assert.equal(notices[0].name, 'Cataclisma: Ora Verde');
});

test('avviso reveal: un\'abilità post-Duello non si annuncia al gate', () => {
  const silent = noticesFromRevealEvents([
    {
      type: 'REVEAL',
      side: SIDES.PLAYER,
      gate: REVEAL_GATES.GENERAL,
      eminenceId: 'mascarada_organizzatore',
      abilityId: 'mascarada_scommessa',
      presenceDelta: 0,
    },
  ]);
  assert.equal(silent.length, 0);
  assert.equal(abilityAnnouncesAtReveal({
    segments: [{ timing: 'AFTER_DUEL_OUTCOME' }],
  }), false);
});

test('avviso reveal: al gate resta la condizione, senza esito', () => {
  const matchState = {
    player: {
      eminenceId: 'mounthborn_fame',
      persistent: { preyCardIds: [102], fragmentCardIds: [] },
    },
    enemy: { eminenceId: 'patto_grande_semaforo', persistent: { preyCardIds: [], fragmentCardIds: [] } },
  };
  const event = {
    type: 'REVEAL',
    side: SIDES.PLAYER,
    gate: REVEAL_GATES.GENERAL,
    eminenceId: 'mounthborn_fame',
    abilityId: 'mounthborn_frenesia',
    presenceDelta: -2,
  };

  const notices = noticesFromRevealEvents([event], {
    matchState,
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
  });
  assert.equal(notices[0].outcome, null);
  assert.equal(notices[0].name, 'Frenesia della Fame');
  assert.match(notices[0].text, /Preda/i);
  assert.match(notices[0].text, /Bonus d'Armata/i);
});

test('avviso Preda: l\'esito arriva quando gli Agenti sono noti, non a fine Duello', () => {
  const matchState = {
    player: {
      eminenceId: 'mounthborn_fame',
      revealedAbilityId: 'mounthborn_gorgoglio',
      persistent: { preyCardIds: [102], fragmentCardIds: [] },
    },
    enemy: { eminenceId: 'patto_grande_semaforo' },
  };

  const hit = noticesFromDeployedMarkResolution(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
  });
  assert.equal(hit.length, 1);
  assert.equal(hit[0].kind, 'effect');
  assert.equal(hit[0].phase, 'VERIFY');
  assert.equal(hit[0].outcome, 'hit');
  assert.equal(hit[0].name, 'Gorgoglio dai Cento Occhi');
  assert.equal(hit[0].presenceDelta, 2);
  assert.equal(hit[0].markCardId, 102);
  assert.equal(hit[0].payoffs[0].primitive, 'CHANGE_PRESENCE');
  assert.match(hit[0].text, /Preda/i);
  assert.match(hit[0].text, /\+2/);

  const miss = noticesFromDeployedMarkResolution(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 116 },
  });
  assert.equal(miss.length, 1);
  assert.equal(miss[0].phase, 'MISS');
  assert.equal(miss[0].outcome, 'miss');
  assert.match(miss[0].text, /Nessuna Preda/i);

  const tooEarly = noticesFromDeployedMarkResolution(matchState, {});
  assert.equal(tooEarly.length, 0);
});

test('avviso effetto: il payoff Preda non si ripete a fine Duello', () => {
  const matchState = {
    player: {
      eminenceId: 'mounthborn_fame',
      persistent: { preyCardIds: [102], fragmentCardIds: [] },
    },
    enemy: { eminenceId: 'patto_grande_semaforo' },
  };
  const notices = noticesFromAppliedEffects(matchState, [{
    ownerSide: SIDES.PLAYER,
    abilityId: 'mounthborn_gorgoglio',
    timing: 'BEFORE_TRIGGER_CHECK',
    segment: {
      primitive: 'CHANGE_PRESENCE',
      delta: 2,
      condition: { deployedMarks: { has: 'prey' } },
    },
  }]);
  assert.equal(notices.length, 0);
});

test('avviso reveal: un\'abilità che agisce nel Duello si annuncia al gate, con fonte', () => {
  const notices = noticesFromRevealEvents([
    { type: 'GATE_COMPLETED', gate: REVEAL_GATES.GENERAL, revealCount: 1 },
    {
      type: 'REVEAL',
      side: SIDES.PLAYER,
      gate: REVEAL_GATES.GENERAL,
      eminenceId: 'mascarada_organizzatore',
      abilityId: 'mascarada_maschere',
      presenceDelta: -2,
    },
  ]);

  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, 'reveal');
  assert.equal(notices[0].phase, 'REVEAL');
  assert.equal(notices[0].phaseDetail, 'Prima del Duello');
  assert.equal(notices[0].side, SIDES.PLAYER);
  assert.equal(notices[0].name, 'Maschere Invertite');
  assert.equal(notices[0].sourceName, 'L\'Organizzatore degli Incontri');
  assert.match(notices[0].text, /Gloria/i);
});

test('sequenza: dopo la scelta lo Statico che riordina apre PRE_AGENT prima di PRE_FIELD', () => {
  const { matchState: openedState } = opened('mascarada_organizzatore', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(openedState, 'mascarada_scommessa', 'semaforo_giallo', {
    pronostico: 'VITTORIA_PROPRIA',
  });

  const first = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(first.gate, REVEAL_GATES.PRE_AGENT);
  assert.equal(first.matchState.gateProgress.sequenceName, 'AGENTS_FIRST');

  const second = advanceToNextRevealGate(first.matchState, { initiativeSide: SIDES.PLAYER });
  assert.equal(second.gate, REVEAL_GATES.PRE_FIELD);

  const third = advanceToNextRevealGate(second.matchState, { initiativeSide: SIDES.PLAYER });
  assert.equal(third.gate, REVEAL_GATES.GENERAL);
  assert.equal(third.notices.some((notice) => notice.name === 'Scommessa'), false);

  const hit = settleEminenceRound(third.matchState, { initiativeSide: SIDES.PLAYER, winner: SIDES.PLAYER });
  assert.equal(hit.notices.length, 1);
  assert.equal(hit.notices[0].kind, 'effect');
  assert.equal(hit.notices[0].phase, 'RESOLVE');
  assert.equal(hit.notices[0].phaseDetail, 'Dopo il Duello');
  assert.equal(hit.notices[0].name, 'Scommessa');
  assert.equal(hit.notices[0].sourceName, 'L\'Organizzatore degli Incontri');
  assert.match(hit.notices[0].text, /propria vittoria/i);
  assert.match(hit.notices[0].text, /\+2/);

  const miss = settleEminenceRound(third.matchState, { initiativeSide: SIDES.PLAYER, winner: SIDES.ENEMY });
  assert.equal(miss.notices.length, 0);
});

test('sequenza: Gorgoglio mostra la condizione al reveal e l\'esito quando gli Agenti sono noti', () => {
  const { matchState: openedState } = opened('mounthborn_fame', 'patto_grande_semaforo', 1);
  const locked = commitEminenceSetupChoice(openedState, SIDES.PLAYER, { preyCardId: 102 });
  assert.equal(locked.ok, true);
  const chosen = bothChosen(locked.matchState, 'mounthborn_gorgoglio', 'semaforo_giallo', {
    preyCardId: 116,
  });

  const preField = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(preField.gate, REVEAL_GATES.PRE_FIELD);

  const preAgent = advanceToNextRevealGate(preField.matchState, { initiativeSide: SIDES.PLAYER });
  assert.equal(preAgent.gate, REVEAL_GATES.PRE_AGENT);
  const condition = preAgent.notices.find((notice) => notice.name === 'Gorgoglio dai Cento Occhi');
  assert.equal(condition.kind, 'reveal');
  assert.equal(condition.phase, 'REVEAL');
  assert.equal(condition.phaseDetail, 'Prima dell\'Agente');
  assert.equal(condition.outcome, null);
  assert.match(condition.text, /Preda/i);

  const general = advanceToNextRevealGate(preAgent.matchState, {
    initiativeSide: SIDES.PLAYER,
    announceDeployedMarks: true,
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
  });
  assert.equal(general.gate, REVEAL_GATES.GENERAL);
  const resolution = general.notices.find((notice) => notice.name === 'Gorgoglio dai Cento Occhi');
  assert.equal(resolution.kind, 'effect');
  assert.equal(resolution.phase, 'VERIFY');
  assert.equal(resolution.outcome, 'hit');
  assert.match(resolution.text, /\+2/);
});

test('sequenza: Cannibalismo parla solo a fine Duello, con esito', () => {
  const match = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: 'mounthborn_fame',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  match.player.presence = 2;
  const { matchState: openedState } = openEminenceRound(match, { roundNumber: 1 });
  const locked = commitEminenceSetupChoice(openedState, SIDES.PLAYER, { preyCardId: 102 });
  assert.equal(locked.ok, true);
  const chosen = bothChosen(locked.matchState, 'mounthborn_cannibalismo', 'semaforo_giallo');

  let state = chosen;
  for (let i = 0; i < 3; i += 1) {
    const step = advanceToNextRevealGate(state, {
      initiativeSide: SIDES.PLAYER,
      announceDeployedMarks: true,
      agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
    });
    assert.equal(step.notices.some((notice) => notice.name === 'Cannibalismo'), false);
    state = step.matchState;
  }

  const hit = settleEminenceRound(state, {
    initiativeSide: SIDES.PLAYER,
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
  });
  assert.equal(hit.notices.length, 1);
  assert.equal(hit.notices[0].name, 'Cannibalismo');
  assert.equal(hit.notices[0].outcome, 'hit');
  assert.match(hit.notices[0].text, /Cura 3/);

  const miss = settleEminenceRound(state, {
    initiativeSide: SIDES.PLAYER,
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 102 },
  });
  assert.equal(miss.notices.length, 1);
  assert.equal(miss.notices[0].name, 'Cannibalismo');
  assert.equal(miss.notices[0].outcome, 'miss');
});

test('sequenza: senza riordino il primo gate resta PRE_FIELD', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({
      format: EMINENCE_FORMAT.REQUIRED,
      playerEminenceId: 'apex_sole_verde',
      enemyEminenceId: 'patto_grande_semaforo',
    }),
    { roundNumber: 1 },
  );
  const chosen = bothChosen(base, 'apex_furia', 'semaforo_giallo');
  const first = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(first.gate, REVEAL_GATES.PRE_FIELD);
});

test('avviso Cannibalismo: silenzio al reveal, esito hit o miss a fine Duello', () => {
  assert.equal(abilityAnnouncesAtReveal({
    segments: [{ timing: 'AFTER_DUEL_OUTCOME' }],
  }), false);
  assert.equal(noticesFromRevealEvents([{
    type: 'REVEAL',
    side: SIDES.PLAYER,
    gate: REVEAL_GATES.GENERAL,
    eminenceId: 'mounthborn_fame',
    abilityId: 'mounthborn_cannibalismo',
    presenceDelta: -2,
  }]).length, 0);

  const matchState = {
    player: { eminenceId: 'mounthborn_fame' },
    enemy: { eminenceId: 'patto_grande_semaforo' },
  };
  const segment = {
    primitive: 'HEAL_HP',
    amount: 3,
    condition: { duelWinnerRelative: 'opponent', enemyMarks: { has: 'prey' } },
  };
  const hit = noticesFromAppliedEffects(matchState, [{
    ownerSide: SIDES.PLAYER,
    abilityId: 'mounthborn_cannibalismo',
    timing: 'AFTER_DUEL_OUTCOME',
    segment,
  }]);
  assert.equal(hit.length, 1);
  assert.equal(hit[0].outcome, 'hit');
  assert.equal(hit[0].name, 'Cannibalismo');
  assert.equal(hit[0].presenceDelta, null);
  assert.match(hit[0].text, /Sconfitta contro una Preda/i);
  assert.match(hit[0].text, /Cura 3/);

  const miss = noticesFromAppliedEffects(matchState, [], {
    skipped: [{
      ownerSide: SIDES.PLAYER,
      abilityId: 'mounthborn_cannibalismo',
      timing: 'AFTER_DUEL_OUTCOME',
      segment,
    }],
  });
  assert.equal(miss.length, 1);
  assert.equal(miss[0].outcome, 'miss');
  assert.match(miss[0].text, /Nessuna sconfitta contro una Preda/i);
});

test('avviso effetto: Scommessa si ripete solo se il pronostico è corretto', () => {
  const matchState = {
    player: { eminenceId: 'mascarada_organizzatore' },
    enemy: { eminenceId: 'patto_grande_semaforo' },
  };
  const hit = noticesFromAppliedEffects(matchState, [{
    ownerSide: SIDES.PLAYER,
    abilityId: 'mascarada_scommessa',
    timing: 'AFTER_DUEL_OUTCOME',
    params: { pronostico: 'VITTORIA_PROPRIA' },
    segment: {
      primitive: 'CHANGE_PRESENCE',
      delta: 2,
      condition: { duelWinnerRelative: { param: 'pronostico', map: {
        VITTORIA_PROPRIA: 'self',
        VITTORIA_AVVERSARIA: 'opponent',
        PAREGGIO: 'draw',
      } } },
    },
  }]);
  assert.equal(hit.length, 1);
  assert.equal(hit[0].name, 'Scommessa');
  assert.match(hit[0].text, /propria vittoria/i);
  assert.match(hit[0].text, /\+2/);

  const silent = noticesFromAppliedEffects(matchState, [{
    ownerSide: SIDES.PLAYER,
    abilityId: 'mounthborn_gorgoglio',
    timing: 'AFTER_REVEAL',
    segment: { primitive: 'MARK_CARD', mark: 'prey', persistent: true },
  }]);
  assert.equal(silent.length, 0);
});

test('avviso: Convalida è silenziosa al reveal e parla solo se il Potere si attiva', () => {
  const { matchState } = opened('khemet_maledizioni', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(matchState, 'khemet_devozione', 'semaforo_giallo');
  const first = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(first.gate, REVEAL_GATES.PRE_FIELD);
  assert.equal(first.notices.some((notice) => notice.name === 'Convalida'), false);

  let state = first.matchState;
  for (let i = 0; i < 2; i += 1) {
    state = advanceToNextRevealGate(state, { initiativeSide: SIDES.PLAYER }).matchState;
  }

  const hit = settleEminenceRound(state, {
    powerResolvedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(hit.notices.length, 1);
  assert.equal(hit.notices[0].name, 'Convalida');
  assert.equal(hit.notices[0].outcome, 'hit');
  assert.match(hit.notices[0].text, /Il Potere si è attivato/);

  const miss = settleEminenceRound(state, {
    powerResolvedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.equal(miss.notices.length, 0);
});

test('avviso: la Risonanza del Nono Sigillo parla solo quando Overdrive si è attivato', () => {
  const { matchState } = opened('khemet_maledizioni', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(matchState, 'khemet_devozione', 'semaforo_giallo');
  let state = chosen;
  for (let i = 0; i < 3; i += 1) {
    state = advanceToNextRevealGate(state, { initiativeSide: SIDES.PLAYER }).matchState;
  }

  const hit = settleEminenceRound(state, {
    activatedTriggerBySide: { [SIDES.PLAYER]: 'overdrive', [SIDES.ENEMY]: null },
  });
  assert.equal(hit.notices.length, 1);
  assert.equal(hit.notices[0].name, 'Risonanza del Nono Sigillo');
  assert.match(hit.notices[0].text, /Overdrive attivato/);
});

test('avviso: il Sigillo annuncia il Campo scelto al reveal, non l\'effetto in Duello', () => {
  const { matchState } = opened('khemet_maledizioni', 'patto_grande_semaforo', 1);
  matchState.player.presence = 2;
  const chosen = bothChosen(matchState, 'khemet_maledizione_va', 'semaforo_giallo', { slot: 2 });
  const first = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(first.gate, REVEAL_GATES.PRE_FIELD);
  const notice = first.notices.find((entry) => entry.name === 'Sigillo della Misura');
  assert.ok(notice);
  assert.equal(notice.kind, 'reveal');
  assert.match(notice.text, /Campo 3/);
  assert.equal(notice.payoffs[0].primitive, 'APPLY_SLOT_MODIFIER');
  assert.equal(notice.payoffs[0].slot, 2);
});

test('avviso: Leggerezza parla al controllo Ancorato, non al reveal anticipato', () => {
  const { matchState } = opened('figli_domanda_senza_fine', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(matchState, 'figli_leggerezza', 'semaforo_giallo');
  const first = advanceToNextRevealGate(chosen, { initiativeSide: SIDES.PLAYER });
  assert.equal(first.notices.some((notice) => notice.name === 'Leggerezza'), false);

  const afterAgents = advanceToNextRevealGate(first.matchState, { initiativeSide: SIDES.PLAYER });
  assert.equal(afterAgents.notices.some((notice) => notice.name === 'Leggerezza'), false);

  const duelOpts = {
    initiativeSide: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 2, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  };
  const general = advanceToNextRevealGate(afterAgents.matchState, duelOpts);
  assert.equal(general.gate, REVEAL_GATES.GENERAL);
  const notice = general.notices.find((entry) => entry.name === 'Leggerezza');
  assert.ok(notice);
  assert.equal(notice.kind, 'effect');
  assert.equal(notice.outcome, 'hit');
  assert.match(notice.text, /non è Ancorato/);
  assert.match(notice.text, /\+1/);

  const prepared = prepareEminenceDuel(general.matchState, duelOpts);
  assert.equal(prepared.notices.some((entry) => entry.name === 'Leggerezza'), false);
});

test('avviso: Deriva si legge al GENERAL e non si ripete a fine Duello', () => {
  const { matchState } = opened('figli_domanda_senza_fine', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(matchState, 'figli_deriva', 'semaforo_giallo');
  let state = chosen;
  for (let i = 0; i < 2; i += 1) {
    state = advanceToNextRevealGate(state, { initiativeSide: SIDES.PLAYER }).matchState;
  }
  const general = advanceToNextRevealGate(state, {
    initiativeSide: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  const notice = general.notices.find((entry) => entry.name === 'Deriva');
  assert.ok(notice);
  assert.equal(notice.kind, 'reveal');
  assert.match(notice.text, /requisito di Ancorato/);

  const prepared = prepareEminenceDuel(general.matchState, {
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  assert.equal(prepared.notices.some((entry) => entry.name === 'Deriva'), false);
});

test('avviso: Risposta dice se l\'Agente è Ancorato al GENERAL, hit o miss', () => {
  const { matchState } = opened('figli_domanda_senza_fine', 'patto_grande_semaforo', 1);
  matchState.player.presence = 4;
  matchState.player.selectionCheckpointPresence = 4;
  const chosen = bothChosen(matchState, 'figli_risposta', 'semaforo_giallo');
  let state = chosen;
  for (let i = 0; i < 2; i += 1) {
    state = advanceToNextRevealGate(state, { initiativeSide: SIDES.PLAYER }).matchState;
  }

  const hit = advanceToNextRevealGate(state, {
    initiativeSide: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  const hitNotice = hit.notices.find((entry) => entry.name === 'Risposta');
  assert.equal(hitNotice.outcome, 'hit');
  assert.match(hitNotice.text, /è Ancorato/);

  const miss = advanceToNextRevealGate(state, {
    initiativeSide: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 2, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  const missNotice = miss.notices.find((entry) => entry.name === 'Risposta');
  assert.equal(missNotice.outcome, 'miss');
  assert.match(missNotice.text, /non è Ancorato/);
});

test('avviso: se GENERAL si apre nel Duello, Leggerezza parla una sola volta', () => {
  const { matchState } = opened('figli_domanda_senza_fine', 'patto_grande_semaforo', 1);
  const chosen = bothChosen(matchState, 'figli_leggerezza', 'semaforo_giallo');
  let state = chosen;
  for (let i = 0; i < 2; i += 1) {
    state = advanceToNextRevealGate(state, { initiativeSide: SIDES.PLAYER }).matchState;
  }

  const prepared = prepareEminenceDuel(state, {
    focusInvestedBySide: { [SIDES.PLAYER]: 2, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  const notices = prepared.notices.filter((entry) => entry.name === 'Leggerezza');
  assert.equal(notices.length, 1);
  assert.equal(notices[0].outcome, 'hit');
  assert.match(notices[0].text, /non è Ancorato/);
});
