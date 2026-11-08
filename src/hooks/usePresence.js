import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// USCITE ANIMATE
// ============================================
// Un popup montato con `{aperto && <Popup/>}` sparisce nell'istante in cui lo
// stato torna falso: l'animazione d'uscita non ha tempo di partire. Questi due
// hook tengono il popup in scena per la durata dell'uscita.
//
//   usePresence(valore, ms)      il genitore decide (stato aperto/chiuso)
//   useLeaveThen(onClose, ms)    il popup chiude da sé (Esc, X, sfondo)
//
// Con «Riduci animazioni» (Opzioni) o "riduci movimento" del sistema
// l'uscita è immediata.
// ============================================

/** Meno movimento: opzione «Riduci animazioni» del gioco o preferenza di sistema. */
export function prefersReducedMotion() {
  if (typeof document !== 'undefined' && document.documentElement?.classList.contains('satze-reduce-motion')) return true;
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
}

/** Durata effettiva di un'uscita: zero se l'utente ha chiesto meno movimento. */
export function exitDuration(ms) {
  return ms > 0 && !prefersReducedMotion() ? ms : 0;
}

/**
 * Tiene montato un popup controllato dal genitore finché la sua uscita non è finita.
 * `value` può essere un booleano o un oggetto (es. il dato mostrato): durante
 * l'uscita restituisce l'ultimo valore non nullo, così il contenuto non si svuota.
 *
 * @returns {{ present: boolean, leaving: boolean, value: any }}
 *   present: va renderizzato; leaving: sta uscendo (applica la classe d'uscita).
 */
export function usePresence(value, exitMs) {
  const open = Boolean(value);
  const lastRef = useRef(open ? value : null);
  if (open) lastRef.current = value;
  const [prevOpen, setPrevOpen] = useState(open);
  const [lingering, setLingering] = useState(false);

  // Aggiornato durante il render (schema "stato precedente" di React): nel
  // passaggio a chiuso il popup resta in scena senza un fotogramma vuoto.
  if (open !== prevOpen) {
    setPrevOpen(open);
    setLingering(!open && exitDuration(exitMs) > 0);
  }

  useEffect(() => {
    if (!lingering) return undefined;
    const t = setTimeout(() => setLingering(false), exitDuration(exitMs));
    return () => clearTimeout(t);
  }, [lingering, exitMs]);

  const leaving = !open && lingering;
  const present = open || leaving;
  return { present, leaving, value: open ? value : (present ? lastRef.current : value) };
}

/**
 * Per i popup che si chiudono da soli: `requestClose()` avvia l'uscita e chiama
 * `onClose` quando è finita. Chiamate ripetute durante l'uscita sono ignorate.
 *
 * @returns {[boolean, (...args: any[]) => void]} [leaving, requestClose]
 */
export function useLeaveThen(onClose, exitMs) {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const requestClose = useCallback((...args) => {
    if (leavingRef.current) return;
    const ms = exitDuration(exitMs);
    if (ms <= 0) {
      onCloseRef.current?.(...args);
      return;
    }
    leavingRef.current = true;
    setLeaving(true);
    timerRef.current = setTimeout(() => {
      leavingRef.current = false;
      setLeaving(false);
      onCloseRef.current?.(...args);
    }, ms);
  }, [exitMs]);

  return [leaving, requestClose];
}
