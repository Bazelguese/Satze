import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DISPLAY_SETTINGS_CHANGED_EVENT,
  getDisplaySettings,
} from '../../settings/displaySettings';
import SatzeCursor from './SatzeCursor';
import { getSatzeCursorProps, subscribeSatzeCursor } from './satzeCursorState';

/**
 * Host globale del cursore custom: portal su body, sync da satzeCursorState,
 * disattivo su pointer coarse (touch) e con reduceMotion spegne solo la scia.
 */
export function SatzeCursorHost() {
  const [props, setProps] = useState(getSatzeCursorProps);
  const [finePointer, setFinePointer] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(pointer: fine)').matches;
  });
  const [cursorOpts, setCursorOpts] = useState(() => {
    const s = getDisplaySettings();
    return {
      reduceMotion: s.reduceMotion === true,
      size: (s.cursorSize || 100) / 100,
      trailLength: s.cursorTrailLength || 10,
      trailDurationMs: s.cursorTrailDuration || 400,
    };
  });

  useEffect(() => subscribeSatzeCursor(setProps), []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(pointer: fine)');
    const onChange = () => setFinePointer(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const sync = () => {
      const s = getDisplaySettings();
      setCursorOpts({
        reduceMotion: s.reduceMotion === true,
        size: (s.cursorSize || 100) / 100,
        trailLength: s.cursorTrailLength || 10,
        trailDurationMs: s.cursorTrailDuration || 400,
      });
    };
    sync();
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <SatzeCursor
      army={props.army}
      inDuel={props.inDuel}
      dragCard={props.dragCard || null}
      enabled={props.enabled !== false && finePointer}
      size={cursorOpts.size}
      trail={!cursorOpts.reduceMotion}
      trailLength={cursorOpts.trailLength}
      trailDurationMs={cursorOpts.trailDurationMs}
      fingers
    />,
    document.body
  );
}
