// Logica pura per lo stepper pipeline del System Lab Eminenza.
// Usa lo stesso motore di acceptance/duel gate — nessun ramo per carta.

import {
  REVEAL_GATES,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES,
  PRIMITIVE_TARGETS,
  PRIMITIVE_ALLOWED_TARGETS,
  GATE_SEQUENCES,
  SIDES,
} from '../../game/eminence/eminenceConstants.js';
import { CONDITION_KEYS } from '../../game/eminence/effectConditions.js';
import { EMINENCES, IMPLEMENTED_EMINENCE_IDS } from '../../data/eminences.js';
import { createEminenceMatchState } from '../../game/eminence/eminenceState.js';
import { selectEminenceAbility, getNextGate } from '../../game/eminence/eminenceRound.js';
import {
  openEminenceRound,
  advanceToNextRevealGate,
  settleEminenceRound,
  prepareEminenceDuel,
} from '../../game/eminence/eminenceDuelGate.js';
import { resolveNoticeCinematics, CINEMATIC_RECIPES } from '../../game/eminence/eminenceCinematics.js';
import {
  ANNOUNCE_PHASES,
  PHASE_LABELS,
  PHASE_COLORS,
  GATE_LABELS,
} from '../../game/eminence/eminenceAnnounceLabels.js';

export {
  REVEAL_GATES,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES,
  PRIMITIVE_TARGETS,
  PRIMITIVE_ALLOWED_TARGETS,
  GATE_SEQUENCES,
  CONDITION_KEYS,
  CINEMATIC_RECIPES,
  ANNOUNCE_PHASES,
  PHASE_LABELS,
  PHASE_COLORS,
  GATE_LABELS,
  IMPLEMENTED_EMINENCE_IDS,
};

export const PIPELINE_STEPS = [
  { id: 'open', label: 'Apri round', detail: 'openEminenceRound · Statici ROUND_START' },
  { id: 'choose', label: 'Scelta segreta', detail: 'selectEminenceAbility · checkpoint Presenza' },
  { id: 'gate', label: 'Gate reveal', detail: 'advanceToNextRevealGate · PRE_FIELD / PRE_AGENT / GENERAL' },
  { id: 'prepare', label: 'Prepara Duello', detail: 'prepareEminenceDuel · overlay trigger + stats' },
  { id: 'settle', label: 'Settle esito', detail: 'settleEminenceRound · AFTER_DUEL_OUTCOME+' },
];

export const STANDARD_DOCS = [
  {
    id: 'axes',
    title: 'Due assi (reveal ≠ timing)',
    body: 'revealGate decide quando l’abilità diventa pubblica. timing sul segmento decide quando l’effetto si risolve. Non coincidono (es. Calibri −4: GENERAL → BEFORE_CONQUEST).',
  },
  {
    id: 'ricarica',
    title: 'Slot di ricarica (§11.9)',
    body: 'Ogni opzione non negativa deve agire sul tavolo oppure essere una scommessa reale. «Se [osservazione], +N Presenza» senza decisione è grammatica da Statico, non da scelta di round.',
  },
  {
    id: 'snapshot',
    title: 'PRESENCE_SNAPSHOT (§8.1.1)',
    body: 'Un guadagno di Presenza si risolve al primo checkpoint in cui la condizione è conoscibile. Pre-snapshot può accendere Digiuno/Grazia nello stesso Duello; post-esito no.',
  },
  {
    id: 'curva',
    title: 'Forma della curva (§11.10)',
    body: 'Invarianti: esattamente una opzione non negativa (salvo eccezioni documentate); top raggiungibile ≤2 volte per Scontro. I valori nominali restano eterogenei.',
  },
  {
    id: 'cinematics',
    title: 'Scintille (ricette)',
    body: 'resolveNoticeCinematics traduce fase + payoffs in ricette. Nessun if (eminenceId). Una sola Eminenza in scena per volta nella coda avvisi.',
  },
  {
    id: 'copy',
    title: 'Copy guide',
    body: 'Niente prefisso NomeAbilità:, stat maiuscole, (min N) come le carte Agente, lista lint da IMPLEMENTED_EMINENCE_IDS.',
  },
];

function abilityOptions(eminenceId) {
  const eminence = EMINENCES[eminenceId];
  return (eminence?.abilities || []).map((ability) => ({
    id: ability.id,
    name: ability.name,
    presenceDelta: ability.presenceDelta,
    revealGate: ability.revealGate,
    text: ability.text,
    implemented: ability.segments != null,
  }));
}

