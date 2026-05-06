// ============================================
// Timeline ms fasi duello (stessa logica di satze.jsx)
// ============================================

import { DUEL_VISUAL_DEFAULTS } from './duelVisualConfig.js';

/** @param {typeof DUEL_VISUAL_DEFAULTS} vfx */
export function computePhase2DurationMs(vfx, playerFocusUsed, enemyFocusUsed) {
  const p = playerFocusUsed || 0;
  const e = enemyFocusUsed || 0;
  const maxTotal = Math.max(p, e);
  return maxTotal * vfx.focusCoinStepMs + vfx.focusPhaseBufferMs;
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

/** Durata fase 3 in ms (piena se serve lavoro, altrimenti `phaseMs3Empty`). */
export function computePhase3DurationMs(vfx, battleResult) {
  return duelPhase3NeedsWork(battleResult) ? vfx.phaseMs3 : vfx.phaseMs3Empty ?? 240;
}

/**
 * Ritardi tra avanzamenti di fase (indici 0..5); indice 6 è “pulsante” (0 ms).
 * @param {typeof DUEL_VISUAL_DEFAULTS} vfx
 * @param {object | null | undefined} [battleResult] — per durata fase 3 (mod / minimo)
 * @returns {number[]}
 */
export function buildPhaseAdvanceDelaysMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult) {
  const phase2 = computePhase2DurationMs(vfx, playerFocusUsed, enemyFocusUsed);
  const phase3 = computePhase3DurationMs(vfx, battleResult);
  return [
    vfx.phaseMs0,
    vfx.phaseMs1,
    phase2,
    phase3,
    vfx.phaseMs4,
    vfx.phaseMs5,
    0,
  ];
}

export const DUEL_PHASE_META = [
  { id: 0, code: 'deploy', label: 'Schieramento', where: 'Carte in campo + zoom pannelli' },
  { id: 1, code: 'powers', label: 'Poteri', where: 'Operatori / highlight abilità e bonus sulle carte' },
  { id: 2, code: 'focus', label: 'Focus coin', where: 'Monete FC + POT×FC in tempo reale sotto la carta' },
  { id: 3, code: 'calc', label: 'Mod VA', where: 'Solo mod e minimo VA se presenti; altrimenti passaggio breve' },
  { id: 4, code: 'clash', label: 'Scontro', where: 'Numero VA + animate-clash + particelle vincitore' },
  { id: 5, code: 'outcome', label: 'Risultato', where: 'Testo vittoria/sconfitta prima del riepilogo' },
  { id: 6, code: 'continue', label: 'Continua', where: 'Pulsante; clash su “Continua” usa nextRoundClashHoldMs' },
];

/** Somma ms delle fasi automatiche 0–5 (escluso il tap sulla 6). */
export function totalAutoTimelineMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult) {
  const d = buildPhaseAdvanceDelaysMs(vfx, playerFocusUsed, enemyFocusUsed, battleResult);
  return d[0] + d[1] + d[2] + d[3] + d[4] + d[5];
}
