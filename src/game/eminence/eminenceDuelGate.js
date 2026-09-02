// ============================================
// EMINENZE — Orchestrazione del round attorno al Duello
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §2.5, §3.7
// ============================================
//
// Logica pura: React si limita a passare lo stato corrente e a riporre quello restituito.
// Tenerla fuori dagli hook è ciò che permette di verificare la sequenza dei checkpoint senza
// montare un componente.

import {
  EFFECT_TIMINGS,
  REVEAL_GATES,
  SIDES,
  CHOICE_PARAMS_TIMING,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  HP_LOSS_CAUSES,
  PARAM_SOURCES,
} from './eminenceConstants.js';
import {
  areSelectionsComplete,
  beginEminenceRound,
  collectPendingEffects,
  completeGate,
  getNextGate,
  isGateCompleted,
  mustChooseThisRound,
  selectEminenceAbility,
  setEminenceAbilityParams,
} from './eminenceRound.js';
import { applyEminenceSegments, createEffectBundle } from './primitiveHandlers.js';
import { resolveTriggerState } from './triggerRulesOverlay.js';
import { changePresence } from './presence.js';
import { isEminenceSubsystemEnabled, getLegalAbilityIds } from './eminenceState.js';
import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { ALL_AGENTS } from '../../data/cards.js';
import { noticesFromRevealEvents, noticesFromAppliedEffects, noticesFromDeployedMarkResolution } from './eminenceAnnouncements.js';
import { appendSlotCurse, collectSlotCurses } from './slotCurses.js';
import { snapshotAnchoredBySide } from './anchored.js';

/** Costo di schieramento legato al trigger effettivo, non a una singola Eminenza. */
const DEPLOY_TRIGGER_HP_COSTS = {
  debt: { amount: 2, cause: HP_LOSS_CAUSES.DEBT },
};

const BOTH_SIDES = [SIDES.PLAYER, SIDES.ENEMY];

/** Checkpoint che maturano prima che il Duello produca un esito. */
const PRE_DUEL_TIMINGS = [
  EFFECT_TIMINGS.BEFORE_FIELD_RESOLUTION,
  EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
  EFFECT_TIMINGS.BEFORE_POWER_RESOLUTION,
];

/** Checkpoint che maturano dopo la determinazione del vincitore. */
const POST_DUEL_TIMINGS = [
  EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
  EFFECT_TIMINGS.BEFORE_CONQUEST,
  EFFECT_TIMINGS.POST_BATTLE,
  EFFECT_TIMINGS.END_ROUND,
];

function collectTimings(matchState, timings, initiativeSide, context = null) {
  let state = matchState;
  const queue = [];
  const skipped = [];

  for (const timing of timings) {
    const collected = collectPendingEffects(state, timing, { initiativeSide, context });
    state = collected.matchState;
    queue.push(...collected.queue);
    skipped.push(...(collected.skipped || []));
  }

  return { matchState: state, queue, skipped };
}

/**
 * Apre il round e incassa i checkpoint che precedono la prima decisione.
 *
 * È qui che vive lo Statico capace di cambiare le premesse del round — la sostituzione del
 * Campo su tutte le altre. Deve accadere prima della scelta del Campo, altrimenti il
 * giocatore sceglierebbe uno slot e ne troverebbe un altro al momento di combattere.
 *
 * Il bundle restituito non è quello del Duello: contiene solo effetti di apertura, e il
 * chiamante è tenuto a consumarne le `fieldOperations` prima di mostrare il tabellone.
 *
 * @returns {{ matchState: object, bundle: object|null }}
 */
export function openEminenceRound(matchState, { roundNumber = 1, initiativeSide = SIDES.PLAYER } = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) return { matchState, bundle: null };

  const opened = beginEminenceRound(matchState, { roundNumber });
  const collected = collectTimings(opened, [EFFECT_TIMINGS.ROUND_START], initiativeSide);
  const bundle = collected.queue.length ? applyEminenceSegments(collected.queue) : null;
  const applied = applyBundleAndReactions(collected.matchState, bundle, { initiativeSide });

  return {
    // Il timbro rende l'apertura riconoscibile dallo stato stesso. Serve al lato React, dove
    // il round avanza in un batch e l'apertura in quello successivo: senza un marcatore
    // servirebbe una ref esterna, che una nuova partita non azzererebbe.
    matchState: { ...applied.matchState, roundOpenedAt: roundNumber },
    bundle,
    appliedEffects: collected.queue,
    notices: applied.notices,
  };
}

