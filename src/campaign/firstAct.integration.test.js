import { describe,it,expect } from 'vitest';
import { createFirstActRun,firstActReducer as reduce,availableFirstActNodes,runCard,runLeague,legalArmy,transformationPool,previewFirstActChoice,assertFirstActRun } from './state/firstActState.js';
import { FIRST_ACT_STAGES,firstActNode,NASCENTE,codes,POWER_PACKAGES,TOWER_ID,FIRST_ACT_NODES,validateFirstActData } from './data/firstAct.js';
import { firstActDuelConfig,firstActMatchOutcome,revealedAt } from './logic/firstActBattle.js';
import { restartCampaignEncounter } from './logic/missionAdapter.js';
import { computeDuelResolution } from '../game/duelResolve.js';
import { calcInitialBonuses } from '../utils/onlineMatch.js';
function result(r,winner='player',playerHP=22,enemyHP=20){return reduce(r,{type:'RESULT',attempt:r.active.id,phase:r.active.phase,winner,playerHP,enemyHP});}
function win(r,id=availableFirstActNodes(r)[0].id){r=reduce(r,{type:'START',nodeId:id});while(r.active)r=result(r);return reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});}
function until(id,choices={}){
 let r=createFirstActRun({seed:31});
 while(!availableFirstActNodes(r).some(n=>n.id===id)){
  const n=availableFirstActNodes(r)[0];
  if(n.kind==='event'){r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:choices[n.id]|| (n.id==='E06'?'liberi':'conserva')});}
  else r=win(r);
 }
 return r;
}
describe('Atto I 0.25',()=>{
 it('progresses both branches with and without F2, grows distinct legal armies and pays once',()=>{
  for(const alternate of [false,true])for(const skip of [false,true]){
   let r=createFirstActRun({seed:32});
   while(!r.outcome){
    const ns=availableFirstActNodes(r),n=ns[alternate?ns.length-1:0];
    if(n.id==='F2'&&skip){r=reduce(r,{type:'SKIP'});continue;}
    if(n.kind==='event'){r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:n.id==='E06'?'trattenuti':'conserva'});}
    else r=win(r,n.id);
    expect(runLeague(r)).toBeLessThanOrEqual(30);expect(new Set(r.deck).size).toBe(r.deck.length);
   }
   expect(r.completed).toBe(skip?17:18);expect(r.slots).toBe(10);expect(r.plans).toEqual({});
   expect(()=>reduce(r,{type:'REWARD',cardId:codes('V02')[0]})).toThrow();
  }
 });
 it('starts with one unpowered 2/2, 10 PV/FC and the victory field',()=>{
  let r=createFirstActRun({seed:1});expect(runCard(r,NASCENTE)).toMatchObject({power:2,damage:2,ability:null,league:2});
  r=reduce(r,{type:'START',nodeId:'I1'});const cfg=firstActDuelConfig(r);
  expect(cfg.campaignDuelMod).toMatchObject({playerLife:10,enemyLife:10,playerFocus:10,enemyFocus:10,winRule:'varco'});
  expect(cfg.startOptions.fixedHands.playerHand).toHaveLength(1);
 });
 it('uses classic field timing: fourth at round 2, fifth at round 3',()=>{
  for(const node of FIRST_ACT_NODES.filter(n=>n.roster)){
   expect([1,2,3,4,5].map(round=>revealedAt(node.revealRounds,round))).toEqual([1,2,3,4,5].map(round=>Math.min(node.fieldIds.length,round+2)));
  }
 });
 it('keeps the branch after defeat and excludes stale results',()=>{
  let r=until('I5A');r=reduce(r,{type:'START',nodeId:'I5B'});const attempt=r.active.id;r=result(r,'enemy');
  expect(availableFirstActNodes(r).map(n=>n.id)).toEqual(['I5B']);
  expect(reduce(r,{type:'RESULT',attempt,phase:0,winner:'player',playerHP:20,enemyHP:0})).toBe(r);
  expect(r.plans).toEqual({});
 });
 it('keeps hands stable through retry and deck reordering',()=>{
  let r=until('I7');r=reduce(r,{type:'START',nodeId:'I7'});const a=r.active;r=result(r,'draw');r=reduce(r,{type:'SET_DECK',deck:[...r.deck].reverse()});r=reduce(r,{type:'START',nodeId:'I7'});
  expect(r.active.playerSquads).toEqual(a.playerSquads);expect(r.active.enemySquads).toEqual(a.enemySquads);expect(r.active.opening).toEqual(a.opening);
 });
 it('boss preserves PV, replaces all hands, resets FC and returns only N01',()=>{
  let r=until('I12');r=reduce(r,{type:'START',nodeId:'I12'});const a=r.active;
  expect(a.playerSquads[0]).toContain(NASCENTE);expect(new Set(a.playerSquads.flat()).size).toBe(r.deck.length);
  r=result(r,'player',17,9);expect(r.active.phase).toBe(1);expect(r.pendingReward).toBeNull();
  const cfg=firstActDuelConfig(r);expect(cfg.campaignDuelMod).toMatchObject({playerLife:17,enemyLife:9,playerFocus:18,enemyFocus:20});
  expect(a.enemySquads[0].filter(id=>a.enemySquads[1].includes(id))).toEqual(codes('N01'));
  r=result(r);expect(r.pendingReward.offer).not.toContain(codes('N01')[0]);
 });
 it('annihilation skips the second squad, defeats and draws never enter it',()=>{
  for(const winner of ['player','enemy','draw']){
   let r=until('I12');r=reduce(r,{type:'START',nodeId:'I12'});r=result(r,winner,winner==='player'?15:0,winner==='enemy'?15:0);
   expect(r.active).toBeNull();expect(Boolean(r.pendingReward)).toBe(winner==='player');
  }
 });
 it.each(POWER_PACKAGES.map(p=>[p.id]))('keeps %s at L3 with a chosen final stat and preserves independent stats on change',(id)=>{
  let r=until('E01');r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:id});expect(runCard(r,NASCENTE).league).toBe(2);
  while(!availableFirstActNodes(r).some(n=>n.id==='E03')){
   const n=availableFirstActNodes(r)[0];if(n.kind==='event'){r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:n.id==='E02'?'damage':'liberi'});}else r=win(r);
  }
  r=reduce(r,{type:'ENTER_EVENT'});const before=runCard(r,NASCENTE);
  for(const choice of ['finalPower','finalDamage']){const p=previewFirstActChoice(r,choice),card=runCard(p,NASCENTE);expect(card.league).toBe(3);expect(card.ability).toEqual(before.ability);expect(card.power).toBe(before.power+Number(choice==='finalPower'));expect(card.damage).toBe(before.damage+Number(choice==='finalDamage'));expect(legalArmy(p)).not.toBeNull();}
  expect(()=>previewFirstActChoice(r,'evolve')).toThrow();
  const changed=previewFirstActChoice(r,'C1');expect(runCard(changed,NASCENTE)).toMatchObject({power:2,damage:3,league:3});
 });
 it('matures only after a subsequent completed stage and transforms uniformly within league',()=>{
  let r=win(createFirstActRun({seed:1}));const c=r.copies[0];expect(transformationPool(r,c.uid)).toEqual([]);
  r=win(r);const pool=transformationPool(r,c.uid);expect(pool.length).toBeGreaterThan(0);
  const next=reduce(r,{type:'TRANSFORM',uid:c.uid});expect(pool).toContain(next.copies[0].cardId);expect(runCard(next,next.copies[0].cardId).league).toBe(2);
  expect(()=>reduce(next,{type:'TRANSFORM',uid:c.uid})).toThrow();
 });
 it('snapshots survive serialization without reapplying an outcome',()=>{
  let r=until('I6');r=reduce(r,{type:'START',nodeId:'I6'});r=reduce(r,{type:'SNAPSHOT',attempt:r.active.id,phase:0,snapshot:{roundNumber:3,playerHP:19,campaignDuelMod:{previousBonus:{player:true}}}});
  const loaded=assertFirstActRun(JSON.parse(JSON.stringify(r)));expect(loaded.active.snapshot).toEqual(r.active.snapshot);
 });
 it('zero PV precedes victory, reduced formats wait and use fields before PV',()=>{
  const base={playerHP:0,enemyHP:0,playerFields:3,enemyFields:0,exhausted:true,round:3,rule:'territory'};
  expect(firstActMatchOutcome(base).winner).toBe('draw');
  expect(firstActMatchOutcome({...base,playerHP:1,enemyHP:25}).winner).toBe('player');
  expect(firstActMatchOutcome({...base,playerHP:1,enemyHP:25,exhausted:false})).toBeNull();
 });
 it('rewards originate in the encountered roster including duplicates',()=>{
  for(let seed=1;seed<30;seed++){
   let r=createFirstActRun({seed});r=win(r);r=win(r);r=reduce(r,{type:'START',nodeId:'I3'});r=result(r);
   expect(firstActNode('I3').roster).toContain(r.pendingReward.offer[0]);
  }
 });
});

