// Acceptance test dell'infrastruttura Eminenze.
//
// Apex e il Grande Semaforo sono i primi due utilizzatori reali: se funzionano attraversando
// solo dati e primitive, l'infrastruttura regge. Se per farli funzionare servisse un ramo con
// il loro nome dentro il motore, l'infrastruttura avrebbe fallito — ed è quello che verifica
// il test finale di questo file, leggendo i sorgenti.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  REVEAL_GATES,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  TRIGGER_SCOPES,
  HP_LOSS_CAUSES,
  SIDES,
} from './eminenceConstants.js';
import { EMINENCES, EMINENCE_IDS } from '../../data/eminences.js';
import { ALL_AGENTS } from '../../data/cards.js';
import { createEminenceMatchState, filterDeployableCardIds, readDeployConstraints } from './eminenceState.js';
import {
  beginEminenceRound,
  selectEminenceAbility,
  completeGeneralGate,
  collectPendingEffects,
} from './eminenceRound.js';
import { applyEminenceSegments, createEffectBundle, getSupportedPrimitives } from './primitiveHandlers.js';
import { stampComposeParams } from './composeAbilityParams.js';
import { resolveTriggerState } from './triggerRulesOverlay.js';
import { checkTrigger } from '../triggerLogic.js';
import {
  settleEminenceRound,
  settleEminenceMatch,
  advanceToNextRevealGate,
  commitEminenceSetupChoice,
  needsEminenceSetup,
  prepareEminenceDuel,
  notifyHpLossEvents,
  resolvePendingDeal,
} from './eminenceDuelGate.js';
import { collectSlotCurses } from './slotCurses.js';
import { powerResolutionFromDuel, isLowestEffectiveLeague } from './eminenceDuelBinding.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const duelContext = (overrides = {}) => ({
  fieldModifiers: {},
  isFirst: true,
  roundNumber: 3,
  playerHP: 25,
  enemyHP: 25,
  ...overrides,
});

/** Esegue un round completo dalla scelta segreta fino ai segmenti applicati. */
function playRound({
  playerEminenceId,
  enemyEminenceId,
  playerAbility,
  enemyAbility,
  presence = {},
  initiativeSide = SIDES.PLAYER,
  playerParams = null,
  enemyParams = null,
  fragments = {},
  prey = {},
  agentIdBySide = null,
}) {
  const base = createEminenceMatchState({ playerEminenceId, enemyEminenceId });
  if (presence.player != null) base.player.presence = presence.player;
  if (presence.enemy != null) base.enemy.presence = presence.enemy;
  if (fragments.player) base.player.persistent.fragmentCardIds = [...fragments.player];
  if (fragments.enemy) base.enemy.persistent.fragmentCardIds = [...fragments.enemy];
  if (prey.player) base.player.persistent.preyCardIds = [...prey.player];
  if (prey.enemy) base.enemy.persistent.preyCardIds = [...prey.enemy];

  let matchState = beginEminenceRound(base, { roundNumber: 3 });

  const p = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility, playerParams);
  assert.equal(p.ok, true, `scelta giocatore rifiutata: ${p.reason}`);
  const e = selectEminenceAbility(p.matchState, SIDES.ENEMY, enemyAbility, enemyParams);
  assert.equal(e.ok, true, `scelta avversario rifiutata: ${e.reason}`);
  matchState = e.matchState;

  matchState = advanceToNextRevealGate(matchState, { initiativeSide }).matchState;
  matchState = advanceToNextRevealGate(matchState, { initiativeSide }).matchState;

  const general = completeGeneralGate(matchState, { initiativeSide });
  matchState = general.matchState;

  const bundle = applyEminenceSegments(general.resolutionQueue, null, { agentIdBySide });

  const preTrigger = collectPendingEffects(matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {
    initiativeSide,
    context: { agentIdBySide },
  });
  matchState = preTrigger.matchState;
  applyEminenceSegments(preTrigger.queue, bundle, { agentIdBySide });

  return { matchState, bundle, events: general.events };
}

// ------------------------------------------------------------------
// Apex — Il Sole Verde
// ------------------------------------------------------------------

test('Apex +1: +1 POT al proprio Agente e 2 PV di costo al controllore', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_verde',
  });

  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 1);
  assert.equal(bundle.statDeltas[SIDES.ENEMY].power, 0);

  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: -2, cause: HP_LOSS_CAUSES.EMINENCE_COST, source: 'apex_furia' },
  ]);

  // Il +1 è un guadagno, non una spesa: non alimenta Manifestazione.
  assert.equal(matchState.player.presence, 4);
  assert.equal(matchState.player.presenceSpentThisRound, 0);
  assert.equal(checkTrigger('manifestazione', duelContext({
    hasEminence: true,
    presenceSpent: matchState.player.presenceSpentThisRound,
  })), false);
});

test('Apex -2: il proprio Agente ignora il Campo e la spesa alimenta Manifestazione', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_disprezzo',
    enemyAbility: 'semaforo_verde',
  });

  assert.deepEqual(bundle.ignoreFieldSides, [SIDES.PLAYER]);
  assert.equal(matchState.player.presence, 1);
  assert.equal(matchState.player.presenceSpentThisRound, 2);

  assert.equal(checkTrigger('manifestazione', duelContext({
    hasEminence: true,
    presenceSpent: matchState.player.presenceSpentThisRound,
  })), true);
  // Per l'avversario è Blasfemia.
  assert.equal(checkTrigger('blasfemia', duelContext({
    enemyHasEminence: true,
    enemyPresenceSpent: matchState.player.presenceSpentThisRound,
  })), true);
});

test('Apex -4: concede un Potere +2 POT e +2 DAN, non un buff di schieramento', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_cataclisma',
    enemyAbility: 'semaforo_verde',
    presence: { player: 4 },
  });

  assert.deepEqual(bundle.grantedPowers[SIDES.PLAYER], {
    trigger: null,
    effects: [
      { effect: 'power', value: 2 },
      { effect: 'damage', value: 2 },
    ],
    source: 'apex_cataclisma',
  });
  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 0);
  assert.equal(matchState.player.presence, 0);
  // Presenza a 0 dopo la spesa: Digiuno è soddisfatto nello stesso round.
  assert.equal(checkTrigger('digiuno', duelContext({ hasEminence: true, playerPresence: 0 })), true);
});

// ------------------------------------------------------------------
// Patto degli Indocili — Il Grande Semaforo
// ------------------------------------------------------------------

const semaforoTriggers = (bundle, side) =>
  ['imboscata', 'turbo', 'intervention', 'ultimaChance'].reduce((acc, trigger) => {
    acc[trigger] = resolveTriggerState({
      originalTrigger: trigger,
      context: duelContext({ isFirst: side === SIDES.PLAYER }),
      card: { id: side === SIDES.PLAYER ? 1 : 2 },
      side,
      triggerRules: bundle.triggerRules,
    }).satisfied;
    return acc;
  }, {});

test('Semaforo Verde: nessun force/forbid — i trigger restano naturali', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_verde',
  });

  assert.equal(bundle.triggerRules.forceSatisfied.length, 0);
  assert.equal(bundle.triggerRules.forceForbidden.length, 0);
});

test('Semaforo Giallo: apre Imboscata e Turbo', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_giallo',
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.PLAYER), {
    imboscata: true,
    turbo: true,
    intervention: false,
    ultimaChance: false,
  });
});

test('Semaforo Rosso: inverte il quadro anche contro condizioni naturalmente vere', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.PLAYER), {
    imboscata: false,
    turbo: false,
    intervention: true,
    ultimaChance: true,
  });
});

test('Semaforo: l\'effetto è simmetrico e colpisce chi lo ha attivato', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.ENEMY), {
    imboscata: false,
    turbo: false,
    intervention: true,
    ultimaChance: true,
  });
});

test('Semaforo: agisce a BEFORE_TRIGGER_CHECK, non al reveal', () => {
  const base = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_furia').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_giallo').matchState;

  const general = completeGeneralGate(matchState, {});
  // Subito dopo il reveal l'overlay è ancora vuoto.
  const atReveal = applyEminenceSegments(general.resolutionQueue);
  assert.equal(atReveal.triggerRules.forceSatisfied.length, 0);

  const preTrigger = collectPendingEffects(general.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  const afterCheckpoint = applyEminenceSegments(preTrigger.queue, atReveal);
  assert.equal(afterCheckpoint.triggerRules.forceSatisfied.length, 1);
});

