/** Tempi dialogue nel duello dev (DIALOGUE DUELLO). */

/** ms per carattere (typewriter). */
export const DIALOGUE_CHAR_MS = 36;

/** Pausa tra una riga e la successiva. */
export const DIALOGUE_PAUSE_MS = 1600;

/** Ritardo default prima del fumetto (fasi > 0). */
export const DIALOGUE_PHASE_START_DELAY_MS = 400;

/** Ritardo entrata: immediato (evita cancellazione al cambio fase). */
export const DIALOGUE_ENTRADA_DELAY_MS = 0;

/** Fasi duello UI con fumetti agente. 2 = Opportunista · 3/4/6 = silenzio. */
export const DIALOGUE_DUEL_PHASES = [0, 1, 2, 5];

/** Set per lookup rapido. */
export const DIALOGUE_DUEL_PHASE_SET = new Set(DIALOGUE_DUEL_PHASES);

/** Fase 7 regolamento — scarto agenti (animazione Continua). */
export const DUEL_DIALOGUE_MORTE_PHASE = 7;

export function getDialoguePhaseStartDelayMs(duelPhase) {
  if (duelPhase === 0) return DIALOGUE_ENTRADA_DELAY_MS;
  if (duelPhase === DUEL_DIALOGUE_MORTE_PHASE) return DIALOGUE_ENTRADA_DELAY_MS;
  return DIALOGUE_PHASE_START_DELAY_MS;
}
