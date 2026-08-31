// ============================================
// EMINENZE — Risoluzione delle Eminenze in gioco all'avvio dello Scontro
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §1.2
// ============================================

import { EMINENCE_FORMAT, SIDES } from './eminenceConstants.js';
import {
  createEminenceMatchState,
  getEligibleEminences,
  validateDeckEminence,
} from './eminenceState.js';
import { beginEminenceRound } from './eminenceRound.js';

/**
 * Determina l'Eminenza di un lato a partire dal mazzo e dalla scelta registrata.
 *
 * La specifica assegna la scelta al deckbuilding: è il giocatore a registrare quale delle
 * Armate eleggibili porta in campo. Finché la decklist non trasporta quel campo, un mazzo
 * con una sola Armata eleggibile ha comunque una risposta univoca, mentre un 5-5 no. In quel
 * caso la derivazione qui è un ripiego deterministico segnalato da `ambiguous`, non una
 * scelta di design: chi costruisce la UI deve chiedere prima di arrivare qui.
 *
 * @param {Array<{army: string}>} deckCards
 * @param {string|null} requestedId Eminenza registrata nella decklist, se esiste
 * @param {string} format
 * @returns {{ eminenceId: string|null, derived: boolean, ambiguous: boolean,
 *   candidates: string[], reason: string|null }}
 */
export function resolveSideEminence(deckCards, requestedId = null, format = EMINENCE_FORMAT.REQUIRED) {
  if (format === EMINENCE_FORMAT.DISABLED) {
    return { eminenceId: null, derived: false, ambiguous: false, candidates: [], reason: null };
  }

  const candidates = getEligibleEminences(deckCards).map((eminence) => eminence.id);

  if (requestedId) {
    const { valid, reason } = validateDeckEminence(deckCards, requestedId, format);
    if (valid) {
      return { eminenceId: requestedId, derived: false, ambiguous: false, candidates, reason: null };
    }
    return { eminenceId: null, derived: false, ambiguous: false, candidates, reason };
  }

  if (candidates.length === 0) {
    return { eminenceId: null, derived: false, ambiguous: false, candidates, reason: 'NO_ELIGIBLE_ARMY' };
  }

  return {
    eminenceId: candidates[0],
    derived: true,
    ambiguous: candidates.length > 1,
    candidates,
    reason: null,
  };
}

/**
 * Costruisce lo stato Eminenza dei due lati per un nuovo Scontro.
 *
 * Il formato è il solo interruttore del sottosistema: fuori dai formati che lo richiedono
 * lo stato resta disattivato e il resto del motore non cambia comportamento.
 *
 * @returns {{ matchState: object, playerResolution: object, enemyResolution: object }}
 */
export function createMatchEminenceState({
  format = EMINENCE_FORMAT.DISABLED,
  playerDeck = [],
  enemyDeck = [],
  playerEminenceId = null,
  enemyEminenceId = null,
} = {}) {
  const playerResolution = resolveSideEminence(playerDeck, playerEminenceId, format);
  const enemyResolution = resolveSideEminence(enemyDeck, enemyEminenceId, format);

  const created = createEminenceMatchState({
    format,
    playerEminenceId: playerResolution.eminenceId,
    enemyEminenceId: enemyResolution.eminenceId,
  });

  return {
    // Il primo round si apre subito: uno stato senza progressione dei gate non è
    // utilizzabile, e restituirlo costringerebbe ogni chiamante a ricordarsene.
    matchState: beginEminenceRound(created, { roundNumber: 1 }),
    playerResolution,
    enemyResolution,
  };
}

/**
 * Formato del sottosistema per una partita.
 *
 * Default disattivato: una partita che non chiede esplicitamente le Eminenze si comporta
 * esattamente come prima della loro introduzione.
 */
export function resolveEminenceFormat(startOptions = null) {
  const requested = startOptions?.eminenceFormat;
  return requested === EMINENCE_FORMAT.REQUIRED ? EMINENCE_FORMAT.REQUIRED : EMINENCE_FORMAT.DISABLED;
}

export { EMINENCE_FORMAT, SIDES };