test('checkpoint: un segmento consumato non viene rieseguito', () => {
  const base = createEminenceMatchState({
    playerEminenceId: 'patto_grande_semaforo',
    enemyEminenceId: 'apex_sole_verde',
  });
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'semaforo_giallo').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'apex_furia').matchState;
  matchState = completeGeneralGate(matchState, {}).matchState;

  const first = collectPendingEffects(matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  assert.equal(first.queue.length, 1);

  const second = collectPendingEffects(first.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  assert.equal(second.queue.length, 0);
});

// ------------------------------------------------------------------
// Apex contro Grande Semaforo
// ------------------------------------------------------------------

test('incrocio: il Semaforo Rosso spegne l\'Imboscata di un Agente potenziato da Apex', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_cataclisma',
    enemyAbility: 'semaforo_rosso',
    presence: { player: 4, enemy: 2 },
  });

  // Il Potere concesso non passa dai trigger del Semaforo: resta depositato.
  assert.equal(bundle.grantedPowers[SIDES.PLAYER].effects.length, 2);

  const state = resolveTriggerState({
    originalTrigger: 'imboscata',
    context: duelContext({ isFirst: true }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });

  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.satisfied, false);
  assert.equal(state.forbidden, true);
});

test('incrocio: l\'iniziativa ordina la risoluzione, non l\'esito del pagamento', () => {
  const args = {
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_disprezzo',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  };

  const playerFirst = playRound({ ...args, initiativeSide: SIDES.PLAYER });
  const enemyFirst = playRound({ ...args, initiativeSide: SIDES.ENEMY });

  assert.equal(playerFirst.matchState.player.presence, enemyFirst.matchState.player.presence);
  assert.equal(playerFirst.matchState.enemy.presence, enemyFirst.matchState.enemy.presence);
});

// ------------------------------------------------------------------
// Mascarada — L'Organizzatore degli Incontri
// ------------------------------------------------------------------

test('Mascarada -2: Gloria↔Vendetta e Conquista↔Ultimo Desiderio sono alias, non sostituzioni', () => {
  const { bundle } = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_maschere',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
  });

  const gloryViaVendetta = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext({ lostPrevious: true }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(gloryViaVendetta.naturalSatisfied, true);
  assert.equal(gloryViaVendetta.forced, false);
  assert.equal(gloryViaVendetta.effectiveTrigger, 'glory');

  const vendettaViaGlory = resolveTriggerState({
    originalTrigger: 'vendetta',
    context: duelContext({ wonPrevious: true }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(vendettaViaGlory.naturalSatisfied, true);

  const conquestViaLastWish = resolveTriggerState({
    originalTrigger: 'conquest',
    context: duelContext({ won: false, lost: true }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(conquestViaLastWish.naturalSatisfied, true);

  const lastWishViaConquest = resolveTriggerState({
    originalTrigger: 'lastWish',
    context: duelContext({ won: true, lost: false }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(lastWishViaConquest.naturalSatisfied, true);

  const enemyGlory = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext({ lostPrevious: true }),
    card: { id: 2 },
    side: SIDES.ENEMY,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(enemyGlory.naturalSatisfied, true);
});

test('Mascarada -4: forza il Potere proprio e lo rende non bloccabile, senza toccare la Conquista', () => {
  const { bundle } = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_incontro_truccato',
    enemyAbility: 'semaforo_verde',
    presence: { player: 4 },
  });

  const ownGlory = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext(),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
    powerBlocked: true,
  });
  assert.equal(ownGlory.forced, true);
  assert.equal(ownGlory.satisfied, true);
  assert.equal(ownGlory.unblockable, true);
  assert.equal(ownGlory.resolves, true);

  const ownConquest = resolveTriggerState({
    originalTrigger: 'conquest',
    context: duelContext({ won: false }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(ownConquest.forced, false);
  assert.equal(ownConquest.satisfied, false);

  const enemyTurbo = resolveTriggerState({
    originalTrigger: 'turbo',
    context: duelContext(),
    card: { id: 2 },
    side: SIDES.ENEMY,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(enemyTurbo.forced, false);

  const disabled = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext(),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
    powerDisabled: true,
  });
  assert.equal(disabled.forced, true);
  assert.equal(disabled.resolves, false);
});

test('Mascarada +0: pronostico corretto vale +2 Presenza dopo il Duello', () => {
  const { matchState } = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_verde',
    playerParams: { pronostico: 'VITTORIA_PROPRIA' },
  });

  const pending = matchState.player.round.pendingEffects.find((entry) => entry.abilityId === 'mascarada_scommessa');
  assert.deepEqual(pending.params, { pronostico: 'VITTORIA_PROPRIA' });
  assert.equal(matchState.player.presence, 1);

  const settled = settleEminenceRound(matchState, { winner: 'player' });
  assert.equal(settled.matchState.player.presence, 3);
  assert.equal(settled.bundle.presenceChanges[0].delta, 2);
  assert.equal(settled.bundle.presenceChanges[0].countsAsSpend, false);
});

test('Mascarada +0: pronostico sbagliato non paga; il pareggio sì se era il pronostico', () => {
  const lost = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_verde',
    playerParams: { pronostico: 'VITTORIA_PROPRIA' },
  });
  const afterLoss = settleEminenceRound(lost.matchState, { winner: 'enemy' });
  assert.equal(afterLoss.matchState.player.presence, 1);
  assert.equal(afterLoss.bundle, null);

  const drawBet = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_verde',
    playerParams: { pronostico: 'PAREGGIO' },
  });
  const afterDraw = settleEminenceRound(drawBet.matchState, { winner: 'draw' });
  assert.equal(afterDraw.matchState.player.presence, 3);
});

test('Mascarada +0: senza pronostico il segmento non scatta; senza vincitore fallisce rumorosamente', () => {
  const silent = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_verde',
  });
  const settled = settleEminenceRound(silent.matchState, { winner: 'player' });
  assert.equal(settled.matchState.player.presence, 1);
  assert.equal(settled.bundle, null);

  const armed = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_verde',
    playerParams: { pronostico: 'VITTORIA_PROPRIA' },
  });
  assert.throws(() => settleEminenceRound(armed.matchState), /non disponibile/);
});

// ------------------------------------------------------------------
// Altare — Frammenti, Sacrificio, Innesto, Opera Composita
// ------------------------------------------------------------------

const ALTAR = 'kethran_altare';
const AGENT_A = 101;
const AGENT_B = 102;

test('Altare statico: una sconfitta marca l\'Agente come Frammento; vittoria e pareggio no', () => {
  const lost = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_verde',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  const afterLoss = settleEminenceRound(lost.matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  assert.deepEqual(afterLoss.matchState.player.persistent.fragmentCardIds, [AGENT_A]);

  const won = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_verde',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  const afterWin = settleEminenceRound(won.matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  assert.deepEqual(afterWin.matchState.player.persistent.fragmentCardIds, []);

  const draw = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_verde',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  const afterDraw = settleEminenceRound(draw.matchState, {
    winner: 'draw',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  assert.deepEqual(afterDraw.matchState.player.persistent.fragmentCardIds, []);
});

test('Altare: Presenza iniziale 1', () => {
  const state = createEminenceMatchState({ playerEminenceId: ALTAR, enemyEminenceId: 'patto_grande_semaforo' });
  assert.equal(state.player.presence, 1);
});

test('Altare +1 Sacrificio: perdi 2 PV e basta, senza crescita', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_verde',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  // Reveal +1 sulla Presenza iniziale 1 → 2; nessuna Presenza extra dall'effetto.
  assert.equal(matchState.player.presence, 2);
  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: -2, cause: HP_LOSS_CAUSES.EMINENCE_COST, source: 'kethran_sacrificio' },
  ]);
  assert.equal(bundle.presenceChanges.length, 0);
  assert.equal(bundle.abilityEscalations.length, 0);
});

test('Altare statico: ottenere un Frammento (sconfitta) dà +1 Presenza', () => {
  const { matchState } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_verde',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  const afterLoss = settleEminenceRound(matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  assert.deepEqual(afterLoss.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
  // +1 da ON_MARK_GAIN sul Frammento (in più al reveal già contato nello stato di partenza).
  assert.equal(afterLoss.matchState.player.presence, 3);
});

