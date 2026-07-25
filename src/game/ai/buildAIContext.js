// ============================================
// Costruzione contesto puro per il motore IA
// ============================================

import { countConqueredFields } from '../duel/duelHelpers.js';

/**
 * Estrae un contesto immutabile (sola lettura) da gameState / snapshot.
 * Non include setter React.
 *
 * @param {object} gameState
 */
export function buildAIContext(gameState) {
  const battlefields = Array.isArray(gameState.battlefields) ? gameState.battlefields : [];
  const currentFieldIndex =
    gameState.currentFieldIndex == null ? null : Number(gameState.currentFieldIndex);
  const field =
    currentFieldIndex != null && battlefields[currentFieldIndex]
      ? battlefields[currentFieldIndex]
      : null;

  const playerHand = Array.isArray(gameState.playerHand) ? gameState.playerHand : [];
  const enemyHand = Array.isArray(gameState.enemyHand) ? gameState.enemyHand : [];
  const conqueredFields = gameState.conqueredFields || {};

  const { playerFieldsConquered, enemyFieldsConquered } = countConqueredFields(
    conqueredFields,
    playerHand,
    enemyHand
  );

  const difficultyRaw = gameState.aiDifficulty || 'medium';
  const difficulty = difficultyRaw === 'chaos' ? 'medium' : difficultyRaw;

  const context = {
    difficulty,
    mode: gameState.gameMode || 'classic',

    roundNumber: gameState.roundNumber || 1,
    lastWinner: gameState.lastWinner ?? null,
    isPlayerFirst: gameState.isPlayerFirst !== false,

    currentFieldIndex,
    field,
    battlefields,
    conqueredFields,
    revealedFields:
      gameState.revealedFields == null ? battlefields.length : Number(gameState.revealedFields),

    playerFieldsConquered,
    enemyFieldsConquered,

    player: {
      hand: playerHand,
      usedCardIds: Array.isArray(gameState.playerUsedCards) ? gameState.playerUsedCards : [],
      hp: Number(gameState.playerHP) || 0,
      focus: Number(gameState.playerFocus) || 0,
      armyBonuses: gameState.playerArmyBonuses || {},
      toxin: gameState.playerToxin ?? null,
      selectedCard: gameState.selectedAgent ?? null,
      selectedFocus:
        gameState.selectedFocus == null ? null : Math.max(0, Math.floor(Number(gameState.selectedFocus))),
    },

    ai: {
      hand: enemyHand,
      usedCardIds: Array.isArray(gameState.enemyUsedCards) ? gameState.enemyUsedCards : [],
      hp: Number(gameState.enemyHP) || 0,
      focus: Number(gameState.enemyFocus) || 0,
      armyBonuses: gameState.enemyArmyBonuses || {},
      toxin: gameState.enemyToxin ?? null,
    },

    campaignDuelMod: gameState.campaignDuelMod ?? null,
  };

  return context;
}

/**
 * Validazione soft del contesto (dev warning, fallback legali).
 * @param {object} context
 * @param {{ warn?: (msg: string) => void }} [options]
 */
export function validateAIContext(context, options = {}) {
  const warn =
    options.warn ||
    ((msg) => {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[AI] ${msg}`);
      }
    });

  const issues = [];

  if (!context?.ai?.hand?.length) {
    issues.push('mano IA vuota');
  }

  if ((context?.ai?.focus ?? 0) < 0) {
    issues.push('Focus IA negativo');
  }

  if (context?.currentFieldIndex != null && !context.field) {
    issues.push('Campo mancante per currentFieldIndex');
  }

  if (context?.isPlayerFirst && !context?.player?.selectedCard) {
    issues.push('IA risponde ma carta giocatore assente');
  }

  for (const issue of issues) warn(issue);
  return issues;
}
