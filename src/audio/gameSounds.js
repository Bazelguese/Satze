/**
 * API gioco → SFX. Un solo entrypoint per eventi di partita.
 */

import { GAME_SOUND, UI_SOUND } from './soundCatalog.js';
import { playSound } from './soundBus.js';

/** @param {string} soundId @param {{ force?: boolean }} [opts] */
export function playGame(soundId, opts = {}) {
  return playSound(soundId, opts);
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
  if (nextPhase === 'battle') return playSound(GAME_SOUND.DUEL_START);
  if (nextPhase === 'result') return false; // i beat li fa playDuelPhaseBeat
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

/**
 * Beat della sequenza risultato duello.
 * @param {number} duelPhase
 * @param {{ winner?: string }|null} [battleResult]
 */
export function playDuelPhaseBeat(duelPhase, battleResult) {
  switch (duelPhase) {
    case 0:
      return playSound(GAME_SOUND.DUEL_DEPLOY);
    case 1:
      return playSound(GAME_SOUND.DUEL_POWER);
    case 2:
      return playSound(GAME_SOUND.DUEL_FOCUS);
    case 4:
      return playSound(GAME_SOUND.DUEL_CLASH);
    case 5: {
      const w = battleResult?.winner;
      if (w === 'player') return playSound(GAME_SOUND.DUEL_WIN);
      if (w === 'enemy') return playSound(GAME_SOUND.DUEL_LOSE);
      return playSound(GAME_SOUND.DUEL_DRAW);
    }
    default:
      return false;
  }
}

export { GAME_SOUND, UI_SOUND };
