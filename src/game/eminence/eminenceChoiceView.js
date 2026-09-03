// ============================================
// EMINENZE — Modello dati della scelta per la UI
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §4.1, §11.1, §11.2
// ============================================
//
// Vincolo informativo: questo modulo è il **solo** punto da cui la UI del Duello prende i
// dati dell'Eminenza, ed è costruito sopra `selectPublicEminenceMatchState`. Il componente
// non riceve quindi lo stato completo e non può, nemmeno per errore di rendering, esporre la
// scelta segreta avversaria (§4.1).
//
// La scelta propria arriva dal ramo privato che la proiezione riserva al `viewerSide`: chi
// guarda vede la propria selezione sigillata, non quella dell'altro.

import { SIDES, OPPOSITE_SIDE, REVEAL_GATES, PARAM_SOURCES, CHOICE_PARAMS_TIMING } from './eminenceConstants.js';
import { getEminence } from '../../data/eminences.js';
import { ALL_AGENTS } from '../../data/cards.js';
import {
  isEminenceSubsystemEnabled,
  selectPublicEminenceMatchState,
  getLegalAbilityIds,
  resolveAbilityPresenceDelta,
} from './eminenceState.js';
import { getSealedAbilityHypotheses, getNextGate, mustChooseThisRound } from './eminenceRound.js';
import { isEminenceSetupPending, needsEminenceSetup } from './eminenceDuelGate.js';

/**
 * Stati della scelta (§11.2).
 *
 * I sette stati della specifica si ottengono da questi cinque più `revealGate`:
 * `REVEALED_PRE_FIELD` è `{ state: REVEALED, revealGate: 'PRE_FIELD' }`. Tenerli separati
 * eviterebbe un campo ma moltiplicherebbe le costanti per ogni gate futuro.
 *
 * `PENDING_EFFECT` e `RESOLVED` non compaiono qui: distinguerli richiede di sapere quali
 * checkpoint del Duello sono già passati, cioè stato che appartiene alla risoluzione e non
 * alla scelta. Quel tratto lo racconta il log di battaglia, che quei checkpoint li attraversa.
 */
export const CHOICE_STATES = {
  DISABLED: 'DISABLED',
  BLOCKED: 'BLOCKED',
  CHOOSING: 'CHOOSING',
  LOCKED_HIDDEN: 'LOCKED_HIDDEN',
  REVEALED: 'REVEALED',
};

/** Motivi di illegalità di un'opzione. Servono alla UI per dire *perché* non si può. */
export const OPTION_BLOCKERS = {
  INSUFFICIENT_PRESENCE: 'INSUFFICIENT_PRESENCE',
  GATE_PASSED: 'GATE_PASSED',
};

const DISABLED_VIEW = Object.freeze({
  enabled: false,
  gate: null,
  completedGates: [],
  setupPending: false,
  self: null,
  opponent: null,
});

function sideState(publicSide) {
  if (!publicSide?.eminenceId) return CHOICE_STATES.DISABLED;
  if (publicSide.blockedThisRound) return CHOICE_STATES.BLOCKED;
  if (publicSide.revealedAbilityId) return CHOICE_STATES.REVEALED;
  if (publicSide.hasSealedSelection) return CHOICE_STATES.LOCKED_HIDDEN;
  return CHOICE_STATES.CHOOSING;
}

/**
 * Descrittore statico di un'Eminenza, indipendente dallo stato di round.
 * È informazione pubblica: l'Eminenza in gioco si conosce dal deckbuilding (§1.2).
 */
function describeEminence(eminenceId) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return null;

  return {
    id: eminence.id,
    name: eminence.name,
    nameProvisional: Boolean(eminence.nameProvisional),
    army: eminence.army,
    implemented: Boolean(eminence.implemented),
    initialPresence: eminence.initialPresence,
    staticName: eminence.static?.name ?? null,
    staticText: eminence.static?.text ?? null,
    staticImplemented: Boolean(eminence.static?.implemented),
    presenceCurve: eminence.abilities.map((ability) => ability.presenceDelta),
  };
}

