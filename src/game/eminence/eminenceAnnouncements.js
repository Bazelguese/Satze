// ============================================
// EMINENZE — Avvisi pubblici di Statico, reveal ed effetti
// ============================================
//
// Lo Statico non passa da un gate: o è sempre in vigore (riordino delle decisioni)
// o scatta a un checkpoint se la sua condizione è vera. Le attive diventano pubbliche
// solo quando `completeGate` emette un evento REVEAL. Questo modulo traduce quei fatti
// in avvisi per la zona mano, senza conoscere i nomi delle Eminenze.

import { EFFECT_TIMINGS, SIDES } from './eminenceConstants.js';
import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { createSideMarkContext } from './eminenceRound.js';
import { matchesCondition } from './effectConditions.js';
import { enrichNotice } from './eminenceAnnounceLabels.js';

export { ANNOUNCE_PHASES, PHASE_COLORS, PHASE_LABELS, GATE_LABELS, enrichNotice, enrichNotices } from './eminenceAnnounceLabels.js';

const BOTH_SIDES = [SIDES.PLAYER, SIDES.ENEMY];

/** Tempo di permanenza dell'avviso prima della chiusura automatica. */
export const EMINENCE_ANNOUNCE_HOLD_MS = 10000;

/** Checkpoint in cui l'effetto non esiste ancora: un avviso al reveal sarebbe vuoto. */
const POST_DUEL_TIMINGS = new Set([
  EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
  EFFECT_TIMINGS.BEFORE_CONQUEST,
  EFFECT_TIMINGS.POST_BATTLE,
  EFFECT_TIMINGS.END_ROUND,
  EFFECT_TIMINGS.END_MATCH,
]);

const PARAM_VALUE_LABELS = {
  VITTORIA_PROPRIA: 'la propria vittoria',
  VITTORIA_AVVERSARIA: 'la vittoria avversaria',
  PAREGGIO: 'il pareggio',
};

const PUBLIC_MARK_KEYS = new Set(['deployedMarks', 'ownMarks', 'enemyMarks']);

const MARK_RESOLUTION = {
  prey: {
    hit: 'Una Preda è schierata',
    miss: 'Nessuna Preda schierata',
  },
};

function formatPresenceDelta(delta) {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '±0';
}

function formatChosenParams(params) {
  if (!params || typeof params !== 'object') return '';
  if (params.slot != null && params.slot !== '') {
    return `Campo ${Number(params.slot) + 1}`;
  }
  return Object.values(params)
    .map((value) => PARAM_VALUE_LABELS[value] ?? '')
    .filter(Boolean)
    .join(', ');
}

function revealNoticeText(ability, params) {
  const base = ability?.text ?? '';
  const placement = formatChosenParams(params);
  if (!placement) return base;
  if (params?.slot != null) return `${base} ${placement}.`.replace(/\.\s*\./, '.');
  return base;
}

function isPublicMarkCondition(condition) {
  if (!condition || typeof condition !== 'object') return false;
  const keys = Object.keys(condition);
  return keys.length > 0 && keys.every((key) => PUBLIC_MARK_KEYS.has(key));
}

function canEvaluateCondition(condition, context) {
  if (!condition || !context) return false;
  return Object.keys(condition).every((key) => key in context);
}

function markNameFromCondition(condition) {
  for (const key of PUBLIC_MARK_KEYS) {
    const expected = condition?.[key];
    if (expected && typeof expected === 'object' && expected.has) return expected.has;
  }
  return null;
}

function describeMarkResolution(condition, hit) {
  const mark = markNameFromCondition(condition);
  const copy = MARK_RESOLUTION[mark];
  if (copy) return hit ? copy.hit : copy.miss;
  return hit ? 'Condizione soddisfatta' : 'Condizione non soddisfatta';
}