test('Altare statico: un Frammento già presente non ripaga +1 Presenza', () => {
  let matchState = createEminenceMatchState({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  matchState.player.presence = 3;
  matchState.player.persistent.fragmentCardIds = [AGENT_A];
  matchState = beginEminenceRound(matchState, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'kethran_elogio').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  const prepared = prepareEminenceDuel(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  const afterLoss = settleEminenceRound(prepared.matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  assert.deepEqual(afterLoss.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
  // Elogio −1 al reveal (3→2); la ri-marcatura del Frammento non paga di nuovo.
  assert.equal(afterLoss.matchState.player.presence, 2);
});

test('Altare −2 Innesto: non è selezionabile senza Frammenti', () => {
  let matchState = createEminenceMatchState({ playerEminenceId: ALTAR, enemyEminenceId: 'patto_grande_semaforo' });
  matchState.player.presence = 3;
  matchState = beginEminenceRound(matchState, { roundNumber: 2 });
  const attempt = selectEminenceAbility(matchState, SIDES.PLAYER, 'kethran_innesto', { fragmentCardId: AGENT_A });
  assert.equal(attempt.ok, false);
});

test('Altare −2 Innesto nel Potere: il Potere del Frammento sostituisce quello dell\'Agente', () => {
  const fragment = ALL_AGENTS.find((agent) => agent.id === AGENT_A);
  const { bundle } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_innesto',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    fragments: { player: [AGENT_A] },
    playerParams: { fragmentCardId: AGENT_A, graftInto: 'power' },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
  });
  const overlay = bundle.abilityOverlays[AGENT_B];
  assert.equal(overlay.trigger, fragment.ability.trigger ?? null);
  assert.equal(overlay.effect, fragment.ability.effect);
  assert.equal(overlay.value, fragment.ability.value);
  assert.equal(bundle.triggerRules.replacementsByCardId[AGENT_B].trigger, fragment.ability.trigger ?? null);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER], undefined);
});

test('Altare −2 Innesto nel Bonus: il Potere del Frammento diventa il Bonus, il Potere resta', () => {
  const fragment = ALL_AGENTS.find((agent) => agent.id === AGENT_A);
  const { bundle } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_innesto',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    fragments: { player: [AGENT_A] },
    playerParams: { fragmentCardId: AGENT_A, graftInto: 'bonus' },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
  });
  assert.equal(bundle.abilityOverlays[AGENT_B], undefined);
  const override = bundle.armyBonusState[SIDES.PLAYER].override;
  assert.equal(override.trigger, fragment.ability.trigger ?? null);
  assert.equal(override.effects[0].effect, fragment.ability.effect);
});

test('Altare −2 Innesto: il Frammento non si consuma', () => {
  const { matchState } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_innesto',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    fragments: { player: [AGENT_A] },
    playerParams: { fragmentCardId: AGENT_A, graftInto: 'power' },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
  });
  assert.deepEqual(settled.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
});

test('Altare −3 Opera Composita: richiede 2 Frammenti e compone trigger ed effetto', () => {
  let lonely = createEminenceMatchState({ playerEminenceId: ALTAR, enemyEminenceId: 'patto_grande_semaforo' });
  lonely.player.presence = 3;
  lonely.player.persistent.fragmentCardIds = [AGENT_A];
  lonely = beginEminenceRound(lonely, { roundNumber: 3 });
  assert.equal(selectEminenceAbility(lonely, SIDES.PLAYER, 'kethran_opera_composita').ok, false);

  const triggerCard = ALL_AGENTS.find((agent) => agent.id === AGENT_A);
  const effectCard = ALL_AGENTS.find((agent) => agent.id === AGENT_B);
  const { bundle } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_opera_composita',
    enemyAbility: 'semaforo_verde',
    presence: { player: 3 },
    fragments: { player: [AGENT_A, AGENT_B] },
    playerParams: { fragmentCardId: [AGENT_A, AGENT_B] },
    agentIdBySide: { [SIDES.PLAYER]: 103 },
  });
  const overlay = bundle.abilityOverlays[103];
  assert.equal(overlay.trigger, triggerCard.ability.trigger);
  assert.equal(overlay.effect, effectCard.ability.effect);
});

test('Altare −1 Elogio: in vittoria l\'Agente diventa Frammento e lo Statico dà +1 Presenza', () => {
  const { matchState } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_elogio',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  assert.equal(matchState.player.presence, 1);

  const afterWin = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  assert.deepEqual(afterWin.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
  assert.equal(afterWin.matchState.player.presence, 2);

  const afterLoss = settleEminenceRound(matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  // Sconfitta: Frammento dallo statico (non da Elogio) + presenza da mark gain.
  assert.deepEqual(afterLoss.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
});

// ------------------------------------------------------------------
// Fame — Preda, Gorgoglio, Frenesia, Cannibalismo
// ------------------------------------------------------------------

const FAME = 'mounthborn_fame';
const PREY = 102;
const TURBO_PREY = 111;

test('Fame setup: la scelta di setup marca la Preda e la rende pubblica', () => {
  let matchState = createEminenceMatchState({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  matchState = beginEminenceRound(matchState, { roundNumber: 1 });
  assert.equal(needsEminenceSetup(matchState), true);

  const committed = commitEminenceSetupChoice(matchState, SIDES.PLAYER, { preyCardId: PREY });
  assert.equal(committed.ok, true);
  assert.equal(committed.matchState.setupRevealed, true);
  assert.deepEqual(committed.matchState.player.persistent.preyCardIds, [PREY]);
  assert.equal(committed.matchState.player.setupParams, null);
});

function presenceFrom(bundle, source) {
  return bundle.presenceChanges
    .filter((change) => change.side === SIDES.PLAYER && change.source === source)
    .reduce((sum, change) => sum + change.delta, 0);
}

test('Fame statico: Preda schierata dall\'avversario dà +1 Presenza e Bonus attivo', () => {
  const { bundle } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_fame_ricarica',
    enemyAbility: 'semaforo_verde',
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });
  assert.equal(presenceFrom(bundle, 'mounthborn_istinto_predatorio'), 1);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].forcedActive, true);

  const none = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_fame_ricarica',
    enemyAbility: 'semaforo_verde',
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: 116 },
  });
  assert.equal(presenceFrom(none.bundle, 'mounthborn_istinto_predatorio'), 0);
  assert.equal(none.bundle.armyBonusState[SIDES.PLAYER], undefined);
});

test('Fame statico: la Preda cade dopo aver combattuto, anche se Turbo', () => {
  const { matchState } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_fame_ricarica',
    enemyAbility: 'semaforo_verde',
    prey: { player: [TURBO_PREY, PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: TURBO_PREY },
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: TURBO_PREY },
  });
  assert.deepEqual(settled.matchState.player.persistent.preyCardIds, [PREY]);
});

test('Fame +1: perdi 2 PV se non hai sconfitto una Preda', () => {
  const round = (enemyAgent) => playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_fame_ricarica',
    enemyAbility: 'semaforo_verde',
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: enemyAgent },
  }).matchState;
  const hpLost = (enemyAgent, winner) => (settleEminenceRound(round(enemyAgent), {
    winner,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: enemyAgent },
  }).bundle?.hpDeltas || [])
    .filter((entry) => entry.side === SIDES.PLAYER)
    .reduce((sum, entry) => sum + entry.amount, 0);

  assert.equal(hpLost(PREY, SIDES.PLAYER), 0);
  assert.equal(hpLost(PREY, SIDES.ENEMY), -2);
  assert.equal(hpLost(116, SIDES.PLAYER), -2);
  assert.equal(hpLost(PREY, 'draw'), -2);
});

test('Fame −1: Gorgoglio marca la Preda prima degli Agenti', () => {
  const { matchState } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_gorgoglio',
    enemyAbility: 'semaforo_verde',
    playerParams: { preyCardId: PREY },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: 116 },
  });
  assert.equal(EMINENCES[FAME].abilities.find((x) => x.id === 'mounthborn_gorgoglio').revealGate, REVEAL_GATES.PRE_AGENT);
  assert.deepEqual(matchState.player.persistent.preyCardIds, [PREY]);
  assert.equal(matchState.player.presence, 0);
});

