/** Parametri playtest Arena — Contesa v0.3 */
export const ARENA_CONTESA = {
  maxHp: 50,
  startFocus: 36,
  conquestThreshold: 6,
  handSize: 5,
  reserveSize: 5,
  deckSize: 10,
  players: 4,
  fieldPoolSize: 12,
  maxGiro: 5,
};

export const ARENA_PHASES = {
  SCELTA_CAMPO: 'sceltaCampo',
  CHIAMATA: 'chiamata',
  RISPOSTE: 'risposte',
  CONTESTAZIONE: 'contestazione',
  DUELLO: 'duello',
  SOSTITUZIONE: 'sostituzione',
  GAME_OVER: 'gameOver',
};

export const ARENA_PHASE_LABELS = {
  [ARENA_PHASES.SCELTA_CAMPO]: '1 · Scelta Campo',
  [ARENA_PHASES.CHIAMATA]: '2 · Dichiarazione',
  [ARENA_PHASES.RISPOSTE]: '3 · Contesta / Passa',
  [ARENA_PHASES.CONTESTAZIONE]: '4 · Contestatore',
  [ARENA_PHASES.DUELLO]: '5 · Duello 1v1',
  [ARENA_PHASES.SOSTITUZIONE]: '6 · Riserva',
  [ARENA_PHASES.GAME_OVER]: 'Fine partita',
};

export const SEAT_NAMES = {
  A: 'Tu',
  B: 'Kael',
  C: 'Mira',
  D: 'Soren',
};
