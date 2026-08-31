// ============================================
// Stato strategico puro (derivato dall'information set)
// ============================================

import { normalizeUsedIdSet, getAvailableCards } from './generateAIActions.js';
import { cloneEminenceView, createDisabledEminenceView } from '../eminence/eminenceAIView.js';

function cardIds(hand) {
  return (hand || []).filter((c) => c && c.id != null).map((c) => c.id);
}

function remainingIds(hand, usedCardIds) {
  return getAvailableCards(hand, usedCardIds).map((c) => c.id);
}

function legalFieldIndexes(infoSet) {
  const battlefields = infoSet.battlefields || [];
  const conquered = infoSet.conqueredFields || {};
  const revealed =
    infoSet.revealedFields == null ? battlefields.length : Number(infoSet.revealedFields);
  const indexes = [];
  for (let i = 0; i < battlefields.length; i += 1) {
    if (i in conquered) continue;
    if (i >= revealed) continue;
    indexes.push(i);
  }
  return indexes;
}

/**
 * Costruisce uno stato strategico immutabile (solo dati pubblici).
 * @param {object} infoSet — output di buildAIInformationSet
 */
export function buildStrategicState(infoSet) {
  const playerUsed = [...normalizeUsedIdSet(infoSet.player.usedCardIds)];
  const aiUsed = [...normalizeUsedIdSet(infoSet.ai.usedCardIds)];
  const availableFieldIndexes = legalFieldIndexes(infoSet);

  const initiativeProfile =
    infoSet.campaignDuelMod?.initiativeProfile ??
    infoSet.initiativeProfile ??
    null;

  // Se opening non è noto, deriva da isPlayerFirst + round (core alternato).
  const openingPlayerFirst =
    infoSet.openingPlayerFirst != null
      ? Boolean(infoSet.openingPlayerFirst)
      : deriveOpeningPlayerFirst(infoSet.roundNumber || 1, infoSet.isPlayerFirst !== false, initiativeProfile);

  return {
    difficulty: infoSet.difficulty,
    mode: infoSet.mode || 'classic',
    informationPolicy: infoSet.informationPolicy,

    roundNumber: infoSet.roundNumber || 1,
    isPlayerFirst: infoSet.isPlayerFirst !== false,
    initiativeSide: infoSet.isPlayerFirst !== false ? 'player' : 'ai',
    openingPlayerFirst,
    initiativeProfile,
    lastWinner: infoSet.lastWinner ?? null,

    playerHP: infoSet.player.hp,
    aiHP: infoSet.ai.hp,
    playerFocus: infoSet.player.focusPool ?? infoSet.player.focus,
    aiFocus: infoSet.ai.focusPool ?? infoSet.ai.focus,

    playerRemainingCardIds: remainingIds(infoSet.player.hand, infoSet.player.usedCardIds),
    aiRemainingCardIds: remainingIds(infoSet.ai.hand, infoSet.ai.usedCardIds),
    playerUsedCardIds: playerUsed,
    aiUsedCardIds: aiUsed,
    playerHandCardIds: cardIds(infoSet.player.hand),
    aiHandCardIds: cardIds(infoSet.ai.hand),

    conqueredFields: { ...(infoSet.conqueredFields || {}) },
    revealedFields: infoSet.revealedFields,
    availableFieldIndexes,
    currentFieldIndex: infoSet.currentFieldIndex,
    playerFieldsConquered: infoSet.playerFieldsConquered || 0,
    enemyFieldsConquered: infoSet.enemyFieldsConquered || 0,

    playerToxin: infoSet.player.toxin ?? null,
    aiToxin: infoSet.ai.toxin ?? null,

    eminence: cloneEminenceView(infoSet.eminence),

    // Riferimenti sola lettura per valutazione / proiezione (non mutare)
    _refs: {
      playerHand: infoSet.player.hand,
      aiHand: infoSet.ai.hand,
      battlefields: infoSet.battlefields,
      playerArmyBonuses: infoSet.player.armyBonuses,
      aiArmyBonuses: infoSet.ai.armyBonuses,
      campaignDuelMod: infoSet.campaignDuelMod ?? null,
    },

    terminalStatus: null,
  };
}

