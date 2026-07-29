/**
 * Timeline presentazione duello ufficiale (macchina di Codice/satze.jsx + useBattle.resolveBattle).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  buildPhaseAdvanceDelaysMs,
  computeFocusCoinAppearDelayMs,
  countDuelPhase3SubSteps,
  getNextDuelPhase,
  syncDuelVisualsForPhase,
} from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS, DUEL_VFX_CHANGED_EVENT } from '../../config/duelVisualConfig.js';
import { getDuelVisualConfig } from '../../config/duelVisualConfigStore.js';
import { applyVfxQualityToDuelConfig, getVfxQualityProfile } from '../../settings/vfxQualityProfile.js';
import { DISPLAY_SETTINGS_CHANGED_EVENT } from '../../settings/displaySettings.js';
import { getFocusCoinGlowColor as computeFocusCoinGlowColor } from '../../utils/focusCoinGlow.js';
import { countDuelEffectSteps, countDuelPostEffectSteps } from '../../game/duel/duelVisualSteps.js';
import { useSafeDuelEffectStep } from './useSafeDuelEffectStep.js';

function duelSessionKey(battleResult) {
  if (!battleResult) return null;
  return [
    battleResult.playerAgent?.id,
    battleResult.enemyAgent?.id,
    battleResult.playerAssault,
    battleResult.enemyAssault,
    battleResult.playerFocusUsed,
    battleResult.enemyFocusUsed,
    battleResult.winner,
  ].join('|');
}

/**
 * @param {{ battleResult: object|null, active: boolean, onComplete?: () => void, autoContinueMs?: number }} opts
 */