function agentHasTrigger(cardId) {
  return Boolean(ALL_AGENTS.find((agent) => agent.id === cardId)?.ability?.trigger);
}

export const SCHEMA_LIMITS_KEY = '__limits';

export function paramLimits(schema, key) {
  return schema?.[SCHEMA_LIMITS_KEY]?.[key] || { min: 1, max: 1 };
}

function idsFromParam(value) {
  if (Array.isArray(value)) return value.filter((id) => id != null);
  if (value != null) return [value];
  return [];
}

/**
 * True quando i params scelti in UI coprono lo schema risolto.
 * `__limits` non è un parametro: `fragmentCardId` può essere scalare o lista;
 * `composeComponent` non serve se sono già stati scelti due Frammenti.
 */
export function selectionParamsReady(schema, params) {
  if (!schema) return true;
  const fragmentIds = idsFromParam(params?.fragmentCardId);
  return Object.keys(schema).every((key) => {
    if (key === SCHEMA_LIMITS_KEY) return true;
    const values = schema[key];
    if (!Array.isArray(values)) return true;
    if (values.length === 0) return true;
    if (key === 'fragmentCardId') {
      const { min, max } = paramLimits(schema, key);
      return fragmentIds.length >= min && fragmentIds.length <= max;
    }
    if (key === 'composeComponent') {
      if (fragmentIds.length >= 2) return true;
      return params?.composeComponent != null;
    }
    return params?.[key] != null;
  });
}

function resolveSlotIndexes(paramContext) {
  const slots = paramContext?.slots;
  if (Array.isArray(slots) && slots.length) {
    return slots.filter((slot) => !slot.conquered).map((slot) => slot.index);
  }
  const count = Math.max(1, paramContext?.slotCount || 5);
  return Array.from({ length: count }, (_, index) => index);
}

function agentName(cardId) {
  return ALL_AGENTS.find((agent) => agent.id === cardId)?.name || null;
}

function buildAgentParamMeta(paramContext) {
  const meta = {};
  for (const id of paramContext?.ownUndeployedCardIds || []) {
    meta[id] = { side: SIDES.PLAYER, label: agentName(id) };
  }
  for (const id of paramContext?.enemyUndeployedCardIds || []) {
    meta[id] = { side: SIDES.ENEMY, label: agentName(id) };
  }
  for (const entry of paramContext?.confirmedAgents || []) {
    if (entry && typeof entry === 'object' && entry.id != null) {
      meta[entry.id] = {
        side: entry.side,
        label: entry.label || agentName(entry.id) || meta[entry.id]?.label || null,
      };
    }
  }
  return Object.keys(meta).length ? meta : null;
}

function buildSlotParamMeta(paramContext) {
  const slots = paramContext?.slots;
  if (!Array.isArray(slots) || !slots.length) return null;
  const meta = {};
  for (const slot of slots) {
    if (slot.conquered) continue;
    const index = slot.index;
    meta[index] = {
      label: slot.revealed && slot.name ? slot.name : `Campo ${index + 1}`,
      cursed: Boolean(slot.cursed),
    };
  }
  return Object.keys(meta).length ? meta : null;
}

