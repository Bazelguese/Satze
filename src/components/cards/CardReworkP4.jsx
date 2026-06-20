// Layout alternativo P4 (Rework Carte) — galleria + Style Lab.
// POT stat (potenza): giallo; etichette ★ POTERE / ✠ BONUS: arancio/cielo; box evidenziazione duello solo con highlight*.

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ARMY_COLORS, ARMY_BONUSES } from '../../data';
import { leagueTierColorHex } from '../../data/leagueColors';
import { getCardSprite } from '../../utils';
import { getImagePositioning } from '../../data/imagePositioning';
import { CardImage } from './CardImage';
import { Icon } from '../ui/Icon';
import {
  AbilityFormatted,
  BonusFormattedFromString,
  DEFAULT_MIN_CLASS,
  FOOTER_MUTED_MIN_CLASS,
} from './AbilityFormatted';

const GAME_CARD_UI_FONT = "'Chakra Petch', 'Segoe UI', system-ui, sans-serif";

/** POT numerico (potenza) vs etichette footer abilità/bonus (arancio/cielo; duello: box extra solo se highlight*). */
const CARD_STAT_POWER = '#fde047';
const CARD_STAT_DAMAGE = '#c084fc';
const CARD_LABEL_MUTED = '#94a3b8';
const CARD_ABILITY_LABEL = '#fb923c'; // orange-400 (etichetta Potere)
const CARD_BONUS_LABEL = '#38bdf8'; // sky-400 (etichetta Bonus)
const CARD_FOOTER_PANEL_BG = 'rgba(0,0,0,0.48)';
const CARD_FOOTER_DIVIDER = 'rgba(255,255,255,0.1)';
const CARD_BORDER_DEFAULT = 'rgba(255,255,255,0.28)';

/** Nome agente in fascia: alone scuro + alone per restare leggibile sulle rune. */
const P4_SASH_NAME_OUTLINE =
  '0 0 2px rgba(0,0,0,0.98), 0 1px 3px rgba(0,0,0,1), 0 2px 10px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,1)';

/** Traccia su testo bianco (armata in barra). */
const P4_ARMY_BAR_WHITE_OUTLINE =
  '1px 0 0 rgba(0,0,0,0.92), -1px 0 0 rgba(0,0,0,0.92), 0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(0,0,0,0.82), 0 0 5px rgba(0,0,0,0.95), 0 2px 6px rgba(0,0,0,0.88)';

/** Contorno su testo lega in barra (sopra fondo accent / pill scura). */
const P4_LEAGUE_COLORED_OUTLINE =
  '1px 0 1px rgba(0,0,0,0.88), -1px 0 1px rgba(0,0,0,0.88), 0 1px 2px rgba(0,0,0,0.92), 0 0 4px rgba(0,0,0,0.75)';

/** Testo bianco nel pannello footer (abilità / bonus). */
const P4_FOOTER_WHITE_OUTLINE = '0 0 2px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)';

/**
 * Piastra footer “non attivo” — stesso formato delle evidenziazioni (gradiente orizzontale,
 * px-0, overflow, ombre), tinta ardesia invece di arancio/sky/smeraldo.
 * Nessuna animazione d’ingresso così non compete con highlight duello.
 */
const P4_FOOTER_INACTIVE_PANEL =
  'rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-slate-950/42 via-slate-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(148,163,184,0.11)] origin-bottom transform-gpu';

/** Barra nome armata (layout senza fascia HUD). */
const ARMY_BADGE_H = 24;
/** Barra più alta con fascia HUD: nome armata può andare a capo senza truncate. */
/** Barra armata + L + lega (HUD): compatta, valore lega stessa dimensione di L. */
const ARMY_BADGE_H_SASH = 22;
const P4_ARMY_BAR_LEAGUE_MARK_FONT = 12;

/** Fascia rune + nome + LEGA: spostamento verso l’alto rispetto al bordo carta (px). */
const SASH_TOP_PX = 4;

/** Layout POT/DAN ufficiale in gioco (prop `statLayout` omessa = questo valore). */
export const CARD_REWORK_P4_DEFAULT_STAT_LAYOUT = 'sashNameHud';

/** Tutti i layout POT/DAN supportati (prototipo + alternativi). */
export const CARD_REWORK_P4_STAT_LAYOUTS = [
  'sashNameHud',
  'sashNameHudStack',
  'center',
  'rails',
  'corners',
  'slimBar',
  'footerMerge',
];

