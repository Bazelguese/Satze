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
import { createEminenceMatchState } from './eminenceState.js';
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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

test('Semaforo Verde: apre Imboscata e Turbo, chiude Intervento e Ultima Chance', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_verde',
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
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;

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
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'semaforo_verde').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'apex_furia').matchState;
  matchState = completeGeneralGate(matchState, {}).matchState;

  const first = collectPendingEffects(matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  assert.equal(first.queue.length, 2);

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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
    playerParams: { pronostico: 'VITTORIA_PROPRIA' },
  });
  const afterLoss = settleEminenceRound(lost.matchState, { winner: 'enemy' });
  assert.equal(afterLoss.matchState.player.presence, 1);
  assert.equal(afterLoss.bundle, null);

  const drawBet = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
  });
  const settled = settleEminenceRound(silent.matchState, { winner: 'player' });
  assert.equal(settled.matchState.player.presence, 1);
  assert.equal(settled.bundle, null);

  const armed = playRound({
    playerEminenceId: 'mascarada_organizzatore',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mascarada_scommessa',
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  const afterDraw = settleEminenceRound(draw.matchState, {
    winner: 'draw',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: AGENT_B },
  });
  assert.deepEqual(afterDraw.matchState.player.persistent.fragmentCardIds, []);
});

test('Altare +1: la sconfitta paga +1 Presenza dopo il Duello, in più al delta di reveal', () => {
  const { matchState } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_sacrificio',
    enemyAbility: 'semaforo_giallo',
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  // Reveal +1 sulla Presenza iniziale 2.
  assert.equal(matchState.player.presence, 3);

  const afterLoss = settleEminenceRound(matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  assert.equal(afterLoss.matchState.player.presence, 4);
  assert.equal(afterLoss.bundle.presenceChanges[0].countsAsSpend, false);

  const afterWin = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A },
  });
  assert.equal(afterWin.matchState.player.presence, 3);
  assert.equal(afterWin.bundle, null);
});

test('Altare −2: l\'alias usa il trigger del Frammento; il Frammento si consuma solo se l\'alternativa scatta', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_innesto',
    enemyAbility: 'semaforo_giallo',
    fragments: { player: [AGENT_A] },
    playerParams: { fragmentCardId: AGENT_A, fragmentTrigger: 'imboscata' },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
  });

  const aliased = resolveTriggerState({
    originalTrigger: 'turbo',
    context: duelContext({ isFirst: true, roundNumber: 3 }),
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(aliased.naturalSatisfied, true);
  assert.equal(aliased.aliasUsed, true);

  const ownTrigger = resolveTriggerState({
    originalTrigger: 'turbo',
    context: duelContext({ isFirst: false, roundNumber: 1 }),
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(ownTrigger.aliasUsed, false);
  assert.equal(ownTrigger.naturalSatisfied, true);

  const consumed = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
    aliasUsedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.deepEqual(consumed.matchState.player.persistent.fragmentCardIds, []);

  const kept = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_B },
    aliasUsedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.deepEqual(kept.matchState.player.persistent.fragmentCardIds, [AGENT_A]);
});

test('Altare −4: un Frammento sostituisce il trigger, due compongono trigger ed effetto, e vengono consumati', () => {
  const one = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_opera_composita',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 4 },
    fragments: { player: [AGENT_A, AGENT_B] },
    playerParams: {
      triggerFragmentId: AGENT_A,
      composedTrigger: 'intervention',
    },
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });

  assert.equal(one.bundle.abilityOverlays[201].trigger, 'intervention');
  assert.equal(one.bundle.triggerRules.replacementsByCardId[201].trigger, 'intervention');

  const afterOne = settleEminenceRound(one.matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });
  assert.deepEqual(afterOne.matchState.player.persistent.fragmentCardIds, [AGENT_B]);

  const two = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_opera_composita',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 4 },
    fragments: { player: [AGENT_A, AGENT_B] },
    playerParams: {
      triggerFragmentId: AGENT_A,
      effectFragmentId: AGENT_B,
      composedTrigger: 'intervention',
      composedAbility: { effect: 'power', value: 3 },
    },
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });

  assert.equal(two.bundle.abilityOverlays[201].trigger, 'intervention');
  assert.equal(two.bundle.abilityOverlays[201].effect, 'power');
  assert.equal(two.bundle.abilityOverlays[201].value, 3);

  const afterTwo = settleEminenceRound(two.matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });
  assert.deepEqual(afterTwo.matchState.player.persistent.fragmentCardIds, []);

  const effectOnly = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_opera_composita',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 4 },
    fragments: { player: [AGENT_A] },
    playerParams: {
      fragmentCardId: AGENT_A,
      composeComponent: 'EFFECT',
      composedAbility: { effect: 'enemyAssault', value: -8, minAssault: 6 },
    },
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });

  assert.equal(effectOnly.bundle.abilityOverlays[201].effect, 'enemyAssault');
  assert.equal(effectOnly.bundle.abilityOverlays[201].value, -8);
  assert.equal(effectOnly.bundle.abilityOverlays[201].minAssault, 6);
  assert.equal(effectOnly.bundle.abilityOverlays[201].trigger, undefined);
  assert.equal(effectOnly.bundle.triggerRules.replacementsByCardId?.[201], undefined);
});

