// ============================================
// Simulazione duello via computeDuelResolution
// ============================================

import { computeDuelResolution } from '../duelResolve.js';
import { countConqueredFields } from '../duel/duelHelpers.js';
import { applyToxin } from '../toxinLogic.js';
import { AI_FIELDS_TO_WIN, AI_SUPREMACY_ROUND } from './aiConstants.js';

/**
 * Conta Campi proiettati dopo l'esito del Campo corrente (senza mutare lo stato).
 */
export function projectFieldCounts(context, duelWinner) {
  const { playerFieldsConquered, enemyFieldsConquered } = countConqueredFields(
    context.conqueredFields,
    context.player.hand,
    context.ai.hand
  );

  let playerFieldsAfter = playerFieldsConquered;
  let enemyFieldsAfter = enemyFieldsConquered;
  if (duelWinner === 'player') playerFieldsAfter += 1;
  if (duelWinner === 'enemy') enemyFieldsAfter += 1;

  return {
    playerFieldsBefore: playerFieldsConquered,
    enemyFieldsBefore: enemyFieldsConquered,
    playerFieldsAfter,
    enemyFieldsAfter,
  };
}

/**
 * Stato terminale proiettato (allineato alle regole classiche principali).
 * Non replica claim-choice UI: valuta minaccia / chiusura territoriale.
 */
export function resolveTerminalStatus(context, {
  winner,
  aiHpAfter,
  playerHpAfter,
  aiFieldsAfter,
  playerFieldsAfter,
  aiCardsRemaining,
  playerCardsRemaining,
}) {
  if (playerHpAfter <= 0 && aiHpAfter > 0) return 'ai_win_hp';
  if (aiHpAfter <= 0 && playerHpAfter > 0) return 'ai_loss_hp';
  if (playerHpAfter <= 0 && aiHpAfter <= 0) return 'draw_hp';

  const round = context.roundNumber || 1;
  const mode = context.mode || 'classic';
  const territorialAllowed =
    mode === 'bareHands' || (mode === 'classic' && round < AI_SUPREMACY_ROUND);

  if (territorialAllowed) {
    if (aiFieldsAfter >= AI_FIELDS_TO_WIN) return 'ai_win_fields';
    if (playerFieldsAfter >= AI_FIELDS_TO_WIN) return 'ai_loss_fields';
  }

  if (aiCardsRemaining <= 0 || playerCardsRemaining <= 0) {
    if (aiHpAfter > playerHpAfter) return 'ai_win_cards';
    if (playerHpAfter > aiHpAfter) return 'ai_loss_cards';
    if (aiFieldsAfter > playerFieldsAfter) return 'ai_win_cards';
    if (playerFieldsAfter > aiFieldsAfter) return 'ai_loss_cards';
    return 'draw_cards';
  }

  if (winner === 'enemy' && aiFieldsAfter === AI_FIELDS_TO_WIN - 1 && territorialAllowed) {
    return 'ai_threat_fields';
  }
  if (winner === 'player' && playerFieldsAfter === AI_FIELDS_TO_WIN - 1 && territorialAllowed) {
    return 'player_threat_fields';
  }

  return null;
}

function normalizeIdList(ids) {
  return (ids || [])
    .map((e) => (typeof e === 'object' && e != null ? e.id : e))
    .filter((id) => id != null)
    .map(String)
    .sort()
    .join(',');
}

function stableObjectKey(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(stableObjectKey).join(',');
  return Object.keys(value)
    .sort()
    .map((k) => `${k}:${stableObjectKey(value[k])}`)
    .join(',');
}

function toxinCacheKey(toxin) {
  if (!toxin) return '0';
  if (typeof toxin !== 'object') return String(toxin);
  return `v${toxin.value ?? 0}|m${toxin.minHealth ?? ''}|s${toxin.source ?? ''}`;
}

/**
 * Chiave cache: tutto il contesto che influenza computeDuelResolution.
 */
export function buildSimulateAIDuelCacheKey(context, aiAction, playerAction) {
  const fieldIndex =
    aiAction.fieldIndex != null ? aiAction.fieldIndex : context.currentFieldIndex;
  const field =
    fieldIndex != null && context.battlefields?.[fieldIndex]
      ? context.battlefields[fieldIndex]
      : context.field;

  return [
    field?.id ?? fieldIndex ?? '',
    fieldIndex ?? '',
    aiAction.card?.id,
    aiAction.focus,
    playerAction.card?.id,
    playerAction.focus,
    context.isPlayerFirst ? 1 : 0,
    context.roundNumber ?? 1,
    context.lastWinner ?? '',
    context.player?.hp,
    context.ai?.hp,
    context.player?.focusPool ?? context.player?.focus,
    context.ai?.focusPool ?? context.ai?.focus,
    normalizeIdList(context.player?.usedCardIds),
    normalizeIdList(context.ai?.usedCardIds),
    stableObjectKey(context.conqueredFields || {}),
    context.playerFieldsConquered ?? 0,
    context.enemyFieldsConquered ?? 0,
    toxinCacheKey(context.player?.toxin),
    toxinCacheKey(context.ai?.toxin),
    stableObjectKey(context.player?.armyBonuses || {}),
    stableObjectKey(context.ai?.armyBonuses || {}),
  ].join('|');
}

