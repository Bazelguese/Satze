import React from 'react';
import { CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';

const labelStyle = (color = CAMPAIGN_UI.textMuted) => ({
  fontSize: 10,
  letterSpacing: '0.14em',
  color,
  fontFamily: CAMPAIGN_FONTS.ui,
  fontWeight: 600,
  textTransform: 'uppercase',
});

/**
 * @param {{
 *   day: number,
 *   hqIntegrity: number,
 *   armyName?: string,
 *   deckSize?: number | null,
 *   leagueUsed?: number | null,
 * }} props
 */
export function CampaignTopHUD({ day, hqIntegrity, armyName, deckSize, leagueUsed }) {
  const hqCol =
    hqIntegrity > 60 ? CAMPAIGN_UI.greenLit : hqIntegrity > 30 ? CAMPAIGN_UI.amberLit : CAMPAIGN_UI.redLit;
  const deckStr = deckSize == null ? '—' : `${deckSize}/10`;
  const leagueStr = leagueUsed == null ? '—' : `${leagueUsed}/30`;
  const leagueCol = typeof leagueUsed === 'number' && leagueUsed > 26 ? CAMPAIGN_UI.amberLit : CAMPAIGN_UI.textPri;

  return (
    <div
      style={{
        background: CAMPAIGN_UI.panelBg,
        borderBottom: `1px solid ${CAMPAIGN_UI.border}`,
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        fontFamily: CAMPAIGN_FONTS.ui,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 7,
            height: 7,
            background: CAMPAIGN_UI.violet,
            transform: 'rotate(45deg)',
          }}
        />
        <span
          style={{
            fontWeight: 700,
            letterSpacing: '0.22em',
            fontSize: 15,
            color: CAMPAIGN_UI.violetLit,
          }}
        >
          SATZE
        </span>
      </div>

      <div style={{ width: 1, height: 18, background: CAMPAIGN_UI.border }} />

      <span style={{ fontSize: 12, color: CAMPAIGN_UI.textSec, letterSpacing: '0.06em' }}>
        {armyName || 'Campagna'}
      </span>

      <div style={{ flex: 1 }} />

      {[
        { lbl: 'Giorno', val: String(day ?? 1), col: CAMPAIGN_UI.textPri },
        { lbl: 'Esercito', val: deckStr, col: CAMPAIGN_UI.violetLit },
        { lbl: 'Lega', val: leagueStr, col: leagueCol },
      ].map(({ lbl, val, col }) => (
        <div key={lbl} style={{ textAlign: 'center' }}>
          <div style={labelStyle()}>{lbl}</div>
          <div style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 15, color: col, marginTop: 2 }}>{val}</div>
        </div>
      ))}

      <div style={{ width: 1, height: 18, background: CAMPAIGN_UI.border }} />

      <div>
        <div style={{ ...labelStyle(), marginBottom: 4 }}>HQ / Sede</div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 8,
                background: i < Math.ceil(hqIntegrity / 10) ? hqCol : CAMPAIGN_UI.border,
              }}
            />
          ))}
          <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 11, color: hqCol, marginLeft: 6 }}>
            {hqIntegrity}%
          </span>
        </div>
      </div>
    </div>
  );
}
