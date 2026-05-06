import React from 'react';
import { CAMPAIGN_UI, CAMPAIGN_FONTS, pressureBarColor } from '../../campaign/campaignTheme.js';

function seededRand(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) / 2147483647;
}

/**
 * @param {{
 *   rows: { id: string, enemyName: string, pressure: number, isMandatory: boolean }[],
 *   selectedId: string | null,
 *   hqIntegrity: number,
 *   onSelect: (row: { id: string, enemyName: string, pressure: number, isMandatory: boolean }) => void,
 * }} props
 */
export function CampaignTacticalMap({ rows, selectedId, hqIntegrity, onSelect }) {
  const W = 290;
  const H = 400;
  const hqX = W / 2;
  const hqY = H / 2;
  const hqR = 18;

  const hqCol =
    hqIntegrity > 60 ? CAMPAIGN_UI.greenLit : hqIntegrity > 30 ? CAMPAIGN_UI.amberLit : CAMPAIGN_UI.redLit;

  const slots = rows.map((f, i) => {
    const r1 = seededRand(f.id + 'x');
    const baseAngle = (i / Math.max(rows.length, 1)) * Math.PI * 2 + Math.PI * 0.1;
    const angleFuzz = (r1 - 0.5) * 0.6;
    const angle = baseAngle + angleFuzz;
    const minDist = 60;
    const maxDist = 140;
    const dist = maxDist - (f.pressure / 100) * (maxDist - minDist);
    const x = hqX + Math.cos(angle) * dist;
    const y = hqY + Math.sin(angle) * dist;
    return { f, x: Math.max(20, Math.min(W - 20, x)), y: Math.max(20, Math.min(H - 20, y)) };
  });

  return (
    <div
      style={{
        background: CAMPAIGN_UI.panelBg,
        border: `1px solid ${CAMPAIGN_UI.border}`,
        borderLeft: `3px solid ${CAMPAIGN_UI.violetDim}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginRight: 20,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          color: CAMPAIGN_UI.textMuted,
          padding: '12px 14px 8px',
          flexShrink: 0,
          fontFamily: CAMPAIGN_FONTS.ui,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        Fronte di guerra
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%' }}>
        {[0.35, 0.65, 0.9].map((t) => (
          <circle
            key={t}
            cx={hqX}
            cy={hqY}
            r={t * (Math.min(W, H) / 2 - 10)}
            fill="none"
            stroke={CAMPAIGN_UI.border}
            strokeWidth={0.5}
            strokeDasharray="3 5"
          />
        ))}

        {slots.map(({ f, x, y }) => {
          const pc = pressureBarColor(f.pressure);
          const sel = selectedId === f.id;
          const dx = hqX - x;
          const dy = hqY - y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ex = hqX - (dx / len) * (hqR + 2);
          const ey = hqY - (dy / len) * (hqR + 2);
          return (
            <line
              key={`${f.id}_line`}
              x1={x}
              y1={y}
              x2={ex}
              y2={ey}
              stroke={sel ? pc : CAMPAIGN_UI.textMuted}
              strokeWidth={sel ? 1.5 : 0.5}
              strokeDasharray={f.pressure > 75 ? '0' : '4 3'}
              opacity={sel ? 1 : 0.35}
            />
          );
        })}

        <circle cx={hqX} cy={hqY} r={hqR} fill={CAMPAIGN_UI.panelBg2} stroke={hqCol} strokeWidth={2} />
        <text
          x={hqX}
          y={hqY + 4}
          textAnchor="middle"
          fill={hqCol}
          fontSize={9}
          fontFamily={CAMPAIGN_FONTS.mono}
          letterSpacing="0.1em"
        >
          HQ
        </text>

        {(() => {
          const r = hqR + 5;
          const pct = hqIntegrity / 100;
          const ang = pct * Math.PI * 2 - Math.PI / 2;
          const x2 = hqX + r * Math.cos(ang);
          const y2 = hqY + r * Math.sin(ang);
          const lg = pct > 0.5 ? 1 : 0;
          if (pct <= 0) return null;
          if (pct >= 1) {
            return (
              <circle cx={hqX} cy={hqY} r={r} fill="none" stroke={hqCol} strokeWidth={1.5} opacity={0.5} />
            );
          }
          return (
            <path
              d={`M ${hqX} ${hqY - r} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2}`}
              fill="none"
              stroke={hqCol}
              strokeWidth={1.5}
              opacity={0.5}
            />
          );
        })()}

        {slots.map(({ f, x, y }) => {
          const pc = pressureBarColor(f.pressure);
          const sel = selectedId === f.id;
          const r = sel ? 10 : 8;
          const labelY = y < hqY ? y - r - 14 : y + r + 10;
          const pressY = y < hqY ? y - r - 5 : y + r + 19;
          return (
            <g key={f.id} onClick={() => onSelect(f)} style={{ cursor: 'pointer' }}>
              {sel && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={pc} strokeWidth={1} opacity={0.3} />
              )}
              {f.isMandatory && (
                <circle
                  cx={x}
                  cy={y}
                  r={r + 4}
                  fill="none"
                  stroke={CAMPAIGN_UI.redLit}
                  strokeWidth={1}
                  opacity={0.7}
                  strokeDasharray="2 2"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={sel ? `${pc}30` : CAMPAIGN_UI.panelBg2}
                stroke={pc}
                strokeWidth={sel ? 2 : 1}
              />
              <circle cx={x} cy={y} r={3} fill={pc} opacity={0.9} />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fill={sel ? CAMPAIGN_UI.textPri : CAMPAIGN_UI.textSec}
                fontSize={8}
                fontFamily={CAMPAIGN_FONTS.ui}
                fontWeight={sel ? '600' : '400'}
                letterSpacing="0.04em"
              >
                {f.enemyName.toUpperCase().slice(0, 6)}
              </text>
              <text x={x} y={pressY} textAnchor="middle" fill={pc} fontSize={7} fontFamily={CAMPAIGN_FONTS.mono}>
                {f.pressure}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
