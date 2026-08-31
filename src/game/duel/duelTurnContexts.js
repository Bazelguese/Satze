/**
 * Contesti trigger per giocatore e IA nello stesso turno (simmetria HP/league/campi).
 */
import { createFocus, buildFocusContextFields } from '../eminence/focusModel.js';

/** Campi Presenza neutri: nessuna Eminenza, quindi nessun trigger Eminenza soddisfabile. */
const NO_EMINENCE_FIELDS = {
  hasEminence: false,
  enemyHasEminence: false,
  playerPresence: null,
  enemyPresence: null,
  presenceSpent: 0,
  enemyPresenceSpent: 0,
  totalPresenceSpent: 0,
  enemyTotalPresenceSpent: 0,
};

function buildPresenceFields(snapshotForSide, hasEminence, enemyHasEminence) {
  if (!snapshotForSide) return { ...NO_EMINENCE_FIELDS };
  return {
    hasEminence,
    enemyHasEminence,
    playerPresence: snapshotForSide.playerPresence,
    enemyPresence: snapshotForSide.enemyPresence,
    presenceSpent: snapshotForSide.presenceSpent,
    enemyPresenceSpent: snapshotForSide.enemyPresenceSpent,
    totalPresenceSpent: snapshotForSide.totalPresenceSpent,
    enemyTotalPresenceSpent: snapshotForSide.enemyTotalPresenceSpent,
  };
}

export function buildDuelTurnContexts({
  isPlayerFirst,
  lastWinner,
  selectedFocus,
  enemySelectedFocus,
  playerUsedCards,
  enemyUsedCards,
  playerHP,
  enemyHP,
  pAgent,
  eAgent,
  playerFieldsConquered,
  enemyFieldsConquered,
  roundNumber,
  playerInitialLeagueCount = 0,
  enemyInitialLeagueCount = 0,

  // Eminenze. Assenti in tutti i chiamanti pre-esistenti: senza di essi il contesto
  // prodotto è identico a quello di prima, salvo i nuovi campi neutri.
  playerTemporaryFocus = 0,
  enemyTemporaryFocus = 0,
  presenceSnapshot = null,
  playerHasEminence = false,
  enemyHasEminence = false,
}) {
  const rn = roundNumber || 1;

  const playerFocus = createFocus(selectedFocus, playerTemporaryFocus);
  const enemyFocus = createFocus(enemySelectedFocus, enemyTemporaryFocus);

  return {
    playerContext: {
      // Identifica il lato anche nelle copie del contesto (fase post-Duello), dove il
      // confronto per riferimento non basta più.
      duelSide: 'player',
      isFirst: isPlayerFirst,
      wonPrevious: lastWinner === 'player',
      lostPrevious: lastWinner === 'enemy',
      ...buildFocusContextFields(playerFocus, enemyFocus),
      cardsPlayed: playerUsedCards.length + 1,
      enemyCardsPlayed: enemyUsedCards.length + 1,
      playerHP,
      enemyHP,
      playerLeague: pAgent.league,
      enemyLeague: eAgent.league,
      playerFieldsConquered,
      enemyFieldsConquered,
      roundNumber: rn,
      playerInitialLeagueCount,
      ...buildPresenceFields(presenceSnapshot?.player, playerHasEminence, enemyHasEminence),
    },
    enemyContext: {
      duelSide: 'enemy',
      isFirst: !isPlayerFirst,
      wonPrevious: lastWinner === 'enemy',
      lostPrevious: lastWinner === 'player',
      ...buildFocusContextFields(enemyFocus, playerFocus),
      cardsPlayed: enemyUsedCards.length + 1,
      enemyCardsPlayed: playerUsedCards.length + 1,
      playerHP: enemyHP,
      enemyHP: playerHP,
      playerLeague: eAgent.league,
      enemyLeague: pAgent.league,
      playerFieldsConquered: enemyFieldsConquered,
      enemyFieldsConquered: playerFieldsConquered,
      roundNumber: rn,
      playerInitialLeagueCount: enemyInitialLeagueCount,
      ...buildPresenceFields(presenceSnapshot?.enemy, enemyHasEminence, playerHasEminence),
    },
  };
}