it('rewinds three completed stages including powers, copies and branch decisions',()=>{
 let r=until('I6',{E01:'O1'});const completed=r.completed;
 r=reduce(r,{type:'START',nodeId:'I6'});r=result(r,'enemy',0,20);
 const back=reduce(r,{type:'REWIND'});
 expect(back.completed).toBe(completed-3);expect(back.stage).toBe(3);expect(back.nascente.packageId).toBeNull();expect(back.plans).toEqual({});expect(back.slots).toBe(4);expect(back.copies.length).toBeLessThan(r.copies.length);
});
it('freezes E06 mature-copy eligibility and retains preparation through failed attempts',()=>{
 let r=until('E06');const id=codes('V01')[0];
 r={...r,copies:[...r.copies,{uid:'extraA',cardId:id,acquiredAt:1},{uid:'extraB',cardId:id,acquiredAt:2}]};
 r=reduce(r,{type:'ENTER_EVENT'});expect(r.pendingEvent.communion).toBe(true);
 expect(()=>reduce(r,{type:'TRANSFORM',uid:'extraA'})).toThrow();
 r=reduce(r,{type:'CHOICE',choice:'comunione'});expect(r.flags.COMUNIONE_VALLO).toBe(true);
 r=reduce(r,{type:'START',nodeId:'I9A'});expect(firstActDuelConfig(r).campaignDuelMod.playerFocus).toBe(20);
 r=result(r,'draw');expect(r.preparation.focus).toBe(2);r=win(r,'I9A');expect(r.preparation).toBeNull();
});
it('empty transformation pools preserve the original copy and pending rewards survive reload',()=>{
 let r=until('I6');r=reduce(r,{type:'START',nodeId:'I6'});r=result(r);
 const loaded=JSON.parse(JSON.stringify(r));expect(loaded.pendingReward).toEqual(r.pendingReward);
 r=reduce(loaded,{type:'REWARD',cardId:loaded.pendingReward.offer[0]});
 const c=r.copies.find(c=>transformationPool(r,c.uid).length);
 const ids=transformationPool(r,c.uid);r={...r,copies:[...r.copies,...ids.map((cardId,i)=>({uid:`full${i}`,cardId,acquiredAt:0}))]};
 expect(transformationPool(r,c.uid)).toEqual([]);expect(()=>reduce(r,{type:'TRANSFORM',uid:c.uid})).toThrow();expect(r.copies.find(x=>x.uid===c.uid).cardId).toBe(c.cardId);
});
it('rejects incomplete encounter data before starting a run',()=>{
 const data=JSON.parse(JSON.stringify(FIRST_ACT_NODES));data[0].roster=[-1];expect(()=>validateFirstActData(data)).toThrow(/Lega/);
 const calendar=JSON.parse(JSON.stringify(FIRST_ACT_NODES));calendar.find(n=>n.id==='I4').revealRounds=[1,1,1,5];expect(()=>validateFirstActData(calendar)).toThrow(/round 4/);
});

