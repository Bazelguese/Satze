/**
 * Contesti trigger per giocatore e IA nello stesso turno (simmetria HP/league/campi).
 */
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
}) {
  const rn = roundNumber || 1;
  return {
    playerContext: {
      isFirst: isPlayerFirst,
      wonPrevious: lastWinner === 'player',
      lostPrevious: lastWinner === 'enemy',
      focusCoins: selectedFocus,
      enemyFocusCoins: enemySelectedFocus,
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
    },
    enemyContext: {
      isFirst: !isPlayerFirst,
      wonPrevious: lastWinner === 'enemy',
      lostPrevious: lastWinner === 'player',
      focusCoins: enemySelectedFocus,
      enemyFocusCoins: selectedFocus,
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
    },
  };
}
