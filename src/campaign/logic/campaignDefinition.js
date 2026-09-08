import {CONTROLLED_CAMPAIGN} from '../data/controlledCampaign.js';
import {concordiaCardById,CONCORDIA_ARMY} from '../data/concordia.js';
import {poolCardById} from '../state/campaignState.js';
const STORAGE_KEY='satze_campaign_editor_v1';
export const REWARDS={none:'Nessuna',power:'+1 POT Nascente',damage:'+1 DAN Nascente',imprint:'+1 Impronta',card:'Carta in riserva'};
export const cloneDefinition=v=>JSON.parse(JSON.stringify(v));
export const allMissions=d=>d.acts.flatMap(a=>a.stages.flatMap(s=>s.alternatives));
export const campaignEnemyCard=id=>concordiaCardById(id)||poolCardById(id);
// Single validation boundary for editor imports, saves and runtime snapshots.
export function validateCampaignDefinition(d){
 const errors=[];
 if(!d||d.version!==1||d.id!==CONTROLLED_CAMPAIGN.id||d.playerArmy!==CONTROLLED_CAMPAIGN.playerArmy||typeof d.title!=='string'||!d.title.trim())return ['Formato campagna non riconosciuto.'];
 if(!Array.isArray(d.acts)||d.acts.length!==3)return ['Sono richiesti tre atti.'];
 const ids=new Set(),missionIds=new Set();
 const unique=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||ids.has(id))errors.push(`ID non valido o duplicato: ${id}`);ids.add(id);};
 for(const act of d.acts){
  if(!act||!Array.isArray(act.stages)){errors.push('Atto non valido.');continue;}
  unique(act.id);
  if(typeof act.title!=='string'||!act.title.trim())errors.push('Titolo atto mancante.');
  if(act.stages.length!==6)errors.push(`${act.title}: servono sei tappe.`);
  act.stages.forEach((stage,i)=>{
   if(!stage||!Array.isArray(stage.alternatives)||stage.alternatives.length<1||stage.alternatives.length>2){errors.push('Tappa non valida.');return;}
   unique(stage.id);
   for(const m of stage.alternatives){
    if(!m||!m.enemy){errors.push('Incontro non valido.');continue;}
    unique(m.id);missionIds.add(m.id);
    if(m.node!==m.id||typeof m.title!=='string'||!m.title.trim()||typeof m.briefing!=='string')errors.push(`${m.id}: testo o nodo non valido.`);
    if(!['battle','elite','special','boss'].includes(m.kind)||(i===5)!==(m.kind==='boss'))errors.push(`${m.id}: il boss deve chiudere l’atto.`);
    if(m.kind!=='special'&&m.enemy.army!==CONCORDIA_ARMY)errors.push(`${m.id}: gli incontri principali appartengono alla Concordia.`);
    if(m.kind==='special'&&m.enemy.army===CONCORDIA_ARMY)errors.push(`${m.id}: scegli un’altra armata per lo speciale.`);
    if(m.fields!==5||m.objective!=='dominazione'||m.enemy.life!==25||!['easy','medium','hard'].includes(m.difficulty))errors.push(`${m.id}: parametri duello non validi.`);
    const deck=m.enemy.deck;
    if(!Array.isArray(deck)||deck.length!==10||new Set(deck).size!==10){errors.push(`${m.id}: servono dieci carte distinte.`);continue;}
    if(m.kind==='boss'&&!deck.includes(m.signatureCardId))errors.push(`${m.id}: carta firma assente.`);
    const cards=deck.map(campaignEnemyCard);
    if(cards.some(c=>!c||c.army!==m.enemy.army))errors.push(`${m.id}: carte nemiche non valide.`);
    if(cards.reduce((s,c)=>s+(c?.league||0),0)>30)errors.push(`${m.id}: Lega nemica oltre 30.`);
   }
  });
 }
 if(!Array.isArray(d.events)||d.events.length>100)return [...errors,'Massimo 100 eventi.'];
 for(const ev of d.events){
  if(!ev){errors.push('Evento non valido.');continue;}unique(ev.id);
  if(!missionIds.has(ev.missionId))errors.push(`${ev.id}: incontro di destinazione inesistente.`);
  if(typeof ev.title!=='string'||!ev.title.trim()||typeof ev.body!=='string')errors.push(`${ev.id}: titolo e testo richiesti.`);
  if(!Array.isArray(ev.choices)||ev.choices.length<1||ev.choices.length>4){errors.push(`${ev.id}: da una a quattro scelte.`);continue;}
  for(const c of ev.choices){
   if(!c||typeof c.label!=='string'||!c.label.trim()||!Object.hasOwn(REWARDS,c.reward))errors.push(`${ev.id}: scelta non valida.`);
   if(c?.reward==='card'&&(!Number.isInteger(c.cardId)||!poolCardById(c.cardId)))errors.push(`${ev.id}: ricompensa fuori dal pool giocabile.`);
  }
 }
 return errors;
}
export function assertCampaignDefinition(d){const errors=validateCampaignDefinition(d);if(errors.length)throw new Error(errors.join('\n'));return d;}
export function loadCampaignDefinition(){const raw=typeof localStorage!=='undefined'?localStorage.getItem(STORAGE_KEY):null;return cloneDefinition(raw?assertCampaignDefinition(JSON.parse(raw)):CONTROLLED_CAMPAIGN);}
export function saveCampaignDefinition(d){assertCampaignDefinition(d);localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}
