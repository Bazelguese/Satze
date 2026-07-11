import { armyNameToDialogueKey } from './armyDialogueMap.js';
import {
  RATTI_OPPORTUNISTA_CARD_IDS,
  RATTI_POST_VA_TRIGGERS,
} from './dialoghiRatti.js';
import { DUEL_DIALOGUE_MORTE_PHASE } from './dialogueTiming.js';
import {
  armyUsesWrittenDialogueOnly,
  getCardDialogues,
  getDialoguePool,
} from './selectDialogueLine.js';

/** @typedef {{ lastTextByCard?: Record<string, string>, loreSeen?: Set<string> }} DialogueSession */

const STAT_BAND_ORDER = ['colosso', 'fragile', 'spinato'];

export function createDialogueSession() {
  return { lastTextByCard: {}, loreSeen: new Set() };
}

export function dialogueCardKey(cardId, armyKey) {
  return `${armyKey}:${cardId}`;
}

function opponentSide(side) {
  return side === 'player' ? 'enemy' : 'player';
}

function sideAbilityTriggered(side, battleResult) {
  return side === 'player'
    ? battleResult.playerAbilityTriggered
    : battleResult.enemyAbilityTriggered;
}

function opponentToxinActive(opponentSideKey, battleResult) {
  if (!battleResult) return false;
  return opponentSideKey === 'player'
    ? Boolean(battleResult.playerToxinActivated)
    : Boolean(battleResult.enemyToxinActivated);
}

function isOpportunistAgent(agent) {
  if (!agent?.id) return false;
  return (
    RATTI_OPPORTUNISTA_CARD_IDS.has(agent.id) ||
    agent.ability?.trigger === 'opportunista'
  );
}

function isPostVaAgent(agent) {
  return RATTI_POST_VA_TRIGGERS.has(agent?.ability?.trigger);
}

/** Fasce stat nemiche pubbliche (POT/DAN carta agente). */
export function inferStatNemicoBands(agent) {
  if (!agent) return [];
  const bands = [];
  const pot = agent.power ?? 0;
  const dan = agent.damage ?? 0;
  if (pot >= 6) bands.push('colosso');
  if (pot <= 2) bands.push('fragile');
  if (dan >= 5) bands.push('spinato');
  return bands;
}

export function hasDialogueForEvent(cardId, armyKey, eventKey) {
  if (!cardId || !eventKey) return false;
  const pool = getDialoguePool(getCardDialogues(cardId, armyKey), eventKey);
  return pool.length > 0;
}

/** Null se manca la riga nel file dialoghi dell'armata. */
function eventKeyIfWritten(agent, armyKey, eventKey) {
  if (!eventKey || !agent?.id) return null;
  if (!armyUsesWrittenDialogueOnly(armyKey)) return null;
  return hasDialogueForEvent(agent.id, armyKey, eventKey) ? eventKey : null;
}

/**
 * Constatazione (phase 1): reattivo > senzaTossina > league5/turbo/pot > fasce generiche.
 * @returns {string|null}
 */
export function resolveConstatazioneEventKey(agent, opponent, battleResult, side) {
  if (!agent?.id) return null;
  const armyKey = armyNameToDialogueKey(agent.army);
  const oppSide = opponentSide(side);

  if (opponent?.army) {
    const reactiveKey = `reattivo.${opponent.army}`;
    if (hasDialogueForEvent(agent.id, armyKey, reactiveKey)) return reactiveKey;
  }

  if (
    !opponentToxinActive(oppSide, battleResult) &&
    hasDialogueForEvent(agent.id, armyKey, 'statNemico.senzaTossina')
  ) {
    return 'statNemico.senzaTossina';
  }

  const pot = opponent?.power ?? 0;
  const league = opponent?.league ?? 0;
  const oppTriggered = sideAbilityTriggered(oppSide, battleResult);

  if (league >= 5 && hasDialogueForEvent(agent.id, armyKey, 'statNemico.league5')) {
    return 'statNemico.league5';
  }
  if (
    opponent?.ability?.trigger === 'turbo' &&
    oppTriggered &&
    hasDialogueForEvent(agent.id, armyKey, 'statNemico.turbo')
  ) {
    return 'statNemico.turbo';
  }
  if (pot > 5 && hasDialogueForEvent(agent.id, armyKey, 'statNemico.potAlta')) {
    return 'statNemico.potAlta';
  }
  if (pot > 3 && hasDialogueForEvent(agent.id, armyKey, 'statNemico.potMedia')) {
    return 'statNemico.potMedia';
  }

  const bands = inferStatNemicoBands(opponent);
  for (const band of STAT_BAND_ORDER) {
    if (!bands.includes(band)) continue;
    const statKey = `statNemico.${band}`;
    if (hasDialogueForEvent(agent.id, armyKey, statKey)) return statKey;
  }

  return null;
}

