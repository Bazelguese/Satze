import React from 'react';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { firstActNode, POWER_PACKAGES, NASCENTE } from '../../campaign/data/firstAct.js';
import { eventChoices, previewFirstActChoice, runCard, runLeague } from '../../campaign/state/firstActState.js';

const labels = { conserva:'Per ora, ciò che sono basta.', power:'La forza per contendere il terreno. (+1 POT)', damage:'Rendere decisiva una vittoria. (+1 DAN)', finalPower:'Accrescere la mia forza. (+1 POT, stessa Lega)', finalDamage:'Rendere più incisivi i miei colpi. (+1 DAN, stessa Lega)', liberi:'Liberali. (+3 PV alla prossima battaglia)', trattenuti:'Trattienili. (+2 FC alla prossima battaglia)', comunione:'Lascia parlare i Concordia conservati. (+2 FC e Comunione)' };

export function FirstActEvent({run,choice,setChoice,family,setFamily,commit}) {
  const options = eventChoices(run);
  const packages = POWER_PACKAGES.filter(p=>options.includes(p.id));
  const families = [...new Set(packages.map(p=>p.family))];
  let preview, error;
  if (choice) try { preview = previewFirstActChoice(run,choice); } catch(e) { error=e.message; }
  const card = runCard(preview || run,NASCENTE);
  const describe = id => {
    try { return runCard(previewFirstActChoice(run,id),NASCENTE).description; } catch(e) { return e.message; }
  };
  return <section className="cs-question">
    <header><p className="cs-kicker">EVENTO · IL CAMMINO DEL NASCENTE</p><h2>{firstActNode(run.pendingEvent.id).title}</h2>
      <p>{run.pendingEvent.id==='E06'?'Hanno deposto le armi. Le campane continuano a suonare.':'Su cosa vuoi fondare la forza che porterai oltre il Vallo?'}</p>
    </header>
    <div className="cs-question-body">
      <nav className="cs-question-families" aria-label="Temi della domanda">
        <p className="cs-kicker">LA TUA CONVINZIONE</p>
        <button aria-pressed={!family} onClick={()=>{setFamily(null);setChoice(null);}}>Il cammino attuale</button>
        {families.map(f=><button key={f} aria-pressed={family===f} onClick={()=>{setFamily(f);setChoice(null);}}>{f}</button>)}
      </nav>
      <div key={family || 'current'} className="cs-question-answers"><p className="cs-kicker">{family?'COME LA TRADUCI IN BATTAGLIA?':'COME VUOI PROSEGUIRE?'}</p>
        <h3>{family || 'La forza che hai già'}</h3>
        {(family ? packages.filter(p=>p.family===family) : options.filter(id=>labels[id]).map(id=>({id,answer:labels[id]}))).map(p=><button key={p.id} aria-pressed={choice===p.id} onClick={()=>setChoice(p.id)}>
          <strong>{p.answer}</strong>{packages.some(pkg=>pkg.id===p.id)&&<span>{describe(p.id)}</span>}
        </button>)}
        <p className="cs-question-note">{family?'Puoi esplorare ogni convinzione prima di confermare la risposta.':'Seleziona una risposta per vedere il risultato prima di confermarlo.'}</p>
      </div>
      <aside className="cs-question-preview" aria-label="Anteprima del Nascente" aria-live="polite">
        <p className="cs-kicker">{preview?'DOPO LA TUA RISPOSTA':'IL NASCENTE ATTUALE'}</p>
        <div key={choice || 'current'} className="cs-roster-card cs-choice-card"><CardReworkP4Scaled agent={card} width={200}/></div>
        <p>{card.description}</p><p className="cs-choice-stats">{card.power} POT · {card.damage} DAN · L{card.league}</p><small>Lega esercito: {runLeague(preview || run)}/30</small>
        {error&&<p role="alert">{error}</p>}
        <button className="cs-primary" disabled={!preview} onClick={()=>{if(commit({type:'CHOICE',choice})){setChoice(null);setFamily(null);}}}>Conferma risposta</button>
      </aside>
    </div>
  </section>;
}
