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

import { SIDES, OPPOSITE_SIDE, REVEAL_GATES } from './eminenceConstants.js';
import { getEminence } from '../../data/eminences.js';
import {
  isEminenceSubsystemEnabled,
  selectPublicEminenceMatchState,
  getLegalAbilityIds,
} from './eminenceState.js';
import { getSealedAbilityHypotheses, getNextGate, mustChooseThisRound } from './eminenceRound.js';

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

/**
 * Opzioni del lato che sta guardando, con legalità già risolta.
 *
 * La legalità si misura sulla Presenza al **checkpoint di selezione**, non sul contatore
 * corrente: è lo stesso valore che vincola il motore in `selectEminenceAbility`, quindi la
 * UI non può offrire una scelta che poi verrebbe rifiutata (§2.3).
 */
function buildOptions(eminenceId, publicSide, gateProgress, selectedAbilityId) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return [];

  const legal = new Set(getLegalAbilityIds(eminenceId, publicSide.selectionCheckpointPresence));
  const completed = gateProgress?.completedGates || [];

  return eminence.abilities.map((ability) => {
    const gatePassed = completed.includes(ability.revealGate);
    const affordable = legal.has(ability.id);

    let blocker = null;
    if (!affordable) blocker = OPTION_BLOCKERS.INSUFFICIENT_PRESENCE;
    else if (gatePassed) blocker = OPTION_BLOCKERS.GATE_PASSED;

    return {
      id: ability.id,
      name: ability.name ?? null,
      nameProvisional: Boolean(ability.nameProvisional),
      text: ability.text,
      presenceDelta: ability.presenceDelta,
      presenceCost: Math.max(0, -ability.presenceDelta),
      isGain: ability.presenceDelta >= 0,
      revealGate: ability.revealGate,
      // `[]` è un'abilità implementata che non fa nulla (es. il giallo del Semaforo).
      // `null` è il segnaposto di catalogo per un'attiva ancora senza segmenti.
      implemented: ability.segments != null,
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
export function buildEminenceChoiceView(matchState, viewerSide = SIDES.PLAYER) {
  if (!isEminenceSubsystemEnabled(matchState)) return DISABLED_VIEW;

  const projected = selectPublicEminenceMatchState(matchState, viewerSide);
  const gateProgress = matchState.gateProgress ?? null;
  const opponentSide = OPPOSITE_SIDE[viewerSide];

  const selfPublic = projected[viewerSide];
  const opponentPublic = projected[opponentSide];

  const selectedAbilityId = selfPublic?.private?.selectedAbilityId ?? null;

  return {
    enabled: true,
    roundNumber: matchState.roundNumber ?? null,
    gate: getNextGate(gateProgress),
    gateSequence: gateProgress?.sequence ?? [],
    completedGates: gateProgress?.completedGates ?? [],

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
        revealedAbilityId: selfPublic.revealedAbilityId,
        revealGate: selfPublic.revealGateReached,
        options: buildOptions(selfPublic.eminenceId, selfPublic, gateProgress, selectedAbilityId),
        persistent: selfPublic.persistent,
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

/** Vero quando la UI deve fermare il gioco e chiedere: c'è una decisione reale da prendere. */
export function isAwaitingEminenceChoice(view) {
  if (!view?.enabled || !view.self) return false;
  if (!view.self.mustChoose) return false;
  if (view.self.selectedAbilityId) return false;
  return view.self.options.some((option) => option.selectable);
}

/**
 * La zona mano sostituisce il ventaglio finché la propria scelta non è sigillata, o finché
 * si resta in attesa di quella avversaria. Dopo entrambi i lock il tavolo torna al Campo.
 */
export function shouldShowEminenceLayer(view, { gamePhase } = {}) {
  if (!view?.enabled || !view.self) return false;
  if (gamePhase && gamePhase !== 'selectField') return false;

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