function resolveParamsSchema(schema, persistent, paramContext = null) {
  if (!schema) return null;

  const resolved = {};
  for (const [key, spec] of Object.entries(schema)) {
    if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.OWN_FRAGMENTS) {
      const ids = [...(persistent?.fragmentCardIds || [])];
      resolved[key] = spec.requireTrigger ? ids.filter(agentHasTrigger) : ids;
      if (spec.min != null || spec.max != null) {
        resolved[SCHEMA_LIMITS_KEY] = {
          ...(resolved[SCHEMA_LIMITS_KEY] || {}),
          [key]: { min: spec.min ?? 1, max: spec.max ?? 1 },
        };
      }
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.ENEMY_UNDEPLOYED) {
      const alreadyPrey = new Set(persistent?.preyCardIds || []);
      resolved[key] = (paramContext?.enemyUndeployedCardIds || []).filter((id) => !alreadyPrey.has(id));
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.OWN_UNDEPLOYED) {
      resolved[key] = [...(paramContext?.ownUndeployedCardIds || [])];
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.UNDEPLOYED_AGENTS) {
      const already = new Set(Object.keys(persistent?.debitoByCardId || {}).map(Number));
      const own = paramContext?.ownUndeployedCardIds || [];
      const enemy = paramContext?.enemyUndeployedCardIds || [];
      resolved[key] = [...own, ...enemy].filter((id) => !already.has(id));
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.CONFIRMED_AGENTS) {
      resolved[key] = (paramContext?.confirmedAgents || []).map((entry) => (
        entry && typeof entry === 'object' ? entry.id : entry
      )).filter((id) => id != null);
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.BATTLEFIELD_SLOTS) {
      resolved[key] = resolveSlotIndexes(paramContext);
    } else {
      resolved[key] = spec;
    }
  }
  return resolved;
}

/**
 * Opzioni del lato che sta guardando, con legalità già risolta.
 *
 * La legalità si misura sulla Presenza al **checkpoint di selezione**, non sul contatore
 * corrente: è lo stesso valore che vincola il motore in `selectEminenceAbility`, quindi la
 * UI non può offrire una scelta che poi verrebbe rifiutata (§2.3).
 */
function buildOptions(eminenceId, publicSide, gateProgress, selectedAbilityId, paramContext = null) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return [];

  const legal = new Set(getLegalAbilityIds(eminenceId, publicSide.selectionCheckpointPresence, publicSide.persistent));
  const completed = gateProgress?.completedGates || [];

  return eminence.abilities.map((ability) => {
    const gatePassed = completed.includes(ability.revealGate);
    const affordable = legal.has(ability.id);
    const presenceDelta = resolveAbilityPresenceDelta(ability, publicSide.persistent);

    let blocker = null;
    if (!affordable) blocker = OPTION_BLOCKERS.INSUFFICIENT_PRESENCE;
    else if (gatePassed) blocker = OPTION_BLOCKERS.GATE_PASSED;

    return {
      id: ability.id,
      name: ability.name ?? null,
      nameProvisional: Boolean(ability.nameProvisional),
      text: ability.text,
      presenceDelta,
      presenceCost: Math.max(0, -presenceDelta),
      isGain: presenceDelta >= 0,
      revealGate: ability.revealGate,
      // `[]` è un'abilità implementata che non fa nulla (es. il giallo del Semaforo).
      // `null` è il segnaposto di catalogo per un'attiva ancora senza segmenti.
      implemented: ability.segments != null,
      paramsSchema: resolveParamsSchema(ability.paramsSchema, publicSide.persistent, paramContext),
      choiceParamsTiming: ability.choiceParamsTiming,
      selectable: !blocker,
      blocker,
      selected: selectedAbilityId === ability.id,
    };
  });
}

/**
 * Vista della scelta per un osservatore.
 *
 * @param {object} matchState stato Eminenza completo
 * @param {'player'|'enemy'} viewerSide lato che guarda
 * @returns {{ enabled: boolean, gate: string|null, completedGates: string[],
 *   self: object|null, opponent: object|null }}
 */