test('Fame −2: Frenesia sostituisce il Potere e rimborsa la Presenza contro una Preda', () => {
  const hit = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_frenesia',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });
  assert.deepEqual(
    { trigger: hit.bundle.abilityOverlays[AGENT_A].trigger, effect: hit.bundle.abilityOverlays[AGENT_A].effect, value: hit.bundle.abilityOverlays[AGENT_A].value },
    { trigger: 'imboscata', effect: 'powerAndDamage', value: 1 },
  );
  assert.equal(hit.bundle.triggerRules.replacementsByCardId[AGENT_A].trigger, 'imboscata');
  assert.equal(presenceFrom(hit.bundle, 'mounthborn_frenesia'), 2);

  const miss = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_frenesia',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: 116 },
  });
  assert.equal(miss.bundle.abilityOverlays[AGENT_A].effect, 'powerAndDamage');
  assert.equal(presenceFrom(miss.bundle, 'mounthborn_frenesia'), 0);
});

test('Fame −3: Caccia marca la Preda e la impone all\'avversario', () => {
  const base = createEminenceMatchState({ playerEminenceId: FAME, enemyEminenceId: 'patto_grande_semaforo' });
  base.player.presence = 3;
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'mounthborn_caccia', { preyCardId: PREY }).matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;

  assert.equal(matchState.player.revealedAbilityId, 'mounthborn_caccia');
  assert.deepEqual(matchState.player.persistent.preyCardIds, [PREY]);
  assert.equal(readDeployConstraints(matchState, SIDES.ENEMY).forcedCardId, PREY);
  assert.deepEqual(filterDeployableCardIds(matchState, SIDES.ENEMY, [PREY, 116, 117], [117]), [PREY]);
  assert.deepEqual(filterDeployableCardIds(matchState, SIDES.PLAYER, [AGENT_A, 202], []), [AGENT_A, 202]);

  const next = beginEminenceRound(matchState, { roundNumber: 4 });
  assert.equal(readDeployConstraints(next, SIDES.ENEMY).forcedCardId, null);
});

test('vincoli di schieramento: vietato salvo ultimo, riusabile, imposto', () => {
  const state = {
    player: { round: { deployConstraints: { forcedCardId: null, bannedCardIds: [2], revivedCardIds: [9] } } },
  };
  assert.deepEqual(filterDeployableCardIds(state, SIDES.PLAYER, [1, 2, 9], [9]), [1, 9]);
  assert.deepEqual(filterDeployableCardIds(state, SIDES.PLAYER, [1, 2], [1]), [2]);
  assert.deepEqual(filterDeployableCardIds(null, SIDES.PLAYER, [1, 2], [1]), [2]);
});

// ------------------------------------------------------------------
// Khemet — Il Castello dei Sigillatori
// ------------------------------------------------------------------

const KHEMET = 'khemet_maledizioni';

test('Khemet −2: la maledizione resta sullo slot, è simmetrica e si accumula', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: KHEMET,
    playerAbility: 'khemet_maledizione_va',
    enemyAbility: 'khemet_maledizione_va',
    presence: { player: 2, enemy: 2 },
    playerParams: { slot: 2 },
    enemyParams: { slot: 2 },
  });

  const playerCurses = matchState.player.persistent.slotCurses['2'];
  const enemyCurses = matchState.enemy.persistent.slotCurses['2'];
  assert.equal(playerCurses.length, 1);
  assert.equal(enemyCurses.length, 1);
  assert.equal(playerCurses[0].leagueScaled, true);
  assert.equal(collectSlotCurses(matchState, 2).length, 2);
  assert.equal(collectSlotCurses(matchState, 0).length, 0);
  assert.equal(matchState.player.persistent.slotCurses['2'][0].fieldId, undefined);
});

test('Khemet −2: senza slot scelto non persiste nulla', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_maledizione_va',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
  });
  assert.deepEqual(matchState.player.persistent.slotCurses, {});
});

test('Khemet −3: −1 POT/DAN/VA resta sullo slot scelto, compreso lo slot 0', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_maledizione_stat',
    enemyAbility: 'semaforo_verde',
    presence: { player: 3 },
    playerParams: { slot: 0 },
  });
  const curses = matchState.player.persistent.slotCurses['0'];
  assert.equal(curses.length, 1);
  assert.deepEqual(curses[0].deltas, { power: -1, damage: -1, assaultValue: -1 });
  assert.equal(curses[0].leagueScaled, false);
});

test('Khemet: attaccare le maledizioni al Duello non le riscrive nello stato', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_maledizione_va',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
    playerParams: { slot: 2 },
  });

  const prepared = prepareEminenceDuel(matchState, { currentFieldIndex: 2 });
  assert.equal(prepared.matchState.player.persistent.slotCurses['2'].length, 1);
  assert.equal(prepared.bundle.slotModifiers.filter((entry) => entry.leagueScaled).length, 1);

  const otherSlot = prepareEminenceDuel(matchState, { currentFieldIndex: 0 });
  assert.equal((otherSlot.bundle?.slotModifiers || []).filter((entry) => entry.leagueScaled).length, 0);
});

test('Khemet +2: Devozione al cervello deposita SWAP_POWER_BONUS_TRIGGERS', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_devozione',
    enemyAbility: 'semaforo_verde',
  });
  // presenceDelta +2 sulla Presenza iniziale 2.
  assert.equal(matchState.player.presence, 4);
  assert.equal(bundle.triggerRules.powerBonusSwaps.length, 1);
  assert.equal(bundle.triggerRules.powerBonusSwaps[0].scope, TRIGGER_SCOPES.OWN);
});

test('Khemet statico: Cattura-Energia paga +2 Presenza su Overdrive realmente attivato', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_devozione',
    enemyAbility: 'semaforo_verde',
  });

  const hit = settleEminenceRound(matchState, {
    powerResolvedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
    activatedTriggerBySide: { [SIDES.PLAYER]: 'overdrive', [SIDES.ENEMY]: null },
  });
  assert.equal(hit.matchState.player.presence, 6);
  assert.equal(hit.bundle.presenceChanges[0].source, 'khemet_rito_overdrive');
  assert.equal(hit.bundle.presenceChanges[0].delta, 2);

  const miss = settleEminenceRound(matchState, {
    activatedTriggerBySide: { [SIDES.PLAYER]: 'imboscata', [SIDES.ENEMY]: null },
  });
  assert.equal(miss.matchState.player.presence, 4);
});

const FIGLI = 'figli_domanda_senza_fine';

