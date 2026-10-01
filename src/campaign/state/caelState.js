import { CAEL_VERSION, CAEL_NODES, caelNode, caelStages, validateCaelData } from '../data/caelAct.js';
import { firstActCard, NASCENTE, POWER_PACKAGES, FIGLI, campaignField } from '../data/firstAct.js';
import { CONCORDIA_CARDS, CONCORDIA_ARMY } from '../data/concordia.js';
import { ARMY_SETS } from '../../data/cards.js';
import { shuffled, nascenteCard } from './firstActState.js';
import { drawFirstActFields } from '../logic/firstActFields.js';
const clone = x=>JSON.parse(JSON.stringify(x));
export const isCaelRun = r=>r?.designVersion===CAEL_VERSION;
export function createCaelRun({seed=Math.floor(Math.random()*2**31)}={}) {
  validateCaelData();
  return {version:3,designVersion:CAEL_VERSION,model:'first-act',actId:'first-act',stage:0,completed:0,slots:1,budget:10,seed,
    stats:{wins:0,losses:0,draws:0,transformed:0,partial:false},deck:[NASCENTE],copies:[],nextCopy:1,
    nascente:{packageId:null,power:0,damage:0,statTaken:false,finalStat:null,evolution:null},flags:{},plans:{},statuses:[],preparation:null,
    branch:null,active:null,pendingReward:null,pendingEvent:null,lastResult:null,history:[],checkpoints:[],attempt:0,outcome:null};
}
export function caelRunCard(r,id) {
  if(id===NASCENTE)return nascenteCard(r);
  const copy=r.copies.find(c=>c.uid===id);
  if(!copy)return firstActCard(id);
  const card=firstActCard(copy.cardId);
  return {...card,id:copy.uid,cardId:copy.cardId,artId:card.artId??card.id,campaignCopyId:copy.uid};
}
export const caelLeague=(r,deck=r.deck)=>deck.reduce((s,id)=>s+(caelRunCard(r,id)?.league??Infinity),0);
export function validCaelDeck(r,deck=r.deck) {
  return Array.isArray(deck)&&deck.length>=1&&deck.length<=r.slots&&new Set(deck).size===deck.length&&deck.includes(NASCENTE)
    &&deck.every(id=>id===NASCENTE||r.copies.some(c=>c.uid===id))&&caelLeague(r,deck)<=r.budget;
}
export function legalCaelArmy(r) {
  const deck=[NASCENTE];
  for(const c of [...r.copies].sort((a,b)=>firstActCard(a.cardId).league-firstActCard(b.cardId).league))
    if(deck.length<r.slots && caelLeague(r,[...deck,c.uid])<=r.budget)deck.push(c.uid);
  return validCaelDeck(r,deck)?deck:null;
}
export const availableCaelNodes=r=>(r.outcome?[]:caelStages(r)[r.stage]||[]).filter(id=>!r.branch||id===r.branch).map(caelNode);
export function caelTransformationPool(r,uid,{road=false}={}) {
  const c=r.copies.find(c=>c.uid===uid),card=c&&firstActCard(c.cardId);
  if(!card||card.army===FIGLI||(!road&&(card.league<2||r.completed<c.acquiredAt+1)))return [];
  const league=road?2:card.league;
  return (ARMY_SETS[FIGLI]||[]).filter(x=>x.league===league&&!r.copies.some(c=>c.cardId===x.id)).map(x=>x.id).sort((a,b)=>a-b);
}
export function promotionOffer(r,uid,{road=false}={}) {
  const c=r.copies.find(c=>c.uid===uid),card=c&&firstActCard(c.cardId);
  if(!card||card.army!==CONCORDIA_ARMY||(!road&&(c.wins||0)<card.league)||card.league+1>nascenteCard(r).league)return [];
  const pool=CONCORDIA_CARDS.filter(x=>x.league===card.league+1).map(c=>c.id).sort((a,b)=>a-b);
  return shuffled(pool,r.seed,`promotion:${uid}:${card.league}`).slice(0,Math.ceil(pool.length/2));
}
function replaceCopy(r,uid,cardId,transformed=false) {
  const old=r.copies.find(c=>c.uid===uid);
  if(!old)throw new Error('Copia non disponibile.');
  const next={...r,copies:r.copies.map(c=>c.uid===uid?{...c,cardId,wins:0,lineage:[...(c.lineage||[]),{from:c.cardId,to:cardId,kind:transformed?'transformation':'promotion',at:r.completed}]}:c),stats:{...r.stats,transformed:r.stats.transformed+Number(transformed)}};
  if(!validCaelDeck(next))throw new Error('Lega insufficiente: sposta questa copia in riserva prima di promuoverla.');
  return next;
}
function addStatus(r,source,label,effects=[],choice='') {
  const added=effects.map((e,i)=>({...e,id:`${source}:${i}`,source,label,choice,permanent:true})).filter(e=>!r.statuses.some(s=>s.id===e.id));
  return {...r,statuses:[...r.statuses,...added],budget:r.budget+added.filter(s=>s.resource==='budget').reduce((n,s)=>n+s.value,0)};
}
export function statusTotal(r,target,resource,{concordia=false}={}) {
  return (r.statuses||[]).filter(s=>s.resource===resource&&(s.target===target||(target==='enemy'&&s.target==='allEnemies')||(target==='enemy'&&concordia&&s.target==='concordia'))).reduce((n,s)=>n+s.value,0);
}
function roadCopy(r) {return r.copies.find(c=>firstActCard(c.cardId).league===1);}
export function caelEventChoices(r) {
  const node=caelNode(r.pendingEvent?.id);
  if(!node)return [];
  if(node.id==='E3')return POWER_PACKAGES.map(p=>p.id);
  if(node.id==='E1-strada') {
    const c=roadCopy(r);if(!c)return [];
    return [...promotionOffer(r,c.uid,{road:true}).map(id=>`promote:${id}`),...(caelTransformationPool(r,c.uid,{road:true}).length?['transform']:[])];
  }
  return node.choices.map(c=>c.id);
}
export function caelChoiceLabel(r,choice) {
  if(choice.startsWith('promote:'))return `Promuovi in ${firstActCard(Number(choice.split(':')[1])).name} · L2`;
  const node=caelNode(r.pendingEvent?.id);
  return node?.choices.find(c=>c.id===choice)?.label||POWER_PACKAGES.find(c=>c.id===choice)?.answer||choice;
}
export function previewCaelChoice(r,choice) {
  if(!caelEventChoices(r).includes(choice))throw new Error('Scelta non disponibile.');
  const node=caelNode(r.pendingEvent.id);
  let next=clone(r);
  if(node.id==='E0')next.flags.route=choice;
  else if(node.id==='E5')next.flags.operation=choice;
  else if(node.id==='E3'){next.nascente.packageId=choice;next.nascente.statTaken=true;}
  else if(node.id==='E8')next.nascente.finalStat=choice==='finalPower'?'power':'damage';
  else if(node.id==='E1-strada') {
    const c=roadCopy(r),cardId=choice==='transform'?shuffled(caelTransformationPool(r,c.uid,{road:true}),r.seed,`road:${c.uid}`)[0]:Number(choice.split(':')[1]);
    next=replaceCopy(next,c.uid,cardId,choice==='transform');
  } else next=addStatus(next,node.id,node.title,node.choices.find(c=>c.id===choice).effects,node.choices.find(c=>c.id===choice).label);
  if(!validCaelDeck(next))throw new Error('Riorganizza l’esercito prima di confermare la crescita.');
  return next;
}
function checkpoint(r) {
  const {checkpoints,...state}=clone(r);
  return {...r,checkpoints:[...checkpoints,{completed:r.completed,state}].slice(-4)};
}
function advance(r,nodeId,choice=null) {
  const next={...r,completed:r.completed+1,stage:r.stage+1,branch:null,active:null,pendingReward:null,pendingEvent:null,lastResult:null,history:[...r.history,{nodeId,result:'player',...(choice?{choice}:{})}]};
  if(next.stage===caelStages(next).length)next.outcome='won';
  return next;
}
function addCopy(r,cardId) {
  const uid=`c${r.nextCopy}`,duplicate=r.copies.some(c=>c.cardId===cardId);
  const next={...r,nextCopy:r.nextCopy+1,copies:[...r.copies,{uid,cardId,acquiredAt:r.completed+1,wins:0}]};
  if(!duplicate&&validCaelDeck(next,[...r.deck,uid]))next.deck=[...r.deck,uid];
  return next;
}
const enemyInstance=(id,phase,index)=>`enemy:${phase}:${index}:${id}`;
export function createCaelAttempt(r,node) {
  const rest=shuffled(r.deck.filter(id=>id!==NASCENTE).sort(),r.seed,`${node.id}:player`);
  const phaseCount=node.squads?.length||1;
  if(phaseCount>1&&r.deck.length<2)throw new Error('Il boss richiede almeno due copie complessive per formare due mani. Apri Esercito e riserva.');
  const firstSize=phaseCount>1?Math.min(5,r.deck.length-1):Math.min(5,r.deck.length);
  const playerSquads=[[NASCENTE,...rest.slice(0,firstSize-1)]];
  if(phaseCount>1)playerSquads.push(rest.slice(firstSize-1));
  const enemyBase=node.squads||[[...node.required,...shuffled(node.roster.filter(id=>!node.required.includes(id)),r.seed,`${node.id}:enemy`)].slice(0,5)];
  const enemySquads=enemyBase.map((s,p)=>s.map((id,i)=>enemyInstance(id,p,i)));
  const opening=playerSquads.map((p,i)=>node.openingPlayerFirst??(p.reduce((s,id)=>s+caelRunCard(r,id).league,0)<=enemySquads[i].reduce((s,id)=>s+firstActCard(id).league,0)));
  return {id:r.attempt+1,nodeId:node.id,phase:0,playerSquads,enemySquads,fieldSquads:enemySquads.map((_,p)=>drawFirstActFields(r,node,p)),opening,pv:null,snapshot:null,progress:[],testWin:false};
}
// One ledger entry per actual duel, persisted with the duel snapshot. No run gains until victory.
export function mergeCaelProgress(active,entries=[]) {
  const all=new Map((active.progress||[]).map(e=>[e.key,e]));
  for(const e of entries) {
    if(!e||e.phase!==active.phase||!Number.isInteger(e.round)||e.round<1||e.round>5||e.key!==`${e.phase}:${e.round}`||!['player','enemy','draw'].includes(e.winner))throw new Error('Progresso del duello non valido.');
    if(!active.playerSquads[e.phase].includes(e.playerId)||!active.enemySquads[e.phase].includes(e.enemyId))throw new Error('Agente del duello non valido.');
    if(!campaignField(e.fieldId))throw new Error('Campo del duello non valido.');
    if(!all.has(e.key))all.set(e.key,clone(e));
  }
  return [...all.values()];
}
function applyProgress(r,entries) {
  let next={...r,copies:r.copies.map(c=>({...c}))};
  for(const e of entries) {
    if(e.winner==='player') {
      const c=next.copies.find(c=>c.uid===e.playerId);if(c)c.wins=(c.wins||0)+1;
    }
    if(e.winner==='draw'||!e.conquered)continue;
    const effect=campaignField(e.fieldId)?.campaignEffect;
    if(effect==='capture'&&e.winner==='player')next=addCopy(next,firstActCard(e.enemyId).cardId);
    if(effect==='life'||effect==='focus')next=addStatus(next,`${r.pendingReward.nodeId}:${e.key}:${e.fieldId}`,campaignField(e.fieldId).name,[{target:e.winner==='player'?'player':'allEnemies',resource:effect,value:1}],'Conquista del Campo');
  }
  return next;
}
export function caelReducer(r,action) {
  let next=r;
  switch(action.type) {
    case 'START': {
      const node=availableCaelNodes(r).find(n=>n.id===action.nodeId);
      if(!node||node.kind==='event'||r.active||r.pendingReward||r.pendingEvent||!validCaelDeck(r))throw new Error('Incontro non disponibile.');
      const base=r.lastResult?r:checkpoint(r),active=createCaelAttempt(base,node);
      next={...base,branch:node.id,active,attempt:active.id,lastResult:null};break;
    }
    case 'SNAPSHOT': {
      if(r.active?.id!==action.attempt||r.active.phase!==action.phase)return r;
      const entries=action.snapshot?.campaignDuelMod?.duels||[];
      next={...r,active:{...r.active,progress:mergeCaelProgress(r.active,entries),snapshot:clone(action.snapshot)}};break;
    }
    case 'RESULT': {
      if(r.active?.id!==action.attempt||r.active.phase!==action.phase)return r;
      if(!['player','enemy','draw'].includes(action.winner)||!Number.isFinite(action.playerHP)||!Number.isFinite(action.enemyHP))throw new Error('Esito incompleto.');
      const progress=mergeCaelProgress(r.active,action.progress||r.active.snapshot?.campaignDuelMod?.duels||[]);
      const active={...r.active,progress};
      if(action.winner==='player'&&action.playerHP>0&&action.enemyHP>0&&active.phase+1<active.enemySquads.length) {
        next={...r,active:{...active,phase:active.phase+1,pv:{player:action.playerHP,enemy:action.enemyHP},snapshot:null}};break;
      }
      const key={player:'wins',enemy:'losses',draw:'draws'}[action.winner],stats={...r.stats,[key]:r.stats[key]+1};
      if(action.winner!=='player'){next={...r,stats,active:null,lastResult:action.winner};break;}
      const node=caelNode(active.nodeId);
      // Real roster, one entry per identity. Boss signature is included, never replaced on duplicate.
      const offer=node.noFinalReward?[]:shuffled([...new Set(node.roster)],r.seed,`${node.id}:reward`).slice(0,1);
      next={...r,stats,active:null,pendingReward:{nodeId:node.id,offer,progress,testWin:active.testWin}};break;
    }
    case 'TEST_WIN': {
      if(r.pendingReward||r.pendingEvent||r.outcome)throw new Error('Nessun incontro da risolvere.');
      const started=r.active?r:caelReducer(r,{type:'START',nodeId:action.nodeId});
      const active={...started.active,testWin:true};
      return caelReducer({...started,active},{type:'RESULT',attempt:active.id,phase:active.phase,winner:'player',playerHP:Math.max(1,active.pv?.player||10),enemyHP:0});
    }
    case 'REWARD': {
      const pending=r.pendingReward;
      if(!pending||(pending.offer.length?!pending.offer.includes(action.cardId):action.cardId!=null))throw new Error('Premio non disponibile.');
      const node=caelNode(pending.nodeId);
      next={...r,slots:node.growth||r.slots,budget:node.budget||r.budget};
      next=applyProgress(next,pending.progress);
      if(pending.offer.length)next=addCopy(next,action.cardId);
      next=addStatus(next,node.id,node.title,node.effects,node.operation||'');
      next=advance(next,node.id);
      if(pending.testWin)next.history.at(-1).testWin=true;
      break;
    }
    case 'ENTER_EVENT': {
      const node=availableCaelNodes(r)[0];
      if(!node||node.kind!=='event'||r.active||r.pendingReward||r.pendingEvent)throw new Error('Evento non disponibile.');
      next={...checkpoint(r),pendingEvent:{id:node.id}};break;
    }
    case 'CHOICE': next=advance(previewCaelChoice(r,action.choice),r.pendingEvent.id,action.choice);break;
    case 'SET_DECK':
      if(r.active||r.pendingReward||!validCaelDeck(r,action.deck))throw new Error('Esercito non valido: rispetta posti e budget e conserva il Nascente.');
      next={...r,deck:[...action.deck]};break;
    case 'PROMOTE':
    case 'TRANSFORM': {
      if(r.active||r.pendingEvent||r.pendingReward||r.outcome)throw new Error('Concludi prima l’incontro o l’evento.');
      const pool=action.type==='PROMOTE'?promotionOffer(r,action.uid):caelTransformationPool(r,action.uid);
      if(!pool.length)throw new Error('Nessuna evoluzione disponibile per questa copia.');
      const cardId=action.type==='PROMOTE'?action.cardId:shuffled(pool,r.seed,`transform:${action.uid}:${firstActCard(r.copies.find(c=>c.uid===action.uid).cardId).league}`)[0];
      if(!pool.includes(cardId))throw new Error('Promozione non presente nell’offerta.');
      next=replaceCopy(r,action.uid,cardId,action.type==='TRANSFORM');break;
    }
    case 'SKIP':
      if(caelStages(r)[r.stage]?.[0]!=='F2'||r.active||r.pendingReward)throw new Error('Faglia non saltabile.');
      next={...r,stage:r.stage+1,branch:null,lastResult:null,history:[...r.history,{nodeId:'F2',result:'skipped'}]};break;
    case 'ABANDON':
      if(!r.active)return r;
      next={...r,active:null,lastResult:'enemy',stats:{...r.stats,losses:r.stats.losses+1}};break;
    case 'REWIND': {
      if(r.lastResult!=='enemy')throw new Error('Riavvolgimento disponibile dopo una sconfitta.');
      const target=r.checkpoints.find(c=>c.completed===Math.max(0,r.completed-3));
      if(!target)throw new Error('Checkpoint non disponibile.');
      next={...clone(target.state),stats:r.stats,checkpoints:r.checkpoints.filter(c=>c.completed<target.completed),attempt:r.attempt,lastResult:null};break;
    }
    default:throw new Error('Azione della campagna non riconosciuta.');
  }
  return assertCaelRun(next);
}
export function assertCaelRun(r) {
  if(r.model!=='first-act'||r.version!==3||r.designVersion!==CAEL_VERSION)throw new Error('Versione Cael non valida.');
  if(!Number.isInteger(r.stage)||r.stage<0||r.stage>caelStages(r).length||!Number.isInteger(r.completed)||r.completed<0||!Number.isInteger(r.seed))throw new Error('Progressione Cael non valida.');
  if(!Number.isInteger(r.slots)||r.slots<1||r.slots>10||!Number.isInteger(r.budget)||r.budget<10||r.budget>30)throw new Error('Capienza non valida.');
  if(!Array.isArray(r.copies)||new Set(r.copies.map(c=>c.uid)).size!==r.copies.length||r.copies.some(c=>!/^c\d+$/.test(c.uid)||!firstActCard(c.cardId)||!Number.isInteger(c.wins)||c.wins<0||!Number.isInteger(c.acquiredAt)))throw new Error('Copie non valide.');
  if(!validCaelDeck(r))throw new Error('Esercito non valido.');
  if(!Array.isArray(r.statuses)||new Set(r.statuses.map(s=>s.id)).size!==r.statuses.length||r.statuses.some(s=>!['player','concordia','allEnemies'].includes(s.target)||!['life','focus','budget'].includes(s.resource)||!Number.isInteger(s.value)||s.value<0))throw new Error('Status non validi.');
  if(!r.stats||['wins','losses','draws','transformed'].some(k=>!Number.isInteger(r.stats[k])||r.stats[k]<0))throw new Error('Statistiche non valide.');
  if(r.nascente.packageId&&!POWER_PACKAGES.some(p=>p.id===r.nascente.packageId))throw new Error('Potere non valido.');
  if(r.pendingEvent&&caelNode(r.pendingEvent.id)?.kind!=='event')throw new Error('Evento non valido.');
  if(r.pendingReward){const node=caelNode(r.pendingReward.nodeId);if(!node?.roster||r.pendingReward.offer.length!==(node.noFinalReward?0:1)||r.pendingReward.offer.some(id=>!node.roster.includes(id)))throw new Error('Premio non valido.');}
  if(r.active) {
    const a=r.active,node=caelNode(a.nodeId);
    if(!node?.roster||!Number.isInteger(a.phase)||!a.playerSquads[a.phase]||!a.enemySquads[a.phase])throw new Error('Tentativo non valido.');
    for(const [side,squads] of [['player',a.playerSquads],['enemy',a.enemySquads]])for(const hand of squads)if(hand.length<1||hand.length>5||new Set(hand).size!==hand.length||hand.some(id=>side==='player'?!r.deck.includes(id):!firstActCard(id)))throw new Error('Mani non valide.');
    if(new Set(a.playerSquads.flat()).size!==a.playerSquads.flat().length)throw new Error('Copia ripetuta nelle due mani.');
    if(a.fieldSquads.length!==a.enemySquads.length||a.fieldSquads.some(f=>f.length!==node.fieldIds.length||new Set(f).size!==f.length||f.some(id=>!campaignField(id))))throw new Error('Campi non validi.');
  }
  return r;
}
