export const LAUNCH_TRANSITION = {
  /** Iris nero che copre lo schermo (come armata → esercito). */
  COVER_AT_MS: 1600,
  /** Testo si attenua mentre l'iris avanza. */
  TEXT_HIDE_AT_MS: 1100,
  /** Game starts under solid black. */
  LAUNCH_AT_MS: 1700,
  /** Begin handoff to duel overlay (portal fades, duel owns the reveal). */
  FADE_OUT_AT_MS: 2000,
  /** Remove launch portal after handoff fade. */
  COMPLETE_AT_MS: 2360,
  FADE_OUT_MS: 360,
};

/** @deprecated Use LAUNCH_TRANSITION.COMPLETE_AT_MS */
export const DECK_CONFIRM_TRANSITION_MS = LAUNCH_TRANSITION.COMPLETE_AT_MS;
/** @deprecated Use LAUNCH_TRANSITION.LAUNCH_AT_MS */
export const DECK_CONFIRM_LAUNCH_AT_MS = LAUNCH_TRANSITION.LAUNCH_AT_MS;

/**
 * Transizione post-difficoltà: testo breve → iris nero → hold → fade out.
 */
export function DeckConfirmTransition({
  accent = '#a78bfa',
  deckName = 'Esercito',
  showText = false,
  visualPhase = 'animate',
  variant = 'duel',
}) {
  const isManager = variant === 'manager';
  const irisClosed = visualPhase === 'hold' || visualPhase === 'fadeOut';
  const handoff = visualPhase === 'fadeOut';

  return (
    <div
      className={[
        'dsk-cf-root',
        visualPhase === 'animate' ? 'dsk-cf-root--animate' : '',
        visualPhase === 'hold' ? 'dsk-cf-root--hold' : '',
        visualPhase === 'fadeOut' ? 'dsk-cf-root--fade-out' : '',
      ].filter(Boolean).join(' ')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        pointerEvents: 'none',
        background: 'transparent',
        '--accent': accent,
        '--cover-ms': `${LAUNCH_TRANSITION.COVER_AT_MS}ms`,
        '--fade-out-ms': `${LAUNCH_TRANSITION.FADE_OUT_MS}ms`,
      }}
    >
      {visualPhase === 'animate' && <div className="dsk-cf-flash" aria-hidden="true" />}
      {(visualPhase === 'animate' || visualPhase === 'hold' || visualPhase === 'fadeOut') && (
        <div
          className={[
            'dsk-cf-iris',
            irisClosed ? 'is-closed' : '',
            handoff ? 'is-handoff' : '',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      )}
      {visualPhase === 'animate' && (
        <div className={`dsk-cf-text${showText ? ' is-on' : ''}`}>
          <div className="dsk-cf-loading">
            {isManager ? 'APERTURA EDITOR' : 'CARICAMENTO'}
          </div>
          <div className="dsk-cf-deployed">
            {isManager ? (
              <>
                MODIFICA · <span className="dsk-cf-deck" style={{ color: accent }}>{deckName}</span>
              </>
            ) : (
              <>
                ESERCITO SCHIERATO:{' '}
                <span className="dsk-cf-deck" style={{ color: accent }}>{deckName}</span>
              </>
            )}
          </div>
        </div>
      )}
      <DeckConfirmTransitionStyles />
    </div>
  );
}

function DeckConfirmTransitionStyles() {
  return (
    <style>{`
      .dsk-cf-root { opacity: 1; }

      .dsk-cf-flash {
        position: absolute;
        inset: 0;
        z-index: 1;
        background: var(--accent);
        mix-blend-mode: screen;
        opacity: 0;
      }

      .dsk-cf-iris {
        position: absolute;
        inset: 0;
        z-index: 2;
        background: #050608;
        clip-path: circle(0% at 50% 50%);
        will-change: clip-path;
      }

      .dsk-cf-iris.is-closed {
        clip-path: circle(150% at 50% 50%);
        animation: none !important;
      }

      .dsk-cf-root--animate .dsk-cf-flash {
        animation: dsk-cf-flash var(--cover-ms) ease;
      }
      @keyframes dsk-cf-flash {
        0% { opacity: 0; }
        16% { opacity: 0.42; }
        100% { opacity: 0; }
      }

      .dsk-cf-root--animate .dsk-cf-iris:not(.is-closed) {
        animation: dsk-cf-iris var(--cover-ms) cubic-bezier(.7,.05,.3,1) forwards;
      }
      @keyframes dsk-cf-iris {
        from { clip-path: circle(0% at 50% 50%); }
        to { clip-path: circle(150% at 50% 50%); }
      }

      .dsk-cf-root--fade-out {
        animation: dsk-cf-handoff var(--fade-out-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      @keyframes dsk-cf-handoff {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .dsk-cf-text {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        text-align: center;
        pointer-events: none;
      }

      .dsk-cf-loading,
      .dsk-cf-deployed {
        opacity: 0;
        transform: translateY(14px);
        filter: blur(4px);
        transition:
          opacity 0.85s cubic-bezier(.2,.7,.2,1),
          transform 0.85s cubic-bezier(.2,.7,.2,1),
          filter 0.85s cubic-bezier(.2,.7,.2,1);
      }

      .dsk-cf-text.is-on .dsk-cf-loading {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
        transition-delay: 0.1s;
      }

      .dsk-cf-text.is-on .dsk-cf-deployed {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
        transition-delay: 0.34s;
      }

      .dsk-cf-text:not(.is-on) .dsk-cf-loading,
      .dsk-cf-text:not(.is-on) .dsk-cf-deployed {
        transition-delay: 0s;
        transition-duration: 0.55s;
      }

      .dsk-cf-loading {
        font-family: 'Share Tech Mono', monospace;
        font-size: 13px;
        letter-spacing: 0.42em;
        color: rgba(255, 255, 255, 0.82);
        text-indent: 0.42em;
      }

      .dsk-cf-deployed {
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.22em;
        color: rgba(203, 213, 225, 0.88);
        text-transform: uppercase;
        max-width: min(92vw, 720px);
        line-height: 1.5;
      }

      .dsk-cf-deck {
        font-family: 'Cinzel', serif;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-shadow: 0 0 22px color-mix(in srgb, var(--accent) 55%, transparent);
      }

      @media (prefers-reduced-motion: reduce) {
        .dsk-cf-root--animate .dsk-cf-iris {
          animation-duration: 0.001s !important;
          clip-path: circle(150% at 50% 50%) !important;
        }
        .dsk-cf-root--fade-out {
          animation-duration: 0.001s !important;
          opacity: 0 !important;
        }
        .dsk-cf-loading, .dsk-cf-deployed {
          filter: none !important;
          transition-duration: 0.001s !important;
        }
      }
    `}</style>
  );
}