/** Vero finché il round corrente non è stato aperto sullo stato Eminenza. */
export function needsEminenceRoundOpen(matchState, roundNumber) {
  if (!isEminenceSubsystemEnabled(matchState)) return false;
  return matchState.roundOpenedAt !== roundNumber;
}

/**
 * Registra le scelte che le regole non lasciano libere.
 *
 * Non esiste un Pass volontario (§2.2): un lato con una sola opzione legale non sta
 * decidendo nulla, quindi chiedergliela sarebbe rumore. Resta una decisione — e non va
 * sigillata da sola — se quell'unica abilità ha ancora parametri `AT_SELECTION` da fissare.
 *
 * Con più opzioni legali questa funzione non tocca nulla e lascia la decisione a chi di dovere.
 */
export function autoSelectForcedChoices(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;

  let state = matchState;
  for (const side of BOTH_SIDES) {
    if (!mustChooseThisRound(state, side)) continue;
    if (state[side].selectedAbilityId) continue;

    const legal = getLegalAbilityIds(state[side].eminenceId, state[side].selectionCheckpointPresence);
    if (legal.length !== 1) continue;

    const ability = getEminenceAbility(state[side].eminenceId, legal[0]);
    if (
      ability?.choiceParamsTiming === CHOICE_PARAMS_TIMING.AT_SELECTION
      && ability.paramsSchema
    ) {
      continue;
    }

    const attempt = selectEminenceAbility(state, side, legal[0]);
    if (attempt.ok) state = attempt.matchState;
  }

  return state;
}

/**
 * Sigilla una scelta per un lato che non sta decidendo — IA, tutorial, o qualunque
 * chiamante che non espone un punto di scelta.
 *
 * Non è una strategia: prende la prima abilità legale. Serve a non lasciare il round
 * bloccato su `SELECTIONS_INCOMPLETE` quando l'altro lato non ha una UI. La vera IA
 * sostituirà questa funzione senza toccare il resto del flusso.
 */
export function autoSelectFirstLegalAbility(matchState, side) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;
  if (!mustChooseThisRound(matchState, side)) return matchState;
  if (matchState[side].selectedAbilityId) return matchState;

  const legal = getLegalAbilityIds(
    matchState[side].eminenceId,
    matchState[side].selectionCheckpointPresence
  );
  if (!legal.length) return matchState;

  const attempt = selectEminenceAbility(matchState, side, legal[0]);
  return attempt.ok ? attempt.matchState : matchState;
}

function persistentMarkKey(mark) {
  return `${mark}CardIds`;
}

function applyMarksToState(matchState, marks) {
  let state = matchState;

  for (const mark of marks || []) {
    const side = mark.side;
    if (!side || !state[side]) continue;

    const key = persistentMarkKey(mark.mark);
    const persistent = state[side].persistent || {};
    const current = Array.isArray(persistent[key]) ? persistent[key] : [];
    let next = current;

    if (mark.consume) {
      const remove = new Set(mark.cardIds || []);
      next = current.filter((id) => !remove.has(id));
    } else {
      next = [...current];
      for (const id of mark.cardIds || []) {
        if (id != null && !next.includes(id)) next.push(id);
      }
    }

    if (next === current) continue;

    state = {
      ...state,
      [side]: {
        ...state[side],
        persistent: { ...persistent, [key]: next },
      },
    };
  }

  return state;
}

/**
 * Riversa nel modello di stato ciò che il bundle ha prodotto e che il risolutore del Duello
 * non può applicare da solo: Presenza, blocchi e marker persistenti.
 *
 * I delta di Presenza generati da un effetto non sono una spesa e non alimentano
 * Manifestazione né Fervore; `changePresence` lo sa già ed è l'unica via di modifica.
 */
function applyBundleToState(matchState, bundle) {
  if (!bundle) return matchState;
  let state = matchState;

  for (const change of bundle.presenceChanges || []) {
    const { state: paid } = changePresence(state[change.side], change.delta, {
      reason: `effect:${change.source ?? 'eminence'}`,
      countsAsSpend: Boolean(change.countsAsSpend),
      source: change.source ?? null,
      roundNumber: state.roundNumber ?? null,
    });
    state = { ...state, [change.side]: paid };
  }

  for (const block of bundle.blockedEminences || []) {
    state = { ...state, [block.side]: { ...state[block.side], blockedNextRound: true } };
  }

  return persistEndMatchDebts(
    persistTriggerReplacements(
      applySlotCursesToState(
        applyAnchoredThresholdToState(applyMarksToState(state, bundle.marks), bundle.anchoredThresholdChanges),
        bundle.slotModifiers,
      ),
      bundle.triggerRules?.persistentReplacementsByCardId,
    ),
    bundle.endMatchDebts,
  );
}