function describeConditionResolution(condition, hit) {
  if (!condition) return null;
  if (isPublicMarkCondition(condition)) return describeMarkResolution(condition, hit);

  const mark = markNameFromCondition(condition);
  const relative = condition.duelWinnerRelative;
  if (mark === 'prey' && relative === 'opponent') {
    return hit ? 'Sconfitta contro una Preda' : 'Nessuna sconfitta contro una Preda';
  }
  if (mark === 'prey' && relative === 'self') {
    return hit ? 'Vittoria contro una Preda' : 'Nessuna vittoria contro una Preda';
  }
  if (condition.ownActivatedTrigger === 'overdrive') {
    return hit ? 'Overdrive attivato' : 'Overdrive non attivato';
  }
  if (condition.ownPowerResolved === true) {
    return hit ? 'Il Potere si è attivato' : 'Il Potere non si è attivato';
  }
  if (condition.ownAnchored === false) {
    return hit ? "L'Agente non è Ancorato" : "L'Agente è Ancorato";
  }
  if (condition.ownAnchored === true) {
    return hit ? "L'Agente è Ancorato" : "L'Agente non è Ancorato";
  }
  return null;
}

function formatPayoff(segment) {
  if (!segment) return '';
  if (segment.primitive === 'CHANGE_PRESENCE' && typeof segment.delta === 'number' && segment.delta !== 0) {
    return `${formatPresenceDelta(segment.delta)} Presenza`;
  }
  if (segment.primitive === 'SET_ARMY_BONUS_STATE') {
    return 'Bonus d\'Armata attivo e non bloccabile';
  }
  if (segment.primitive === 'HEAL_HP' && segment.amount) {
    return `Cura ${segment.amount} PV`;
  }
  return '';
}

function resolutionText(segment, hit) {
  const reason = describeConditionResolution(segment?.condition, hit);
  if (!reason) return null;
  const payoff = formatPayoff(segment);
  if (hit && payoff) return `${reason}: ${payoff}.`;
  if (hit) return `${reason}.`;
  return `${reason}.`;
}

function conditionHasPublicMark(condition) {
  if (!condition || typeof condition !== 'object') return false;
  return Object.keys(condition).some((key) => PUBLIC_MARK_KEYS.has(key));
}

function publicMarkContext(matchState, side, agentIdBySide) {
  if (!agentIdBySide?.[SIDES.PLAYER] || !agentIdBySide?.[SIDES.ENEMY]) return null;
  const foe = side === SIDES.PLAYER ? SIDES.ENEMY : SIDES.PLAYER;
  return createSideMarkContext(
    matchState?.[side]?.persistent,
    agentIdBySide[side],
    agentIdBySide[foe],
  );
}

function firstPublicMarkPayoff(ability) {
  return (ability?.segments || []).find((segment) => (
    isPublicMarkCondition(segment?.condition) && !POST_DUEL_TIMINGS.has(segment.timing)
  )) || null;
}

function sourceFields(eminence) {
  return {
    sourceName: eminence?.name ?? null,
    sourceArmy: eminence?.army ?? null,
  };
}

/** Payoff visivi per le scintille: primitive + bersaglio, senza nomi di Eminenza. */
export function cinematicPayoffsFromSegments(segments, params = null) {
  const slot = params?.slot != null && params.slot !== '' ? Number(params.slot) : null;
  return (segments || [])
    .filter((segment) => segment?.primitive)
    .map((segment) => ({
      primitive: segment.primitive,
      target: segment.target ?? null,
      slot: Number.isFinite(slot) ? slot : null,
    }));
}

function staticNotice(side, eminence, staticDef, roundNumber, kind = 'static', { staticMode = 'always', payoffs = null } = {}) {
  return enrichNotice({
    id: `${kind}:${side}:${staticDef.id}:${roundNumber}`,
    side,
    kind,
    name: staticDef.name,
    text: staticDef.text,
    presenceDelta: null,
    roundNumber: typeof roundNumber === 'number' ? roundNumber : null,
    staticMode,
    payoffs: payoffs || cinematicPayoffsFromSegments(staticDef.segments || staticDef.setupSegments),
    ...sourceFields(eminence),
  });
}

