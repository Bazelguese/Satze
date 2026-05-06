// ============================================
// HOOK: useBattle
// Gestisce la logica di battaglia
// ============================================

import { useCallback } from 'react';
import { computeDuelResolution } from '../game/duelResolve';

/**
 * Hook per gestire la logica di battaglia
 * @param {Object} gameState - Stato del gioco da useGameState
 * @param {Object} animations - Stato delle animazioni da useAnimations
 * @returns {Function} resolveBattle - Funzione per risolvere una battaglia
 */
export function useBattle(gameState, animations) {
  const {
    battlefields,
    currentFieldIndex,
    selectedAgent,
    selectedFocus,
    enemyAgent,
    enemySelectedFocus,
    playerHP,
    enemyHP,
    playerFocus,
    enemyFocus,
    playerUsedCards,
    enemyUsedCards,
    isPlayerFirst,
    lastWinner,
    playerArmyBonuses,
    enemyArmyBonuses,
    playerToxin,
    enemyToxin,
    roundNumber,
    conqueredFields,
    playerHand,
    enemyHand,
    setBattleResult,
    setPlayerFocus,
    setEnemyFocus,
    setPlayerUsedCards,
    setEnemyUsedCards,
    setLastWinner,
    setGamePhase,
  } = gameState;

  const {
    setDuelPhase,
    setPlayerCardGlow,
    setEnemyCardGlow,
    setPlayerFocusCoinsShown,
    setEnemyFocusCoinsShown,
    setCardGlowIntensity,
    setIsZoomed,
  } = animations;

  const resolveBattle = useCallback(() => {
    const field = battlefields[currentFieldIndex];
    const pAgent = selectedAgent;
    const eAgent = enemyAgent;

    if (!field || !pAgent || !eAgent) {
      console.error('resolveBattle: Missing required data', { field, pAgent, eAgent });
      return;
    }

    const { battleResult } = computeDuelResolution({
      field,
      selectedAgent: pAgent,
      enemyAgent: eAgent,
      selectedFocus,
      enemySelectedFocus,
      playerHP,
      enemyHP,
      playerFocus,
      enemyFocus,
      playerUsedCards,
      enemyUsedCards,
      isPlayerFirst,
      lastWinner,
      playerArmyBonuses,
      enemyArmyBonuses,
      playerToxin,
      enemyToxin,
      roundNumber,
      conqueredFields,
      playerHand,
      enemyHand,
      currentFieldIndex,
    });

    setPlayerFocus(battleResult.finalPlayerFC);
    setEnemyFocus(battleResult.finalEnemyFC);
    setPlayerUsedCards((prev) => [...prev, pAgent.id]);
    setEnemyUsedCards((prev) => [...prev, eAgent.id]);
    setLastWinner(battleResult.winner);
    setBattleResult(battleResult);

    setDuelPhase(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setCardGlowIntensity(0);
    setIsZoomed(true);
    setGamePhase('result');
  }, [
    battlefields,
    currentFieldIndex,
    selectedAgent,
    selectedFocus,
    enemyAgent,
    enemySelectedFocus,
    playerHP,
    enemyHP,
    playerFocus,
    enemyFocus,
    playerUsedCards,
    enemyUsedCards,
    isPlayerFirst,
    lastWinner,
    playerArmyBonuses,
    enemyArmyBonuses,
    playerToxin,
    enemyToxin,
    roundNumber,
    conqueredFields,
    playerHand,
    enemyHand,
    setBattleResult,
    setPlayerFocus,
    setEnemyFocus,
    setPlayerUsedCards,
    setEnemyUsedCards,
    setLastWinner,
    setGamePhase,
    setDuelPhase,
    setPlayerCardGlow,
    setEnemyCardGlow,
    setPlayerFocusCoinsShown,
    setEnemyFocusCoinsShown,
    setCardGlowIntensity,
    setIsZoomed,
  ]);

  return {
    resolveBattle,
  };
}