it('retry after losing boss phase two restarts phase one with full resources and fresh attempt',()=>{
 let r=until('I12');r=reduce(r,{type:'START',nodeId:'I12'});const original=r.active;
 r=result(r,'player',7,4);r=result(r,'enemy',0,3);
 r=restartCampaignEncounter(r,null,firstActNode('I12'));
 expect(r.active.phase).toBe(0);expect(r.active.pv).toBeNull();expect(r.active.snapshot).toBeNull();expect(r.active.id).toBeGreaterThan(original.id);expect(r.active.playerSquads).toEqual(original.playerSquads);
 expect(firstActDuelConfig(r).campaignDuelMod.playerLife).toBe(25);expect(r.pendingReward).toBeNull();
});
it('test victory completes even a multi-phase encounter, but cannot duplicate rewards or skip a question',()=>{
 let r=until('I12');r=reduce(r,{type:'TEST_WIN',nodeId:'I12'});expect(r.active).toBeNull();expect(r.pendingReward.nodeId).toBe('I12');
 expect(()=>reduce(r,{type:'TEST_WIN',nodeId:'I12'})).toThrow();
 expect(()=>reduce(until('E01'),{type:'TEST_WIN',nodeId:'E01'})).toThrow();
});

it('draws fresh fields on retry while keeping saved attempts stable and special timing intact',()=>{
 for (const nodeId of ['I2','I3','I4','I7','F1','I12']) {
  let r=until(nodeId);r=reduce(r,{type:'START',nodeId});
  const first=structuredClone(r.active.fieldSquads);
  expect(firstActDuelConfig(JSON.parse(JSON.stringify(r))).campaignDuelMod.fixedFields.map(f=>f.id)).toEqual(first[0]);
  expect(assertFirstActRun(r)).toBe(r);
  for(const ids of first){
   expect(new Set(ids).size).toBe(firstActNode(nodeId).fieldIds.length);
   if(firstActNode(nodeId).fieldIds.includes(TOWER_ID))expect([3,4]).toContain(ids.indexOf(TOWER_ID));
  }
  const legacy=structuredClone(r);delete legacy.active.fieldSquads;
  expect(firstActDuelConfig(legacy).campaignDuelMod.fixedFields.map(f=>f.id)).toEqual(firstActNode(nodeId).fieldIds);
  r=result(r,'draw');r=reduce(r,{type:'START',nodeId});
  expect(r.active.fieldSquads[0]).not.toEqual(first[0]);
  expect(r.active.snapshot).toBeNull();
  expect(firstActDuelConfig(r).campaignDuelMod.fixedFields.map(f=>f.id)).toEqual(r.active.fieldSquads[0]);
 }
});
it('preserves phase-specific fields and PV across the boss squad transition',()=>{
 let r=until('I12');r=reduce(r,{type:'START',nodeId:'I12'});const fields=structuredClone(r.active.fieldSquads);
 expect(fields[0]).not.toEqual(fields[1]);r=result(r,'player',15,12);
 expect(r.active.fieldSquads).toEqual(fields);
 expect(firstActDuelConfig(r).campaignDuelMod.fixedFields.map(f=>f.id)).toEqual(fields[1]);
 expect(r.active.pv).toEqual({player:15,enemy:12});
});

