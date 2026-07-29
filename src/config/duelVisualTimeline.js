// ============================================
// Timeline ms fasi duello (stessa logica di satze.jsx)
// ============================================

import { DUEL_VISUAL_DEFAULTS, DUEL_PHASE4_MIN_MS, computeDynamicClashVfx } from './duelVisualConfig.js';
import {
  countDuelEffectSteps,
  countDuelPostEffectSteps,
  countAssaultModProgressionLines,
} from '../game/duel/duelVisualSteps.js';

function safeMs(value, fallback, min = 0) {
  if (value == null) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.round(n));
}

function focusCoinEaseMultiplier(stepIndex, totalSteps, vfx) {
  if (totalSteps <= 1) return 1;
  const slowMul = Number(vfx.focusCoinEaseSlowMul ?? DUEL_VISUAL_DEFAULTS.focusCoinEaseSlowMul);
  const fastMul = Number(vfx.focusCoinEaseFastMul ?? DUEL_VISUAL_DEFAULTS.focusCoinEaseFastMul);
  const safeSlow = Number.isFinite(slowMul) && slowMul > 0 ? slowMul : DUEL_VISUAL_DEFAULTS.focusCoinEaseSlowMul;
  const safeFast = Number.isFinite(fastMul) && fastMul > 0 ? fastMul : DUEL_VISUAL_DEFAULTS.focusCoinEaseFastMul;
  const t = stepIndex / (totalSteps - 1);
  const eased = t * t;
  return safeSlow + (safeFast - safeSlow) * eased;
}

/** Intervallo (ms) tra moneta `stepIndex` e la successiva in fase 2. */
export function computeFocusCoinStepIntervalMs(stepIndex, totalSteps, vfx) {
  if (totalSteps <= 1 || stepIndex >= totalSteps - 1) return 0;
  const base = safeMs(vfx.focusCoinStepMs, DUEL_VISUAL_DEFAULTS.focusCoinStepMs, 80);
  return Math.round(base * focusCoinEaseMultiplier(stepIndex, totalSteps, vfx));
}

/** Ritardo cumulativo (ms) dall'inizio fase 2 fino all'apparizione della moneta `coinIndex`. */
export function computeFocusCoinAppearDelayMs(coinIndex, totalSteps, vfx) {
  if (coinIndex <= 0 || totalSteps <= 0) return 0;
  let sum = 0;
  for (let j = 0; j < coinIndex; j++) {
    sum += computeFocusCoinStepIntervalMs(j, totalSteps, vfx);
  }
  return sum;
}

/** Durata totale sequenza monete (ms) dall'inizio fase 2 all'ultima moneta visibile. */
export function computeFocusCoinSequenceDurationMs(totalSteps, vfx) {
  if (totalSteps <= 0) return 0;
  return computeFocusCoinAppearDelayMs(totalSteps - 1, totalSteps, vfx);
}

/** @param {typeof DUEL_VISUAL_DEFAULTS} vfx */
export function computePhase2DurationMs(vfx, playerFocusUsed, enemyFocusUsed) {
  const p = playerFocusUsed || 0;
  const e = enemyFocusUsed || 0;
  const maxTotal = Math.max(p, e);
  if (maxTotal <= 0) return 0;
  const buffer = safeMs(vfx.focusPhaseBufferMs, DUEL_VISUAL_DEFAULTS.focusPhaseBufferMs, 0);
  return computeFocusCoinSequenceDurationMs(maxTotal, vfx) + buffer;
}

/**
 * True se in fase 3 serve tempo per mod VA o clamp al minimo (almeno un lato).
 * @param {object | null | undefined} battleResult
 */