export function listLabEminences() {
  return IMPLEMENTED_EMINENCE_IDS.map((id) => {
    const eminence = EMINENCES[id];
    const deltas = (eminence.abilities || []).map((a) => a.presenceDelta);
    const nonNeg = deltas.filter((d) => d >= 0).length;
    const rechargeDebt = (eminence.abilities || []).filter((a) => {
      if (a.presenceDelta < 0) return false;
      const segs = a.segments || [];
      const onlyPresence = segs.length > 0 && segs.every((s) => s.primitive === 'CHANGE_PRESENCE');
      const inertShape = onlyPresence || (segs.length === 1 && segs[0]?.condition && segs[0]?.primitive === 'CHANGE_PRESENCE');
      return inertShape;
    }).map((a) => a.name);
    return {
      id,
      name: eminence.name,
      army: eminence.army,
      initialPresence: eminence.initialPresence,
      curve: deltas,
      nonNegativeSlots: nonNeg,
      staticName: eminence.static?.name || null,
      abilities: abilityOptions(id),
      rechargeDebt,
    };
  });
}

function snapshotSide(state, side) {
  const s = state?.[side];
  if (!s) return null;
  return {
    eminenceId: s.eminenceId,
    presence: s.presence,
    selectedAbilityId: s.selectedAbilityId,
    revealedAbilityId: s.revealedAbilityId,
    persistent: {
      prey: s.persistent?.preyCardIds || [],
      fragments: s.persistent?.fragmentCardIds || [],
      slotCurses: Object.keys(s.persistent?.slotCurses || {}),
    },
  };
}

function describeNotices(notices = []) {
  return notices.map((notice) => ({
    id: notice.id,
    side: notice.side,
    kind: notice.kind,
    name: notice.name,
    text: notice.text,
    phase: notice.phase,
    phaseLabel: notice.phaseLabel,
    phaseColor: notice.phaseColor,
    presenceDelta: notice.presenceDelta,
    payoffs: notice.payoffs || [],
    recipes: resolveNoticeCinematics(notice, {
      accents: { player: '#c9e238', enemy: '#c9e238' },
      agentsDeployed: { player: true, enemy: true },
    }).map((cue) => cue.recipe),
  }));
}

function summarizeBundle(bundle) {
  if (!bundle) return null;
  return {
    presenceChanges: bundle.presenceChanges || [],
    hpDeltas: bundle.hpDeltas || [],
    slotModifiers: (bundle.slotModifiers || []).length,
    marks: (bundle.marks || []).length,
    fieldOperations: (bundle.fieldOperations || []).length,
    logs: (bundle.logs || []).map((l) => l.primitive),
  };
}

export function createLabSession({
  playerEminenceId,
  enemyEminenceId,
  roundNumber = 3,
  initiativeSide = SIDES.PLAYER,
} = {}) {
  const base = createEminenceMatchState({ playerEminenceId, enemyEminenceId });
  return {
    matchState: base,
    roundNumber,
    initiativeSide,
    phase: 'idle',
    history: [],
    lastNotices: [],
    lastBundle: null,
    lastGate: null,
    error: null,
  };
}

function pushHistory(session, entry) {
  return {
    ...session,
    history: [...session.history, { at: Date.now(), ...entry }],
  };
}

export function labOpenRound(session) {
  try {
    const { matchState, bundle, appliedEffects } = openEminenceRound(session.matchState, {
      roundNumber: session.roundNumber,
      initiativeSide: session.initiativeSide,
    });
    const notices = []; // open returns appliedEffects; noticesFromRoundStart is UI-layer
    return pushHistory({
      ...session,
      matchState,
      phase: 'opened',
      lastBundle: summarizeBundle(bundle),
      lastNotices: notices,
      lastGate: null,
      error: null,
      appliedEffects: appliedEffects || [],
    }, {
      step: 'open',
      label: `Round ${session.roundNumber} aperto`,
      nextGate: getNextGate(matchState.gateProgress),
      bundle: summarizeBundle(bundle),
      appliedEffects,
    });
  } catch (err) {
    return { ...session, error: err.message || String(err) };
  }
}

export function labChooseAbilities(session, { playerAbility, enemyAbility, playerParams = null, enemyParams = null }) {
  try {
    let matchState = session.matchState;
    const p = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility, playerParams);
    if (!p.ok) return { ...session, error: `Player: ${p.reason}` };
    const e = selectEminenceAbility(p.matchState, SIDES.ENEMY, enemyAbility, enemyParams);
    if (!e.ok) return { ...session, error: `Enemy: ${e.reason}` };
    matchState = e.matchState;
    return pushHistory({
      ...session,
      matchState,
      phase: 'chosen',
      error: null,
      lastNotices: [],
    }, {
      step: 'choose',
      label: `${playerAbility} vs ${enemyAbility}`,
      player: snapshotSide(matchState, SIDES.PLAYER),
      enemy: snapshotSide(matchState, SIDES.ENEMY),
      nextGate: getNextGate(matchState.gateProgress),
    });
  } catch (err) {
    return { ...session, error: err.message || String(err) };
  }
}