function persistTriggerReplacements(matchState, replacements) {
  if (!replacements || !Object.keys(replacements).length) return matchState;
  let state = matchState;
  for (const [cardId, entry] of Object.entries(replacements)) {
    const side = entry?.ownerSide;
    if (!side || !state[side]) continue;
    const persistent = state[side].persistent || {};
    const nextReplacements = { ...(persistent.triggerReplacementsByCardId || {}), [cardId]: entry };
    const nextDebito = { ...(persistent.debitoByCardId || {}) };
    if (entry.trigger === 'debt') nextDebito[cardId] = { trigger: entry.trigger, source: entry.source };
    state = {
      ...state,
      [side]: {
        ...state[side],
        persistent: {
          ...persistent,
          triggerReplacementsByCardId: nextReplacements,
          debitoByCardId: nextDebito,
        },
      },
    };
  }
  return state;
}

function persistEndMatchDebts(matchState, debts) {
  if (!debts?.length) return matchState;
  let state = matchState;
  for (const debt of debts) {
    const side = debt.ownerSide || debt.side;
    if (!side || !state[side]) continue;
    const persistent = state[side].persistent || {};
    state = {
      ...state,
      [side]: {
        ...state[side],
        persistent: {
          ...persistent,
          endMatchDebts: [...(persistent.endMatchDebts || []), { ...debt }],
        },
      },
    };
  }
  return state;
}

function collectedReplacementsFromState(matchState) {
  const merged = {};
  for (const side of BOTH_SIDES) {
    Object.assign(merged, matchState[side]?.persistent?.triggerReplacementsByCardId || {});
  }
  return merged;
}

function mergePersistentReplacements(bundle, matchState) {
  if (!bundle) return bundle;
  const stored = collectedReplacementsFromState(matchState);
  if (!Object.keys(stored).length) return bundle;
  return {
    ...bundle,
    triggerRules: {
      ...bundle.triggerRules,
      persistentReplacementsByCardId: {
        ...stored,
        ...(bundle.triggerRules?.persistentReplacementsByCardId || {}),
      },
    },
  };
}

function applyOnDeployTriggerCosts(bundle, { agentIdBySide } = {}) {
  if (!bundle || !agentIdBySide) return bundle;
  for (const side of BOTH_SIDES) {
    const cardId = agentIdBySide[side];
    if (cardId == null) continue;
    const card = ALL_AGENTS.find((agent) => agent.id === cardId);
    const resolved = resolveTriggerState({
      originalTrigger: card?.ability?.trigger ?? null,
      card: { id: cardId },
      side,
      triggerRules: bundle.triggerRules,
      context: {},
    });
    const cost = DEPLOY_TRIGGER_HP_COSTS[resolved.effectiveTrigger];
    if (!cost) continue;
    const already = (bundle.hpDeltas || []).some(
      (entry) => entry.side === side && entry.cause === cost.cause,
    );
    if (already) continue;
    bundle.hpDeltas.push({
      side,
      amount: -Math.abs(cost.amount),
      cause: cost.cause,
      source: resolved.source,
    });
  }
  return bundle;
}

function qualifyingHpLossEvents(hpDeltas) {
  return (hpDeltas || []).filter(
    (entry) => (entry.amount || 0) < 0 && entry.cause !== HP_LOSS_CAUSES.DUEL_DEFEAT_DAMAGE,
  );
}

/**
 * Reazioni agli eventi di perdita PV. Uno Statico ripetibile (es. +1 Presenza per evento)
 * resta armato e può scattare più volte nello stesso round.
 */
export function notifyHpLossEvents(matchState, hpDeltas, { initiativeSide = SIDES.PLAYER } = {}) {
  const events = qualifyingHpLossEvents(hpDeltas);
  if (!events.length || !isEminenceSubsystemEnabled(matchState)) {
    return { matchState, bundle: null, queue: [], notices: [] };
  }

  let state = matchState;
  const reactionBundle = createEffectBundle();
  const queue = [];
  for (const event of events) {
    const collected = collectPendingEffects(state, EFFECT_TIMINGS.ON_HP_LOSS, {
      initiativeSide,
      context: { hpLossCause: event.cause, hpLossSide: event.side },
    });
    state = collected.matchState;
    if (!collected.queue.length) continue;
    queue.push(...collected.queue);
    applyEminenceSegments(collected.queue, reactionBundle);
  }

  if (!queue.length) return { matchState: state, bundle: null, queue: [], notices: [] };

  return {
    matchState: applyBundleToState(state, reactionBundle),
    bundle: reactionBundle,
    queue,
    notices: noticesFromAppliedEffects(state, queue),
  };
}

