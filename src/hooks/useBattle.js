// ============================================
// HOOK: useBattle
// Gestisce la logica di battaglia
// ============================================

import { useCallback } from 'react';
import { computeDuelResolution } from '../game/duelResolve';
import { prepareEminenceDuel, settleEminenceRound } from '../game/eminence/eminenceDuelGate';
import { capturePresenceSnapshot } from '../game/eminence/presence';
import { isEminenceSubsystemEnabled } from '../game/eminence/eminenceState';

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
    eminenceMatchState,
    setEminenceMatchState,
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
    setDuelEffectStep,
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

    // Gate GENERAL e Duello devono cadere nello stesso istante sincrono: se il reveal
    // passasse da un aggiornamento di stato React, il Duello girerebbe sullo stato
    // precedente e ignorerebbe le abilità appena rivelate.
    const initiativeSide = isPlayerFirst ? 'player' : 'enemy';
    const prepared = prepareEminenceDuel(eminenceMatchState, { initiativeSide });
    if (prepared.blocked) {
      console.error('resolveBattle: scelte Eminenza incomplete', prepared.blocked);
      return;
    }
    const eminenceActive = isEminenceSubsystemEnabled(prepared.matchState);

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
      eminenceBundle: prepared.bundle,
      presenceSnapshot: eminenceActive ? capturePresenceSnapshot(prepared.matchState) : null,
      playerHasEminence: Boolean(prepared.matchState?.player?.eminenceId),
      enemyHasEminence: Boolean(prepared.matchState?.enemy?.eminenceId),
    });

    if (eminenceActive) {
      setEminenceMatchState(settleEminenceRound(prepared.matchState, { initiativeSide }).matchState);
    }

    setPlayerFocus(battleResult.finalPlayerFC);
    setEnemyFocus(battleResult.finalEnemyFC);
    setPlayerUsedCards((prev) => [...prev, pAgent.id]);
    setEnemyUsedCards((prev) => [...prev, eAgent.id]);
    setLastWinner(battleResult.winner);
    setBattleResult(battleResult);

    setDuelPhase(0);
    setDuelEffectStep(1);
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
    eminenceMatchState,
    setEminenceMatchState,
    setBattleResult,
    setPlayerFocus,
    setEnemyFocus,
    setPlayerUsedCards,
    setEnemyUsedCards,
    setLastWinner,
    setGamePhase,
    setDuelPhase,
    setDuelEffectStep,
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
