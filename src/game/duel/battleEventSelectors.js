/**
 * Filters, grouping and compact view for battle events.
 */

import { BATTLE_EVENT_TYPES } from './battleEventTypes.js';
import { formatBattleEvent, formatTransition } from './formatBattleEvent.js';
import { getRevealIndex } from '../../config/duelVisualTimeline.js';

export const COMPACT_DETAIL_LIMIT = 7;

const COMPACT_TYPES = new Set([
  BATTLE_EVENT_TYPES.statChange,
  BATTLE_EVENT_TYPES.resourceChange,
  BATTLE_EVENT_TYPES.block,
  BATTLE_EVENT_TYPES.copy,
  BATTLE_EVENT_TYPES.fieldRule,
  BATTLE_EVENT_TYPES.info,
]);

/** Events allowed in the compact panel (not header/outcome/VA formula). */
export function isCompactEligible(event) {
  if (!event) return false;
  if (event.type === BATTLE_EVENT_TYPES.roundHeader) return false;
  if (event.type === BATTLE_EVENT_TYPES.outcome) return false;
  if (event.type === BATTLE_EVENT_TYPES.assaultCalculation) return false;
  if (
    (event.type === BATTLE_EVENT_TYPES.statChange ||
      event.type === BATTLE_EVENT_TYPES.resourceChange) &&
    event.before === event.after
  ) {
    return false;
  }
  if (event.type === BATTLE_EVENT_TYPES.info) {
    // Compact: only opponent field choice when exclusive to the log.
    return event.infoCode === 'opponentFieldChosen' || event.infoCode === 'temporaryFocus';
  }
  return COMPACT_TYPES.has(event.type);
}

export function filterVisibleByReveal(events, duelPhase) {
  const phase = Number(duelPhase);
  if (!Array.isArray(events)) return [];
  if (!Number.isFinite(phase)) return events.slice();
  return events.filter((event) => getRevealIndex(event.revealAt) <= phase);
}

function canAggregate(a, b) {
  if (!a || !b) return false;
  if (a.round !== b.round) return false;
  if (a.phase !== b.phase || a.revealAt !== b.revealAt) return false;
  if (a.type !== BATTLE_EVENT_TYPES.statChange || b.type !== BATTLE_EVENT_TYPES.statChange) {
    return false;
  }
  if (a.source?.kind !== b.source?.kind || String(a.source?.id) !== String(b.source?.id)) {
    return false;
  }
  if (
    a.target?.kind !== b.target?.kind ||
    a.target?.side !== b.target?.side ||
    String(a.target?.id) !== String(b.target?.id)
  ) {
    return false;
  }
  return true;
}

/**
 * Aggregate consecutive compatible statChange events into display rows.
 * @returns {{ kind: 'row'|'overflow', events: object[], text?: string }[]}
 */
export function aggregateBattleEvents(events, context) {
  const eligible = (events || []).filter(isCompactEligible);
  const groups = [];
  for (const event of eligible) {
    const last = groups[groups.length - 1];
    if (last && canAggregate(last[last.length - 1], event)) {
      last.push(event);
    } else {
      groups.push([event]);
    }
  }

  const rows = groups.map((group) => {
    if (group.length === 1) {
      const formatted = formatBattleEvent(group[0], context);
      return { kind: 'row', events: group, text: formatted.text, formatted };
    }
    const src = group[0].source?.name || group[0].source?.id || '';
    const parts = group.map((e) =>
      formatTransition(e.before, e.after, e.stat === 'VA' ? 'mod VA' : e.stat)
    );
    const text = `${src} · ${parts.join(' · ')}`;
    return {
      kind: 'row',
      events: group,
      text,
      formatted: {
        ...formatBattleEvent(group[0], context),
        text,
        ariaLabel: text,
      },
    };
  });

  if (rows.length <= COMPACT_DETAIL_LIMIT) return rows;

  const visible = rows.slice(0, COMPACT_DETAIL_LIMIT);
  const hidden = rows.slice(COMPACT_DETAIL_LIMIT);
  const hiddenCount = hidden.reduce((n, r) => n + r.events.length, 0);
  visible.push({
    kind: 'overflow',
    events: hidden.flatMap((r) => r.events),
    text: `+${hiddenCount} altri effetti`,
    overflowCount: hiddenCount,
  });
  return visible;
}

export function groupEventsByRound(events) {
  const map = new Map();
  for (const event of events || []) {
    const r = event.round ?? 0;
    if (!map.has(r)) map.set(r, []);
    map.get(r).push(event);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([round, roundEvents]) => ({
      round,
      events: roundEvents.slice().sort((a, b) => a.sequence - b.sequence),
    }));
}

export function getRoundHeaderEvent(events) {
  return (events || []).find((e) => e.type === BATTLE_EVENT_TYPES.roundHeader) || null;
}

export function getRoundOutcomeEvent(events) {
  return (events || []).find((e) => e.type === BATTLE_EVENT_TYPES.outcome) || null;
}

/** Keep last N complete rounds (by round number), not N lines. */
export function keepLastRounds(events, maxRounds = 10) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const rounds = [...new Set(events.map((e) => e.round))].sort((a, b) => a - b);
  if (rounds.length <= maxRounds) return events.slice();
  const keep = new Set(rounds.slice(-maxRounds));
  return events.filter((e) => keep.has(e.round));
}

/**
 * Causal rows for expanded detail.
 * Exclude header/outcome (already in block chrome) and assaultCalculation
 * (rendered in the dedicated VA formula section).
 */
export function selectDetailEvents(events) {
  return (events || [])
    .filter(
      (e) =>
        e.type !== BATTLE_EVENT_TYPES.roundHeader &&
        e.type !== BATTLE_EVENT_TYPES.outcome &&
        e.type !== BATTLE_EVENT_TYPES.assaultCalculation
    )
    .filter(
      (e) =>
        !(
          (e.type === BATTLE_EVENT_TYPES.statChange ||
            e.type === BATTLE_EVENT_TYPES.resourceChange) &&
          e.before === e.after
        )
    )
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
}