test('Altare −4: i params UI a due Frammenti si stampano in un Potere composito e li consumano entrambi', () => {
  const stamped = stampComposeParams({ fragmentCardId: [AGENT_A, AGENT_B] });
  const two = playRound({
    playerEminenceId: ALTAR,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'kethran_opera_composita',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 4 },
    fragments: { player: [AGENT_A, AGENT_B] },
    playerParams: stamped,
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });

  assert.equal(two.bundle.abilityOverlays[201].trigger, 'overdrive');
  assert.equal(two.bundle.abilityOverlays[201].effect, 'focusCoin');
  assert.equal(two.bundle.abilityOverlays[201].value, 2);

  const after = settleEminenceRound(two.matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: 201 },
  });
  assert.deepEqual(after.matchState.player.persistent.fragmentCardIds, []);
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

test('Fame +0: marca la Preda al reveal e paga +2 Presenza se viene schierata', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_gorgoglio',
    enemyAbility: 'semaforo_giallo',
    playerParams: { preyCardId: PREY },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });

  assert.deepEqual(matchState.player.persistent.preyCardIds, [PREY]);
  assert.deepEqual(bundle.presenceChanges, [
    { side: SIDES.PLAYER, delta: 2, countsAsSpend: false, source: 'mounthborn_gorgoglio' },
  ]);
});

test('Fame +0: senza Preda schierata il +2 non parte', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_gorgoglio',
    enemyAbility: 'semaforo_giallo',
    playerParams: { preyCardId: PREY },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: 116 },
  });

  assert.deepEqual(matchState.player.persistent.preyCardIds, [PREY]);
  assert.deepEqual(bundle.presenceChanges, []);
});

test('Fame −2 Frenesia: Preda schierata forza il Bonus d\'Armata e lo rende non bloccabile', () => {
  const { bundle } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_frenesia',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });

  assert.equal(bundle.armyBonusState[SIDES.PLAYER].forcedActive, true);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].unblockable, true);
});

test('Fame −2 Frenesia: senza Preda schierata il Bonus resta invariato', () => {
  const { bundle } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_frenesia',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: 116 },
  });

  assert.equal(bundle.armyBonusState[SIDES.PLAYER], undefined);
});

test('Fame −2 Cannibalismo: sconfitta contro Preda cura 3 PV, poi la Preda cade', () => {
  const { matchState } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_cannibalismo',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
    prey: { player: [PREY] },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });

  const settled = settleEminenceRound(matchState, {
    winner: SIDES.ENEMY,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: PREY },
  });

  assert.deepEqual(settled.bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: 3, cause: HP_LOSS_CAUSES.OTHER, source: 'mounthborn_cannibalismo' },
  ]);
  assert.deepEqual(settled.matchState.player.persistent.preyCardIds, []);
});

