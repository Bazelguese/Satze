import { useState, useLayoutEffect, useEffect } from 'react';
import { useViewportLayout } from '../hooks/useViewportLayout';
import { PALETTE } from '../theme/hudOratorioPalette';

const DESKTOP_W = 1920;
const DESKTOP_H = 1080;

/**
 * Wrapper che scala il gioco a tutto schermo (scale-to-fit "contain").
 *
 * Il canvas logico è SEMPRE 1920×1080: in portrait il gioco appare
 * letterboxato ma completo. (Il vecchio canvas 1080×1920 in portrait
 * causava clipping orizzontale: il layout interno resta 1920×1080.)
 * In mobile portrait viene comunque applicata la classe
 * `satze-layout-mobile-portrait` per il padding safe-area.
 *
 * Espone `--satze-scale` sul wrapper per eventuali aggiustamenti CSS.
 */
export function GameViewport({ children }) {
  const layout = useViewportLayout();
  const isMobilePortrait = layout === 'mobile-portrait';
  const [scale, setScale] = useState(1);

  const gameW = DESKTOP_W;
  const gameH = DESKTOP_H;

  useLayoutEffect(() => {
    const updateScale = () => {
      // visualViewport tiene conto di barre browser mobile e pinch-zoom
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setScale(Math.min(vw / gameW, vh / gameH));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    window.visualViewport?.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.visualViewport?.removeEventListener('resize', updateScale);
    };
  }, [gameW, gameH]);

  useEffect(() => {
    document.body.classList.toggle('satze-layout-mobile-portrait', isMobilePortrait);
    document.documentElement.classList.toggle('satze-layout-mobile-portrait', isMobilePortrait);
    return () => {
      document.body.classList.remove('satze-layout-mobile-portrait');
      document.documentElement.classList.remove('satze-layout-mobile-portrait');
    };
  }, [isMobilePortrait]);

  return (
    <div
      className="satze-viewport"
      style={{
        background: PALETTE.deepVoid,
        '--satze-scale': scale,
      }}
    >
      <div
        style={{
          width: gameW,
          height: gameH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
