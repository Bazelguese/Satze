/**
 * API gioco → SFX. Un solo entrypoint per eventi di partita.
 */

import { GAME_SOUND, SOUND_HIT_MS, UI_SOUND } from './soundCatalog.js';
import { playSound, scheduleSound } from './soundBus.js';
import {
  DUEL_PHASE4_MIN_MS,
  DUEL_VISUAL_DEFAULTS,
  computeDynamicClashVfx,
} from '../config/duelVisualConfig.js';

/** Quota della fase 4 in cui le carte si toccano (vedi warpClashTime in duelClashMotion.js). */
const CLASH_CONTACT_AT = 0.53;
/** Quota della fase 4 in cui il titolo dell'esito è entrato (clashImpactFx.title). */
const CLASH_TITLE_AT = 0.72;

/** @param {string} soundId @param {{ force?: boolean, rate?: number }} [opts] */
export function playGame(soundId, opts = {}) {
  return playSound(soundId, opts);
}

/**
 * Suono il cui colpo cade `atMs` da adesso (anticipa la parte che precede il colpo nel file).
 * @param {string} soundId
 * @param {number} atMs
 * @returns {() => void} annulla
 */
export function playGameAt(soundId, atMs) {
  return scheduleSound(soundId, Math.max(0, atMs - (SOUND_HIT_MS[soundId] || 0)));
}

const COIN_GAP_MS = 60;
let lastCoinAt = -Infinity;

/**
 * Moneta FC che sbatte sulla carta: ogni moneta un po' più acuta della precedente.
 * @param {number} count monete già atterrate (1 = prima)
 */
export function playFocusCoin(count) {
  // le monete dei due lati atterrano quasi insieme: una sola, o si sente un doppio colpo
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastCoinAt < COIN_GAP_MS) return false;
  lastCoinAt = now;
  const rate = Math.min(1.8, 1 + Math.max(0, count - 1) * 0.06);
  return playSound(GAME_SOUND.DUEL_COIN, { rate });
}

export function playPerfect() {
  return playSound(GAME_SOUND.DUEL_PERFECT);
}

export function playUiClick(opts) {
  return playSound(UI_SOUND.CLICK, opts);
}

export function playUiConfirm(opts) {
  return playSound(UI_SOUND.CONFIRM, opts);
}

/**
 * Transizione schermata (menù → armata → deck → …).
 * @param {string} nextPhase
 * @param {string} [prevPhase]
 */
export function playPhaseTransition(nextPhase, prevPhase) {
  if (!nextPhase || nextPhase === prevPhase) return false;
  if (nextPhase === 'menu') return playSound(UI_SOUND.BACK);
  if (nextPhase === 'shuffleDeal' || nextPhase === 'duelLoading') {
    return playSound(GAME_SOUND.SHUFFLE);
  }
  // la conferma ha già il suo suono: niente altro nello stesso istante
  if (nextPhase === 'battle') return false;
  if (nextPhase === 'result') return false; // i beat li fa duelPhaseCues
  if (
    nextPhase === 'selectArmy' ||
    nextPhase === 'selectDeck' ||
    nextPhase === 'selectField' ||
    nextPhase === 'selectAgent' ||
    nextPhase === 'options' ||
    nextPhase === 'gallery' ||
    nextPhase === 'campaignSlots' ||
    nextPhase === 'deckManager'
  ) {
    return playSound(UI_SOUND.NAVIGATE);
  }
  return false;
}

/** Durata della fase 4 (stessa formula di DuelFocusStage). */
function clashPhaseMs(battleResult) {
  const { clashSpeed } = computeDynamicClashVfx(battleResult);
  return Math.max(DUEL_PHASE4_MIN_MS, Math.round(DUEL_VISUAL_DEFAULTS.phaseMs4 / (clashSpeed > 0 ? clashSpeed : 1)));
}

/**
 * Millisecondi dall'inizio della fase 4 al contatto tra le carte.
 * @param {object|null} [battleResult]
 */
export function clashContactMs(battleResult) {
  return Math.round(clashPhaseMs(battleResult) * CLASH_CONTACT_AT);
}

/** @param {{ winner?: string }|null} [battleResult] */
function outcomeSound(battleResult) {
  const w = battleResult?.winner;
  if (w === 'player') return GAME_SOUND.DUEL_WIN;
  if (w === 'enemy') return GAME_SOUND.DUEL_LOSE;
  return GAME_SOUND.DUEL_DRAW;
}

/**
 * Suoni di una fase della sequenza risultato duello e quando cade il loro colpo.
 * Tutto sta nella fase 4: la 5 c'è solo con effetti post-scontro. Schieramento, poteri
 * e monete non hanno un suono di fase: le monete suonano una per una (playFocusCoin),
 * la conferma ha già il suo.
 * @param {number} duelPhase
 * @param {{ winner?: string }|null} [battleResult]
 * @returns {Array<{ id: string, atMs: number }>}
 */
export function duelPhaseCues(duelPhase, battleResult) {
  if (duelPhase !== 4) return [];
  return [
    { id: GAME_SOUND.DUEL_CLASH, atMs: clashContactMs(battleResult) },
    { id: outcomeSound(battleResult), atMs: Math.round(clashPhaseMs(battleResult) * CLASH_TITLE_AT) },
  ];
}

/**
 * Beat della sequenza risultato duello.
 * @param {number} duelPhase
 * @param {{ winner?: string }|null} [battleResult]
 * @returns {() => void} annulla i colpi non ancora partiti
 */
export function playDuelPhaseBeat(duelPhase, battleResult) {
  const cancels = duelPhaseCues(duelPhase, battleResult).map((cue) => playGameAt(cue.id, cue.atMs));
  return () => cancels.forEach((cancel) => cancel());
}

export { GAME_SOUND, UI_SOUND };
