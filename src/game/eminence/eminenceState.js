// ============================================
// EMINENZE — Modello di stato, eleggibilità e inizializzazione
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §1.2, §2, §4
// ============================================

import {
  EMINENCE_ELIGIBILITY_THRESHOLD,
  EMINENCE_FORMAT,
  PARAM_SOURCES,
  SIDES,
} from './eminenceConstants.js';
import { EMINENCES, getEminence, getEminenceAbility, getEminenceForArmy } from '../../data/eminences.js';
import { cloneSlotCurses } from './slotCurses.js';

// ------------------------------------------------------------------
// Eleggibilità e deckbuilding (§1.2)
// ------------------------------------------------------------------

/**
 * Conta le carte per Armata in un mazzo.
 * @param {Array<{army: string}>} deckCards
 * @returns {Record<string, number>}
 */
export function countCardsByArmy(deckCards) {
  const counts = {};
  for (const card of deckCards || []) {
    if (!card || !card.army) continue;
    counts[card.army] = (counts[card.army] || 0) + 1;
  }
  return counts;
}

/**
 * Armate che il mazzo rende eleggibili: almeno 5 carte di quell'Armata.
 * @param {Array<{army: string}>} deckCards
 * @returns {string[]} nomi Armata, ordinati per conteggio decrescente e poi alfabeticamente
 */
export function getEligibleArmies(deckCards) {
  const counts = countCardsByArmy(deckCards);
  return Object.keys(counts)
    .filter((army) => counts[army] >= EMINENCE_ELIGIBILITY_THRESHOLD)
    .sort((a, b) => (counts[b] - counts[a]) || a.localeCompare(b));
}

/**
 * Eminenze eleggibili per un mazzo. In un Deck 5-5 sono due; il giocatore ne registra una.
 * @param {Array<{army: string}>} deckCards
 * @returns {Array<object>} entry del catalogo EMINENCES
 */
export function getEligibleEminences(deckCards) {
  return getEligibleArmies(deckCards)
    .map((army) => getEminenceForArmy(army))
    .filter(Boolean);
}

/**
 * Valida la coppia (mazzo, Eminenza registrata) secondo il formato.
 *
 * Nei formati con Eminenze richieste una partita non può iniziare senza un'Eminenza valida.
 * Nei formati con Eminenze disattivate qualunque valore è accettato e ignorato.
 *
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateDeckEminence(deckCards, eminenceId, format = EMINENCE_FORMAT.REQUIRED) {
  if (format === EMINENCE_FORMAT.DISABLED) {
    return { valid: true, reason: null };
  }

  if (!eminenceId) {
    return { valid: false, reason: 'MISSING_EMINENCE' };
  }

  const eminence = getEminence(eminenceId);
  if (!eminence) {
    return { valid: false, reason: 'UNKNOWN_EMINENCE' };
  }

  const counts = countCardsByArmy(deckCards);
  if ((counts[eminence.army] || 0) < EMINENCE_ELIGIBILITY_THRESHOLD) {
    return { valid: false, reason: 'ARMY_NOT_ELIGIBLE' };
  }

  return { valid: true, reason: null };
}

// ------------------------------------------------------------------
// Stato per giocatore (§4.1, §4.2, §4.3)
// ------------------------------------------------------------------

/** Stato temporaneo azzerato a ogni round (§4.3). */
export function createEminenceRoundState() {
  return {
    pendingEffects: [],
    triggerRules: null,

    temporaryLeagueByCardId: {},
    temporaryFocusByCardId: {},

    suppressArmyBonus: false,
    forceArmyBonusActive: false,
    armyBonusUnblockable: false,

    ignoreFieldForCardIds: [],

    // Vincoli sugli Agenti schierabili in questo Duello (Agente imposto, vietato o riusabile).
    deployConstraints: { forcedCardId: null, bannedCardIds: [], revivedCardIds: [] },

    custom: {},
  };
}

/** Vincoli di schieramento del lato per il Duello corrente. */
export function readDeployConstraints(matchState, side) {
  const state = matchState?.[side];
  const raw = state?.round?.deployConstraints || {};
  const revived = [...(raw.revivedCardIds || [])];
  // Un'abilità ancora sigillata può già concedere un Agente al suo proprietario (es. Vendetta
  // oltre la Morte, che si rivela solo allo schieramento). La scelta è privata: la vede solo
  // chi ha accesso alla selezione del lato.
  const grant = getEminenceAbility(state?.eminenceId, state?.selectedAbilityId)?.deployGrant;
  if (grant?.mode === 'REVIVE') {
    const chosen = state?.selectedParams?.[grant.cardParam || 'cardId'];
    const cardId = Array.isArray(chosen) ? chosen[0] : chosen;
    if (cardId != null && !revived.includes(cardId)) revived.push(cardId);
  }
  return {
    forcedCardId: raw.forcedCardId ?? null,
    bannedCardIds: [...(raw.bannedCardIds || [])],
    revivedCardIds: revived,
  };
}

