import { useEffect, useRef, useState } from 'react';

/** Quanto resta in vista il «+1» / «−2» che si stacca dal contatore (ms). */
export const PRESENCE_DELTA_MS = 1700;

/** Testo della variazione: «+1», «−2». */
export function formatPresenceChange(delta) {
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`;
}

/**
 * Variazione di Presenza da mostrare accanto al contatore: quando il valore cambia
 * restituisce { delta, key } per un po', poi null. Il primo valore non conta.
 */
export function usePresenceDelta(value) {
  const prevRef = useRef(value);
  const [change, setChange] = useState(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev == null || value == null || prev === value) return undefined;
    const next = { delta: value - prev, key: `${prev}>${value}:${Date.now()}` };
    setChange(next);
    const t = setTimeout(() => setChange((cur) => (cur === next ? null : cur)), PRESENCE_DELTA_MS);
    return () => clearTimeout(t);
  }, [value]);
  return change;
}