export function duelPhase3NeedsWork(battleResult) {
  if (!battleResult) return true;
  const pMod = battleResult.playerAssaultMod ?? 0;
  const eMod = battleResult.enemyAssaultMod ?? 0;
  if (pMod !== 0 || eMod !== 0) return true;
  const pp = battleResult.playerPower ?? 0;
  const pf = battleResult.playerFocusUsed ?? 0;
  const ep = battleResult.enemyPower ?? 0;
  const ef = battleResult.enemyFocusUsed ?? 0;
  const pRaw =
    battleResult.playerAssaultRaw != null ? battleResult.playerAssaultRaw : pp * pf + pMod;
  const eRaw =
    battleResult.enemyAssaultRaw != null ? battleResult.enemyAssaultRaw : ep * ef + eMod;
  const pMin =
    battleResult.playerAssaultMinFinal != null
      ? battleResult.playerAssaultMinFinal
      : battleResult.playerAgent?.power ?? 0;
  const eMin =
    battleResult.enemyAssaultMinFinal != null
      ? battleResult.enemyAssaultMinFinal
      : battleResult.enemyAgent?.power ?? 0;
  return pRaw < pMin || eRaw < eMin;
}

function vaPhase3NeedsFloor(battleResult) {
  if (!battleResult) return false;
  const pp = battleResult.playerPower ?? 0;
  const pf = battleResult.playerFocusUsed ?? 0;
  const ep = battleResult.enemyPower ?? 0;
  const ef = battleResult.enemyFocusUsed ?? 0;
  const pMod = battleResult.playerAssaultMod ?? 0;
  const eMod = battleResult.enemyAssaultMod ?? 0;
  const pRaw =
    battleResult.playerAssaultRaw != null ? battleResult.playerAssaultRaw : pp * pf + pMod;
  const eRaw =
    battleResult.enemyAssaultRaw != null ? battleResult.enemyAssaultRaw : ep * ef + eMod;
  const pMin =
    battleResult.playerAssaultMinFinal != null
      ? battleResult.playerAssaultMinFinal
      : battleResult.playerAgent?.power ?? 0;
  const eMin =
    battleResult.enemyAssaultMinFinal != null
      ? battleResult.enemyAssaultMinFinal
      : battleResult.enemyAgent?.power ?? 0;
  return pRaw < pMin || eRaw < eMin;
}

/** Sub-step fase 3: mod VA incrementali + eventuale clamp minimo. */
export function countDuelPhase3SubSteps(battleResult) {
  if (!duelPhase3NeedsWork(battleResult)) return 0;
  const pMods = countAssaultModProgressionLines(battleResult?.visualSteps, true);
  const eMods = countAssaultModProgressionLines(battleResult?.visualSteps, false);
  const modSteps = Math.max(pMods, eMods);
  const floorStep = vaPhase3NeedsFloor(battleResult) ? 1 : 0;
  if (modSteps === 0) return floorStep > 0 ? 1 : 1;
  return modSteps + floorStep;
}

/** Durata fase 3 in ms (piena se serve lavoro; fase inattiva → 0). */
export function computePhase3DurationMs(vfx, battleResult) {
  if (!isDuelPhaseActive(3, battleResult)) return 0;
  const full = safeMs(vfx.phaseMs3, DUEL_VISUAL_DEFAULTS.phaseMs3, 120);
  const subCount = countDuelPhase3SubSteps(battleResult);
  const stepMs = safeMs(vfx.effectStepMs, DUEL_VISUAL_DEFAULTS.effectStepMs, 200);
  const buffer = safeMs(vfx.effectPhaseBufferMs, DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs, 0);
  if (subCount > 1) return subCount * stepMs + buffer;
  return full;
}

/** Durata fase 5 in ms (sub-step post-duello; fase inattiva → 0). */
export function computePhase5DurationMs(vfx, battleResult) {
  const postCount = countDuelPostEffectSteps(battleResult?.visualSteps);
  if (postCount <= 0) return 0;
  const stepMs = safeMs(vfx.effectStepMs, DUEL_VISUAL_DEFAULTS.effectStepMs, 200);
  const buffer = safeMs(vfx.effectPhaseBufferMs, DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs, 0);
  return postCount * stepMs + buffer;
}

