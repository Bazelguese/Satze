import {CONCORDIA_ARMY,CONCORDIA_DECKS} from './concordia.js';
export const STARTER_DECK=[9001,107,108,109,110,115,120,121,104,114];
const specials=[
 {army:'Corte Rossa',deck:[307,308,309,310,315,304,305,306,314,318]},
 {army:'Ratti della Megera',deck:[806,807,808,809,810,804,805,813,814,815]},
 {army:'Kethran',deck:[207,208,209,210,215,202,204,205,206,218]},
];
const decks=[['guarnigione','guarnigione','pattuglia','vespro','pattuglia','corona'],['pattuglia','vespro','pattuglia','corona','vespro','sortita'],['vespro','corona','vespro','sortita','corona','sortita']];
const acts=['Oltre il Vallo','Le Livree del Vespro','Il Primo Sole'].map((title,index)=>{
 const id=`concordia_atto_${index+1}`;
 const stages=Array.from({length:6},(_,step)=>{
  const missionId=`${id}_${step+1}`;
  const kind=step===5?'boss':step===3?'elite':'battle';
  const mission={id:missionId,node:missionId,kind,
   title:step===5?['La Corona Vuota','L’Ultima Sortita','Il Custode del Primo Sole'][index]:['Le Vedette','Le Porte','Il Crocevia','La Livrea Rossa','Il Vallo Interno'][step],
   ...(kind==='boss'?{signatureCardId:index===0?9114:9115}:{}),
   objective:'dominazione',fields:5,difficulty:index===0&&step<2?'easy':kind==='battle'?'medium':'hard',
   briefing:kind==='boss'?'Le campane chiamano l’ultima difesa. Il Nascente affronta il comando della Concordia.':'I Resistenti presidiano il passaggio. Il loro Intervento premia chi risponde per secondo: conquista i campi e apri la strada.',
   enemy:{army:CONCORDIA_ARMY,deck:[...CONCORDIA_DECKS[decks[index][step]]],life:25}};
  const alternatives=[mission];
  if(step===2)alternatives.push({...mission,id:`${id}_speciale`,node:`${id}_speciale`,kind:'special',title:`Incontro speciale — ${specials[index].army}`,briefing:'Un’altra armata attraversa il cammino. Scegli questo incontro oppure la pattuglia della Concordia: le vie si ricongiungono prima dell’élite.',enemy:{...specials[index],life:25}});
  return {id:`${id}_tappa_${step+1}`,alternatives};
 });
 return {id,title,stages};
});
const events=acts.flatMap((act,i)=>[
 {id:`richiamo_${i+1}`,missionId:act.stages[1].alternatives[0].id,title:'Un Figlio disperso',body:'Dietro le porte, una voce risponde al Nascente. Puoi richiamarla nell’armata.',choices:[{label:'Accogli il Figlio',reward:'card',cardId:[113,118,125][i]},{label:'Prosegui',reward:'none'}]},
 {id:`evoluzione_${i+1}`,missionId:act.stages[3].alternatives[0].id,title:'La forma del Nascente',body:'Superata la livrea rossa, il Nascente trova una nuova stabilità. Scegli quale traccia conservare.',choices:[{label:'+1 POT al Nascente',reward:'power'},{label:'+1 DAN al Nascente',reward:'damage'},{label:'Rafforza l’Impronta (+1)',reward:'imprint'},{label:'Mantieni la forma',reward:'none'}]},
 {id:`speciale_${i+1}`,missionId:act.stages[2].alternatives[1].id,title:'Una tregua inattesa',body:'L’altra armata riconosce il valore del Nascente. Un suo agente si offre di seguirti.',choices:[{label:'Accetta l’alleato',reward:'card',cardId:specials[i].deck[0]},{label:'Riprendi il cammino da solo',reward:'none'}]},
]);
export const CONTROLLED_CAMPAIGN={version:1,id:'nascente_concordia',title:'Il Nascente — Le Campane del Vallo',playerArmy:"Figli dell'Orizzonte",acts,events};