function sealUntilGeneral(playerAbility, { presence = 2 } = {}) {
  const base = createEminenceMatchState({
    playerEminenceId: FIGLI,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  if (presence != null) base.player.presence = presence;
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  const player = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility);
  assert.equal(player.ok, true, player.reason);
  const enemy = selectEminenceAbility(player.matchState, SIDES.ENEMY, 'semaforo_verde');
  assert.equal(enemy.ok, true, enemy.reason);
  matchState = enemy.matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  return matchState;
}

function prepareFigli(playerAbility, {
  focus = 0,
  league = 3,
  presence = 2,
  enemyFocus = 0,
  enemyLeague = 3,
} = {}) {
  return prepareEminenceDuel(sealUntilGeneral(playerAbility, { presence }), {
    focusInvestedBySide: { [SIDES.PLAYER]: focus, [SIDES.ENEMY]: enemyFocus },
    leagueBySide: { [SIDES.PLAYER]: league, [SIDES.ENEMY]: enemyLeague },
  });
}

test('Figli: Presenza iniziale 1', () => {
  const state = createEminenceMatchState({ playerEminenceId: FIGLI, enemyEminenceId: 'patto_grande_semaforo' });
  assert.equal(state.player.presence, 1);
});

test('Figli +1: Deriva alza il requisito subito e lo tiene per lo Scontro', () => {
  const prepared = prepareFigli('figli_deriva', { focus: 3, league: 3 });
  assert.equal(prepared.matchState.player.persistent.anchoredThresholdDelta, 1);
  assert.equal(prepared.matchState.player.presence, 3);
});

test('Figli −1: Condensazione dà 1 FC temporaneo solo se Ancorato', () => {
  const hit = prepareFigli('figli_condensazione', { focus: 3, league: 3, presence: 1 });
  assert.equal(hit.bundle.temporaryFocus[SIDES.PLAYER], 1);

  const miss = prepareFigli('figli_condensazione', { focus: 2, league: 3, presence: 1 });
  assert.equal(miss.bundle.temporaryFocus[SIDES.PLAYER], 0);
});

test('Figli −2: La Domanda si diffonde si rivela prima degli Agenti', () => {
  const ability = EMINENCES[FIGLI].abilities.find((a) => a.id === 'figli_domanda_si_diffonde');
  assert.equal(ability.revealGate, REVEAL_GATES.PRE_AGENT);
});

test('Figli −2: La Domanda si diffonde blocca il Potere nemico non Ancorato con la tua soglia', () => {
  // Nemico L3: requisito base 3 FC.
  const blocked = prepareFigli('figli_domanda_si_diffonde', { presence: 2, enemyFocus: 2, enemyLeague: 3 });
  assert.deepEqual(blocked.bundle.blockedPowerSides, [SIDES.ENEMY]);

  const free = prepareFigli('figli_domanda_si_diffonde', { presence: 2, enemyFocus: 3, enemyLeague: 3 });
  assert.deepEqual(free.bundle.blockedPowerSides || [], []);
});

test('Figli −2: La Domanda si diffonde usa gli aumenti di Deriva di chi la impone', () => {
  const base = createEminenceMatchState({ playerEminenceId: FIGLI, enemyEminenceId: 'patto_grande_semaforo' });
  base.player.presence = 2;
  base.player.persistent = { ...base.player.persistent, anchoredThresholdDelta: 2 };
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'figli_domanda_si_diffonde').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  // Nemico L3 con 3 FC: Ancorato per sé, ma non con la soglia dei Figli (3 + 2 = 5).
  const prepared = prepareEminenceDuel(matchState, {
    focusInvestedBySide: { [SIDES.PLAYER]: 1, [SIDES.ENEMY]: 3 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  assert.deepEqual(prepared.bundle.blockedPowerSides, [SIDES.ENEMY]);
});

test('Figli statico: a fine Duello +1 Presenza se Ancorato', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: FIGLI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );
  const hit = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    anchoredBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(hit.matchState.player.presence, 2);

  const miss = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    anchoredBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.equal(miss.matchState.player.presence, 1);
});

test('Figli −4: Risposta concede Immune e forza il trigger se Ancorato', () => {
  const hit = prepareFigli('figli_risposta', { focus: 3, league: 3, presence: 4 });
  assert.deepEqual(hit.bundle.immuneSides, [SIDES.PLAYER]);
  assert.equal(hit.bundle.triggerRules.forceSatisfied.length, 1);

  const miss = prepareFigli('figli_risposta', { focus: 2, league: 3, presence: 4 });
  assert.equal((miss.bundle.immuneSides || []).length, 0);
  assert.equal(miss.bundle.triggerRules.forceSatisfied.length, 0);
});

// ------------------------------------------------------------------
// Corte Rossa — Sanguinaccio, il Registro
// ------------------------------------------------------------------

const CORTE = 'corte_rossa';
const CORTE_AGENT = 201;
const CORTE_ENEMY = 301;

/**
 * Apre un round con la Corte sul lato giocatore: l'Offerta si rivela al primo gate.
 * Restituisce lo stato subito dopo il reveal e l'Offerta in attesa di risposta.
 */
function openCorteOffer(playerAbility, { presence = 3, roundNumber = 3, base = null } = {}) {
  const start = base || createEminenceMatchState({
    playerEminenceId: CORTE,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  start.player.presence = presence;
  let matchState = beginEminenceRound(start, { roundNumber });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility).matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  const revealed = advanceToNextRevealGate(matchState);
  assert.equal(revealed.gate, REVEAL_GATES.PRE_FIELD);
  return { matchState: revealed.matchState, pending: revealed.bundle?.pendingDeals?.[0] ?? null };
}

function answerAndPrepare(opened, response) {
  let matchState = opened.matchState;
  if (opened.pending) {
    matchState = resolvePendingDeal(matchState, opened.pending, response).matchState;
  }
  matchState = advanceToNextRevealGate(matchState).matchState;
  return prepareEminenceDuel(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: CORTE_AGENT, [SIDES.ENEMY]: CORTE_ENEMY },
  });
}

function registro(matchState) {
  return (matchState.player.persistent.endMatchDebts || []).map((debt) => ({
    side: debt.side,
    amount: debt.amount,
    source: debt.source,
  }));
}

test('Corte: Presenza iniziale 0 e tutte le attive sono Offerte rivelate al primo gate', () => {
  const state = createEminenceMatchState({ playerEminenceId: CORTE, enemyEminenceId: 'patto_grande_semaforo' });
  assert.equal(state.player.presence, 0);
  for (const ability of EMINENCES[CORTE].abilities) {
    assert.equal(ability.revealGate, REVEAL_GATES.PRE_FIELD, ability.id);
    assert.equal(ability.segments[0].mode, 'OFFER', ability.id);
  }
});

test('Corte: l\'Offerta resta in attesa finché l\'avversario non risponde', () => {
  const opened = openCorteOffer('corte_prestito');
  assert.equal(opened.pending.mode, 'OFFER');
  assert.equal(opened.pending.recipientSide, SIDES.ENEMY);
  assert.equal(opened.pending.mustAccept, false);
});

test('Corte +1 Prestito accettato: 2 FC temporanei all\'Agente nemico, voce di 2 PV nel Registro, +1 Presenza', () => {
  const opened = openCorteOffer('corte_prestito', { presence: 0 });
  // Reveal +1 Presenza.
  assert.equal(opened.matchState.player.presence, 1);
  const prepared = answerAndPrepare(opened, { dealAccepted: true });
  assert.equal(prepared.matchState.player.presence, 2);
  assert.equal(prepared.bundle.temporaryFocus[SIDES.ENEMY], 2);
  assert.deepEqual(registro(prepared.matchState), [{ side: SIDES.ENEMY, amount: 2, source: 'corte_prestito' }]);
});

test('Corte +1 Prestito rifiutato: nessun effetto e nessuna Presenza extra', () => {
  const opened = openCorteOffer('corte_prestito', { presence: 0 });
  const prepared = answerAndPrepare(opened, { dealAccepted: false });
  assert.equal(prepared.matchState.player.presence, 1);
  assert.equal(prepared.bundle.temporaryFocus[SIDES.ENEMY], 0);
  assert.deepEqual(registro(prepared.matchState), []);
});

test('Corte 0 Rinforzo: l\'avversario sceglie +2 DAN o +1 POT', () => {
  const damage = answerAndPrepare(openCorteOffer('corte_rinforzo'), { dealAccepted: true, dealChoice: 'damage' });
  assert.equal(damage.bundle.statDeltas[SIDES.ENEMY].damage, 2);
  assert.equal(damage.bundle.statDeltas[SIDES.ENEMY].power, 0);
  assert.deepEqual(registro(damage.matchState), [{ side: SIDES.ENEMY, amount: 1, source: 'corte_rinforzo' }]);

  const power = answerAndPrepare(openCorteOffer('corte_rinforzo'), { dealAccepted: true, dealChoice: 'power' });
  assert.equal(power.bundle.statDeltas[SIDES.ENEMY].power, 1);
  assert.equal(power.bundle.statDeltas[SIDES.ENEMY].damage, 0);
});

test('Corte 0 Rinforzo: accettare senza scegliere è un errore', () => {
  const opened = openCorteOffer('corte_rinforzo');
  assert.throws(() => resolvePendingDeal(opened.matchState, opened.pending, { dealAccepted: true }), /scelta/);
});

test('Corte −1 Debito accettato: il Potere nemico diventa Debito 2', () => {
  const prepared = answerAndPrepare(openCorteOffer('corte_debito'), { dealAccepted: true });
  assert.equal(prepared.bundle.abilityOverlays[CORTE_ENEMY].trigger, 'debt');
  assert.equal(prepared.bundle.abilityOverlays[CORTE_ENEMY].debtAmount, 2);
  assert.equal(prepared.bundle.triggerRules.replacementsByCardId[CORTE_ENEMY].trigger, 'debt');
  // Nessun costo allo schieramento: il Debito si paga solo se il Potere si attiva.
  assert.deepEqual(prepared.bundle.hpDeltas, []);
});

