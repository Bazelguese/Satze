import React, { useState, useMemo } from 'react';
import { CAMPAIGN_MISSION_KIND_LABELS } from '../../game/campaign/campaignMissionKinds.js';
import { getMissionDisplayPressure, isMissionMandatory } from '../../game/campaign/campaignMissionDisplay.js';
import {
  CAMPAIGN_UI,
  CAMPAIGN_FONTS,
  missionKindColor,
  pressureBarColor,
  MISSION_KIND_TAGS,
  rewardProfileForKind,
} from '../../campaign/campaignTheme.js';
import { CampaignTacticalMap } from './CampaignTacticalMap.jsx';

function missionKindForDisplay(m) {
  const k = m?.missionKind;
  if (k && MISSION_KIND_TAGS[k]) return k;
  const t = m?.missionType;
  if (t === 'dominion') return 'dominion';
  if (t === 'annihilation') return 'annihilation';
  return 'assault';
}

function SegBar({ value, max = 100, segments = 10, color }) {
  const filled = Math.ceil((value / max) * segments);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 7, background: i < filled ? color : CAMPAIGN_UI.border }} />
      ))}
    </div>
  );
}

const btn = (color = CAMPAIGN_UI.violetLit, size = 'sm') => ({
  fontFamily: CAMPAIGN_FONTS.ui,
  fontWeight: 600,
  letterSpacing: '0.1em',
  fontSize: size === 'lg' ? 14 : 12,
  color,
  background: `${color}10`,
  border: `1px solid ${color}40`,
  padding: size === 'lg' ? '12px 20px' : '6px 14px',
  cursor: 'pointer',
  textTransform: 'uppercase',
  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
  display: 'block',
  width: size === 'lg' ? '100%' : 'auto',
  textAlign: 'left',
});

const label = (color = CAMPAIGN_UI.textMuted) => ({
  fontSize: 10,
  letterSpacing: '0.14em',
  color,
  fontFamily: CAMPAIGN_FONTS.ui,
  fontWeight: 600,
  textTransform: 'uppercase',
});

function SectionHeader({ children, color = CAMPAIGN_UI.violetLit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, background: color, flexShrink: 0 }} />
      <span style={label(color)}>{children}</span>
      <div style={{ flex: 1, height: 1, background: CAMPAIGN_UI.border }} />
    </div>
  );
}

function panel(accent = CAMPAIGN_UI.violet, danger = false, p = 0) {
  return {
    background:
      danger && p >= 80 ? '#140808' : danger && p >= 50 ? '#130f05' : CAMPAIGN_UI.panelBg,
    border: `1px solid ${
      danger && p >= 80 ? '#2a0f0f' : danger && p >= 50 ? '#2a1f05' : CAMPAIGN_UI.border
    }`,
    borderLeft: `3px solid ${accent}`,
    padding: '14px 18px',
    fontFamily: CAMPAIGN_FONTS.ui,
  };
}

/**
 * @param {{
 *   missions: Object[],
 *   war: Object,
 *   onStartMission: (m: Object) => void,
 *   onAdvanceDay: () => void,
 *   dayGrowthHint?: string,
 * }} props
 */
