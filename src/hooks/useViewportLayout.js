import { useState, useEffect } from 'react';

/**
 * Rileva layout per adattare il canvas di gioco (desktop vs mobile verticale/orizzontale).
 * `mobile-portrait`: base per UI verticale dedicata (futuro).
 */
export function useViewportLayout() {
  const [layout, setLayout] = useState('desktop');

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const shortSide = Math.min(w, h);
      const portrait = h >= w;
      if (shortSide < 900 && portrait) {
        setLayout('mobile-portrait');
      } else if (shortSide < 900 && !portrait) {
        setLayout('mobile-landscape');
      } else {
        setLayout('desktop');
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return layout;
}
