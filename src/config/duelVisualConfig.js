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

/** Mapping lineare-clamped dei VFX clash (fase 4) basato su gap VA e FC totali. */
export const CLASH_VFX_RANGES = {
  gap: { min: 0, max: 15, speedMin: 0.7, speedMax: 1.5 },
  fc: { min: 2, max: 16, intMin: 0.3, intMax: 1.6 },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Restituisce valori VFX dinamici per la fase 4:
 * - clashSpeed in base al gap VA (dominazione => più rapido)
 * - intensity in base ai FC totali investiti (posta in gioco => più intensa)
 */
export function computeDynamicClashVfx(battleResult) {
  const pVa = toFiniteNumber(battleResult?.playerAssault, 0);
  const eVa = toFiniteNumber(battleResult?.enemyAssault, 0);
  const pFc = toFiniteNumber(battleResult?.playerFocusUsed, 0);
  const eFc = toFiniteNumber(battleResult?.enemyFocusUsed, 0);

  const gap = Math.abs(pVa - eVa);
  const totalFc = pFc + eFc;
  const { gap: g, fc: f } = CLASH_VFX_RANGES;
  const gapNorm = clamp01((gap - g.min) / (g.max - g.min));
  const fcNorm = clamp01((totalFc - f.min) / (f.max - f.min));

  const clashSpeed = lerp(g.speedMin, g.speedMax, gapNorm);
  const intensity = lerp(f.intMin, f.intMax, fcNorm);
  return {
    clashSpeed: Number.isFinite(clashSpeed) && clashSpeed > 0 ? clashSpeed : 1,
    intensity: Number.isFinite(intensity) && intensity > 0 ? intensity : 1,
    gap,
    totalFc,
  };
}

/**
 * @param {Partial<DuelVisualConfig>} partial
 * @returns {DuelVisualConfig}
 */
export function mergeDuelVisualConfig(partial) {
  const merged = { ...DUEL_VISUAL_DEFAULTS, ...(partial || {}) };
  const out = { ...merged };
  for (const key of Object.keys(DUEL_VISUAL_DEFAULTS)) {
    const def = DUEL_VISUAL_DEFAULTS[key];
    if (typeof def === 'number') {
      const n = Number(merged[key]);
      out[key] = Number.isFinite(n) ? n : def;
    }
  }
  return out;
}
