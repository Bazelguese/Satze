import {
  DUEL_PANEL_LAYOUT,
  getDuelAgentBaseScale,
  getDuelAgentCardCenter,
} from '../config/duelClashLayout.js';
import { armyNameToDialogueKey } from './armyDialogueMap.js';
import {
  dialogueCardKey,
  resolveDuelPhaseEventKey,
} from './resolveDuelDialogueEvent.js';
import { DUEL_DIALOGUE_MORTE_PHASE } from './dialogueTiming.js';
import { resolveDialogueSayOptions, armyUsesWrittenDialogueOnly } from './selectDialogueLine.js';

const VIEWPORT = { width: 1920, height: 1080 };

function bubbleLine(raw) {
  const text = (raw || '').trim();
  if (!text) return null;
  if (text.length > 140) return `${text.slice(0, 139)}…`;
  return text;
}

/** Solo dialoghi scritti in dialoghi-*.js. */
export function buildDuelDialogueFromEvent(
  battleResult,
  side,
  eventKey,
  isZoomed = true,
  session = null
) {
  const agent = side === 'player' ? battleResult.playerAgent : battleResult.enemyAgent;
  const armyKey = armyNameToDialogueKey(agent.army);
  if (!armyUsesWrittenDialogueOnly(armyKey)) return null;

  const cardKey = dialogueCardKey(agent.id, armyKey);
  const resolved = resolveDialogueSayOptions(agent, eventKey, {
    armyKey,
    lastText: session?.lastTextByCard?.[cardKey],
    loreSeenKey: cardKey,
    loreSeen: session?.loreSeen,
  });
  if (!resolved?.text) return null;

  const text = bubbleLine(resolved.text);
  if (!text) return null;

  const line = buildDuelDialogueLine(battleResult, side, text, isZoomed);
  if (session?.lastTextByCard) {
    session.lastTextByCard[cardKey] = resolved.text;
  }
  return { ...line, army: resolved.army, name: resolved.name, eventKey };
}

/**
 * Costruisce opzioni `say()` ancorate alla carta agente nel duello.
 */
export function buildDuelDialogueLine(battleResult, side, text, isZoomed = true) {
  const agent = side === 'player' ? battleResult.playerAgent : battleResult.enemyAgent;
  const center = getDuelAgentCardCenter(side, VIEWPORT.width, VIEWPORT.height, isZoomed);
  const scale = getDuelAgentBaseScale(isZoomed);
  const cardTopY = center.y - (DUEL_PANEL_LAYOUT.cardHeight / 2) * scale;

  return {
    army: armyNameToDialogueKey(agent.army),
    name: agent.name,
    text,
    x: center.x,
    y: cardTopY,
    side: 'above',
    tail: side === 'player' ? '38%' : '62%',
  };
}

function buildSideLineForPhase(battleResult, side, duelPhase, isZoomed, session) {
  const eventKey = resolveDuelPhaseEventKey(duelPhase, side, battleResult);
  if (!eventKey) return null;
  const line = buildDuelDialogueFromEvent(
    battleResult,
    side,
    eventKey,
    isZoomed,
    session
  );
  return line?.text ? line : null;
}

/**
 * Righe per fase duello:
 * 0 entrata · 1 constatazione/trigger preVa · 2 Opportunista · 4–6 silenzio · 5 esito · 7 morte
 */
export function buildDuelDialogueForPhase(battleResult, duelPhase, isZoomed = true, session = null) {
  if (!battleResult) return [];

  const sides = ['player', 'enemy'];
  return sides
    .map((side) => buildSideLineForPhase(battleResult, side, duelPhase, isZoomed, session))
    .filter(Boolean);
}

/** Fase 7 regolamento — scarto agenti (Continua / clash uscita). */
export function buildDuelDialogueForMorte(battleResult, isZoomed = true, session = null) {
  return buildDuelDialogueForPhase(
    battleResult,
    DUEL_DIALOGUE_MORTE_PHASE,
    isZoomed,
    session
  );
}

/** Script completo per il dev tool (Riproduci scambio). */
export function buildDuelDialogueScript(battleResult, isZoomed = true) {
  const session = { lastTextByCard: {}, loreSeen: new Set() };
  const phases = [0, 1, 2, 5, DUEL_DIALOGUE_MORTE_PHASE];
  const lines = [];
  for (const phase of phases) {
    lines.push(...buildDuelDialogueForPhase(battleResult, phase, isZoomed, session));
  }
  return lines;
}
