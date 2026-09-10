import {describe,it,expect} from 'vitest';
import {computeDuelResolution} from './duelResolve.js';
import {firstActCard,campaignField,codes,TOWER_ID,POWER_PACKAGES,NASCENTE} from '../campaign/data/firstAct.js';
import {createFirstActRun,nascenteCard} from '../campaign/state/firstActState.js';
import {calcInitialBonuses} from '../utils/onlineMatch.js';
const card=code=>firstActCard(codes(code)[0]);
const plain={id:99999,name:'Avversario',army:'test',league:2,power:3,damage:2,ability:null};
function duel(overrides={}){
 const p=overrides.selectedAgent||plain,e=overrides.enemyAgent||card('V01');
 return computeDuelResolution({field:campaignField(12),selectedAgent:p,enemyAgent:e,selectedFocus:2,enemySelectedFocus:2,playerHP:25,enemyHP:25,playerFocus:18,enemyFocus:18,playerUsedCards:[],enemyUsedCards:[],isPlayerFirst:true,lastWinner:null,playerArmyBonuses:{},enemyArmyBonuses:{[e.army]:true},playerToxin:null,enemyToxin:null,roundNumber:1,conqueredFields:{},playerHand:[p],enemyHand:[e,card('V02')],currentFieldIndex:0,campaign:{firstAct:true,previousBonus:{player:false,enemy:false}},...overrides}).battleResult;
}
describe('first act engine integration',()=>{
 it('Staffetta works first duel and only with an actual previous bonus thereafter',()=>{
  expect(duel().enemyPower).toBe(4);
  expect(duel({enemyUsedCards:[77],roundNumber:2}).enemyPower).toBe(3);
  expect(duel({enemyUsedCards:[77],roundNumber:2,campaign:{firstAct:true,previousBonus:{enemy:true}}}).enemyPower).toBe(4);
 });
 it('tower satisfies Staffetta without bypassing bonus eligibility or blocks',()=>{
  const v={field:campaignField(TOWER_ID),enemyUsedCards:[77],roundNumber:2};
  expect(duel(v).enemyPower).toBe(4);
  expect(duel({...v,enemyArmyBonuses:{}}).enemyPower).toBe(3);
  const block={...plain,ability:{trigger:null,effect:'blockBonus',value:null}};
  const r=duel({...v,selectedAgent:block});expect(r.enemyPower).toBe(3);expect(r.previousBonus.enemy).toBe(false);
 });
 it('Terraformare uses Resistenza at normal timing and stops when the power is blocked',()=>{
  const options={enemyAgent:card('G03'),enemyUsedCards:[77],roundNumber:2,conqueredFields:{1:{winner:'player'}}};
  expect(duel(options).resolvedField.id).toBe(TOWER_ID);
  expect(duel({...options,conqueredFields:{}}).resolvedField.id).toBe(12);
  expect(duel({...options,selectedAgent:{...plain,ability:{effect:'blockAbility',trigger:null,value:null}}}).resolvedField.id).toBe(12);
 });
 it('removes only the outgoing continuous field contribution',()=>{
  const r=duel({field:campaignField(1),enemyAgent:card('G03'),conqueredFields:{1:{winner:'player'}},selectedAgent:{...plain,ability:{trigger:null,effect:'power',value:2}}});
  expect(r.playerPower).toBe(5);expect(r.enemyPower).toBe(4);expect(r.resolvedField.id).toBe(TOWER_ID);
 });
 it('can leave a Temple without erasing an independent bonus block',()=>{
  const opts={field:campaignField(6),enemyAgent:card('G03'),conqueredFields:{1:{winner:'player'}}};
  expect(duel(opts).enemyPower).toBe(4);
  expect(duel({...opts,selectedAgent:{...plain,ability:{trigger:null,effect:'blockBonus',value:null}}}).enemyPower).toBe(3);
 });
 it('future destinations use their phase and do not replay setup-only swaps',()=>{
  const transform=id=>({...plain,ability:{trigger:null,effect:'terraform',value:id}});
  const before=duel({selectedAgent:transform(7)});expect(before.playerPower).toBe(3);
  const arena=duel({selectedAgent:transform(3),enemyAgent:{...plain,power:2,ability:{trigger:null,effect:'power',value:5}}});expect(arena.enemyPower).toBe(2);
  const mine=duel({selectedAgent:{...transform(4),power:10},playerHP:10});expect(mine.finalPlayerHP).toBe(12);
 });
 it.each(POWER_PACKAGES.map(p=>[p.id]))('resolves initial and evolved package %s',(id)=>{
  for(const evolution of [null,'power']){
   const r=createFirstActRun();r.nascente={...r.nascente,packageId:id,evolution};
   const result=duel({selectedAgent:nascenteCard(r),conqueredFields:{1:{winner:'enemy'}},playerHP:10,isPlayerFirst:id==='G2'||id==='B1'?false:true});
   expect(Number.isFinite(result.finalPlayerHP)).toBe(true);expect(Number.isFinite(result.playerPower)).toBe(true);
  }
 });
 it('Colosso reaching zero PV cannot recover at the Mine or deal subsequent damage',()=>{
  const run=createFirstActRun();run.nascente.packageId='O1';
  const r=duel({selectedAgent:nascenteCard(run),field:campaignField(4),selectedFocus:10,enemySelectedFocus:1,playerHP:3});
  expect(r.campaignTerminal.playerHP).toBe(0);expect(r.finalPlayerHP).toBe(0);expect(r.finalEnemyHP).toBe(25);
 });
 it('ordinary lethal damage ends before the Mine heals the winning side',()=>{
  const r=duel({selectedAgent:{...plain,power:10,damage:3},field:campaignField(4),enemyHP:2,playerHP:10});
  expect(r.finalEnemyHP).toBe(0);expect(r.finalPlayerHP).toBe(10);
 });
 it('plans modify only the first matching ordinary damage in a phase',()=>{
  const p={...plain,power:10,damage:3};const base={selectedAgent:p,enemyArmyBonuses:{}};
  expect(duel({...base,campaign:{firstAct:true,plan:'tenuta'}}).damageDealt).toBe(2);
  expect(duel({...base,campaign:{firstAct:true,plan:'tenuta',planUsed:true}}).damageDealt).toBe(3);
 });
});
