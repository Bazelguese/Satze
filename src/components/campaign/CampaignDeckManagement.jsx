import React, { useState, useEffect, useCallback } from 'react';
import { CAMPAIGN_FIGLI_PROTAGONIST_ID } from '../../data/campaignFigliDeck.js';
import {
  getCampaignCard,
  findCardByIdAnyArmy,
  totalLeagueForCampaignDeck,
  swapCampaignDeckCard,
  moveCardToWarehouse,
} from '../../game/campaign/campaignDeckLogic.js';
import { CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';

/**
 * @param {{
 *   army: string,
 *   deckIds: number[],
 *   warehouseIds: number[],
 *   depth: 'full' | 'reduced' | 'minimal',
 *   onSave: (deck: number[], warehouse: number[]) => void,
 * }} props
 */
export function CampaignDeckManagement({ army, deckIds, warehouseIds, depth, onSave }) {
  const [deck, setDeck] = useState(deckIds);
  const [wh, setWh] = useState(warehouseIds);
  const [pendingWh, setPendingWh] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setDeck(deckIds);
    setWh(warehouseIds);
  }, [deckIds, warehouseIds]);

  const readOnly = depth === 'minimal';
  const reduced = depth === 'reduced';
  const lg = totalLeagueForCampaignDeck(deck, army);

  const persist = useCallback(
    (d, w) => {
      setDeck(d);
      setWh(w);
      onSave(d, w);
    },
    [onSave]
  );

  const whForArmy = wh.filter((id) => getCampaignCard(id, army));
  const whOther = wh.filter((id) => !getCampaignCard(id, army));

  const handleAddClick = (cardId) => {
    setErr(null);
    if (readOnly || reduced) return;
    if (pendingWh === cardId) {
      setPendingWh(null);
      return;
    }
    setPendingWh(cardId);
  };

  const handleDeckCardClick = (cardId) => {
    setErr(null);
    if (readOnly) return;
    if (reduced) {
      const r = moveCardToWarehouse(deck, wh, cardId, CAMPAIGN_FIGLI_PROTAGONIST_ID);
      if (r.error) {
        setErr(r.error);
        return;
      }
      persist(r.deck, r.warehouse);
      return;
    }
    if (pendingWh == null) {
      const r = moveCardToWarehouse(deck, wh, cardId, CAMPAIGN_FIGLI_PROTAGONIST_ID);
      if (r.error) {
        setErr(r.error);
        return;
      }
      persist(r.deck, r.warehouse);
      return;
    }
    const r = swapCampaignDeckCard(deck, wh, pendingWh, cardId, army, CAMPAIGN_FIGLI_PROTAGONIST_ID);
    if (r.error) {
      setErr(r.error);
      return;
    }
    persist(r.deck, r.warehouse);
    setPendingWh(null);
  };

  const handleAddWithoutSwap = () => {
    if (pendingWh == null) return;
    setErr(null);
    const r = swapCampaignDeckCard(deck, wh, pendingWh, null, army, CAMPAIGN_FIGLI_PROTAGONIST_ID);
    if (r.error) {
      setErr(r.error);
      return;
    }
    persist(r.deck, r.warehouse);
    setPendingWh(null);
  };

  return (
    <div style={{ fontFamily: CAMPAIGN_FONTS.ui }}>
      {readOnly && (
        <p style={{ color: CAMPAIGN_UI.amberLit, fontSize: 13, marginBottom: 16 }}>
          Segmento minimo: solo consultazione. Nessuna modifica all&apos;esercito.
        </p>
      )}
      {reduced && !readOnly && (
        <p style={{ color: CAMPAIGN_UI.amberLit, fontSize: 13, marginBottom: 16 }}>
          Segmento ridotto: puoi solo spostare carte dall&apos;esercito al magazzino (niente ingresso dal magazzino).
        </p>
      )}
      {err && (
        <p style={{ color: CAMPAIGN_UI.redLit, fontSize: 12, marginBottom: 12 }}>{err}</p>
      )}
      {pendingWh != null && !readOnly && !reduced && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: `1px solid ${CAMPAIGN_UI.amber}`,
            background: `${CAMPAIGN_UI.amber}12`,
            fontSize: 12,
            color: CAMPAIGN_UI.textSec,
          }}
        >
          Seleziona una carta nell&apos;esercito da sostituire con{' '}
          <strong style={{ color: CAMPAIGN_UI.textPri }}>{getCampaignCard(pendingWh, army)?.name}</strong>, oppure
          <button
            type="button"
            onClick={handleAddWithoutSwap}
            style={{ marginLeft: 8, color: CAMPAIGN_UI.greenLit, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            aggiungi senza scambio
          </button>
          {' '}(se c&apos;è posto e Lega ≤ 30).
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>
            MAGAZZINO
          </div>
          {whOther.length > 0 && (
            <div style={{ marginBottom: 16, padding: 10, border: `1px dashed ${CAMPAIGN_UI.border}` }}>
              <div style={{ fontSize: 10, color: CAMPAIGN_UI.textMuted, marginBottom: 6 }}>
                Altre armate (ricompense — usa in missioni con quell&apos;armata)
              </div>
              {whOther.map((id) => {
                const found = findCardByIdAnyArmy(id);
                return (
                  <div key={id} style={{ fontSize: 12, color: CAMPAIGN_UI.textSec, marginBottom: 4 }}>
                    L{found?.card.league ?? '?'} · {found?.card.name ?? id}{' '}
                    <span style={{ color: CAMPAIGN_UI.textMuted }}>({found?.army})</span>
                  </div>
                );
              })}
            </div>
          )}
          {whForArmy.length === 0 && whOther.length === 0 ? (
            <p style={{ color: CAMPAIGN_UI.textMuted, fontSize: 13 }}>Nessuna carta in magazzino.</p>
          ) : (
            whForArmy.map((id) => {
              const c = getCampaignCard(id, army);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={readOnly || reduced}
                  onClick={() => handleAddClick(id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 6,
                    padding: '8px 10px',
                    background: pendingWh === id ? `${CAMPAIGN_UI.violetLit}22` : CAMPAIGN_UI.panelBg2,
                    border: `1px solid ${pendingWh === id ? CAMPAIGN_UI.violetLit : CAMPAIGN_UI.border}`,
                    color: CAMPAIGN_UI.textPri,
                    cursor: readOnly || reduced ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 11, color: CAMPAIGN_UI.textMuted }}>
                    L{c?.league ?? '?'}
                  </span>{' '}
                  {c?.name ?? id}
                </button>
              );
            })
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>
            ESERCITO ATTIVO ({deck.length}/10 · Lega {lg}/30)
          </div>
          {deck.map((id) => {
            const c = getCampaignCard(id, army);
            const prot = id === CAMPAIGN_FIGLI_PROTAGONIST_ID;
            return (
              <button
                key={id}
                type="button"
                disabled={readOnly || (reduced && prot)}
                onClick={() => handleDeckCardClick(id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 6,
                  padding: '8px 10px',
                  background: CAMPAIGN_UI.panelBg2,
                  border: `1px solid ${CAMPAIGN_UI.border}`,
                  color: CAMPAIGN_UI.textPri,
                  cursor: readOnly ? 'default' : 'pointer',
                  fontSize: 13,
                }}
              >
                {prot && <span style={{ color: CAMPAIGN_UI.amberLit, fontSize: 10 }}>★ </span>}
                <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 11, color: CAMPAIGN_UI.textMuted }}>
                  L{c?.league ?? '?'}
                </span>{' '}
                {c?.name ?? id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
