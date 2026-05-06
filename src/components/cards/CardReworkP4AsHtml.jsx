// P4 come Documentazione/Rework Carte/card-layouts.html (CardC2AP4), stessa struttura del mock.
// Tipografia: Chakra Petch come il client (index-graphics-prova.css). Numeri POT/DAN: #fde047 / #c084fc.

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { ARMY_COLORS, ARMY_BONUSES } from '../../data';
import { formatAbilityHelper, getCardSprite, splitAbilityMinSuffix } from '../../utils';
import { getImagePositioning } from '../../data/imagePositioning';
import { CardImage } from './CardImage';

const GAME_CARD_UI_FONT = "'Chakra Petch', 'Segoe UI', system-ui, sans-serif";

const CARD_STAT_POWER = '#fde047';
const CARD_STAT_DAMAGE = '#c084fc';

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

/** Nome sulla fascia — adattamento al box (mock usa nowrap 12px; qui fit senza uscire). */
function SashNameLabelHtml({ name, accent }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maxW = 204;
    const maxH = 48;
    const minFs = 4.25;
    const maxFs = 12;

    const applyTracking = (fs) => {
      const em = Math.min(0.2, Math.max(0.06, 0.05 + fs * 0.012));
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
  }, [name]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ padding: '1px 8px' }}
    >
      <div
        ref={ref}
        style={{
          width: 204,
          maxWidth: 204,
          maxHeight: 48,
          boxSizing: 'border-box',
          color: '#0a0a0d',
          fontFamily: GAME_CARD_UI_FONT,
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textShadow: `0 0 8px ${accent}, 0 1px 0 rgba(255,255,255,0.25)`,
          lineHeight: 1.05,
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

export function CardReworkP4AsHtml({ agent }) {
  const colors = ARMY_COLORS[agent.army] || { accent: '#94a3b8' };
  const accent = colors.accent;
  const armyBonus = ARMY_BONUSES[agent.army];
  const spriteInfo = getCardSprite(agent);
  const positioning = getImagePositioning(agent.id, agent.army);
  const objectPosition = positioning.objectPosition || 'center center';
  const imageScalePercent = positioning.scale ?? 100;
  const containerLeft = positioning.containerLeft;
  const containerTop = positioning.containerTop;

  const gradId = `p4html-rg-${agent.id}`;

  const { topR, botR } = useMemo(() => {
    // Come nel mock: seed solo dal nome
    const rand = makeRng(hashNameToSeed(agent.name));
    const pick = () => Math.floor(rand() * RUNES.length);
    return {
      topR: Array.from({ length: 15 }, pick),
      botR: Array.from({ length: 15 }, pick),
    };
  }, [agent.name]);

  const COUNT = 15;
  const STEP = 220 / (COUNT + 1);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: 230,
        height: 330,
        background: '#0a0a0d',
        border: `1.5px solid ${accent}`,
        borderRadius: '0 0 14px 14px',
        boxShadow: `0 0 14px ${accent}66, 0 4px 16px rgba(0,0,0,.9)`,
        fontFamily: GAME_CARD_UI_FONT,
      }}
    >
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

      <div
        className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
        style={{
          top: 8,
          right: 12,
          zIndex: 4,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.85)',
          border: `2px solid ${accent}`,
          boxShadow: `0 0 10px ${accent}aa`,
        }}
      >
        <div style={{ fontSize: 6, color: accent, letterSpacing: '0.1em', fontWeight: 700 }}>LEGA</div>
        <div
          style={{
            fontFamily: GAME_CARD_UI_FONT,
            fontWeight: 800,
            fontSize: 17,
            color: '#fff',
            lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {agent.league}
        </div>
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          top: 26,
          left: -26,
          transform: 'rotate(-22deg)',
          transformOrigin: 'left center',
          zIndex: 3,
        }}
      >
        <div
          className="absolute"
          style={{
            inset: '-8px -10px',
            background: accent,
            opacity: 0.32,
            filter: 'blur(14px)',
          }}
        />
        <svg
          width="220"
          height="52"
          viewBox="0 0 220 52"
          style={{ position: 'relative', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.85))' }}
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
          <rect x="0" y="24" width="220" height="2" fill="rgba(255,255,255,0.25)" />
        </svg>
        <SashNameLabelHtml name={agent.name} accent={accent} />
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 flex justify-around items-center"
        style={{
          bottom: 96,
          zIndex: 2,
          padding: '0 14px',
          fontFamily: GAME_CARD_UI_FONT,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: GAME_CARD_UI_FONT,
              fontWeight: 800,
              fontSize: 46,
              color: CARD_STAT_POWER,
              lineHeight: 0.9,
              textShadow: '0 0 16px rgba(0,0,0,1), 0 2px 6px #000',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {agent.power}
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: '#cbd5e1',
              fontWeight: 600,
              marginTop: 3,
              fontFamily: GAME_CARD_UI_FONT,
            }}
          >
            POTENZA
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: GAME_CARD_UI_FONT,
              fontWeight: 800,
              fontSize: 46,
              color: CARD_STAT_DAMAGE,
              lineHeight: 0.9,
              textShadow: '0 0 16px rgba(0,0,0,1), 0 2px 6px #000',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {agent.damage}
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: '#cbd5e1',
              fontWeight: 600,
              marginTop: 3,
              fontFamily: GAME_CARD_UI_FONT,
            }}
          >
            DANNO
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: `linear-gradient(180deg, ${accent}dd 0%, ${accent} 100%)`,
          color: '#0a0a0d',
          padding: '8px 12px 10px',
          borderRadius: '0 0 14px 14px',
          fontFamily: GAME_CARD_UI_FONT,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: '0.15em',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 10, lineHeight: 1 }} aria-hidden>
              ★
            </span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>POTERE</span>
          </span>
          <span style={{ fontWeight: 700, fontSize: 11 }}>
            {(() => {
              const { base, minSuffix } = splitAbilityMinSuffix(formatAbilityHelper(agent.ability));
              return (
                <>
                  {base}
                  {minSuffix ? (
                    <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.95 }}>{minSuffix}</span>
                  ) : null}
                </>
              );
            })()}
          </span>
        </div>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.3)', margin: '4px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: '0.15em',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 10, lineHeight: 1 }} aria-hidden>
              ✠
            </span>
            <span style={{ fontSize: 8, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>BONUS</span>
          </span>
          <span style={{ fontWeight: 700, fontSize: 11 }}>
            {(() => {
              const raw = armyBonus?.description || '—';
              const { base, minSuffix } = splitAbilityMinSuffix(raw);
              return (
                <>
                  {base}
                  {minSuffix ? (
                    <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.95 }}>{minSuffix}</span>
                  ) : null}
                </>
              );
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