function applyBundleAndReactions(matchState, bundle, { notices = [], initiativeSide = SIDES.PLAYER } = {}) {
  const persisted = applyBundleToState(matchState, bundle);
  const reacted = notifyHpLossEvents(persisted, bundle?.hpDeltas, { initiativeSide });
  return {
    matchState: reacted.matchState,
    notices: [...notices, ...(reacted.notices || [])],
    reactionBundle: reacted.bundle,
  };
}

function applyAnchoredThresholdToState(matchState, changes) {
  let state = matchState;
  for (const change of changes || []) {
    const side = change.side;
    if (!side || !state[side]) continue;
    const persistent = state[side].persistent || {};
    state = {
      ...state,
      [side]: {
        ...state[side],
        persistent: {
          ...persistent,
          anchoredThresholdDelta: (persistent.anchoredThresholdDelta || 0) + (change.delta || 0),
        },
      },
    };
  }
  return state;
}

function pendingAnchoredThresholdBySide(matchState, queue) {
  const deltas = {};
  for (const side of BOTH_SIDES) {
    deltas[side] = matchState?.[side]?.persistent?.anchoredThresholdDelta || 0;
  }
  for (const entry of queue || []) {
    const segment = entry.segment;
    if (segment?.primitive !== P.MODIFY_ANCHORED_THRESHOLD) continue;
    const sides = segment.target === T.OPPONENT
      ? [entry.ownerSide === SIDES.PLAYER ? SIDES.ENEMY : SIDES.PLAYER]
      : segment.target === T.BOTH || segment.target === T.GLOBAL
        ? BOTH_SIDES
        : [entry.ownerSide];
    for (const side of sides) {
      deltas[side] = (deltas[side] || 0) + (segment.delta || 0);
    }
  }
  return deltas;
}

function applySlotCursesToState(matchState, slotModifiers) {
  let state = matchState;
  for (const curse of slotModifiers || []) {
    if (curse.persistent === false) continue;
    if (curse.slot == null) continue;
    const side = curse.ownerSide;
    if (!side || !state[side]) continue;
    const persistent = state[side].persistent || {};
    state = {
      ...state,
      [side]: {
        ...state[side],
        persistent: {
          ...persistent,
          slotCurses: appendSlotCurse(persistent.slotCurses, curse.slot, curse),
        },
      },
    };
  }
  return state;
}

/**
 * Apre il prossimo gate della sequenza, paga i reveal e applica gli AFTER_REVEAL.
 *
 * Serve al Duello vivo: PRE_FIELD e PRE_AGENT devono diventare pubblici *prima* della
 * decisione corrispondente, e GENERAL dopo il lock Agenti/FC, prima dello scontro.
 * Se FC e Lega sono noti, i controlli già decidibili (Ancorato) parlano qui come esito,
 * non come formula. `prepareEminenceDuel` resta idempotente se il gate è già stato aperto.
 *
 * @returns {{ matchState: object, events: object[], notices: object[], gate: string|null, bundle: object|null, blocked: string|null }}
 */
function anchoredEvalContextBySide(matchState, {
  focusInvestedBySide = null,
  leagueBySide = null,
  resolutionQueue = [],
} = {}) {
  if (!focusInvestedBySide || !leagueBySide) return null;
  const anchoredBySide = snapshotAnchoredBySide(matchState, {
    focusInvestedBySide,
    leagueBySide,
    thresholdDeltaBySide: pendingAnchoredThresholdBySide(matchState, resolutionQueue),
  });
  return {
    [SIDES.PLAYER]: { ownAnchored: Boolean(anchoredBySide[SIDES.PLAYER]) },
    [SIDES.ENEMY]: { ownAnchored: Boolean(anchoredBySide[SIDES.ENEMY]) },
  };
}

