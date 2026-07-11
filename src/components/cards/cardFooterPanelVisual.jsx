import React from 'react';
import { Icon } from '../ui/Icon';

/** Layer tinta footer — solo sfondo (animato separatamente dal testo). */
export const CARD_FOOTER_BLOCKED_TINT =
  'bg-gradient-to-r from-red-950/42 via-red-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.11),0_8px_20px_-12px_rgba(0,0,0,0.14),0_0_22px_-8px_rgba(248,113,113,0.1)]';
export const CARD_FOOTER_INACTIVE_TINT =
  'bg-gradient-to-r from-slate-950/42 via-slate-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(148,163,184,0.11)]';
export const CARD_FOOTER_ABILITY_HIGHLIGHT_TINT =
  'bg-gradient-to-r from-orange-950/40 via-orange-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(251,146,60,0.09)]';
export const CARD_FOOTER_BONUS_HIGHLIGHT_TINT =
  'bg-gradient-to-r from-sky-950/40 via-sky-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(56,189,248,0.09)]';

/** Padding verticale righe footer (simmetrico potere/bonus); bleed orizzontale sul componente carta. */
export const CARD_FOOTER_SHELL_PADDING = 'py-2 overflow-hidden';
export const CARD_FOOTER_ROW_SHELL_CLASS = 'relative origin-bottom transform-gpu';
/** Margine verticale tra righe potere e bonus. */
export const CARD_FOOTER_ROW_DIVIDER_STYLE = { margin: '5px 0' };

/** Durata sweep pannello causa blocco — allineata a index.css (0.92s). */
export const CARD_FOOTER_PANEL_SWEEP_MS = 920;
export const CARD_FOOTER_PANEL_STAGGER_MS = 180;
/** Pausa prima degli effetti blocco sulla vittima (non sommata allo sweep del bloccante). */
export const CARD_FOOTER_BLOCKED_EFFECT_PAUSE_MS = 500;
export const CARD_FOOTER_BLOCKED_EFFECT_DELAY_MS = CARD_FOOTER_BLOCKED_EFFECT_PAUSE_MS;
export const CARD_FOOTER_BLOCKED_EFFECT_DELAY_STAGGER_MS =
  CARD_FOOTER_BLOCKED_EFFECT_PAUSE_MS + CARD_FOOTER_PANEL_STAGGER_MS;

export function resolveCardFooterPanelVisual({
  blocked,
  inactive,
  highlight,
  highlightTint,
  stagger = false,
  suppressAnimations = false,
}) {
  let state = 'neutral';
  let tintClass = null;
  if (blocked) {
    state = 'blocked';
    tintClass = CARD_FOOTER_BLOCKED_TINT;
  } else if (inactive) {
    state = 'inactive';
    tintClass = CARD_FOOTER_INACTIVE_TINT;
  } else if (highlight) {
    state = 'highlight';
    tintClass = highlightTint;
  }

  const shellPadding = CARD_FOOTER_SHELL_PADDING;

  let animClass = '';
  if (tintClass && !suppressAnimations) {
    if (blocked) {
      animClass = stagger
        ? 'animate-modifier-footer-panel-blocked-in-stagger'
        : 'animate-modifier-footer-panel-blocked-in';
    } else {
      animClass = stagger
        ? 'animate-modifier-footer-panel-tint-in-stagger'
        : 'animate-modifier-footer-panel-tint-in';
    }
  }

  return { state, tintClass, shellPadding, animClass, blockedPanel: blocked };
}

/** Classi FX blocco: testo resta visibile, animano solo tinta/icona/barrato/dim. */
export function getBlockedFooterFxClasses(suppressAnimations, stagger = false, layer = 'ability') {
  if (suppressAnimations) {
    return {
      label: 'text-red-400',
      text: 'text-red-300 line-through',
      dim: 'opacity-60',
      icon: '',
    };
  }
  const sfx = stagger ? '-stagger' : '';
  const labelAnim =
    layer === 'bonus'
      ? `animate-modifier-footer-blocked-bonus-label-fx${sfx}`
      : `animate-modifier-footer-blocked-label-fx${sfx}`;
  return {
    label: labelAnim,
    text: `animate-modifier-footer-blocked-text-fx${sfx}`,
    dim: `animate-modifier-footer-blocked-dim-fx${sfx}`,
    icon: `animate-modifier-footer-panel-blocked-in${sfx}`,
  };
}

export function CardFooterTintLayer({ state, tintClass, animClass, blockedPanel = false }) {
  if (!tintClass) return null;
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div
        key={state}
        className={`absolute inset-0 transform-gpu will-change-transform ${blockedPanel ? 'origin-top' : 'origin-bottom'} ${tintClass} ${animClass}`}
      />
    </div>
  );
}

/** Icona blocco — drop dall’alto, testo sottostante resta visibile. */
export function CardFooterBlockIconOverlay({
  animClass,
  suppressAnimations = false,
  iconSize = 24,
}) {
  const icon = (
    <Icon
      name="block"
      type="cardIcon"
      size={iconSize}
      color="#ef4444"
      className="opacity-30"
      style={{ transform: 'rotate(-15deg)' }}
    />
  );

  if (suppressAnimations || !animClass) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]">
        {icon}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]" aria-hidden>
      <div
        className={`absolute inset-0 flex items-center justify-center origin-top transform-gpu will-change-transform ${animClass}`}
      >
        {icon}
      </div>
    </div>
  );
}
