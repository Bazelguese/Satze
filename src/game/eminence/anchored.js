// ============================================
// Controllo Ancorato (spec §9.3)
// ============================================
//
// Un Agente è Ancorato se gli FC realmente investiti raggiungono
// `6 − Lega effettiva + aumenti cumulativi del requisito`.
// Lo snapshot è unico per Duello: si calcola dopo il lock FC e non si ricalcola.

import { SIDES } from './eminenceConstants.js';
import { FOCUS_READINGS, readFocus } from './focusModel.js';

const BOTH_SIDES = [SIDES.PLAYER, SIDES.ENEMY];

export function anchoredRequirement(league, thresholdDelta = 0) {
  const safeLeague = Number.isFinite(league) ? league : 0;
  return Math.max(0, 6 - safeLeague + (thresholdDelta || 0));
}

export function isAnchored({ focusInvested = 0, focus = null, league, thresholdDelta = 0 } = {}) {
  const invested = focus
    ? readFocus(focus, FOCUS_READINGS.ANCORATO)
    : Math.max(0, focusInvested || 0);
  return invested >= anchoredRequirement(league, thresholdDelta);
}

export function snapshotAnchoredBySide(matchState, {
  focusInvestedBySide = {},
  leagueBySide = {},
  thresholdDeltaBySide = {},
} = {}) {
  const snapshot = {};
  for (const side of BOTH_SIDES) {
    const thresholdDelta = thresholdDeltaBySide[side]
      ?? matchState?.[side]?.persistent?.anchoredThresholdDelta
      ?? 0;
    snapshot[side] = isAnchored({
      focusInvested: focusInvestedBySide[side] ?? 0,
      league: leagueBySide[side] ?? 0,
      thresholdDelta,
    });
  }
  return snapshot;
}

/**
 * Ancorato dell'Agente avversario misurato con la soglia del lato che legge.
 *
 * Serve agli effetti che impongono all'avversario la propria regola di Ancorato: la Lega e gli
 * FC sono quelli dell'Agente nemico, gli aumenti cumulativi del requisito sono quelli di chi
 * impone la regola.
 */
export function snapshotEnemyAnchoredByOwnRule(matchState, {
  focusInvestedBySide = {},
  leagueBySide = {},
  thresholdDeltaBySide = {},
} = {}) {
  const snapshot = {};
  for (const side of BOTH_SIDES) {
    const other = side === SIDES.PLAYER ? SIDES.ENEMY : SIDES.PLAYER;
    const thresholdDelta = thresholdDeltaBySide[side]
      ?? matchState?.[side]?.persistent?.anchoredThresholdDelta
      ?? 0;
    snapshot[side] = isAnchored({
      focusInvested: focusInvestedBySide[other] ?? 0,
      league: leagueBySide[other] ?? 0,
      thresholdDelta,
    });
  }
  return snapshot;
}
