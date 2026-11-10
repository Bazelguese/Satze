// ============================================
// Calendario dell'iniziativa (turni futuri)
// ============================================
//
// L'iniziativa non dipende dall'esito dei duelli: si alterna da openingPlayerFirst
// (con i profili campagna assault/defense e alwaysPlayerFirst), come resolveRoundInitiative.
// Quindi chi sceglie per primo nei turni futuri è noto in anticipo.

import { resolveRoundInitiative } from '../duel/resolveRoundInitiative.js';

function campaignMod(source) {
  return source?._refs?.campaignDuelMod ?? source?.campaignDuelMod ?? null;
}

/**
 * true se nel turno `round` sceglie per primo il giocatore.
 * Accetta sia uno stato strategico sia un information set.
 */
export function playerFirstInRound(source, round) {
  const mod = campaignMod(source);
  if (mod?.alwaysPlayerFirst) return true;
  const profile = source?.initiativeProfile ?? mod?.initiativeProfile ?? null;
  if (source?.openingPlayerFirst != null) {
    return resolveRoundInitiative({
      roundNumber: round,
      openingPlayerFirst: Boolean(source.openingPlayerFirst),
      initiativeProfile: profile,
    });
  }
  // Apertura sconosciuta: alterna dal turno corrente.
  const current = Math.max(1, Number(source?.roundNumber) || 1);
  const playerFirstNow = source?.initiativeSide
    ? source.initiativeSide === 'player'
    : source?.isPlayerFirst !== false;
  return playerFirstNow === (Math.abs(round - current) % 2 === 0);
}

/** true se nel turno `round` sceglie per primo `side` ('ai' | 'player'). */
export function sideFirstInRound(source, side, round) {
  const playerFirst = playerFirstInRound(source, round);
  return side === 'ai' ? !playerFirst : playerFirst;
}

/**
 * Turni futuri (dopo quello corrente) in cui `side` gioca in prima (`wantFirst`) o seconda
 * posizione, fra quelli che le sue carte rimaste possono ancora coprire.
 *
 * @param {object} source
 * @param {'ai'|'player'} side
 * @param {boolean} wantFirst
 * @param {number} cardsRemaining - carte del lato ancora da giocare, compresa quella del turno corrente
 */
export function countFuturePositionWindows(source, side, wantFirst, cardsRemaining) {
  const current = Math.max(1, Number(source?.roundNumber) || 1);
  const last = current + Math.max(0, (Number(cardsRemaining) || 0) - 1);
  let windows = 0;
  for (let round = current + 1; round <= last; round += 1) {
    if (sideFirstInRound(source, side, round) === wantFirst) windows += 1;
  }
  return windows;
}
