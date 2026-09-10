import React, { useState } from 'react';
import { CampaignDialog } from './CampaignDialog.jsx';
import { CampaignSigil } from './CampaignScenery.jsx';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { NASCENTE, firstActCard } from '../../campaign/data/firstAct.js';
import { runCard, runLeague, mature, transformationPool } from '../../campaign/state/firstActState.js';

export function FirstActArmyDialog({ run, draft, setDraft, commit, error, onClose }) {
  const [tab,setTab] = useState('army');
  const [selected,setSelected] = useState(null);
  const [received,setReceived] = useState(null);
  const copy = run.copies.find(c=>c.uid === selected);
  const source = copy && firstActCard(copy.cardId);
  const pool = copy ? transformationPool(run,copy.uid) : [];
  const locked = !!(run.active || run.pendingReward || run.pendingEvent || run.outcome);
  const count = id => run.copies.filter(c=>c.cardId === id).length;
  const transform = () => {
    const next = commit({type:'TRANSFORM',uid:copy.uid});
    if (next) { setReceived(next.copies.find(c=>c.uid===copy.uid).cardId); setSelected(null); }
  };
  return <CampaignDialog title="Armata e riserva" kicker="IL TUO SEGUITO" onClose={onClose}>
    <nav className="cs-army-tabs" aria-label="Gestione armata">
      <button aria-pressed={tab==='army'} onClick={()=>setTab('army')}>Armata · {draft.length}/{run.slots}</button>
      <button aria-pressed={tab==='reserve'} onClick={()=>setTab('reserve')}>Riserva e trasformazione · {run.copies.length}</button>
    </nav>
    {error && <p className="cs-error" role="alert">{error}</p>}
    {tab === 'army' ? <>
      <p>Lega {runLeague(run,draft)}/30 · Una sola copia per identità nell’esercito.</p>
      <div className="cs-army-roster-scroll"><div className="cs-card-roster">
        {[NASCENTE,...new Set(run.copies.map(c=>c.cardId))].map(id=><label key={id} className={draft.includes(id)?'selected':''}>
          <input type="checkbox" aria-label={runCard(run,id).name} checked={draft.includes(id)} disabled={id===NASCENTE||!!run.active||!!run.pendingReward}
            onChange={e=>setDraft(e.target.checked?[...draft,id]:draft.filter(x=>x!==id))}/>
          <div className="cs-roster-card"><CardReworkP4Scaled agent={runCard(run,id)} width={176}/></div>
          <span>{draft.includes(id)?'Schierato nell’armata':'In riserva'}</span>
        </label>)}
      </div></div>
      <button className="cs-primary" disabled={!!run.active||!!run.pendingReward} onClick={()=>{if(commit({type:'SET_DECK',deck:draft}))onClose();}}>Salva armata</button>
    </> : <div className="cs-transform-layout">
      <div className="cs-reserve-list" role="group" aria-label="Copie da trasformare">
        <p className="cs-kicker">SCEGLI LA COPIA DA CONSUMARE</p>
        {!run.copies.length && <p>Gli agenti ottenuti dopo gli scontri compariranno qui.</p>}
        {run.copies.map(c=>{
          const card = firstActCard(c.cardId), ready = transformationPool(run,c.uid).length > 0;
          return <button key={c.uid} aria-pressed={selected===c.uid} onClick={()=>{setSelected(c.uid);setReceived(null);}}>
            <img src={`${import.meta.env.BASE_URL}card-images/agents/${card.id}.webp`} alt=""/>
            <span><strong>{card.name}</strong><small>Lega {card.league} · {count(card.id)} {count(card.id)===1?'copia':'copie'}</small>
              <small>{!mature(run,c)?'Matura dopo un’altra tappa':ready?'Trasformazione disponibile':'Nessuna trasformazione disponibile'}</small></span>
          </button>;
        })}
      </div>
      <section className="cs-transform-detail" aria-label="Anteprima trasformazione" aria-live="polite">
        {received ? <div className="cs-transform-result"><p className="cs-kicker">TRASFORMAZIONE COMPLETATA</p>
          <CardReworkP4Scaled agent={firstActCard(received)} width={220}/><h3>{firstActCard(received).name}</h3><p>Il nuovo Figlio è ora nella tua armata o in riserva, al posto della copia consumata.</p>
          <button className="cs-primary" onClick={()=>setReceived(null)}>Continua</button>
        </div> : source ? <>
          <p className="cs-kicker">UNA COPIA · UNA NUOVA IDENTITÀ</p>
          <div className="cs-transform-cards"><div className="cs-roster-card"><CardReworkP4Scaled agent={source} width={200}/></div><span aria-hidden="true">→</span>
            <div className="cs-transform-mystery"><CampaignSigil kind="sun"/><strong>Figlio dell’Orizzonte</strong><span>Lega {source.league}</span><small>Identità casuale</small></div>
          </div>
          <h3>{source.name}</h3><p>Consumi questa copia e ottieni un Figlio casuale della stessa Lega, fra quelli che non possiedi.</p>
          {run.deck.includes(source.id)&&<p>{count(source.id)>1?'Un’altra copia conserverà il suo posto nell’armata.':'Il nuovo Figlio prenderà il suo posto nell’armata.'}</p>}
          <p className="cs-transform-pool">{pool.length ? `${pool.length} esiti possibili: ${pool.map(id=>firstActCard(id).name).join(', ')}.` : !mature(run,copy)?'Completa una tappa successiva all’acquisizione per far maturare la copia.':'Non ci sono Figli disponibili di pari Lega per questa copia.'}</p>
          {locked && <p>La trasformazione sarà disponibile dopo aver concluso l’incontro o l’evento.</p>}
          <button className="cs-primary" disabled={locked||!pool.length} onClick={transform}>Conferma trasformazione casuale</button>
        </> : <div className="cs-transform-empty"><CampaignSigil kind="sun"/><h3>Un nuovo orizzonte</h3><p>Seleziona una copia nella riserva per conoscere la sua trasformazione.</p><small>La scelta del Figlio ottenuto è casuale.</small></div>}
      </section>
    </div>}
  </CampaignDialog>;
}