test('Corte −3 Interessi: ogni voce del Registro aumenta di 2 PV', () => {
  const base = createEminenceMatchState({ playerEminenceId: CORTE, enemyEminenceId: 'patto_grande_semaforo' });
  base.player.persistent.endMatchDebts = [
    { side: SIDES.ENEMY, amount: 2, basis: 'FIXED', dueAt: 'END_MATCH', source: 'corte_prestito', ownerSide: SIDES.PLAYER },
    { side: SIDES.ENEMY, amount: 1, basis: 'FIXED', dueAt: 'END_MATCH', source: 'corte_rinforzo', ownerSide: SIDES.PLAYER },
  ];
  const prepared = answerAndPrepare(openCorteOffer('corte_interessi', { base }), { dealAccepted: true });
  assert.deepEqual(registro(prepared.matchState).map((entry) => entry.amount), [4, 3]);
});

test('Corte: rifiutata un\'Offerta, la successiva va accettata', () => {
  const refused = answerAndPrepare(openCorteOffer('corte_prestito', { roundNumber: 2 }), { dealAccepted: false });
  const settled = settleEminenceRound(refused.matchState, { winner: SIDES.PLAYER });

  const opened = openCorteOffer('corte_rinforzo', { roundNumber: 3, base: settled.matchState });
  assert.equal(opened.pending.mustAccept, true);
  const prepared = answerAndPrepare(opened, { dealAccepted: false, dealChoice: 'power' });
  assert.equal(prepared.bundle.statDeltas[SIDES.ENEMY].power, 1);
});

test('Corte: dopo un\'Offerta accettata il rifiuto torna disponibile', () => {
  const accepted = answerAndPrepare(openCorteOffer('corte_prestito', { roundNumber: 2 }), { dealAccepted: true });
  const settled = settleEminenceRound(accepted.matchState, { winner: SIDES.PLAYER });
  const opened = openCorteOffer('corte_prestito', { roundNumber: 3, base: settled.matchState });
  assert.equal(opened.pending.mustAccept, false);
});

test('Corte: il Registro non si paga a fine round ma alla Fine dello Scontro', () => {
  const prepared = answerAndPrepare(openCorteOffer('corte_prestito'), { dealAccepted: true });
  const settled = settleEminenceRound(prepared.matchState, { winner: SIDES.PLAYER });
  assert.deepEqual(registro(settled.matchState).map((entry) => entry.amount), [2]);

  const ended = settleEminenceMatch(settled.matchState);
  assert.ok(ended.bundle.hpDeltas.some((delta) => delta.side === SIDES.ENEMY && delta.amount === -2));
  assert.deepEqual(registro(ended.matchState), []);
});

// ------------------------------------------------------------------
// Calibri — Il Comando dei Quattro Fronti
// ------------------------------------------------------------------

const CALIBRI = 'calibri_quattro_fronti';

function calibriDuel(playerAbility, { presence = 4, duelRecord = null } = {}) {
  const base = createEminenceMatchState({ playerEminenceId: CALIBRI, enemyEminenceId: 'patto_grande_semaforo' });
  base.player.presence = presence;
  if (duelRecord) base.player.persistent.duelRecord = { won: 0, lost: 0, draw: 0, ...duelRecord };
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility).matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;
  return prepareEminenceDuel(matchState, { agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 301 } });
}

test('Calibri: Presenza iniziale 1', () => {
  const state = createEminenceMatchState({ playerEminenceId: CALIBRI, enemyEminenceId: 'patto_grande_semaforo' });
  assert.equal(state.player.presence, 1);
  assert.equal(EMINENCES[CALIBRI].abilities.some((a) => a.id === 'calibri_contenimento'), false);
});

test('Calibri statico: +1 Presenza solo in sconfitta con DAN nemico ≤ 2', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: CALIBRI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );

  const hitLoss = settleEminenceRound(base, {
    winner: SIDES.ENEMY,
    finalDamageBySide: { [SIDES.PLAYER]: 5, [SIDES.ENEMY]: 2 },
  });
  assert.equal(hitLoss.matchState.player.presence, 2);

  const missHigh = settleEminenceRound(base, {
    winner: SIDES.ENEMY,
    finalDamageBySide: { [SIDES.PLAYER]: 5, [SIDES.ENEMY]: 3 },
  });
  assert.equal(missHigh.matchState.player.presence, 1);

  const missWin = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    finalDamageBySide: { [SIDES.PLAYER]: 1, [SIDES.ENEMY]: 1 },
  });
  assert.equal(missWin.matchState.player.presence, 1);
});

test('Calibri: la chiusura del round annota vittorie, sconfitte e pareggi per lato', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: CALIBRI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 1 },
  );
  const lost = settleEminenceRound(base, { winner: SIDES.ENEMY }).matchState;
  assert.deepEqual(lost.player.persistent.duelRecord, { won: 0, lost: 1, draw: 0 });
  assert.deepEqual(lost.enemy.persistent.duelRecord, { won: 1, lost: 0, draw: 0 });
  const drawn = settleEminenceRound(beginEminenceRound(lost, { roundNumber: 2 }), { winner: 'draw' }).matchState;
  assert.deepEqual(drawn.player.persistent.duelRecord, { won: 0, lost: 1, draw: 1 });
});

test('Calibri +1: Fermo Macchine blocca il proprio Potere', () => {
  const prepared = calibriDuel('calibri_fermo_macchine', { presence: 1 });
  assert.equal(prepared.blocked, null);
  assert.equal(prepared.matchState.player.presence, 2);
  assert.deepEqual(prepared.bundle.blockedPowerSides, [SIDES.PLAYER]);
});

test('Calibri −1: Guerra d\'Attrito dà 1 FC, 2 se hai vinto meno Duelli', () => {
  const pari = calibriDuel('calibri_guerra_attrito', { presence: 1, duelRecord: { won: 1, lost: 1 } });
  assert.equal(pari.matchState.player.presence, 0);
  assert.equal(pari.bundle.poolFocus[SIDES.PLAYER], 1);

  const indietro = calibriDuel('calibri_guerra_attrito', { presence: 1, duelRecord: { won: 0, lost: 2 } });
  assert.equal(indietro.bundle.poolFocus[SIDES.PLAYER], 2);

  // Il costo è fisso: vincere non lo rincara.
  const settled = settleEminenceRound(pari.matchState, { winner: SIDES.PLAYER });
  assert.deepEqual(settled.matchState.player.persistent.abilityPresenceDeltas, {});
});

test('Calibri −2: Logoramento dà +3 VA per ogni Duello perso', () => {
  const zero = calibriDuel('calibri_logoramento', { presence: 2 });
  assert.equal(zero.bundle.statDeltas[SIDES.PLAYER].assaultValue, 0);
  const tre = calibriDuel('calibri_logoramento', { presence: 2, duelRecord: { won: 1, lost: 3 } });
  assert.equal(tre.bundle.statDeltas[SIDES.PLAYER].assaultValue, 9);
  assert.equal(tre.bundle.statDeltas[SIDES.ENEMY].assaultValue, 0);
});

test('Calibri −4: Terra Bruciata arma la distruzione Campo solo in sconfitta', () => {
  const { bundle } = playRound({
    playerEminenceId: CALIBRI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'calibri_terra_bruciata',
    enemyAbility: 'semaforo_verde',
    presence: { player: 4 },
  });

  assert.equal(bundle.conquestOverrides.length, 1);
  assert.equal(bundle.conquestOverrides[0].when, 'LOSS');
  assert.equal(bundle.conquestOverrides[0].destroyField, true);
  assert.equal(bundle.conquestOverrides[0].suppressConquest, true);
});

test('Calibri: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: CALIBRI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'calibri_guerra_attrito',
    enemyAbility: 'semaforo_verde',
  });
  const settled = settleEminenceRound(matchState, { winner: SIDES.PLAYER });
  const closed = settleEminenceMatch(settled.matchState);
  assert.equal(closed.bundle, null);
});

// ------------------------------------------------------------------
// Orathai — Il Primo Canto
// ------------------------------------------------------------------

const ORATHAI = 'orathai_primo_canto';

test('Orathai statico: +1 Presenza solo se entrambi i requisiti sono soddisfatti', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: ORATHAI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );

  const hit = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    activationSatisfiedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: true },
  });
  assert.equal(hit.matchState.player.presence, 2);

  const missOne = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    activationSatisfiedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(missOne.matchState.player.presence, 1);
});

