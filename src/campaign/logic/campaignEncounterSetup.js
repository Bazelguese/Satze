import {NASCENTE_ID} from './nascente.js';
// Stable hand for each run/encounter. Guaranteed cards replace a draw, never add a sixth card.
export function campaignHand(deck,requiredId,seed,salt){
 let state=(seed>>>0)||1;for(const ch of salt)state=Math.imul(state^ch.charCodeAt(0),16777619)>>>0;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
 const required=requiredId==null?null:deck.find(c=>c.id===requiredId);
 if(requiredId!=null&&!required)throw new Error('Carta garantita assente dal mazzo.');
 const pool=deck.filter(c=>c.id!==requiredId);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const hand=required?[required,...pool.slice(0,4)]:pool.slice(0,5);
 if(hand.length!==5)throw new Error('Mano campagna incompleta.');return hand;
}
export function campaignFixedHands(mission,run,playerDeck,enemyDeck){return {
 playerHand:campaignHand(playerDeck,NASCENTE_ID,run.seed,`${mission.id}:player`),
 enemyHand:campaignHand(enemyDeck,mission.signatureCardId??null,run.seed,`${mission.id}:enemy`),
};}