/**
 * Inverte resolveRoundInitiative per stimare opening quando manca dallo stato.
 * Per profili assault/defense la stima può essere approssimata; in classico è esatta.
 */
export function deriveOpeningPlayerFirst(roundNumber, isPlayerFirst, initiativeProfile = null) {
  const round = Math.max(1, Number(roundNumber) || 1);
  if (initiativeProfile === 'assault' || initiativeProfile === 'defense') {
    // Nei round 1–2 l'iniziativa è forzata; opening coincide con R1.
    if (round <= 2) {
      return initiativeProfile === 'assault' ? true : false;
    }
    // Dopo: opening === (round % 2 === 0) ? isPlayerFirst : !isPlayerFirst — vedi resolveRoundInitiative
    return isPlayerFirst === (round % 2 === 0);
  }
  // Core: isPlayerFirst === (opening === (round % 2 === 1))
  return isPlayerFirst === (round % 2 === 1);
}

/**
 * Lookup carta per id dalla mano referenziata nello stato.
 */
export function findCardInState(state, side, cardId) {
  const hand = side === 'ai' ? state._refs?.aiHand : state._refs?.playerHand;
  return (hand || []).find((c) => c && c.id === cardId) || null;
}

/**
 * Ricostruisce un information-set / context simulabile da uno stato strategico.
 * Non include mai selectedFocus.
 *
 * @param {object} state
 * @param {number|null} [fieldIndex]
 */
export function rebuildContextFromStrategicState(state, fieldIndex = null) {
  const battlefields = state._refs?.battlefields || [];
  const resolvedFieldIndex =
    fieldIndex != null
      ? fieldIndex
      : state.currentFieldIndex != null
        ? state.currentFieldIndex
        : null;
  const field =
    resolvedFieldIndex != null && battlefields[resolvedFieldIndex]
      ? battlefields[resolvedFieldIndex]
      : null;

  return {
    difficulty: state.difficulty,
    mode: state.mode,
    informationPolicy: state.informationPolicy,
    eminence: state.eminence ? cloneEminenceView(state.eminence) : createDisabledEminenceView(),
    roundNumber: state.roundNumber,
    lastWinner: state.lastWinner,
    isPlayerFirst: state.initiativeSide
      ? state.initiativeSide === 'player'
      : state.isPlayerFirst !== false,
    openingPlayerFirst: state.openingPlayerFirst,
    initiativeProfile: state.initiativeProfile,
    currentFieldIndex: resolvedFieldIndex,
    field,
    battlefields,
    conqueredFields: state.conqueredFields,
    revealedFields: state.revealedFields,
    playerFieldsConquered: state.playerFieldsConquered,
    enemyFieldsConquered: state.enemyFieldsConquered,
    player: {
      hand: state._refs?.playerHand || [],
      usedCardIds: state.playerUsedCardIds || [],
      hp: state.playerHP,
      focusPool: state.playerFocus,
      focus: state.playerFocus,
      armyBonuses: state._refs?.playerArmyBonuses || {},
      toxin: state.playerToxin,
      // Carta pubblica solo se il giocatore ha già aperto in questo duello — in ricerca futura è nascosta.
      visibleCard: null,
      eminence: state.eminence?.player ?? null,
    },
    ai: {
      hand: state._refs?.aiHand || [],
      usedCardIds: state.aiUsedCardIds || [],
      hp: state.aiHP,
      focusPool: state.aiFocus,
      focus: state.aiFocus,
      armyBonuses: state._refs?.aiArmyBonuses || {},
      toxin: state.aiToxin,
      eminence: state.eminence?.ai ?? null,
    },
    campaignDuelMod: state._refs?.campaignDuelMod ?? null,
  };
}