test('Orathai +1: Il Prezzo del Canto costa 1 PV per ogni Potere attivato', () => {
  const { matchState } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_prezzo_del_canto',
    enemyAbility: 'semaforo_verde',
  });
  assert.equal(matchState.player.presence, 2);
  const lost = (powerResolvedBySide) => settleEminenceRound(matchState, { winner: SIDES.PLAYER, powerResolvedBySide })
    .bundle?.hpDeltas.filter((e) => e.side === SIDES.PLAYER).reduce((sum, e) => sum + e.amount, 0) ?? 0;
  assert.equal(lost({ [SIDES.PLAYER]: true, [SIDES.ENEMY]: true }), -2);
  assert.equal(lost({ [SIDES.PLAYER]: false, [SIDES.ENEMY]: true }), -1);
  assert.equal(lost({ [SIDES.PLAYER]: true, [SIDES.ENEMY]: false }), -1);
  assert.equal(lost({ [SIDES.PLAYER]: false, [SIDES.ENEMY]: false }), 0);
});

test('Orathai −1: Contrappunto è solo lo specchio, senza immunità ai Blocca', () => {
  const { bundle, matchState } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_contrappunto',
    enemyAbility: 'semaforo_verde',
  });
  assert.equal(matchState.player.presence, 0);
  assert.equal(bundle.triggerRules.unblockable.length, 0);
  assert.equal(bundle.triggerRules.mirrorUnsatisfied.length, 1);
});

test('Orathai −2: Eco arma la ripetizione del Potere nemico sul proprio Agente', () => {
  const { bundle } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_eco',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
  });
  assert.deepEqual(bundle.echoPowerSides, [SIDES.PLAYER]);
});

test('Orathai −3: Silenzio sostituisce i trigger Potere con Magnanimo', () => {
  const { bundle } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_silenzio',
    enemyAbility: 'semaforo_verde',
    presence: { player: 3 },
    agentIdBySide: { [SIDES.PLAYER]: 101, [SIDES.ENEMY]: 102 },
  });
  assert.equal(bundle.triggerRules.replacementsByCardId[101].trigger, 'magnanimous');
  assert.equal(bundle.triggerRules.replacementsByCardId[102].trigger, 'magnanimous');
});

test('Orathai: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_prezzo_del_canto',
    enemyAbility: 'semaforo_verde',
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    powerResolvedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: true },
  });
  const closed = settleEminenceMatch(settled.matchState);
  assert.equal(closed.bundle, null);
});

// ------------------------------------------------------------------
// Enclave — L'Enclave dell'Ascensione
// ------------------------------------------------------------------

const ENCLAVE = 'enclave_ascensione';

test('Enclave statico: Accumulo paga solo con almeno 3 FC investiti', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: ENCLAVE, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );

  const hit = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
  });
  assert.equal(hit.matchState.player.presence, 2);

  const miss = settleEminenceRound(base, {
    winner: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 2, [SIDES.ENEMY]: 4 },
  });
  assert.equal(miss.matchState.player.presence, 1);
});

test('Enclave +1: Rinuncia sopprime il Bonus e Accumulo resta spendibile', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_rinuncia',
    enemyAbility: 'semaforo_verde',
  });
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].suppressed, true);
  assert.equal(matchState.player.presence, 2);

  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
  });
  assert.equal(settled.matchState.player.presence, 3);
});

test('Enclave −1: Ascesa deposita ±1 Lega sulla carta e scade al round successivo', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_ascesa',
    enemyAbility: 'semaforo_verde',
    playerParams: { cardId: 201, leagueDelta: 1 },
  });
  assert.equal(matchState.player.presence, 0);
  assert.equal(matchState.player.round.temporaryLeagueByCardId[201], 1);
  assert.equal(bundle.leagueByCardId?.[201] ?? null, null);

  const prepared = prepareEminenceDuel(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: 201, [SIDES.ENEMY]: 301 },
  });
  assert.equal(prepared.bundle.leagueByCardId[201], 1);

  const next = beginEminenceRound(matchState, { roundNumber: 4 });
  assert.deepEqual(next.player.round.temporaryLeagueByCardId, {});
});

test('Enclave −2: Furto di Reliquie sottrae 2 Presenza e ne dà 1, solo in vittoria', () => {
  const { matchState } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_furto_reliquie',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2, enemy: 3 },
  });
  assert.equal(matchState.player.presence, 0);
  const enemyBefore = matchState.enemy.presence;

  const win = settleEminenceRound(matchState, { winner: SIDES.PLAYER }).matchState;
  assert.equal(win.player.presence, 1);
  assert.equal(win.enemy.presence, enemyBefore - 2);
  // Rubare non è spendere: i contatori di spesa avversari restano fermi.
  assert.equal(win.enemy.totalPresenceSpent, matchState.enemy.totalPresenceSpent);

  const loss = settleEminenceRound(matchState, { winner: SIDES.ENEMY }).matchState;
  assert.equal(loss.player.presence, 0);
  assert.equal(loss.enemy.presence, enemyBefore);
});

test('Enclave −X: Ascensione richiede 3 Presenza e la spende tutta in POT', () => {
  const base = createEminenceMatchState({ playerEminenceId: ENCLAVE, enemyEminenceId: 'patto_grande_semaforo' });
  base.player.presence = 2;
  const low = beginEminenceRound(base, { roundNumber: 3 });
  assert.equal(selectEminenceAbility(low, SIDES.PLAYER, 'enclave_ascensione').ok, false);

  const { matchState, bundle } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_ascensione',
    enemyAbility: 'semaforo_verde',
    presence: { player: 6 },
  });
  assert.equal(matchState.player.presence, 0);
  assert.equal(matchState.player.presenceSpentThisRound, 6);
  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 6);
});

test('Enclave: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_rinuncia',
    enemyAbility: 'semaforo_verde',
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
  });
  const closed = settleEminenceMatch(settled.matchState);
  assert.equal(closed.bundle, null);
});

// ------------------------------------------------------------------
// Ratti della Megera
// ------------------------------------------------------------------

const RATTI = 'ratti_bella_malelabbra';

function sealRatti(playerAbility, { presence } = {}) {
  let matchState = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: RATTI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );
  if (presence != null) matchState.player.presence = presence;
  const p = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility);
  assert.equal(p.ok, true, p.reason);
  const e = selectEminenceAbility(p.matchState, SIDES.ENEMY, 'semaforo_verde');
  assert.equal(e.ok, true, e.reason);
  return e.matchState;
}

test('lega minima: pareggio e ultima carta pagano, una Lega più bassa in mano no', () => {
  const deployed = { id: 10, league: 2 };
  assert.equal(isLowestEffectiveLeague(deployed, [{ id: 11, league: 4 }]), true);
  assert.equal(isLowestEffectiveLeague(deployed, [{ id: 11, league: 2 }]), true);
  assert.equal(isLowestEffectiveLeague(deployed, []), true);
  assert.equal(isLowestEffectiveLeague(deployed, [{ id: 11, league: 1 }]), false);
  assert.equal(
    isLowestEffectiveLeague({ id: 10, league: 3 }, [{ id: 11, league: 1 }], { 10: -3 }),
    true,
  );
});

test('Ratti statico: Male Crescente paga solo se l\'Agente schierato ha la Lega minima', () => {
  const sealed = sealRatti('ratti_sussurro');

  const hit = prepareEminenceDuel(sealed, {
    deployedIsLowestLeagueBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(hit.matchState.player.presence, 2);

  const miss = prepareEminenceDuel(sealed, {
    deployedIsLowestLeagueBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.equal(miss.matchState.player.presence, 1);
});

test('Ratti +0: Sussurro paga una sola volta se c\'è stata una riduzione', () => {
  const { matchState } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_sussurro',
    enemyAbility: 'semaforo_verde',
  });

  const hit = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    statReductionOccurred: true,
  });
  assert.equal(hit.matchState.player.presence, 2);

  const miss = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    statReductionOccurred: false,
  });
  assert.equal(miss.matchState.player.presence, 1);
});