test('Fame statico: una Preda Turbo cade a fine round, non dopo il Duello', () => {
  const { matchState } = playRound({
    playerEminenceId: FAME,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'mounthborn_gorgoglio',
    enemyAbility: 'semaforo_giallo',
    playerParams: { preyCardId: TURBO_PREY },
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: TURBO_PREY },
  });
  assert.deepEqual(matchState.player.persistent.preyCardIds, [TURBO_PREY]);

  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: AGENT_A, [SIDES.ENEMY]: TURBO_PREY },
  });
  assert.deepEqual(settled.matchState.player.persistent.preyCardIds, []);
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
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
  });
  assert.deepEqual(matchState.player.persistent.slotCurses, {});
});

test('Khemet −3: −1 POT/DAN/VA resta sullo slot scelto, compreso lo slot 0', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_maledizione_stat',
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
    playerParams: { slot: 2 },
  });

  const prepared = prepareEminenceDuel(matchState, { currentFieldIndex: 2 });
  assert.equal(prepared.matchState.player.persistent.slotCurses['2'].length, 1);
  assert.equal(prepared.bundle.slotModifiers.filter((entry) => entry.leagueScaled).length, 1);

  const otherSlot = prepareEminenceDuel(matchState, { currentFieldIndex: 0 });
  assert.equal((otherSlot.bundle?.slotModifiers || []).filter((entry) => entry.leagueScaled).length, 0);
});

