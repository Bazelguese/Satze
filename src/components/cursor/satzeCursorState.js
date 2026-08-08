/**
 * Bridge leggero: SatzeGame aggiorna army/inDuel; SatzeCursorHost legge lo stato.
 * Serve perché satze.jsx ha molti early-return e non può montare il cursore in un solo return.
 */

const DUEL_PHASES = new Set([
  'selectField',
  'shuffleDeal',
  'selectAgent',
  'selectFocus',
  'battle',
  'result',
  'gameOver',
]);

let state = {
  army: null,
  inDuel: false,
  enabled: true,
  /** Centro schermo della carta vera in drag, o null */
  dragCard: null,
};

const listeners = new Set();

export function isSatzeCursorDuelPhase(gamePhase) {
  return DUEL_PHASES.has(gamePhase);
}

export function getSatzeCursorProps() {
  return state;
}

export function setSatzeCursorProps(partial) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener(state));
}

export function subscribeSatzeCursor(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}
