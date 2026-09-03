// ============================================
// HOOK: useBattle
// Gestisce la logica di battaglia
// ============================================

import { useCallback } from 'react';
import { computeDuelResolution } from '../game/duelResolve';
import { prepareEminenceDuel, settleEminenceRound } from '../game/eminence/eminenceDuelGate';
import { capturePresenceSnapshot } from '../game/eminence/presence';
import { isEminenceSubsystemEnabled } from '../game/eminence/eminenceState';
import {
  readHpDelta,
  consumeHpDeltas,
  powerResolutionFromDuel,
  collectRoundLeagueByCardId,
  readCardLeagueDelta,
  isLowestEffectiveLeague,
} from '../game/eminence/eminenceDuelBinding';

/**
 * Hook per gestire la logica di battaglia
 * @param {Object} gameState - Stato del gioco da useGameState
 * @param {Object} animations - Stato delle animazioni da useAnimations
 * @returns {Function} resolveBattle - Funzione per risolvere una battaglia
 */
export function useBattle(gameState, animations, { revealHpCommittedRef } = {}) {
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
    setPlayerHP,
    setEnemyHP,
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

    // I PV del reveal sono già sull'HUD. Il bundle del Duello tiene FC/stat;
    // i delta PV già riscossi vengono tolti per non ribatterli.
    const initiativeSide = isPlayerFirst ? 'player' : 'enemy';
    const leagueByCardId = collectRoundLeagueByCardId(eminenceMatchState);
    const deployedIsLowestLeagueBySide = {
      player: isLowestEffectiveLeague(pAgent, playerHand, leagueByCardId),
      enemy: isLowestEffectiveLeague(eAgent, enemyHand, leagueByCardId),
    };
    const prepared = prepareEminenceDuel(eminenceMatchState, {
      initiativeSide,
      agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
      currentFieldIndex,
      focusInvestedBySide: { player: selectedFocus || 0, enemy: enemySelectedFocus || 0 },
      leagueBySide: {
        player: (pAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, pAgent.id),
        enemy: (eAgent.league ?? 0) + readCardLeagueDelta(leagueByCardId, eAgent.id),
      },
      deployedIsLowestLeagueBySide,
    });
    if (prepared.blocked) {
      console.error('resolveBattle: scelte Eminenza incomplete', prepared.blocked);
      return;
    }
    const eminenceActive = isEminenceSubsystemEnabled(prepared.matchState);
    const committedHp = revealHpCommittedRef?.current || { player: 0, enemy: 0 };
    if (revealHpCommittedRef) {
      revealHpCommittedRef.current = { player: 0, enemy: 0 };
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
      eminenceBundle: consumeHpDeltas(prepared.bundle, committedHp),
      presenceSnapshot: eminenceActive ? capturePresenceSnapshot(prepared.matchState) : null,
      playerHasEminence: Boolean(prepared.matchState?.player?.eminenceId),
      enemyHasEminence: Boolean(prepared.matchState?.enemy?.eminenceId),
    });

    let outcomeNotices = prepared.notices || [];
    let result = battleResult;
    if (eminenceActive) {
      const settled = settleEminenceRound(prepared.matchState, {
        initiativeSide,
        winner: battleResult.winner,
        agentIdBySide: { player: pAgent.id, enemy: eAgent.id },
        aliasUsedBySide: battleResult.aliasUsedBySide,
        finalPowerByCardId: {
          [pAgent.id]: battleResult.playerPower,
          [eAgent.id]: battleResult.enemyPower,
        },
        finalPowerBySide: { player: battleResult.playerPower, enemy: battleResult.enemyPower },
        finalDamageBySide: { player: battleResult.playerDamage, enemy: battleResult.enemyDamage },
        activationSatisfiedBySide: {
          player: battleResult.playerActivationSatisfied,
          enemy: battleResult.enemyActivationSatisfied,
        },
        focusInvestedBySide: { player: selectedFocus || 0, enemy: enemySelectedFocus || 0 },
        statReductionOccurred: Boolean(battleResult.statReductionOccurred),
        ...powerResolutionFromDuel({ battleResult, playerAgent: pAgent, enemyAgent: eAgent }),
      });
      setEminenceMatchState(settled.matchState);
      outcomeNotices = [...outcomeNotices, ...(settled.notices || [])];
      result = {
        ...battleResult,
        finalPlayerHP: Math.max(0, battleResult.finalPlayerHP + readHpDelta(settled.bundle, 'player')),
        finalEnemyHP: Math.max(0, battleResult.finalEnemyHP + readHpDelta(settled.bundle, 'enemy')),
      };
    }

    setPlayerHP(result.finalPlayerHP);
    setEnemyHP(result.finalEnemyHP);
    setPlayerFocus(result.finalPlayerFC);
    setEnemyFocus(result.finalEnemyFC);
    setPlayerUsedCards((prev) => [...prev, pAgent.id]);
    setEnemyUsedCards((prev) => [...prev, eAgent.id]);
    setLastWinner(result.winner);
    setBattleResult({
      ...result,
      eminenceOutcomeNotices: outcomeNotices,
    });

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
    setPlayerHP,
    setEnemyHP,
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