/**
 * Agenti che il lato può schierare in questo Duello, dati la mano e gli Agenti già usati.
 * Un Agente riusabile torna disponibile anche se usato; un Agente vietato no, salvo che sia
 * l'unico rimasto; un Agente imposto, se disponibile, è l'unica scelta.
 *
 * @param {object} matchState stato Eminenze (null = nessun vincolo)
 * @param {'player'|'enemy'} side
 * @param {Array<number|string>} handIds id delle carte in mano
 * @param {Array<number|string>} usedIds id delle carte già usate
 */
export function filterDeployableCardIds(matchState, side, handIds = [], usedIds = []) {
  const constraints = readDeployConstraints(matchState, side);
  const used = new Set(usedIds);
  const revived = new Set(constraints.revivedCardIds);
  const available = handIds.filter((id) => !used.has(id) || revived.has(id));
  const banned = new Set(constraints.bannedCardIds);
  const allowed = available.filter((id) => !banned.has(id));
  const pool = allowed.length ? allowed : available;
  if (constraints.forcedCardId != null && pool.includes(constraints.forcedCardId)) {
    return [constraints.forcedCardId];
  }
  return pool;
}

/** Stato persistente per l'intero Scontro (§4.2). */
export function createEminencePersistentState() {
  return {
    anchoredThresholdDelta: 0,
    fragmentCardIds: [],
    preyCardIds: [],
    debitoByCardId: {},
    triggerReplacementsByCardId: {},
    endMatchDebts: [],
    slotCurses: {},
    abilityPresenceDeltas: {},
    abilityEscalation: {},
    // Esiti dei Duelli già chiusi in questo Scontro, dal punto di vista del lato.
    duelRecord: { won: 0, lost: 0, draw: 0 },
    // Agenti del lato sconfitti in un Duello (pubblico).
    defeatedCardIds: [],
    custom: {},
  };
}

/** Esiti dei Duelli del lato; i salvataggi senza registro valgono come nessun Duello. */
export function readDuelRecord(persistent) {
  const record = persistent?.duelRecord || {};
  return {
    won: record.won || 0,
    lost: record.lost || 0,
    draw: record.draw || 0,
  };
}

/**
 * Stato Eminenza di un giocatore all'inizio dello Scontro.
 *
 * `eminenceId` è non-null nello stato legale di un formato con Eminenze richieste.
 * Il fallback `null` è tollerato per salvataggi vecchi, test o stati corrotti, ma non ha
 * alcuna semantica competitiva: in particolare non equivale a "Presenza 0" (§1.2).
 *
 * @param {string|null} eminenceId
 */
export function createEminenceState(eminenceId = null) {
  const eminence = eminenceId ? getEminence(eminenceId) : null;

  return {
    eminenceId: eminence ? eminence.id : null,

    presence: eminence ? eminence.initialPresence : 0,
    totalPresenceSpent: 0,
    presenceSpentThisRound: 0,

    selectedAbilityId: null,
    selectedParams: null,
    selectionSnapshotPresence: 0,
    committedPresenceCost: 0,

    // Equivalente pubblico di selectionSnapshotPresence. Serve alle deduzioni di legalità
    // (IA e UI), che devono usare la Presenza al checkpoint di selezione e non il contatore
    // corrente, che nel frattempo può essere cambiato in entrambe le direzioni (§10.4).
    selectionCheckpointPresence: eminence ? eminence.initialPresence : 0,

    revealedAbilityId: null,
    revealGateReached: null,

    blockedThisRound: false,
    blockedNextRound: false,

    setupCommitted: false,
    setupParams: null,

    // Ultima abilità scelta (persistente fra i round) per forbidConsecutiveAbility.
    lastSelectedAbilityId: null,

    persistent: createEminencePersistentState(),
    round: createEminenceRoundState(),
  };
}

/**
 * Stato Eminenza dei due lati. `null` come eminenceId è ammesso solo come fallback difensivo.
 */
