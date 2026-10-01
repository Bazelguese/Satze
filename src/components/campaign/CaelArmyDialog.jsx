import React,{useState} from 'react';
import { CampaignDialog } from './CampaignDialog.jsx';
import { CampaignTransformation } from './CampaignTransformation.jsx';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { NASCENTE, firstActCard } from '../../campaign/data/firstAct.js';
import { runCard, runLeague, transformationPool, promotionOffer } from '../../campaign/state/firstActState.js';
export function CaelArmyDialog({run,draft,setDraft,commit,error,onClose}) {
  const [selected,setSelected]=useState(null),[sequence,setSequence]=useState(null);
  const copy=run.copies.find(c=>c.uid===selected),card=copy&&firstActCard(copy.cardId);
  const locked=!!(run.active||run.pendingReward||run.pendingEvent||run.outcome);
  const offer=copy?promotionOffer(run,copy.uid):[],pool=copy?transformationPool(run,copy.uid):[];
  const evolve=(type,cardId)=>{
    const next=commit({type,uid:copy.uid,cardId});
    if(next)setSequence({source:card,result:firstActCard(next.copies.find(c=>c.uid===copy.uid).cardId),kind:type==='PROMOTE'?'promotion':'transformation'});
  };
  return <CampaignDialog title="Esercito del Nascente e riserva" kicker="OGNI COPIA HA IL PROPRIO CAMMINO" onClose={onClose}>
    {error&&<p className="cs-error" role="alert">{error}</p>}
    {sequence?<CampaignTransformation {...sequence} onComplete={()=>setSequence(null)}/>:<>
      <p>{draft.length}/{run.slots} posti · Lega {runLeague(run,draft)}/{run.budget}. Puoi schierare più copie della stessa identità e lasciare posti vuoti.</p>
      <div className="cs-cael-army-grid">
        <section className="cs-cael-copies" aria-label="Copie dell’esercito">
          {[NASCENTE,...run.copies.map(c=>c.uid)].map(id=>{const c=run.copies.find(c=>c.uid===id),agent=runCard(run,id);return <article key={id} className={selected===id?'selected':''}>
            <label><input type="checkbox" aria-label={`Schiera ${agent.name}${c?` · ${c.uid}`:''}`} checked={draft.includes(id)} disabled={id===NASCENTE||!!run.active||!!run.pendingReward} onChange={e=>setDraft(e.target.checked?[...draft,id]:draft.filter(x=>x!==id))}/>{draft.includes(id)?'Schierato':'Riserva'} {c?.uid}</label>
            <button disabled={!c} onClick={()=>setSelected(id)} aria-label={`Gestisci ${agent.name}${c?` · ${c.uid}`:''}`}><CardReworkP4Scaled agent={agent} width={160}/></button>
            {c&&<small>{c.wins} vittorie personali · soglia {agent.league}</small>}
          </article>;})}
        </section>
        <section className="cs-cael-evolution" aria-label="Promozione e trasformazione">
          {copy?<><h3>{card.name} · {copy.uid}</h3><p>{copy.wins} vittorie personali. La promozione richiede {card.league} vittorie e non supera la Lega del Nascente.</p>
            <h4>Promozione Concordia</h4>
            {offer.length?<><p>Scegli fra metà del pool L{card.league+1}, arrotondata per eccesso. L’offerta resta la stessa riaprendo la schermata.</p><div className="cs-cael-promotions">{offer.map(id=><button disabled={locked} key={id} onClick={()=>evolve('PROMOTE',id)}><CardReworkP4Scaled agent={firstActCard(id)} width={140}/><span>Promuovi in {firstActCard(id).name}</span>{run.copies.some(c=>c.cardId===id)&&<small>Identità già posseduta</small>}</button>)}</div></>:<p>Promozione non disponibile: verifica vittorie personali, appartenenza Concordia e Lega del Nascente.</p>}
            <h4>Trasformazione</h4><p>{card.league===1?'Le folle L1 devono prima essere promosse a L2. Non esistono Figli L1.':pool.length?`${pool.length} Figli di pari Lega disponibili. L’identità viene estratta casualmente.`:'Completa una tappa dopo l’acquisizione. Servono Figli di pari Lega non ancora posseduti.'}</p>
            <button className="cs-primary" disabled={locked||!pool.length} onClick={()=>evolve('TRANSFORM')}>Trasforma questa copia</button>
            <p>La nuova identità sostituisce soltanto questa copia. Se il budget non basta, spostala in riserva e salva l’esercito prima della promozione.</p>
            {locked&&<p>Completa prima l’incontro o l’evento per evolvere le copie.</p>}
          </>:<p>Seleziona una copia per vederne vittorie, promozioni e trasformazioni.</p>}
        </section>
      </div>
      <button className="cs-primary" disabled={!!run.active||!!run.pendingReward} onClick={()=>commit({type:'SET_DECK',deck:draft})}>Salva esercito</button>
    </>}
  </CampaignDialog>;
}
