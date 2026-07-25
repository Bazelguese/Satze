import { useEffect, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from '../../settings/displaySettings';
import { getVfxQualityProfile, resolveVfxQualityProfile } from '../../settings/vfxQualityProfile';

/** Stesso linguaggio visivo del menù V5 (viola/magenta, senza tipografia gigante). */
export function CosmicMenuBackground({ parallaxRef }) {
  const ACCENT = MENU_ACCENTS.magenta;
  const GLOW_X = "30%";
  const GLOW_Y = "38%";
  const [profile, setProfile] = useState(() => getVfxQualityProfile());

  useEffect(() => {
    const on = () => setProfile(resolveVfxQualityProfile(getDisplaySettings()));
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  const blurPx = profile.menuBlurPx;
  const glowOn = profile.menuGlowEnabled;

  return (
    <>
    <style>{`
      @keyframes satze-cosmic-menu-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
      @keyframes satze-cosmic-menu-pulse { 0%,100% { filter: drop-shadow(0 0 8px currentColor) } 50% { filter: drop-shadow(0 0 18px currentColor) } }
    `}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${GLOW_X} ${GLOW_Y}, #2a0a3a 0%, #14051f 40%, ${MENU_ACCENTS.void} 80%)`,
        }}
      />
      {glowOn && (
        <div
          ref={parallaxRef}
          style={{
            position: "absolute",
            left: GLOW_X,
            top: GLOW_Y,
            transform: "translate(-50%, -50%)",
            width: "min(920px, 95vw)",
            height: "min(880px, 95vh)",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(192,38,211,0.2) 0%, rgba(88,28,135,0.18) 30%, transparent 64%)",
            filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
            animation: profile.menuSigilAnimation ? "satze-cosmic-menu-pulse 6s ease-in-out infinite" : 'none',
            color: ACCENT,
            pointerEvents: "none",
            willChange: "transform",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: profile.quality === 'low' ? 0.04 : 0.09,
          backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
          backgroundSize: "8px 8px",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
