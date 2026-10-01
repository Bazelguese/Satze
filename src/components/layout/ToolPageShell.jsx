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
  /** Se false: niente scroll pagina — utile per lab a schermo intero. */
  scrollable = true,
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
      className={`satze-tool-page fixed inset-0 z-[9998] overflow-x-hidden overscroll-y-contain ${
        scrollable ? 'overflow-y-auto' : 'overflow-hidden'
      }`}
      style={{ WebkitOverflowScrolling: 'touch', backgroundColor: PALETTE.deepVoid, ...shellVars }}
    >
      <div
        className={scrollable ? '' : 'flex h-full min-h-0 flex-col'}
        style={{
          minHeight: scrollable ? '100%' : undefined,
          height: scrollable ? undefined : '100%',
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
          className={`relative z-[1] mx-auto flex w-full max-w-[1600px] flex-col px-3 sm:px-5 ${
            scrollable ? 'max-w-7xl py-8 pb-16' : 'h-full min-h-0 py-2'
          } ${contentClassName}`.trim()}
        >
          <header
            className={`flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between ${
              scrollable ? 'mb-8 gap-4 lg:items-start' : 'mb-2'
            }`}
          >
            <div className="min-w-0 flex-1">
              <h1
                className={`font-bold tracking-tight text-[var(--st-text)] ${
                  scrollable ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                }`}
                style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className={`max-w-2xl text-[var(--st-muted)] ${
                    scrollable ? 'mt-1 text-sm leading-relaxed' : 'mt-0.5 text-[11px] leading-snug line-clamp-1'
                  }`}
                >
                  {subtitle}
                </p>
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
          <div className={scrollable ? '' : 'min-h-0 flex-1'}>{children}</div>
        </div>
      </div>
    </div>
  );
}