export function createEminenceMatchState({
  format = EMINENCE_FORMAT.REQUIRED,
  playerEminenceId = null,
  enemyEminenceId = null,
} = {}) {
  if (format === EMINENCE_FORMAT.DISABLED) {
    return { format, enabled: false, [SIDES.PLAYER]: null, [SIDES.ENEMY]: null };
  }

  return {
    format,
    enabled: true,
    setupRevealed: false,
    [SIDES.PLAYER]: createEminenceState(playerEminenceId),
    [SIDES.ENEMY]: createEminenceState(enemyEminenceId),
  };
}

export function isEminenceSubsystemEnabled(matchState) {
  return Boolean(matchState && matchState.enabled);
}

/**
 * Azzera lo stato di round conservando Presenza, stato persistente e blocco pianificato.
 * `blockedNextRound` diventa `blockedThisRound` del round che comincia.
 */
export function resetEminenceRoundState(state) {
  if (!state) return state;

  return {
    ...state,
    presenceSpentThisRound: 0,
    selectedAbilityId: null,
    selectedParams: null,
    selectionSnapshotPresence: 0,
    committedPresenceCost: 0,
    selectionCheckpointPresence: state.presence,
    // La scelta del round precedente (già pubblica al reveal) vieta la ripetizione consecutiva.
    lastSelectedAbilityId: state.revealedAbilityId || state.lastSelectedAbilityId || null,
    revealedAbilityId: null,
    revealGateReached: null,
    blockedThisRound: state.blockedNextRound,
    blockedNextRound: false,
    round: createEminenceRoundState(),
  };
}

export function resetEminenceMatchRound(matchState) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;

  return {
    ...matchState,
    [SIDES.PLAYER]: resetEminenceRoundState(matchState[SIDES.PLAYER]),
    [SIDES.ENEMY]: resetEminenceRoundState(matchState[SIDES.ENEMY]),
  };
}

// ------------------------------------------------------------------
// Confine informativo pubblico / privato (§4.1)
// ------------------------------------------------------------------

/**
 * Proiezione pubblica dello stato Eminenza di un lato.
 *
 * È l'unica proiezione che può raggiungere l'avversario, l'information set dell'IA,
 * `publicStateHash` e i payload di rete prima del gate corretto.
 */
export function selectPublicEminenceState(state) {
  if (!state) return null;

  return {
    eminenceId: state.eminenceId,
    presence: state.presence,
    totalPresenceSpent: state.totalPresenceSpent,
    presenceSpentThisRound: state.presenceSpentThisRound,
    selectionCheckpointPresence: state.selectionCheckpointPresence,
    revealedAbilityId: state.revealedAbilityId,
    revealGateReached: state.revealGateReached,
    blockedThisRound: state.blockedThisRound,
    hasSealedSelection: Boolean(state.selectedAbilityId) && !state.revealedAbilityId,
    hasSealedSetup: Boolean(state.setupCommitted),
    lastSelectedAbilityId: state.lastSelectedAbilityId ?? null,
    persistent: selectPublicPersistentState(state.persistent),
    leagueByCardId: { ...(state.round?.temporaryLeagueByCardId || {}) },
  };
}

/**
 * Parte pubblica dello stato persistente. I marker di gioco sono pubblici per design
 * (Preda, Frammenti, Debito, Maledizioni di slot); `custom` resta fuori finché una
 * primitiva non ne dichiara esplicitamente la visibilità.
 */
export function selectPublicPersistentState(persistent) {
  if (!persistent) return null;

  return {
    anchoredThresholdDelta: persistent.anchoredThresholdDelta,
    fragmentCardIds: [...persistent.fragmentCardIds],
    preyCardIds: [...persistent.preyCardIds],
    debitoByCardId: { ...persistent.debitoByCardId },
    triggerReplacementsByCardId: { ...(persistent.triggerReplacementsByCardId || {}) },
    endMatchDebts: (persistent.endMatchDebts || []).map((debt) => ({ ...debt })),
    slotCurses: cloneSlotCurses(persistent.slotCurses),
    abilityPresenceDeltas: { ...(persistent.abilityPresenceDeltas || {}) },
    abilityEscalation: { ...(persistent.abilityEscalation || {}) },
    duelRecord: readDuelRecord(persistent),
    defeatedCardIds: [...(persistent.defeatedCardIds || [])],
  };
}

/** Selezione segreta di round. Non deve mai attraversare il confine informativo. */
export function selectPrivateEminenceSelection(state) {
  if (!state) return null;

  return {
    selectedAbilityId: state.selectedAbilityId,
    selectedParams: state.selectedParams,
    selectionSnapshotPresence: state.selectionSnapshotPresence,
    committedPresenceCost: state.committedPresenceCost,
    setupParams: state.setupParams,
  };
}