const LAYOUTS_SASH_NAME_HUD = ['sashNameHud', 'sashNameHudStack'];

const RUNES = [
  'M -3 -3 L 3 -3 L 0 3 Z',
  'M -3 0 L 0 -3 L 3 0 L 0 3 Z',
  'M -3 -3 L 3 3 M -3 3 L 3 -3',
  'M -3 0 L 3 0 M 0 -3 L 0 3',
  'M -3 -2 L 3 -2 M -3 2 L 3 2',
  'M 0 -3 L 3 0 L 0 3 L -3 0 Z',
  'M -3 -3 L 3 -3 M 0 -3 L 0 3',
  'M -3 -3 L -3 3 L 3 0 Z',
  'M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0',
];

function hashNameToSeed(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i += 1) {
    seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
  }
  return seed;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function SashNameLabel({ name, accent, reserveTrailingPx = 0 }) {
  const wrapRef = useRef(null);
  const ref = useRef(null);
  const [maxW, setMaxW] = useState(198);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () => setMaxW(Math.max(72, el.clientWidth - 10 - reserveTrailingPx));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reserveTrailingPx]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maxH = 48;
    const minFs = 4.25;
    const maxFs = 11;

    const applyTracking = (fs) => {
      const em = Math.min(0.12, Math.max(0.04, 0.032 + fs * 0.008));
      el.style.letterSpacing = `${em}em`;
    };

    let low = minFs;
    let high = maxFs;
    let best = minFs;
    for (let i = 0; i < 32; i += 1) {
      if (high - low < 0.1) break;
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      applyTracking(mid);
      const fits = el.scrollWidth <= maxW + 0.5 && el.scrollHeight <= maxH + 0.5;
      if (fits) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    el.style.fontSize = `${best}px`;
    applyTracking(best);
  }, [name, maxW]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ padding: '1px 6px', paddingRight: 6 + reserveTrailingPx }}
    >
      <div
        ref={ref}
        style={{
          width: maxW,
          maxWidth: maxW,
          maxHeight: 48,
          boxSizing: 'border-box',
          color: '#f8fafc',
          fontFamily: GAME_CARD_UI_FONT,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: `${P4_SASH_NAME_OUTLINE}, 0 0 14px ${accent}99`,
          lineHeight: 1.12,
          textAlign: 'center',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {name}
      </div>
    </div>
  );
}

/**
 * Nome in fascia HUD: nessun truncate; font ridotto finché testo sta in (maxW × maxH)
 * con a capo (word-break), come SashNameLabel ma con altezza data dal contenitore.
 */
