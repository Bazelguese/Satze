import { useState, useLayoutEffect, useEffect } from 'react';
import { useViewportLayout } from '../hooks/useViewportLayout';
import { PALETTE } from '../theme/hudOratorioPalette';

const DESKTOP_W = 1920;
const DESKTOP_H = 1080;
/** Area logica verticale (9:16) — base per UI mobile futura */
const MOBILE_PORTRAIT_W = 1080;
const MOBILE_PORTRAIT_H = 1920;

/**
 * Wrapper che scala il gioco a tutto schermo.
 * In mobile verticale usa un canvas 1080×1920 e classe `satze-layout-mobile-portrait` su body.
 */
export function GameViewport({ children }) {
  const layout = useViewportLayout();
  const isMobilePortrait = layout === 'mobile-portrait';
  const [scale, setScale] = useState(1);

  const gameW = isMobilePortrait ? MOBILE_PORTRAIT_W : DESKTOP_W;
  const gameH = isMobilePortrait ? MOBILE_PORTRAIT_H : DESKTOP_H;

  useLayoutEffect(() => {
    const updateScale = () => {
      const s = Math.min(window.innerWidth / gameW, window.innerHeight / gameH);
      setScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
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
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: PALETTE.deepVoid,
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
