// ============================================
// EMINENZE — Macchina dei gate, scelta segreta, reveal e pagamento
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §2.2–2.5, §3
// ============================================

import {
  REVEAL_GATES,
  GATE_SEQUENCES,
  EFFECT_TIMINGS,
  SIDES,
  OPPOSITE_SIDE,
} from './eminenceConstants.js';
import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { ALL_AGENTS } from '../../data/cards.js';
import {
  isEminenceSubsystemEnabled,
  resetEminenceMatchRound,
  getLegalAbilityIds,
  resolveAbilityPresenceDelta,
} from './eminenceState.js';
import { changePresence } from './presence.js';
import { createConditionContext, matchesCondition } from './effectConditions.js';

const BOTH_SIDES = [SIDES.PLAYER, SIDES.ENEMY];

// ------------------------------------------------------------------
// Progressione dei gate
// ------------------------------------------------------------------

/**
 * La progressione dei gate è stato pubblico del flusso di round, non stato privato di un
 * lato: UI, IA, replay e hash devono poterla leggere (§4.1).
 *
 * @param {'FIELD_FIRST'|'AGENTS_FIRST'} sequenceName
 */
export function createGateProgress(sequenceName = 'FIELD_FIRST') {
  const sequence = GATE_SEQUENCES[sequenceName] || GATE_SEQUENCES.FIELD_FIRST;
  return { sequenceName, sequence: [...sequence], completedGates: [] };
}

export function isGateCompleted(gateProgress, gate) {
  return Boolean(gateProgress?.completedGates.includes(gate));
}

export function getNextGate(gateProgress) {
  if (!gateProgress) return null;
  return gateProgress.sequence.find((gate) => !gateProgress.completedGates.includes(gate)) || null;
}

/**
 * Determina la sequenza dei gate a partire dalle Eminenze in gioco.
 *
 * Un'Eminenza può riordinare le decisioni dello Scontro tramite il proprio Statico: il caso
 * canonico è Mascarada, che rende pubblici gli Agenti prima del Campo (§3.4). I gate non
 * sono quindi hardcodabili come "fase 2" e "fase 4".
 */
export function resolveGateSequenceName(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return 'FIELD_FIRST';

  for (const side of BOTH_SIDES) {
    const eminence = getEminence(matchState[side]?.eminenceId);
    if (eminence?.reordersGateSequence) return eminence.reordersGateSequence;
  }
  return 'FIELD_FIRST';
}

// ------------------------------------------------------------------
// Inizio round e scelta segreta
// ------------------------------------------------------------------

/**
 * Arma i segmenti dello Statico per il round che comincia.
 *
 * Uno Statico non ha gate, costo né scelta: non passa quindi da `completeGate`. Entra
 * comunque nella stessa coda `pendingEffects` delle attive, così i checkpoint restano un
 * meccanismo solo — e uno Statico e un'attiva che maturano insieme risultano ordinati per
 * iniziativa come qualunque altra coppia di effetti (§2.5).
 */
function armStaticSegments(state, ownerSide) {
  const eminence = getEminence(state?.eminenceId);
  const segments = eminence?.static?.segments;
  if (!Array.isArray(segments) || !segments.length) return state;

  // Un'Eminenza bloccata non produce nulla, Statico incluso: il blocco spegne l'Eminenza,
  // non solo la sua abilità di round.
  if (state.blockedThisRound) return state;

  return {
    ...state,
    round: {
      ...state.round,
      pendingEffects: [
        ...state.round.pendingEffects,
        ...segments.map((segment) => ({
          sourceEminenceId: state.eminenceId,
          abilityId: eminence.static.id,
          isStatic: true,
          ownerSide,
          timing: segment.timing,
          segment,
          consumed: false,
        })),
      ],
    },
  };
}

/**
 * Apre il round: azzera lo stato di round, fissa il checkpoint pubblico di Presenza su cui
 * si misura la legalità delle scelte, arma gli Statici e installa la progressione dei gate.
 */