function preDuelSegments(ability) {
  return (ability?.segments || []).filter((segment) => !POST_DUEL_TIMINGS.has(segment.timing));
}

function preDuelConditionsAreEvaluable(ability, evalContext) {
  if (!evalContext) return false;
  const pre = preDuelSegments(ability);
  return pre.length > 0 && pre.every((segment) => (
    segment.condition && canEvaluateCondition(segment.condition, evalContext)
  ));
}

/**
 * Un'abilità si annuncia al reveal solo se ha almeno un segmento che esiste
 * prima della fine del Duello. Se tutti i segmenti sono post-Duello, l'avviso
 * nasce quando (e se) l'effetto scatta davvero.
 *
 * Se ogni segmento pre-Duello ha una condizione già valutabile (`evalContext`),
 * il reveal resta muto: parla l'esito del controllo, non la formula.
 */
export function abilityAnnouncesAtReveal(ability, evalContext = null) {
  const segments = ability?.segments;
  if (!Array.isArray(segments) || segments.length === 0) return true;
  const pre = preDuelSegments(ability);
  if (!pre.length) return false;
  if (preDuelConditionsAreEvaluable(ability, evalContext)) return false;
  return true;
}

/** Un segmento condizionale si annuncia di nuovo quando (e se) matura davvero. */
function segmentAnnouncesWhenApplied(ability, entry, evalContext = null) {
  if (preDuelConditionsAreEvaluable(ability, evalContext)) return false;
  if (!abilityAnnouncesAtReveal(ability)) return true;
  return Boolean(entry?.segment?.condition);
}

/**
 * Avvisi da mostrare quando lo Statico di setup è ancora da risolvere.
 *
 * La sequenza UI è: attivazione (questo avviso) → scelta del bersaglio →
 * chiusura. Non vanno emessi dopo il reveal: a quel punto il lock è già fatto.
 */
export function noticesFromSetupPending(matchState) {
  if (matchState?.setupRevealed) return [];
  const notices = [];
  for (const side of BOTH_SIDES) {
    const state = matchState?.[side];
    if (state?.setupCommitted) continue;
    const eminence = getEminence(state?.eminenceId);
    const staticDef = eminence?.static;
    if (!staticDef?.setupChoice || !staticDef.implemented) continue;
    notices.push(staticNotice(side, eminence, staticDef, 'setup', 'setup'));
  }
  return notices;
}

/**
 * Avvisi da mostrare all'apertura del round.
 *
 * - Uno Statico con `reordersGateSequence` è in vigore ogni round: l'avviso è il
 *   segnale visibile che quella regola sta cambiando l'ordine delle decisioni.
 * - Uno Statico a segmenti compare solo se almeno un segmento è davvero maturato
 *   al checkpoint (`appliedEffects`), cioè se la sua condizione era vera.
 */
export function noticesFromRoundStart(matchState, appliedEffects = []) {
  const fired = new Set(
    (appliedEffects || [])
      .filter((entry) => entry?.isStatic && entry.ownerSide)
      .map((entry) => `${entry.ownerSide}:${entry.abilityId}`),
  );

  const notices = [];
  const roundNumber = matchState?.roundNumber ?? 0;

  for (const side of BOTH_SIDES) {
    const eminence = getEminence(matchState?.[side]?.eminenceId);
    const staticDef = eminence?.static;
    if (!staticDef?.implemented) continue;

    const alwaysOn = Boolean(eminence.reordersGateSequence);
    const didFire = fired.has(`${side}:${staticDef.id}`);
    if (!alwaysOn && !didFire) continue;

    const firedEntry = (appliedEffects || []).find((entry) => (
      entry?.isStatic && entry.ownerSide === side && entry.abilityId === staticDef.id
    ));
    notices.push(staticNotice(side, eminence, staticDef, roundNumber, 'static', {
      staticMode: alwaysOn ? 'always' : 'triggered',
      payoffs: cinematicPayoffsFromSegments(staticDef.segments, firedEntry?.params),
    }));
  }

  return notices;
}