export function advanceToNextRevealGate(matchState, {
  initiativeSide = SIDES.PLAYER,
  agentIdBySide = null,
  announceDeployedMarks = false,
  focusInvestedBySide = null,
  leagueBySide = null,
} = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, events: [], notices: [], gate: null, bundle: null, blocked: null };
  }
  if (!areSelectionsComplete(matchState)) {
    return {
      matchState,
      events: [],
      notices: [],
      gate: null,
      bundle: null,
      blocked: 'SELECTIONS_INCOMPLETE',
    };
  }

  const gate = getNextGate(matchState.gateProgress);
  if (!gate) {
    return { matchState, events: [], notices: [], gate: null, bundle: null, blocked: null };
  }

  const opened = completeGate(matchState, gate, { initiativeSide });
  const rawBundle = opened.resolutionQueue.length
    ? applyEminenceSegments(opened.resolutionQueue)
    : null;
  const bundle = mergePersistentReplacements(rawBundle, opened.matchState);
  const applied = applyBundleAndReactions(opened.matchState, bundle, { initiativeSide });
  const nextState = applied.matchState;
  const revealedNow = new Set(
    opened.events.filter((event) => event?.type === 'REVEAL').map((event) => event.abilityId),
  );
  const agentsKnown = Boolean(agentIdBySide?.[SIDES.PLAYER] && agentIdBySide?.[SIDES.ENEMY]);
  const markNotices = agentsKnown && (announceDeployedMarks || revealedNow.size)
    ? noticesFromDeployedMarkResolution(nextState, {
      agentIdBySide,
      onlyAbilityIds: announceDeployedMarks ? null : revealedNow,
    })
    : [];
  const evalContextBySide = anchoredEvalContextBySide(nextState, {
    focusInvestedBySide,
    leagueBySide,
  });

  return {
    matchState: nextState,
    events: opened.events,
    notices: [
      ...noticesFromRevealEvents(opened.events, { evalContextBySide }),
      ...markNotices,
      ...applied.notices,
    ],
    gate,
    bundle,
    blocked: opened.blocked ?? null,
  };
}

/** Primitive di reveal che devono arrivare al Duello anche se il gate GENERAL è già aperto. */
const DUEL_REPLAY_PRIMITIVES = new Set([
  P.LOSE_HP,
  P.HEAL_HP,
  P.GRANT_TEMPORARY_FOCUS,
  P.MODIFY_STAT,
  P.MODIFY_LEAGUE,
  P.IGNORE_FIELD,
  P.SET_ARMY_BONUS_STATE,
]);

function replayOpenedGeneralCombat(matchState, agentIdBySide) {
  const queue = [];
  for (const side of BOTH_SIDES) {
    const current = matchState[side];
    if (!current?.revealedAbilityId || current.revealGateReached !== REVEAL_GATES.GENERAL) continue;
    const ability = getEminenceAbility(current.eminenceId, current.revealedAbilityId);
    for (const segment of ability?.segments || []) {
      if (segment.timing !== EFFECT_TIMINGS.AFTER_REVEAL) continue;
      if (!DUEL_REPLAY_PRIMITIVES.has(segment.primitive)) continue;
      queue.push({
        abilityId: ability.id,
        ownerSide: side,
        segment,
        params: current.selectedParams,
      });
    }
  }
  if (!queue.length) return null;
  return applyEminenceSegments(queue, null, { agentIdBySide });
}

function addStatDeltas(left, right) {
  return {
    power: (left?.power || 0) + (right?.power || 0),
    damage: (left?.damage || 0) + (right?.damage || 0),
    assaultValue: (left?.assaultValue || 0) + (right?.assaultValue || 0),
    league: (left?.league || 0) + (right?.league || 0),
  };
}

function mergeDuelReplay(bundle, replay) {
  if (!replay) return bundle;
  const target = bundle || createEffectBundle();
  return {
    ...target,
    hpDeltas: [...(target.hpDeltas || []), ...(replay.hpDeltas || [])],
    temporaryFocus: {
      [SIDES.PLAYER]: (target.temporaryFocus?.[SIDES.PLAYER] || 0) + (replay.temporaryFocus?.[SIDES.PLAYER] || 0),
      [SIDES.ENEMY]: (target.temporaryFocus?.[SIDES.ENEMY] || 0) + (replay.temporaryFocus?.[SIDES.ENEMY] || 0),
    },
    statDeltas: {
      [SIDES.PLAYER]: addStatDeltas(target.statDeltas?.[SIDES.PLAYER], replay.statDeltas?.[SIDES.PLAYER]),
      [SIDES.ENEMY]: addStatDeltas(target.statDeltas?.[SIDES.ENEMY], replay.statDeltas?.[SIDES.ENEMY]),
    },
    ignoreFieldSides: [...new Set([...(target.ignoreFieldSides || []), ...(replay.ignoreFieldSides || [])])],
    armyBonusState: { ...(replay.armyBonusState || {}), ...(target.armyBonusState || {}) },
  };
}

/**
 * Porta il round fino alla soglia del Duello e produce il bundle di effetti dovuti.
 *
 * Il gate GENERAL si apre qui perché è l'ultimo istante in cui entrambe le scelte sono
 * ancora segrete: dopo, il Duello ha già bisogno di conoscerle.
 *
 * Lo stato restituito è quello su cui va campionato lo snapshot di Presenza: i delta
 * Pre-Trigger sono già dentro, come richiede §8.1.
 *
 * @returns {{ matchState: object, bundle: object|null, events: object[], notices: object[], blocked: string|null }}
 */
