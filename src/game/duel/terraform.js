import { campaignField, TOWER_ID } from '../../campaign/data/firstAct.js';
import { createEmptyFieldStatDeltas } from './duelFieldStatTracking.js';
// Each destination opts in to its lifecycle. Setup-only changes (e.g. mirrors)
// are intentionally not replayed by a mid-duel replacement.
export const TERRAFORM_DESTINATIONS = new Set([TOWER_ID, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 24]);
export function terraformDestination(id) {
  if (!TERRAFORM_DESTINATIONS.has(id)) throw new Error(`Campo non abilitato a Terraformare: ${id}`);
  return campaignField(id);
}
export function replaceContinuousFieldStats(state, oldField, newField) {
  // Only continuous contributions leave; swaps already performed remain historical.
  if ([1,2,5].includes(oldField.id)) {
    for (const [side,p] of [['player','p'],['enemy','e']]) {
      for (const [stat,key] of [['power','Power'],['damage','Damage'],['assaultMod','AssaultMod']]) state[p+key] -= state.fieldStatDeltas?.[side]?.[stat] || 0;
    }
  }
  state.fieldStatDeltas = createEmptyFieldStatDeltas();
  for (const [side,p] of [['player','p'],['enemy','e']]) {
    const beforeP=state[p+'Power'],beforeD=state[p+'Damage'];
    if(newField.id===1)state[p+'Power']+=4;
    if(newField.id===2){if(!state[p+'Immune'])state[p+'Power']--;state[p+'Damage']++;}
    if(newField.id===5&&!state[p+'Immune'])state[p+'Damage']=Math.max(0,state[p+'Damage']-2);
    state.fieldStatDeltas[side].power=state[p+'Power']-beforeP;
    state.fieldStatDeltas[side].damage=state[p+'Damage']-beforeD;
  }
}