/** Durata fase 1 in ms (sub-step effetti; fase inattiva → 0). */
export function computePhase1DurationMs(vfx, battleResult) {
  const effectCount = countDuelEffectSteps(battleResult?.visualSteps);
  if (effectCount <= 0) return 0;
  const stepMs = safeMs(vfx.effectStepMs, DUEL_VISUAL_DEFAULTS.effectStepMs, 200);
  const buffer = safeMs(vfx.effectPhaseBufferMs, DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs, 0);
  return effectCount * stepMs + buffer;
}

/** Durata fase 0 in ms (breve se non ci sono effetti pre-VA in fase 1). */
export function computePhase0DurationMs(vfx, battleResult) {
  const full = safeMs(vfx.phaseMs0, DUEL_VISUAL_DEFAULTS.phaseMs0, 120);
  const empty = safeMs(vfx.phaseMs0Empty ?? DUEL_VISUAL_DEFAULTS.phaseMs0Empty, DUEL_VISUAL_DEFAULTS.phaseMs0Empty, 400);
  if (!isDuelPhaseActive(1, battleResult)) return empty;
  return full;
}

/**
 * True se la fase UI ha contenuto da mostrare (altrimenti si salta).
 * @param {number} phaseId 0…6
 * @param {object | null | undefined} battleResult
 */
export function isDuelPhaseActive(phaseId, battleResult) {
  if (phaseId === 6) return true;
  if (!battleResult) return phaseId === 0 || phaseId === 4;
  const effectCount = countDuelEffectSteps(battleResult.visualSteps);
  const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
  const maxFc = Math.max(battleResult.playerFocusUsed || 0, battleResult.enemyFocusUsed || 0);
  switch (phaseId) {
    case 0:
      return true;
    case 1:
      return effectCount > 0;
    case 2:
      return maxFc > 0;
    case 3:
      return duelPhase3NeedsWork(battleResult);
    case 4:
      return true;
    case 5:
      return postCount > 0;
    default:
      return false;
  }
}

/** Prossima fase duello saltando quelle inattive (max 6). */
export function getNextDuelPhase(fromPhase, battleResult) {
  let next = fromPhase + 1;
  while (next <= 6 && !isDuelPhaseActive(next, battleResult)) {
    next += 1;
  }
  return Math.min(next, 6);
}

/** Elenco fasi 0…6 attive per questo scontro. */
export function getActiveDuelPhases(battleResult) {
  return [0, 1, 2, 3, 4, 5, 6].filter((p) => isDuelPhaseActive(p, battleResult));
}

/** Progresso 0–100 lungo solo le fasi attive. */
export function computeDuelProgressPercent(duelPhase, battleResult) {
  const active = getActiveDuelPhases(battleResult);
  if (active.length <= 1) return 100;
  const idx = active.indexOf(duelPhase);
  if (idx < 0) return 0;
  return Math.round((idx / (active.length - 1)) * 100);
}

/**
 * Allinea stati visivi quando si saltano fasi (FC, glow, sub-step).
 * @param {number} duelPhase
 * @param {object} battleResult
 * @param {{ setEffectStep?: (n: number) => void, setFocusCoins?: (p: number, e: number) => void, setCardGlow?: () => void }} apply
 */
export function syncDuelVisualsForPhase(duelPhase, battleResult, apply) {
  if (!battleResult || duelPhase < 0) return;
  const effectCount = countDuelEffectSteps(battleResult.visualSteps);
  const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
  const phase3SubCount = countDuelPhase3SubSteps(battleResult);
  const pFc = battleResult.playerFocusUsed || 0;
  const eFc = battleResult.enemyFocusUsed || 0;

  if (duelPhase >= 2 && !isDuelPhaseActive(2, battleResult)) {
    apply.setFocusCoins?.(pFc, eFc);
    apply.setCardGlow?.();
  }
  if (duelPhase >= 2 && !isDuelPhaseActive(1, battleResult)) {
    apply.setEffectStep?.(Math.max(1, effectCount));
  }
  if (duelPhase >= 4 && !isDuelPhaseActive(3, battleResult)) {
    apply.setEffectStep?.(Math.max(phase3SubCount, 1));
  }
  if (duelPhase >= 6 && !isDuelPhaseActive(5, battleResult)) {
    apply.setEffectStep?.(Math.max(postCount, 1));
  }
}

