/**
 * Body visibility vs Aurora clash.
 * Hard cut at phase 4 when clash VFX is on: avoids double cards/orbits
 * and avoids the floating FC-only ring. Aurora owns orbits via OrbitCollapse.
 */
export const FC_AURORA_BODY_HOLD_MS = 0;

/**
 * @param {number} duelPhase
 * @param {boolean} clashVfxEnabled
 */
export function useClashFocusHandoff(duelPhase, clashVfxEnabled) {
  const showBodies = duelPhase < 4 || !clashVfxEnabled;
  const cinemaHideAgent = false;
  const keepOrbitThroughClash = !clashVfxEnabled;

  return { showBodies, cinemaHideAgent, keepOrbitThroughClash };
}