test('Khemet +0: Convalida paga solo se il Potere si è attivato e non è bloccato', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_devozione',
    enemyAbility: 'semaforo_giallo',
  });
  assert.equal(matchState.player.presence, 2);

  const hit = settleEminenceRound(matchState, {
    powerResolvedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(hit.matchState.player.presence, 3);
  assert.deepEqual(hit.bundle.presenceChanges, [
    { side: SIDES.PLAYER, delta: 1, countsAsSpend: false, source: 'khemet_devozione' },
  ]);

  const miss = settleEminenceRound(matchState, {
    powerResolvedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.equal(miss.matchState.player.presence, 2);
  assert.equal(miss.bundle, null);
});

test('Khemet statico: la Risonanza del Nono Sigillo paga solo su Overdrive realmente attivato', () => {
  const { matchState } = playRound({
    playerEminenceId: KHEMET,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'khemet_devozione',
    enemyAbility: 'semaforo_giallo',
  });

  const hit = settleEminenceRound(matchState, {
    powerResolvedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
    activatedTriggerBySide: { [SIDES.PLAYER]: 'overdrive', [SIDES.ENEMY]: null },
  });
  assert.equal(hit.matchState.player.presence, 3);
  assert.equal(hit.bundle.presenceChanges[0].source, 'khemet_rito_overdrive');

  const miss = settleEminenceRound(matchState, {
    activatedTriggerBySide: { [SIDES.PLAYER]: 'imboscata', [SIDES.ENEMY]: null },
  });
  assert.equal(miss.matchState.player.presence, 2);
});

const FIGLI = 'figli_domanda_senza_fine';

function sealUntilGeneral(playerAbility, { presence = 1 } = {}) {
  const base = createEminenceMatchState({
    playerEminenceId: FIGLI,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  if (presence != null) base.player.presence = presence;
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  const player = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility);
  assert.equal(player.ok, true, player.reason);
  const enemy = selectEminenceAbility(player.matchState, SIDES.ENEMY, 'semaforo_giallo');
  assert.equal(enemy.ok, true, enemy.reason);
  matchState = enemy.matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  return matchState;
}

function prepareFigli(playerAbility, { focus = 0, league = 3, presence = 1 } = {}) {
  return prepareEminenceDuel(sealUntilGeneral(playerAbility, { presence }), {
    focusInvestedBySide: { [SIDES.PLAYER]: focus, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: league, [SIDES.ENEMY]: 3 },
  });
}

test('Figli +1: Deriva alza il requisito subito e lo tiene per lo Scontro', () => {
  const prepared = prepareFigli('figli_deriva', { focus: 3, league: 3 });
  assert.equal(prepared.matchState.player.persistent.anchoredThresholdDelta, 1);
  assert.equal(prepared.matchState.player.presence, 2);
});

test('Figli +0: Leggerezza paga solo se il proprio Agente non è Ancorato', () => {
  const miss = prepareFigli('figli_leggerezza', { focus: 3, league: 3 });
  assert.equal(miss.matchState.player.presence, 1);
  assert.equal(miss.bundle.presenceChanges.length, 0);

  const hit = prepareFigli('figli_leggerezza', { focus: 2, league: 3 });
  assert.equal(hit.matchState.player.presence, 2);
  assert.deepEqual(hit.bundle.presenceChanges, [
    { side: SIDES.PLAYER, delta: 1, countsAsSpend: false, source: 'figli_leggerezza' },
  ]);
});

test('Figli: un aumento già persistente vale al controllo del Duello corrente', () => {
  const sealed = sealUntilGeneral('figli_leggerezza');
  sealed.player.persistent.anchoredThresholdDelta = 1;
  const prepared = prepareEminenceDuel(sealed, {
    focusInvestedBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 0 },
    leagueBySide: { [SIDES.PLAYER]: 3, [SIDES.ENEMY]: 3 },
  });
  assert.equal(prepared.matchState.player.presence, 2);
});

test('Figli −4: Risposta forza il trigger solo se l\'Agente è Ancorato', () => {
  const hit = prepareFigli('figli_risposta', { focus: 3, league: 3, presence: 4 });
  assert.equal(hit.bundle.triggerRules.forceSatisfied.length, 1);
  const forced = resolveTriggerState({
    originalTrigger: 'intervention',
    context: {},
    side: SIDES.PLAYER,
    triggerRules: hit.bundle.triggerRules,
  });
  assert.equal(forced.forced, true);
  assert.equal(forced.satisfied, true);

  const miss = prepareFigli('figli_risposta', { focus: 2, league: 3, presence: 4 });
  assert.equal(miss.bundle.triggerRules.forceSatisfied.length, 0);
});

// ------------------------------------------------------------------
// Corte Rossa — Sanguinaccio, il Registro
// ------------------------------------------------------------------

const CORTE = 'corte_rossa';
const CORTE_AGENT = 201;
const CORTE_ENEMY = 301;

function sealCorte(playerAbility, { presence = 1, playerParams = null } = {}) {
  const base = createEminenceMatchState({
    playerEminenceId: CORTE,
    enemyEminenceId: 'patto_grande_semaforo',
  });
  base.player.presence = presence;
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  const player = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility, playerParams);
  assert.equal(player.ok, true, player.reason);
  const enemy = selectEminenceAbility(player.matchState, SIDES.ENEMY, 'semaforo_giallo');
  assert.equal(enemy.ok, true, enemy.reason);
  matchState = enemy.matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  return matchState;
}

function prepareCorte(playerAbility, {
  presence = 1,
  playerParams = null,
  agentIdBySide = { [SIDES.PLAYER]: CORTE_AGENT, [SIDES.ENEMY]: CORTE_ENEMY },
} = {}) {
  return prepareEminenceDuel(sealCorte(playerAbility, { presence, playerParams }), { agentIdBySide });
}

test('Corte +0: Accordo toglie 2 PV all\'avversario, 1 FC temporaneo, e lo Statico paga', () => {
  const { matchState, bundle } = prepareCorte('corte_accordo');
  assert.equal(bundle.temporaryFocus[SIDES.ENEMY], 1);
  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.ENEMY, amount: -2, cause: HP_LOSS_CAUSES.EMINENCE_COST, source: 'corte_accordo' },
  ]);
  assert.equal(matchState.player.presence, 2);
});