/**
 * Ritardi tra avanzamenti di fase (indici 0..5); indice 6 è “pulsante” (0 ms).
 * @param {typeof DUEL_VISUAL_DEFAULTS} vfx
 * @param {object | null | undefined} [battleResult] — per durata fase 3 (mod / minimo)
 * @returns {number[]}
 */
export function buildPhaseAdvanceDelaysMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult) {
  const phase0 = computePhase0DurationMs(vfx, battleResult);
  const phase1 = computePhase1DurationMs(vfx, battleResult);
  const phase2 = isDuelPhaseActive(2, battleResult)
    ? computePhase2DurationMs(vfx, playerFocusUsed, enemyFocusUsed)
    : 0;
  const phase3 = computePhase3DurationMs(vfx, battleResult);
  const { clashSpeed } = computeDynamicClashVfx(battleResult);
  const safeClashSpeed = Number.isFinite(clashSpeed) && clashSpeed > 0 ? clashSpeed : 1;
  const phase4Base = safeMs(vfx.phaseMs4, DUEL_VISUAL_DEFAULTS.phaseMs4, 300);
  const phase4 = Math.max(DUEL_PHASE4_MIN_MS, Math.round(phase4Base / safeClashSpeed));
  const phase5 = computePhase5DurationMs(vfx, battleResult);
  return [
    phase0,
    phase1,
    phase2,
    phase3,
    phase4,
    phase5,
    0,
  ];
}

export const DUEL_PHASE_META = [
  { id: 0, code: 'deploy', label: 'Schieramento', where: 'Carte in campo + zoom pannelli' },
  { id: 1, code: 'powers', label: 'Poteri e bonus', where: 'Sub-step per iniziativa: poteri 1°→2°, poi bonus 1°→2°; stat progressive' },
  { id: 2, code: 'focus', label: 'Focus coin', where: 'Monete FC + POT×FC in tempo reale sotto la carta' },
  { id: 3, code: 'calc', label: 'Mod VA', where: 'Solo mod e minimo VA se presenti; altrimenti passaggio breve' },
  { id: 4, code: 'clash', label: 'Scontro', where: 'Numero VA + animate-clash + particelle vincitore' },
  { id: 5, code: 'outcome', label: 'Risultato', where: 'Testo vittoria/sconfitta prima del riepilogo' },
  { id: 6, code: 'continue', label: 'Continua', where: 'Pulsante; clash su “Continua” usa nextRoundClashHoldMs' },
];

/**
 * Battle-log `revealAt` keys → duelPhase index (shared with scene timeline).
 * Do not duplicate delay ms in LogPanel; use this mapping only.
 */
export const BATTLE_REVEAL_AT_TO_PHASE = Object.freeze({
  deploy: 0,
  abilityFx: 1,
  focusFx: 2,
  assaultFx: 3,
  outcome: 4,
  postFx: 5,
});

/** @param {string|null|undefined} revealAt */
export function getRevealIndex(revealAt) {
  if (revealAt == null) return 0;
  const idx = BATTLE_REVEAL_AT_TO_PHASE[revealAt];
  return Number.isFinite(idx) ? idx : 0;
}

/** Somma ms delle fasi automatiche 0–5 (escluso il tap sulla 6). */
export function totalAutoTimelineMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult) {
  const d = buildPhaseAdvanceDelaysMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult);
  return d[0] + d[1] + d[2] + d[3] + d[4] + d[5];
}
