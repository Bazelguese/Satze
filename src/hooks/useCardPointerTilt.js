import { useEffect, useRef } from 'react';

/**
 * Tilt 3D + glare al puntatore (CSS vars, niente re-render per frame).
 * Imposta su root: --cpt-rx/ry/px/py/mx/my e data-tilt="1"|"0".
 */
export function useCardPointerTilt(maxTilt = 12) {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const pendingRef = useRef(null);
  const maxTiltRef = useRef(maxTilt);
  maxTiltRef.current = maxTilt;

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function flush() {
    rafRef.current = 0;
    const el = rootRef.current;
    const next = pendingRef.current;
    if (!el || !next) return;
    el.style.setProperty('--cpt-rx', `${next.rx}deg`);
    el.style.setProperty('--cpt-ry', `${next.ry}deg`);
    el.style.setProperty('--cpt-px', `${next.px}%`);
    el.style.setProperty('--cpt-py', `${next.py}%`);
    el.style.setProperty('--cpt-mx', String(next.mx));
    el.style.setProperty('--cpt-my', String(next.my));
    el.dataset.tilt = '1';
  }

  function onPointerMove(e) {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const mx = Math.min(1, Math.max(-1, x * 2 - 1));
    const my = Math.min(1, Math.max(-1, y * 2 - 1));
    const tilt = maxTiltRef.current;
    pendingRef.current = {
      rx: -my * tilt,
      ry: mx * tilt,
      px: Math.min(100, Math.max(0, x * 100)),
      py: Math.min(100, Math.max(0, y * 100)),
      mx,
      my,
    };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  }

  function resetTilt() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    pendingRef.current = null;
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty('--cpt-rx', '0deg');
    el.style.setProperty('--cpt-ry', '0deg');
    el.style.setProperty('--cpt-px', '50%');
    el.style.setProperty('--cpt-py', '42%');
    el.style.setProperty('--cpt-mx', '0');
    el.style.setProperty('--cpt-my', '0');
    el.dataset.tilt = '0';
  }

  return { rootRef, onPointerMove, resetTilt };
}
