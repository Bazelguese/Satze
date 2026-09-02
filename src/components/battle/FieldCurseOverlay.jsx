import React, { useId } from 'react';
import { RUNES, sashRuneIndex } from '../eminence/eminenceUi.js';

const CHIP_RUNES = [
  { x: 18, y: 20, s: 3.4, r: -18, slice: { x: -4, y: -4, w: 8, h: 3.2 } },
  { x: 52, y: 28, s: 2.8, r: 11, slice: null },
  { x: 86, y: 14, s: 3.6, r: -8, slice: { x: -1, y: 0, w: 6, h: 4 } },
  { x: 124, y: 30, s: 3.1, r: 16, slice: null },
  { x: 158, y: 12, s: 3.8, r: -14, slice: { x: -4, y: -4, w: 5.5, h: 8 } },
  { x: 196, y: 26, s: 3.2, r: 7, slice: null },
];

function GlitchRune({ d, accent, x, y, s, r, slice, clipId }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {slice && (
        <clipPath id={clipId}>
          <rect x={slice.x} y={slice.y} width={slice.w} height={slice.h} />
        </clipPath>
      )}
      <path d={d} fill="none" stroke="#ff3cac" strokeWidth="0.7" strokeLinecap="round" transform="translate(-0.9 0.35)" opacity="0.7" />
      <path d={d} fill="none" stroke={accent} strokeWidth="0.7" strokeLinecap="round" transform="translate(0.85 -0.3)" opacity="0.75" />
      <path d={d} fill="none" stroke="#e8fbff" strokeWidth="0.9" strokeLinecap="round" />
      {slice && (
        <path
          d={d}
          fill="none"
          stroke={accent}
          strokeWidth="1.15"
          strokeLinecap="round"
          transform="translate(1.4 -0.6)"
          opacity="0.85"
          clipPath={`url(#${clipId})`}
        />
      )}
    </g>
  );
}

function RuneField({ accent, seed = 3, idPrefix }) {
  return (
    <svg className="satze-field-curse-runes" viewBox="0 0 220 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {CHIP_RUNES.map((rune, i) => (
        <GlitchRune
          key={i}
          d={RUNES[sashRuneIndex(i, seed)]}
          accent={accent}
          clipId={`${idPrefix}-s${i}`}
          {...rune}
        />
      ))}
    </svg>
  );
}

export function FieldCurseOverlay({ accent = '#26c4e8', variant = 'chip', arriving = false }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className={`satze-field-curse-veil satze-field-curse-veil--${variant}${arriving ? ' is-arrive' : ''}`} aria-hidden>
      <RuneField accent={accent} seed={variant === 'panel' ? 5 : 3} idPrefix={uid} />
      <span className="satze-field-curse-stamp">
        <span className="satze-field-curse-stamp-ghost satze-field-curse-stamp-ghost--m">Maledetto</span>
        <span className="satze-field-curse-stamp-ghost satze-field-curse-stamp-ghost--c">Maledetto</span>
        <span className="satze-field-curse-stamp-ink">Maledetto</span>
      </span>
    </div>
  );
}
