// ============================================
// EMINENZE — Economia della Presenza
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §2, §8.1
// ============================================

import { SIDES } from './eminenceConstants.js';

/**
 * Unica via di modifica della Presenza.
 *
 * Distingue **spesa** da semplice **perdita**: un futuro effetto "perdi 1 Presenza" non
 * conta come "spendi 1 Presenza" e non alimenta Manifestazione né Fervore (§2.6).
 *
 * @param {object} state stato Eminenza di un lato
 * @param {number} delta variazione richiesta
 * @param {object} options
 * @param {string} options.reason etichetta leggibile per il log
 * @param {boolean} [options.countsAsSpend=false] se la diminuzione è una spesa
 * @param {string|null} [options.source] id abilità/statico che ha causato la variazione
 * @param {number|null} [options.roundNumber]
 * @returns {{ state: object, event: object|null }}
 */
export function changePresence(state, delta, {
  reason = 'unspecified',
  countsAsSpend = false,
  source = null,
  roundNumber = null,
} = {}) {
  if (!state) return { state, event: null };
  if (!delta) return { state, event: null };

  const before = state.presence;
  const after = Math.max(0, before + delta);
  // Il clamp può rendere la variazione applicata più piccola di quella richiesta: i
  // contatori di spesa devono seguire ciò che è realmente accaduto, non l'intenzione.
  const applied = after - before;

  const next = { ...state, presence: after };

  if (countsAsSpend && applied < 0) {
    const spent = Math.abs(applied);
    next.presenceSpentThisRound = state.presenceSpentThisRound + spent;
    next.totalPresenceSpent = state.totalPresenceSpent + spent;
  }

  return {
    state: next,
    event: {
      type: 'PRESENCE_CHANGE',
      eminenceId: state.eminenceId,
      before,
      after,
      requestedDelta: delta,
      appliedDelta: applied,
      countsAsSpend: countsAsSpend && applied < 0,
      reason,
      source,
      roundNumber,
    },
  };
}

/**
 * Applica la variazione di Presenza a un lato dello stato di partita.
 * @returns {{ matchState: object, event: object|null }}
 */
export function changeSidePresence(matchState, side, delta, options = {}) {
  if (!matchState || !matchState[side]) return { matchState, event: null };

  const { state, event } = changePresence(matchState[side], delta, options);
  if (!event) return { matchState, event: null };

  return {
    matchState: { ...matchState, [side]: state },
    event: { ...event, side },
  };
}

/**
 * Snapshot canonico della Presenza (§8.1).
 *
 * Fissato immediatamente prima della verifica dei normali trigger degli Agenti, dopo tutti
 * gli effetti Pre-Trigger del round. I trigger Eminenza del Duello usano questo snapshot e
 * non vengono ricalcolati: le variazioni successive restano reali ma non retroagiscono.
 *
 * @returns {{ player: object, enemy: object }} valori già campionati, non riferimenti vivi
 */
export function capturePresenceSnapshot(matchState) {
  const player = matchState?.[SIDES.PLAYER];
  const enemy = matchState?.[SIDES.ENEMY];

  const sample = (own, other) => ({
    playerPresence: own?.presence ?? 0,
    enemyPresence: other?.presence ?? 0,
    presenceSpent: own?.presenceSpentThisRound ?? 0,
    enemyPresenceSpent: other?.presenceSpentThisRound ?? 0,
    totalPresenceSpent: own?.totalPresenceSpent ?? 0,
    enemyTotalPresenceSpent: other?.totalPresenceSpent ?? 0,
  });

  return {
    [SIDES.PLAYER]: sample(player, enemy),
    [SIDES.ENEMY]: sample(enemy, player),
  };
}

/** Snapshot neutro, usato quando il sottosistema è disattivato dal formato. */
export function createEmptyPresenceSnapshot() {
  const zero = {
    playerPresence: 0,
    enemyPresence: 0,
    presenceSpent: 0,
    enemyPresenceSpent: 0,
    totalPresenceSpent: 0,
    enemyTotalPresenceSpent: 0,
  };
  return { [SIDES.PLAYER]: { ...zero }, [SIDES.ENEMY]: { ...zero } };
}