it('reads old E03 upgrades as a single stat without reaching L4',()=>{
 for(const evolution of ['power','damage']){const r=createFirstActRun();r.nascente={...r.nascente,packageId:'C1',statTaken:true,damage:1,evolution};
 expect(runCard(r,NASCENTE)).toMatchObject({league:3,power:evolution==='power'?3:2,damage:evolution==='damage'?4:3,ability:{effect:'power',value:2}});
 }
});
it('offers the final stat choice even with no power and consumes the event once',()=>{
 let r=until('E03');r=reduce(r,{type:'ENTER_EVENT'});
 const before=runCard(r,NASCENTE);r=reduce(r,{type:'CHOICE',choice:'finalDamage'});
 expect(runCard(r,NASCENTE)).toMatchObject({league:before.league,power:before.power,damage:before.damage+1,ability:null});
 expect(()=>reduce(r,{type:'CHOICE',choice:'finalPower'})).toThrow();
});


it('counts terminal encounters once, including retries and abandonments, but not events or intermediate phases',()=>{
 let r=createFirstActRun({seed:1});
 for(const winner of ['enemy','draw','player']) {
  r=reduce(r,{type:'START',nodeId:'I1'});const action={type:'RESULT',attempt:r.active.id,phase:0,winner,playerHP:10,enemyHP:9};
  r=reduce(r,action);expect(reduce(r,action)).toBe(r);
 }
 expect(r.stats).toEqual({wins:1,losses:1,draws:1,transformed:0,partial:false});
 r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});expect(r.stats.wins).toBe(1);
 r=reduce(r,{type:'START',nodeId:'I2'});r=reduce(r,{type:'ABANDON'});expect(r.stats.losses).toBe(2);expect(reduce(r,{type:'ABANDON'})).toBe(r);
 let boss=until('I12');const before={...boss.stats};boss=reduce(boss,{type:'START',nodeId:'I12'});boss=result(boss);expect(boss.stats).toEqual(before);
 boss=result(boss);expect(boss.stats.wins).toBe(before.wins+1);
 let event=until('E01');const stats={...event.stats};event=reduce(event,{type:'ENTER_EVENT'});event=reduce(event,{type:'CHOICE',choice:'C1'});expect(event.stats).toEqual(stats);
});
it('records transformations and retains lifetime counters across rewind',()=>{
 let r=until('I6');const copy=r.copies.find(c=>transformationPool(r,c.uid).length);
 r=reduce(r,{type:'TRANSFORM',uid:copy.uid});expect(r.stats.transformed).toBe(1);
 r=reduce(r,{type:'START',nodeId:'I6'});r=result(r,'enemy');const stats={...r.stats};
 r=reduce(r,{type:'REWIND'});expect(r.stats).toEqual(stats);
});

