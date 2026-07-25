import { useState, useLayoutEffect, useEffect } from 'react';
import { useViewportLayout } from '../hooks/useViewportLayout';
import { PALETTE } from '../theme/hudOratorioPalette';
import {
  DISPLAY_SETTINGS_CHANGED_EVENT,
  applyDisplaySettingsToDom,
  getDisplaySettings,
  setDisplaySettings,
} from '../settings/displaySettings';
import { computeViewportScale } from '../settings/viewportScale';

const DESKTOP_W = 1920;
const DESKTOP_H = 1080;

/**
 * Wrapper che scala il gioco a tutto schermo (contain).
 * Canvas logico 1920×1080 sempre interamente visibile.
 * La "Scala interfaccia" non zoomma questo viewport: è densità nei menù.
 */
export function GameViewport({ children }) {
  const layout = useViewportLayout();
  const isMobilePortrait = layout === 'mobile-portrait';
  const [scale, setScale] = useState(1);

  const gameW = DESKTOP_W;
  const gameH = DESKTOP_H;

  useEffect(() => {
    applyDisplaySettingsToDom();
    let cancelled = false;
    (async () => {
      try {
        const saved = await window.electronAPI?.display?.getSaved?.();
        if (cancelled || !saved) return;
        setDisplaySettings({
          displayMode: saved.displayMode,
          resolutionPreset: saved.resolutionPreset,
        });
      } catch {
        /* ignore */
      }
    })();
    const on = () => applyDisplaySettingsToDom(getDisplaySettings());
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => {
      cancelled = true;
      window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    };
  }, []);

  useLayoutEffect(() => {
    const updateScale = () => {
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setScale(computeViewportScale(vw, vh, gameW, gameH));
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

  const layoutW = gameW * scale;
  const layoutH = gameH * scale;

  return (
    <div
      className="satze-viewport"
      style={{
        background: PALETTE.deepVoid,
        '--satze-scale': scale,
      }}
    >
      {/* Spacer: la box di layout coincide con la size visuale post-scale */}
      <div
        style={{
          width: layoutW,
          height: layoutH,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: gameW,
            height: gameH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