function outcomeNoticeFromEvaluableReveal(event, ability, eminence, evalContext) {
  const segment = preDuelSegments(ability).find((entry) => (
    entry.condition && canEvaluateCondition(entry.condition, evalContext)
  ));
  if (!segment) return null;
  const hit = matchesCondition(segment.condition, evalContext);
  const delta = hit && segment.primitive === 'CHANGE_PRESENCE' ? segment.delta : null;
  return enrichNotice({
    id: `effect:${event.side}:${event.abilityId}:${segment.timing}:${hit ? 'hit' : 'miss'}`,
    side: event.side,
    kind: 'effect',
    origin: 'reveal_check',
    outcome: hit ? 'hit' : 'miss',
    timing: segment.timing,
    gate: event.gate ?? null,
    name: ability.name,
    text: resolutionText(segment, hit),
    presenceDelta: typeof delta === 'number' ? delta : null,
    payoffs: cinematicPayoffsFromSegments([segment], event.params),
    ...sourceFields(eminence),
  });
}

/**
 * Avvisi dalle aperture di commitment prodotte da un gate.
 *
 * Di default è la formula (la condizione non è ancora decidibile). Se
 * `evalContextBySide` rende valutabile ogni segmento pre-Duello, l'avviso
 * è già l'esito del controllo — non un'anteprima da ripetere dopo.
 */
export function noticesFromRevealEvents(events = [], options = {}) {
  const evalContextBySide = options.evalContextBySide ?? null;
  return events
    .filter((event) => event?.type === 'REVEAL')
    .map((event) => {
      const eminence = getEminence(event.eminenceId);
      const ability = getEminenceAbility(event.eminenceId, event.abilityId);
      const evalContext = evalContextBySide?.[event.side] ?? null;
      if (preDuelConditionsAreEvaluable(ability, evalContext)) {
        return outcomeNoticeFromEvaluableReveal(event, ability, eminence, evalContext);
      }
      if (!abilityAnnouncesAtReveal(ability, evalContext)) return null;
      return enrichNotice({
        id: `reveal:${event.side}:${event.abilityId}:${event.gate}`,
        side: event.side,
        kind: 'reveal',
        outcome: null,
        gate: event.gate ?? null,
        name: ability?.name ?? event.abilityId,
        text: revealNoticeText(ability, event.params),
        presenceDelta: event.presenceDelta ?? ability?.presenceDelta ?? null,
        payoffs: cinematicPayoffsFromSegments(ability?.segments, event.params),
        ...sourceFields(eminence),
      });
    })
    .filter(Boolean);
}

/**
 * Esito delle condizioni già pubbliche (es. Preda schierata) nel momento in cui
 * entrambi gli Agenti sono noti. Non va emesso a fine Duello: a quel punto
 * il giocatore ha già visto se pagava.
 */
export function noticesFromDeployedMarkResolution(matchState, {
  agentIdBySide = null,
  onlyAbilityIds = null,
} = {}) {
  const notices = [];
  for (const side of BOTH_SIDES) {
    const state = matchState?.[side];
    const eminence = getEminence(state?.eminenceId);
    const ability = getEminenceAbility(eminence?.id, state?.revealedAbilityId);
    if (!ability) continue;
    if (onlyAbilityIds && !onlyAbilityIds.has(ability.id)) continue;
    const segment = firstPublicMarkPayoff(ability);
    const context = publicMarkContext(matchState, side, agentIdBySide);
    if (!segment || !canEvaluateCondition(segment.condition, context)) continue;

    const hit = matchesCondition(segment.condition, context);
    const delta = hit && segment.primitive === 'CHANGE_PRESENCE' ? segment.delta : null;
    const preyIds = state.persistent?.preyCardIds || [];
    const deployedIds = [agentIdBySide?.[SIDES.PLAYER], agentIdBySide?.[SIDES.ENEMY]].filter(Boolean);
    const markCardId = deployedIds.find((id) => preyIds.includes(id)) ?? preyIds[0] ?? null;
    notices.push(enrichNotice({
      id: `effect:${side}:${ability.id}:${segment.timing}:${hit ? 'hit' : 'miss'}`,
      side,
      kind: 'effect',
      origin: 'deployed_mark',
      outcome: hit ? 'hit' : 'miss',
      timing: segment.timing,
      name: ability.name,
      text: resolutionText(segment, hit),
      presenceDelta: typeof delta === 'number' ? delta : null,
      markKind: 'prey',
      markCardId,
      payoffs: cinematicPayoffsFromSegments([segment], state.selectedParams),
      ...sourceFields(eminence),
    }));
  }
  return notices;
}

