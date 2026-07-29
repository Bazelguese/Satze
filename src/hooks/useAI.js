// ============================================
// HOOK: useAI — adapter React sul motore puro src/game/ai
// ============================================

import { useCallback, useRef } from 'react';
import {
  buildAIContext,
  buildPublicDecisionKey,
  chooseAIAction,
  chooseJointAIAction,
  defaultRng,
} from '../game/ai/index.js';
import { getAvailableCards } from '../game/ai/generateAIActions.js';

/**
 * Hook per gestire la logica dell'IA
 * @param {Object} gameState - Stato del gioco da useGameState
 * @returns {Object} Funzioni per gestire l'IA
 */
export function useAI(gameState) {
  /** Sempre lo stato più recente senza ricreare le callback a ogni render. */
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  /** Decisione congiunta { fieldIndex, card, focus } da riusare nello stesso round. */
  const pendingDecisionRef = useRef(null);
  const pendingKeyRef = useRef(null);

  const clearPendingDecision = useCallback(() => {
    pendingDecisionRef.current = null;
    pendingKeyRef.current = null;
  }, []);

  const storeDecision = useCallback((decision, key) => {
    pendingDecisionRef.current = decision;
    pendingKeyRef.current = key;
    return decision;
  }, []);

  /** La carta in cache deve essere ancora giocabile nella mano IA corrente. */
  const isPendingCardPlayable = useCallback((ctx, card) => {
    if (card == null || card.id == null) return false;
    const available = getAvailableCards(ctx.ai?.hand, ctx.ai?.usedCardIds);
    return available.some((c) => c.id === card.id);
  }, []);

  /**
   * Riusa la decisione congiunta se ancora valida per lo stato pubblico corrente.
   */
  const getReusableDecision = useCallback(() => {
    const state = gameStateRef.current;
    const ctx = buildAIContext(state);
    const key = buildPublicDecisionKey(ctx);
    const pending = pendingDecisionRef.current;
    if (!pending?.card || pendingKeyRef.current == null) return null;

    // Evita fantasma da partita/round precedente (altra armata o carta già usata)
    if (!isPendingCardPlayable(ctx, pending.card)) {
      clearPendingDecision();
      return null;
    }

    // Chiave completa uguale → ok
    if (pendingKeyRef.current === key) return pending;

    // Dopo scelta Campo: currentFieldIndex entra nella key; accetta se campo/carta/focus coerenti
    if (
      pending.fieldIndex != null &&
      ctx.currentFieldIndex === pending.fieldIndex &&
      pending.card &&
      pending.focus >= 1
    ) {
      // Aggiorna key allo stato corrente (Campo ora fissato) senza ricalcolare
      pendingKeyRef.current = key;
      return pending;
    }

    return null;
  }, [clearPendingDecision, isPendingCardPlayable]);

  const computeDecision = useCallback(
    (options = {}) => {
      if (!options.force) {
        const reusable = getReusableDecision();
        if (reusable) return reusable;
      }

      const context = buildAIContext(gameStateRef.current);
      const key = buildPublicDecisionKey(context);

      // Se il Campo non è ancora scelto e l'IA apre, decisione congiunta
      const needsJoint =
        options.joint ||
        (context.currentFieldIndex == null && context.isPlayerFirst === false);

      const decision = needsJoint
        ? chooseJointAIAction(context, context.difficulty, {
            rng: options.rng || defaultRng,
          })
        : chooseAIAction(context, context.difficulty, {
            rng: options.rng || defaultRng,
          });

      return storeDecision(decision, key);
    },
    [getReusableDecision, storeDecision]
  );

  const selectEnemyAgent = useCallback(() => {
    const decision = computeDecision();
    return decision?.card ?? null;
  }, [computeDecision]);

  const calculateEnemyFocus = useCallback(
    (agent) => {
      const decision = computeDecision();
      if (decision?.card && agent && decision.card.id !== agent.id) {
        const fresh = computeDecision({ force: true });
        return fresh?.focus ?? 1;
      }
      return decision?.focus ?? 1;
    },
    [computeDecision]
  );

  const selectEnemyAgentAndFocus = useCallback(
    (logSelection = true) => {
      const state = gameStateRef.current;
      // Riusa decisione congiunta se presente (non forzare ricalcolo)
      let decision = getReusableDecision();
      if (!decision?.card) {
        decision = computeDecision({ force: false });
      }
      if (!decision?.card) {
        decision = computeDecision({ force: true });
      }
      if (!decision?.card) return null;

      // Coerenza Campo: se il Campo corrente non combacia, ricalcola sul Campo fissato
      if (
        state.currentFieldIndex != null &&
        decision.fieldIndex != null &&
        decision.fieldIndex !== state.currentFieldIndex
      ) {
        decision = computeDecision({ force: true });
      }
      if (!decision?.card) return null;

      const ctx = buildAIContext(state);
      if (!isPendingCardPlayable(ctx, decision.card)) {
        clearPendingDecision();
        decision = computeDecision({ force: true });
      }
      if (!decision?.card || !isPendingCardPlayable(buildAIContext(state), decision.card)) {
        return null;
      }

      state.setEnemyAgent(decision.card);
      state.setEnemySelectedFocus(decision.focus);

      if (logSelection) {
        // FC investiti: solo in phaseLogs.phase2
        state.setLogs((prev) => [
          ...prev.slice(-20),
          `[R${state.roundNumber}] IA schiera ${decision.card.name}`,
        ]);
      }

      return {
        agent: decision.card,
        focus: decision.focus,
        fieldIndex: decision.fieldIndex ?? state.currentFieldIndex,
        debug: decision.debug,
      };
    },
    [getReusableDecision, computeDecision, isPendingCardPlayable, clearPendingDecision]
  );

  const selectEnemyAgentAdvanced = useCallback(() => {
    return selectEnemyAgentAndFocus();
  }, [selectEnemyAgentAndFocus]);

  /**
   * Scelta Campo via azione congiunta: memorizza anche carta+Focus.
   */
  const selectEnemyField = useCallback(() => {
    const context = buildAIContext(gameStateRef.current);
    // Forza contesto senza Campo corrente per valutare i legali
    const fieldPickContext = {
      ...context,
      currentFieldIndex: null,
      field: null,
    };
    const joint = chooseJointAIAction(fieldPickContext, context.difficulty, {
      rng: defaultRng,
    });
    if (!joint) return null;

    // Key basata sullo stato al momento della scelta Campo (senza field index)
    const key = buildPublicDecisionKey(fieldPickContext);
    storeDecision(joint, key);
    return joint.fieldIndex;
  }, [storeDecision]);

  const getThinkingTime = useCallback(() => {
    const difficulty =
      gameStateRef.current.aiDifficulty === 'chaos'
        ? 'medium'
        : gameStateRef.current.aiDifficulty || 'medium';
    const r = Math.random();
    if (difficulty === 'easy') {
      return r < 0.5 ? 800 + Math.random() * 900 : 1800 + Math.random() * 1200;
    }
    if (difficulty === 'hard') {
      return r < 0.2 ? 1200 + Math.random() * 800 : 2000 + Math.random() * 2000;
    }
    return 1200 + Math.random() * 2000;
  }, []);

  return {
    selectEnemyAgent,
    calculateEnemyFocus,
    selectEnemyAgentAndFocus,
    selectEnemyAgentAdvanced,
    selectEnemyField,
    getThinkingTime,
    clearPendingDecision,
  };
}