test('Corte −2: Salasso costa 3 PV, dà 1 FC proprio e alimenta lo Statico', () => {
  const { matchState, bundle } = prepareCorte('corte_salasso', { presence: 3 });
  assert.equal(bundle.temporaryFocus[SIDES.PLAYER], 1);
  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: -3, cause: HP_LOSS_CAUSES.EMINENCE_COST, source: 'corte_salasso' },
  ]);
  assert.equal(matchState.player.presence, 2);
  assert.equal(matchState.player.presenceSpentThisRound, 2);
});

test('Corte statico: il DAN da sconfitta non paga Presenza', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: CORTE, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );
  const reacted = notifyHpLossEvents(base, [
    { side: SIDES.PLAYER, amount: -4, cause: HP_LOSS_CAUSES.DUEL_DEFEAT_DAMAGE },
  ]);
  assert.equal(reacted.matchState.player.presence, 1);
  assert.equal(reacted.bundle, null);
});

test('Corte −3: Clausola sostituisce il trigger in Debito e al schieramento costa 2 PV', () => {
  const first = prepareCorte('corte_clausola', {
    presence: 3,
    playerParams: { cardId: CORTE_AGENT },
    agentIdBySide: { [SIDES.PLAYER]: 202, [SIDES.ENEMY]: CORTE_ENEMY },
  });
  assert.equal(first.bundle.triggerRules.persistentReplacementsByCardId[CORTE_AGENT].trigger, 'debt');
  assert.equal(first.matchState.player.persistent.triggerReplacementsByCardId[CORTE_AGENT].trigger, 'debt');
  assert.equal(first.bundle.hpDeltas.length, 0);

  const nextBase = beginEminenceRound(first.matchState, { roundNumber: 4 });
  const enemy = selectEminenceAbility(nextBase, SIDES.ENEMY, 'semaforo_giallo');
  const player = selectEminenceAbility(enemy.matchState, SIDES.PLAYER, 'corte_accordo');
  let matchState = advanceToNextRevealGate(player.matchState).matchState;
  matchState = advanceToNextRevealGate(matchState).matchState;
  const deployed = prepareEminenceDuel(matchState, {
    agentIdBySide: { [SIDES.PLAYER]: CORTE_AGENT, [SIDES.ENEMY]: CORTE_ENEMY },
  });
  const debt = resolveTriggerState({
    originalTrigger: 'intervention',
    context: {},
    card: { id: CORTE_AGENT },
    side: SIDES.PLAYER,
    triggerRules: deployed.bundle.triggerRules,
  });
  assert.equal(debt.effectiveTrigger, 'debt');
  assert.equal(debt.satisfied, true);
  assert.ok(deployed.bundle.hpDeltas.some((entry) => (
    entry.side === SIDES.PLAYER && entry.amount === -2 && entry.cause === HP_LOSS_CAUSES.DEBT
  )));
});

