import {describe,it,expect} from 'vitest';
import {createFirstActRun,createLegacyFirstActRun,firstActReducer as reduce,availableFirstActNodes,eventChoices,firstActRunNode,assertFirstActRun,runCard,runLeague,transformationPool,promotionOffer,legalArmy} from './state/firstActState.js';
import {firstActCard,NASCENTE,campaignField} from './data/firstAct.js';
import {CROWDS,CAEL_BOSS,CAEL_NODES,CAGES,TEMPLES,STOREHOUSE,QUESTION} from './data/caelAct.js';
import {firstActDuelConfig,firstActMatchOutcome} from './logic/firstActBattle.js';
import {statusTotal} from './state/caelState.js';
import {resolveTerminalStatus} from '../game/ai/simulateAIDuel.js';
import {projectPostDuelState} from '../game/ai/projectPostDuelState.js';
import {computeDuelResolution} from '../game/duelResolve.js';
const reload=r=>assertFirstActRun(JSON.parse(JSON.stringify(r)));
function choose(r,choice) {r=reduce(r,{type:'ENTER_EVENT'});return reduce(r,{type:'CHOICE',choice:choice||eventChoices(r)[0]});}
function result(r,winner='player',progress=[],hp=15,enemyHP=10){return reduce(r,{type:'RESULT',attempt:r.active.id,phase:r.active.phase,winner,playerHP:hp,enemyHP,progress});}
function win(r,id=availableFirstActNodes(r)[0].id) {r=reduce(r,{type:'START',nodeId:id});while(r.active)r=result(r);return reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]??null});}
function until(id,route='piane',extra={}){
 let r=createFirstActRun({seed:31});
 while(!availableFirstActNodes(r).some(n=>n.id===id)){
  const n=availableFirstActNodes(r)[0];
  if(n.kind==='event')r=choose(r,({E0:route,E3:'C1',E4:'leave',E5:'fonderia',E7:'leave',E8:'finalPower',...extra})[n.id]);
  else if(n.id==='F2')r=reduce(r,{type:'SKIP'});
  else r=win(r,n.id);
  r=reduce(r,{type:'SET_DECK',deck:legalArmy(r)});
 }
 return r;
}
function entry(r,{round=1,playerId=r.active.playerSquads[r.active.phase][0],enemyId=r.active.enemySquads[r.active.phase][0],fieldId=12,winner='player',conquered=true}={}){
 return {key:`${r.active.phase}:${round}`,phase:r.active.phase,round,playerId,enemyId,fieldId,winner,conquered};
}
describe('Campagna di Cael approvata 0.26',()=>{
 it('traverses every geographic/operation/optional branch with exactly 13 or 14 encounters',()=>{
  for(const route of ['piane','altopiano','strada'])for(const special of [false,true])for(const operation of ['fonderia','convogli'])for(const optional of [false,true])for(const canal of [false,true]){
   let r=createFirstActRun({seed:23});
   while(!r.outcome){
    const ns=availableFirstActNodes(r);let n=ns[0];
    if(n.id.startsWith('A04')&&special)n=ns.at(-1);
    if(n.id.startsWith('A10')&&canal)n=ns.at(-1);
    if(n.id==='F2'&&!optional)r=reduce(r,{type:'SKIP'});
    else if(n.kind==='event')r=choose(r,({E0:route,E3:'C1',E4:'reopen',E5:operation,E7:'restore',E8:'finalDamage'})[n.id]);
    else r=win(r,n.id);
    r=reload(r);r=reduce(r,{type:'SET_DECK',deck:legalArmy(r)});
    expect(runLeague(r)).toBeLessThanOrEqual(r.budget);expect(runCard(r,NASCENTE).league).toBeLessThanOrEqual(3);
   }
   expect(r.stats.wins).toBe(optional?14:13);expect(r.slots).toBe(10);expect(r.budget).toBe(30);
   expect(r.history.filter(h=>firstActRunNode(r,h.nodeId)?.army==='Concordia di Caelion')).toHaveLength(12);
   expect(r.statuses.length).toBeGreaterThan(0);
  }
 });
 it('creates only Concordia 1/1 crowds, an isolated L4 boss and starts with unpowered Nascente',()=>{
  const r=createFirstActRun({seed:3});expect(r.designVersion).toBe('0.26');expect(availableFirstActNodes(r)[0].id).toBe('E0');
  expect(runCard(r,NASCENTE)).toMatchObject({power:2,damage:2,league:2,ability:null});
  for(const id of CROWDS)expect(firstActCard(id)).toMatchObject({power:1,damage:1,league:1,ability:null,army:'Concordia di Caelion'});
  expect(firstActCard(CAEL_BOSS)).toMatchObject({league:4,power:4,damage:3,ability:{trigger:'intervention',effect:'blockAbility'}});
  expect(firstActCard(9114)).toMatchObject({league:5,power:5,damage:4});
 });
 it('does not transform L1 ordinarily; road replaces only one copy in either choice',()=>{
  let r=until('E1-strada','strada'),uid=r.copies[0].uid;
  expect(transformationPool(r,uid)).toEqual([]);expect(()=>reduce(r,{type:'TRANSFORM',uid})).toThrow();
  r=reduce(r,{type:'ENTER_EVENT'});
  for(const choice of eventChoices(r)){
   const next=reduce(r,{type:'CHOICE',choice});expect(next.copies).toHaveLength(1);expect(next.copies[0].uid).toBe(uid);
   expect(firstActCard(next.copies[0].cardId).league).toBe(2);expect(next.deck).toEqual(r.deck);
  }
 });
 it('gives one stable random reward, leaves duplicates in reserve and never creates reinforcements',()=>{
  let r=until('A02-piane');r=reduce(r,{type:'START',nodeId:'A02-piane'});r=result(r);
  const id=r.pendingReward.offer[0];r.copies[0].cardId=id;
  const before=r.copies.length,deck=[...r.deck],p=reload(r);
  expect(p.pendingReward.offer).toEqual([id]);r=reduce(p,{type:'REWARD',cardId:id});
  expect(r.copies).toHaveLength(before+1);expect(r.deck).toEqual(deck);expect(r.slots).toBe(3);
  r=reduce(r,{type:'SET_DECK',deck:[NASCENTE,...r.copies.map(c=>c.uid)]});
  const cfg=firstActDuelConfig(reduce(choose(r,'accept'),{type:'START',nodeId:'A03-piane'}));
  const cards=cfg.startOptions.fixedHands.playerHand.filter(c=>c.id!==NASCENTE);
  expect(new Set(cards.map(c=>c.id)).size).toBe(2);expect(new Set(cards.map(c=>c.cardId)).size).toBe(1);
  expect(()=>reduce(r,{type:'REWARD',cardId:id})).toThrow();
 });
 it('counts only the winning copy, rolls back failures and promotes with a stable half-pool offer',()=>{
  let base=until('A02-piane');base.copies.push({...base.copies[0],uid:'c2'});base.nextCopy=3;base.slots=3;base.deck.push('c2');
  let r=reduce(base,{type:'START',nodeId:'A02-piane'});const progress=[entry(r,{playerId:'c1'})];
  const failed=result(r,'enemy',progress,0,10);expect(failed.copies.map(c=>c.wins)).toEqual([0,0]);
  r=result(r,'player',progress);r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});
  expect(r.copies[0].wins).toBe(1);expect(r.copies[1].wins).toBe(0);
  const offer=promotionOffer(r,'c1');expect(offer).toHaveLength(3);expect(promotionOffer(reload(r),'c1')).toEqual(offer);
  r=reduce(r,{type:'PROMOTE',uid:'c1',cardId:offer[0]});expect(r.copies[0].wins).toBe(0);expect(r.copies[1].cardId).toBe(CROWDS[0]);
  expect(r.deck).toContain('c1');r.copies[0].wins=2;expect(promotionOffer(r,'c1')).toEqual([]);
 });
 it('blocks over-budget promotion without consuming copy or progress',()=>{
  let r=until('A03-piane');r.copies[0].wins=1;r.budget=10;r.slots=5;
  r.copies=[r.copies[0],...[2,3,4].map(i=>({uid:`c${i}`,cardId:9111,acquiredAt:0,wins:0}))];r.nextCopy=5;r.deck=[NASCENTE,'c1','c2'];
  r.budget=10;r.copies[1].cardId=9114;r.deck.push('c3');r.copies[2].cardId=9151;
  // 2 + 1 + 5 + 1 = 9; adding another L1 reaches 10.
  r.copies[3].cardId=9151;r.deck.push('c4');
  const original=JSON.stringify(r),offer=promotionOffer(r,'c1');expect(()=>reduce(r,{type:'PROMOTE',uid:'c1',cardId:offer[0]})).toThrow('Lega insufficiente');expect(JSON.stringify(r)).toBe(original);
 });
 it('consolidates cages/temples/storehouse once, keeps enemy captures harmless and never applies retroactive healing',()=>{
  let r=until('A04-strada-luogo','strada');r=reduce(r,{type:'START',nodeId:'A04-strada-luogo'});
  const p=[entry(r,{round:1,fieldId:TEMPLES[0]}),entry(r,{round:2,fieldId:STOREHOUSE,winner:'enemy'}),entry(r,{round:3,fieldId:CAGES[0]})];
  const before=r.copies.length,initial=firstActDuelConfig(r).campaignDuelMod;
  r=reduce(r,{type:'SNAPSHOT',attempt:r.active.id,phase:0,snapshot:{campaignDuelMod:{duels:p}}});
  expect(r.copies).toHaveLength(before);expect(firstActDuelConfig(r).campaignDuelMod.playerLife).toBe(initial.playerLife);
  r=result(reload(r),'player',p);r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});
  expect(r.copies).toHaveLength(before+2);expect(statusTotal(r,'player','life')).toBe(1);expect(statusTotal(r,'enemy','focus')).toBe(1);
  let lost=until('A04-piane-luogo');lost=reduce(lost,{type:'START',nodeId:'A04-piane-luogo'});const cnt=lost.copies.length;
  const e=[entry(lost,{fieldId:CAGES[0],winner:'enemy'})];lost=result(lost,'player',e);expect(lost.pendingReward.offer).toEqual([]);lost=reduce(lost,{type:'REWARD',cardId:null});expect(lost.copies).toHaveLength(cnt);
 });
 it('keeps battle progress over two phases and uses complementary hands even with few copies',()=>{
  const base=until('A13');
  for(const count of [2,3,5,6,10]){
   let r={...base,copies:[...base.copies]};while(r.copies.length<count-1){r.copies.push({uid:`c${r.nextCopy++}`,cardId:9151,acquiredAt:0,wins:0});}
   r.deck=[NASCENTE,...r.copies.slice(0,count-1).map(c=>c.uid)];r=reduce(r,{type:'START',nodeId:'A13'});
   const all=r.active.playerSquads.flat();expect(new Set(all).size).toBe(count);expect(all.filter(id=>id===NASCENTE)).toHaveLength(1);
   expect(r.active.playerSquads.map(s=>s.length)).toEqual([Math.min(5,count-1),count-Math.min(5,count-1)]);
   const p=entry(r);r=result(r,'player',[p],17,8);expect(r.active.phase).toBe(1);expect(r.active.progress).toEqual([p]);
   expect(firstActDuelConfig(r).campaignDuelMod).toMatchObject({playerLife:17,enemyLife:8,playerFocus:18});
  }
 });
 it('includes the boss signature in a one-card reward and test wins invent no personal victories',()=>{
  let base=until('A13'),seen=false;
  for(let seed=0;seed<30;seed++){
   const r=reduce({...base,seed},{type:'TEST_WIN',nodeId:'A13'});expect(r.pendingReward.offer).toHaveLength(1);if(r.pendingReward.offer[0]===CAEL_BOSS)seen=true;
   const paid=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});expect(paid.copies.every(c=>c.wins===0)).toBe(true);expect(paid.history.at(-1).testWin).toBe(true);
  }
  expect(seen).toBe(true);
 });
 it('applies operation effects atomically, scopes Concordia statuses and preserves optional skip',()=>{
  let r=until('A08-fonderia');r=reduce(r,{type:'START',nodeId:'A08-fonderia'});
  const failed=result(r,'enemy');expect(failed.statuses.some(s=>s.source==='A08-fonderia')).toBe(false);
  r=result(r);r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});expect(statusTotal(r,'enemy','focus',{concordia:true})).toBe(1);expect(statusTotal(r,'enemy','focus')).toBe(0);
  let f=until('F2');f=reduce(f,{type:'START',nodeId:'F2'});f=result(f,'enemy');const copies=f.copies.length,statuses=f.statuses;
  f=reduce(f,{type:'SKIP'});expect(f.copies).toHaveLength(copies);expect(f.statuses).toEqual(statuses);expect(availableFirstActNodes(f)[0].id).toBe('A10-terrapieno');
 });
 it('preserves old saves on their original route and refuses stale results and replayed choices',()=>{
  const old=reload(createLegacyFirstActRun({seed:1}));expect(availableFirstActNodes(old)[0].id).toBe('I1');
  let r=choose(createFirstActRun({seed:1}),'piane');expect(()=>reduce(r,{type:'CHOICE',choice:'strada'})).toThrow();
  r=reduce(r,{type:'START',nodeId:'A01-piane'});const id=r.active.id;r=result(r);const same=reduce(r,{type:'RESULT',attempt:id,phase:0,winner:'player',playerHP:10,enemyHP:0});expect(same).toBe(r);
 });
 it('reveals normal fourth field at round 3, all four cages at the start, and resolves Quesito with HP precedence',()=>{
  for(const n of CAEL_NODES.filter(n=>n.roster&&n.fieldIds.length>=4&&!n.fixedFields))expect(n.revealRounds[3]).toBe(3);
  expect(firstActRunNode(createFirstActRun(),'A04-piane-luogo').revealRounds).toEqual([1,1,1,1]);
  const a={playerHP:10,enemyHP:10,playerFields:1,enemyFields:0,exhausted:false,round:1,rule:'gabbie',duelWinner:'player',conquestEffect:'win'};
  expect(firstActMatchOutcome(a).winner).toBe('player');expect(firstActMatchOutcome({...a,playerHP:0}).winner).toBe('enemy');expect(firstActMatchOutcome({...a,conquestEffect:'capture'})).toBeNull();
 });
 it('real duel resolution emits copy identity and effective field for the transaction ledger',()=>{
  let r=until('A02-piane');r=reduce(r,{type:'START',nodeId:'A02-piane'});const cfg=firstActDuelConfig(r),p=cfg.startOptions.fixedHands.playerHand[1],e=cfg.startOptions.fixedHands.enemyHand[0];
  const {battleResult:b}=computeDuelResolution({field:campaignField(CAGES[0]),selectedAgent:p,enemyAgent:e,selectedFocus:10,enemySelectedFocus:0,playerHP:10,enemyHP:10,playerFocus:10,enemyFocus:10,playerUsedCards:[],enemyUsedCards:[],isPlayerFirst:true,lastWinner:null,playerArmyBonuses:{},enemyArmyBonuses:{},playerToxin:null,enemyToxin:null,roundNumber:1,conqueredFields:{},playerHand:cfg.startOptions.fixedHands.playerHand,enemyHand:cfg.startOptions.fixedHands.enemyHand,currentFieldIndex:0,campaign:cfg.campaignDuelMod});
  expect(b.campaignProgress).toMatchObject({key:'0:1',phase:0,round:1,playerId:p.id,enemyId:e.id,fieldId:CAGES[0],winner:'player',conquered:true});
 });
 it('AI simulations respect Quesito, capture restrictions and player initiative in cages',()=>{
  const mod={firstAct:true,cael:true,winRule:'gabbie',alwaysPlayerFirst:true,revealRounds:[1,1,1,1]};
  const simulation={winner:'player',aiHpAfter:10,playerHpAfter:10,aiFieldsAfter:0,playerFieldsAfter:1,aiCardsRemaining:1,playerCardsRemaining:1,battleResult:{resolvedField:{campaignEffect:'win'}}};
  expect(resolveTerminalStatus({campaignDuelMod:mod,roundNumber:1},simulation)).toBe('ai_loss_cards');
  expect(resolveTerminalStatus({campaignDuelMod:mod,roundNumber:1},{...simulation,battleResult:{resolvedField:{campaignEffect:'capture'}}})).toBeNull();
  const state={roundNumber:1,isPlayerFirst:true,playerHP:10,aiHP:10,playerRemainingCardIds:['p','p2'],aiRemainingCardIds:['e','e2'],_refs:{campaignDuelMod:mod,battlefields:[{id:QUESTION}]}};
  const projected=projectPostDuelState(state,simulation,{cardId:'e',fieldIndex:0},{cardId:'p'});
  expect(projected.terminalStatus).toBe('ai_loss_cards');expect(projected.isPlayerFirst).toBe(true);
  const classic={campaignDuelMod:{...mod,winRule:'classic'},roundNumber:3};
  expect(resolveTerminalStatus(classic,{...simulation,playerFieldsAfter:3,battleResult:{resolvedField:{campaignEffect:'capture'}}})).toBeNull();
 });

});
