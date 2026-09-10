import { isFirstActRun, firstActReducer } from '../campaign/state/firstActState.js';
import { useEffect, useRef, useState } from 'react';
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
export function useCampaignGameOutcome({ gamePhase, campaignLevel, gameResult, campaignSaveSlot = 0, playerHP, enemyHP }) {
  const handledRef = useRef(false);
  const [error,setError] = useState('');

  useEffect(() => {
    if (gamePhase !== 'gameOver') {
      handledRef.current = false;
      setError('');
      return;
    }
    if (!campaignLevel || !campaignLevel.node || !gameResult) return;
    if (handledRef.current) return;
    handledRef.current = true;

    try {
      const run = loadCampaignRun(campaignSaveSlot, ACT);
      if (!run) return;
      const next = isFirstActRun(run) ? firstActReducer(run, {type:'RESULT',attempt:campaignLevel.campaignAttempt,phase:campaignLevel.campaignPhase,winner:gameResult.winner,playerHP,enemyHP}) : applyDuelResult(run, ACT, campaignLevel, gameResult);
      if (!saveCampaignRun(next, campaignSaveSlot)) throw new Error('Salvataggio esito non riuscito. Riprendi lo scontro salvato per confermarlo.');
      setError('');
    } catch (e) {
      handledRef.current = false;
      setError(e.message);
      console.error("Errore nell'applicare l'esito campagna:", e);
    }
  }, [gamePhase, campaignLevel, gameResult, campaignSaveSlot, playerHP, enemyHP]);
  return error;
}
