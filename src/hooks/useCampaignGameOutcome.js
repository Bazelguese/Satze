import { useEffect, useRef } from 'react';
import { finalizeCampaignMissionDefeat, finalizeCampaignMissionVictory } from '../data/campaign.js';

/**
 * Alla fine di una partita in modalità campagna, aggiorna progressione + meta.
 */
export function useCampaignGameOutcome({ gamePhase, campaignLevel, gameResult, campaignSaveSlot = 0 }) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (gamePhase !== 'gameOver') {
      handledRef.current = false;
      return;
    }
    if (!campaignLevel || !gameResult) return;
    if (handledRef.current) return;
    handledRef.current = true;

    if (gameResult.winner === 'player') {
      finalizeCampaignMissionVictory(campaignLevel, campaignSaveSlot);
    } else if (gameResult.winner === 'enemy') {
      finalizeCampaignMissionDefeat(campaignLevel, campaignSaveSlot);
    }
  }, [gamePhase, campaignLevel, gameResult, campaignSaveSlot]);
}