export function beginEminenceRound(matchState, { roundNumber = 1 } = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;

  const reset = resetEminenceMatchRound(matchState);
  const withStatics = { ...reset };
  for (const side of BOTH_SIDES) {
    withStatics[side] = armStaticSegments(reset[side], side);
  }

  return {
    ...withStatics,
    roundNumber,
    gateProgress: createGateProgress(resolveGateSequenceName(reset)),
  };
}

/** Un lato è esonerato dalla scelta solo se la sua Eminenza è bloccata (§2.2). */
export function mustChooseThisRound(matchState, side) {
  if (!isEminenceSubsystemEnabled(matchState)) return false;
  const state = matchState[side];
  return Boolean(state?.eminenceId) && !state.blockedThisRound;
}

/**
 * Registra la scelta segreta di un lato.
 *
 * La legalità si misura sulla Presenza posseduta al checkpoint di selezione. Una volta
 * registrata, la scelta è bloccata: non può diventare retroattivamente illegale perché un
 * altro effetto risolve prima (§2.3).
 *
 * `committedPresenceCost` è una prenotazione di legalità, non una spesa anticipata: il
 * contatore pubblico non cambia fino al reveal.
 *
 * @returns {{ matchState: object, ok: boolean, reason: string|null }}
 */
export function selectEminenceAbility(matchState, side, abilityId, params = null) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, ok: false, reason: 'SUBSYSTEM_DISABLED' };
  }

  const state = matchState[side];
  if (!state?.eminenceId) return { matchState, ok: false, reason: 'NO_EMINENCE' };
  if (state.blockedThisRound) return { matchState, ok: false, reason: 'EMINENCE_BLOCKED' };
  if (state.selectedAbilityId) return { matchState, ok: false, reason: 'ALREADY_SELECTED' };

  const ability = getEminenceAbility(state.eminenceId, abilityId);
  if (!ability) return { matchState, ok: false, reason: 'UNKNOWN_ABILITY' };

  const checkpointPresence = state.selectionCheckpointPresence;
  if (!getLegalAbilityIds(state.eminenceId, checkpointPresence, state.persistent).includes(abilityId)) {
    return { matchState, ok: false, reason: 'INSUFFICIENT_PRESENCE' };
  }

  const presenceDelta = resolveAbilityPresenceDelta(ability, state.persistent);
  return {
    matchState: {
      ...matchState,
      [side]: {
        ...state,
        selectedAbilityId: abilityId,
        selectedParams: params,
        selectionSnapshotPresence: checkpointPresence,
        committedPresenceCost: Math.max(0, -presenceDelta),
      },
    },
    ok: true,
    reason: null,
  };
}

/**
 * Completa o sostituisce i parametri di una scelta già sigillata.
 * Serve ai bersagli fissati al reveal (Agenti confermati) senza riaprire la scelta.
 */
export function setEminenceAbilityParams(matchState, side, params) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, ok: false, reason: 'SUBSYSTEM_DISABLED' };
  }
  const state = matchState[side];
  if (!state?.selectedAbilityId) return { matchState, ok: false, reason: 'NO_SELECTION' };
  if (state.revealedAbilityId) return { matchState, ok: false, reason: 'ALREADY_REVEALED' };

  return {
    matchState: {
      ...matchState,
      [side]: {
        ...state,
        selectedParams: { ...(state.selectedParams || {}), ...(params || {}) },
      },
    },
    ok: true,
    reason: null,
  };
}

/** Nessun commitment può essere aperto finché entrambi i lati non hanno concluso (§10.5). */
export function areSelectionsComplete(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return true;

  return BOTH_SIDES.every((side) => {
    if (!mustChooseThisRound(matchState, side)) return true;
    return Boolean(matchState[side].selectedAbilityId);
  });
}

// ------------------------------------------------------------------
// Reveal a un gate
// ------------------------------------------------------------------

