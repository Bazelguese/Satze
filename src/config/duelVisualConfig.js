// ============================================
// Default tempi ed effetti visivi del duello (solo presentazione)
// Modificabili da Duel VFX Lab e localStorage
// ============================================

/** Incrementa quando cambiano i default di timing (reset override obsoleti in localStorage). */
export const DUEL_VISUAL_DEFAULTS_VERSION = 4;

/** Floor ms fase 4 (scontro) dopo clashSpeed — evita scontri troppo brevi. */
export const DUEL_PHASE4_MIN_MS = 1200;

/** @typedef {typeof DUEL_VISUAL_DEFAULTS} DuelVisualConfig */

export const DUEL_VISUAL_DEFAULTS = {
  /** Durata fase 0 — Schieramento (ms) */
  phaseMs0: 2200,
  /** Fase 0 senza effetti pre-VA da mostrare in fase 1 (passaggio breve) */
  phaseMs0Empty: 700,
  /** Durata fase 1 — Poteri (ms) se nessun effetto da animare (fase saltata) */
  phaseMs1: 2500,
  /** Durata di ogni sub-step potere/bonus in fase 1 (ms) */
  effectStepMs: 900,
  /** Buffer dopo l'ultimo sub-step effetti prima della fase 2 (ms) */
  effectPhaseBufferMs: 400,
  /** Intervallo tra ogni focus coin in fase 2 (ms) — riferimento per easing lento→veloce */
  focusCoinStepMs: 380,
  /** Moltiplicatore intervallo prima moneta (inizio lento) */
  focusCoinEaseSlowMul: 1.55,
  /** Moltiplicatore intervallo ultima moneta (finale veloce) */
  focusCoinEaseFastMul: 0.35,
  /** Buffer aggiunto dopo l’ultimo focus coin prima della fase 3 (ms) */
  focusPhaseBufferMs: 350,
  /** Durata fase 3 — Calcolo VA (ms) */
  phaseMs3: 1100,
  /** Fase 3 senza mod VA né clamp al minimo: passaggio rapido (ms) */
  phaseMs3Empty: 280,
  /** Durata fase 4 — Scontro (ms) */
  phaseMs4: 2200,
  /** Durata fase 5 — Risultato prima del pulsante (ms) */
  phaseMs5: 900,
  /** Tick animazione arcobaleno / diamante (ms tra un frame e l’altro) */
  rainbowIntervalMs: 50,
  /** Incremento `rainbowTime` per tick */
  rainbowStep: 0.05,
  /** Moltiplicatori velocità tinta (count 12 / 13 / 14) */
  rainbowHueMul12: 60,
  rainbowHueMul13: 120,
  rainbowHueMul14: 180,
  /** Pausa dopo animazione clash su “Continua” (ms) */
  nextRoundClashHoldMs: 500,
  /** Transizione zoom pannelli duello (ms) */
  zoomTransitionMs: 900,
  /** Ritardo transizione quando si attiva lo zoom (ms) */
  zoomDelayMs: 180,
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
