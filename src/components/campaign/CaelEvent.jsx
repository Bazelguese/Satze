import React from 'react';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { POWER_PACKAGES, NASCENTE } from '../../campaign/data/firstAct.js';
import { firstActRunNode, eventChoices, previewFirstActChoice, runCard, runLeague, caelChoiceLabel } from '../../campaign/state/firstActState.js';
export function CaelEvent({run,choice,setChoice,commit}) {
  const node=firstActRunNode(run,run.pendingEvent.id),options=eventChoices(run);
  let preview,error;
  if(choice)try{preview=previewFirstActChoice(run,choice);}catch(e){error=e.message;}
  const changed=preview?.copies.find(c=>run.copies.find(x=>x.uid===c.uid)?.cardId!==c.cardId);
  const card=runCard(preview||run,changed?.uid||NASCENTE);
  return <section className="cs-question">
    <header><p className="cs-kicker">EVENTO · IL CAMMINO VERSO CAEL</p><h2>{node.title}</h2><p>{node.text}</p></header>
    <div className="cs-cael-event-body">
      <div className="cs-question-answers"><p className="cs-kicker">SCEGLI COME PROSEGUIRE</p>
        {options.map(id=>{const pkg=POWER_PACKAGES.find(p=>p.id===id);return <button key={id} aria-pressed={choice===id} onClick={()=>setChoice(id)}>
          <strong>{caelChoiceLabel(run,id)}</strong>{pkg&&<span>{runCard(previewFirstActChoice(run,id),NASCENTE).description}</span>}
        </button>;})}
        {node.id==='E1-strada'&&<p>Eccezione di questo evento: nessuna vittoria o tappa di maturazione richiesta. Una sola copia viene sostituita; nessun Figlio L1.</p>}
      </div>
      <aside className="cs-question-preview" aria-label="Anteprima della scelta" aria-live="polite">
        <p className="cs-kicker">{preview?'DOPO LA SCELTA':'IL NASCENTE ATTUALE'}</p>
        <CardReworkP4Scaled agent={card} width={200}/><p>{card.description}</p><p>{card.power} POT · {card.damage} DAN · L{card.league}</p>
        <small>Lega esercito: {runLeague(preview||run)}/{(preview||run).budget}</small>
        {preview?.statuses.filter(s=>!run.statuses.some(x=>x.id===s.id)).map(s=><p key={s.id}>{s.target==='player'?'Giocatore':'Nemici Concordia'}: +{s.value} {({life:'PV massimi',focus:'FC massimi',budget:'Lega esercito'})[s.resource]} · Permanente</p>)}
        {error&&<p role="alert">{error}</p>}
        <button className="cs-primary" disabled={!preview} onClick={()=>{if(commit({type:'CHOICE',choice}))setChoice(null);}}>Conferma scelta</button>
      </aside>
    </div>
  </section>;
}