export function prepareEminenceDuel(matchState, {
  initiativeSide = SIDES.PLAYER,
  agentIdBySide = null,
  currentFieldIndex = null,
  focusInvestedBySide = null,
  leagueBySide = null,
} = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, bundle: null, events: [], notices: [], blocked: null };
  }

  const withChoices = autoSelectForcedChoices(matchState);
  if (!areSelectionsComplete(withChoices)) {
    return { matchState: withChoices, bundle: null, events: [], notices: [], blocked: 'SELECTIONS_INCOMPLETE' };
  }

  const filled = fillMissingConfirmedAgentParams(withChoices, agentIdBySide);
  if (sideMissingConfirmedAgentParam(filled, SIDES.PLAYER)) {
    return {
      matchState: filled,
      bundle: null,
      events: [],
      notices: [],
      blocked: 'REVEAL_PARAMS_INCOMPLETE',
    };
  }
  const generalWasAlreadyOpen = isGateCompleted(filled.gateProgress, REVEAL_GATES.GENERAL);
  const opened = completeGate(filled, REVEAL_GATES.GENERAL, { initiativeSide });
  const anchoredBySide = snapshotAnchoredBySide(opened.matchState, {
    focusInvestedBySide: focusInvestedBySide || {},
    leagueBySide: leagueBySide || {},
    thresholdDeltaBySide: pendingAnchoredThresholdBySide(opened.matchState, opened.resolutionQueue),
  });
  const collected = collectTimings(opened.matchState, PRE_DUEL_TIMINGS, initiativeSide, {
    agentIdBySide,
    anchoredBySide,
  });
  let bundle = applyEminenceSegments([...opened.resolutionQueue, ...collected.queue], null, { agentIdBySide });
  if (generalWasAlreadyOpen) {
    bundle = mergeDuelReplay(bundle, replayOpenedGeneralCombat(filled, agentIdBySide));
  }
  bundle = mergePersistentReplacements(bundle, collected.matchState);
  applyOnDeployTriggerCosts(bundle, { agentIdBySide });
  const withCurses = attachPersistentSlotCurses(bundle, collected.matchState, currentFieldIndex);
  const evalContextBySide = {
    [SIDES.PLAYER]: { ownAnchored: Boolean(anchoredBySide[SIDES.PLAYER]) },
    [SIDES.ENEMY]: { ownAnchored: Boolean(anchoredBySide[SIDES.ENEMY]) },
  };
  const applied = applyBundleAndReactions(collected.matchState, withCurses, { initiativeSide });

  return {
    matchState: applied.matchState,
    bundle: withCurses,
    events: opened.events,
    notices: generalWasAlreadyOpen
      ? [...applied.notices]
      : [
        ...noticesFromRevealEvents(opened.events, { evalContextBySide }),
        ...noticesFromAppliedEffects(collected.matchState, collected.queue, {
          skipped: collected.skipped,
          evalContextBySide,
        }),
        ...applied.notices,
      ],
    blocked: null,
  };
}

function abilityNeedsConfirmedAgent(ability) {
  return Object.values(ability?.paramsSchema || {}).some(
    (spec) => spec && spec.source === PARAM_SOURCES.CONFIRMED_AGENTS,
  );
}

function sideMissingConfirmedAgentParam(matchState, side) {
  const current = matchState?.[side];
  if (!current?.selectedAbilityId || current.revealedAbilityId) return false;
  const ability = getEminenceAbility(current.eminenceId, current.selectedAbilityId);
  if (!abilityNeedsConfirmedAgent(ability)) return false;
  return current.selectedParams?.cardId == null;
}

function fillMissingConfirmedAgentParams(matchState, agentIdBySide) {
  if (!agentIdBySide) return matchState;
  let state = matchState;
  for (const side of BOTH_SIDES) {
    if (side === SIDES.PLAYER) continue;
    const current = state[side];
    if (!current?.selectedAbilityId || current.revealedAbilityId) continue;
    if (current.selectedParams?.cardId != null) continue;
    const ability = getEminenceAbility(current.eminenceId, current.selectedAbilityId);
    if (!abilityNeedsConfirmedAgent(ability)) continue;
    const cardId = agentIdBySide[side] ?? agentIdBySide[SIDES.ENEMY];
    if (cardId == null) continue;
    const filled = setEminenceAbilityParams(state, side, { cardId, targetSide: side });
    if (filled.ok) state = filled.matchState;
  }
  return state;
}

