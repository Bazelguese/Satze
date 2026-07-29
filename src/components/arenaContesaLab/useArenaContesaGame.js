import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARENA_PHASES,
  createArenaContesaMatch,
  selectField,
  selectAgent,
  confirmFocus,
  respond,
  resolveDuel,
  beginSubstitution,
  completeSubstitution,
  isHumanTurn,
  isLastResponder,
  getActingPlayerId,
  getMaxFocusForActing,
  runArenaAiStep,
  getArenaPlayer,
} from '../../game/arenaContesa';

const AI_STEP_MS = 700;
/** Pausa battle (pannelli vuoti) prima dello spawn result — come satze gamePhase=battle */
const DUEL_RESOLVE_MS = 450;
const SUBSTITUTION_MS = 1100;

/**
 * Istanza Contesa giocabile (1 umano + 3 IA) per il Dev tool.
 */
export function useArenaContesaGame() {
  const [match, setMatch] = useState(null);
  const [selectedFocus, setSelectedFocus] = useState(4);
  const timersRef = useRef([]);
  const busyRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const startMatch = useCallback((options = {}) => {
    clearTimers();
    busyRef.current = false;
    const m = createArenaContesaMatch(options);
    setMatch(m);
    setSelectedFocus(4);
    return m;
  }, [clearTimers]);

  const resetMatch = useCallback(() => {
    clearTimers();
    busyRef.current = false;
    setMatch(null);
  }, [clearTimers]);

  const apply = useCallback((fn) => {
    setMatch((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  const onSelectField = useCallback((fieldId) => {
    apply((m) => {
      if (!isHumanTurn(m) || m.phase !== ARENA_PHASES.SCELTA_CAMPO) return m;
      return selectField(m, fieldId);
    });
  }, [apply]);

  const onSelectAgent = useCallback((agentId) => {
    apply((m) => {
      if (!isHumanTurn(m)) return m;
      if (m.phase !== ARENA_PHASES.CHIAMATA && m.phase !== ARENA_PHASES.CONTESTAZIONE) return m;
      return selectAgent(m, agentId);
    });
  }, [apply]);

  const onConfirmFocus = useCallback((focusValue) => {
    apply((m) => {
      if (!isHumanTurn(m)) return m;
      if (m.phase !== ARENA_PHASES.CHIAMATA && m.phase !== ARENA_PHASES.CONTESTAZIONE) return m;
      return confirmFocus(m, focusValue ?? selectedFocus);
    });
  }, [apply, selectedFocus]);

  const onRespond = useCallback((choice) => {
    apply((m) => {
      if (!isHumanTurn(m) || m.phase !== ARENA_PHASES.RISPOSTE) return m;
      if (choice === 'pass' && isLastResponder(m)) {
        // UI disabilita Passa; failsafe motore
        return respond(m, 'contest');
      }
      return respond(m, choice);
    });
  }, [apply]);

  const onResolveDuel = useCallback(() => {
    apply((m) => {
      if (m.phase !== ARENA_PHASES.DUELLO) return m;
      return resolveDuel(m);
    });
  }, [apply]);

  /** Fine presentazione duello di sistema → sostituzione. */
  const onDuelPresentationComplete = useCallback(() => {
    apply((m) => {
      if (!m || m.phase !== ARENA_PHASES.DUELLO || !m.battleResult) return m;
      return beginSubstitution(m);
    });
  }, [apply]);

  // Auto: IA, resolve duello, sostituzione (la presentazione UI guida beginSubstitution)
  useEffect(() => {
    if (!match || match.phase === ARENA_PHASES.GAME_OVER) return undefined;

    clearTimers();

    // Duello: solo calcolo esito — la UI di sistema gestisce la presentazione
    if (match.phase === ARENA_PHASES.DUELLO) {
      if (!match.battleResult) {
        const id = setTimeout(() => {
          setMatch((m) => {
            if (!m || m.phase !== ARENA_PHASES.DUELLO || m.battleResult) return m;
            try {
              return resolveDuel(m);
            } catch (err) {
              console.error('[Arena Contesa] resolveDuel crashed', err);
              return beginSubstitution({
                ...m,
                logs: [...(m.logs || []), `Errore duello: ${err?.message || err}`],
              });
            }
          });
        }, DUEL_RESOLVE_MS);
        timersRef.current.push(id);
        return () => clearTimers();
      }
      // Con battleResult: aspetta onDuelPresentationComplete dalla UI di sistema
      return () => clearTimers();
    }

    // Sostituzione automatica
    if (match.phase === ARENA_PHASES.SOSTITUZIONE) {
      const id = setTimeout(() => {
        setMatch((m) => (m && m.phase === ARENA_PHASES.SOSTITUZIONE ? completeSubstitution(m) : m));
      }, SUBSTITUTION_MS);
      timersRef.current.push(id);
      return () => clearTimers();
    }

    // Turno IA
    if (!isHumanTurn(match)) {
      const id = setTimeout(() => {
        setMatch((m) => {
          if (!m || isHumanTurn(m)) return m;
          if (
            m.phase === ARENA_PHASES.DUELLO ||
            m.phase === ARENA_PHASES.SOSTITUZIONE ||
            m.phase === ARENA_PHASES.GAME_OVER
          ) {
            return m;
          }
          const next = runArenaAiStep(m);
          // Evita loop se lo step IA non ha prodotto avanzamento
          if (next === m || (next.phase === m.phase && next.responseCursor === m.responseCursor
            && next.callerAgentId === m.callerAgentId && next.contestantAgentId === m.contestantAgentId
            && next.contestedFieldId === m.contestedFieldId && next.callerFocus === m.callerFocus
            && next.contestantFocus === m.contestantFocus)) {
            return m;
          }
          return next;
        });
      }, AI_STEP_MS);
      timersRef.current.push(id);
      return () => clearTimers();
    }

    return () => clearTimers();
  }, [
    match?.phase,
    match?.battleResult,
    match?.callerId,
    match?.contestantId,
    match?.responseCursor,
    match?.callerAgentId,
    match?.contestantAgentId,
    match?.callerFocus,
    match?.contestantFocus,
    clearTimers,
  ]);

  // Sync slider FC quando cambia chi agisce
  useEffect(() => {
    if (!match) return;
    const max = getMaxFocusForActing(match);
    setSelectedFocus((v) => Math.min(Math.max(1, v), max));
  }, [match?.phase, match?.callerId, match?.contestantId]);

  const actingId = match ? getActingPlayerId(match) : null;
  const actingPlayer = match && actingId ? getArenaPlayer(match, actingId) : null;

  return {
    match,
    selectedFocus,
    setSelectedFocus,
    startMatch,
    resetMatch,
    onSelectField,
    onSelectAgent,
    onConfirmFocus,
    onRespond,
    onResolveDuel,
    onDuelPresentationComplete,
    actingId,
    actingPlayer,
    isHumanTurn: match ? isHumanTurn(match) : false,
    maxFocus: match ? getMaxFocusForActing(match) : 1,
  };
}