it('awards exactly one copy across runs, allowing vacant slots without replacing duplicates',()=>{
 let duplicates=0;
 for(let seed=1;seed<=12;seed++) {
  let r=createFirstActRun({seed});
  while(!r.outcome) {
   const nodes=availableFirstActNodes(r),node=nodes[seed%nodes.length];
   if(node.optional&&seed%2){r=reduce(r,{type:'SKIP'});continue;}
   if(node.kind==='event'){r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:node.id==='E06'?'liberi':'conserva'});continue;}
   const before=r.copies;
   r=reduce(r,{type:'START',nodeId:node.id});
   expect(r.active.playerSquads.flat().every(id=>r.deck.includes(id))).toBe(true);
   while(r.active) r=result(r);
   const reward=r.pendingReward.offer[0],wasDuplicate=before.some(c=>c.cardId===reward);
   r=reduce(r,{type:'REWARD',cardId:reward});
   expect(r.copies.slice(0,before.length)).toEqual(before);expect(r.copies).toHaveLength(before.length+1);
   expect(r.copies.at(-1).cardId).toBe(reward);expect(r.nextCopy).toBe(r.copies.length+1);
   expect(r.deck.length).toBe(Math.min(r.slots,new Set([NASCENTE,...r.copies.map(c=>c.cardId)]).size));
   if(wasDuplicate)duplicates++;
  }
 }
 expect(duplicates).toBeGreaterThan(0);
});
it('uses only owned agents in both boss phases when most army slots are vacant',()=>{
 let r=until('I12');const ids=codes('V01 V02');
 r={...r,copies:r.copies.filter(c=>ids.includes(c.cardId)),deck:[NASCENTE,...ids]};assertFirstActRun(r);
 r=reduce(r,{type:'START',nodeId:'I12'});
 expect(r.active.playerSquads.map(s=>s.length)).toEqual([2,1]);
 expect(new Set(r.active.playerSquads.flat()).size).toBe(3);
 r=result(r);expect(r.active.phase).toBe(1);expect(firstActDuelConfig(r).startOptions.fixedHands.playerHand).toHaveLength(1);
 r=result(r);r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});expect(r.outcome).toBe('won');
});
it('fills a vacant slot when transforming a reserve duplicate into a new identity',()=>{
 let r=until('I5A');const id=codes('V02')[0];
 r={...r,copies:[{uid:'x',cardId:id,acquiredAt:0},{uid:'y',cardId:id,acquiredAt:0}],deck:[NASCENTE,id]};
 const next=reduce(r,{type:'TRANSFORM',uid:'y'});
 expect(next.copies).toHaveLength(2);expect(next.deck).toHaveLength(3);expect(next.deck).toContain(id);assertFirstActRun(next);
});