function attachPersistentSlotCurses(bundle, matchState, slot) {
  const curses = collectSlotCurses(matchState, slot);
  if (!curses.length) return bundle;
  if (!bundle) {
    const created = createEffectBundle();
    created.slotModifiers = curses;
    return created;
  }
  return {
    ...bundle,
    slotModifiers: [...curses, ...(bundle.slotModifiers || [])],
  };
}

/**
 * Chiude il round: incassa i checkpoint successivi alla determinazione del vincitore.
 *
 * `winner` (`player` | `enemy` | `draw`) è il termine da cui i segmenti post-Duello
 * derivano l'esito relativo al lato che li possiede. Va passato quando almeno un
 * segmento condizionale dipende dall'esito; ometterlo fa fallire rumorosamente
 * quelle condizioni, non le tratta come false.
 *
 * @returns {{ matchState: object, bundle: object|null, notices: object[] }}
 */
export function settleEminenceRound(matchState, {
  initiativeSide = SIDES.PLAYER,
  winner,
  agentIdBySide = null,
  aliasUsedBySide = null,
  powerResolvedBySide = null,
  activatedTriggerBySide = null,
  finalPowerByCardId = null,
  finalPowerBySide = null,
} = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, bundle: null, notices: [] };
  }

  const recorded = recordEndMatchDebtAmounts(matchState, { finalPowerByCardId, finalPowerBySide, agentIdBySide });
  const context = {
    ...(winner === undefined ? {} : { winner }),
    agentIdBySide: agentIdBySide || {},
    aliasUsedBySide: aliasUsedBySide || { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
    powerResolvedBySide: powerResolvedBySide || { [SIDES.PLAYER]: false, [SIDES.ENEMY]: false },
    activatedTriggerBySide: activatedTriggerBySide || { [SIDES.PLAYER]: null, [SIDES.ENEMY]: null },
  };
  const collected = collectTimings(recorded, POST_DUEL_TIMINGS, initiativeSide, context);
  const bundle = collected.queue.length
    ? applyEminenceSegments(collected.queue, null, { agentIdBySide: context.agentIdBySide })
    : null;
  const applied = applyBundleAndReactions(collected.matchState, bundle, { initiativeSide });
  return {
    matchState: applied.matchState,
    bundle,
    notices: [
      ...noticesFromAppliedEffects(collected.matchState, collected.queue, {
        skipped: collected.skipped,
      }),
      ...applied.notices,
    ],
  };
}

function recordEndMatchDebtAmounts(matchState, { finalPowerByCardId, finalPowerBySide, agentIdBySide } = {}) {
  let state = matchState;
  for (const side of BOTH_SIDES) {
    const current = state[side];
    const debts = current?.persistent?.endMatchDebts;
    if (!debts?.length) continue;
    const nextDebts = debts.map((debt) => {
      if (debt.amount != null) return debt;
      let amount = null;
      if (debt.cardId != null && finalPowerByCardId?.[debt.cardId] != null) {
        amount = finalPowerByCardId[debt.cardId];
      } else if (debt.side && finalPowerBySide?.[debt.side] != null) {
        amount = finalPowerBySide[debt.side];
      } else if (debt.cardId != null && agentIdBySide) {
        if (agentIdBySide[SIDES.PLAYER] === debt.cardId && finalPowerBySide?.[SIDES.PLAYER] != null) {
          amount = finalPowerBySide[SIDES.PLAYER];
        }
        if (agentIdBySide[SIDES.ENEMY] === debt.cardId && finalPowerBySide?.[SIDES.ENEMY] != null) {
          amount = finalPowerBySide[SIDES.ENEMY];
        }
      }
      return amount == null ? debt : { ...debt, amount };
    });
    state = {
      ...state,
      [side]: {
        ...current,
        persistent: { ...current.persistent, endMatchDebts: nextDebts },
      },
    };
  }
  return state;
}

function collectStoredEndMatchDebts(matchState) {
  const debts = [];
  for (const side of BOTH_SIDES) {
    for (const debt of matchState[side]?.persistent?.endMatchDebts || []) {
      debts.push(debt);
    }
  }
  return debts;
}

function clearEndMatchDebts(matchState) {
  let state = matchState;
  for (const side of BOTH_SIDES) {
    const current = state[side];
    if (!current?.persistent?.endMatchDebts?.length) continue;
    state = {
      ...state,
      [side]: {
        ...current,
        persistent: { ...current.persistent, endMatchDebts: [] },
      },
    };
  }
  return state;
}

/**
 * Riscuote i debiti di Fine Scontro prima del verdetto.
 * La perdita può essere letale e alimenta gli Statici sugli eventi di perdita PV.
 */
