import { useEffect, useState } from 'react';

/**
 * Tiene i bodies (anello FC) montati all'ingresso della fase 4 con Aurora,
 * così le monete non spariscono nel gap di smontaggio → montaggio cinema.
 * Poi Aurora prosegue con FocusCoinOrbitCollapseFx.
 */
export const FC_AURORA_BODY_HOLD_MS = 520;

/**
 * @param {number} duelPhase
 * @param {boolean} clashVfxEnabled
 */
export function useClashFocusHandoff(duelPhase, clashVfxEnabled) {
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (duelPhase >= 4 && clashVfxEnabled) {
      setHolding(true);
      const timer = setTimeout(() => setHolding(false), FC_AURORA_BODY_HOLD_MS);
      return () => clearTimeout(timer);
    }
    setHolding(false);
    return undefined;
  }, [duelPhase, clashVfxEnabled]);

  const showBodies = duelPhase < 4 || !clashVfxEnabled || holding;
  /** Nasconde carta/VA dei bodies durante l'overlap con Aurora (resta solo l'anello FC). */
  const cinemaHideAgent = Boolean(duelPhase >= 4 && clashVfxEnabled && holding);
  /** Estende l'anello FC oltre la soglia fase 4 (hold Aurora, o clash VFX off fino a fase 5). */
  const keepOrbitThroughClash = !clashVfxEnabled || holding;

  return { showBodies, cinemaHideAgent, keepOrbitThroughClash };
}
