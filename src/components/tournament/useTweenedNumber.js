import { useEffect, useRef, useState } from 'react';

/**
 * Numero mostrato che, mentre `armed` è vero, raggiunge contando il nuovo valore invece di
 * scattarci. Serve tra una partita e l'altra di una serie: PV e FC risalgono a vista.
 * Fuori da quel momento restituisce il valore così com'è.
 */
export function useTweenedNumber(target, armed, ms = 900) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    if (!armed || shownRef.current === target || !Number.isFinite(target) || !Number.isFinite(shownRef.current)) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const from = shownRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const value = Math.round(from + (target - from) * (1 - (1 - k) ** 3));
      shownRef.current = value;
      setShown(value);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, armed, ms]);
  return armed ? shown : target;
}