export function CampaignWarMapView({ missions, war, onStartMission, onAdvanceDay, dayGrowthHint }) {
  const [selId, setSelId] = useState(null);

  const rows = useMemo(() => {
    return missions.map((m) => {
      const id = String(m.id);
      const pressure = getMissionDisplayPressure(m, war);
      const mandatory = isMissionMandatory(m, war);
      return {
        id,
        enemyName: m.enemyArmy || '?',
        pressure,
        isMandatory: mandatory,
        mission: m,
      };
    });
  }, [missions, war]);

  const sel = rows.find((r) => r.id === selId) ?? null;

  const mapRows = rows.map((r) => ({
    id: r.id,
    enemyName: r.enemyName,
    pressure: r.pressure,
    isMandatory: r.isMandatory,
  }));

  const handleConfirm = () => {
    if (sel?.mission) onStartMission(sel.mission);
  };

  const growthText = dayGrowthHint ?? '+15 pressione sui fronti attivi';

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 16,
        padding: '16px 0',
        fontFamily: CAMPAIGN_FONTS.ui,
        overflow: 'hidden',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 20px',
          gap: 10,
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <SectionHeader>Mappa di guerra — Missioni</SectionHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const m = r.mission;
            const kind = missionKindForDisplay(m);
            const mc = missionKindColor(kind);
            const p = r.pressure;
            const pc = pressureBarColor(p);
            const isSelected = selId === r.id;
            const tt = MISSION_KIND_TAGS[kind] ?? { tag: '—', col: mc };
            const kindLabel = CAMPAIGN_MISSION_KIND_LABELS[kind] || kind;
            const rp = rewardProfileForKind(kind);

            return (
              <div
                key={r.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 10, alignItems: 'stretch' }}
              >
                <button
                  type="button"
                  onClick={() => setSelId(isSelected ? null : r.id)}
                  style={{
                    ...panel(pc, true, p),
                    outline: isSelected ? `1px solid ${pc}` : '1px solid transparent',
                    outlineOffset: -1,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        flexShrink: 0,
                        background: isSelected ? pc : CAMPAIGN_UI.textMuted,
                        transform: 'rotate(45deg)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: CAMPAIGN_UI.textPri,
                      }}
                    >
                      {(m.name || r.enemyName).slice(0, 42)}
                    </span>
                    {r.isMandatory && (
                      <span
                        style={{
                          ...label(CAMPAIGN_UI.redLit),
                          border: `1px solid ${CAMPAIGN_UI.red}`,
                          padding: '2px 8px',
                          animation: 'satze-campaign-blink 1s infinite',
                        }}
                      >
                        !! Obbligatoria
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 12, color: pc }}>
                      {p}/100
                    </span>
                  </div>

                  <SegBar value={p} color={pc} />

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, pointerEvents: 'none' }}>
                    <div
                      style={{
                        ...btn(mc),
                        width: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: CAMPAIGN_FONTS.mono,
                          fontSize: 10,
                          color: tt.col,
                          background: `${tt.col}20`,
                          padding: '2px 6px',
                        }}
                      >
                        {tt.tag}
                      </span>
                      {kindLabel}
                    </div>
                    <span style={{ fontSize: 11, color: CAMPAIGN_UI.textMuted, alignSelf: 'center' }}>
                      vs {r.enemyName}
                    </span>
                  </div>
                </button>

                <div
                  style={{
                    background: CAMPAIGN_UI.panelBg2,
                    border: `1px solid ${CAMPAIGN_UI.border}`,
                    borderLeft: `3px solid ${isSelected ? pressureBarColor(p) : CAMPAIGN_UI.violetDim}`,
                    padding: 14,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ ...label(CAMPAIGN_UI.textMuted), marginBottom: 10 }}>Ricompense</div>
                  <div
                    style={{
                      fontFamily: CAMPAIGN_FONTS.mono,
                      fontSize: 11,
                      color: rp.col,
                      background: isSelected ? `${rp.col}25` : `${rp.col}12`,
                      border: `1px solid ${isSelected ? `${rp.col}80` : `${rp.col}30`}`,
                      padding: '4px 8px',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {rp.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            minHeight: 48,
            flexShrink: 0,
            background: CAMPAIGN_UI.panelBg,
            border: `1px solid ${sel ? CAMPAIGN_UI.borderHi : CAMPAIGN_UI.border}`,
            borderLeft: `3px solid ${sel ? CAMPAIGN_UI.greenLit : CAMPAIGN_UI.border}`,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {!sel ? (
            <span style={{ fontSize: 12, color: CAMPAIGN_UI.textMuted }}>
              Seleziona una missione per procedere.
            </span>
          ) : (
            <>
              <div style={{ width: 3, height: 14, background: CAMPAIGN_UI.greenLit, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: CAMPAIGN_UI.textSec }}>
                <span style={{ color: CAMPAIGN_UI.textPri, fontWeight: 600 }}>{sel.enemyName}</span>
                {' — '}
                <span style={{ color: missionKindColor(missionKindForDisplay(sel.mission)) }}>
                  {CAMPAIGN_MISSION_KIND_LABELS[missionKindForDisplay(sel.mission)] ||
                    missionKindForDisplay(sel.mission)}
                </span>
              </span>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={handleConfirm} style={{ ...btn(CAMPAIGN_UI.greenLit), width: 'auto', fontSize: 13 }}>
                Conferma missione →
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onAdvanceDay}
          style={{
            ...btn(CAMPAIGN_UI.textSec, 'lg'),
            display: 'flex',
            justifyContent: 'space-between',
            flexShrink: 0,
            marginTop: 'auto',
          }}
        >
          <span>Fine giorno</span>
          <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 11, color: CAMPAIGN_UI.textMuted }}>
            {growthText}
          </span>
        </button>
      </div>

      <CampaignTacticalMap
        rows={mapRows}
        selectedId={selId}
        hqIntegrity={war?.hqIntegrity ?? 100}
        onSelect={(row) => setSelId((prev) => (prev === row.id ? null : row.id))}
      />

      <style>{`
        @keyframes satze-campaign-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
