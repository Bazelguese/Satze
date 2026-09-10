// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {FirstActHub} from './FirstActHub.jsx';
import {CampaignSaveSlots} from './CampaignSaveSlots.jsx';
import {createFirstActRun,firstActReducer as reduce,availableFirstActNodes} from '../../campaign/state/firstActState.js';
import {loadCampaignRun,saveCampaignRun} from '../../campaign/state/persistence.js';
import {firstActDuelConfig,firstActMatchOutcome} from '../../campaign/logic/firstActBattle.js';
import {useGameState} from '../../hooks/useGameState.js';
import {useGameFlow} from '../../hooks/useGameFlow.js';
import {useBattle} from '../../hooks/useBattle.js';
import {useFirstActPersistence,restoreFirstActSnapshot} from '../../hooks/useFirstActPersistence.js';
import {useCampaignGameOutcome} from '../../hooks/useCampaignGameOutcome.js';
import {ALL_BATTLEFIELDS} from '../../data/battlefields.js';
let root,host;
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
const render=x=>act(()=>root.render(x));
const click=text=>act(()=>{const b=[...host.querySelectorAll('button')].find(b=>b.textContent.includes(text));expect(b,`button ${text}`).toBeTruthy();b.click();});
function atEvent(){let r=createFirstActRun({seed:31});for(let i=0;i<4;i++){const n=availableFirstActNodes(r)[0];r=reduce(r,{type:'START',nodeId:n.id});r=reduce(r,{type:'RESULT',attempt:r.active.id,phase:0,winner:'player',playerHP:10,enemyHP:9});r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});}return reduce(r,{type:'ENTER_EVENT'});}
it('creates a new-format slot with one unpowered Nascente and launches real useGameFlow',()=>{
 const chosen=vi.fn();render(React.createElement(CampaignSaveSlots,{onSlotChosen:chosen,onBack:()=>{}}));click('Nuova campagna');expect(host.textContent).not.toContain('Scegli l’Impronta');click('Inizia il cammino');expect(chosen).toHaveBeenCalledWith(0);expect(loadCampaignRun(0).model).toBe('first-act');
 const setters={},state=new Proxy({},{get:(_,k)=>setters[k]||=(vi.fn())});
 function Harness(){const flow=useGameFlow(state);return React.createElement(FirstActHub,{onBack:()=>{}, onStartMission:(m,r)=>{const c=firstActDuelConfig(r);flow.startGame(c.playerArmy,c.playerDeckCards,'campaign',c.difficulty,ALL_BATTLEFIELDS,c.enemyArmy,c.enemyDeckIds,c.campaignDuelMod,c.startOptions);}});}
 render(React.createElement(Harness));click('Affronta l’incontro');click('Entra subito');expect(host.querySelector('[role=alert]')).toBeNull();expect(setters.setPlayerHand.mock.calls.at(-1)[0]).toHaveLength(1);expect(setters.setIsPlayerFirst).toHaveBeenLastCalledWith(false);expect(setters.setPlayerHP).toHaveBeenLastCalledWith(10);expect(setters.setPlayerFocus).toHaveBeenLastCalledWith(10);expect(setters.setBattlefields.mock.calls.at(-1)[0][0].name).toBe('Il primo varco');
});
it('asks both questions, previews Colosso and saves it once',()=>{
 saveCampaignRun(atEvent(),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Sul peso che accetto');click('Accetto il prezzo');expect(host.textContent).toContain('−3 PV a te');click('Conferma risposta');expect(loadCampaignRun(0).nascente.packageId).toBe('O1');expect(loadCampaignRun(0).stage).toBe(5);
});
it('a failed write keeps the event unresolved and displays the error',()=>{
 saveCampaignRun(atEvent(),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Per ora, ciò che sono basta');vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});click('Conferma risposta');expect(host.querySelector('[role=alert]').textContent).toContain('Salvataggio');expect(loadCampaignRun(0).pendingEvent.id).toBe('E01');
});
it('persists real duel result and restores it without spending FC twice',()=>{
 let r=reduce(createFirstActRun({seed:2}),{type:'START',nodeId:'I1'});saveCampaignRun(r,0);
 let api;
 function Harness(){const state=useGameState(),flow=useGameFlow(state);const anim=new Proxy({},{get:()=>vi.fn()});const battle=useBattle(state,anim);useFirstActPersistence(state);useCampaignGameOutcome({...state});api={state,flow,battle};return null;}
 render(React.createElement(Harness));
 const config=firstActDuelConfig(r);
 act(()=>{api.state.setCampaignLevel({node:'I1',campaignAttempt:r.active.id,campaignPhase:0});api.flow.startGame(config.playerArmy,config.playerDeckCards,'campaign',config.difficulty,ALL_BATTLEFIELDS,config.enemyArmy,config.enemyDeckIds,config.campaignDuelMod,config.startOptions);});
 act(()=>{api.state.setGamePhase('selectAgent');api.state.setCurrentFieldIndex(0);api.state.setSelectedAgent(api.state.playerHand[0]);api.state.setEnemyAgent(api.state.enemyHand[0]);api.state.setSelectedFocus(10);api.state.setEnemySelectedFocus(10);});
 act(()=>api.battle.resolveBattle());
 expect(api.state.gamePhase).toBe('result');const saved=loadCampaignRun(0);expect(saved.active.snapshot.playerUsedCards).toHaveLength(1);expect(saved.active.snapshot.playerFocus).toBe(0);
 act(()=>restoreFirstActSnapshot(api.state,saved.active.snapshot));expect(api.state.playerFocus).toBe(0);expect(api.state.playerUsedCards).toHaveLength(1);
 const result=api.state.battleResult;expect(result.winner).toBe('player');expect(result.skipConquest).toBeFalsy();
 const outcome=firstActMatchOutcome({playerHP:result.finalPlayerHP,enemyHP:result.finalEnemyHP,playerFields:result.winner==='player'?1:0,enemyFields:result.winner==='enemy'?1:0,exhausted:true,round:1,rule:config.campaignDuelMod.winRule});
 act(()=>{api.state.setGameResult(outcome);api.state.setGamePhase('gameOver');});expect(loadCampaignRun(0).pendingReward.offer).toHaveLength(1);
});

it('restores a committed terminal phase with its result rather than applying aftermath again',()=>{
 const state={setPendingDuelPhase:vi.fn(),setGameResult:vi.fn(),setPlayerHP:vi.fn()};
 restoreFirstActSnapshot(state,{gamePhase:'gameOver',gameResult:{winner:'enemy'},playerHP:0});
 expect(state.setPendingDuelPhase).toHaveBeenCalledWith('gameOver');expect(state.setGameResult).toHaveBeenCalledWith({winner:'enemy'});expect(state.setPlayerHP).toHaveBeenCalledWith(0);
});

it('keeps the illustrated route, future sections and card portraits in the new act',()=>{
 saveCampaignRun(createFirstActRun({seed:2}),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelector('.cs-map-trails path')).toBeTruthy();
 expect(host.querySelectorAll('.cs-node-medallion')).toHaveLength(7);
 expect(host.querySelector('.cs-encounter-art img')).toBeTruthy();
 expect(host.querySelector('.cs-hero-summary img')).toBeTruthy();
 expect(host.querySelector('.cs-first-map')).toBeNull();
 const current=host.querySelector('.cs-map-node.is-current');expect(current.disabled).toBe(false);expect(current.textContent).toContain('Primo contatto');
 click('Tappe 13');const branches=[...host.querySelectorAll('.cs-map-node')].slice(0,2);expect(branches[0].style.top).not.toBe(branches[1].style.top);expect(host.querySelectorAll('.cs-node-medallion')).toHaveLength(7);expect([...host.querySelectorAll('.cs-map-node')].every(b=>b.disabled)).toBe(true);
 click('Tappe 1–6');expect(host.querySelector('.cs-map-node.is-current').textContent).toContain('Primo contatto');
 click('Armata e riserva');expect(host.querySelector('.cs-card-roster .cs-roster-card')).toBeTruthy();
});
it('opens the current map section after progression and locks the other branch during a saved attempt',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});r=reduce(r,{type:'START',nodeId:'I5A'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelectorAll('.cs-map-node.is-current')).toHaveLength(1);expect(host.querySelector('.cs-map-node.is-current').disabled).toBe(true);
 expect(host.querySelector('.cs-map-node.is-current').textContent).toContain('6');
 r=reduce(r,{type:'RESULT',attempt:r.active.id,phase:0,winner:'player',playerHP:10,enemyHP:8});r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{key:'next-stage',onBack:()=>{}}));expect(host.querySelector('.cs-map-pages [aria-pressed=true]').textContent).toContain('Tappe 7–12');expect(host.querySelector('.cs-map-node.is-current .cs-node-number').textContent).toBe('7');
});
