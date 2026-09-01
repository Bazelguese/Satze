// ============================================
// HOOK: useAI — adapter React sul motore puro src/game/ai
// ============================================

import { useCallback, useRef, useState } from 'react';
import {
  buildAIContext,
  buildPublicDecisionKey,
  chooseAIAction,
  chooseAIActionAsync,
  chooseJointAIAction,
  chooseJointAIActionAsync,
  defaultRng,
  formatAIReasoningEntry,
} from '../game/ai/index.js';
import { isAiWorkerSupported, runAiDecisionInWorker } from '../game/ai/aiWorkerClient.js';
import { getAvailableCards, getLegalFocusRange } from '../game/ai/generateAIActions.js';

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
  /** Evita doppio log quando joint Campo viene riusata in selectAgent. */
  const loggedDecisionKeyRef = useRef(null);

  /** Log ragionamenti IA della partita corrente (UI post-match). */
  const [aiDecisionLog, setAiDecisionLog] = useState([]);

  const clearPendingDecision = useCallback(() => {
    pendingDecisionRef.current = null;
    pendingKeyRef.current = null;
  }, []);

  /** Nuova partita / rematch: azzera cache e log ragionamenti. */
  const resetAiSession = useCallback(() => {
    clearPendingDecision();
    loggedDecisionKeyRef.current = null;
    setAiDecisionLog([]);
  }, [clearPendingDecision]);

  const recordDecision = useCallback((decision, context, kind, publicKey) => {
    if (!decision?.card) return;
    const round = context?.roundNumber ?? '?';
    const contentKey = `R${round}-${kind}-${decision.cardId}-f${decision.focus}-fi${decision.fieldIndex ?? 'x'}`;
    const dedupeKey = contentKey || publicKey;
    if (loggedDecisionKeyRef.current === dedupeKey) return;
    // Evita doppio log joint→agent sullo stesso schieramento
    if (
      kind !== 'joint' &&
      loggedDecisionKeyRef.current?.startsWith(`R${round}-joint-${decision.cardId}-f${decision.focus}-fi`)
    ) {
      return;
    }
    loggedDecisionKeyRef.current = dedupeKey;

    const entry = formatAIReasoningEntry(decision, {
      context,
      kind,
      difficulty: context?.difficulty,
      roundNumber: context?.roundNumber,
    });
    setAiDecisionLog((prev) => [...prev, entry].slice(-40));
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

  const runDecisionEngineAsync = useCallback(async (context, needsJoint, rng) => {
    // Joint multi-Campo sul worker poteva restare appeso senza risposta → UI bloccata.
    // Sul main thread la joint è ora lean (no deep search) e fa yield tra Campi.
    if (!needsJoint && isAiWorkerSupported()) {
      try {
        return await runAiDecisionInWorker(context, context.difficulty, false);
      } catch {
        /* fallback main thread */
      }
    }
    return needsJoint
      ? chooseJointAIActionAsync(context, context.difficulty, { rng })
      : chooseAIActionAsync(context, context.difficulty, { rng });
  }, []);

  const computeDecisionAsync = useCallback(
    async (options = {}) => {
      if (!options.force) {
        const reusable = getReusableDecision();
        if (reusable) return reusable;
      }

      const context = buildAIContext(gameStateRef.current);
      const key = buildPublicDecisionKey(context);

      const needsJoint =
        options.joint ||
        (context.currentFieldIndex == null && context.isPlayerFirst === false);

      const rng = options.rng || defaultRng;
      const decision = await runDecisionEngineAsync(context, needsJoint, rng);

      if (decision?.card && options.record !== false) {
        const kind = needsJoint
          ? 'joint'
          : context.isPlayerFirst
            ? 'response'
            : 'lead';
        recordDecision(decision, context, kind, key);
      }

      return storeDecision(decision, key);
    },
    [getReusableDecision, storeDecision, recordDecision, runDecisionEngineAsync]
  );

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

      if (decision?.card && options.record !== false) {
        const kind = needsJoint
          ? 'joint'
          : context.isPlayerFirst
            ? 'response'
            : 'lead';
        recordDecision(decision, context, kind, key);
      }

      return storeDecision(decision, key);
    },
    [getReusableDecision, storeDecision, recordDecision]
  );

  const selectEnemyAgent = useCallback(() => {
    const decision = computeDecision();
    return decision?.card ?? null;
  }, [computeDecision]);

  const calculateEnemyFocus = useCallback(
    (agent) => {
      const clampFocus = (focus) => {
        const { maxFocus } = getLegalFocusRange(buildAIContext(gameStateRef.current), 'ai');
        if (maxFocus < 1) return 0;
        const n = Number(focus);
        if (!Number.isFinite(n)) return 1;
        return Math.max(1, Math.min(maxFocus, n));
      };
      const decision = computeDecision();
      if (decision?.card && agent && decision.card.id !== agent.id) {
        const fresh = computeDecision({ force: true });
        return clampFocus(fresh?.focus);
      }
      return clampFocus(decision?.focus);
    },
    [computeDecision]
  );

  const selectEnemyAgentAndFocus = useCallback(
    (logSelection = true) => {
      const state = gameStateRef.current;
      // Riusa decisione congiunta se presente (non forzare ricalcolo)
      let decision = getReusableDecision();
      let fromCache = Boolean(decision?.card);
      if (!decision?.card) {
        decision = computeDecision({ force: false });
        fromCache = false;
      }
      if (!decision?.card) {
        decision = computeDecision({ force: true });
        fromCache = false;
      }
      if (!decision?.card) return null;

      // Coerenza Campo: se il Campo corrente non combacia, ricalcola sul Campo fissato
      if (
        state.currentFieldIndex != null &&
        decision.fieldIndex != null &&
        decision.fieldIndex !== state.currentFieldIndex
      ) {
        decision = computeDecision({ force: true });
        fromCache = false;
      }
      if (!decision?.card) return null;

      const ctx = buildAIContext(state);
      if (!isPendingCardPlayable(ctx, decision.card)) {
        clearPendingDecision();
        decision = computeDecision({ force: true });
        fromCache = false;
      }
      if (!decision?.card || !isPendingCardPlayable(buildAIContext(state), decision.card)) {
        return null;
      }

      const { maxFocus } = getLegalFocusRange(buildAIContext(state), 'ai');
      if (maxFocus < 1) return null;
      const focus = Math.max(1, Math.min(maxFocus, decision.focus));

      // Se riusiamo la joint già loggata in selectEnemyField, non riloggare.
      // Se è una risposta / lead senza joint precedente, computeDecision ha già registrato.
      if (fromCache && decision.debug?.jointAction) {
        // già in log
      }

      state.setEnemyAgent(decision.card);
      state.setEnemySelectedFocus(focus);

      if (logSelection) {
        // FC investiti: solo in phaseLogs.phase2
        state.setLogs((prev) => [
          ...prev.slice(-20),
          `[R${state.roundNumber}] IA schiera ${decision.card.name}`,
        ]);
      }

      return {
        agent: decision.card,
        focus,
        fieldIndex: decision.fieldIndex ?? state.currentFieldIndex,
        debug: decision.debug,
      };
    },
    [getReusableDecision, computeDecision, isPendingCardPlayable, clearPendingDecision]
  );

  const selectEnemyAgentAndFocusAsync = useCallback(
    async (logSelection = true) => {
      const state = gameStateRef.current;
      let decision = getReusableDecision();
      let fromCache = Boolean(decision?.card);
      if (!decision?.card) {
        decision = await computeDecisionAsync({ force: false });
        fromCache = false;
      }
      if (!decision?.card) {
        decision = await computeDecisionAsync({ force: true });
        fromCache = false;
      }
      if (!decision?.card) return null;

      if (
        state.currentFieldIndex != null &&
        decision.fieldIndex != null &&
        decision.fieldIndex !== state.currentFieldIndex
      ) {
        decision = await computeDecisionAsync({ force: true });
        fromCache = false;
      }
      if (!decision?.card) return null;

      const ctx = buildAIContext(state);
      if (!isPendingCardPlayable(ctx, decision.card)) {
        clearPendingDecision();
        decision = await computeDecisionAsync({ force: true });
        fromCache = false;
      }
      if (!decision?.card || !isPendingCardPlayable(buildAIContext(state), decision.card)) {
        return null;
      }

      const { maxFocus } = getLegalFocusRange(buildAIContext(state), 'ai');
      if (maxFocus < 1) return null;
      const focus = Math.max(1, Math.min(maxFocus, decision.focus));

      if (fromCache && decision.debug?.jointAction) {
        /* già in log */
      }

      state.setEnemyAgent(decision.card);
      state.setEnemySelectedFocus(focus);

      if (logSelection) {
        state.setLogs((prev) => [
          ...prev.slice(-20),
          `[R${state.roundNumber}] IA schiera ${decision.card.name}`,
        ]);
      }

      return {
        agent: decision.card,
        focus,
        fieldIndex: decision.fieldIndex ?? state.currentFieldIndex,
        debug: decision.debug,
      };
    },
    [getReusableDecision, computeDecisionAsync, isPendingCardPlayable, clearPendingDecision]
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
    recordDecision(joint, { ...fieldPickContext, battlefields: context.battlefields }, 'joint', key);
    return joint.fieldIndex;
  }, [storeDecision, recordDecision]);

  const selectEnemyFieldAsync = useCallback(async () => {
    const context = buildAIContext(gameStateRef.current);
    const fieldPickContext = {
      ...context,
      currentFieldIndex: null,
      field: null,
    };
    const joint = await runDecisionEngineAsync(fieldPickContext, true, defaultRng);
    if (!joint) return null;

    const key = buildPublicDecisionKey(fieldPickContext);
    storeDecision(joint, key);
    recordDecision(joint, { ...fieldPickContext, battlefields: context.battlefields }, 'joint', key);
    return joint.fieldIndex;
  }, [storeDecision, recordDecision, runDecisionEngineAsync]);

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
    selectEnemyAgentAndFocusAsync,
    selectEnemyAgentAdvanced,
    selectEnemyField,
    selectEnemyFieldAsync,
    getThinkingTime,
    clearPendingDecision,
    resetAiSession,
    aiDecisionLog,
  };
}
