import React, { useId } from 'react';
import { CARD_RUNES } from '../ui/RuneTitle.jsx';

/**
 * Calco in ceralacca per il campo conquistato: goccia di cera irregolare nel
 * colore dell'armata, anello premuto e una runa delle carte impressa al
 * centro. Entra con un colpo di timbro (vedi .wax-seal in satze-duello-cosmo.css).
 */

function shade(hex, amt) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return hex || '#7a1f2b';
  const ch = (h) => {
    const v = parseInt(h, 16);
    const t = amt < 0 ? 0 : 255;
    return Math.round(v + (t - v) * Math.abs(amt)).toString(16).padStart(2, '0');
  };
  return `#${ch(m[1])}${ch(m[2])}${ch(m[3])}`;
}

export function WaxSeal({ color = '#8b1e2d', rune = 0, seed = 1, size = 34, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const base = color;
  const dark = shade(color, -0.55);
  const deep = shade(color, -0.75);
  const light = shade(color, 0.45);
  const d = CARD_RUNES[Math.abs(rune) % CARD_RUNES.length];
  return (
    <svg
      className={`wax-seal ${className}`}
      width={size}
      height={size}
      viewBox="-20 -20 40 40"
      aria-hidden
    >
      <defs>
        <radialGradient id={`wg-${uid}`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="42%" stopColor={base} />
          <stop offset="100%" stopColor={deep} />
        </radialGradient>
        <filter id={`wr-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency=".32" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="3.6" />
        </filter>
      </defs>
      {/* goccia di cera con le colature sul bordo */}
      <g filter={`url(#wr-${uid})`}>
        <circle r="15.5" fill={`url(#wg-${uid})`} />
        <circle cx="13" cy="7" r="3.8" fill={base} />
        <circle cx="-12.5" cy="9.5" r="3.2" fill={dark} />
        <circle cx="4" cy="-15" r="2.8" fill={light} opacity=".85" />
        <circle cx="-14" cy="-6" r="2.4" fill={base} />
      </g>
      {/* anello premuto dal timbro: solco scuro + riflesso */}
      <circle r="10.5" fill="none" stroke={deep} strokeWidth="1.6" opacity=".75" />
      <circle r="10.5" fill="none" stroke={light} strokeWidth=".6" opacity=".55" transform="translate(-.7 -.7)" />
      <circle r="10.5" fill={dark} opacity=".22" />
      {/* runa impressa: incavo scuro + bordo illuminato */}
      <g transform="scale(1.75)" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d={d} stroke={light} strokeWidth=".7" opacity=".6" transform="translate(-.35 -.35)" />
        <path d={d} stroke={deep} strokeWidth=".95" />
      </g>
      {/* lucido della cera */}
      <ellipse cx="-5.5" cy="-7.5" rx="4.5" ry="2.2" fill="#ffffff" opacity=".22" transform="rotate(-30 -5.5 -7.5)" />
    </svg>
  );
}

export default WaxSeal;
