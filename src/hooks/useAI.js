// ============================================
// HOOK: useAI — adapter React sul motore puro src/game/ai
// ============================================

import { useCallback, useRef } from 'react';
import {
  buildAIContext,
  chooseAIAction,
  chooseAIField as chooseAIFieldPure,
  getAIProfile,
  defaultRng,
} from '../game/ai/index.js';

/**
 * Hook per gestire la logica dell'IA
 * @param {Object} gameState - Stato del gioco da useGameState
 * @returns {Object} Funzioni per gestire l'IA
 */
export function useAI(gameState) {
  const {
    setEnemyAgent,
    setEnemySelectedFocus,
    setLogs,
    aiDifficulty = 'medium',
    roundNumber,
  } = gameState;

  const pendingDecisionRef = useRef(null);
  const pendingKeyRef = useRef(null);

  const decisionKey = useCallback(() => {
    const ctx = buildAIContext(gameState);
    return [
      ctx.difficulty,
      ctx.roundNumber,
      ctx.isPlayerFirst ? 1 : 0,
      ctx.currentFieldIndex,
      ctx.player.selectedCard?.id ?? '',
      ctx.player.selectedFocus ?? '',
      ctx.ai.focus,
      ctx.player.focus,
      ctx.ai.hp,
      ctx.player.hp,
      (ctx.ai.usedCardIds || []).join(','),
      (ctx.player.usedCardIds || []).join(','),
    ].join('|');
  }, [gameState]);

  const computeDecision = useCallback(
    (options = {}) => {
      const key = decisionKey();
      if (
        pendingDecisionRef.current &&
        pendingKeyRef.current === key &&
        !options.force
      ) {
        return pendingDecisionRef.current;
      }

      const context = buildAIContext(gameState);
      const decision = chooseAIAction(context, context.difficulty, {
        rng: options.rng || defaultRng,
      });

      pendingDecisionRef.current = decision;
      pendingKeyRef.current = key;
      return decision;
    },
    [decisionKey, gameState]
  );

  /**
   * Seleziona un agente per l'IA (compatibilità: memorizza decisione completa).
   */
  const selectEnemyAgent = useCallback(() => {
    const decision = computeDecision();
    return decision?.card ?? null;
  }, [computeDecision]);

  /**
   * Restituisce il Focus della stessa decisione memorizzata (non ricalcola a parte).
   */
  const calculateEnemyFocus = useCallback(
    (agent) => {
      const decision = computeDecision();
      if (decision?.card && agent && decision.card.id !== agent.id) {
        // Call site ha passato un agente diverso: ricalcola forzando
        pendingDecisionRef.current = null;
        const fresh = computeDecision({ force: true });
        return fresh?.focus ?? 1;
      }
      return decision?.focus ?? 1;
    },
    [computeDecision]
  );

  /**
   * Percorso principale: carta + Focus insieme.
   */
  const selectEnemyAgentAndFocus = useCallback(
    (logSelection = true) => {
      pendingDecisionRef.current = null;
      const decision = computeDecision({ force: true });
      if (!decision?.card) return null;

      setEnemyAgent(decision.card);
      setEnemySelectedFocus(decision.focus);

      if (logSelection) {
        setLogs((prev) => [
          ...prev.slice(-20),
          `[R${roundNumber}] IA schiera ${decision.card.name} con ${decision.focus} FC`,
        ]);
      }

      return {
        agent: decision.card,
        focus: decision.focus,
        fieldIndex: decision.fieldIndex,
        debug: decision.debug,
      };
    },
    [computeDecision, setEnemyAgent, setEnemySelectedFocus, setLogs, roundNumber]
  );

  const selectEnemyAgentAdvanced = useCallback(() => {
    return selectEnemyAgentAndFocus();
  }, [selectEnemyAgentAndFocus]);

  /**
   * Scelta Campo (puro + profilo difficoltà).
   */
  const selectEnemyField = useCallback(() => {
    const context = buildAIContext(gameState);
    const profile = getAIProfile(context.difficulty);
    return chooseAIFieldPure(context, profile, { rng: defaultRng });
  }, [gameState]);

  /**
   * Tempo di "pensiero" dell'IA in ms — resta casuale a livello React.
   */
  const getThinkingTime = useCallback(() => {
    const difficulty = aiDifficulty === 'chaos' ? 'medium' : aiDifficulty;
    const r = Math.random();
    if (difficulty === 'easy') {
      return r < 0.5 ? 800 + Math.random() * 900 : 1800 + Math.random() * 1200;
    }
    if (difficulty === 'hard') {
      return r < 0.2 ? 1200 + Math.random() * 800 : 2000 + Math.random() * 2000;
    }
    return 1200 + Math.random() * 2000;
  }, [aiDifficulty]);

  return {
    selectEnemyAgent,
    calculateEnemyFocus,
    selectEnemyAgentAndFocus,
    selectEnemyAgentAdvanced,
    selectEnemyField,
    getThinkingTime,
  };
}
