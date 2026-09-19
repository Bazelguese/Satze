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
 click('Esercito e riserva');expect(host.querySelector('.cs-card-roster .cs-roster-card')).toBeTruthy();
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
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');click('Riserva e trasformazione');
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
 expect(host.querySelector('.cs-transformation.is-changing')).toBeTruthy();
 click('Salta animazione');expect(host.querySelector('.cs-transformation.is-revealed')).toBeTruthy();click('Continua');
 expect(host.querySelector('.cs-transform-result').textContent).toContain('TRASFORMAZIONE COMPLETATA');
 expect([...host.querySelectorAll('button')].some(b=>b.textContent==='Conferma trasformazione casuale')).toBe(false);
});
it('does not lose the selected-copy focus on dialog rerenders',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');click('Riserva e trasformazione');
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

it('reveals a saved transformation after its sequence and never awards it twice',()=>{
 vi.useFakeTimers();
 try {
  let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});saveCampaignRun(r,0);
  render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');click('Riserva e trasformazione');
  const b=[...host.querySelectorAll('.cs-reserve-list button')].find(b=>b.textContent.includes('Trasformazione disponibile'));act(()=>b.click());click('Conferma trasformazione casuale');
  const saved=loadCampaignRun(0);expect(host.querySelector('.cs-transformation.is-changing')).toBeTruthy();
  act(()=>vi.advanceTimersByTime(2399));expect(host.querySelector('.cs-transformation.is-changing')).toBeTruthy();
  act(()=>vi.advanceTimersByTime(1));expect(host.querySelector('.cs-transformation.is-revealed')).toBeTruthy();
  expect(loadCampaignRun(0)).toEqual(saved);click('Chiudi');expect(loadCampaignRun(0)).toEqual(saved);
 } finally {vi.useRealTimers();}
});
it('motion-off transformation reveals immediately and still saves its single result',()=>{
 localStorage.setItem('satze_campaign_motion_v1','off');let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'conserva'});saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');click('Riserva e trasformazione');
 const b=[...host.querySelectorAll('.cs-reserve-list button')].find(b=>b.textContent.includes('Trasformazione disponibile'));act(()=>b.click());click('Conferma trasformazione casuale');
 expect(host.querySelector('.cs-transformation.is-revealed')).toBeTruthy();expect(host.textContent).not.toContain('Salta animazione');
});
it('uses a view transition for campaign progression when supported, respecting motion preference',()=>{
 const transition=vi.fn(callback=>{callback();return {ready:Promise.resolve()};});
 Object.defineProperty(document,'startViewTransition',{value:transition,configurable:true});
 try {
  saveCampaignRun(createFirstActRun({seed:2}),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Test: vinci incontro');expect(transition).toHaveBeenCalledOnce();
  click('Animazioni: sì');click('Accogli');expect(transition).toHaveBeenCalledOnce();expect(loadCampaignRun(0).stage).toBe(1);
 } finally {delete document.startViewTransition;}
});
it('migrates old L4 cards in saved hands and checkpoints without replaying past results',()=>{
 let r=reduce(createFirstActRun({seed:2}),{type:'START',nodeId:'I1'});
 r.nascente={...r.nascente,statTaken:true,power:1,packageId:'C1',evolution:'power'};
 r.active.snapshot={playerHand:[{id:9001,league:4,power:3,damage:2}],selectedAgent:{id:9001,league:4},playerHP:7,roundNumber:2,battleResult:{winner:'player'}};
 r.checkpoints=[{completed:0,state:{...r,active:null,checkpoints:[]}}];saveCampaignRun(r,0);
 const loaded=loadCampaignRun(0);expect(loaded.nascente).toMatchObject({evolution:null,finalStat:'power'});
 expect(loaded.active.snapshot.playerHand[0]).toMatchObject({league:3,power:4,damage:2,ability:{value:2}});
 expect(loaded.active.snapshot.selectedAgent.league).toBe(3);expect(loaded.active.snapshot.playerHP).toBe(7);expect(loaded.active.snapshot.battleResult).toEqual({winner:'player'});
 expect(loaded.checkpoints[0].state.nascente.finalStat).toBe('power');
 saveCampaignRun(loaded,0);expect(loadCampaignRun(0).nascente).toEqual(loaded.nascente);
});

function pendingAt(nodeId) {
 let r=createFirstActRun({seed:1});
 while(availableFirstActNodes(r)[0].id!==nodeId) {
  const node=availableFirstActNodes(r)[0];
  if(node.kind==='event') {r=reduce(r,{type:'ENTER_EVENT'});r=reduce(r,{type:'CHOICE',choice:node.id==='E06'?'liberi':'conserva'});}
  else {r=reduce(r,{type:'TEST_WIN',nodeId:node.id});r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});}
 }
 return reduce(r,{type:'TEST_WIN',nodeId});
}
it('shows and saves only the duplicate, without any reinforcement',()=>{
 const before=pendingAt('I9A');saveCampaignRun(before,0);
 const saved=loadCampaignRun(0), expected=reduce(before,{type:'REWARD',cardId:before.pendingReward.offer[0]});
 const added=expected.copies.slice(before.copies.length);expect(added).toHaveLength(1);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));
 const panel=host.querySelector('.cs-first-reward-panel');
 expect([...panel.querySelectorAll('[data-card-id]')].map(el=>Number(el.dataset.cardId))).toEqual(added.map(c=>c.cardId));
 expect(panel.textContent).toContain('Scudiero del Vallo');expect(panel.textContent).not.toContain('Duellante del Sole Pallido');
 const count=before.copies.filter(c=>c.cardId===before.pendingReward.offer[0]).length;
 expect(count).toBeGreaterThan(0);expect(panel.textContent).toContain(`Doppione · ${count} → ${count+1} copie`);expect(panel.textContent).not.toContain('RINFORZO AGGIUNTIVO');
 expect(panel.textContent).toContain('Posti nell’esercito: 7 → 8');expect(loadCampaignRun(0)).toEqual(saved);
 const shown=panel.textContent;render(null);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelector('.cs-first-reward-panel').textContent).toBe(shown);
 click('Accogli');expect(loadCampaignRun(0).copies).toEqual(expected.copies);expect(loadCampaignRun(0).deck).toEqual(expected.deck);
 expect(host.querySelector('.cs-first-reward-panel')).toBeNull();
});
it('shows only the ordinary agent when no growth reinforcement is needed',()=>{
 const r=pendingAt('I1');saveCampaignRun(r,0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 const panel=host.querySelector('.cs-first-reward-panel');expect(panel.querySelectorAll('[data-card-id]')).toHaveLength(1);
 expect(panel.textContent).not.toContain('RINFORZO AGGIUNTIVO');expect(panel.textContent).not.toContain('Doppione');
 click('Accogli');expect(loadCampaignRun(0).copies.map(c=>c.cardId)).toEqual(r.pendingReward.offer);
});
it('keeps the two boss reward previews separate and awards only the clicked offer',()=>{
 const r=pendingAt('I12');saveCampaignRun(r,0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 const options=[...host.querySelectorAll('.cs-reward-option')];expect(options).toHaveLength(2);
 options.forEach((option,i)=>expect(Number(option.querySelector('[data-card-id]').dataset.cardId)).toBe(r.pendingReward.offer[i]));
 act(()=>options[1].querySelector('button').click());
 expect(loadCampaignRun(0).copies.slice(r.copies.length).map(c=>c.cardId)).toEqual([r.pendingReward.offer[1]]);
});

it('opens the protagonist summary separately from the renamed army management',()=>{
 let r=atEvent();r=reduce(r,{type:'CHOICE',choice:'O1'});r.stats={wins:4,losses:2,draws:1,transformed:3,partial:false};saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.textContent).toContain('Esercito del Nascente');expect(host.textContent).not.toContain('Armata dell’Orizzonte');
 act(()=>host.querySelector('.cs-hero-summary').click());
 const dialog=host.querySelector('[role="dialog"]');expect(dialog.textContent).toContain('Il cammino del Nascente');
 expect([...dialog.querySelectorAll('dt')].map(e=>e.textContent)).toEqual(['Vittorie','Sconfitte','Pareggi','Agenti trasformati']);
 expect([...dialog.querySelectorAll('dd')].map(e=>e.textContent)).toEqual(['4','2','1','3']);
 expect(dialog.textContent).toContain('Colosso');expect(dialog.textContent).toContain('−3 PV a te');expect(dialog.querySelector('.cs-army-tabs')).toBeNull();
 click('Chiudi');act(()=>host.querySelector('.cs-party-deck').click());expect(host.querySelector('.cs-army-tabs').textContent).toContain('Esercito');
 expect(loadCampaignRun(0).stats).toEqual(r.stats);
});
it('shows a clear empty power and archetype on a new run',()=>{
 saveCampaignRun(createFirstActRun(),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));act(()=>host.querySelector('.cs-hero-summary').click());
 const dialog=host.querySelector('[role="dialog"]');expect(dialog.textContent).toContain('Nessun potere acquisito.');expect(dialog.textContent).toContain('Non ancora definito');
 expect([...dialog.querySelectorAll('dd')].map(e=>e.textContent)).toEqual(['0','0','0','0']);expect(dialog.textContent).not.toContain('Statistiche parziali');
});
it('recovers available legacy stats without counting questions as wins and restores classic field timing',()=>{
 let r=pendingAt('I9A');delete r.stats;saveCampaignRun(r,0);
 const loaded=loadCampaignRun(0);expect(loaded.stats.partial).toBe(true);
 expect(loaded.stats.wins).toBe(r.history.filter(h=>FIRST_ACT_NODES.find(n=>n.id===h.nodeId)?.roster).length+1);
 saveCampaignRun(loaded,0);expect(loadCampaignRun(0).stats).toEqual(loaded.stats);
 r=reduce(loaded,{type:'REWARD',cardId:loaded.pendingReward.offer[0]});r=reduce(r,{type:'START',nodeId:'F2'});
 r.active.snapshot={roundNumber:2,playerHP:17,conqueredFields:{0:{winner:'player'}},revealedFields:3,campaignDuelMod:{firstAct:true,revealRounds:[1,1,1,3,4]}};
 saveCampaignRun(r,0);const snapshot=loadCampaignRun(0).active.snapshot;
 expect(snapshot.campaignDuelMod.revealRounds).toEqual([1,1,1,2,3]);expect(snapshot.revealedFields).toBe(4);
 expect(snapshot.playerHP).toBe(17);expect(snapshot.conqueredFields).toEqual(r.active.snapshot.conqueredFields);
});