test('Corte −4: Debito Eterno dà 2 FC al bersaglio e riscuote la POT a fine Duello', () => {
  const prepared = prepareCorte('corte_debito_eterno', {
    presence: 4,
    playerParams: { cardId: CORTE_ENEMY, targetSide: SIDES.ENEMY },
    agentIdBySide: { [SIDES.PLAYER]: CORTE_AGENT, [SIDES.ENEMY]: CORTE_ENEMY },
  });
  assert.equal(prepared.bundle.temporaryFocus[SIDES.ENEMY], 2);
  assert.equal(prepared.matchState.player.persistent.endMatchDebts.length, 1);
  assert.equal(prepared.matchState.player.persistent.endMatchDebts[0].side, SIDES.ENEMY);
  assert.equal(prepared.matchState.player.persistent.endMatchDebts[0].cardId, CORTE_ENEMY);

  assert.equal(prepared.notices.some((notice) => notice.name === 'Debito Eterno'), false);

  const settled = settleEminenceRound(prepared.matchState, {
    winner: SIDES.PLAYER,
    agentIdBySide: { [SIDES.PLAYER]: CORTE_AGENT, [SIDES.ENEMY]: CORTE_ENEMY },
    finalPowerByCardId: { [CORTE_ENEMY]: 5 },
  });
  assert.deepEqual(settled.bundle.hpDeltas, [
    { side: SIDES.ENEMY, amount: -5, cause: HP_LOSS_CAUSES.END_MATCH_DEBT, source: 'corte_debito_eterno' },
  ]);
  assert.equal(settled.matchState.player.presence, 1);
  assert.deepEqual(settled.matchState.player.persistent.endMatchDebts, []);
  const debtNotice = settled.notices.find((notice) => notice.name === 'Debito Eterno');
  assert.equal(debtNotice?.kind, 'effect');
  assert.equal(debtNotice?.phaseDetail, 'Dopo il Duello');
  assert.equal(debtNotice?.side, SIDES.PLAYER);
  assert.equal(debtNotice?.sourceName, 'Sanguinaccio, il Registro');

  const closed = settleEminenceMatch(settled.matchState);
  assert.equal(closed.bundle, null);
});

// ------------------------------------------------------------------
// Calibri — Il Comando dei Quattro Fronti
// ------------------------------------------------------------------

const CALIBRI = 'calibri_quattro_fronti';

test('Calibri statico: +1 Presenza solo se perdi e il DAN nemico finale è ≤ 2', () => {
  const base = beginEminenceRound(
    createEminenceMatchState({ playerEminenceId: CALIBRI, enemyEminenceId: 'patto_grande_semaforo' }),
    { roundNumber: 3 },
  );

  const hit = settleEminenceRound(base, {
    winner: SIDES.ENEMY,
    finalDamageBySide: { [SIDES.PLAYER]: 5, [SIDES.ENEMY]: 2 },
  });
  assert.equal(hit.matchState.player.presence, 2);

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

test('Calibri +0: Guerra d\'Attrito dà 1 FC e alza il costo solo se vinci', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: CALIBRI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'calibri_guerra_attrito',
    enemyAbility: 'semaforo_giallo',
  });

  assert.equal(bundle.temporaryFocus[SIDES.PLAYER], 1);
  assert.equal(matchState.player.presence, 1);
  assert.equal(matchState.player.presenceSpentThisRound, 0);

  const afterWin = settleEminenceRound(matchState, { winner: SIDES.PLAYER });
  assert.equal(afterWin.matchState.player.persistent.abilityPresenceDeltas.calibri_guerra_attrito, -1);

  const afterLoss = settleEminenceRound(matchState, { winner: SIDES.ENEMY });
  assert.deepEqual(afterLoss.matchState.player.persistent.abilityPresenceDeltas, {});

  const next = beginEminenceRound(afterWin.matchState, { roundNumber: 4 });
  const enemy = selectEminenceAbility(next, SIDES.ENEMY, 'semaforo_giallo');
  const replay = selectEminenceAbility(enemy.matchState, SIDES.PLAYER, 'calibri_guerra_attrito');
  assert.equal(replay.ok, true);
  assert.equal(replay.matchState.player.committedPresenceCost, 1);
});

test('Calibri −2: Contenimento registra la conversione DAN e +2 Presenza in vittoria', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: CALIBRI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'calibri_contenimento',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 3 },
  });

  assert.equal(bundle.statConverts.length, 1);
  assert.equal(bundle.statConverts[0].stat, 'damage');
  assert.equal(bundle.statConverts[0].dest, 'DIRECT_DAMAGE');
  assert.equal(bundle.statConverts[0].zeroStat, true);
  assert.equal(matchState.player.presence, 1);

  const win = settleEminenceRound(matchState, { winner: SIDES.PLAYER });
  assert.equal(win.matchState.player.presence, 3);

  const lose = settleEminenceRound(matchState, { winner: SIDES.ENEMY });
  assert.equal(lose.matchState.player.presence, 1);
});

