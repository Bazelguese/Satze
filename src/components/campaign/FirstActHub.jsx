import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { CampaignScene, CampaignMotionControl, campaignMotionAllowed } from './CampaignScene.jsx';
import { CampaignBackdrop, CampaignArt, CampaignSigil, CampaignMap, campaignArt, heroArt, encounterKinds } from './CampaignScenery.jsx';
import { CampaignDeparture } from './CampaignDeparture.jsx';
import { CampaignDialog } from './CampaignDialog.jsx';
import { loadCampaignRun, saveCampaignRun } from '../../campaign/state/persistence.js';
import { availableFirstActNodes, firstActReducer, previewFirstActReward, firstActStats, runCard, runLeague } from '../../campaign/state/firstActState.js';
import { FIRST_ACT_STAGES, NASCENTE_ARCHETYPES, POWER_PACKAGES, firstActNode, firstActCard, NASCENTE, TOWER_ID, campaignField } from '../../campaign/data/firstAct.js';
import { firstActDuelConfig } from '../../campaign/logic/firstActBattle.js';
import { FirstActArmyDialog } from './FirstActArmyDialog.jsx';
import { FirstActEvent } from './FirstActEvent.jsx';
import { stageX } from './campaignMapLayout.js';
import '../../styles/campaign/controlled-campaign.css';
import '../../styles/campaign/first-act.css';
export function FirstActHub({ campaignSaveSlot=0, onStartMission, onBack }) {
  const [run,setRun] = useState(()=>loadCampaignRun(campaignSaveSlot));
  const [error,setError] = useState(''), [army,setArmy]=useState(false), [selected,setSelected]=useState(null), [choice,setChoice]=useState(null), [family,setFamily]=useState(null), [inspect,setInspect]=useState(false);
  const [departure,setDeparture]=useState(null);
  const [summary,setSummary]=useState(false);
  const mapViewport=useRef(null);
  const currentRun=useRef(run);
  useEffect(()=>{
    const viewport=mapViewport.current;
    if (!viewport) return;
    const left=Math.max(0,stageX(run?.stage || 0)-viewport.clientWidth/2);
    viewport.scrollLeft=left;
  },[run?.stage,run?.pendingReward,run?.pendingEvent]);
  useEffect(()=>{
    const viewport=mapViewport.current;
    if (!viewport) return;
    const wheel=e=>{
      if(e.ctrlKey || Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      const delta=e.deltaY*(e.deltaMode===1?24:e.deltaMode===2?viewport.clientWidth:1);
      const next=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+delta));
      if(next!==viewport.scrollLeft){e.preventDefault();viewport.scrollLeft=next;}
    };
    viewport.addEventListener('wheel',wheel,{passive:false});
    return ()=>viewport.removeEventListener('wheel',wheel);
  },[run?.pendingReward,run?.pendingEvent,run?.outcome]);
  const [draft,setDraft]=useState(run?.deck || []);
  if (!run) return <section className="campaign-control"><p>Salvataggio non leggibile.</p><button onClick={onBack}>Menu</button></section>;
  const commit = action => {
    try {
      const previous=currentRun.current, next=firstActReducer(previous,action);
      if(!saveCampaignRun(next,campaignSaveSlot)) throw new Error('Salvataggio non riuscito: nessuna azione confermata.');
      currentRun.current=next;
      const update=()=>{setRun(currentRun.current);setDraft(currentRun.current.deck);setError('');};
      const changed=previous.stage!==next.stage || previous.pendingReward!==next.pendingReward || previous.pendingEvent!==next.pendingEvent;
      if(changed && campaignMotionAllowed() && document.startViewTransition) {
        try { const transition=document.startViewTransition(()=>flushSync(update));transition.ready?.catch(()=>{}); }
        catch { update(); }
      } else update();
      return next;
    }
    catch(e){setError(e.message);return null;}
  };
  const available=availableFirstActNodes(run), node=available.find(n=>n.id===selected)||available[0];
  const start = () => { const next=run.active ? run : commit({type:'START',nodeId:node.id});if(!next)return; const n=firstActNode(next.active.nodeId);setDeparture({mission:{...n,enemy:{army:n.army,deck:n.roster},campaignAttempt:next.active.id,campaignPhase:next.active.phase},run:next}); };
  const enterDuel=()=>{try{onStartMission(departure.mission,departure.run);}catch(e){setError(e.message);}finally{setDeparture(null);}};
  const openArmy=()=>{setDraft(run.deck);setArmy(true);};
  const battleNode=run.active ? firstActNode(run.active.nodeId) : node;
  const enemy=battleNode?.roster || [];
  const nascente=runCard(run,NASCENTE);
  const mapRun={stageIndex:run.stage,outcome:run.outcome,definition:{events:[]},history:run.history.map(h=>({...h,missionId:h.nodeId}))};
  const mapAct={stages:FIRST_ACT_STAGES.map(ids=>({alternatives:ids.map(firstActNode)}))};
  const resources=battleNode?.kind!=='event' && battleNode ? firstActDuelConfig({...run,active:run.active || {nodeId:battleNode.id,phase:0,playerSquads:[run.deck.slice(0,5)],enemySquads:[battleNode.roster.slice(0,5)],opening:[true]}}).campaignDuelMod : null;
  return <CampaignScene className="cs-first-act"><CampaignBackdrop/><div className="cs-content">
    <header className="cs-hud"><div className="cs-brand"><CampaignSigil kind="sun"/><div><span className="cs-kicker">SATZE · ATTO I</span><strong>Oltre il Vallo</strong></div></div><nav className="cs-actions"><button onClick={openArmy}>Esercito e riserva</button><CampaignMotionControl/><button onClick={onBack}>Menu</button></nav></header>
    <div className="cs-act-heading"><div><p className="cs-kicker">IL CAMMINO DEL NASCENTE</p><h1>Oltre il Vallo</h1></div><p>{run.completed} tappe completate · {run.slots} posti · Lega {runLeague(run)}/30</p></div>
    {error&&<p className="cs-error" role="alert">{error}</p>}
    <div className="cs-stage-content" key={`${run.stage}:${run.pendingReward?'reward':run.pendingEvent?'event':run.outcome?'ending':'map'}`}>
    {run.outcome ? <section className="cs-ending"><CampaignArt src={heroArt(nascente)} alt="Il Nascente"/><div><h2>Il Vallo è alle tue spalle</h2><p>Hai completato il primo atto. Il Nascente e la tua riserva conservano il cammino compiuto.</p><button className="cs-primary" onClick={onBack}>Torna al menu</button></div></section> : run.pendingReward ? <section className="cs-encounter cs-first-reward-panel"><div className="cs-encounter-body">
      <h2>Gli agenti dello sconfitto</h2>
      <p>{run.pendingReward.offer.length===1?'Accogli l’agente ottenuto.':'Scegli un agente fra i due prigionieri.'} Qui sono mostrati tutti gli agenti che riceverai.</p>
      <div className="cs-first-rewards">{run.pendingReward.offer.map(id=>{
        const reward=previewFirstActReward(run,id);
        return <article className="cs-reward-option" key={id} aria-label={`Premio: ${firstActCard(id).name}`}>
          <div className="cs-reward-cards">{reward.copies.map(copy=><div className="cs-reward-agent" key={copy.uid} data-card-id={copy.cardId}>
            <span className="cs-kicker">AGENTE OTTENUTO</span>
            <CardReworkP4Scaled agent={firstActCard(copy.cardId)} width={180}/>
            <strong>{firstActCard(copy.cardId).name}</strong>
            <p>{copy.ownedBefore ? `Doppione · ${copy.ownedBefore} → ${copy.totalCopies} copie. La copia aggiuntiva resta in riserva.` : 'Nuova identità nella tua collezione.'}</p>
          </div>)}</div>
          {reward.slots>run.slots&&<p>Posti nell’esercito: {run.slots} → {reward.slots}</p>}
          <button className="cs-primary" onClick={()=>commit({type:'REWARD',cardId:id})}>Accogli {firstActCard(id).name}</button>
        </article>;
      })}</div>
    </div></section> : run.pendingEvent ? <FirstActEvent {...{run,choice,setChoice,family,setFamily,commit}}/> : <div className="cs-world-layout"><div className="cs-first-cartography">
      <div className="cs-map-scroll" ref={mapViewport} tabIndex={0} role="region" aria-label="Mappa scorrevole della campagna">
        <CampaignMap act={mapAct} run={mapRun} continuous availableIds={available.map(n=>n.id)} interactionLocked={!!run.active} selectedId={battleNode?.id} onSelect={setSelected} legend="Scorri per esplorare il cammino"/>
      </div>
    </div><aside key={battleNode?.id} className={`cs-encounter cs-kind-${battleNode?.kind}`} aria-label="Incontro selezionato">
      <div className="cs-encounter-art"><CampaignArt src={battleNode?.kind==='event'?heroArt(nascente):battleNode?.kind==='faglia'?`${import.meta.env.BASE_URL}card-images/agents/${enemy[0]}.webp`:campaignArt} alt={battleNode?.army || 'Il Nascente'}/><span className="cs-encounter-type"><CampaignSigil kind={battleNode?.kind}/>{encounterKinds[battleNode?.kind]}</span></div><div className="cs-encounter-body">
      <p className="cs-kicker">{battleNode?.kind==='faglia'?'FAGLIA · INCURSIONE':battleNode?.kind==='event'?'DOMANDA':battleNode?.kind==='boss'?'BOSS · DUE SQUADRE':battleNode?.kind==='elite'?'ÉLITE':'SCONTRO'}</p><h2>{battleNode?.title}</h2>
      {run.active ? <><p>Fase {run.active.phase+1} di {run.active.enemySquads.length}. Il tentativo è conservato.</p><button className="cs-primary" onClick={start}>{run.active.snapshot?'Riprendi lo scontro':run.active.phase?'Affronta la seconda squadra':'Entra nello scontro'}</button><button onClick={()=>commit({type:'ABANDON'})}>Abbandona il tentativo</button></> : node?.kind==='event' ? <button className="cs-primary" onClick={()=>commit({type:'ENTER_EVENT'})}>Ascolta la domanda</button> : <>
      <p>{node?.kind==='faglia'?'Una deformazione dello spazio apre il passaggio a un’armata guidata da un altro Giocatore. Affronti la sua incursione.':node?.army}</p><p>{node?.size} agenti per esercito · {Math.min(5,node?.size)} in mano</p><p>Tu: {resources?.playerLife} PV / {resources?.playerFocus} FC<br/>Nemico: {resources?.enemyLife} PV / {resources?.enemyFocus} FC</p>{resources?.plan&&<p>{resources.plan==='assalto'?'Assalto: primo DAN nemico +1.':'Tenuta: primo DAN subito dal nemico −1 (min 0).'}</p>}
      {node?.id==='I1'&&<p className="cs-tutorial-note">La Picca apre lo scontro. Impegna i tuoi 10 FC: a pari VA, Lega e POT prevale chi gioca per secondo.</p>}
      {node?.plan&&<p>Vincendo interrompi il piano {({riserve:'Corazze',corazze:'Riserve',tenuta:'Assalto',assalto:'Tenuta'})[node.plan]}. Nei successivi scontri Concordia resterà {({riserve:'Riserve: +2 FC nemici',corazze:'Corazze: +2 PV nemici',tenuta:'Tenuta: primo DAN nemico subito −1',assalto:'Assalto: primo DAN nemico inflitto +1'})[node.plan]}.</p>}<p>{node?.winRule==='varco'?'Conquista Il primo varco per vincere.':node?.winRule==='territory'?'A mano esaurita: più Campi, poi più PV.':'Duello Classico: conquista i Campi o annienta il nemico.'}</p><button onClick={()=>setInspect(true)}>Esamina esercito e Campi</button>
      {run.lastResult&&<p>{run.lastResult==='draw'?'Pareggio.':'Sconfitta.'} Puoi riorganizzare l’esercito e ritentare.</p>}
      <button className="cs-primary" onClick={start}>Affronta l’incontro</button>{node?.optional&&<button onClick={()=>{commit({type:'SKIP'});setSelected(null);}}>Prosegui verso la breccia</button>}{run.lastResult==='enemy'&&<button onClick={()=>{if(commit({type:'REWIND'}))setSelected(null);}}>Riavvolgi tre tappe</button>}</>}
      {battleNode?.kind!=='event'&&<button className="cs-test-win" disabled={!!departure} onClick={()=>commit({type:'TEST_WIN',nodeId:battleNode.id})}>Test: vinci incontro</button>}
    </div></aside></div>}
    </div>
    <footer className="cs-party">
      <button className="cs-hero-summary" onClick={()=>setSummary(true)} aria-label="Riepilogo del Nascente"><CampaignArt src={heroArt(nascente)} alt=""/><div><span className="cs-kicker">IL TUO NASCENTE</span><strong>{nascente.power} POT <i> / </i>{nascente.damage} DAN <i> · </i> L{nascente.league}</strong><small>{nascente.description}</small></div></button>
      <button className="cs-party-deck" onClick={openArmy} aria-label="Gestisci l’esercito del Nascente"><span className="cs-deck-fan" aria-hidden="true">{run.deck.filter(id=>id!==NASCENTE).slice(0,5).map((id,i)=><CampaignArt key={id} src={`${import.meta.env.BASE_URL}card-images/agents/${id}.webp`} alt="" style={{'--fan-index':i}}/>)}</span><span><strong>Esercito del Nascente</strong><small>{run.deck.length} carte · Lega {runLeague(run)}/30 · {run.copies.length} copie conservate</small></span><b>→</b></button>
    </footer>
  </div>
  {summary&&<NascenteSummary run={run} onClose={()=>setSummary(false)}/>}
  {departure&&<CampaignDeparture mission={departure.mission} onReady={enterDuel}/>}
  {inspect&&<CampaignDialog title="Ricognizione" onClose={()=>setInspect(false)}><div className="cs-first-options">{node.winRule==='varco' ? <p>{campaignField(node.fieldIds[0]).name} · Conquista: Vinci la partita.</p> : <p>I Campi vengono estratti a ogni nuovo tentativo. {node.fieldIds.includes(TOWER_ID)&&`${campaignField(TOWER_ID).name} compare in quarta o quinta posizione.`}<br/>Rivelazione dei Campi: {node.revealRounds.map((round,i)=>`${i+1}° al round ${round}`).join(' · ')}.</p>}</div>{node.required?.length>0&&<p>Agenti garantiti nella mano nemica: {node.required.map(id=>firstActCard(id).name).join(', ')}.</p>}{node.squads&&node.squads.map((s,i)=><p key={i}>Squadra {i+1}: {s.map(id=>firstActCard(id).name).join(', ')}.</p>)}<div className="cs-enemy-roster">{enemy.map(id=><CardReworkP4Scaled key={id} agent={firstActCard(id)} width={176}/>)}</div></CampaignDialog>}
  {army&&<FirstActArmyDialog {...{run,draft,setDraft,commit,error}} onClose={()=>setArmy(false)}/>}
  </CampaignScene>;
}

