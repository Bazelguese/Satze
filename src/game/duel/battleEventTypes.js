/**
 * Structured battle-log events (SPEC Rework Log Battaglia v1.1).
 * Schema uses local/opponent; map player/enemy only at engine boundaries.
 */

/** @typedef {'preDuel'|'deploy'|'focus'|'effects'|'assault'|'result'|'post'} BattlePhase */
/** @typedef {'local'|'opponent'|'both'|null} BattleSide */
/** @typedef {'roundHeader'|'statChange'|'resourceChange'|'block'|'copy'|'fieldRule'|'assaultCalculation'|'outcome'|'info'} BattleEventType */
/** @typedef {'deploy'|'abilityFx'|'focusFx'|'assaultFx'|'outcome'|'postFx'} BattleRevealAt */

export const BATTLE_PHASES = Object.freeze({
  preDuel: 'preDuel',
  deploy: 'deploy',
  focus: 'focus',
  effects: 'effects',
  assault: 'assault',
  result: 'result',
  post: 'post',
});

export const BATTLE_EVENT_TYPES = Object.freeze({
  roundHeader: 'roundHeader',
  statChange: 'statChange',
  resourceChange: 'resourceChange',
  block: 'block',
  copy: 'copy',
  fieldRule: 'fieldRule',
  assaultCalculation: 'assaultCalculation',
  outcome: 'outcome',
  info: 'info',
});

export const BATTLE_REVEAL_AT = Object.freeze({
  deploy: 'deploy',
  abilityFx: 'abilityFx',
  focusFx: 'focusFx',
  assaultFx: 'assaultFx',
  outcome: 'outcome',
  postFx: 'postFx',
});

export const BATTLE_STATS = Object.freeze({
  POT: 'POT',
  DAN: 'DAN',
  VA: 'VA',
  PV: 'PV',
  FC: 'FC',
});

/** Engine side (`player`/`enemy`) → schema side (`local`/`opponent`). */
export function toBattleSide(engineSide) {
  if (engineSide === 'player') return 'local';
  if (engineSide === 'enemy') return 'opponent';
  if (engineSide === 'local' || engineSide === 'opponent' || engineSide === 'both') return engineSide;
  return null;
}

export function oppositeBattleSide(side) {
  if (side === 'local') return 'opponent';
  if (side === 'opponent') return 'local';
  return side ?? null;
}

/**
 * @param {number} roundNumber
 */
export function createBattleEventEmitter(roundNumber) {
  const events = [];
  let sequence = 0;
  const round = Number(roundNumber) || 0;

  const emit = (event) => {
    if (!event || typeof event !== 'object') return null;
    if (
      (event.type === BATTLE_EVENT_TYPES.statChange ||
        event.type === BATTLE_EVENT_TYPES.resourceChange) &&
      event.before === event.after
    ) {
      return null;
    }
    const nextSequence = sequence++;
    const full = {
      id: `r${round}:e${nextSequence}`,
      round,
      sequence: nextSequence,
      debugNote: null,
      ...event,
    };
    events.push(full);
    return full;
  };

  emit.at = (phase, revealAt) => (event) => emit({ phase, revealAt, ...event });

  return { events, emit, round };
}

export function makeSource({ kind, id, name, ownerSide = null }) {
  return {
    kind: kind || 'system',
    id: id != null ? String(id) : null,
    name: name ?? null,
    ownerSide: ownerSide ?? null,
  };
}

export function makeTarget({ kind, side, id, name }) {
  return {
    kind: kind || 'agent',
    side: side ?? null,
    id: id != null ? String(id) : null,
    name: name ?? null,
  };
}

export function makeAgentTarget(engineSide, agent) {
  return makeTarget({
    kind: 'agent',
    side: toBattleSide(engineSide),
    id: agent?.id,
    name: agent?.name,
  });
}

export function makePlayerTarget(engineSide) {
  return makeTarget({
    kind: 'player',
    side: toBattleSide(engineSide),
    id: toBattleSide(engineSide),
    name: null,
  });
}
