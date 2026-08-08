// ============================================
// Proiezione stato strategico post-duello
// ============================================

import { AI_FIELDS_TO_WIN, AI_SUPREMACY_ROUND } from './aiConstants.js';

function usedList(ids) {
  return Array.isArray(ids) ? ids.map((id) => id) : [];
}

function resolveTerminalFromProjected(state) {
  if (state.playerHP <= 0 && state.aiHP > 0) return 'ai_win_hp';
  if (state.aiHP <= 0 && state.playerHP > 0) return 'ai_loss_hp';
  if (state.playerHP <= 0 && state.aiHP <= 0) return 'draw_hp';

  const round = state.roundNumber || 1;
  const mode = state.mode || 'classic';
  // Il duello appena risolto era al round precedente; i Campi contano subito.
  const duelRound = Math.max(1, round - 1);
  const territorialAllowed =
    (mode === 'bareHands' || mode === 'classic') && duelRound < AI_SUPREMACY_ROUND;

  if (territorialAllowed) {
    if (state.enemyFieldsConquered >= AI_FIELDS_TO_WIN) return 'ai_win_fields';
    if (state.playerFieldsConquered >= AI_FIELDS_TO_WIN) return 'ai_loss_fields';
  }

  if (state.aiRemainingCardIds.length <= 0 || state.playerRemainingCardIds.length <= 0) {
    if (state.aiHP > state.playerHP) return 'ai_win_cards';
    if (state.playerHP > state.aiHP) return 'ai_loss_cards';
    if (state.enemyFieldsConquered > state.playerFieldsConquered) return 'ai_win_cards';
    if (state.playerFieldsConquered > state.enemyFieldsConquered) return 'ai_loss_cards';
    return 'draw_cards';
  }

  return null;
}

/**
 * Iniziativa del round successivo: il perdente del duello inizia.
 * Non usa alternanza fissa su opening/round.
 *
 * @param {'player'|'enemy'|null|undefined} winner
 * @param {boolean} currentIsPlayerFirst
 * @returns {boolean}
 */
export function resolveNextInitiativeFromWinner(winner, currentIsPlayerFirst = true) {
  if (winner === 'player') {
    // IA ha perso → IA inizia
    return false;
  }
  if (winner === 'enemy') {
    // giocatore ha perso → giocatore inizia
    return true;
  }
  // Pareggio / sconosciuto: invertire l'iniziativa corrente
  return !currentIsPlayerFirst;
}

/**
 * Proietta lo stato strategico dopo un duello simulato.
 * Non muta lo stato di input.
 *
 * @param {object} strategicState
 * @param {object} simulation — output di simulateAIDuel
 * @param {{ cardId?: number, card?: object, focus: number, fieldIndex?: number }} aiAction
 * @param {{ cardId?: number, card?: object, focus: number }} playerAction
 */
export function projectPostDuelState(strategicState, simulation, aiAction, playerAction) {
  const aiCardId = aiAction.cardId ?? aiAction.card?.id;
  const playerCardId = playerAction.cardId ?? playerAction.card?.id;
  const fieldIndex =
    aiAction.fieldIndex != null
      ? aiAction.fieldIndex
      : strategicState.currentFieldIndex;

  const conqueredFields = { ...(strategicState.conqueredFields || {}) };
  if (fieldIndex != null && simulation?.winner) {
    const winnerArmy =
      simulation.winner === 'enemy'
        ? aiAction.card?.army
        : playerAction.card?.army;
    conqueredFields[fieldIndex] = {
      winner: simulation.winner,
      army: winnerArmy || null,
    };
  }

  const playerUsedCardIds = usedList(strategicState.playerUsedCardIds);
  const aiUsedCardIds = usedList(strategicState.aiUsedCardIds);
  if (playerCardId != null && !playerUsedCardIds.includes(playerCardId)) {
    playerUsedCardIds.push(playerCardId);
  }
  if (aiCardId != null && !aiUsedCardIds.includes(aiCardId)) {
    aiUsedCardIds.push(aiCardId);
  }

  const playerRemainingCardIds = (strategicState.playerRemainingCardIds || []).filter(
    (id) => id !== playerCardId
  );
  const aiRemainingCardIds = (strategicState.aiRemainingCardIds || []).filter(
    (id) => id !== aiCardId
  );

  let playerFieldsConquered = strategicState.playerFieldsConquered || 0;
  let enemyFieldsConquered = strategicState.enemyFieldsConquered || 0;
  if (simulation?.winner === 'player') playerFieldsConquered += 1;
  if (simulation?.winner === 'enemy') enemyFieldsConquered += 1;

  const nextRound = (strategicState.roundNumber || 1) + 1;
  const nextIsPlayerFirst = resolveNextInitiativeFromWinner(
    simulation?.winner,
    strategicState.isPlayerFirst !== false
  );

  const battlefields = strategicState._refs?.battlefields || [];
  const prevRevealed =
    strategicState.revealedFields == null
      ? battlefields.length
      : Number(strategicState.revealedFields);
  const maxReveal = Math.max(battlefields.length, prevRevealed);
  const revealedFields = Math.min(maxReveal, prevRevealed + 1);

  const availableFieldIndexes = [];
  for (let i = 0; i < battlefields.length; i += 1) {
    if (i in conqueredFields) continue;
    if (i >= revealedFields) continue;
    availableFieldIndexes.push(i);
  }

  const projected = {
    ...strategicState,
    roundNumber: nextRound,
    isPlayerFirst: nextIsPlayerFirst,
    initiativeSide: nextIsPlayerFirst ? 'player' : 'ai',
    lastWinner: simulation?.winner ?? strategicState.lastWinner,

    playerHP: simulation?.playerHpAfter ?? strategicState.playerHP,
    aiHP: simulation?.aiHpAfter ?? strategicState.aiHP,
    playerFocus: simulation?.playerFocusAfter ?? strategicState.playerFocus,
    aiFocus: simulation?.aiFocusAfter ?? strategicState.aiFocus,

    playerRemainingCardIds,
    aiRemainingCardIds,
    playerUsedCardIds,
    aiUsedCardIds,

    conqueredFields,
    revealedFields,
    availableFieldIndexes,
    currentFieldIndex: null,
    playerFieldsConquered,
    enemyFieldsConquered,

    // Tossina post-applicazione (può scadere sotto minHealth); fallback a attivazione/stato
    playerToxin:
      simulation?.playerToxinAfter !== undefined
        ? simulation.playerToxinAfter
        : (simulation?.battleResult?.playerToxinActivated ?? strategicState.playerToxin),
    aiToxin:
      simulation?.aiToxinAfter !== undefined
        ? simulation.aiToxinAfter
        : (simulation?.battleResult?.enemyToxinActivated ?? strategicState.aiToxin),

    _refs: strategicState._refs,
    terminalStatus: simulation?.terminalStatus || null,
  };

  if (!projected.terminalStatus) {
    projected.terminalStatus = resolveTerminalFromProjected(projected);
  }

  return projected;
}
