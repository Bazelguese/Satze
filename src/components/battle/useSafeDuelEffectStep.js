import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Sub-step fasi 1, 3 e 5 senza flash del valore finale al primo frame.
 * `committedRef` parte da 1 all'ingresso e avanza solo via `advanceEffectStep`.
 */
export function useSafeDuelEffectStep(duelPhase, duelEffectStep, setDuelEffectStep) {
  const prevPhaseRef = useRef(duelPhase);
  const committedRef = useRef(1);

  const usesSubSteps = duelPhase === 1 || duelPhase === 3 || duelPhase === 5;

  if (duelPhase <= 0) {
    committedRef.current = 1;
  } else if (usesSubSteps && prevPhaseRef.current !== duelPhase) {
    committedRef.current = 1;
  }

  const visualEffectStep = usesSubSteps ? committedRef.current : duelEffectStep;

  useLayoutEffect(() => {
    if (usesSubSteps && prevPhaseRef.current !== duelPhase) {
      setDuelEffectStep(1);
    }
    prevPhaseRef.current = duelPhase;
  }, [duelPhase, setDuelEffectStep, usesSubSteps]);

  const advanceEffectStep = useCallback(() => {
    const next = committedRef.current + 1;
    committedRef.current = next;
    setDuelEffectStep(next);
  }, [setDuelEffectStep]);

  return { visualEffectStep, advanceEffectStep };
}