/** @deprecated alias — constatazione ora in phase 1 */
export function resolveRevelationEventKey(agent, opponent, battleResult = null, side = 'player') {
  return resolveConstatazioneEventKey(agent, opponent, battleResult, side);
}

/**
 * Fase poteri: solo se il potere è scattato nel duello.
 * @returns {string|null}
 */
export function resolveTriggerEventKey(agent, side, battleResult) {
  if (!agent?.id || !battleResult) return null;
  if (!sideAbilityTriggered(side, battleResult)) return null;
  return 'triggerAttivato';
}

/** Trigger pre-reveal (phase 1): esclude Opportunista e postVa. */
export function resolvePreVaTriggerEventKey(agent, side, battleResult) {
  if (!resolveTriggerEventKey(agent, side, battleResult)) return null;
  if (isOpportunistAgent(agent)) return null;
  if (isPostVaAgent(agent)) return null;
  return 'triggerAttivato';
}

/** Trigger Opportunista (phase ≥ 2). */
export function resolveOpportunistTriggerEventKey(agent, side, battleResult) {
  if (!isOpportunistAgent(agent)) return null;
  return resolveTriggerEventKey(agent, side, battleResult);
}

/**
 * Phase 1: constatazione > trigger preVa.
 * @returns {string|null}
 */
export function resolvePhase1EventKey(agent, opponent, side, battleResult) {
  const constatazione = resolveConstatazioneEventKey(agent, opponent, battleResult, side);
  if (constatazione) return constatazione;
  return resolvePreVaTriggerEventKey(agent, side, battleResult);
}

/**
 * Esito scontro — varianti con/senza trigger dove scritte.
 * @returns {string|null}
 */
export function resolveOutcomeEventKey(agent, side, battleResult) {
  if (!agent?.id || !battleResult?.winner) return null;
  const { winner } = battleResult;
  if (winner !== 'player' && winner !== 'enemy') return null;

  const armyKey = armyNameToDialogueKey(agent.army);
  const won =
    (side === 'player' && winner === 'player') ||
    (side === 'enemy' && winner === 'enemy');
  const triggered = sideAbilityTriggered(side, battleResult);

  if (won) {
    if (triggered && hasDialogueForEvent(agent.id, armyKey, 'vinceConTrigger')) {
      return 'vinceConTrigger';
    }
    if (!triggered && hasDialogueForEvent(agent.id, armyKey, 'vinceSenzaTrigger')) {
      return 'vinceSenzaTrigger';
    }
    return hasDialogueForEvent(agent.id, armyKey, 'vince') ? 'vince' : null;
  }

  if (triggered && hasDialogueForEvent(agent.id, armyKey, 'perdeConTrigger')) {
    return 'perdeConTrigger';
  }
  if (!triggered && hasDialogueForEvent(agent.id, armyKey, 'perdeSenzaTrigger')) {
    return 'perdeSenzaTrigger';
  }
  return hasDialogueForEvent(agent.id, armyKey, 'perde') ? 'perde' : null;
}

/** Fase 7 — scarto agenti a fine scontro. */
export function resolveMorteEventKey(agent) {
  if (!agent?.id) return null;
  return 'morte';
}

/**
 * Mappa fase duello visuale → evento per lato.
 * 0 entrata · 1 constatazione/trigger preVa · 2 trigger Opportunista · 5 esito · 7 morte
 * @returns {string|null}
 */
export function resolveDuelPhaseEventKey(duelPhase, side, battleResult) {
  if (!battleResult) return null;
  const agent = side === 'player' ? battleResult.playerAgent : battleResult.enemyAgent;
  const opponent = side === 'player' ? battleResult.enemyAgent : battleResult.playerAgent;
  const armyKey = armyNameToDialogueKey(agent.army);

  if (duelPhase === 0) return eventKeyIfWritten(agent, armyKey, 'entrata');
  if (duelPhase === 1) {
    return eventKeyIfWritten(
      agent,
      armyKey,
      resolvePhase1EventKey(agent, opponent, side, battleResult)
    );
  }
  if (duelPhase === 2) {
    return eventKeyIfWritten(
      agent,
      armyKey,
      resolveOpportunistTriggerEventKey(agent, side, battleResult)
    );
  }
  if (duelPhase === 5) {
    return eventKeyIfWritten(agent, armyKey, resolveOutcomeEventKey(agent, side, battleResult));
  }
  if (duelPhase === DUEL_DIALOGUE_MORTE_PHASE) {
    return eventKeyIfWritten(agent, armyKey, 'morte');
  }
  return null;
}
