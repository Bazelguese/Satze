import React, { useCallback, useEffect, useRef } from 'react';
import { DUEL_REVEAL_MS } from './duelEntranceTiming';

/**
 * Velo nero — scoperta continua con maschera radiale morbida.
 * @param {'hold'|'reveal'} phase
 */
export function DuelRevealVeil({ phase = 'hold', onRevealComplete }) {
  const isRevealing = phase === 'reveal';
  const completedRef = useRef(false);

  const handleAnimationEnd = useCallback(
    (event) => {
      if (!isRevealing) return;
      if (event.animationName !== 'duel-reveal-unified' && event.animationName !== 'duel-reveal-fallback') {
        return;
      }
      if (completedRef.current) return;
      completedRef.current = true;
      onRevealComplete?.();
    },
    [isRevealing, onRevealComplete]
  );

  useEffect(() => {
    if (phase === 'hold') completedRef.current = false;
  }, [phase]);

  return (
    <div
      className={[
        'duel-reveal-veil',
        isRevealing ? 'duel-reveal-veil--active' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--reveal-ms': `${DUEL_REVEAL_MS}ms` }}
      aria-hidden
    >
      <div className="duel-reveal-veil__shade" onAnimationEnd={handleAnimationEnd} />
      <DuelRevealVeilStyles />
    </div>
  );
}

function DuelRevealVeilStyles() {
  return (
    <style>{`
      @property --reveal-r {
        syntax: '<length>';
        inherits: false;
        initial-value: 0vmax;
      }

      .duel-reveal-veil {
        position: absolute;
        inset: 0;
        z-index: 30;
        pointer-events: none;
        overflow: hidden;
      }

      .duel-reveal-veil__shade {
        position: absolute;
        inset: -4%;
        background: radial-gradient(
          ellipse 118% 108% at 50% 47%,
          #080a10 0%,
          #050608 72%,
          #030406 100%
        );
        --reveal-r: 0vmax;
        opacity: 1;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-mask-image: radial-gradient(
          circle at 50% 47%,
          transparent 0vmax,
          transparent calc(var(--reveal-r) - 3.2vmax),
          rgba(0, 0, 0, 0.1) calc(var(--reveal-r) - 1.8vmax),
          rgba(0, 0, 0, 0.38) calc(var(--reveal-r) - 0.5vmax),
          rgba(0, 0, 0, 0.74) var(--reveal-r),
          #000 calc(var(--reveal-r) + 3vmax)
        );
        mask-image: radial-gradient(
          circle at 50% 47%,
          transparent 0vmax,
          transparent calc(var(--reveal-r) - 3.2vmax),
          rgba(0, 0, 0, 0.1) calc(var(--reveal-r) - 1.8vmax),
          rgba(0, 0, 0, 0.38) calc(var(--reveal-r) - 0.5vmax),
          rgba(0, 0, 0, 0.74) var(--reveal-r),
          #000 calc(var(--reveal-r) + 3vmax)
        );
        will-change: --reveal-r, opacity;
      }

      @supports (color: color-mix(in srgb, #000, #fff)) {
        .duel-reveal-veil--active .duel-reveal-veil__shade {
          animation: duel-reveal-unified var(--reveal-ms) cubic-bezier(0.37, 0.01, 0.09, 1) forwards;
        }
      }

      @keyframes duel-reveal-unified {
        0% {
          --reveal-r: 0vmax;
          opacity: 1;
        }
        76% {
          opacity: 1;
        }
        100% {
          --reveal-r: 128vmax;
          opacity: 0;
        }
      }

      @supports not (color: color-mix(in srgb, #000, #fff)) {
        .duel-reveal-veil__shade {
          -webkit-mask-image: none;
          mask-image: none;
          clip-path: circle(150% at 50% 47%);
        }
        .duel-reveal-veil--active .duel-reveal-veil__shade {
          animation: duel-reveal-fallback var(--reveal-ms) cubic-bezier(0.37, 0.01, 0.09, 1) forwards;
        }
      }

      @keyframes duel-reveal-fallback {
        0%   { clip-path: circle(150% at 50% 47%); opacity: 1; }
        5%   { clip-path: circle(142.5% at 50% 47%); }
        10%  { clip-path: circle(135% at 50% 47%); }
        15%  { clip-path: circle(127.5% at 50% 47%); }
        20%  { clip-path: circle(120% at 50% 47%); }
        25%  { clip-path: circle(112.5% at 50% 47%); }
        30%  { clip-path: circle(105% at 50% 47%); }
        35%  { clip-path: circle(97.5% at 50% 47%); }
        40%  { clip-path: circle(90% at 50% 47%); }
        45%  { clip-path: circle(82.5% at 50% 47%); }
        50%  { clip-path: circle(75% at 50% 47%); }
        55%  { clip-path: circle(67.5% at 50% 47%); }
        60%  { clip-path: circle(60% at 50% 47%); }
        65%  { clip-path: circle(52.5% at 50% 47%); }
        70%  { clip-path: circle(45% at 50% 47%); }
        75%  { clip-path: circle(37.5% at 50% 47%); opacity: 0.94; }
        80%  { clip-path: circle(30% at 50% 47%); opacity: 0.82; }
        85%  { clip-path: circle(22.5% at 50% 47%); opacity: 0.58; }
        90%  { clip-path: circle(15% at 50% 47%); opacity: 0.32; }
        95%  { clip-path: circle(7.5% at 50% 47%); opacity: 0.12; }
        100% { clip-path: circle(0% at 50% 47%); opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .duel-reveal-veil--active .duel-reveal-veil__shade {
          animation-duration: 0.001s !important;
          --reveal-r: 128vmax !important;
          opacity: 0 !important;
          clip-path: circle(0% at 50% 47%) !important;
        }
      }
    `}</style>
  );
}

/** HUD sotto il velo: emerge in sincrono con la scoperta. */
export function DuelRevealHudStyles() {
  return (
    <style>{`
      .duel-hud--discovering {
        animation: duel-hud-discover var(--duel-reveal-ms, 2100ms) cubic-bezier(0.37, 0.01, 0.09, 1) forwards;
        transform: translateZ(0);
      }

      @keyframes duel-hud-discover {
        0% {
          opacity: 0.1;
          filter: blur(20px) brightness(0.42) saturate(0.82);
          transform: scale(1.028) translateZ(0);
        }
        100% {
          opacity: 1;
          filter: blur(0) brightness(1) saturate(1);
          transform: scale(1) translateZ(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .duel-hud--discovering {
          animation: none !important;
          opacity: 1 !important;
          filter: none !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}