export function buildEminenceChoiceView(matchState, viewerSide = SIDES.PLAYER, paramContext = null) {
  if (!isEminenceSubsystemEnabled(matchState)) return DISABLED_VIEW;

  const projected = selectPublicEminenceMatchState(matchState, viewerSide);
  const gateProgress = matchState.gateProgress ?? null;
  const opponentSide = OPPOSITE_SIDE[viewerSide];

  const selfPublic = projected[viewerSide];
  const opponentPublic = projected[opponentSide];

  const selectedAbilityId = selfPublic?.private?.selectedAbilityId ?? null;
  const selfEminence = selfPublic ? getEminence(selfPublic.eminenceId) : null;
  const setupPending = isEminenceSetupPending(matchState, viewerSide);

  return {
    enabled: true,
    roundNumber: matchState.roundNumber ?? null,
    gate: getNextGate(gateProgress),
    gateSequence: gateProgress?.sequence ?? [],
    gateSequenceName: gateProgress?.sequenceName ?? 'FIELD_FIRST',
    completedGates: gateProgress?.completedGates ?? [],
    setupPending: needsEminenceSetup(matchState),
    paramMeta: {
      slot: buildSlotParamMeta(paramContext),
      cardId: buildAgentParamMeta(paramContext),
      leagueDelta: {
        1: { label: '+1 Lega' },
        [-1]: { label: '−1 Lega' },
      },
    },

    self: selfPublic
      ? {
        side: viewerSide,
        eminence: describeEminence(selfPublic.eminenceId),
        presence: selfPublic.presence,
        selectionCheckpointPresence: selfPublic.selectionCheckpointPresence,
        totalPresenceSpent: selfPublic.totalPresenceSpent,
        blocked: selfPublic.blockedThisRound,
        mustChoose: mustChooseThisRound(matchState, viewerSide),
        state: sideState(selfPublic),
        selectedAbilityId,
        selectedParams: selfPublic.private?.selectedParams ?? null,
        revealedAbilityId: selfPublic.revealedAbilityId,
        revealGate: selfPublic.revealGateReached,
        options: buildOptions(selfPublic.eminenceId, selfPublic, gateProgress, selectedAbilityId, paramContext),
        persistent: selfPublic.persistent,
        setup: setupPending || needsEminenceSetup(matchState)
          ? {
            pending: setupPending,
            name: selfEminence?.static?.name ?? null,
            text: selfEminence?.static?.text ?? null,
            paramsSchema: resolveParamsSchema(
              selfEminence?.static?.setupParamsSchema,
              selfPublic.persistent,
              paramContext,
            ),
          }
          : null,
      }
      : null,

    // Proiezione avversaria: nessun campo privato, nessuna opzione marcata come scelta.
    // `hypotheses` è deduzione legittima da stato pubblico (§3.2, §10.4), non una fuga:
    // restringe l'insieme, non lo risolve, e coincide con ciò che vede anche l'IA.
    // Proiezione avversaria: testo e abilità sono pubblici (l'Eminenza è nota dal
    // deckbuilding). La scelta resta coperta: `options` non porta `selected` finché
    // il gate non rivela `revealedAbilityId`.
    opponent: opponentPublic
      ? {
        side: opponentSide,
        eminence: describeEminence(opponentPublic.eminenceId),
        presence: opponentPublic.presence,
        selectionCheckpointPresence: opponentPublic.selectionCheckpointPresence,
        totalPresenceSpent: opponentPublic.totalPresenceSpent,
        blocked: opponentPublic.blockedThisRound,
        state: sideState(opponentPublic),
        hasSealedSelection: opponentPublic.hasSealedSelection,
        revealedAbilityId: opponentPublic.revealedAbilityId,
        revealGate: opponentPublic.revealGateReached,
        hypotheses: getSealedAbilityHypotheses(opponentPublic, gateProgress),
        persistent: opponentPublic.persistent,
        options: buildOptions(
          opponentPublic.eminenceId,
          opponentPublic,
          gateProgress,
          opponentPublic.revealedAbilityId || null,
        ),
      }
      : null,
  };
}

/**
 * Campo e Agenti restano fermi finché le Eminenze non sono in scena.
 *
 * `cinematic` è il tendone R5: la fase è già `selectField` ma le zone non sono montate.
 * `roundPending` è il frame in cui `openEminenceRound` non ha ancora corso per questo round.
 */
export function shouldHoldDuelForEminence({
  awaitingChoice = false,
  announceHold = false,
  cinematic = false,
  roundPending = false,
  setupPending = false,
  markFlightHold = false,
  awaitingRevealParams = false,
} = {}) {
  return Boolean(
    awaitingChoice
    || announceHold
    || cinematic
    || roundPending
    || setupPending
    || markFlightHold
    || awaitingRevealParams,
  );
}