test('Ratti −2: Veleno sopprime il Bonus e deposita Tossina sull\'avversario', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_veleno',
    enemyAbility: 'semaforo_verde',
    presence: { player: 2 },
  });
  assert.equal(matchState.player.presence, 0);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].suppressed, true);
  assert.deepEqual(bundle.toxinApplications, [
    { side: SIDES.ENEMY, value: 1, minHealth: 10, source: 'ratti_veleno' },
  ]);
});

test('Ratti −3: Spezzacuore rimuove Tossina e overridea il Bonus in danni diretti', () => {
  const { bundle } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_spezzacuore',
    enemyAbility: 'semaforo_verde',
    presence: { player: 3 },
    playerParams: { removedToxinValue: 2 },
  });
  assert.equal(bundle.toxinRemovals.length, 1);
  assert.equal(bundle.toxinRemovals[0].removedValue, 2);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].override.value, 4);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].override.effect, 'directDamage');
});

test('Ratti: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_sussurro',
    enemyAbility: 'semaforo_verde',
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    statReductionOccurred: true,
  });
  const closed = settleEminenceMatch(settled.matchState);
  assert.equal(closed.bundle, null);
});

test('Khemet: il binding del Duello non conta un Potere bloccato come Overdrive', () => {
  const resolved = powerResolutionFromDuel({
    battleResult: { playerAbilityTriggered: true, playerAbilityBlocked: true },
    playerAgent: { ability: { trigger: 'overdrive' } },
  });
  assert.equal(resolved.powerResolvedBySide[SIDES.PLAYER], false);
  assert.equal(resolved.activatedTriggerBySide[SIDES.PLAYER], null);
});

// ------------------------------------------------------------------
// Estensibilità senza toccare il motore
// ------------------------------------------------------------------

test('estensibilità: una nuova Eminenza costruita solo su primitive funziona subito', () => {
  // Definita qui, ignota al motore: se serve modificare il motore per farla girare,
  // il vocabolario delle primitive è incompleto.
  const inventata = [
    { primitive: P.MODIFY_STAT, target: T.ENEMY_AGENT, stat: 'power', delta: -2 },
    { primitive: P.GRANT_TEMPORARY_FOCUS, target: T.OWN_AGENT, amount: 3 },
    { primitive: P.HEAL_HP, target: T.SELF, amount: 4 },
    { primitive: P.FORBID_TRIGGER, scope: TRIGGER_SCOPES.ENEMY, triggers: ['glory'] },
    { primitive: P.UNBLOCKABLE_POWER, scope: TRIGGER_SCOPES.OWN },
  ].map((segment) => ({ segment, ownerSide: SIDES.PLAYER, abilityId: 'eminenza_di_prova' }));

  const bundle = applyEminenceSegments(inventata);

  assert.equal(bundle.statDeltas[SIDES.ENEMY].power, -2);
  assert.equal(bundle.temporaryFocus[SIDES.PLAYER], 3);
  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: 4, cause: HP_LOSS_CAUSES.OTHER, source: 'eminenza_di_prova' },
  ]);

  const enemyGlory = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext({ wonPrevious: true }),
    card: { id: 2 },
    side: SIDES.ENEMY,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(enemyGlory.satisfied, false);

  const ownBlocked = resolveTriggerState({
    originalTrigger: 'imboscata',
    context: duelContext(),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
    powerBlocked: true,
  });
  assert.equal(ownBlocked.resolves, true);
});

test('estensibilità: una primitiva senza handler fallisce in modo rumoroso', () => {
  assert.throws(
    () => applyEminenceSegments([{ segment: { primitive: 'PRIMITIVA_INVENTATA' }, ownerSide: SIDES.PLAYER }]),
    /Primitiva senza handler/
  );
});

test('estensibilità: ogni primitiva dichiarata nel vocabolario ha un handler', () => {
  const supported = new Set(getSupportedPrimitives());
  for (const primitive of Object.values(P)) {
    assert.equal(supported.has(primitive), true, `primitiva senza handler: ${primitive}`);
  }
});

test('estensibilità: ogni segmento del catalogo usa primitive supportate', () => {
  const supported = new Set(getSupportedPrimitives());
  for (const id of EMINENCE_IDS) {
    const eminence = EMINENCES[id];
    const all = [
      ...(eminence.static?.segments || []),
      ...(eminence.static?.setupSegments || []),
      ...eminence.abilities.flatMap((a) => a.segments || []),
    ];
    for (const seg of all) {
      assert.equal(supported.has(seg.primitive), true, `${id}: primitiva ignota ${seg.primitive}`);
    }
  }
});

test('accumulatore: partire da un bundle esistente compone senza azzerare', () => {
  const bundle = createEffectBundle();
  bundle.statDeltas[SIDES.PLAYER].power = 5;

  applyEminenceSegments(
    [{ segment: { primitive: P.MODIFY_STAT, target: T.OWN_AGENT, stat: 'power', delta: 2 }, ownerSide: SIDES.PLAYER }],
    bundle
  );

  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 7);
});

// ------------------------------------------------------------------
// Vincolo architetturale, verificato sui sorgenti
// ------------------------------------------------------------------

/**
 * Rimuove i commenti conservando le stringhe.
 *
 * Il vincolo riguarda la logica, non la documentazione: un commento che spiega *perché*
 * esiste una primitiva citando l'Eminenza che l'ha motivata è informazione utile. Un
 * identificatore dentro il codice, anche solo in una stringa, sarebbe invece un ramo dedicato.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  let mode = 'code';
  let quote = '';

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (mode === 'code') {
      if (c === '/' && next === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && next === '*') { mode = 'block'; i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { mode = 'string'; quote = c; }
      out += c;
      i += 1;
      continue;
    }

    if (mode === 'string') {
      out += c;
      if (c === '\\') { out += next ?? ''; i += 2; continue; }
      if (c === quote) mode = 'code';
      i += 1;
      continue;
    }

    if (mode === 'line') {
      if (c === '\n') { mode = 'code'; out += c; }
      i += 1;
      continue;
    }

    // block
    if (c === '*' && next === '/') { mode = 'code'; i += 2; continue; }
    if (c === '\n') out += c;
    i += 1;
  }

  return out;
}

test('motore: nessun identificatore di Eminenza compare nei moduli generici', () => {
  const engineFiles = [
    ...readdirSync(HERE)
      .filter((file) => file.endsWith('.js') && !file.endsWith('.test.js'))
      .map((file) => path.join(HERE, file)),
    path.resolve(HERE, '../triggerLogic.js'),
    path.resolve(HERE, '../duel/duelTurnContexts.js'),
    path.resolve(HERE, '../ai/publicStateHash.js'),
    path.resolve(HERE, '../ai/buildAIInformationSet.js'),
    path.resolve(HERE, '../ai/strategicState.js'),
  ];

  const forbidden = [
    ...EMINENCE_IDS,
    ...EMINENCE_IDS.flatMap((id) => EMINENCES[id].abilities.map((a) => a.id)),
    ...EMINENCE_IDS.map((id) => EMINENCES[id].army),
  ];

  const offences = [];
  for (const file of engineFiles) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const token of forbidden) {
      if (code.includes(token)) offences.push(`${path.basename(file)} contiene "${token}"`);
    }
  }

  assert.deepEqual(offences, [], offences.join('; '));
});

test('motore: lo scanner riconoscerebbe un ramo dedicato', () => {
  // Senza questo controllo il test precedente potrebbe passare perché lo stripper mangia
  // troppo, anziché perché il motore è pulito.
  const sample = `
    // Mascarada riordina i gate
    /* Orathai conta le attivazioni */
    function f(id) {
      if (id === 'apex_sole_verde') return 1;
      return 0;
    }
  `;
  const code = stripComments(sample);

  assert.equal(code.includes('Mascarada'), false);
  assert.equal(code.includes('Orathai'), false);
  assert.equal(code.includes('apex_sole_verde'), true);
});

test('motore: il catalogo dati è l\'unico posto che nomina le Eminenze', () => {
  // Controprova del test precedente: se fallisse, il test sopra passerebbe per il motivo
  // sbagliato, cioè perché la lista dei token proibiti si è svuotata.
  const catalog = readFileSync(path.resolve(HERE, '../../data/eminences.js'), 'utf8');
  assert.ok(EMINENCE_IDS.length >= 12);
  for (const id of EMINENCE_IDS) {
    assert.ok(catalog.includes(id), `${id} assente dal catalogo`);
  }
});