/**
 * Vista pubblica dell'intero sottosistema, dal punto di vista di un osservatore.
 * `viewerSide` riceve la propria selezione segreta in chiaro; l'altro lato no.
 */
export function selectPublicEminenceMatchState(matchState, viewerSide = null) {
  if (!isEminenceSubsystemEnabled(matchState)) {
    return { enabled: false, format: matchState ? matchState.format : EMINENCE_FORMAT.DISABLED };
  }

  const project = (side) => {
    const publicState = selectPublicEminenceState(matchState[side]);
    if (!publicState) return null;
    if (side !== viewerSide) return publicState;
    return { ...publicState, private: selectPrivateEminenceSelection(matchState[side]) };
  };

  return {
    enabled: true,
    format: matchState.format,
    [SIDES.PLAYER]: project(SIDES.PLAYER),
    [SIDES.ENEMY]: project(SIDES.ENEMY),
  };
}

// ------------------------------------------------------------------
// Legalità della scelta (§2.3)
// ------------------------------------------------------------------

/**
 * Costo effettivo di un'abilità: catalogo + delta persistenti dello Scontro.
 * `presenceDeltaMin` è il pavimento del costo effettivo, non del solo extra.
 */
export function resolveAbilityPresenceDelta(ability, persistent = null, presence = null) {
  if (!ability) return 0;
  const extra = persistent?.abilityPresenceDeltas?.[ability.id] || 0;
  const raw = (ability.presenceDelta || 0) + extra;
  const bounded = typeof ability.presenceDeltaMin === 'number'
    ? Math.max(ability.presenceDeltaMin, raw)
    : raw;
  // «Spendi tutta la tua Presenza»: il delta di catalogo è il minimo richiesto; con la
  // Presenza nota il costo diventa tutta quella posseduta.
  if (ability.spendAllPresence && Number.isFinite(presence)) {
    return -Math.max(presence, -bounded);
  }
  return bounded;
}

/**
 * Abilità selezionabili data una certa Presenza.
 *
 * Usata sia per la UI del giocatore sia per le deduzioni dell'IA. Nel secondo caso il
 * chiamante deve passare `selectionCheckpointPresence`, non la Presenza corrente.
 *
 * @param {string} eminenceId
 * @param {number} presence
 * @param {object|null} [persistent] stato persistente del lato (costi cresciuti)
 * @param {object} [options]
 * @param {string|null} [options.lastSelectedAbilityId]
 * @returns {string[]} id delle abilità legali
 */
export function getLegalAbilityIds(eminenceId, presence, persistent = null, options = {}) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return [];

  const forbidConsecutive = Boolean(
    eminence.forbidConsecutiveAbility ?? eminence.static?.forbidConsecutiveAbility,
  );
  const lastId = options.lastSelectedAbilityId ?? null;

  return eminence.abilities
    .filter((ability) => {
      if (forbidConsecutive && lastId && ability.id === lastId) return false;
      if (!persistentTargetsAvailable(ability, persistent)) return false;
      const delta = resolveAbilityPresenceDelta(ability, persistent);
      return delta >= 0 || presence >= Math.abs(delta);
    })
    .map((ability) => ability.id);
}

/**
 * Un'abilità che sceglie fra i propri Frammenti non è selezionabile se non ne esistono
 * abbastanza. Il conteggio è pubblico, quindi vale anche per le deduzioni dell'IA.
 */
function persistentTargetsAvailable(ability, persistent) {
  for (const spec of Object.values(ability?.paramsSchema || {})) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) continue;
    if (spec.source === PARAM_SOURCES.OWN_FRAGMENTS) {
      const owned = persistent?.fragmentCardIds?.length || 0;
      if (owned < (spec.min ?? 1)) return false;
    }
    if (spec.source === PARAM_SOURCES.OWN_DEFEATED) {
      if (!(persistent?.defeatedCardIds?.length > 0)) return false;
    }
  }
  return true;
}

export function isAbilitySelectable(eminenceId, abilityId, presence, persistent = null, options = {}) {
  return getLegalAbilityIds(eminenceId, presence, persistent, options).includes(abilityId);
}

/**
 * Ogni Eminenza deve avere almeno un'opzione non negativa, così da non restare mai senza
 * scelta legale (§2.1). Invariante di catalogo, verificata dai test.
 */
export function hasAlwaysLegalOption(eminenceId) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return false;
  return eminence.abilities.some((ability) => ability.presenceDelta >= 0);
}

export { EMINENCES, EMINENCE_FORMAT, SIDES };