/**
 * Finestra in cui il tabellone accetta la scelta del Campo.
 *
 * Dopo il flush del primo gate, in sequenza Campo-prima il prossimo gate è
 * `PRE_AGENT`: è proprio allora che si sceglie il Campo. Non si può quindi
 * usare “prossimo gate === PRE_AGENT” come divieto — quello spegne il
 * tabellone per ogni Eminenza che non riordina le decisioni.
 */
export function canSelectBattlefield({
  isPlayerFirst = false,
  eminenceBlocked = false,
  gamePhase = null,
  gateSequenceName = 'FIELD_FIRST',
  agentsReady = false,
} = {}) {
  if (!isPlayerFirst || eminenceBlocked) return false;
  if (gateSequenceName === 'AGENTS_FIRST') {
    return gamePhase === 'selectField' && agentsReady;
  }
  return gamePhase === 'selectField' || gamePhase === 'selectAgent';
}

/**
 * GENERAL è l'ultimo gate prima dello scontro: Agenti e Campo devono
 * essere già fissati. Con `AGENTS_FIRST` il Campo arriva dopo il lock
 * Agenti; aprirlo prima salterebbe la scelta (e l'IA non la farebbe).
 */
export function canAdvanceEminenceGeneralGate({
  agentsLocked = false,
  fieldIndex = null,
} = {}) {
  return Boolean(agentsLocked && fieldIndex != null);
}

/** Vero quando la UI deve fermare il gioco e chiedere: c'è una decisione reale da prendere. */
export function isAwaitingEminenceChoice(view) {
  if (!view?.enabled || !view.self) return false;
  if (view.setupPending) return false;
  if (!view.self.mustChoose) return false;
  if (view.self.selectedAbilityId) return false;
  return view.self.options.some((option) => option.selectable);
}

/**
 * Bersaglio fissato al reveal: l'abilità è già sigillata, ma le opzioni
 * (Agenti confermati) esistono solo dopo il lock di entrambi i lati.
 */
export function isAwaitingRevealParams(view) {
  if (!view?.enabled || !view.self?.selectedAbilityId) return false;
  if (view.self.revealedAbilityId) return false;
  const option = view.self.options?.find((entry) => entry.id === view.self.selectedAbilityId);
  if (!option || option.choiceParamsTiming !== CHOICE_PARAMS_TIMING.AT_REVEAL) return false;
  const schema = option.paramsSchema;
  if (!schema) return false;
  const hasChoices = Object.keys(schema).some((key) => (
    key !== SCHEMA_LIMITS_KEY && Array.isArray(schema[key]) && schema[key].length > 0
  ));
  if (!hasChoices) return false;
  return !selectionParamsReady(schema, view.self.selectedParams);
}

/**
 * Le losanghe sono la UI della scelta, non un riepilogo dell'avviso.
 *
 * Restano chiuse mentre un messaggio è in scena, e dopo il lock non tornano da sole:
 * solo un peek esplicito le riapre per consultazione.
 */
export function shouldShowEminenceAbilityRail(view, {
  announcing = false,
  peeking = false,
  side = null,
  markFlightHold = false,
} = {}) {
  if (announcing) return false;
  if (markFlightHold) {
    if (side && side !== view.self?.side) return false;
    return true;
  }
  if (view?.setupPending) {
    if (side && side !== view.self?.side) return false;
    return Boolean(view.self?.setup?.pending) || peeking;
  }
  if (isAwaitingEminenceChoice(view)) return true;
  return Boolean(peeking);
}

/**
 * Durante un avviso la scena è solo messaggi: una zona esiste solo se quel lato
 * ha un messaggio. Durante il setup, dopo l'avviso, resta solo chi deve
 * scegliere il bersaglio: l'altra Eminenza entra dopo la chiusura.
 */
export function shouldShowEminenceSideZone({
  layerVisible = false,
  announcing = false,
  hasNotice = false,
  setupPending = false,
  isSetupActor = false,
  concealForEnemyHandRead = false,
  markFlightHold = false,
} = {}) {
  if (!layerVisible) return false;
  if (announcing) return Boolean(hasNotice);
  if (setupPending || markFlightHold) return Boolean(isSetupActor);
  if (concealForEnemyHandRead) return false;
  return true;
}