export function settleEminenceMatch(matchState, {
  initiativeSide = SIDES.PLAYER,
  finalPowerByCardId = null,
  finalPowerBySide = null,
  agentIdBySide = null,
} = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, bundle: null, notices: [] };
  }

  const recorded = recordEndMatchDebtAmounts(matchState, { finalPowerByCardId, finalPowerBySide, agentIdBySide });
  const collected = collectTimings(recorded, [EFFECT_TIMINGS.END_MATCH], initiativeSide);
  const debtQueue = collectStoredEndMatchDebts(collected.matchState)
    .filter((debt) => (debt.amount || 0) > 0)
    .map((debt) => ({
      segment: {
        primitive: P.LOSE_HP,
        target: T.SELF,
        amount: debt.amount,
        cause: HP_LOSS_CAUSES.END_MATCH_DEBT,
      },
      ownerSide: debt.side,
      abilityId: debt.source,
    }));
  const queue = [...collected.queue, ...debtQueue];
  const bundle = queue.length ? applyEminenceSegments(queue) : null;
  const applied = applyBundleAndReactions(clearEndMatchDebts(collected.matchState), bundle, { initiativeSide });
  return {
    matchState: applied.matchState,
    bundle,
    notices: [
      ...noticesFromAppliedEffects(collected.matchState, collected.queue),
      ...applied.notices,
    ],
  };
}

function sideNeedsSetupChoice(state) {
  if (!state?.eminenceId) return false;
  const staticDef = getEminence(state.eminenceId)?.static;
  return Boolean(staticDef?.setupChoice && staticDef.implemented);
}

/** Vero finché almeno un lato deve ancora fissare la scelta di setup dello Scontro. */
export function needsEminenceSetup(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return false;
  if (matchState.setupRevealed) return false;
  return BOTH_SIDES.some((side) => sideNeedsSetupChoice(matchState[side]));
}

export function isEminenceSetupPending(matchState, side) {
  if (!needsEminenceSetup(matchState)) return false;
  const state = matchState[side];
  return sideNeedsSetupChoice(state) && !state.setupCommitted;
}

function areSetupChoicesComplete(matchState) {
  if (!needsEminenceSetup(matchState)) return true;
  return BOTH_SIDES.every((side) => {
    const state = matchState[side];
    if (!sideNeedsSetupChoice(state)) return true;
    return Boolean(state.setupCommitted);
  });
}

export function commitEminenceSetupChoice(matchState, side, params) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, ok: false, reason: 'SUBSYSTEM_DISABLED' };
  }
  if (!isEminenceSetupPending(matchState, side)) {
    return { matchState, ok: false, reason: 'SETUP_NOT_PENDING' };
  }

  const next = {
    ...matchState,
    [side]: {
      ...matchState[side],
      setupCommitted: true,
      setupParams: params ?? null,
    },
  };

  return { matchState: revealEminenceSetupIfReady(next), ok: true, reason: null };
}

export function autoCommitEminenceSetup(matchState, side, undeployedCardIds = []) {
  if (!isEminenceSetupPending(matchState, side)) return matchState;
  const staticDef = getEminence(matchState[side].eminenceId)?.static;
  const key = Object.keys(staticDef?.setupParamsSchema || {})[0] || 'cardId';
  const cardId = undeployedCardIds[0];
  if (cardId == null) return matchState;
  const attempt = commitEminenceSetupChoice(matchState, side, { [key]: cardId });
  return attempt.ok ? attempt.matchState : matchState;
}

export function revealEminenceSetupIfReady(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;
  if (matchState.setupRevealed) return matchState;
  if (!areSetupChoicesComplete(matchState)) return matchState;
  if (!BOTH_SIDES.some((side) => sideNeedsSetupChoice(matchState[side]))) {
    return { ...matchState, setupRevealed: true };
  }

  const queue = [];
  for (const side of BOTH_SIDES) {
    const state = matchState[side];
    const eminence = getEminence(state?.eminenceId);
    const segments = eminence?.static?.setupSegments;
    if (!Array.isArray(segments) || !segments.length) continue;
    for (const segment of segments) {
      queue.push({
        segment,
        ownerSide: side,
        params: state.setupParams,
        abilityId: eminence.static.id,
        sourceEminenceId: eminence.id,
      });
    }
  }

  const bundle = queue.length ? applyEminenceSegments(queue) : null;
  const withMarks = applyBundleAndReactions(matchState, bundle).matchState;
  const cleared = { ...withMarks, setupRevealed: true };
  for (const side of BOTH_SIDES) {
    if (!cleared[side]) continue;
    cleared[side] = { ...cleared[side], setupParams: null };
  }
  return cleared;
}
