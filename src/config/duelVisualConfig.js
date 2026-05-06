// ============================================
// Default tempi ed effetti visivi del duello (solo presentazione)
// Modificabili da Duel VFX Lab e localStorage
// ============================================

/** @typedef {typeof DUEL_VISUAL_DEFAULTS} DuelVisualConfig */

export const DUEL_VISUAL_DEFAULTS = {
  /** Durata fase 0 — Schieramento (ms) */
  phaseMs0: 2000,
  /** Durata fase 1 — Poteri (ms) */
  phaseMs1: 2500,
  /** Intervallo tra ogni focus coin in fase 2 (ms) */
  focusCoinStepMs: 500,
  /** Buffer aggiunto dopo l’ultimo focus coin prima della fase 3 (ms) */
  focusPhaseBufferMs: 500,
  /** Durata fase 3 — Calcolo VA (ms) */
  phaseMs3: 2000,
  /** Fase 3 senza mod VA né clamp al minimo: passaggio rapido (ms) */
  phaseMs3Empty: 240,
  /** Durata fase 4 — Scontro (ms) */
  phaseMs4: 2000,
  /** Durata fase 5 — Risultato prima del pulsante (ms) */
  phaseMs5: 1500,
  /** Tick animazione arcobaleno / diamante (ms tra un frame e l’altro) */
  rainbowIntervalMs: 50,
  /** Incremento `rainbowTime` per tick */
  rainbowStep: 0.05,
  /** Moltiplicatori velocità tinta (count 12 / 13 / 14) */
  rainbowHueMul12: 60,
  rainbowHueMul13: 120,
  rainbowHueMul14: 180,
  /** Pausa dopo animazione clash su “Continua” (ms) */
  nextRoundClashHoldMs: 1000,
  /** Transizione zoom pannelli duello (ms) */
  zoomTransitionMs: 1200,
  /** Ritardo transizione quando si attiva lo zoom (ms) */
  zoomDelayMs: 200,
};

export const DUEL_VISUAL_STORAGE_KEY = 'satze_duel_vfx';

export const DUEL_VFX_CHANGED_EVENT = 'satze-duel-vfx-changed';

/**
 * @param {Partial<DuelVisualConfig>} partial
 * @returns {DuelVisualConfig}
 */
export function mergeDuelVisualConfig(partial) {
  return { ...DUEL_VISUAL_DEFAULTS, ...partial };
}