function schemaSelectsEnemyUndeployed(schema) {
  return (Array.isArray(schema?.preyCardId) && schema.preyCardId.length > 0)
    || (Array.isArray(schema?.cardId) && schema.cardId.length > 0);
}

function schemaSelectsFragments(schema) {
  return Array.isArray(schema?.fragmentCardId) && schema.fragmentCardId.length > 0;
}

/**
 * Il drop sotto la losanga è solo per i Frammenti.
 * Preda e slot usano le chip in riga, come il +0.
 */
export function abilityRailExpandsDown(schema, { isLastOption = false } = {}) {
  return Boolean(isLastOption && schemaSelectsFragments(schema));
}

function schemaOfChoice(view, draftId = null) {
  if (view?.self?.setup?.pending) return view.self.setup.paramsSchema || null;
  const pick = draftId || view?.self?.selectedAbilityId;
  return view?.self?.options?.find((entry) => entry.id === pick)?.paramsSchema || null;
}

export function legalPreyIdsForChoice(view, { draftId = null } = {}) {
  const schema = schemaOfChoice(view, draftId);
  return Array.isArray(schema?.preyCardId) ? schema.preyCardId : [];
}

export function legalCardIdsForChoice(view, { draftId = null } = {}) {
  const schema = schemaOfChoice(view, draftId);
  return Array.isArray(schema?.cardId) ? schema.cardId : [];
}

export function legalFragmentIdsForChoice(view, { draftId = null } = {}) {
  const schema = schemaOfChoice(view, draftId);
  return Array.isArray(schema?.fragmentCardId) ? schema.fragmentCardId : [];
}

export function legalSlotIndicesForChoice(view, { draftId = null } = {}) {
  const schema = schemaOfChoice(view, draftId);
  return Array.isArray(schema?.slot) ? schema.slot : [];
}

/**
 * Durante la scelta di una Preda le carte avversarie devono restare leggibili:
 * il velo Eminenza non può offuscarle.
 */
export function shouldRevealEnemyHandForEminenceChoice(view, {
  announcing = false,
  draftId = null,
} = {}) {
  if (announcing) return false;
  return schemaSelectsEnemyUndeployed(schemaOfChoice(view, draftId));
}

export function shouldRevealBoardForEminenceChoice(view, {
  announcing = false,
  draftId = null,
} = {}) {
  if (announcing) return false;
  const schema = schemaOfChoice(view, draftId);
  return Array.isArray(schema?.slot) && schema.slot.length > 0;
}

/**
 * La zona mano sostituisce il ventaglio finché la propria scelta non è sigillata, o finché
 * si resta in attesa di quella avversaria. Dopo entrambi i lock il tavolo torna al Campo.
 */
export function shouldShowEminenceLayer(view, { gamePhase } = {}) {
  if (!view?.enabled || !view.self) return false;
  if (gamePhase && gamePhase !== 'selectField') return false;

  if (view.setupPending) return true;

  const selfChoosing = view.self.state === CHOICE_STATES.CHOOSING && view.self.mustChoose;
  const waitingOnOpponent =
    view.self.state === CHOICE_STATES.LOCKED_HIDDEN
    && view.opponent?.state === CHOICE_STATES.CHOOSING;

  return selfChoosing || waitingOnOpponent;
}

const INSPECTABLE_PHASES = new Set(['selectField', 'selectAgent']);

/** Il duello ha un'Eminenza e il tavolo è ancora consultabile (campo o agente). */
export function isEminenceTableInspectable(view, gamePhase) {
  if (!view?.enabled || !view.self?.eminence) return false;
  return INSPECTABLE_PHASES.has(gamePhase);
}

/** Vista tavolo: il tasto è un peek, non un passo della sequenza. */
export function resolveEminenceChromeVisible({ forced, peekCampo, peekEminence, inspectable }) {
  if (forced) return !peekCampo;
  return Boolean(inspectable && peekEminence);
}

export { REVEAL_GATES };
