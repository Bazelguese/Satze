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
} from './eminenceConstants.js';
import {
  areSelectionsComplete,
  collectPendingEffects,
  completeGate,
  mustChooseThisRound,
} from './eminenceRound.js';
import { applyEminenceSegments } from './primitiveHandlers.js';
import { changePresence } from './presence.js';
import { isEminenceSubsystemEnabled, getLegalAbilityIds } from './eminenceState.js';
import { selectEminenceAbility } from './eminenceRound.js';

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
];

function collectTimings(matchState, timings, initiativeSide) {
  let state = matchState;
  const queue = [];

  for (const timing of timings) {
    const collected = collectPendingEffects(state, timing, { initiativeSide });
    state = collected.matchState;
    queue.push(...collected.queue);
  }

  return { matchState: state, queue };
}

/**
 * Registra le scelte che le regole non lasciano libere.
 *
 * Non esiste un Pass volontario (§2.2): un lato con una sola opzione legale non sta
 * decidendo nulla, quindi chiedergliela sarebbe rumore. Con più opzioni legali questa
 * funzione non tocca nulla e lascia la decisione a chi di dovere.
 */
export function autoSelectForcedChoices(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;

  let state = matchState;
  for (const side of BOTH_SIDES) {
    if (!mustChooseThisRound(state, side)) continue;
    if (state[side].selectedAbilityId) continue;

    const legal = getLegalAbilityIds(state[side].eminenceId, state[side].selectionCheckpointPresence);
    if (legal.length !== 1) continue;

    const attempt = selectEminenceAbility(state, side, legal[0]);
    if (attempt.ok) state = attempt.matchState;
  }

  return state;
}

/**
 * Riversa nel modello di stato ciò che il bundle ha prodotto e che il risolutore del Duello
 * non può applicare da solo: Presenza e blocchi.
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

  return state;
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
 * @returns {{ matchState: object, bundle: object|null, events: object[], blocked: string|null }}
 */
export function prepareEminenceDuel(matchState, { initiativeSide = SIDES.PLAYER } = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, bundle: null, events: [], blocked: null };
  }

  const withChoices = autoSelectForcedChoices(matchState);
  if (!areSelectionsComplete(withChoices)) {
    return { matchState: withChoices, bundle: null, events: [], blocked: 'SELECTIONS_INCOMPLETE' };
  }

  const opened = completeGate(withChoices, REVEAL_GATES.GENERAL, { initiativeSide });
  const collected = collectTimings(opened.matchState, PRE_DUEL_TIMINGS, initiativeSide);
  const bundle = applyEminenceSegments([...opened.resolutionQueue, ...collected.queue]);

  return {
    matchState: applyBundleToState(collected.matchState, bundle),
    bundle,
    events: opened.events,
    blocked: null,
  };
}

/**
 * Chiude il round: incassa i checkpoint successivi alla determinazione del vincitore.
 *
 * @returns {{ matchState: object, bundle: object|null }}
 */
export function settleEminenceRound(matchState, { initiativeSide = SIDES.PLAYER } = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) return { matchState, bundle: null };

  const collected = collectTimings(matchState, POST_DUEL_TIMINGS, initiativeSide);
  if (!collected.queue.length) return { matchState: collected.matchState, bundle: null };

  const bundle = applyEminenceSegments(collected.queue);
  return { matchState: applyBundleToState(collected.matchState, bundle), bundle };
}
