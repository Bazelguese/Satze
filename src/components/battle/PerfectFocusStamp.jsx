/**
 * Stamp "PERFECT" sull'agente che ha scommesso esattamente i FC minimi per vincere.
 * Ingresso → hold → uscita (resta montato durante l'exit).
 */
import React, { useEffect, useRef, useState } from 'react';

const ENTER_MS = 720;
const EXIT_MS = 520;
const DEFAULT_HOLD_MS = 1700;

/** Bianco ghiaccio + accento magenta (stesso per player/IA). */
const PERFECT_ACCENT = '#ff3b6b';
const PERFECT_FILL = '#f4fbff';

/**
 * @param {{
 *   active?: boolean,
 *   side?: 'player'|'enemy',
 *   compact?: boolean,
 *   holdMs?: number,
 * }} props
 */
export function PerfectFocusStamp({
  active = false,
  side = 'player',
  compact = false,
  holdMs = DEFAULT_HOLD_MS,
}) {
  const [phase, setPhase] = useState('idle'); // idle | in | hold | out
  const phaseRef = useRef('idle');
  const timersRef = useRef([]);
  const runIdRef = useRef(0);

  const setPhaseSafe = (next) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    clearTimers();
    const runId = ++runIdRef.current;

    if (!active) {
      if (phaseRef.current === 'idle' || phaseRef.current === 'out') return undefined;
      setPhaseSafe('out');
      const t = setTimeout(() => {
        if (runIdRef.current !== runId) return;
        setPhaseSafe('idle');
      }, EXIT_MS);
      timersRef.current.push(t);
      return undefined;
    }

    setPhaseSafe('in');
    const toHold = setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setPhaseSafe('hold');
    }, ENTER_MS);
    const toOut = setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setPhaseSafe('out');
    }, ENTER_MS + holdMs);
    const toIdle = setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setPhaseSafe('idle');
    }, ENTER_MS + holdMs + EXIT_MS);
    timersRef.current.push(toHold, toOut, toIdle);
    return undefined;
  }, [active, holdMs]);

  if (phase === 'idle') return null;

  void side;

  return (
    <div
      className={[
        'satze-perfect-stamp',
        compact ? 'satze-perfect-stamp--compact' : '',
        `satze-perfect-stamp--${phase}`,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Perfect focus"
      style={{
        '--perfect-accent': PERFECT_ACCENT,
        '--perfect-fill': PERFECT_FILL,
      }}
    >
      <div className="satze-perfect-stamp__label">
        <span className="satze-perfect-stamp__glow" aria-hidden />
        <span className="satze-perfect-stamp__flare" aria-hidden />
        <span className="satze-perfect-stamp__text">PERFECT</span>
      </div>
    </div>
  );
}
