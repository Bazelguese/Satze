import React from 'react';
import { CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';

/**
 * @param {{ event: Object, onChoice: (choice: Object) => void }} props
 */
export function CampaignNarrativeInterlude({ event, onChoice }) {
  if (!event) return null;
  const anomaly = event.isAnomaly;
  const accent = anomaly ? CAMPAIGN_UI.redLit : CAMPAIGN_UI.violetLit;

  return (
    <div style={{ fontFamily: CAMPAIGN_FONTS.ui, marginBottom: 24 }}>
      <div
        style={{
          background: anomaly ? '#100606' : CAMPAIGN_UI.panelBg,
          border: `1px solid ${anomaly ? '#2a0808' : CAMPAIGN_UI.border}`,
          borderTop: `3px solid ${accent}`,
          padding: '20px 24px',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accent, marginBottom: 10 }}>
          {anomaly ? '◈  ANOMALIA  ◈' : 'EVENTO NARRATIVO'}
        </div>
        <div
          style={{
            fontSize: anomaly ? 18 : 20,
            fontWeight: 700,
            color: anomaly ? CAMPAIGN_UI.redLit : CAMPAIGN_UI.textPri,
            marginBottom: 14,
            fontStyle: anomaly ? 'italic' : 'normal',
          }}
        >
          {event.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {event.body.map((line, i) => (
            <p key={i} style={{ fontSize: 14, color: CAMPAIGN_UI.textSec, lineHeight: 1.75, margin: 0 }}>
              {line}
            </p>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {event.choices.map((choice) => (
          <button
            key={choice.key}
            type="button"
            onClick={() => onChoice(choice)}
            style={{
              fontFamily: CAMPAIGN_FONTS.ui,
              fontWeight: 600,
              fontSize: 13,
              padding: '12px 16px',
              textAlign: 'left',
              color: accent,
              background: `${accent}12`,
              border: `1px solid ${accent}44`,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>{choice.label}</span>
            <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 10, color: CAMPAIGN_UI.textMuted }}>
              {choice.effectLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
