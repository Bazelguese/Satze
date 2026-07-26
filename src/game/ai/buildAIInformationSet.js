// ============================================
// Information set sanitizzato (Focus giocatore nascosto)
// ============================================

import { countConqueredFields } from '../duel/duelHelpers.js';
import { INFORMATION_POLICY } from './aiConstants.js';

/**
 * Contesto decisionale IA senza informazioni private del Focus giocatore.
 *
 * Policy: l'IA non legge mai selectedFocus / VA privato del giocatore,
 * anche se presenti nello stato React.
 *
 * @param {object} gameState
 */
export function buildAIInformationSet(gameState) {
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

  const isPlayerFirst = gameState.isPlayerFirst !== false;

  // Carta pubblica solo se già rivelata prima della scelta IA (giocatore ha aperto).
  const visibleCard = isPlayerFirst ? gameState.selectedAgent ?? null : null;

  const playerFocusPool = Number(gameState.playerFocus) || 0;
  const aiFocusPool = Number(gameState.enemyFocus) || 0;

  return {
    difficulty,
    mode: gameState.gameMode || 'classic',
    informationPolicy: INFORMATION_POLICY,

    roundNumber: gameState.roundNumber || 1,
    lastWinner: gameState.lastWinner ?? null,
    isPlayerFirst,

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
      focusPool: playerFocusPool,
      // Alias compatibile con simulateAIDuel / getLegalFocusRange
      focus: playerFocusPool,
      armyBonuses: gameState.playerArmyBonuses || {},
      toxin: gameState.playerToxin ?? null,
      visibleCard,
    },

    ai: {
      hand: enemyHand,
      usedCardIds: Array.isArray(gameState.enemyUsedCards) ? gameState.enemyUsedCards : [],
      hp: Number(gameState.enemyHP) || 0,
      focusPool: aiFocusPool,
      focus: aiFocusPool,
      armyBonuses: gameState.enemyArmyBonuses || {},
      toxin: gameState.enemyToxin ?? null,
    },

    campaignDuelMod: gameState.campaignDuelMod ?? null,
  };
}

/**
 * Chiave pubblica per cache decisioni (senza Focus privato).
 * @param {object} infoSet
 */
export function buildPublicDecisionKey(infoSet) {
  return [
    infoSet.difficulty,
    infoSet.roundNumber,
    infoSet.isPlayerFirst ? 1 : 0,
    infoSet.currentFieldIndex,
    infoSet.player.visibleCard?.id ?? '',
    infoSet.ai.focusPool,
    infoSet.player.focusPool,
    infoSet.ai.hp,
    infoSet.player.hp,
    (infoSet.ai.usedCardIds || []).join(','),
    (infoSet.player.usedCardIds || []).join(','),
    infoSet.playerFieldsConquered,
    infoSet.enemyFieldsConquered,
  ].join('|');
}

/**
 * @param {object} infoSet
 * @param {{ warn?: (msg: string) => void }} [options]
 */
export function validateAIInformationSet(infoSet, options = {}) {
  const warn =
    options.warn ||
    ((msg) => {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[AI] ${msg}`);
      }
    });

  const issues = [];

  if ('selectedFocus' in (infoSet.player || {})) {
    issues.push('information set contiene selectedFocus (vietato)');
  }
  if (infoSet.player && 'selectedCard' in infoSet.player) {
    issues.push('usare visibleCard, non selectedCard');
  }
  if (!infoSet?.ai?.hand?.length) issues.push('mano IA vuota');
  if ((infoSet?.ai?.focusPool ?? 0) < 0) issues.push('Focus IA negativo');
  if (infoSet?.currentFieldIndex != null && !infoSet.field) {
    issues.push('Campo mancante per currentFieldIndex');
  }
  if (infoSet?.isPlayerFirst && !infoSet?.player?.visibleCard) {
    issues.push('IA seconda ma carta pubblica assente');
  }

  for (const issue of issues) warn(issue);
  return issues;
}
