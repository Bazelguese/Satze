// Hub campagna — schermata dedicata (UI integrata dal prototipo rework + stato satze).

import React, { useState, useEffect, useCallback } from 'react';
import {
  loadCampaignProgress,
  saveCampaignProgress,
  acknowledgeCampaignRewards,
  acknowledgeCampaignManagementFinish,
  resetCampaignRunForTesting,
  advanceCampaignWarDay,
  applyCampaignNarrativeChoice,
  saveCampaignDeckAndWarehouse,
  CAMPAIGN_DAY_PRESSURE_GROWTH,
} from '../../data/campaign';
import { getAvailableCampaignMissions } from '../../game/campaign/campaignWarMissions.js';
import { totalLeagueForCampaignDeck } from '../../game/campaign/campaignDeckLogic.js';
import { getNextCampaignNarrative } from '../../data/campaignNarrative.js';
import { injectCampaignFonts, CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';
import {
  PALETTE,
  HUD_ORATORIO_FONT_UI,
  HUD_ORATORIO_FONT_DISPLAY,
  buildSatzeCosmicBackgroundCSS,
} from '../../theme/hudOratorioPalette';
import { CampaignTopHUD } from './CampaignTopHUD.jsx';
import { CampaignWarMapView } from './CampaignWarMapView.jsx';
import { CampaignDeckManagement } from './CampaignDeckManagement.jsx';
import { CampaignNarrativeInterlude } from './CampaignNarrativeInterlude.jsx';

function panelBtn(primary) {
  return {
    fontFamily: CAMPAIGN_FONTS.ui,
    fontWeight: 600,
    letterSpacing: '0.08em',
    fontSize: 13,
    padding: '12px 24px',
    cursor: 'pointer',
    border: `1px solid ${primary ? CAMPAIGN_UI.greenLit + '60' : CAMPAIGN_UI.border}`,
    background: primary ? `${CAMPAIGN_UI.greenLit}18` : `${CAMPAIGN_UI.textSec}12`,
    color: primary ? CAMPAIGN_UI.greenLit : CAMPAIGN_UI.textSec,
    textTransform: 'uppercase',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
  };
}

/**
 * @param {{
 *   onStartMission: (m: Object) => void,
 *   onBack: () => void,
 *   onClose?: () => void,
 *   onOpenDeckManager?: () => void,
 *   campaignSaveSlot?: number,
 * }} props
 */
export function CampaignWarHub({ onStartMission, onBack, onClose, onOpenDeckManager, campaignSaveSlot = 0 }) {
  const exit = onBack ?? onClose ?? (() => {});
  const slot = campaignSaveSlot;
  const [progress, setProgress] = useState(() => loadCampaignProgress(slot));

  const refresh = useCallback(() => {
    setProgress(loadCampaignProgress(slot));
  }, [slot]);

  useEffect(() => {
    injectCampaignFonts();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const p = loadCampaignProgress(slot);
    const { war } = getAvailableCampaignMissions(p);
    if (JSON.stringify(p.war?.fissures || []) !== JSON.stringify(war.fissures || [])) {
      saveCampaignProgress({ ...p, war }, slot);
      refresh();
    }
  }, [refresh, slot]);

  const meta = progress.meta || {};
  const segment = meta.segment || 'mission_select';

  const handleRewardsContinue = () => {
    acknowledgeCampaignRewards(slot);
    refresh();
  };

  const handleManagementContinue = () => {
    acknowledgeCampaignManagementFinish(slot);
    refresh();
  };

  const handleResetRun = () => {
    resetCampaignRunForTesting(slot);
    refresh();
  };

  const handleAdvanceDay = () => {
    advanceCampaignWarDay(slot);
    refresh();
  };

  const { missions, war: warForMap } = getAvailableCampaignMissions(progress);
  const war = progress.war || {};

  const shellStyle = {
    fontFamily: HUD_ORATORIO_FONT_UI,
    background: buildSatzeCosmicBackgroundCSS(),
    color: PALETTE.textPrimary,
  };

  const titleFont = { fontFamily: HUD_ORATORIO_FONT_DISPLAY };

  const hq = war.hqIntegrity;
  const lostByHq = typeof hq === 'number' && hq <= 0;

  const metaDay = meta.day ?? 1;
  const deckLen = Array.isArray(meta.activeDeckCardIds) ? meta.activeDeckCardIds.length : null;
  const armyName = war.playerArmy || "Figli dell'Orizzonte";
  const leagueUsed =
    armyName === "Figli dell'Orizzonte" && Array.isArray(meta.activeDeckCardIds)
      ? totalLeagueForCampaignDeck(meta.activeDeckCardIds, armyName)
      : null;

  if (segment === 'campaign_won') {
    return (
      <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden" style={shellStyle}>
        <CampaignTopHUD
          day={metaDay}
          hqIntegrity={typeof hq === 'number' ? hq : 100}
          deckSize={deckLen}
          leagueUsed={leagueUsed}
        />
        <div className="flex-1 flex items-center justify-center p-6" style={{ fontFamily: CAMPAIGN_FONTS.ui }}>
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#081410',
              border: `1px solid ${CAMPAIGN_UI.greenLit}50`,
              borderTop: `3px solid ${CAMPAIGN_UI.greenLit}`,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <h2 style={{ ...titleFont, fontSize: 26, color: CAMPAIGN_UI.greenLit, marginBottom: 12 }}>Campagna completata</h2>
            <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Hai portato a termine la storia dei Figli dell&apos;Orizzonte.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" onClick={handleResetRun} style={panelBtn(true)}>
                Nuova run su questo slot
              </button>
              <button
                type="button"
                onClick={exit}
                style={{ ...panelBtn(false), border: `1px solid ${CAMPAIGN_UI.border}` }}
              >
                Menu principale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (segment === 'campaign_lost' || lostByHq) {
    return (
      <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden" style={shellStyle}>
        <CampaignTopHUD
          day={metaDay}
          hqIntegrity={typeof hq === 'number' ? hq : 0}
          deckSize={deckLen}
          leagueUsed={leagueUsed}
        />
        <div className="flex-1 flex items-center justify-center p-6" style={{ fontFamily: CAMPAIGN_FONTS.ui }}>
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#140808',
              border: `1px solid ${CAMPAIGN_UI.red}50`,
              borderTop: `3px solid ${CAMPAIGN_UI.redLit}`,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <h2 style={{ ...titleFont, fontSize: 26, color: CAMPAIGN_UI.redLit, marginBottom: 12 }}>Campagna terminata</h2>
            <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              La sede è stata compromessa o l&apos;integrità è a zero.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" onClick={handleResetRun} style={panelBtn(true)}>
                Nuova run (reset salvataggio)
              </button>
              <button
                type="button"
                onClick={exit}
                style={{ ...panelBtn(false), border: `1px solid ${CAMPAIGN_UI.border}` }}
              >
                Menu principale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (segment === 'rewards') {
    return (
      <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden" style={shellStyle}>
        <CampaignTopHUD
          day={metaDay}
          hqIntegrity={war.hqIntegrity ?? 100}
          deckSize={deckLen}
          leagueUsed={leagueUsed}
        />
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: CAMPAIGN_UI.panelBg,
              border: `1px solid ${CAMPAIGN_UI.violetLit}44`,
              borderTop: `3px solid ${CAMPAIGN_UI.violetLit}`,
              padding: 28,
              fontFamily: CAMPAIGN_FONTS.ui,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ec4899', marginBottom: 8 }}>
              RICOMPENSE
            </div>
            <h2 style={{ ...titleFont, fontSize: 22, color: CAMPAIGN_UI.textPri, marginBottom: 12 }}>Missione completata</h2>
            <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 14, marginBottom: 20 }}>
              Oggetti e carte aggiunti al magazzino. Continua al segmento gestionale.
            </p>
            {Array.isArray(meta.warehouseCardIds) && meta.warehouseCardIds.length > 0 && (
              <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 13, marginBottom: 16 }}>
                Carte in magazzino: <strong style={{ color: CAMPAIGN_UI.textPri }}>{meta.warehouseCardIds.length}</strong>{' '}
                (dettaglio nel segmento gestionale).
              </p>
            )}
            {Array.isArray(meta.warehouse) && meta.warehouse.length > 0 && (
              <ul
                style={{
                  fontSize: 13,
                  color: CAMPAIGN_UI.textPri,
                  marginBottom: 20,
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: `1px solid ${CAMPAIGN_UI.border}`,
                  padding: 12,
                  listStyle: 'none',
                }}
              >
                {meta.warehouse.map((item) => (
                  <li key={item.id} style={{ padding: '6px 0', borderBottom: `1px solid ${CAMPAIGN_UI.border}` }}>
                    ◆ {item.label || item.kind}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={handleRewardsContinue} style={{ ...panelBtn(true), width: '100%' }}>
              Continua al comando →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    segment === 'management_full' ||
    segment === 'management_reduced' ||
    segment === 'management_minimal' ||
    segment === 'management'
  ) {
    const depth =
      segment === 'management_reduced'
        ? 'ridotto'
        : segment === 'management_minimal'
          ? 'minimo'
          : 'completo';
    const reduced = segment === 'management_reduced' || segment === 'management_minimal';
    const minimal = segment === 'management_minimal';
    const depthKey = minimal ? 'minimal' : reduced ? 'reduced' : 'full';
    const nextNarr = getNextCampaignNarrative(meta);
    const showFigliDeck =
      armyName === "Figli dell'Orizzonte" &&
      Array.isArray(meta.activeDeckCardIds) &&
      meta.activeDeckCardIds.length > 0;

    return (
      <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden" style={shellStyle}>
        <CampaignTopHUD
          day={metaDay}
          hqIntegrity={war.hqIntegrity ?? 100}
          deckSize={deckLen}
          leagueUsed={leagueUsed}
        />
        <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          <div
            style={{
              width: '100%',
              maxWidth: 800,
              background: CAMPAIGN_UI.panelBg,
              border: `1px solid ${CAMPAIGN_UI.border}`,
              borderLeft: `3px solid ${CAMPAIGN_UI.violetLit}`,
              padding: 28,
              fontFamily: CAMPAIGN_FONTS.ui,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: CAMPAIGN_UI.violetLit, marginBottom: 8 }}>
              COMANDO
            </div>
            <h2 style={{ ...titleFont, fontSize: 22, color: CAMPAIGN_UI.textPri, marginBottom: 8 }}>
              Segmento gestionale
            </h2>
            <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 13, marginBottom: 20 }}>
              Profilo: <span style={{ color: CAMPAIGN_UI.textPri }}>{depth}</span>
              {minimal && ' — solo revisione strategica.'}
              {reduced && !minimal && " — solo uscite dall'esercito verso magazzino."}
            </p>

            {nextNarr && (
              <CampaignNarrativeInterlude
                event={nextNarr}
                onChoice={(choice) => {
                  applyCampaignNarrativeChoice(nextNarr.id, choice.key, slot);
                  refresh();
                }}
              />
            )}

            {!nextNarr && showFigliDeck && (
              <CampaignDeckManagement
                army={armyName}
                deckIds={meta.activeDeckCardIds || []}
                warehouseIds={meta.warehouseCardIds || []}
                depth={depthKey}
                onSave={(d, w) => {
                  saveCampaignDeckAndWarehouse(d, w, slot);
                  refresh();
                }}
              />
            )}

            {!nextNarr && !showFigliDeck && (
              <p style={{ color: CAMPAIGN_UI.textSec, fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
                L&apos;esercito a carte per altre armate si gestisce nella selezione esercito prima della battaglia. Il magazzino
                carte Figli si attiva quando la run usa i Figli dell&apos;Orizzonte come armata base.
              </p>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${CAMPAIGN_UI.border}` }}>
              <div style={{ fontSize: 11, color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>
                Meta oggetti: {meta.warehouse?.length || 0} · Carte in magazzino: {meta.warehouseCardIds?.length || 0}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginTop: 16 }}>
              {!nextNarr && onOpenDeckManager && (
                <button
                  type="button"
                  onClick={onOpenDeckManager}
                  style={{ fontSize: 12, color: CAMPAIGN_UI.violetLit, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Apri gestione eserciti (editor)
                </button>
              )}
              <button type="button" onClick={handleResetRun} style={{ fontSize: 11, color: CAMPAIGN_UI.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
                Reset run test
              </button>
              {!nextNarr && (
                <button type="button" onClick={handleManagementContinue} style={panelBtn(true)}>
                  Torna alla mappa →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-full flex flex-col overflow-hidden" style={shellStyle}>
      <CampaignTopHUD
        day={metaDay}
        hqIntegrity={war.hqIntegrity ?? 100}
        armyName={armyName}
        deckSize={deckLen}
        leagueUsed={leagueUsed}
      />

      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${CAMPAIGN_UI.border}`, background: `${CAMPAIGN_UI.panelBg2}80` }}
      >
        <div>
          <h1 style={{ ...titleFont, fontSize: 22, fontWeight: 700, color: CAMPAIGN_UI.violetLit }}>
            Campagna — guerra
          </h1>
          <p style={{ fontSize: 12, color: CAMPAIGN_UI.textMuted, marginTop: 4 }}>
            Calendario operativo · giorno {metaDay}
          </p>
        </div>
        <button
          type="button"
          onClick={exit}
          style={{
            fontFamily: CAMPAIGN_FONTS.ui,
            fontSize: 12,
            fontWeight: 600,
            padding: '8px 16px',
            color: CAMPAIGN_UI.textSec,
            background: `${CAMPAIGN_UI.textSec}10`,
            border: `1px solid ${CAMPAIGN_UI.border}`,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          ← Menu principale
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col" style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <CampaignWarMapView
          missions={missions}
          war={warForMap}
          onStartMission={onStartMission}
          onAdvanceDay={handleAdvanceDay}
          dayGrowthHint={`+${CAMPAIGN_DAY_PRESSURE_GROWTH} pressione sui fronti attivi`}
        />
      </div>
    </div>
  );
}