test('Calibri −4: Terra Bruciata arma la distruzione Campo solo in sconfitta', () => {
  const { bundle } = playRound({
    playerEminenceId: CALIBRI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'calibri_terra_bruciata',
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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

test('Orathai +0: Tacet paga +2 solo se nessuno dei due soddisfa il requisito', () => {
  const { matchState } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_tacet',
    enemyAbility: 'semaforo_giallo',
  });
  assert.equal(matchState.player.presence, 1);

  const hit = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    activationSatisfiedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
  });
  assert.equal(hit.matchState.player.presence, 3);

  const miss = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    activationSatisfiedBySide: { [SIDES.PLAYER]: true, [SIDES.ENEMY]: false },
  });
  assert.equal(miss.matchState.player.presence, 1);
});

test('Orathai −2: Contrappunto deposita SYNC XOR in FORCE_BOTH', () => {
  const { bundle } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_contrappunto',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 3 },
  });
  assert.equal(bundle.triggerRules.xorSync.length, 1);
  assert.equal(bundle.triggerRules.xorSync[0].mode, 'FORCE_BOTH');
});

test('Orathai −3: Silenzio deposita SYNC XOR in FORBID_BOTH', () => {
  const { bundle } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_silenzio',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 3 },
  });
  assert.equal(bundle.triggerRules.xorSync.length, 1);
  assert.equal(bundle.triggerRules.xorSync[0].mode, 'FORBID_BOTH');
});

test('Orathai: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: ORATHAI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'orathai_tacet',
    enemyAbility: 'semaforo_giallo',
  });
  const settled = settleEminenceRound(matchState, {
    winner: SIDES.PLAYER,
    activationSatisfiedBySide: { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
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

test('Enclave −3: Ascensione deposita SATISFY a Leghe uguali e ARM_VA_TIE_WIN', () => {
  const { bundle } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_ascensione',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 3 },
  });
  assert.equal(bundle.triggerRules.equalLeagueSatisfies.length, 1);
  assert.deepEqual(bundle.triggerRules.equalLeagueSatisfies[0].triggers, ['sfida', 'sopraffare']);
  assert.deepEqual(bundle.vaTieWinnerSides, [SIDES.PLAYER]);
});

test('Enclave: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: ENCLAVE,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'enclave_rinuncia',
    enemyAbility: 'semaforo_giallo',
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
  const e = selectEminenceAbility(p.matchState, SIDES.ENEMY, 'semaforo_giallo');
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
    enemyAbility: 'semaforo_giallo',
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
    enemyAbility: 'semaforo_giallo',
    presence: { player: 2 },
  });
  assert.equal(matchState.player.presence, 0);
  assert.equal(bundle.armyBonusState[SIDES.PLAYER].suppressed, true);
  assert.deepEqual(bundle.toxinApplications, [
    { side: SIDES.ENEMY, value: 1, minHealth: 10, source: 'ratti_veleno' },
  ]);
});

test('Ratti −3: Conquista Forzata forza Conquista sul proprio lato', () => {
  const { bundle } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_conquista_forzata',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 3 },
  });
  assert.equal(bundle.triggerRules.forceSatisfied.length, 1);
  assert.deepEqual(bundle.triggerRules.forceSatisfied[0].triggers, ['conquest']);
  assert.equal(bundle.triggerRules.forceSatisfied[0].scope, TRIGGER_SCOPES.OWN);
});

test('Ratti: Fine Scontro non ribatte i delta già risolti', () => {
  const { matchState } = playRound({
    playerEminenceId: RATTI,
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'ratti_sussurro',
    enemyAbility: 'semaforo_giallo',
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