function collectSegments(ability, ownerSide, params = null) {
  if (!ability?.segments) return { immediate: [], pending: [] };

  const immediate = [];
  const pending = [];

  for (const segment of ability.segments) {
    const entry = {
      sourceEminenceId: null,
      abilityId: ability.id,
      ownerSide,
      timing: segment.timing,
      segment,
      params,
      consumed: false,
    };
    if (segment.timing === EFFECT_TIMINGS.AFTER_REVEAL) immediate.push(entry);
    else pending.push(entry);
  }

  return { immediate, pending };
}

/**
 * Completa un gate: apre simultaneamente i commitment che gli appartengono, applica i delta
 * base di Presenza e arma i segmenti differiti.
 *
 * Il pagamento è **atomico rispetto allo snapshot delle scelte**: i delta dei due lati sono
 * calcolati sullo stato pre-gate e poi applicati insieme, quindi chi ha l'iniziativa non può
 * rendere impagabile la scelta avversaria. La **risoluzione** invece non è simultanea: a
 * parità di checkpoint segue l'iniziativa (§2.5).
 *
 * @param {object} matchState
 * @param {string} gate uno di REVEAL_GATES
 * @param {object} options
 * @param {'player'|'enemy'} options.initiativeSide lato che risolve per primo
 * @returns {{ matchState: object, events: object[], resolutionQueue: object[] }}
 */
export function completeGate(matchState, gate, { initiativeSide = SIDES.PLAYER } = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { matchState, events: [], resolutionQueue: [] };
  }
  if (isGateCompleted(matchState.gateProgress, gate)) {
    return { matchState, events: [], resolutionQueue: [] };
  }
  if (!areSelectionsComplete(matchState)) {
    return { matchState, events: [], resolutionQueue: [], blocked: 'SELECTIONS_INCOMPLETE' };
  }

  const order = [initiativeSide, OPPOSITE_SIDE[initiativeSide]];
  const events = [];
  const resolutionQueue = [];

  // Passo 1 — determinare le aperture sullo stato pre-gate, prima di toccare la Presenza.
  const openings = order
    .map((side) => {
      const state = matchState[side];
      const abilityId = state?.selectedAbilityId;
      if (!abilityId || state.revealedAbilityId) return null;

      const ability = getEminenceAbility(state.eminenceId, abilityId);
      if (!ability || ability.revealGate !== gate) return null;

      return { side, state, ability };
    })
    .filter(Boolean);

  // Passo 2 — pagamento atomico: i delta nascono tutti dallo stesso snapshot.
  let nextMatchState = { ...matchState };

  for (const { side, ability } of openings) {
    const state = nextMatchState[side];
    const presenceDelta = resolveAbilityPresenceDelta(ability, state.persistent);
    const { state: paid, event } = changePresence(state, presenceDelta, {
      reason: `reveal:${ability.id}`,
      countsAsSpend: presenceDelta < 0,
      source: ability.id,
      roundNumber: matchState.roundNumber ?? null,
    });

    const { immediate, pending } = collectSegments(ability, side, state.selectedParams);
    const stamp = (entry) => ({ ...entry, sourceEminenceId: state.eminenceId });

    nextMatchState[side] = {
      ...paid,
      revealedAbilityId: ability.id,
      revealGateReached: gate,
      round: {
        ...paid.round,
        pendingEffects: [...paid.round.pendingEffects, ...pending.map(stamp)],
      },
    };

    events.push({
      type: 'REVEAL',
      side,
      gate,
      eminenceId: state.eminenceId,
      abilityId: ability.id,
      presenceDelta,
      params: state.selectedParams ?? null,
    });
    if (event) events.push({ ...event, side });

    resolutionQueue.push(...immediate.map(stamp));
  }

  // Passo 3 — il gate risulta superato anche se nessuno ha aperto: è informazione pubblica.
  nextMatchState.gateProgress = {
    ...matchState.gateProgress,
    completedGates: [...matchState.gateProgress.completedGates, gate],
  };

  events.push({ type: 'GATE_COMPLETED', gate, revealCount: openings.length });

  return { matchState: nextMatchState, events, resolutionQueue };
}