export function useProductionDuelPresentation({
  battleResult,
  active,
  onComplete,
  autoContinueMs = 1200,
}) {
  const [duelPhase, setDuelPhase] = useState(0);
  const [duelEffectStep, setDuelEffectStep] = useState(1);
  const [playerFocusCoinsShown, setPlayerFocusCoinsShown] = useState(0);
  const [enemyFocusCoinsShown, setEnemyFocusCoinsShown] = useState(0);
  const [playerCardGlow, setPlayerCardGlow] = useState(0);
  const [enemyCardGlow, setEnemyCardGlow] = useState(0);
  const [rainbowTime, setRainbowTime] = useState(0);
  const [showClashAnimation, setShowClashAnimation] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [vfxRev, setVfxRev] = useState(0);
  const focusCoinTimersRef = useRef([]);
  const completedRef = useRef(false);
  const sessionRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const sessionKey = active ? duelSessionKey(battleResult) : null;

  useEffect(() => {
    const on = () => setVfxRev((r) => r + 1);
    window.addEventListener(DUEL_VFX_CHANGED_EVENT, on);
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => {
      window.removeEventListener(DUEL_VFX_CHANGED_EVENT, on);
      window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    };
  }, []);

  const duelVfx = useMemo(
    () => applyVfxQualityToDuelConfig(getDuelVisualConfig(), getVfxQualityProfile()),
    [vfxRev]
  );
  const vfxProfile = useMemo(() => getVfxQualityProfile(), [vfxRev]);

  const { visualEffectStep, advanceEffectStep } = useSafeDuelEffectStep(
    duelPhase,
    duelEffectStep,
    setDuelEffectStep
  );

  const clearFocusCoinTimers = useCallback(() => {
    focusCoinTimersRef.current.forEach(clearTimeout);
    focusCoinTimersRef.current = [];
  }, []);

  // Enter path = resolveBattle: reset phase/FC + zoom ON quando nasce la sessione
  useEffect(() => {
    if (!sessionKey || !battleResult) {
      sessionRef.current = null;
      clearFocusCoinTimers();
      setDuelPhase(0);
      setDuelEffectStep(1);
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
      setRainbowTime(0);
      setShowClashAnimation(false);
      setIsZoomed(false);
      completedRef.current = false;
      return undefined;
    }
    if (sessionRef.current === sessionKey) return undefined;

    sessionRef.current = sessionKey;
    clearFocusCoinTimers();
    setDuelPhase(0);
    setDuelEffectStep(1);
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    setRainbowTime(0);
    setShowClashAnimation(false);
    setIsZoomed(true); // come useBattle.resolveBattle
    completedRef.current = false;
    return () => clearFocusCoinTimers();
  }, [sessionKey, battleResult, clearFocusCoinTimers]);

  const applyDuelVisualSync = useCallback(
    (phase) => {
      if (!battleResult) return;
      syncDuelVisualsForPhase(phase, battleResult, {
        setEffectStep: setDuelEffectStep,
        setFocusCoins: (pFc, eFc) => {
          setPlayerFocusCoinsShown(pFc);
          setEnemyFocusCoinsShown(eFc);
        },
        setCardGlow: () => {
          setPlayerCardGlow(1);
          setEnemyCardGlow(1);
        },
      });
    },
    [battleResult]
  );

  useLayoutEffect(() => {
    if (sessionKey && battleResult) applyDuelVisualSync(duelPhase);
  }, [sessionKey, battleResult, duelPhase, applyDuelVisualSync]);

  const advanceDuelPhase = useCallback(() => {
    if (!battleResult) return;
    setDuelPhase((prev) => getNextDuelPhase(prev, battleResult));
  }, [battleResult]);

  // Avanzamento fasi — stessa logica di satze.jsx
  useEffect(() => {
    if (!sessionKey || !battleResult) return undefined;

    const effectCount = countDuelEffectSteps(battleResult.visualSteps);
    const phase3SubCount = countDuelPhase3SubSteps(battleResult);
    const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
    const stepMs = duelVfx.effectStepMs ?? DUEL_VISUAL_DEFAULTS.effectStepMs;
    const bufferMs = duelVfx.effectPhaseBufferMs ?? DUEL_VISUAL_DEFAULTS.effectPhaseBufferMs;

    if (duelPhase === 1 && effectCount > 0) {
      if (visualEffectStep < effectCount) {
        const timer = setTimeout(() => advanceEffectStep(), stepMs);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
      return () => clearTimeout(timer);
    }

    if (duelPhase === 3 && phase3SubCount > 1) {
      if (visualEffectStep < phase3SubCount) {
        const timer = setTimeout(() => advanceEffectStep(), stepMs);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
      return () => clearTimeout(timer);
    }

    if (duelPhase === 5 && postCount > 0) {
      if (visualEffectStep < postCount) {
        const timer = setTimeout(() => advanceEffectStep(), stepMs);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => advanceDuelPhase(), bufferMs);
      return () => clearTimeout(timer);
    }

    const delays = buildPhaseAdvanceDelaysMs(
      duelVfx,
      battleResult.playerFocusUsed,
      battleResult.enemyFocusUsed,
      battleResult
    );
    if (duelPhase < delays.length - 1) {
      const delay = delays[duelPhase];
      const timer = setTimeout(() => advanceDuelPhase(), delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    sessionKey,
    battleResult,
    duelPhase,
    visualEffectStep,
    duelVfx,
    advanceEffectStep,
    advanceDuelPhase,
  ]);

  // Focus coin sequenziali (fase 2) — satze.jsx
  useEffect(() => {
    if (!sessionKey || !battleResult || duelPhase !== 2) return undefined;
    clearFocusCoinTimers();
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);

    const playerTotal = battleResult.playerFocusUsed || 0;
    const enemyTotal = battleResult.enemyFocusUsed || 0;
    const maxTotal = Math.max(playerTotal, enemyTotal);

    for (let i = 0; i < maxTotal; i++) {
      const appearMs = computeFocusCoinAppearDelayMs(i, maxTotal, duelVfx);
      const timer = setTimeout(() => {
        if (i < playerTotal) {
          setPlayerFocusCoinsShown((prev) => prev + 1);
          setPlayerCardGlow((i + 1) / playerTotal);
        }
        if (i < enemyTotal) {
          setEnemyFocusCoinsShown((prev) => prev + 1);
          setEnemyCardGlow((i + 1) / enemyTotal);
        }
      }, appearMs);
      focusCoinTimersRef.current.push(timer);
    }
    return () => clearFocusCoinTimers();
  }, [sessionKey, duelPhase, battleResult, duelVfx, clearFocusCoinTimers]);

  useEffect(() => {
    const needsRainbow =
      battleResult &&
      Math.max(battleResult.playerFocusUsed || 0, battleResult.enemyFocusUsed || 0) >= 12;
    if (sessionKey && needsRainbow && duelPhase >= 2 && duelPhase < 4) {
      const interval = setInterval(() => {
        setRainbowTime((prev) => prev + duelVfx.rainbowStep);
      }, duelVfx.rainbowIntervalMs);
      return () => clearInterval(interval);
    }
    setRainbowTime(0);
    return undefined;
  }, [sessionKey, duelPhase, battleResult, duelVfx.rainbowIntervalMs, duelVfx.rainbowStep]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  }, []);

  const skipDuel = useCallback(() => {
    if (!battleResult || duelPhase >= 6) return;
    clearFocusCoinTimers();
    const effectCount = countDuelEffectSteps(battleResult.visualSteps);
    const phase3SubCount = countDuelPhase3SubSteps(battleResult);
    const postCount = countDuelPostEffectSteps(battleResult.visualSteps);
    setDuelEffectStep(Math.max(effectCount, phase3SubCount, postCount, 1));
    setPlayerFocusCoinsShown(battleResult.playerFocusUsed || 0);
    setEnemyFocusCoinsShown(battleResult.enemyFocusUsed || 0);
    setPlayerCardGlow(1);
    setEnemyCardGlow(1);
    setRainbowTime(0);
    setDuelPhase(6);
  }, [battleResult, duelPhase, clearFocusCoinTimers]);

  const continueAfterDuel = useCallback(() => {
    if (!battleResult || duelPhase < 6) return;
    setShowClashAnimation(true);
    const hold = duelVfx.nextRoundClashHoldMs ?? DUEL_VISUAL_DEFAULTS.nextRoundClashHoldMs;
    setTimeout(() => {
      setShowClashAnimation(false);
      finish();
    }, hold);
  }, [battleResult, duelPhase, duelVfx.nextRoundClashHoldMs, finish]);

  useEffect(() => {
    if (!sessionKey || !battleResult || duelPhase < 6 || completedRef.current) return undefined;
    const timer = setTimeout(() => continueAfterDuel(), autoContinueMs);
    return () => clearTimeout(timer);
  }, [sessionKey, battleResult, duelPhase, autoContinueMs, continueAfterDuel]);

  const getFocusCoinGlowColor = useCallback(
    (focusCount, intensity) =>
      computeFocusCoinGlowColor(focusCount, intensity, rainbowTime, {
        rainbowHueMul12: duelVfx.rainbowHueMul12,
        rainbowHueMul13: duelVfx.rainbowHueMul13,
        rainbowHueMul14: duelVfx.rainbowHueMul14,
      }),
    [rainbowTime, duelVfx]
  );

  return {
    duelPhase,
    visualEffectStep,
    playerFocusCoinsShown,
    enemyFocusCoinsShown,
    playerCardGlow,
    enemyCardGlow,
    showClashAnimation,
    isZoomed,
    duelVfx,
    vfxProfile,
    getFocusCoinGlowColor,
    skipDuel,
    continueAfterDuel,
    isComplete: duelPhase >= 6,
  };
}