/**
 * Simula un duello completo senza mutare il contesto.
 *
 * @param {object} context
 * @param {{ card: object, focus: number, fieldIndex?: number }} aiAction
 * @param {{ card: object, focus: number }} playerAction
 * @param {{ cache?: Map }} [options]
 */
export function simulateAIDuel(context, aiAction, playerAction, options = {}) {
  if (!context?.field) {
    throw new Error('simulateAIDuel: Campo mancante');
  }
  if (!aiAction?.card || !playerAction?.card) {
    throw new Error('simulateAIDuel: carte mancanti');
  }

  const fieldIndex =
    aiAction.fieldIndex != null ? aiAction.fieldIndex : context.currentFieldIndex;
  const field =
    fieldIndex != null && context.battlefields?.[fieldIndex]
      ? context.battlefields[fieldIndex]
      : context.field;

  const cacheKey = buildSimulateAIDuelCacheKey(context, aiAction, playerAction);

  if (options.cache?.has(cacheKey)) {
    return options.cache.get(cacheKey);
  }

  const playerFocusPool = context.player.focusPool ?? context.player.focus;
  const aiFocusPool = context.ai.focusPool ?? context.ai.focus;

  const { battleResult } = computeDuelResolution({
    field,
    selectedAgent: playerAction.card,
    enemyAgent: aiAction.card,
    selectedFocus: playerAction.focus,
    enemySelectedFocus: aiAction.focus,
    playerHP: context.player.hp,
    enemyHP: context.ai.hp,
    playerFocus: playerFocusPool,
    enemyFocus: aiFocusPool,
    playerUsedCards: context.player.usedCardIds,
    enemyUsedCards: context.ai.usedCardIds,
    isPlayerFirst: context.isPlayerFirst,
    lastWinner: context.lastWinner,
    playerArmyBonuses: context.player.armyBonuses,
    enemyArmyBonuses: context.ai.armyBonuses,
    playerToxin: context.player.toxin,
    enemyToxin: context.ai.toxin,
    roundNumber: context.roundNumber,
    conqueredFields: context.conqueredFields,
    playerHand: context.player.hand,
    enemyHand: context.ai.hand,
    currentFieldIndex: fieldIndex,
  });

  const fields = projectFieldCounts(context, battleResult.winner);

  // Allinea al client: tossina a fine turno dopo i PV del duello
  let playerHpAfter = battleResult.finalPlayerHP;
  let aiHpAfter = battleResult.finalEnemyHP;
  let playerToxinAfter = battleResult.playerToxinActivated || context.player.toxin || null;
  let aiToxinAfter = battleResult.enemyToxinActivated || context.ai.toxin || null;
  if (playerToxinAfter || aiToxinAfter) {
    const toxinResult = applyToxin(playerToxinAfter, aiToxinAfter, playerHpAfter, aiHpAfter);
    playerHpAfter = toxinResult.newPlayerHP;
    aiHpAfter = toxinResult.newEnemyHP;
    playerToxinAfter = toxinResult.playerToxinActive;
    aiToxinAfter = toxinResult.enemyToxinActive;
  }

  const aiUsed = new Set(
    (context.ai.usedCardIds || []).map((e) => (typeof e === 'object' ? e.id : e))
  );
  aiUsed.add(aiAction.card.id);
  const playerUsed = new Set(
    (context.player.usedCardIds || []).map((e) => (typeof e === 'object' ? e.id : e))
  );
  playerUsed.add(playerAction.card.id);

  const aiCardsRemaining = (context.ai.hand || []).filter((c) => c && !aiUsed.has(c.id)).length;
  const playerCardsRemaining = (context.player.hand || []).filter(
    (c) => c && !playerUsed.has(c.id)
  ).length;

  const simulation = {
    winner: battleResult.winner,
    battleResult,

    aiHpBefore: context.ai.hp,
    aiHpAfter,
    playerHpBefore: context.player.hp,
    playerHpAfter,
    playerToxinAfter,
    aiToxinAfter,

    aiFocusBefore: aiFocusPool,
    aiFocusAfter: battleResult.finalEnemyFC,
    playerFocusBefore: playerFocusPool,
    playerFocusAfter: battleResult.finalPlayerFC,

    aiFieldsBefore: fields.enemyFieldsBefore,
    aiFieldsAfter: fields.enemyFieldsAfter,
    playerFieldsBefore: fields.playerFieldsBefore,
    playerFieldsAfter: fields.playerFieldsAfter,

    aiCardsRemaining,
    playerCardsRemaining,

    aiAbilityTriggered: !!battleResult.enemyAbilityTriggered,
    playerAbilityTriggered: !!battleResult.playerAbilityTriggered,
    aiBonusTriggered: !!battleResult.enemyArmyBonusActive || !!battleResult.enemyHasBonus,
    playerBonusTriggered: !!battleResult.playerArmyBonusActive || !!battleResult.playerHasBonus,

    terminalStatus: null,
  };

  simulation.terminalStatus = resolveTerminalStatus(context, simulation);

  if (options.cache) options.cache.set(cacheKey, simulation);
  return simulation;
}