/** Scorciatoia per il reveal finale: apre tutto ciò che è rimasto sigillato. */
export function completeGeneralGate(matchState, options = {}) {
  return completeGate(matchState, REVEAL_GATES.GENERAL, options);
}

/**
 * Raccoglie i segmenti armati che spettano a un checkpoint, ordinati per iniziativa.
 *
 * Il checkpoint appartiene alla pipeline del Duello, non all'Eminenza: è il chiamante a
 * sapere dove si trova, e questa funzione gli restituisce solo ciò che gli compete.
 *
 * Un segmento la cui condizione non è soddisfatta viene comunque marcato consumato: il suo
 * checkpoint è passato e non tornerà in questo round. Lasciarlo armato lo farebbe scattare
 * al primo checkpoint successivo con un contesto diverso.
 *
 * @param {object} options.context termini per `matchesCondition`; `roundNumber` è sempre
 *   presente, il resto lo aggiunge chi conosce il punto della pipeline
 * @returns {{ queue: object[], matchState: object }} i segmenti restituiti sono marcati
 *   come consumati, così un checkpoint non può eseguirli due volte.
 */
function relativeDuelOutcome(winner, side) {
  if (winner === 'draw') return 'draw';
  if (winner === SIDES.PLAYER || winner === SIDES.ENEMY) {
    return winner === side ? 'self' : 'opponent';
  }
  return null;
}

function agentTriggerOf(cardId) {
  if (cardId == null) return null;
  return ALL_AGENTS.find((agent) => agent.id === cardId)?.ability?.trigger ?? null;
}

function markNamesOn(persistent, cardId) {
  if (cardId == null || !persistent) return [];
  const names = [];
  for (const [key, ids] of Object.entries(persistent)) {
    if (!key.endsWith('CardIds') || !Array.isArray(ids)) continue;
    if (ids.includes(cardId)) names.push(key.slice(0, -'CardIds'.length));
  }
  return names;
}

/** Marchi pubblici sugli Agenti schierati, per condizioni e avvisi. */
export function createSideMarkContext(persistent, ownId, enemyId) {
  const ownMarks = markNamesOn(persistent, ownId);
  const enemyMarks = markNamesOn(persistent, enemyId);
  return {
    ownMarks,
    enemyMarks,
    deployedMarks: [...new Set([...ownMarks, ...enemyMarks])],
  };
}

