// Scelta slot salvataggio campagna (3 slot indipendenti).

import React, { useCallback, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import { ACT } from '../../campaign/data/atto1.js';
import {
  CAMPAIGN_SLOT_COUNT,
  getCampaignRunSummary,
  initializeCampaignRun,
  clearCampaignRun,
} from '../../campaign/state/persistence.js';
import { NASCENTE_ID, poolCardById } from '../../campaign/state/campaignState.js';
import { CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';
import { MenuScreenLayout, MenuBackButton } from '../menu';
import StartingArmySelection from './atto1/StartingArmySelection.jsx';
import { getNascenteStageImageUrl } from '../../data/images.js';

import '../../styles/campaign/colors_and_type.css';
import '../../styles/campaign/atto1-components.css';

/**
 * @param {{
 *   onSlotChosen: (slotIndex: number) => void,
 *   onBack: () => void,
 * }} props
 */
export function CampaignSaveSlots({ onSlotChosen, onBack }) {
  const [summaries, setSummaries] = useState(() =>
    Array.from({ length: CAMPAIGN_SLOT_COUNT }, (_, i) => getCampaignRunSummary(i))
  );
  const [pendingDelete, setPendingDelete] = useState(null);
  // Slot su cui è aperta la scelta dell'esercito iniziale (nuova campagna)
  const [armySlot, setArmySlot] = useState(null);

  // Pool compagni L2 dai dati dell'Atto (schierabili: 2 su 6)
  const companionPool = (ACT.companions || [])
    .map((id) => {
      const c = poolCardById(id);
      return c && {
        id,
        name: c.name,
        role: 'Agente',
        rarity: 'comune',
        army: 'orizzonte',
        level: c.league,
        pot: c.power,
        dan: c.damage,
        power: c.description || 'Nessun potere.',
      };
    })
    .filter(Boolean);

  const refresh = useCallback(() => {
    setSummaries(Array.from({ length: CAMPAIGN_SLOT_COUNT }, (_, i) => getCampaignRunSummary(i)));
  }, []);

  if (armySlot != null) {
    return (
      <div className="w-full h-full min-h-full overflow-hidden" style={{ position: 'relative', minHeight: '100%' }}>
        <StartingArmySelection
          pool={companionPool}
          nascente={{
            name: 'Nascente',
            role: 'Protagonista',
            level: ACT.nascente?.startLeague ?? 2,
            pot: ACT.nascente?.startStats?.power ?? 2,
            dan: ACT.nascente?.startStats?.damage ?? 2,
            imageSrc: getNascenteStageImageUrl(0),
          }}
          companionSlots={2}
          pv={25}
          fc={10}
          synergiesFor={() => []}
          onConfirm={(picked) => {
            const slot = armySlot;
            initializeCampaignRun(ACT, slot, { deck: [NASCENTE_ID, ...picked.map((c) => c.id)] });
            setArmySlot(null);
            refresh();
            onSlotChosen(slot);
          }}
        />
        <button
          type="button"
          onClick={() => setArmySlot(null)}
          style={{
            position: 'absolute', top: 18, right: 24, zIndex: 10,
            fontFamily: CAMPAIGN_FONTS.ui, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 14px', cursor: 'pointer',
            border: `1px solid ${CAMPAIGN_UI.border}`, background: 'rgba(7,7,7,.6)', color: CAMPAIGN_UI.textSec,
          }}
        >
          ← Torna agli slot
        </button>
      </div>
    );
  }

  const fmtTime = (ts) => {
    if (ts == null || !Number.isFinite(ts)) return null;
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return null;
    }
  };

  const slotCardBase = {
    background: 'rgba(17, 11, 32, 0.72)',
    border: '1.5px solid rgba(74, 63, 102, 0.85)',
    padding: 20,
    borderRadius: 4,
  };

  return (
    <MenuScreenLayout
      centered={false}
      title="Campagna — salvataggi"
      subtitle="Tre slot indipendenti. Scegli un file o inizia una nuova run."
    >
      <div
        className="w-full max-w-lg flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto satze-hide-scrollbar pb-4"
        style={{ fontFamily: CAMPAIGN_FONTS.ui }}
      >
        {summaries.map((sum, idx) => {
          const empty = sum.empty && !sum.corrupt;
          const label = `Slot ${idx + 1}`;
          return (
            <div
              key={idx}
              style={{
                ...slotCardBase,
                borderLeft: `3px solid ${empty ? CAMPAIGN_UI.textMuted : MENU_ACCENTS.magenta}`,
                boxShadow: empty ? undefined : '0 0 20px rgba(192, 38, 211, 0.08)',
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>
                {label}
              </div>
              {sum.corrupt && (
                <p style={{ color: '#f472b6', fontSize: 13, marginBottom: 12 }}>Dati non leggibili.</p>
              )}
              {!empty && !sum.corrupt && (
                <div style={{ fontSize: 13, color: CAMPAIGN_UI.textSec, lineHeight: 1.6, marginBottom: 12 }}>
                  <div>
                    Giorno <strong style={{ color: CAMPAIGN_UI.textPri }}>{sum.day}</strong>
                    {' '}di <strong style={{ color: CAMPAIGN_UI.textPri }}>{sum.daysLimit}</strong>
                    {' '}· Missioni superate: <strong style={{ color: CAMPAIGN_UI.textPri }}>{sum.missionsCompleted}</strong>
                  </div>
                  {sum.outcome != null && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Esito: <span style={{ color: sum.outcome === 'won' ? CAMPAIGN_UI.greenLit : CAMPAIGN_UI.redLit }}>
                        {sum.outcome === 'won' ? 'Atto I completato' : 'Tempo scaduto'}
                      </span>
                    </div>
                  )}
                  {fmtTime(sum.savedAt) && (
                    <div style={{ fontSize: 11, color: CAMPAIGN_UI.textMuted, marginTop: 6 }}>
                      Ultimo salvataggio: {fmtTime(sum.savedAt)}
                    </div>
                  )}
                </div>
              )}
              {empty && (
                <p style={{ fontSize: 13, color: CAMPAIGN_UI.textSec, marginBottom: 12 }}>
                  {sum.legacy ? 'Salvataggio del vecchio modello campagna — verrà sostituito.' : 'Vuoto'}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {empty && (
                  <button
                    type="button"
                    onClick={() => setArmySlot(idx)}
                    style={{
                      fontFamily: CAMPAIGN_FONTS.ui,
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      padding: '10px 18px',
                      cursor: 'pointer',
                      border: `1px solid ${CAMPAIGN_UI.greenLit}60`,
                      background: `${CAMPAIGN_UI.greenLit}18`,
                      color: CAMPAIGN_UI.greenLit,
                      textTransform: 'uppercase',
                    }}
                  >
                    Nuova campagna
                  </button>
                )}
                {!empty && (
                  <>
                    <button
                      type="button"
                      onClick={() => onSlotChosen(idx)}
                      style={{
                        fontFamily: CAMPAIGN_FONTS.ui,
                        fontWeight: 600,
                        fontSize: 12,
                        letterSpacing: '0.06em',
                        padding: '10px 18px',
                        cursor: 'pointer',
                        border: '1.5px solid rgba(192, 38, 211, 0.55)',
                        background: 'linear-gradient(90deg, rgba(192,38,211,0.2), rgba(168,85,247,0.15))',
                        color: '#f0abfc',
                        textTransform: 'uppercase',
                      }}
                    >
                      Continua
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(idx)}
                      style={{
                        fontFamily: CAMPAIGN_FONTS.ui,
                        fontSize: 11,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        color: CAMPAIGN_UI.redLit,
                        textDecoration: 'underline',
                      }}
                    >
                      Elimina salvataggio
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MenuBackButton onClick={onBack}>Menu principale</MenuBackButton>

      {pendingDelete != null && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(6, 3, 10, 0.82)', zIndex: 200 }}
        >
          <div
            style={{
              maxWidth: 400,
              width: '100%',
              background: 'linear-gradient(180deg, #140f22 0%, #0c0614 100%)',
              border: `1.5px solid ${MENU_ACCENTS.magenta}`,
              boxShadow: '0 0 32px rgba(192, 38, 211, 0.25)',
              padding: 24,
              fontFamily: CAMPAIGN_FONTS.ui,
            }}
          >
            <p style={{ color: CAMPAIGN_UI.textPri, marginBottom: 16, fontSize: 14 }}>
              Cancellare definitivamente il salvataggio allo slot {pendingDelete + 1}?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${CAMPAIGN_UI.border}`,
                  background: 'transparent',
                  color: CAMPAIGN_UI.textSec,
                  cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCampaignRun(pendingDelete);
                  setPendingDelete(null);
                  refresh();
                }}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${CAMPAIGN_UI.red}80`,
                  background: `${CAMPAIGN_UI.red}22`,
                  color: CAMPAIGN_UI.redLit,
                  cursor: 'pointer',
                }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </MenuScreenLayout>
  );
}
