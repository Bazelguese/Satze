import { useCallback, useEffect, useRef } from 'react';
import { FONTS } from '../../dialogue/satzeDialogue.js';
import { DIALOGUE_PAUSE_MS } from '../../dialogue/dialogueTiming.js';

/**
 * Riproduce una sequenza di righe dialogue con onDone concatenati.
 * @param {React.RefObject<{ say, skip, hide, isDone }>} dialogueRef
 */
export function useDialogueSequencePlayback(dialogueRef) {
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const linesRef = useRef([]);
  const playingRef = useRef(false);
  const pendingRef = useRef([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    indexRef.current = 0;
    linesRef.current = [];
    pendingRef.current = [];
    playingRef.current = false;
    dialogueRef.current?.hide();
  }, [clearTimer, dialogueRef]);

  const playFrom = useCallback(
    (index, lines, overrides = {}, pauseMs = DIALOGUE_PAUSE_MS) => {
      clearTimer();
      linesRef.current = lines;
      indexRef.current = index;
      playingRef.current = true;

      const trySay = (attempt = 0) => {
        if (index >= lines.length) {
          playingRef.current = false;
          if (pendingRef.current.length) {
            const next = pendingRef.current.splice(0);
            playFrom(0, next, overrides, pauseMs);
            return;
          }
          dialogueRef.current?.hide();
          return;
        }

        const line = applyDialogueOverrides(lines[index], overrides);
        const box = dialogueRef.current;
        if (!box?.isReady?.() && attempt < 12) {
          timerRef.current = window.setTimeout(() => trySay(attempt + 1), 50);
          return;
        }

        box?.say({
          ...line,
          onDone: () => {
            timerRef.current = window.setTimeout(() => {
              playFrom(index + 1, lines, overrides, pauseMs);
            }, pauseMs);
          },
        });
      };

      trySay(0);
    },
    [clearTimer, dialogueRef]
  );

  const playLines = useCallback(
    (lines, overrides = {}, playbackOpts = {}) => {
      if (!lines?.length) {
        if (!playingRef.current) stop();
        return;
      }
      const pauseMs = playbackOpts.pauseMs ?? DIALOGUE_PAUSE_MS;
      if (playingRef.current) {
        pendingRef.current.push(...lines);
        return;
      }
      playFrom(0, lines, overrides, pauseMs);
    },
    [playFrom, stop]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { playLines, stop };
}

/** Applica override font/effetto manuali dal pannello dev. */
export function applyDialogueOverrides(line, { fontKey, fxKey } = {}) {
  if (!line) return line;
  const next = { ...line };
  if (fontKey && FONTS[fontKey]) {
    next.font = FONTS[fontKey].family;
    next.size = FONTS[fontKey].size;
  }
  if (fxKey) next.fx = fxKey;
  return next;
}
