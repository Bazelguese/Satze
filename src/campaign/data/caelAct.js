// Atto I 0.26 — configuration from the approved reading guide; values need playtesting.
import { codes, firstActCard, campaignField, TOWER_ID, VARCO_ID } from './firstAct.js';
import { CONCORDIA_ARMY } from './concordia.js';
export const CAEL_VERSION = '0.26';
export const CROWDS = [9151, 9152, 9153];
export const CAEL_BOSS = 9154;
export const CAGES = [9211, 9212, 9213];
export const QUESTION = 9214;
export const TEMPLES = [9215, 9216];
export const STOREHOUSE = 9217;
const event = (id, title, text, choices) => ({id, node:id, kind:'event', title, text, choices});
const fight = (id, title, roster, opts={}) => ({id, node:id, title, kind:'battle', army:CONCORDIA_ARMY,
  roster:typeof roster==='string'?codes(roster):roster, size:5, required:[], fieldIds:[8,12,2,TOWER_ID,4],
  revealRounds:[1,1,1,3,4], life:25, focus:18, difficulty:'medium', winRule:'classic', ...opts});
const option = (id, label, effects=[]) => ({id,label,effects});
const stat = (target, resource, value=1) => ({target,resource,value});
const access = [
  ['piane','Piane di Cael',CROWDS[0],'Praterie dorate'],
  ['altopiano','Altopiano smeraldo',CROWDS[1],'Verdi colline'],
  ['strada','Strada',CROWDS[2],'Sentiero battuto'],
];
const small = (size,opts={}) => ({size,life:10,focus:10,winRule:'territory',fieldIds:[8,12,2,4].slice(0,size),revealRounds:[1,1,1,3].slice(0,size),...opts});
export const CAEL_NODES = [
  event('E0','La luce oltre il territorio','Non so cosa sia, non so quanto sia lontano, so che devo arrivare fino in fondo.',access.map(([id,label,,land])=>option(id,`${label} · ${land}`))),
  ...access.flatMap(([route,title,crowd])=>[
    fight(`A01-${route}`,'Primo contatto',[crowd],small(1,{route,growth:2,winRule:'varco',fieldIds:[VARCO_ID],revealRounds:[1],openingPlayerFirst:false,difficulty:'easy',text:`${title}. Una folla difende il passaggio. La sua volontà comune resiste alla forma iniziale del Nascente.`})),
    event(`E1-${route}`,route==='strada'?'Un seguito può cambiare':title,
      route==='strada'?'Il sopravvissuto è colpito dalla Domanda. Scegli se promuoverlo o trasformarlo.':'Il seguito trova un modo per sostenere la propria avanzata.',
      route==='strada'?[option('promote','Promuovi la folla a Concordia L2'),option('transform','Trasforma la folla in un Figlio L2 casuale')]:[option('accept',route==='piane'?'+1 PV massimo permanente':'+1 FC massimo permanente',[stat('player',route==='piane'?'life':'focus')])]),
    fight(`A02-${route}`,'La piccola difesa',[crowd,...codes('V01')],small(2,{route,growth:3,difficulty:'easy'})),
    fight(`A03-${route}`,'Il reparto inviato',[crowd,...codes('V02 V04')],small(3,{route,growth:4})),
    fight(`A04-${route}-presidio`,'Il presidio sul percorso',[crowd,...codes('V01 V04 V06')],small(4,{route,growth:5,text:'Un reparto impedisce di avanzare verso Cael. Superarlo permette di proseguire senza attaccare il luogo vicino.'})),
  ]),
  event('E2','Il seguito si riordina','Preparati alla prima difesa organizzata. Il limite di Lega dell’esercito aumenta di due.',[option('accept','+2 Lega massima dell’esercito',[stat('player','budget',2)])]),
  fight('A04-piane-luogo','Gabbie degli schiavisti',[...CROWDS,CROWDS[0]],small(4,{route:'piane',growth:5,fieldIds:[...CAGES,QUESTION],fixedFields:true,revealRounds:[1,1,1,1],winRule:'gabbie',openingPlayerFirst:true,alwaysPlayerFirst:true,noFinalReward:true,text:'Tre Gabbie permettono di ottenere gli agenti sconfitti. Porre il quesito conclude lo scontro. Le catture sono il solo premio; nessuna perdita permanente delle tue carte.'})),
  fight('A04-altopiano-luogo','Templi nella natura',[CROWDS[1],...codes('V01 V04 V05')],small(4,{route:'altopiano',growth:5,fieldIds:[...TEMPLES,8,12],fixedFields:true,text:'I templi servono al culto e all’assistenza. Ogni Tempio conquistato concede +1 PV massimo permanente al vincitore; se nemico, a tutti i nemici futuri.'})),
  fight('A04-strada-luogo','Il magazzino dell’esattore',codes('V01 V02 V04 V06'),small(4,{route:'strada',growth:5,fieldIds:[TEMPLES[0],CAGES[0],STOREHOUSE,12],fixedFields:true,text:'Provviste, una Gabbia e un Tempio sostengono il percorso. Tempio: +1 PV massimo; Magazzino: +1 FC massimo, anche per i nemici. La cattura si aggiunge al premio finale.'})),
  event('E3','La prima crescita','La città è più vicina. Scegli liberamente il Potere del Nascente: passa a Lega 3, senza altri aumenti statistici.',[]),
  fight('A05','La prima Faglia',[407,408,410,421,404],{kind:'faglia',army:'Calibri Pesanti',fieldIds:[8,12,2,1,4],text:'La deformazione dello spazio si apre sul percorso. Un esercito estraneo alla Concordia attraversa la Faglia e ti attacca.'}),
  event('E4','La rete dei rifornimenti','Riaprire il collegamento sosterrà sia il tuo seguito sia le difese Concordia.',[
    option('reopen','Riapri: +1 FC massimo a te e ai nemici Concordia',[stat('player','focus'),stat('concordia','focus')]),option('leave','Prosegui senza intervenire')]),
  fight('A06','La linea di raccolta','V01 V02 V04 V05 G01',{growth:6,budget:18,text:'Un reparto tiene il passaggio mentre altri si ritirano verso le difese interne.'}),
  event('E5','Due preparativi del Vallo','Puoi interrompere una sola operazione. Entrambe richiedono due incontri; l’altra rafforzerà la Concordia al termine.',[
    option('fonderia','Fonderia: +1 PV massimo a te; +1 FC massimo ai nemici Concordia'),
    option('convogli','Convogli: +1 FC massimo a te; +1 PV massimo ai nemici Concordia')]),
  fight('A07-fonderia','Accesso alla fonderia','V01 V02 V04 V06 G01',{operation:'fonderia'}),
  fight('A08-fonderia','Presidio della fonderia','V01 V03 V05 G01 G04',{operation:'fonderia',growth:7,budget:21,effects:[stat('player','life'),stat('concordia','focus')]}),
  fight('A07-convogli','Scorta dei convogli','V01 V02 V05 V06 G04',{operation:'convogli'}),
  fight('A08-convogli','Deposito dei convogli','V02 V04 V06 G01 G02',{operation:'convogli',growth:7,budget:21,effects:[stat('player','focus'),stat('concordia','life')]}),
  fight('A09','Il responsabile del Vallo','V01 V02 V04 V05 G01 G02 G03',{kind:'elite',size:7,required:codes('G01'),growth:8,budget:24,difficulty:'hard'}),
  event('E7','L’ospizio sul percorso','Il luogo assiste feriti e viaggiatori. Ripristinarne i rifornimenti sosterrà anche chi difende Cael.',[
    option('restore','Ripristina: +1 PV massimo a te e ai nemici Concordia',[stat('player','life'),stat('concordia','life')]),option('leave','Prosegui senza intervenire')]),
  fight('F2','La seconda Faglia',[207,209,210,221,204,205,206,222],{kind:'faglia',optional:true,size:8,army:'Kethran',required:[204,221],fieldIds:[8,12,2,1,4]}),
  fight('A10-terrapieno','Via del terrapieno','V01 V02 V04 V05 V06 G01 G02 G03',{size:8,growth:9,budget:27,required:codes('G02')}),
  fight('A10-canali','Passaggio dei canali','V01 V02 V03 V04 V06 G01 G03 G04',{size:8,growth:9,budget:27,required:codes('G04')}),
  fight('A11','La difesa della Seconda Campana','V01 V02 V03 V04 V05 V06 G01 G02 G03',{kind:'elite',size:9,growth:10,budget:30,required:codes('G03 G01'),difficulty:'hard',text:'Gli Impetuosi possono Terraformare la Torre del Richiamo. La Torre soddisfa Staffetta, ma non elimina blocchi o requisiti di disponibilità del Bonus.'}),
  event('E8','Prima dell’ultimo accesso','La crescita riguarda una sola statistica. La Lega del Nascente resta 3.',[option('finalPower','+1 POT permanente al Nascente'),option('finalDamage','+1 DAN permanente al Nascente')]),
  fight('A12','L’ultimo accesso esterno','V01 V02 V03 V04 V05 V06 G01 G02 G03 G04',{size:10,required:codes('G01')}),
  fight('A13','Il presidio ai piedi di Cael',[CAEL_BOSS,...codes('V01 V02 V04 V05 V06 G01 G02 G03')],{kind:'boss',size:9,signature:CAEL_BOSS,difficulty:'hard',squads:[[CAEL_BOSS,...codes('G03 G01 V01 V05')],[CAEL_BOSS,...codes('G02 V02 V04 V06')]],text:'Demise, variante di campagna L4, difende il basamento. Due squadre, PV conservati e FC ripristinati; un solo premio conclusivo. Annientare il nemico conclude l’incontro.'}),
];
const byId = new Map(CAEL_NODES.map(n=>[n.id,n]));
export const caelNode = id => byId.get(id);
export function caelStages(run) {
  const route=run.flags.route, operation=run.flags.operation;
  const routes=route?[route]:access.map(a=>a[0]);
  const ops=operation?[operation]:['fonderia','convogli'];
  return [['E0'],routes.map(r=>`A01-${r}`),routes.map(r=>`E1-${r}`),routes.map(r=>`A02-${r}`),['E2'],routes.map(r=>`A03-${r}`),routes.flatMap(r=>[`A04-${r}-presidio`,`A04-${r}-luogo`]),['E3'],['A05'],['E4'],['A06'],['E5'],ops.map(o=>`A07-${o}`),ops.map(o=>`A08-${o}`),['A09'],['E7'],['F2'],['A10-terrapieno','A10-canali'],['A11'],['E8'],['A12'],['A13']];
}
export function validateCaelData() {
  for (const node of CAEL_NODES) {
    if(node.kind==='event')continue;
    if(node.roster.length!==node.size || node.roster.some(id=>!firstActCard(id)))throw new Error(`${node.id}: roster incompleto`);
    if(node.fieldIds.length!==Math.min(5,node.size)||node.fieldIds.some(id=>!campaignField(id)))throw new Error(`${node.id}: Campi incompleti`);
    if(node.squads?.some(s=>s.length!==5||s.some(id=>!node.roster.includes(id))))throw new Error(`${node.id}: squadre non valide`);
    if(node.required.some(id=>!node.roster.includes(id)))throw new Error(`${node.id}: garanzia assente`);
  }
  return true;
}
