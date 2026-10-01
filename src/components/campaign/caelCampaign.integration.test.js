// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {FirstActHub} from './FirstActHub.jsx';
import {createFirstActRun,firstActReducer as reduce,availableFirstActNodes,eventChoices,promotionOffer} from '../../campaign/state/firstActState.js';
import {saveCampaignRun,loadCampaignRun} from '../../campaign/state/persistence.js';
import {firstActDuelConfig} from '../../campaign/logic/firstActBattle.js';
import {campaignField} from '../../campaign/data/firstAct.js';
import {CAGES} from '../../campaign/data/caelAct.js';
import {useGameState} from '../../hooks/useGameState.js';
import {useGameFlow} from '../../hooks/useGameFlow.js';
import {useBattle} from '../../hooks/useBattle.js';
import {useFirstActPersistence} from '../../hooks/useFirstActPersistence.js';
import {useCampaignGameOutcome} from '../../hooks/useCampaignGameOutcome.js';
import {ALL_BATTLEFIELDS} from '../../data/battlefields.js';
let host,root;
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
const render=x=>act(()=>root.render(x));
const click=t=>act(()=>{const b=[...host.querySelectorAll('button')].find(b=>!b.disabled&&b.textContent.includes(t));expect(b,`button ${t}`).toBeTruthy();b.click();});
function choice(r,id){r=reduce(r,{type:'ENTER_EVENT'});return reduce(r,{type:'CHOICE',choice:id||eventChoices(r)[0]});}
function win(r){r=reduce(r,{type:'TEST_WIN',nodeId:availableFirstActNodes(r)[0].id});return reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});}
function road(){let r=choice(createFirstActRun({seed:11}),'strada');return win(r);}
it('presents the concrete road event and promotes the exact previewed copy with no L1 Figli',()=>{
 let r=reduce(road(),{type:'ENTER_EVENT'}),off=eventChoices(r).find(s=>s.startsWith('promote:'));saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Promuovi in');expect(host.textContent).toContain('nessun Figlio L1');click('Conferma scelta');
 const next=loadCampaignRun(0);expect(next.copies).toHaveLength(1);expect(next.copies[0]).toMatchObject({uid:r.copies[0].uid,cardId:Number(off.split(':')[1]),wins:0});expect(host.querySelector('[role=alert]')).toBeNull();
});
it('renders each duplicate separately and promotes only the selected copy',()=>{
 let r=choice(win(choice(createFirstActRun({seed:13}),'piane')),'accept');r.slots=3;r.copies[0].wins=1;r.copies.push({...r.copies[0],uid:'c2',wins:0});r.nextCopy=3;r.deck.push('c2');saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');expect(host.querySelectorAll('.cs-cael-copies input')).toHaveLength(3);
 const manage=host.querySelector('[aria-label="Gestisci Contadini armati · c1"]');act(()=>manage.click());click('Promuovi in');
 const next=loadCampaignRun(0);expect(next.copies[0].cardId).toBe(promotionOffer(r,'c1')[0]);expect(next.copies[1].cardId).toBe(r.copies[1].cardId);expect(next.deck).toEqual(r.deck);
 expect(host.textContent).not.toContain('UN NUOVO FIGLIO');expect(host.textContent).toContain('PROMOZIONE');
});
it('keeps both the card and counters intact when an evolution cannot be saved',()=>{
 let r=choice(road(),eventChoices(reduce(road(),{type:'ENTER_EVENT'}))[0]);r.copies[0].wins=2;r.nascente.statTaken=true;saveCampaignRun(r,0);
 render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Esercito e riserva');act(()=>host.querySelector('.cs-cael-copies article:nth-child(2) button').click());
 const before=JSON.stringify(loadCampaignRun(0));vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});click('Promuovi in');
 expect(host.querySelector('[role=alert]').textContent).toContain('Salvataggio');expect(JSON.stringify(loadCampaignRun(0))).toBe(before);
});
it('persists real hooks ledger through reload and pays captures and personal wins exactly once',()=>{
 let r=choice(win(choice(createFirstActRun({seed:15}),'piane')),'accept');r=reduce(r,{type:'START',nodeId:'A02-piane'});saveCampaignRun(r,0);
 let api;function Harness(){const state=useGameState(),flow=useGameFlow(state),battle=useBattle(state,new Proxy({},{get:()=>vi.fn()}));useFirstActPersistence(state);useCampaignGameOutcome({...state});api={state,flow,battle};return null;}
 render(React.createElement(Harness));const cfg=firstActDuelConfig(r);
 act(()=>{api.state.setCampaignLevel({node:r.active.nodeId,campaignAttempt:r.active.id,campaignPhase:0});api.flow.startGame(cfg.playerArmy,cfg.playerDeckCards,'campaign',cfg.difficulty,ALL_BATTLEFIELDS,cfg.enemyArmy,cfg.enemyDeckIds,cfg.campaignDuelMod,cfg.startOptions);});
 act(()=>{api.state.setGamePhase('selectAgent');api.state.setBattlefields([campaignField(CAGES[0])]);api.state.setCurrentFieldIndex(0);api.state.setSelectedAgent(api.state.playerHand.find(c=>c.campaignCopyId));api.state.setEnemyAgent(api.state.enemyHand[0]);api.state.setSelectedFocus(10);api.state.setEnemySelectedFocus(0);});
 act(()=>api.battle.resolveBattle());expect(api.state.battleResult.winner).toBe('player');
 expect(loadCampaignRun(0).active.progress).toHaveLength(1);expect(loadCampaignRun(0).copies[0].wins).toBe(0);
 act(()=>{api.state.setGameResult({winner:'player'});api.state.setGamePhase('gameOver');});
 r=loadCampaignRun(0);expect(r.pendingReward.progress).toHaveLength(1);const paid=reduce(r,{type:'REWARD',cardId:r.pendingReward.offer[0]});expect(paid.copies).toHaveLength(3);expect(paid.copies[0].wins).toBe(1);expect(()=>reduce(paid,{type:'REWARD',cardId:r.pendingReward.offer[0]})).toThrow();
});
it('shows permanent status scope and allows cage victory with no random final reward',()=>{
 let r=choice(win(choice(createFirstActRun({seed:7}),'piane')),'accept');saveCampaignRun(r,0);render(React.createElement(FirstActHub,{onBack:()=>{}}));act(()=>host.querySelector('[aria-label="Riepilogo del Nascente"]').click());expect(host.textContent).toContain('Status Esercito');expect(host.textContent).toContain('PV massimi');expect(host.textContent).toContain('Permanente');
 render(null);r.stage=6;r.slots=4;r.branch=null;r=reduce(r,{type:'TEST_WIN',nodeId:'A04-piane-luogo'});saveCampaignRun(r,0);render(React.createElement(FirstActHub,{onBack:()=>{}}));click('Prosegui con le catture');expect(loadCampaignRun(0).copies).toHaveLength(1);expect(host.querySelector('[role=alert]')).toBeNull();
});