function NascenteSummary({run,onClose}) {
  const card=runCard(run,NASCENTE), stats=firstActStats(run);
  const power=POWER_PACKAGES.find(p=>p.id===run.nascente.packageId);
  const archetype=power ? NASCENTE_ARCHETYPES[power.id[0]] : 'Non ancora definito';
  return <CampaignDialog title="Il cammino del Nascente" kicker="RIEPILOGO DELLA RUN" onClose={onClose}>
    <div className="cs-nascente-summary">
      <div className="cs-summary-card"><CardReworkP4Scaled agent={card} width={260}/><p>{card.power} POT · {card.damage} DAN · L{card.league}</p></div>
      <div className="cs-summary-details">
        <dl className="cs-summary-stats">
          {[['Vittorie',stats.wins],['Sconfitte',stats.losses],['Pareggi',stats.draws],['Agenti trasformati',stats.transformed]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <p>Incontri conclusi e trasformazioni dell’intera run, inclusi i tentativi ritentati o riavvolti.</p>
        {stats.partial&&<p className="cs-summary-legacy">Statistiche parziali: i risultati non registrati dal vecchio salvataggio non sono recuperabili.</p>}
        <section><h3>Potere acquisito</h3><p>{power ? card.description : 'Nessun potere acquisito.'}</p>{power&&<blockquote>{power.answer}</blockquote>}</section>
        <section><h3>Archetipo attuale</h3><p>{archetype}</p><small>L’archetipo descrive il potere attuale e può cambiare con le tue risposte.</small></section>
      </div>
    </div>
  </CampaignDialog>;
}
