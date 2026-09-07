import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Overlay FPS in alto a destra (imperativo: non re-renderizza React ogni frame).
 */
export function FpsCounter() {
  const elRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let fps = 0;

    const tick = (now) => {
      frames += 1;
      const elapsed = now - last;
      if (elapsed >= 500) {
        fps = Math.round((frames * 1000) / elapsed);
        frames = 0;
        last = now;
        const el = elRef.current;
        if (el) {
          el.textContent = `${fps} FPS`;
          el.style.color = fps >= 50 ? '#9fe870' : fps >= 30 ? '#f0c674' : '#ff6b6b';
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={elRef}
      aria-hidden
      style={{
        position: 'fixed',
        top: 10,
        right: 12,
        zIndex: 2147483646,
        pointerEvents: 'none',
        fontFamily: "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: '#9fe870',
        textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.45)',
        userSelect: 'none',
      }}
    >
      — FPS
    </div>,
    document.body
  );
}
