/**
 * Schermata di caricamento — palette SATZE (blu / viola / pietra).
 */
import React from 'react';
import {
  PALETTE,
  HUD_ORATORIO_FONT_UI,
  BRAND_LOGO_SRC,
  BRAND_LOGO_WIDTH,
  BRAND_LOGO_HEIGHT,
  buildSatzeCosmicBackgroundCSS,
} from '../theme/hudOratorioPalette';

export function LoadingScreen({ progress = 0 }) {
  const p = Math.min(100, Math.max(0, progress));

  const loadingStyles = `
  @keyframes loading-dot {
    0%, 100% { opacity: 0.35; transform: scale(0.9); box-shadow: 0 0 0 transparent; }
    50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 12px ${PALETTE.panelEdge}88; }
  }
`;

  return (
    <>
      <style>{loadingStyles}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: buildSatzeCosmicBackgroundCSS(),
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        {/* Scanline leggera */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.22,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.2) 2px,
              rgba(0, 0, 0, 0.2) 3px
            )`,
          }}
        />

        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '0.5rem', padding: '0 1rem' }}>
          <div className="satze-brand-logo-wrap" style={{ margin: '0 auto' }}>
            <div className="satze-brand-logo-pulse">
              <div className="satze-brand-logo-glare-host">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="SATZE"
                  width={BRAND_LOGO_WIDTH}
                  height={BRAND_LOGO_HEIGHT}
                  decoding="async"
                  fetchpriority="high"
                  className="satze-brand-logo"
                  style={{
                    margin: '0 auto',
                  width: 'min(92vw, 720px)',
                  height: 'auto',
                  maxHeight: 'clamp(120px, 38vh, 360px)',
                    objectFit: 'contain',
                  }}
                />
                <div
                  className="satze-brand-logo-glare-layer"
                  aria-hidden
                  style={{
                    WebkitMaskImage: `url(${BRAND_LOGO_SRC})`,
                    maskImage: `url(${BRAND_LOGO_SRC})`,
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.35em',
              color: PALETTE.textSecondary,
              marginTop: '0.65rem',
              opacity: 0.88,
            }}
          >
            LA GRANDE GUERRA
          </div>
        </div>

        <div
          style={{
            width: 'min(300px, 78vw)',
            height: 5,
            marginTop: '2rem',
            marginBottom: '1rem',
            borderRadius: 0,
            overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid rgba(90, 101, 153, 0.35)`,
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${p}%`,
              background: `linear-gradient(90deg, ${PALETTE.cyan}cc, ${PALETTE.gold} 85%, ${PALETTE.goldBright})`,
              boxShadow: `0 0 14px rgba(184, 196, 168, 0.35)`,
              transition: 'width 0.35s ease-out',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            color: PALETTE.textSecondary,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {p >= 100 ? 'Pronto' : 'Caricamento'}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            display: 'flex',
            gap: 8,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: i % 2 === 0 ? PALETTE.cyan : PALETTE.magenta,
                opacity: 0.5,
                animation: `loading-dot 1.15s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