export function collectPendingEffects(
  matchState,
  timing,
  { initiativeSide = SIDES.PLAYER, context = null } = {}
) {
  if (!isEminenceSubsystemEnabled(matchState)) return { queue: [], skipped: [], matchState };

  const order = [initiativeSide, OPPOSITE_SIDE[initiativeSide]];
  const extra = context || {};
  const knownWinner = extra.winner === SIDES.PLAYER
    || extra.winner === SIDES.ENEMY
    || extra.winner === 'draw';
  const queue = [];
  const skipped = [];
  const nextMatchState = { ...matchState };

  for (const side of order) {
    const state = nextMatchState[side];
    if (!state?.round?.pendingEffects.length) continue;

    const sideExtra = { ...extra };
    if (knownWinner) sideExtra.duelWinnerRelative = relativeDuelOutcome(extra.winner, side);
    sideExtra.aliasUsed = Boolean(extra.aliasUsedBySide?.[side]);
    sideExtra.ownPowerResolved = Boolean(extra.powerResolvedBySide?.[side]);
    sideExtra.ownActivatedTrigger = extra.activatedTriggerBySide?.[side] ?? null;

    const ownId = extra.agentIdBySide?.[side] ?? null;
    const enemyId = extra.agentIdBySide?.[OPPOSITE_SIDE[side]] ?? null;
    Object.assign(sideExtra, createSideMarkContext(state.persistent, ownId, enemyId));
    sideExtra.ownAgentTrigger = agentTriggerOf(ownId);
    sideExtra.enemyAgentTrigger = agentTriggerOf(enemyId);
    if (extra.anchoredBySide) {
      sideExtra.ownAnchored = Boolean(extra.anchoredBySide[side]);
    }
    sideExtra.ownFinalDamage = extra.finalDamageBySide?.[side] ?? null;
    sideExtra.enemyFinalDamage = extra.finalDamageBySide?.[OPPOSITE_SIDE[side]] ?? null;
    sideExtra.ownActivationSatisfied = extra.activationSatisfiedBySide?.[side] ?? null;
    sideExtra.enemyActivationSatisfied = extra.activationSatisfiedBySide?.[OPPOSITE_SIDE[side]] ?? null;
    sideExtra.ownFocusInvested = extra.focusInvestedBySide?.[side] ?? null;
    sideExtra.ownDeployedIsLowestLeague = extra.deployedIsLowestLeagueBySide?.[side] ?? null;
    sideExtra.statReductionOccurred = extra.statReductionOccurred ?? null;

    const remaining = [];
    for (const entry of state.round.pendingEffects) {
      if (!entry.consumed && entry.timing === timing) {
        const entryContext = createConditionContext(matchState, {
          ...sideExtra,
          params: entry.params ?? null,
        });
        if (matchesCondition(entry.segment?.condition, entryContext)) {
          queue.push({
            ...entry,
            agentIdBySide: extra.agentIdBySide || entry.agentIdBySide || null,
          });
        } else if (entry.segment?.condition) {
          skipped.push({
            ...entry,
            agentIdBySide: extra.agentIdBySide || entry.agentIdBySide || null,
          });
        }
        remaining.push({
          ...entry,
          consumed: entry.segment?.repeatable ? Boolean(entry.consumed) : true,
        });
      } else {
        remaining.push(entry);
      }
    }

    nextMatchState[side] = {
      ...state,
      round: { ...state.round, pendingEffects: remaining },
    };
  }

  return { queue, skipped, matchState: nextMatchState };
}

// ------------------------------------------------------------------
// Deduzioni legittime sull'avversario (§3.2, §10.4)
// ------------------------------------------------------------------

/**
 * Insieme delle abilità ancora compatibili con lo stato pubblico.
 *
 * Compone i due soli filtri legittimi:
 *
 * 1. **legalità al checkpoint di selezione** — la Presenza è pubblica e la legalità di una
 *    capacità a costo negativo dipende dalla Presenza posseduta alla scelta segreta. Va usata
 *    quella, non il contatore corrente, che nel frattempo può essere cambiato in entrambe le
 *    direzioni da reveal, statici e costi;
 * 2. **gate già superati** — attraversare un gate senza aprire il commitment esclude tutte le
 *    abilità che a quel gate avrebbero dovuto rivelarsi.
 *
 * @param {object} publicSide proiezione pubblica di un lato
 * @param {object} gateProgress progressione pubblica dei gate
 * @returns {string[]} id delle abilità ancora possibili
 */
export function getSealedAbilityHypotheses(publicSide, gateProgress) {
  if (!publicSide?.eminenceId) return [];
  if (publicSide.revealedAbilityId) return [publicSide.revealedAbilityId];

  const eminence = getEminence(publicSide.eminenceId);
  if (!eminence) return [];

  const legalAtSelection = new Set(
    getLegalAbilityIds(publicSide.eminenceId, publicSide.selectionCheckpointPresence, publicSide.persistent)
  );
  const completed = gateProgress?.completedGates || [];

  return eminence.abilities
    .filter((ability) => legalAtSelection.has(ability.id))
    .filter((ability) => !completed.includes(ability.revealGate))
    .map((ability) => ability.id);
}

/** Vero quando lo stato pubblico determina univocamente la scelta avversaria. */
export function isSelectionPubliclyDetermined(publicSide, gateProgress) {
  return getSealedAbilityHypotheses(publicSide, gateProgress).length <= 1;
}
