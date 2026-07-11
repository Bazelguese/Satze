import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SatzeDialogueLayer } from './SatzeDialogueLayer';
import { useDialogueSequencePlayback } from './useDialogueSequencePlayback';
import {
  buildDuelDialogueForMorte,
  buildDuelDialogueForPhase,
} from '../../dialogue/buildDuelDialogueLine.js';
import { createDialogueSession } from '../../dialogue/resolveDuelDialogueEvent.js';
import {
  DIALOGUE_CHAR_MS,
  DIALOGUE_DUEL_PHASES,
  DUEL_DIALOGUE_MORTE_PHASE,
  getDialoguePhaseStartDelayMs,
} from '../../dialogue/dialogueTiming.js';

function duelSessionKey(battleResult) {
  if (!battleResult) return '';
  const p = battleResult.playerAgent;
  const e = battleResult.enemyAgent;
  return [
    p?.id,
    e?.id,
    battleResult.winner,
    battleResult.playerAssault,
    battleResult.enemyAssault,
    battleResult.playerFocusUsed,
    battleResult.enemyFocusUsed,
  ].join('|');
}

/**
 * Fumetti dialogue — fasi 0, 1, 3, 5 + fase 7 morte (scarto su Continua).
 */
export function DuelDialogueOverlay({
  battleResult,
  duelPhase,
  showDiscardDialogue = false,
  isZoomed = true,
  paused = false,
  enabled = true,
  charMs = DIALOGUE_CHAR_MS,
}) {
  const dialogueRef = useRef(null);
  const sessionKeyRef = useRef('');
  const dialogueSessionRef = useRef(createDialogueSession());
  const playedPhasesRef = useRef(new Set());
  const mortePlayedRef = useRef(false);
  const scheduleRef = useRef([]);
  const prevDuelPhaseRef = useRef(-1);
  const [boxReady, setBoxReady] = useState(false);
  const { playLines, stop } = useDialogueSequencePlayback(dialogueRef);

  const sessionKey = duelSessionKey(battleResult);

  const clearSchedules = () => {
    scheduleRef.current.forEach((id) => window.clearTimeout(id));
    scheduleRef.current = [];
  };

  const resetSession = () => {
    dialogueSessionRef.current = createDialogueSession();
    playedPhasesRef.current = new Set();
    mortePlayedRef.current = false;
  };

  const handleBoxReady = useCallback(() => {
    setBoxReady(true);
  }, []);

  const schedulePhaseLines = useCallback(
    (phase) => {
      if (playedPhasesRef.current.has(phase)) return;
      playedPhasesRef.current.add(phase);

      const phaseLines = buildDuelDialogueForPhase(
        battleResult,
        phase,
        isZoomed,
        dialogueSessionRef.current
      );
      if (!phaseLines.length) return;

      const delayMs = getDialoguePhaseStartDelayMs(phase);
      if (delayMs <= 0) {
        playLines(phaseLines);
        return;
      }

      const timerId = window.setTimeout(() => {
        playLines(phaseLines);
      }, delayMs);
      scheduleRef.current.push(timerId);
    },
    [battleResult, isZoomed, playLines]
  );

  const catchUpPhases = useCallback(() => {
    if (!enabled || paused || !battleResult || !boxReady) return;

    for (const phase of DIALOGUE_DUEL_PHASES) {
      if (phase > duelPhase) break;
      schedulePhaseLines(phase);
    }
  }, [battleResult, boxReady, duelPhase, enabled, paused, schedulePhaseLines]);

  useEffect(() => {
    if (sessionKeyRef.current !== sessionKey) {
      sessionKeyRef.current = sessionKey;
      resetSession();
      clearSchedules();
    }
  }, [sessionKey]);

  useEffect(() => {
    const prev = prevDuelPhaseRef.current;
    prevDuelPhaseRef.current = duelPhase;

    if (duelPhase === 0 && prev > 0) {
      resetSession();
      clearSchedules();
    }
  }, [duelPhase]);

  useEffect(() => {
    if (!enabled || paused || !battleResult) {
      stop();
      return undefined;
    }
    catchUpPhases();
    return undefined;
  }, [battleResult, duelPhase, enabled, isZoomed, paused, boxReady, catchUpPhases, stop]);

  useEffect(() => {
    if (!enabled || paused || !battleResult || !showDiscardDialogue || !boxReady) {
      return undefined;
    }
    if (mortePlayedRef.current) return undefined;

    mortePlayedRef.current = true;
    const timerId = window.setTimeout(() => {
      const lines = buildDuelDialogueForMorte(
        battleResult,
        isZoomed,
        dialogueSessionRef.current
      );
      if (lines.length) playLines(lines);
    }, getDialoguePhaseStartDelayMs(DUEL_DIALOGUE_MORTE_PHASE));

    return () => window.clearTimeout(timerId);
  }, [battleResult, boxReady, enabled, isZoomed, paused, playLines, showDiscardDialogue]);

  useEffect(
    () => () => {
      clearSchedules();
      stop();
    },
    [stop]
  );

  if (!enabled || !battleResult) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2000]"
      aria-hidden
    >
      <SatzeDialogueLayer ref={dialogueRef} charMs={charMs} onReady={handleBoxReady} />
    </div>
  );
};
