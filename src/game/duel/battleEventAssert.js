/**
 * Helpers for asserting structured battle events in integration tests.
 */

export function hasEventType(events, type) {
  return (events || []).some((e) => e.type === type);
}

export function hasStatChange(events, { sourceId, stat, side } = {}) {
  return (events || []).some((e) => {
    if (e.type !== 'statChange') return false;
    if (stat && e.stat !== stat) return false;
    if (side && e.target?.side !== side) return false;
    if (sourceId != null && String(e.source?.id) !== String(sourceId)) return false;
    return e.before !== e.after;
  });
}

export function hasResourceChange(events, { stat, side } = {}) {
  return (events || []).some((e) => {
    if (e.type !== 'resourceChange') return false;
    if (stat && e.stat !== stat) return false;
    if (side && e.target?.side !== side) return false;
    return e.before !== e.after;
  });
}

export function hasFieldRule(events, ruleCode, fieldId) {
  return (events || []).some((e) => {
    if (e.type !== 'fieldRule') return false;
    if (ruleCode && e.ruleCode !== ruleCode) return false;
    if (fieldId != null && String(e.source?.id) !== String(fieldId)) return false;
    return true;
  });
}

export function hasBlock(events, blockedBy) {
  return (events || []).some((e) => e.type === 'block' && (!blockedBy || e.blockedBy === blockedBy));
}

export function hasCopy(events, kind) {
  return (events || []).some((e) => e.type === 'copy' && (!kind || e.copied?.kind === kind));
}

export function hasOutcome(events, winnerSide) {
  return (events || []).some(
    (e) => e.type === 'outcome' && (winnerSide == null || e.winnerSide === winnerSide)
  );
}

export function eventsInPhase(events, phase) {
  return (events || []).filter((e) => e.phase === phase);
}
