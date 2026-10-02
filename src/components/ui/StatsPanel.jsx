import React, { useState, useEffect, useRef } from 'react';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';

const STATS_FONT = "'Chakra Petch', 'Segoe UI', system-ui, sans-serif";
const DEFAULT_ACCENT = '#c8c8c8';

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(200, 200, 200, ${alpha})`;
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(200, 200, 200, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

function CornerBrackets() {
  return (
    <>
      <span className="satze-stats-bracket satze-stats-bracket--tl" aria-hidden />
      <span className="satze-stats-bracket satze-stats-bracket--tr" aria-hidden />
      <span className="satze-stats-bracket satze-stats-bracket--bl" aria-hidden />
      <span className="satze-stats-bracket satze-stats-bracket--br" aria-hidden />
    </>
  );
}

function StatCell({ label, value, valueClass = '', dataEmHp = null }) {
  return (
    <div className="satze-stats-cell" data-em-hp={dataEmHp || undefined}>
      <span className="satze-stats-cell__label">{label}</span>
      <span className={`satze-stats-cell__value ${valueClass}`}>{value}</span>
    </div>
  );
}

/** PV che scorrono: a ogni punto il numero vecchio esce e il nuovo entra (giù se cala, su se cresce). */
function RollingValue({ value }) {
  const prevRef = useRef(value);
  const [roll, setRoll] = useState(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === value || prev == null || value == null) return;
    setRoll({ from: prev, to: value, dir: value < prev ? 'down' : 'up', key: `${prev}>${value}` });
  }, [value]);
  if (!roll || roll.to !== value) return value;
  return (
    <span className={`satze-stats-roll satze-stats-roll--${roll.dir}`} key={roll.key}>
      <span className="satze-stats-roll__out" aria-hidden>{roll.from}</span>
      <span className="satze-stats-roll__in">{roll.to}</span>
    </span>
  );
}

/** Etichetta della raffica di PV (−1 → −2 → …, o +1 → +2 · Campo) accanto al box. */
function HpBurst({ burst, side }) {
  if (!burst) return null;
  return (
    <span
      key={burst.key}
      className={`satze-stats-burst satze-stats-burst--${side} satze-stats-burst--${burst.kind}${burst.leaving ? ' is-leaving' : ''}`}
      aria-live="polite"
    >
      <span key={burst.n} className="satze-stats-burst__text">{burst.text}</span>
    </span>
  );
}

function ToxinBadge({ toxin, hp, showAnimation }) {
  const canApply = hp >= toxin.minHealth;

  return (
    <div
      className={`satze-stats-toxin ${canApply ? '' : 'satze-stats-toxin--blocked'} ${
        showAnimation ? 'satze-stats-toxin--pulse' : ''
      }`}
      title={`Tossina ${toxin.value} (min ${toxin.minHealth} PV)${toxin.source ? ` da ${toxin.source}` : ''}${
        canApply ? ' — Si applicherà a fine turno' : ' — Non può essere applicata (PV troppo bassi)'
      }`}
    >
      <span className="satze-stats-toxin__orb" aria-label={`Stack tossina: ${toxin.value}`}>
        {toxin.value}
      </span>
      <span className="satze-stats-toxin__label">Tox</span>
      {!canApply && (
        <span className="satze-stats-toxin__warn" title={`PV ${hp} < min ${toxin.minHealth}`}>
          !
        </span>
      )}
    </div>
  );
}

/**
 * Pannello statistiche duello — barra HUD orizzontale: nome, PV, FC, tossina.
 */
export const StatsPanel = React.memo(({
  label,
  hp,
  focus,
  toxin = null,
  position = 'top-left',
  gamePhase,
  className = '',
  styleOverride = null,
  duelShell = true,
  /** Colore identità esercito — bordo, angoli e nome */
  accentColor = null,
  /** Nel risultato del duello il box resta in scena (PV che scendono colpo per colpo) */
  fadeOnResult = true,
  /** Raffica di PV in corso: { key, n, kind: 'hit'|'heal', text, leaving } */
  hpBurst = null,
}) => {
  const [showToxinAnimation, setShowToxinAnimation] = useState(false);
  const [previousToxinValue, setPreviousToxinValue] = useState(null);

  useEffect(() => {
    if (toxin && toxin.value > 0) {
      if (previousToxinValue !== null && previousToxinValue !== toxin.value) {
        setShowToxinAnimation(true);
        const timer = setTimeout(() => setShowToxinAnimation(false), 1500);
        return () => clearTimeout(timer);
      }
      if (previousToxinValue === null) {
        setShowToxinAnimation(true);
        const timer = setTimeout(() => setShowToxinAnimation(false), 1000);
        return () => clearTimeout(timer);
      }
      setPreviousToxinValue(toxin.value);
    } else {
      setPreviousToxinValue(null);
    }
  }, [toxin?.value, previousToxinValue]);

  const positionStyles = {
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
  };

  const side = position === 'top-left' ? 'enemy' : 'player';
  const animationClass = position === 'top-left'
    ? 'animate-fade-out-panels'
    : 'animate-fade-out-panels-right';

  const isToxinActive = toxin && toxin.value > 0;

  const styleOverrideHasBackground =
    styleOverride &&
    (styleOverride.background != null ||
      styleOverride.backgroundColor != null ||
      styleOverride.backgroundImage != null);

  const useHudShell = duelShell && !styleOverrideHasBackground;
  const armyAccent = accentColor || DEFAULT_ACCENT;

  return (
    <div
      className={`absolute satze-stats-panel satze-stats-panel--${side} ${
        useHudShell ? 'satze-stats-panel--shell' : ''
      } ${isToxinActive ? 'satze-stats-panel--has-toxin' : ''} ${
        gamePhase === 'result' && fadeOnResult ? `${animationClass} pointer-events-none` : ''
      } ${className}`}
      style={{
        ...positionStyles[position],
        zIndex: 10,
        fontFamily: useHudShell ? STATS_FONT : HUD_ORATORIO_FONT_UI,
        ...(useHudShell
          ? {
              '--stats-army-accent': armyAccent,
              '--stats-army-border': hexToRgba(armyAccent, 0.42),
              '--stats-army-glow': hexToRgba(armyAccent, 0.14),
            }
          : {
              background: PALETTE.panelBg,
              border: `1px solid ${accentColor || PALETTE.slate}`,
            }),
        ...(styleOverride || {}),
      }}
    >
      {useHudShell && <CornerBrackets />}

      <div className="satze-stats-panel__inner">
        <span className="satze-stats-panel__name" title={label}>
          {label}
        </span>

        <span className="satze-stats-panel__divider" aria-hidden />

        <StatCell label="PV" value={<RollingValue value={hp} />} valueClass="satze-stats-cell__value--pv" dataEmHp={side} />

        <span className="satze-stats-panel__divider" aria-hidden />

        <StatCell label="FC" value={focus} valueClass="satze-stats-cell__value--fc" />

        {isToxinActive && (
          <>
            <span className="satze-stats-panel__divider" aria-hidden />
            <ToxinBadge toxin={toxin} hp={hp} showAnimation={showToxinAnimation} />
          </>
        )}
      </div>
      <HpBurst burst={hpBurst} side={side} />
    </div>
  );
});
StatsPanel.displayName = 'StatsPanel';
