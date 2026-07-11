import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { SatzeDialogueBox, injectSatzeDialogueFonts } from '../../dialogue/satzeDialogue.js';
import '../../dialogue/satzeDialogue.css';

/**
 * Layer React per fumetti stile Undertale montati sopra il viewport duello.
 * Accoda le chiamate say() finché il box non è montato (evita race al primo frame).
 */
export const SatzeDialogueLayer = forwardRef(function SatzeDialogueLayer(
  { charMs = 30, width, onReady },
  ref
) {
  const mountRef = useRef(null);
  const boxRef = useRef(null);
  const pendingSayRef = useRef([]);

  useEffect(() => {
    injectSatzeDialogueFonts();
  }, []);

  const flushPending = () => {
    if (!boxRef.current || !pendingSayRef.current.length) return;
    const queued = pendingSayRef.current.splice(0);
    queued.forEach((opts) => boxRef.current.say(opts));
  };

  useLayoutEffect(() => {
    if (!mountRef.current) return undefined;
    const box = new SatzeDialogueBox({ mount: mountRef.current, charMs, width });
    boxRef.current = box;
    flushPending();
    onReady?.();
    return () => {
      box.destroy();
      boxRef.current = null;
    };
  }, [charMs, width, onReady]);

  useImperativeHandle(
    ref,
    () => ({
      say: (opts) => {
        if (boxRef.current) {
          boxRef.current.say(opts);
          return;
        }
        pendingSayRef.current.push(opts);
      },
      skip: () => boxRef.current?.skip(),
      hide: () => {
        pendingSayRef.current = [];
        boxRef.current?.hide();
      },
      isDone: () => boxRef.current?.isDone() ?? true,
      isReady: () => Boolean(boxRef.current),
    }),
    []
  );

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 z-[500]"
      aria-hidden
    />
  );
});
