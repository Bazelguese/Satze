import React from 'react';
import { useCardPointerTilt } from '../../hooks/useCardPointerTilt.js';

/**
 * Shell 3D per carte in consultazione (galleria / anteprima esercito).
 * `shineAccent` tinge fascio e glare (es. colore esercito); se omesso resta luce neutra.
 * `hitPadX` / `hitPadY`: zona interattiva oltre la carta (solo hit — non ruota con il tilt).
 */
export function CardPointerTilt({
  children,
  shineAccent,
  maxTilt = 12,
  className = '',
  style,
  disabled = false,
  hitPadX = 0,
  hitPadY = 0,
}) {
  const padX = Math.max(0, hitPadX);
  const padY = Math.max(0, hitPadY);
  const { rootRef, onPointerMove, resetTilt } = useCardPointerTilt(maxTilt, padX, padY);
  const accent = shineAccent || 'rgba(255,255,255,0.75)';
  const hasHitPad = padX > 0 || padY > 0;

  return (
    <div
      ref={rootRef}
      className={`cpt-hit${hasHitPad ? ' cpt-hit--pad' : ''}${className ? ` ${className}` : ''}`}
      data-tilt="0"
      style={{
        '--cpt-accent': accent,
        '--cpt-rx': '0deg',
        '--cpt-ry': '0deg',
        '--cpt-px': '50%',
        '--cpt-py': '42%',
        '--cpt-mx': 0,
        '--cpt-my': 0,
        ...(hasHitPad ? { padding: `${padY}px ${padX}px`, boxSizing: 'content-box' } : null),
        ...style,
      }}
      onPointerMove={disabled ? undefined : onPointerMove}
      onPointerLeave={disabled ? undefined : resetTilt}
    >
      {/* Solo questo nodo ruota: il padding hit resta fisso e invisibile. */}
      <div className="cpt-stage">
        <div className="cpt-card">
          {children}
          <div className="cpt-fx" aria-hidden="true">
            <div className="cpt-shine" />
            <div className="cpt-glare" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inietta gli stili una sola volta per schermata. */
export function CardPointerTiltStyles() {
  return (
    <style>{`
      .cpt-hit {
        position: relative;
        overflow: visible;
        background: transparent;
        perspective: 900px;
        perspective-origin: 50% 45%;
        transform-style: preserve-3d;
        /* Nessun transform qui: altrimenti il padding hit diventa un "bordo" che ruota. */
      }
      .cpt-stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: visible;
        transform-style: preserve-3d;
        transform-origin: 50% 50%;
        transform: rotateX(var(--cpt-rx)) rotateY(var(--cpt-ry));
        /* Settle soft solo a riposo; in tracking niente lag CSS. */
        transition: transform .4s cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
      }
      .cpt-hit[data-tilt="1"] .cpt-stage {
        transition: none;
        transform: rotateX(var(--cpt-rx)) rotateY(var(--cpt-ry));
      }
      .cpt-card {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: visible;
        transform: translateZ(0.1px);
        transition: filter .25s ease;
      }
      .cpt-hit[data-tilt="1"] .cpt-card {
        filter: drop-shadow(0 12px 18px rgba(0,0,0,0.5))
                drop-shadow(0 0 10px color-mix(in srgb, var(--cpt-accent) 28%, transparent));
      }
      .cpt-card > .overflow-hidden {
        overflow: visible !important;
      }
      .cpt-fx {
        position: absolute; inset: 0; z-index: 4;
        pointer-events: none;
        border-radius: 0 0 14px 14px;
        overflow: hidden;
        isolation: isolate;
      }
      .cpt-shine,
      .cpt-glare {
        position: absolute; inset: 0;
        opacity: 0; transition: opacity .28s ease;
      }
      .cpt-shine {
        background:
          linear-gradient(
            115deg,
            transparent 0%,
            transparent 42%,
            color-mix(in srgb, var(--cpt-accent) 14%, transparent) 48%,
            color-mix(in srgb, var(--cpt-accent) 38%, rgba(255,255,255,0.35)) 50%,
            color-mix(in srgb, var(--cpt-accent) 16%, transparent) 52%,
            transparent 58%,
            transparent 100%
          );
        background-size: 220% 220%;
        background-position:
          calc(50% + var(--cpt-mx) * 42%) calc(50% + var(--cpt-my) * 34%);
      }
      .cpt-glare {
        background:
          radial-gradient(
            circle at var(--cpt-px) var(--cpt-py),
            color-mix(in srgb, var(--cpt-accent) 32%, rgba(255,255,255,0.2)) 0%,
            color-mix(in srgb, var(--cpt-accent) 12%, transparent) 24%,
            transparent 52%
          );
      }
      .cpt-hit:hover .cpt-shine { opacity: 0.28; }
      .cpt-hit[data-tilt="1"] .cpt-shine { opacity: 0.42; }
      .cpt-hit[data-tilt="1"] .cpt-glare { opacity: 0.35; }

      @media (prefers-reduced-motion: reduce) {
        .cpt-stage { transform: none !important; }
        .cpt-shine, .cpt-glare { display: none !important; }
      }
      html.satze-reduce-motion .cpt-stage,
      body.satze-reduce-motion .cpt-stage {
        transform: none !important;
      }
      html.satze-reduce-motion .cpt-shine,
      body.satze-reduce-motion .cpt-shine,
      html.satze-reduce-motion .cpt-glare,
      body.satze-reduce-motion .cpt-glare {
        display: none !important;
      }
    `}</style>
  );
}
