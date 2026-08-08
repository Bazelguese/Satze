import { useEffect, useRef } from 'react';
import { ACT } from '../campaign/data/atto1.js';
import { applyDuelResult } from '../campaign/logic/missionAdapter.js';
import { loadCampaignRun, saveCampaignRun } from '../campaign/state/persistence.js';

/**
 * Alla fine di una partita in modalità campagna applica l'esito alla run
 * (vittoria, sconfitta o pareggio: la campagna decide le conseguenze,
 * il duello non viene toccato).
 *
 * @param {{ gamePhase: string, campaignLevel: Object|null, gameResult: Object|null, campaignSaveSlot?: number }} params
 *   campaignLevel = missione del modello Atto I ({ id, node, objective, enemy, … })
 */
export function useCampaignGameOutcome({ gamePhase, campaignLevel, gameResult, campaignSaveSlot = 0 }) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (gamePhase !== 'gameOver') {
      handledRef.current = false;
      return;
    }
    if (!campaignLevel || !campaignLevel.node || !gameResult) return;
    if (handledRef.current) return;
    handledRef.current = true;

    try {
      const run = loadCampaignRun(campaignSaveSlot, ACT);
      if (!run) return;
      const next = applyDuelResult(run, ACT, campaignLevel, gameResult);
      saveCampaignRun(next, campaignSaveSlot);
    } catch (e) {
      console.error("Errore nell'applicare l'esito campagna:", e);
    }
  }, [gamePhase, campaignLevel, gameResult, campaignSaveSlot]);
}
