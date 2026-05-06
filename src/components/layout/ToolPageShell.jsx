import React, { useEffect } from 'react';
import {
  PALETTE,
  HUD_ORATORIO_FONT_UI,
  HUD_ORATORIO_FONT_DISPLAY,
  injectSatzeUiFonts,
  buildSatzeCosmicBackgroundCSS,
} from '../../theme/hudOratorioPalette';

/**
 * Guscio condiviso per pagine tool / lab (?cardPrototype=, ?styleLab=, …):
 * stesso sfondo cosmico, font HUD e variabili CSS per `.satze-tool-panel` ecc.
 */
export function ToolPageShell({
  title,
  subtitle,
  onClose,
  closeLabel = '← Torna al gioco',
  headerActions,
  /** Classi aggiuntive sul contenitore interno (es. `style-lab-root` per scope CSS). */
  contentClassName = '',
  children,
}) {
  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  // Alcuni browser incorporati / view mostrano bianco dietro il layer fixed se html/body restano al default.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = PALETTE.deepVoid;
    body.style.backgroundColor = PALETTE.deepVoid;
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  const shellVars = {
    '--st-border': PALETTE.slate,
    '--st-panel': PALETTE.panelBg,
    '--st-well': 'rgba(8, 6, 18, 0.88)',
    '--st-text': PALETTE.textPrimary,
    '--st-muted': PALETTE.textSecondary,
    '--st-input-bg': 'rgba(12, 10, 22, 0.95)',
    '--st-accent': PALETTE.amber,
    '--st-border-hi': PALETTE.panelEdge,
  };

  return (
    <div
      className="satze-tool-page fixed inset-0 z-[9998] overflow-y-auto overflow-x-hidden overscroll-y-contain"
      style={{ WebkitOverflowScrolling: 'touch', backgroundColor: PALETTE.deepVoid, ...shellVars }}
    >
      <div
        style={{
          minHeight: '100%',
          position: 'relative',
          background: buildSatzeCosmicBackgroundCSS(),
          fontFamily: HUD_ORATORIO_FONT_UI,
          color: PALETTE.textPrimary,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.14,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.2) 2px,
              rgba(0, 0, 0, 0.2) 3px
            )`,
          }}
        />
        <div
          className={`relative z-[1] mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-8 ${contentClassName}`.trim()}
        >
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--st-text)] sm:text-3xl"
                style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--st-muted)]">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {headerActions}
              {onClose ? (
                <button type="button" onClick={onClose} className="satze-tool-btn-secondary">
                  {closeLabel}
                </button>
              ) : null}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