function effectNoticeText(ability, entry, hit = true) {
  const resolved = resolutionText(entry?.segment, hit);
  if (resolved) return resolved;

  const chosen = formatChosenParams(entry?.params);
  const delta = entry?.segment?.primitive === 'CHANGE_PRESENCE'
    ? entry.segment.delta
    : null;
  const parts = [];
  if (chosen) {
    parts.push(entry?.params?.slot != null ? `${chosen}.` : `Pronostico: ${chosen}.`);
  }
  if (typeof delta === 'number' && delta !== 0) {
    parts.push(`${formatPresenceDelta(delta)} Presenza.`);
  } else if (!chosen) {
    parts.push(ability?.text || '');
  } else {
    parts.push('Pronostico corretto.');
  }
  return parts.filter(Boolean).join(' ');
}

/**
 * Avvisi dai segmenti che hanno davvero maturo, e dai miss post-Duello
 * la cui condizione dipende da un marchio pubblico (Preda).
 * Scommessa resta silenziosa se il pronostico è sbagliato.
 * Le condizioni solo-marchio pre-Duello si annunciano quando gli Agenti sono noti.
 */
export function noticesFromAppliedEffects(matchState, queue = [], { skipped = [], evalContextBySide = null } = {}) {
  const seen = new Set();
  const notices = [];

  const pushNotice = (entry, hit) => {
    if (entry?.isStatic) {
      if (!POST_DUEL_TIMINGS.has(entry.timing)) return;
      if (entry.segment?.primitive !== 'CHANGE_PRESENCE') return;
    }
    const side = entry.ownerSide;
    const eminence = getEminence(matchState?.[side]?.eminenceId);
    const ability = getEminenceAbility(eminence?.id ?? entry.sourceEminenceId, entry.abilityId)
      || (entry.isStatic ? eminence?.static : null);
    if (!ability) return;
    if (isPublicMarkCondition(entry.segment?.condition)) return;
    const evalContext = evalContextBySide?.[side] ?? null;
    if (hit && !segmentAnnouncesWhenApplied(ability, entry, evalContext)) return;
    if (!hit) {
      if (preDuelConditionsAreEvaluable(ability, evalContext)) return;
      if (abilityAnnouncesAtReveal(ability, evalContext)) return;
      if (!conditionHasPublicMark(entry.segment?.condition)) return;
    }

    const id = `effect:${side}:${entry.abilityId}:${entry.timing}:${hit ? 'hit' : 'miss'}`;
    if (seen.has(id)) return;
    seen.add(id);

    const delta = hit && entry.segment?.primitive === 'CHANGE_PRESENCE'
      ? entry.segment.delta
      : null;

    notices.push(enrichNotice({
      id,
      side,
      kind: 'effect',
      origin: 'applied_effect',
      outcome: hit ? 'hit' : 'miss',
      timing: entry.timing ?? null,
      name: ability.name,
      text: effectNoticeText(ability, entry, hit),
      presenceDelta: typeof delta === 'number' ? delta : null,
      payoffs: cinematicPayoffsFromSegments([entry.segment], entry.params),
      ...sourceFields(eminence),
    }));
  };

  for (const entry of queue || []) pushNotice(entry, true);
  for (const entry of skipped || []) pushNotice(entry, false);

  return notices;
}