export function labAdvanceGate(session, duelOpts = {}) {
  try {
    const nextGate = getNextGate(session.matchState.gateProgress);
    if (!nextGate) {
      return { ...session, error: 'Nessun gate rimanente — passa a Prepara / Settle.' };
    }
    const result = advanceToNextRevealGate(session.matchState, {
      initiativeSide: session.initiativeSide,
      announceDeployedMarks: nextGate === REVEAL_GATES.GENERAL,
      agentIdBySide: duelOpts.agentIdBySide || { player: 1, enemy: 2 },
      focusInvestedBySide: duelOpts.focusInvestedBySide || { player: 2, enemy: 2 },
      leagueBySide: duelOpts.leagueBySide || { player: 3, enemy: 3 },
    });
    if (result.blocked) {
      return { ...session, error: `Gate bloccato: ${result.blocked}` };
    }
    return pushHistory({
      ...session,
      matchState: result.matchState,
      phase: `gate:${result.gate}`,
      lastGate: result.gate,
      lastNotices: describeNotices(result.notices || []),
      lastBundle: summarizeBundle(result.bundle),
      error: null,
    }, {
      step: 'gate',
      gate: result.gate,
      gateLabel: GATE_LABELS[result.gate] || result.gate,
      notices: describeNotices(result.notices || []),
      bundle: summarizeBundle(result.bundle),
      nextGate: getNextGate(result.matchState.gateProgress),
      player: snapshotSide(result.matchState, SIDES.PLAYER),
      enemy: snapshotSide(result.matchState, SIDES.ENEMY),
    });
  } catch (err) {
    return { ...session, error: err.message || String(err) };
  }
}

export function labPrepareDuel(session) {
  try {
    const prepared = prepareEminenceDuel(session.matchState, {
      initiativeSide: session.initiativeSide,
      agentIdBySide: { player: 1, enemy: 2 },
    });
    return pushHistory({
      ...session,
      matchState: prepared.matchState ?? session.matchState,
      phase: 'prepared',
      lastBundle: summarizeBundle(prepared.bundle),
      error: null,
    }, {
      step: 'prepare',
      label: 'Overlay trigger / stats pronti per il Duello',
      bundle: summarizeBundle(prepared.bundle),
      triggerRules: prepared.bundle?.triggerRules ? 'presenti' : 'assenti',
    });
  } catch (err) {
    return { ...session, error: err.message || String(err) };
  }
}

export function labSettle(session, {
  winner = SIDES.PLAYER,
  powerResolvedBySide = { player: true, enemy: false },
  activatedTriggerBySide = { player: null, enemy: null },
} = {}) {
  try {
    const result = settleEminenceRound(session.matchState, {
      initiativeSide: session.initiativeSide,
      winner,
      powerResolvedBySide,
      activatedTriggerBySide,
    });
    return pushHistory({
      ...session,
      matchState: result.matchState,
      phase: 'settled',
      lastNotices: describeNotices(result.notices || []),
      lastBundle: summarizeBundle(result.bundle),
      error: null,
    }, {
      step: 'settle',
      winner,
      notices: describeNotices(result.notices || []),
      bundle: summarizeBundle(result.bundle),
      player: snapshotSide(result.matchState, SIDES.PLAYER),
      enemy: snapshotSide(result.matchState, SIDES.ENEMY),
    });
  } catch (err) {
    return { ...session, error: err.message || String(err) };
  }
}

export function sessionView(session) {
  if (!session) return null;
  return {
    phase: session.phase,
    roundNumber: session.roundNumber,
    nextGate: getNextGate(session.matchState?.gateProgress),
    gateProgress: session.matchState?.gateProgress || null,
    player: snapshotSide(session.matchState, SIDES.PLAYER),
    enemy: snapshotSide(session.matchState, SIDES.ENEMY),
    lastGate: session.lastGate,
    lastNotices: session.lastNotices,
    lastBundle: session.lastBundle,
    history: session.history,
    error: session.error,
  };
}

/** Audit invarianti di design sul catalogo implementato. */
export function auditImplementedStandards() {
  const rows = [];
  for (const entry of listLabEminences()) {
    const issues = [];
    if (entry.nonNegativeSlots !== 1) {
      issues.push(`slot non-negativi: ${entry.nonNegativeSlots} (invariante ideale = 1)`);
    }
    if (entry.rechargeDebt.length) {
      issues.push(`ricarica inerte sospetta: ${entry.rechargeDebt.join(', ')}`);
    }
    rows.push({
      id: entry.id,
      name: entry.name,
      army: entry.army,
      curve: entry.curve,
      ok: issues.length === 0,
      issues,
    });
  }
  return rows;
}