it('places the Nascente summary on the left and the army on the right',()=>{
 const style=document.createElement('style');style.textContent=firstActCss;document.head.append(style);
 try {
  saveCampaignRun(createFirstActRun(),0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
  expect(getComputedStyle(host.querySelector('.cs-hero-summary')).gridColumn).toBe('1');
  expect(getComputedStyle(host.querySelector('.cs-party-deck')).gridColumn).toBe('2');
  act(()=>host.querySelector('.cs-hero-summary').click());expect(host.querySelector('[role="dialog"]').textContent).toContain('Il cammino del Nascente');
 }finally{style.remove();}
});


it('preloads L1 transformations and displays the actual collective reward and reserve card',()=>{
 let r=createFirstActRun({seed:31});
 expect(campaignDuelAssets(r).preloadCards.filter(c=>[9401,9402,9403].includes(c.id))).toHaveLength(3);
 r=reduce(r,{type:'TEST_WIN',nodeId:'I1'});r=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});
 r=reduce(r,{type:'TEST_WIN',nodeId:'I2'});
 expect(r.pendingReward.offer).toContain(9301);
 saveCampaignRun(r,0);render(React.createElement(FirstActHub,{onBack:()=>{}}));
 expect(host.querySelector('[data-card-id="9301"]')).toBeTruthy();
 expect(host.textContent).toContain('Folla delle Porte');
 click('Accogli Folla delle Porte');
 const saved=loadCampaignRun(0);expect(saved.copies.at(-1).cardId).toBe(9301);
 expect(saved.copies).toHaveLength(2);
 click('Esercito e riserva');expect(host.textContent).toContain('Folla delle Porte');
});