function SashHudNameFit({ name, accent, maxFontPx = 8, minFontPx = 4.25 }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const [box, setBox] = useState({ w: 80, h: 48 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      setBox({
        w: Math.max(36, el.clientWidth),
        h: Math.max(12, el.clientHeight),
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const maxW = box.w;
    const maxH = box.h;

    const applyTracking = (fs) => {
      const em = Math.min(0.12, Math.max(0.04, 0.032 + fs * 0.008));
      el.style.letterSpacing = `${em}em`;
    };

    let low = minFontPx;
    let high = maxFontPx;
    let best = minFontPx;
    for (let i = 0; i < 36; i += 1) {
      if (high - low < 0.08) break;
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      applyTracking(mid);
      const fits = el.scrollWidth <= maxW + 1 && el.scrollHeight <= maxH + 1;
      if (fits) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    el.style.fontSize = `${best}px`;
    applyTracking(best);
  }, [name, box.w, box.h, maxFontPx, minFontPx]);

  return (
    <div ref={wrapRef} className="flex h-full min-h-0 w-full min-w-0 items-center justify-center">
      <div
        ref={textRef}
        className="text-center font-extrabold uppercase"
        style={{
          width: box.w,
          maxWidth: box.w,
          maxHeight: box.h,
          boxSizing: 'border-box',
          color: '#f8fafc',
          fontFamily: GAME_CARD_UI_FONT,
          fontWeight: 800,
          fontSize: maxFontPx,
          letterSpacing: '0.08em',
          lineHeight: 1.12,
          textShadow: `${P4_SASH_NAME_OUTLINE}, 0 0 10px ${accent}77`,
          textAlign: 'center',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {name}
      </div>
    </div>
  );
}

function duelStatNumberColor(statKind, value, baseValue) {
  if (baseValue == null) return statKind === 'power' ? CARD_STAT_POWER : CARD_STAT_DAMAGE;
  if (statKind === 'power') {
    if (value > baseValue) return '#6ee7b7';
    if (value < baseValue) return '#f87171';
    return CARD_STAT_POWER;
  }
  if (value > baseValue) return '#67e8f9';
  if (value < baseValue) return '#fb923c';
  return CARD_STAT_DAMAGE;
}

/** Cerchio POT/DAN in fascia HUD; in duello fase ≥1: colore valore e pulse sul numero (nessun box ± accanto al POT). */
function SashHudStatCircle({
  label,
  value,
  borderColor,
  size = 38,
  showOperators = false,
  baseValue = null,
  statKind = 'power',
}) {
  const numSize = size >= 36 ? 16 : 13;
  const diff = baseValue != null && showOperators ? value - baseValue : 0;
  const numColor = duelStatNumberColor(statKind, value, baseValue);
  const pulse =
    showOperators && diff !== 0 ? (diff > 0 ? 'animate-number-increase' : 'animate-number-decrease') : '';

  return (
    <div className="relative flex flex-shrink-0 flex-col items-center justify-center pointer-events-none">
      <div
        className="flex flex-col items-center justify-center rounded-full text-center"
        style={{
          width: size,
          height: size,
          background: 'rgba(0,0,0,0.88)',
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 12px ${borderColor}aa`,
          fontFamily: GAME_CARD_UI_FONT,
        }}
      >
        <div style={{ fontSize: 6, color: borderColor, letterSpacing: '0.12em', fontWeight: 700 }}>{label}</div>
        <div
          className={pulse}
          style={{
            fontWeight: 800,
            fontSize: numSize,
            color: numColor,
            lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 2px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,1)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/** POT/DAN in cerchi ai lati del nome (nome sempre intero, a capo + font adattivo). */
function SashHudInlineRow({ agent, accent, showOperators, duelBasePower, duelBaseDamage }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-stretch justify-between gap-1 px-1.5 py-0.5"
      style={{ fontFamily: GAME_CARD_UI_FONT }}
    >
      <div className="flex flex-shrink-0 items-center pl-0.5">
        <SashHudStatCircle
          label="POT"
          value={agent.power}
          borderColor={CARD_STAT_POWER}
          size={38}
          showOperators={showOperators}
          baseValue={duelBasePower}
          statKind="power"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 justify-center px-0.5">
        <SashHudNameFit name={agent.name} accent={accent} maxFontPx={8} />
      </div>
      <div className="flex flex-shrink-0 items-center pr-0.5">
        <SashHudStatCircle
          label="DAN"
          value={agent.damage}
          borderColor={CARD_STAT_DAMAGE}
          size={38}
          showOperators={showOperators}
          baseValue={duelBaseDamage}
          statKind="damage"
        />
      </div>
    </div>
  );
}

/** Nome armata in barra: sempre intero (font + a capo), mai truncate. */
function P4ArmyBarNameFit({ name }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const [box, setBox] = useState({ w: 100, h: 26 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () =>
      setBox({
        w: Math.max(32, el.clientWidth),
        h: Math.max(14, el.clientHeight),
      });
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const maxW = box.w;
    const maxH = box.h;

    const applyTracking = (fs) => {
      const em = Math.min(0.14, Math.max(0.04, 0.028 + fs * 0.006));
      el.style.letterSpacing = `${em}em`;
    };

    let low = 5;
    let high = 11;
    let best = low;
    for (let i = 0; i < 40; i += 1) {
      if (high - low < 0.08) break;
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      applyTracking(mid);
      const fits = el.scrollWidth <= maxW + 1 && el.scrollHeight <= maxH + 1;
      if (fits) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    el.style.fontSize = `${best}px`;
    applyTracking(best);
  }, [name, box.w, box.h]);

  return (
    <div ref={wrapRef} className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-start">
      <div
        ref={textRef}
        className="font-bold uppercase tracking-wide"
        style={{
          width: box.w,
          maxWidth: box.w,
          maxHeight: box.h,
          boxSizing: 'border-box',
          color: '#fff',
          fontFamily: GAME_CARD_UI_FONT,
          fontWeight: 800,
          fontSize: 11,
          lineHeight: 1.08,
          textAlign: 'left',
          textShadow: P4_ARMY_BAR_WHITE_OUTLINE,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {name}
      </div>
    </div>
  );
}

/** Nome (anche su due righe se serve), sotto cerchi POT/DAN. */
function SashHudStackedRow({ agent, accent, showOperators, duelBasePower, duelBaseDamage }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-stretch justify-center px-6 py-0.5"
      style={{ fontFamily: GAME_CARD_UI_FONT }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col justify-end pb-0.5">
        <SashHudNameFit name={agent.name} accent={accent} maxFontPx={7} minFontPx={4} />
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-2 pt-0.5">
        <SashHudStatCircle
          label="POT"
          value={agent.power}
          borderColor={CARD_STAT_POWER}
          size={34}
          showOperators={showOperators}
          baseValue={duelBasePower}
          statKind="power"
        />
        <SashHudStatCircle
          label="DAN"
          value={agent.damage}
          borderColor={CARD_STAT_DAMAGE}
          size={34}
          showOperators={showOperators}
          baseValue={duelBaseDamage}
          statKind="damage"
        />
      </div>
    </div>
  );
}

function P4FloatingStats({ layout, agent }) {
  if (LAYOUTS_SASH_NAME_HUD.includes(layout)) return null;

  const labelMuted = {
    fontSize: 9,
    letterSpacing: '0.18em',
    color: CARD_LABEL_MUTED,
    fontWeight: 600,
    marginTop: 3,
  };
  const numGlow = {
    fontWeight: 800,
    lineHeight: 0.9,
    textShadow: '0 0 16px rgba(0,0,0,1), 0 2px 6px #000',
    fontVariantNumeric: 'tabular-nums',
  };

  if (layout === 'rails') {
    return (
      <>
        <div
          className="pointer-events-none absolute z-[2] flex flex-col items-center justify-center"
          style={{
            left: 0,
            top: 58,
            bottom: 112,
            width: 34,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            fontFamily: GAME_CARD_UI_FONT,
          }}
        >
          <div style={{ ...numGlow, fontSize: 26, color: CARD_STAT_POWER }}>{agent.power}</div>
          <div style={{ ...labelMuted, marginTop: 8, letterSpacing: '0.12em', fontSize: 8 }}>POT</div>
        </div>
        <div
          className="pointer-events-none absolute z-[2] flex flex-col items-center justify-center"
          style={{
            right: 0,
            top: 58,
            bottom: 112,
            width: 34,
            background: 'linear-gradient(270deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            fontFamily: GAME_CARD_UI_FONT,
          }}
        >
          <div style={{ ...numGlow, fontSize: 26, color: CARD_STAT_DAMAGE }}>{agent.damage}</div>
          <div style={{ ...labelMuted, marginTop: 8, letterSpacing: '0.12em', fontSize: 8 }}>DAN</div>
        </div>
      </>
    );
  }

  if (layout === 'corners') {
    return (
      <>
        <div
          className="pointer-events-none absolute z-[2] rounded-lg px-2 py-1.5"
          style={{
            left: 8,
            top: 58,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.14)',
            fontFamily: GAME_CARD_UI_FONT,
          }}
        >
          <div style={{ ...numGlow, fontSize: 22, color: CARD_STAT_POWER }}>{agent.power}</div>
          <div style={{ fontSize: 7, letterSpacing: '0.15em', color: CARD_LABEL_MUTED, fontWeight: 700 }}>POT</div>
        </div>
        <div
          className="pointer-events-none absolute z-[2] rounded-lg px-2 py-1.5 text-right"
          style={{
            right: 8,
            top: 58,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.14)',
            fontFamily: GAME_CARD_UI_FONT,
          }}
        >
          <div style={{ ...numGlow, fontSize: 22, color: CARD_STAT_DAMAGE }}>{agent.damage}</div>
          <div style={{ fontSize: 7, letterSpacing: '0.15em', color: CARD_LABEL_MUTED, fontWeight: 700 }}>DAN</div>
        </div>
      </>
    );
  }

  if (layout === 'slimBar') {
    return (
      <div
        className="pointer-events-none absolute left-0 right-0 z-[2] flex items-center justify-between px-3"
        style={{
          bottom: 102,
          height: 30,
          marginLeft: 8,
          marginRight: 8,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.58)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: GAME_CARD_UI_FONT,
        }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 8, fontWeight: 700, color: CARD_LABEL_MUTED, letterSpacing: '0.14em' }}>POT</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: CARD_STAT_POWER, textShadow: '0 1px 10px #000' }}>{agent.power}</span>
        </div>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.14)' }} />
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 8, fontWeight: 700, color: CARD_LABEL_MUTED, letterSpacing: '0.14em' }}>DAN</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: CARD_STAT_DAMAGE, textShadow: '0 1px 10px #000' }}>{agent.damage}</span>
        </div>
      </div>
    );
  }

  /* center — alternativa a fascia HUD */
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 flex justify-around items-center px-3.5"
      style={{ bottom: 112, zIndex: 2, fontFamily: GAME_CARD_UI_FONT }}
    >
      <div className="text-center">
        <div style={{ ...numGlow, fontSize: 46, color: CARD_STAT_POWER }}>{agent.power}</div>
        <div style={labelMuted}>POTENZA</div>
      </div>
      <div className="text-center">
        <div style={{ ...numGlow, fontSize: 46, color: CARD_STAT_DAMAGE }}>{agent.damage}</div>
        <div style={labelMuted}>DANNO</div>
      </div>
    </div>
  );
}

export function CardReworkP4({
  agent,
  positioningOverride,
  statLayout = CARD_REWORK_P4_DEFAULT_STAT_LAYOUT,
  duelBasePower = null,
  duelBaseDamage = null,
  showBonus = false,
  abilityBlocked = false,
  bonusBlocked = false,
  showOperators = false,
  highlightAbility = false,
  highlightBonus = false,
  copiedAbility = null,
  copiedBonus = null,
  abilityNotTriggered = false,
  bonusNotTriggered = false,
  bonusBaseInactive = false,
  abilityCurrentValue = null,
  suppressAnimations = false,
}) {
  const colors = ARMY_COLORS[agent.army] || { accent: '#94a3b8' };
  const accent = colors.accent;
  const armyBonus = ARMY_BONUSES[agent.army];
  const spriteInfo = getCardSprite(agent);
  const basePositioning = getImagePositioning(agent.id, agent.army);
  const positioning = positioningOverride ? { ...basePositioning, ...positioningOverride } : basePositioning;
  const objectPosition = positioning.objectPosition || 'center center';
  const imageScalePercent = positioning.scale ?? 100;
  const containerLeft = positioning.containerLeft;
  const containerTop = positioning.containerTop;

  const gradId = `p4-rg-${agent.id}`;

  const { topR, botR } = useMemo(() => {
    const rand = makeRng(hashNameToSeed(`${agent.id}::${agent.name}`));
    const pick = () => Math.floor(rand() * RUNES.length);
    return {
      topR: Array.from({ length: 15 }, pick),
      botR: Array.from({ length: 15 }, pick),
    };
  }, [agent.id, agent.name]);

  const resolvedStatLayout = CARD_REWORK_P4_STAT_LAYOUTS.includes(statLayout)
    ? statLayout
    : CARD_REWORK_P4_DEFAULT_STAT_LAYOUT;
  const sashNameHud = LAYOUTS_SASH_NAME_HUD.includes(resolvedStatLayout);
  const leagueTierColor = leagueTierColorHex(agent.league);
  const armyBarHeight = sashNameHud ? ARMY_BADGE_H_SASH : ARMY_BADGE_H;

  const powerDiff = duelBasePower != null ? agent.power - duelBasePower : 0;
  const damageDiff = duelBaseDamage != null ? agent.damage - duelBaseDamage : 0;

  const COUNT = 15;
  const STEP = 220 / (COUNT + 1);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: 230,
        height: 330,
        background: '#0a0a0d',
        border: `2px solid ${CARD_BORDER_DEFAULT}`,
        borderRadius: '0 0 14px 14px',
        boxShadow: `0 0 0 1px ${accent}35, 0 0 22px ${accent}2a, 0 6px 20px rgba(0,0,0,0.85)`,
        fontFamily: GAME_CARD_UI_FONT,
      }}
    >
      {/* Stesso ritaglio/posizione della carta classica: CardImage + contain (non cover) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <CardImage
          type={spriteInfo.type}
          palette={spriteInfo.palette}
          agentId={spriteInfo.agentId}
          size={260}
          objectPosition={objectPosition}
          scale={imageScalePercent}
          containerLeft={containerLeft}
          containerTop={containerTop}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 100%)',
        }}
      />

      {/* Fascia: ufficiale sashNameHud = cerchi POT/DAN + nome; classico = nome + cerchio LEGA a destra */}
      <div className="pointer-events-none absolute left-0 right-0 z-[4]" style={{ top: SASH_TOP_PX }}>
        <div className="relative h-[52px] w-full">
          <svg
            width="100%"
            height={52}
            viewBox="0 0 220 52"
            preserveAspectRatio="none"
            style={{ display: 'block', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.75))' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
                <stop offset="20%" stopColor={accent} />
                <stop offset="80%" stopColor={accent} />
                <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <rect x="0" y="15" width="220" height="22" fill={`url(#${gradId})`} />
            <line x1="0" y1="14" x2="220" y2="14" stroke={accent} strokeWidth="0.8" />
            <line x1="0" y1="38" x2="220" y2="38" stroke={accent} strokeWidth="0.8" />
            {topR.map((idx, i) => (
              <g key={`tg-${i}`} transform={`translate(${STEP * (i + 1)} 7)`}>
                <path d={RUNES[idx]} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.9" />
              </g>
            ))}
            {botR.map((idx, i) => (
              <g key={`bg-${i}`} transform={`translate(${STEP * (i + 1)} 45)`}>
                <path d={RUNES[idx]} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.9" />
              </g>
            ))}
            <rect x="0" y="24" width="220" height="2" fill="rgba(248,250,252,0.2)" />
          </svg>
          {sashNameHud ? (
            resolvedStatLayout === 'sashNameHudStack' ? (
              <SashHudStackedRow
                agent={agent}
                accent={accent}
                showOperators={showOperators}
                duelBasePower={duelBasePower}
                duelBaseDamage={duelBaseDamage}
              />
            ) : (
              <SashHudInlineRow
                agent={agent}
                accent={accent}
                showOperators={showOperators}
                duelBasePower={duelBasePower}
                duelBaseDamage={duelBaseDamage}
              />
            )
          ) : (
            <>
              <SashNameLabel name={agent.name} accent={accent} reserveTrailingPx={46} />
              <div
                className="absolute top-1/2 flex -translate-y-1/2 flex-col items-center justify-center rounded-full text-center pointer-events-none"
                style={{
                  right: 10,
                  width: 38,
                  height: 38,
                  background: 'rgba(0,0,0,0.88)',
                  border: `2px solid ${accent}`,
                  boxShadow: `0 0 12px ${accent}aa`,
                  fontFamily: GAME_CARD_UI_FONT,
                }}
              >
                <div style={{ fontSize: 6, color: accent, letterSpacing: '0.12em', fontWeight: 700 }}>LEGA</div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#fff',
                    lineHeight: 0.9,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {agent.league}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {resolvedStatLayout !== 'footerMerge' && (
        <P4FloatingStats layout={resolvedStatLayout} agent={agent} />
      )}

      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: armyBarHeight,
          zIndex: 2,
          background: CARD_FOOTER_PANEL_BG,
          backdropFilter: 'blur(4px)',
          padding: '8px 10px 8px',
          fontFamily: GAME_CARD_UI_FONT,
          borderTop: `1px solid ${CARD_FOOTER_DIVIDER}`,
          boxShadow: `inset 0 1px 0 ${accent}28`,
        }}
      >
        {resolvedStatLayout === 'footerMerge' && (
          <div
            className="flex justify-between items-center gap-3 pb-2 mb-2"
            style={{ borderBottom: `1px solid ${CARD_FOOTER_DIVIDER}` }}
          >
            <div className="relative flex items-baseline gap-2 min-w-0">
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', color: CARD_LABEL_MUTED }}>POT</span>
              <span
                className={
                  showOperators && powerDiff !== 0 && !suppressAnimations
                    ? powerDiff > 0
                      ? 'animate-number-increase'
                      : 'animate-number-decrease'
                    : ''
                }
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: duelStatNumberColor('power', agent.power, duelBasePower),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {agent.power}
              </span>
            </div>
            <div className="relative flex items-baseline gap-2 min-w-0 text-right">
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', color: CARD_LABEL_MUTED }}>DAN</span>
              <span
                className={
                  showOperators && damageDiff !== 0 && !suppressAnimations
                    ? damageDiff > 0
                      ? 'animate-number-increase'
                      : 'animate-number-decrease'
                    : ''
                }
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: duelStatNumberColor('damage', agent.damage, duelBaseDamage),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {agent.damage}
              </span>
            </div>
          </div>
        )}
        <div
          className={`relative mb-0 transition-[opacity,background-color,box-shadow] duration-300 ${
            abilityBlocked ? 'opacity-60' : ''
          } ${
            copiedAbility
              ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-emerald-950/40 via-emerald-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(52,211,153,0.09)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-copy-panel'}`
              : abilityBlocked
                ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-red-950/42 via-red-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.11),0_8px_20px_-12px_rgba(0,0,0,0.14),0_0_22px_-8px_rgba(248,113,113,0.1)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-highlight-panel'}`
                : abilityNotTriggered
                  ? P4_FOOTER_INACTIVE_PANEL
                  : highlightAbility
                    ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-orange-950/40 via-orange-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(251,146,60,0.09)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-highlight-panel'}`
                    : 'rounded px-1.5 py-1'
          }`}
        >
          <div className="flex justify-between items-baseline gap-2">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 flex-shrink-0 ${
                copiedAbility
                  ? 'text-green-300'
                  : abilityBlocked
                    ? 'text-red-400'
                    : abilityNotTriggered
                      ? 'text-slate-500'
                      : highlightAbility
                        ? 'text-orange-300'
                        : ''
              }`}
              style={{
                letterSpacing: '0.1em',
                color:
                  copiedAbility || abilityBlocked || abilityNotTriggered || highlightAbility
                    ? undefined
                    : CARD_ABILITY_LABEL,
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 3,
              }}
            >
              {copiedAbility && <Icon name="copy" type="cardIcon" size={10} color="#86efac" />}
              {!copiedAbility && (
                <span
                  className="inline-flex shrink-0 items-center justify-center"
                  style={{ width: 12, height: 12, fontSize: 11, lineHeight: 1 }}
                  aria-hidden
                >
                  ★
                </span>
              )}
              <span className="whitespace-nowrap" style={{ fontSize: 8, letterSpacing: '0.06em' }}>
                POTERE
              </span>
            </span>
            <span
              className={`text-[11px] font-semibold text-right leading-snug ${
                copiedAbility
                  ? 'text-green-200'
                  : abilityBlocked
                    ? 'text-red-300 line-through'
                    : abilityNotTriggered
                      ? 'text-slate-500'
                      : highlightAbility
                        ? 'text-orange-200'
                        : 'text-white'
              }`}
              style={{
                textShadow: abilityNotTriggered ? undefined : P4_FOOTER_WHITE_OUTLINE,
              }}
            >
              <AbilityFormatted
                ability={copiedAbility || agent.ability}
                minClassName={
                  !copiedAbility && abilityNotTriggered ? FOOTER_MUTED_MIN_CLASS : DEFAULT_MIN_CLASS
                }
                options={
                  copiedAbility
                    ? {}
                    : abilityCurrentValue != null
                      ? { currentValue: abilityCurrentValue }
                      : {}
                }
              />
            </span>
          </div>
          {abilityBlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Icon name="block" type="cardIcon" size={24} color="#ef4444" className="opacity-30" style={{ transform: 'rotate(-15deg)' }} />
            </div>
          )}
        </div>
        <div style={{ height: 1, background: CARD_FOOTER_DIVIDER, margin: '5px 0' }} />
        <div
          className={`relative transition-[opacity,background-color,box-shadow] duration-300 border-t border-transparent ${
            copiedBonus
              ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-emerald-950/40 via-emerald-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(52,211,153,0.09)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-copy-panel-stagger'}`
              : bonusBlocked
                ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-red-950/42 via-red-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.11),0_8px_20px_-12px_rgba(0,0,0,0.14),0_0_22px_-8px_rgba(248,113,113,0.1)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-highlight-panel-stagger'}`
                : bonusNotTriggered || bonusBaseInactive
                  ? P4_FOOTER_INACTIVE_PANEL
                  : highlightBonus && !copiedBonus
                    ? `rounded px-0 py-1 overflow-hidden bg-gradient-to-r from-sky-950/40 via-sky-900/12 to-transparent shadow-[inset_0_-12px_20px_-10px_rgba(0,0,0,0.1),0_8px_20px_-12px_rgba(0,0,0,0.12),0_0_22px_-8px_rgba(56,189,248,0.09)] origin-bottom transform-gpu ${suppressAnimations ? '' : 'animate-modifier-highlight-panel-stagger'}`
                    : showBonus && !bonusBlocked
                      ? 'rounded px-1.5 py-1 bg-sky-500/8'
                      : 'rounded px-1.5 py-1'
          } ${bonusBlocked ? 'opacity-60' : ''}`}
        >
          <div className="flex justify-between items-baseline gap-2">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 flex-shrink-0 ${
                copiedBonus
                  ? 'text-green-300'
                  : bonusBlocked
                    ? 'text-red-400'
                    : bonusNotTriggered || bonusBaseInactive
                      ? 'text-slate-500'
                      : highlightBonus
                        ? 'text-sky-300'
                        : ''
              }`}
              style={{
                letterSpacing: '0.1em',
                color:
                  copiedBonus || bonusBlocked || bonusNotTriggered || bonusBaseInactive || highlightBonus
                    ? undefined
                    : CARD_BONUS_LABEL,
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 3,
              }}
            >
              <span
                className="inline-flex shrink-0 items-center justify-center"
                style={{ width: 12, height: 12, fontSize: 11, lineHeight: 1 }}
                aria-hidden
              >
                ✠
              </span>
              <span className="whitespace-nowrap" style={{ fontSize: 8, letterSpacing: '0.06em' }}>
                BONUS
              </span>
            </span>
            <span
              className={`text-[11px] font-semibold text-right leading-snug ${
                copiedBonus
                  ? 'text-green-200'
                  : bonusBlocked
                    ? 'text-red-300 line-through'
                    : bonusNotTriggered || bonusBaseInactive
                      ? 'text-slate-500'
                      : highlightBonus
                        ? 'text-sky-200'
                        : 'text-white'
              }`}
              style={{
                textShadow:
                  bonusNotTriggered || bonusBaseInactive ? undefined : P4_FOOTER_WHITE_OUTLINE,
              }}
            >
              {copiedBonus || !(bonusBaseInactive && armyBonus) ? (
                <BonusFormattedFromString
                  text={copiedBonus ? copiedBonus.description : armyBonus?.description || '—'}
                  minClassName={
                    copiedBonus
                      ? DEFAULT_MIN_CLASS
                      : bonusNotTriggered || bonusBaseInactive
                        ? FOOTER_MUTED_MIN_CLASS
                        : DEFAULT_MIN_CLASS
                  }
                />
              ) : (
                <span className="inline-block">Bonus non attivo</span>
              )}
            </span>
          </div>
          {bonusBlocked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Icon name="block" type="cardIcon" size={24} color="#ef4444" className="opacity-30" style={{ transform: 'rotate(-15deg)' }} />
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none font-bold uppercase tracking-wide"
        style={{
          zIndex: 3,
          height: armyBarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          paddingLeft: sashNameHud ? 6 : 0,
          paddingRight: sashNameHud ? 6 : 0,
          color: '#fff',
          backgroundColor: `${accent}99`,
          fontFamily: GAME_CARD_UI_FONT,
          borderRadius: '0 0 11px 11px',
        }}
      >
        {sashNameHud ? (
          <div
            className="flex h-full min-h-0 w-full min-w-0 max-w-full items-baseline"
            style={{ gap: 12, lineHeight: 1 }}
          >
            <P4ArmyBarNameFit name={agent.army} />
            <div
              className="flex flex-shrink-0 items-baseline"
              style={{ gap: 4, lineHeight: 1, marginTop: 2 }}
              aria-label={`Lega ${agent.league}`}
            >
              <span
                style={{
                  fontSize: P4_ARMY_BAR_LEAGUE_MARK_FONT,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: leagueTierColor,
                  lineHeight: 1,
                  textShadow: P4_LEAGUE_COLORED_OUTLINE,
                }}
              >
                L
              </span>
              <span
                style={{
                  fontSize: P4_ARMY_BAR_LEAGUE_MARK_FONT,
                  fontWeight: 800,
                  color: leagueTierColor,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                  textShadow: P4_LEAGUE_COLORED_OUTLINE,
                }}
              >
                {agent.league}
              </span>
            </div>
          </div>
        ) : (
          <span
            className="font-bold tracking-wide"
            style={{ fontSize: 9, color: '#fff', textShadow: P4_ARMY_BAR_WHITE_OUTLINE }}
          >
            {agent.army}
          </span>
        )}
      </div>
    </div>
  );
}

/** CardReworkP4 ridimensionata (rapporto 230×330). Utile per liste e anteprime compatte. */
export function CardReworkP4Scaled({ agent, width = 176, ...p4rest }) {
  const scale = width / 230;
  const height = Math.round(330 * scale);
  return (
    <div className="overflow-hidden" style={{ width, height }}>
      <div style={{ width: 230, height: 330, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <CardReworkP4 agent={agent} {...p4rest} />
      </div>
    </div>
  );
}
