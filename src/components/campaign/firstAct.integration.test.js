// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {GameViewport} from '../GameViewport.jsx';
import {readFileSync} from 'node:fs';
import {URL as NodeURL} from 'node:url';
const sceneCss=readFileSync(new NodeURL('../../styles/campaign/campaign-scene.css',import.meta.url),'utf8');
const firstActCss=readFileSync(new NodeURL('../../styles/campaign/first-act.css',import.meta.url),'utf8');
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
import {BattlefieldPanel} from '../battle/Battlefield.jsx';
import {campaignDuelAssets} from './CampaignDuelPreload.jsx';
import {FIRST_ACT_NODES,TOWER_ID} from '../../campaign/data/firstAct.js';
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

it('keeps every stage on one scrollable illustrated route',()=>{
 saveCampaignRun(createFirstActRun({seed:2}),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelector('.cs-map-trails path')).toBeTruthy();
 expect(host.querySelectorAll('.cs-node-medallion')).toHaveLength(20);
 expect(host.querySelector('.cs-encounter-art img')).toBeTruthy();
 expect(host.querySelector('.cs-hero-summary img')).toBeTruthy();
 expect(host.querySelector('.cs-first-map')).toBeNull();
 const current=host.querySelector('.cs-map-node.is-current');expect(current.disabled).toBe(false);expect(current.textContent).toContain('Primo contatto');
 expect(host.querySelector('.cs-map-pages')).toBeNull();
 const viewport=host.querySelector('.cs-map-scroll');expect(viewport.tabIndex).toBe(0);
 Object.defineProperty(viewport,'clientWidth',{value:600});Object.defineProperty(viewport,'scrollWidth',{value:2880});viewport.scrollLeft=0;
 act(()=>viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:200,bubbles:true,cancelable:true})));expect(viewport.scrollLeft).toBe(200);
 const branches=[...host.querySelectorAll('.cs-map-node')].filter(b=>b.textContent.includes('Arena del Sole')||b.textContent.includes('Custodia del Vallo'));
 expect(branches[0].style.top).not.toBe(branches[1].style.top);
 expect([...host.querySelectorAll('.cs-map-node')].filter(b=>!b.disabled)).toHaveLength(1);
 click('Armata e riserva');expect(host.querySelector('.cs-card-roster .cs-roster-card')).toBeTruthy();
});
it('scrolls to the current stage after progression and locks the other branch during a saved attempt',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});r=reduce(r,{type:'START',nodeId:'I5A'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelectorAll('.cs-map-node.is-current')).toHaveLength(1);expect(host.querySelector('.cs-map-node.is-current').disabled).toBe(true);
 expect(host.querySelector('.cs-map-node.is-current').textContent).toContain('6');
 r=reduce(r,{type:'RESULT',attempt:r.active.id,phase:0,winner:'player',playerHP:10,enemyHP:8});r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{key:'next-stage',onBack:()=>{}}));expect(host.querySelector('.cs-map-scroll').scrollLeft).toBeGreaterThan(900);expect(host.querySelector('.cs-map-node.is-current .cs-node-number').textContent).toBe('7');
});

