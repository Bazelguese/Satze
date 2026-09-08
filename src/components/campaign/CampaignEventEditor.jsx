import React,{useMemo,useRef,useState} from 'react';
import {CONTROLLED_CAMPAIGN} from '../../campaign/data/controlledCampaign.js';
import {allMissions,cloneDefinition,loadCampaignDefinition,REWARDS,saveCampaignDefinition,validateCampaignDefinition} from '../../campaign/logic/campaignDefinition.js';
import {ARMY_SETS} from '../../data/cards.js';
import '../../styles/campaign/controlled-campaign.css';

export function CampaignEventEditor({onBack}){
 const [initial]=useState(()=>{try{return {definition:loadCampaignDefinition(),error:''};}catch(e){return {definition:cloneDefinition(CONTROLLED_CAMPAIGN),error:`Configurazione salvata non leggibile: ${e.message}. È aperta la base originale; salvala per ripristinare la distribuzione.`};}});
 const [draft,setDraft]=useState(initial.definition),[selected,setSelected]=useState(initial.definition.events[0]?.id);
 const [error,setError]=useState(initial.error),[status,setStatus]=useState(''),[dirty,setDirty]=useState(false);
 const fileInput=useRef(null),errors=useMemo(()=>validateCampaignDefinition(draft),[draft]);
 const event=draft.events.find(e=>e.id===selected),missions=allMissions(draft);
 const cards=Object.entries(ARMY_SETS).flatMap(([army,list])=>list.map(c=>({...c,army})));
 const change=next=>{setDraft(next);setDirty(true);setStatus('');};
 const update=patch=>change({...draft,events:draft.events.map(e=>e.id===selected?{...e,...patch}:e)});
 const updateChoice=(i,patch)=>update({choices:event.choices.map((c,j)=>j===i?{...c,...patch}:c)});
 const move=(id,delta)=>{const list=[...draft.events],i=list.findIndex(e=>e.id===id);if(i+delta<0||i+delta>=list.length)return;[list[i],list[i+delta]]=[list[i+delta],list[i]];change({...draft,events:list});};
 const exportFile=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='satze-campagna-concordia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const importFile=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>512000)throw new Error('Il file supera 500 KB.');const value=JSON.parse(await file.text());const problems=validateCampaignDefinition(value);if(problems.length)throw new Error(problems.join('\n'));change(cloneDefinition(value));setSelected(value.events[0]?.id);setError('');}catch(err){setError(`Importazione rifiutata: ${err.message}`);}};
 return <section className="campaign-control">
  <header className="cc-header"><div><p className="cc-eyebrow">Strumenti campagna</p><h1>Regia degli eventi</h1><p>Assegna gli eventi agli incontri dei tre atti. Si attivano dopo una vittoria, nell’ordine della lista.</p></div><button onClick={onBack}>{dirty?'Chiudi senza salvare':'Torna alla campagna'}</button></header>
  <div className="cc-toolbar"><button disabled={!!errors.length} onClick={()=>{try{saveCampaignDefinition(draft);setError('');setDirty(false);setStatus('Distribuzione salvata. Verrà usata dalle nuove campagne; le partite in corso conservano la propria versione.');}catch(e){setError(`Salvataggio non riuscito: ${e.message}`);}}}>Salva distribuzione</button><button disabled={!!errors.length} onClick={exportFile}>Esporta JSON</button><button onClick={()=>fileInput.current.click()}>Importa JSON</button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importFile}/><span>{dirty?'Modifiche da salvare':'Nessuna modifica pendente'} · {draft.events.length} eventi</span></div>
  <p className="cc-note">Le modifiche salvate valgono per le nuove campagne. Esporta il JSON per trasferire la configurazione su un altro dispositivo.</p>
  {status&&<p role="status" className="cc-success">{status}</p>}{error&&<p role="alert" className="cc-error">{error}</p>}{!!errors.length&&<div role="alert" className="cc-error">{errors.map((e,i)=><p key={i}>{e}</p>)}</div>}
  <div className="cc-editor-grid"><aside className="cc-panel"><h2>Sequenza degli eventi</h2><p className="cc-note">Gli eventi sul ramo non scelto non si attivano.</p>
   {draft.events.map((ev,i)=><div key={ev.id} className={`cc-event-row ${selected===ev.id?'selected':''}`}><button className="cc-event-select" onClick={()=>setSelected(ev.id)}><strong>{ev.title||'Evento senza titolo'}</strong><small>{missions.find(m=>m.id===ev.missionId)?.title}</small></button><button aria-label={`Sposta su ${ev.title}`} disabled={i===0} onClick={()=>move(ev.id,-1)}>↑</button><button aria-label={`Sposta giù ${ev.title}`} disabled={i===draft.events.length-1} onClick={()=>move(ev.id,1)}>↓</button></div>)}
   <button disabled={draft.events.length>=100} onClick={()=>{const id=`evento_${crypto.randomUUID()}`;change({...draft,events:[...draft.events,{id,missionId:missions[0].id,title:'Nuovo evento',body:'',choices:[{label:'Prosegui',reward:'none'}]}]});setSelected(id);}}>+ Aggiungi evento</button>
  </aside><div className="cc-panel">{event?<><h2>Modifica evento</h2>
   <label>Titolo<input maxLength={120} value={event.title} onChange={e=>update({title:e.target.value})}/></label>
   <label>Dopo quale incontro?<select value={event.missionId} onChange={e=>update({missionId:e.target.value})}>{draft.acts.map((a,i)=><optgroup key={a.id} label={`Atto ${i+1} · ${a.title}`}>{a.stages.flatMap((s,j)=>s.alternatives.map(m=><option key={m.id} value={m.id}>{j+1}. {m.title}</option>))}</optgroup>)}</select></label>
   <label>Testo narrativo<textarea rows={4} maxLength={4000} value={event.body} onChange={e=>update({body:e.target.value})}/></label><h3>Scelte e ricompense</h3>
   {event.choices.map((c,i)=><fieldset key={i}><legend>Scelta {i+1}</legend><label>Testo del pulsante<input maxLength={160} value={c.label} onChange={e=>updateChoice(i,{label:e.target.value})}/></label><label>Ricompensa<select value={c.reward} onChange={e=>updateChoice(i,{reward:e.target.value,...(e.target.value==='card'?{cardId:107}:{})})}>{Object.entries(REWARDS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>{c.reward==='card'&&<label>Carta<select value={c.cardId} onChange={e=>updateChoice(i,{cardId:Number(e.target.value)})}>{cards.map(card=><option key={card.id} value={card.id}>{card.army} · {card.name} · L{card.league}</option>)}</select></label>}<button disabled={event.choices.length===1} onClick={()=>update({choices:event.choices.filter((_,j)=>j!==i)})}>Rimuovi scelta</button></fieldset>)}
   <div className="cc-toolbar"><button disabled={event.choices.length===4} onClick={()=>update({choices:[...event.choices,{label:'Prosegui',reward:'none'}]})}>+ Aggiungi scelta</button><button onClick={()=>{change({...draft,events:draft.events.filter(e=>e.id!==selected)});setSelected(draft.events.find(e=>e.id!==selected)?.id);}}>Elimina evento</button></div>
  </>:<p>Seleziona o aggiungi un evento.</p>}</div></div>
  <div className="cc-panel"><h2>Distribuzione nei tre atti</h2><div className="cc-distribution">{draft.acts.map((a,i)=><div key={a.id}><h3>Atto {i+1} · {a.title}</h3>{a.stages.flatMap((s,j)=>s.alternatives.map(m=><div className="cc-distribution-row" key={m.id}><strong>{j+1}. {m.title}</strong><span>{draft.events.filter(e=>e.missionId===m.id).map(e=>e.title).join(' → ')||'Nessun evento'}</span></div>))}</div>)}</div></div>
 </section>;
}
