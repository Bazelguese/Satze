/**
 * Helpers to emit structured battle events from the duel engine.
 * Prefer IDs; names are display fallbacks only.
 */

import {
  BATTLE_EVENT_TYPES,
  BATTLE_PHASES,
  BATTLE_REVEAL_AT,
  BATTLE_STATS,
  makeSource,
  makeTarget,
  makeAgentTarget,
  makePlayerTarget,
  toBattleSide,
  oppositeBattleSide,
} from './battleEventTypes.js';

/**
 * Create a channel that dual-writes legacy strings (temporary) and structured events.
 * After migration, call sites should use only emit* helpers; `push` is removed in cleanup.
 */
export function createBattleLogChannel(emitter, { dualStrings = true } = {}) {
  const strings = [];
  let phase = BATTLE_PHASES.effects;
  let revealAt = BATTLE_REVEAL_AT.abilityFx;

  const channel = {
    /** @deprecated dual-output only */
    get strings() {
      return strings;
    },
    get events() {
      return emitter.events;
    },
    setContext(nextPhase, nextRevealAt) {
      if (nextPhase) phase = nextPhase;
      if (nextRevealAt) revealAt = nextRevealAt;
      return channel;
    },
    /** Legacy string log — dual-output only; do not use for classification. */
    push(message) {
      if (dualStrings && message != null) strings.push(message);
    },
    emit(event) {
      return emitter.emit({ phase, revealAt, ...event });
    },
    emitAt(nextPhase, nextRevealAt, event) {
      return emitter.emit({ phase: nextPhase, revealAt: nextRevealAt, ...event });
    },
  };

  return channel;
}

export function emitStatChange(channel, {
  phase,
  revealAt,
  source,
  target,
  stat,
  before,
  after,
}) {
  if (before === after) return null;
  const payload = {
    type: BATTLE_EVENT_TYPES.statChange,
    source,
    target,
    stat,
    before,
    after,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitResourceChange(channel, {
  phase,
  revealAt,
  source,
  target,
  stat,
  before,
  after,
}) {
  if (before === after) return null;
  const payload = {
    type: BATTLE_EVENT_TYPES.resourceChange,
    source,
    target,
    stat,
    before,
    after,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitBlock(channel, {
  phase,
  revealAt,
  source,
  target,
  blockedEffect,
  blockedBy,
}) {
  const payload = {
    type: BATTLE_EVENT_TYPES.block,
    source,
    target,
    blockedEffect,
    blockedBy,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitCopy(channel, {
  phase,
  revealAt,
  source,
  target,
  copied,
}) {
  const payload = {
    type: BATTLE_EVENT_TYPES.copy,
    source,
    target,
    copied,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitFieldRule(channel, {
  phase,
  revealAt,
  source,
  ruleCode,
  params = null,
  target = null,
}) {
  const payload = {
    type: BATTLE_EVENT_TYPES.fieldRule,
    source,
    target,
    ruleCode,
    params,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitInfo(channel, {
  phase,
  revealAt,
  infoCode,
  data = null,
  source = null,
  target = null,
}) {
  const payload = {
    type: BATTLE_EVENT_TYPES.info,
    infoCode,
    data,
    source,
    target,
  };
  if (phase && revealAt) return channel.emitAt(phase, revealAt, payload);
  return channel.emit(payload);
}

export function emitRoundHeader(channel, payload) {
  return channel.emitAt(BATTLE_PHASES.deploy, BATTLE_REVEAL_AT.deploy, {
    type: BATTLE_EVENT_TYPES.roundHeader,
    ...payload,
  });
}

export function emitAssaultCalculation(channel, payload) {
  return channel.emitAt(BATTLE_PHASES.assault, BATTLE_REVEAL_AT.assaultFx, {
    type: BATTLE_EVENT_TYPES.assaultCalculation,
    ...payload,
  });
}

export function emitOutcome(channel, payload) {
  return channel.emitAt(BATTLE_PHASES.result, BATTLE_REVEAL_AT.outcome, {
    type: BATTLE_EVENT_TYPES.outcome,
    ...payload,
  });
}

export function abilitySource(name, ownerEngineSide, id = null) {
  return makeSource({
    kind: 'ability',
    id: id ?? name,
    name,
    ownerSide: toBattleSide(ownerEngineSide),
  });
}

export function bonusSource(name, ownerEngineSide, id = null) {
  return makeSource({
    kind: 'bonus',
    id: id ?? name,
    name,
    ownerSide: toBattleSide(ownerEngineSide),
  });
}

export function fieldSource(field) {
  return makeSource({
    kind: 'field',
    id: field?.id,
    name: field?.name,
    ownerSide: null,
  });
}

export function systemSource(id, name = id) {
  return makeSource({ kind: 'system', id, name, ownerSide: null });
}

export {
  BATTLE_EVENT_TYPES,
  BATTLE_PHASES,
  BATTLE_REVEAL_AT,
  BATTLE_STATS,
  makeSource,
  makeTarget,
  makeAgentTarget,
  makePlayerTarget,
  toBattleSide,
  oppositeBattleSide,
};