it.each(['player','enemy','draw'])('campaign terminal panel has only its dedicated action: %s',winner=>{
 const next=vi.fn(),retry=vi.fn();render(React.createElement(BattlefieldPanel,{gamePhase:'gameOver',gameResult:{winner},isCampaign:true,onMenu:next,onCampaignRetry:retry,onRematch:vi.fn(),onOpenPlaytest:vi.fn(),aiDecisionLog:[{id:1,headline:'IA'}]}));
 const buttons=[...host.querySelectorAll('button')];expect(buttons).toHaveLength(1);expect(buttons[0].textContent.trim()).toBe(winner==='player'?'Prosegui':'Ritenta');
 act(()=>buttons[0].click());expect(winner==='player'?next:retry).toHaveBeenCalledOnce();expect(host.textContent).not.toContain('Ragionamenti');expect(host.textContent).not.toContain('Menù');
});
it('preserves ordinary end-of-match options outside campaign',()=>{
 render(React.createElement(BattlefieldPanel,{gamePhase:'gameOver',gameResult:{winner:'player'},onMenu:()=>{},onRematch:()=>{},aiDecisionLog:[{id:1,headline:'IA'}]}));
 expect(host.textContent).toContain('Menù');expect(host.textContent).toContain('Rematch');expect(host.textContent).toContain('Ragionamenti IA');
});
it('test victory reaches the normal reward and subsequent stage exactly once',()=>{
 saveCampaignRun(createFirstActRun({seed:2}),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Test: vinci incontro');
 expect(loadCampaignRun(0).pendingReward.nodeId).toBe('I1');expect(loadCampaignRun(0).active).toBeNull();
 expect([...host.querySelectorAll('button')].some(b=>b.textContent.includes('Test:'))).toBe(false);
 click('Accogli');expect(loadCampaignRun(0).stage).toBe(1);expect(loadCampaignRun(0).copies).toHaveLength(1);expect(host.querySelector('.cs-map-node.is-current').textContent).toContain('Pattuglia');
});
it('prepares future fields, opponents and transformation cards at campaign entry',()=>{
 const r=createFirstActRun(),assets=campaignDuelAssets(r);
 expect(assets.battlefields.some(f=>f.id===TOWER_ID)).toBe(true);
 for(const n of FIRST_ACT_NODES)for(const id of n.roster||[])expect(assets.preloadCards.some(c=>c.id===id)).toBe(true);
 expect(assets.preloadUrls.filter(u=>u.includes('nascente/'))).toHaveLength(4);
});
it('loaded campaign launches and retries without loading, ordinary duels still load',()=>{
 const setters={},state=new Proxy({},{get:(_,k)=>setters[k]||=vi.fn()});let flow;
 function Harness(){flow=useGameFlow(state);return null;}render(React.createElement(Harness));
 const run=reduce(createFirstActRun(),{type:'START',nodeId:'I1'}),c=firstActDuelConfig(run);
 const launch=(mode,ready)=>act(()=>flow.startGame(c.playerArmy,c.playerDeckCards,mode,c.difficulty,ALL_BATTLEFIELDS,c.enemyArmy,c.enemyDeckIds,c.campaignDuelMod,{...c.startOptions,campaignAssetsReady:ready}));
 launch('campaign',false);expect(setters.setGamePhase).toHaveBeenLastCalledWith('duelLoading');
 launch('campaign',true);expect(setters.setGamePhase).toHaveBeenLastCalledWith('selectField');expect(setters.setPendingDuelPhase).toHaveBeenLastCalledWith(null);
 launch('campaign',true);expect(setters.setGamePhase).toHaveBeenLastCalledWith('selectField');
 launch('classic',true);expect(setters.setGamePhase).toHaveBeenLastCalledWith('duelLoading');
 restoreFirstActSnapshot(state,{gamePhase:'result',playerFocus:0},{campaignAssetsReady:true});expect(setters.setGamePhase).toHaveBeenLastCalledWith('result');expect(setters.setPendingDuelPhase).toHaveBeenLastCalledWith(null);expect(setters.setPlayerFocus).toHaveBeenLastCalledWith(0);
});

it('previews the consumed copy and confirms exactly one random transformation',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Armata e riserva');click('Riserva e trasformazione');
 const before=JSON.parse(JSON.stringify(loadCampaignRun(0)));
 const available=[...host.querySelectorAll('.cs-reserve-list button')].find(b=>b.textContent.includes('Trasformazione disponibile'));
 expect(available).toBeTruthy();act(()=>available.click());
 expect(loadCampaignRun(0)).toEqual(before);
 expect(host.querySelector('.cs-transform-mystery').textContent).toContain('Identità casuale');
 expect(host.querySelector('.cs-transform-pool').querySelector('button')).toBeNull();
 click('Conferma trasformazione casuale');
 const after=loadCampaignRun(0);
 expect(after.copies).toHaveLength(before.copies.length);
 expect(after.copies.filter((c,i)=>c.cardId!==before.copies[i].cardId)).toHaveLength(1);
 expect(host.querySelector('.cs-transform-result').textContent).toContain('TRASFORMAZIONE COMPLETATA');
 expect([...host.querySelectorAll('button')].some(b=>b.textContent==='Conferma trasformazione casuale')).toBe(false);
});
it('does not lose the selected-copy focus on dialog rerenders',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Armata e riserva');click('Riserva e trasformazione');
 const button=host.querySelector('.cs-reserve-list button');button.focus();act(()=>button.click());
 expect(document.activeElement).toBe(button);
 act(()=>button.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it('preloads every random battlefield background before the first duel',()=>{
 const assets=campaignDuelAssets(createFirstActRun({seed:2}));
 for (const field of ALL_BATTLEFIELDS) if(field.bgImage) expect(assets.preloadUrls.some(url=>url.endsWith(field.bgImage.split('/').at(-1)))).toBe(true);
});

it.each([[1920,1080],[1280,720],[2560,1080]])('fits the campaign in the real duel viewport at %s × %s', (width,height)=>{
 vi.stubGlobal('innerWidth',width);vi.stubGlobal('innerHeight',height);
 const style=document.createElement('style');style.textContent=sceneCss+'\n'+firstActCss;document.head.append(style);
 try {
  saveCampaignRun(createFirstActRun({seed:2}),0);
  render(React.createElement(GameViewport,null,React.createElement(FirstActHub,{onBack:()=>{}})));
  const scene=host.querySelector('.campaign-scene'),canvas=scene.parentElement;
  const computed=getComputedStyle(scene);
  expect(computed.width).toBe(canvas.style.width);expect(computed.height).toBe(canvas.style.height);
  expect(computed.overflow).toBe('hidden');
  expect(canvas.style.transform).toBe(`scale(${Math.min(width/1920,height/1080)})`);
  const point=host.querySelector('[data-node-id="I1"]'),medallion=point.querySelector('.cs-node-medallion');
  expect(getComputedStyle(medallion).height).toBe('76px');
  expect(getComputedStyle(point).transform).toBe('translate(-50%,-38px)');
 } finally {style.remove();vi.unstubAllGlobals();}
});
