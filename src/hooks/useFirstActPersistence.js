import { useLayoutEffect, useRef, useState } from 'react';
import { loadCampaignRun, saveCampaignRun } from '../campaign/state/persistence.js';
import { isFirstActRun, firstActReducer } from '../campaign/state/firstActState.js';
// Logical state only; animation progress and transient DOM/ref state are excluded.
export const CAMPAIGN_SNAPSHOT_KEYS = ['playerHand','enemyHand','battlefields','conqueredFields','playerHP','enemyHP','playerFocus','enemyFocus','currentFieldIndex','selectedAgent','selectedFocus','enemyAgent','enemySelectedFocus','playerUsedCards','enemyUsedCards','cardBattleOutcomes','isPlayerFirst','openingPlayerFirst','battleResult','logs','battleEvents','roundNumber','lastWinner','revealedFields','playerArmyBonuses','enemyArmyBonuses','playerToxin','enemyToxin','campaignDuelMod','showClaimVictoryChoice','gameResult'];
export function useFirstActPersistence(state) {
  const last = useRef('');
  const [error,setError] = useState('');
  useLayoutEffect(()=>{
    if (!state.campaignDuelMod?.firstAct || !state.campaignLevel) return;
    if (!['selectField','selectAgent','selectFocus','battle','result','gameOver'].includes(state.gamePhase)) return;
    const run=loadCampaignRun(state.campaignSaveSlot);
    const level=state.campaignLevel;
    if (!isFirstActRun(run) || run.active?.id!==level.campaignAttempt || run.active?.phase!==level.campaignPhase) return;
    const snapshot=Object.fromEntries(CAMPAIGN_SNAPSHOT_KEYS.filter(k=>state[k]!==undefined).map(k=>[k,state[k]]));
    // Battle resolution is atomic; a reload just before it resumes the committed selections.
    snapshot.gamePhase=state.gamePhase;
    const serialized=JSON.stringify(snapshot);
    if(serialized===last.current)return;
    try {
      if(!saveCampaignRun(firstActReducer(run,{type:'SNAPSHOT',attempt:level.campaignAttempt,phase:level.campaignPhase,snapshot}),state.campaignSaveSlot)) throw new Error('Impossibile salvare lo scontro. Libera spazio e riprova prima di uscire.');
      last.current=serialized;setError('');
    } catch(e){setError(e.message);}
  });
  return error;
}
export function restoreFirstActSnapshot(gameState, snapshot) {
  if (!snapshot) return;
  for (const key of CAMPAIGN_SNAPSHOT_KEYS) {
    const setter=gameState[`set${key[0].toUpperCase()}${key.slice(1)}`];
    if (typeof setter==='function' && Object.hasOwn(snapshot,key)) setter(snapshot[key]);
  }
  gameState.setPendingDuelPhase(snapshot.gamePhase);
}
