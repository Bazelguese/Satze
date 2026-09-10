import React, { useState } from 'react';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { CampaignBackdrop, CampaignMap, CampaignSigil, campaignArt, heroArt, encounterKinds as KIND } from './CampaignScenery.jsx';
import { CampaignScene, CampaignMotionControl } from './CampaignScene.jsx';
import { CampaignDeparture } from './CampaignDeparture.jsx';
import { CampaignDialog } from './CampaignDialog.jsx';
import { playUiClick, playUiConfirm } from '../../audio/gameSounds.js';
import {
  loadCampaignRun,
  saveCampaignRun,
} from '../../campaign/state/persistence.js';
import {
  currentAct,
  currentStage,
  controlledCampaignReducer,
  previewControlledReward,
  findRunMission,
} from '../../campaign/state/controlledCampaignState.js';
import {
  deckTotalLeague,
  poolCardById,
} from '../../campaign/state/campaignState.js';
import {
  assembleNascenteCard,
  NASCENTE_ID,
} from '../../campaign/logic/nascente.js';
import { campaignEnemyCard } from '../../campaign/logic/campaignDefinition.js';
import { getEminenceForArmy } from '../../data/eminences.js';
import { CampaignEventEditor } from './CampaignEventEditor.jsx';
import '../../styles/campaign/controlled-campaign.css';
export function ControlledCampaignHub({
  campaignSaveSlot = 0,
  onStartMission,
  onBack,
}) {
  const [run, setRun] = useState(() => loadCampaignRun(campaignSaveSlot));
  const [selected, setSelected] = useState(null),
    [tab, setTab] = useState('map'),
    [editor, setEditor] = useState(false),
    [error, setError] = useState('');
  const [inspectEnemy, setInspectEnemy] = useState(false);
  const [departure, setDeparture] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [draftDeck, setDraftDeck] = useState(run?.deck || []);
  if (editor) return <CampaignEventEditor onBack={() => setEditor(false)} />;
  if (!run)
    return (
      <section className="campaign-control">
        <p role="alert">Il salvataggio non è leggibile.</p>
        <button onClick={onBack}>Torna al menu</button>
      </section>
    );
  const act = currentAct(run),
    stage = currentStage(run),
    mission =
      stage.alternatives.find((m) => m.id === selected) ||
      stage.alternatives[0];
  const pending = run.definition.events.find(
      (e) => e.id === run.pendingEvents[0],
    ),
    nascente = assembleNascenteCard(run.nascente);
  const lookup = (id) => (id === NASCENTE_ID ? nascente : poolCardById(id));
  const dispatch = (action) => {
    try {
      const next = controlledCampaignReducer(run, action);
      if (!saveCampaignRun(next, campaignSaveSlot))
        throw new Error(
          'Impossibile salvare: libera spazio prima di proseguire.',
        );
      setRun(next);
      setError('');
      return next;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };
  const launch = () => {
    if (departure || receipt) return;
    const next = dispatch({ type: 'START_MISSION', nodeId: mission.id });
    if (next) {
      playUiConfirm();
      setDeparture({ mission, run: next });
    }
  };
  const enterDuel = () => {
    if (!departure) return;
    try {
      onStartMission({ ...departure.mission, campaignAttempt: departure.run.activeAttempt }, departure.run);
      setDeparture(null);
    } catch (e) {
      dispatch({ type: 'ABANDON_ATTEMPT' });
      setDeparture(null);
      setError(`Avvio non riuscito: ${e.message}`);
    }
  };
  const claimReward = (choice, index) => {
    if (receipt) return;
    const next = dispatch({ type: 'APPLY_EVENT_CHOICE', eventId: pending.id, choiceIndex: index });
    if (!next) return;
    playUiConfirm();
    if (choice.reward !== 'none') setReceipt({
      title: choice.reward === 'card' ? 'Un nuovo compagno' : 'Il Nascente prende forma',
      label: choice.label,
      card: choice.reward === 'card' ? poolCardById(choice.cardId) : assembleNascenteCard(next.nascente),
      detail: choice.reward === 'card' ? 'La carta ti attende in riserva. Puoi inserirla nell’armata.' : 'La nuova forma è stata salvata. Il cammino continua.',
    });
  };
  const eminence = getEminenceForArmy(mission.enemy.army);
  const league = deckTotalLeague(run.deck, run.nascente);
  const openDeck = () => { playUiClick(); setDraftDeck(run.deck); setTab('deck'); };
  const rewards = run.definition.events.filter(e => e.missionId === mission.id);
  return (
    <CampaignScene>
      <CampaignBackdrop actIndex={run.actIndex}/>
      <div className="cs-content">
        <header className="cs-hud">
          <div className="cs-brand"><CampaignSigil kind="sun"/><div><span className="cs-kicker">SATZE · CAMPAGNA</span><strong>Il cammino del Nascente</strong></div></div>
          <nav className="cs-actions" aria-label="Campagna">
            <button aria-pressed={tab === 'map'} onClick={() => { playUiClick(); setTab('map'); }}>Percorso</button>
            <button aria-pressed={tab === 'deck'} onClick={openDeck}>Armata e Nascente</button>
            <button onClick={() => setEditor(true)}>Editor eventi</button>
            <CampaignMotionControl/><button onClick={onBack}>Menu</button>
          </nav>
        </header>
        <div className="cs-act-heading">
          <div><p className="cs-kicker">ATTO {['I', 'II', 'III'][run.actIndex]} · INCONTRO {run.stageIndex + 1} / 6</p><h1>{act.title}</h1></div>
          <ol className="cs-act-seals" aria-label="I tre atti">{run.definition.acts.map((a, i) => <li key={a.id} className={i === run.actIndex ? 'active' : ''} aria-current={i === run.actIndex ? 'step' : undefined}><span>{i < run.actIndex ? '✓' : ['I', 'II', 'III'][i]}</span><div><small>Atto {i + 1}</small><strong>{a.title}</strong></div></li>)}</ol>
        </div>
        {error && <p className="cs-error" role="alert">{error}</p>}
        {run.currentNode && !departure && <div className="cs-notice"><div><strong>Incontro interrotto · {findRunMission(run, run.currentNode)?.title}</strong><p>Il cammino è conservato. Puoi ripartire da questo incontro.</p></div><button onClick={() => dispatch({type: 'ABANDON_ATTEMPT'})}>Riprendi dalla mappa</button></div>}
        {pending ? <div key={pending.id} className="cs-event" role="region" aria-label="Evento da risolvere">
          <div className="cs-event-portrait"><img src={heroArt(nascente)} alt="Il Nascente"/><CampaignSigil kind="special"/></div>
          <div className="cs-event-body"><p className="cs-kicker">LUNGO IL CAMMINO · {run.pendingEvents.length} EVENTI DA RISOLVERE</p><h2>{pending.title}</h2><p className="cs-story-copy">{pending.body}</p>
            <div className="cs-reward-choices">{pending.choices.map((c, i) => {
              const preview = previewControlledReward(run, c), afterLeague = deckTotalLeague(preview.deck, preview.nascente);
              const card = c.reward === 'card' ? poolCardById(c.cardId) : c.reward === 'none' ? null : assembleNascenteCard(preview.nascente);
              return <button className="cs-reward" key={i} style={{'--cs-order': i}} onClick={() => claimReward(c, i)}>
                {card ? <div className="cs-reward-card"><CardReworkP4Scaled key={`${pending.id}-${i}`} agent={card} width={126}/></div> : <CampaignSigil kind="special"/>}
                <strong>{c.label}</strong><small>{c.reward === 'card' ? `${card.name} → riserva` : c.reward === 'none' ? 'Prosegui senza modifiche' : `Lega armata: ${afterLeague}/30${afterLeague > 30 ? ' · riorganizza prima del duello' : ''}`}</small>
              </button>;
            })}</div>
          </div>
        </div> : run.outcome ? <div className="cs-ending"><img src={heroArt(nascente)} alt="Il Nascente al termine del cammino"/><div><CampaignSigil kind="sun"/><p className="cs-kicker">TRE ATTI · UN NUOVO ORIZZONTE</p><h2>Le campane tacciono</h2><p>Il Nascente ha attraversato i tre atti e superato l’ultima difesa della Concordia.</p><button className="cs-primary" onClick={onBack}>Torna al menu</button></div></div> : null}
        {tab === 'map' && !pending && !run.outcome && <div className="cs-world-layout">
          <CampaignMap act={act} run={run} selectedId={mission.id} onSelect={id => { playUiClick(); setSelected(id); }}/>
          <aside className={`cs-encounter cs-kind-${mission.kind}`} key={mission.id} aria-label="Incontro selezionato">
            <div className="cs-encounter-art"><img src={mission.kind === 'special' ? `${import.meta.env.BASE_URL}card-images/agents/${mission.enemy.deck[0]}.webp` : campaignArt} alt={mission.enemy.army}/><span className="cs-encounter-type"><CampaignSigil kind={mission.kind}/>{KIND[mission.kind]}</span></div>
            <div className="cs-encounter-body"><p className="cs-kicker">{mission.enemy.army}</p><h2>{mission.title}</h2><p>{mission.briefing}</p>
              <div className="cs-duel-stats"><span><b>25</b> PV</span><span><b>18</b> FC</span><span><b>5</b> Campi</span></div>
              <button className="cs-inspect" onClick={() => { playUiClick(); setInspectEnemy(true); }}><CampaignSigil kind="sun"/><span><small>EMINENZA AVVERSARIA</small><strong>{eminence?.name}</strong><small>Esamina l’armata →</small></span></button>
              {rewards.length > 0 && <p className="cs-reward-note">✦ Dopo la vittoria: {rewards.map(e => e.title).join(' · ')}</p>}
              <button className="cs-primary" disabled={!!run.currentNode || !!receipt || league > 30} onClick={launch}>Affronta l’incontro</button>
              <small className="cs-footnote">{league > 30 ? 'Lega oltre 30: riorganizza l’armata prima dello scontro.' : 'Il Nascente sarà nella tua mano. Puoi ritentare in caso di sconfitta.'}</small>
            </div>
          </aside>
        </div>}
        {tab === 'deck' && <div className="cs-army">
          <div className="cs-army-heading"><div><p className="cs-kicker">FIGLI DELL’ORIZZONTE</p><h2>La tua armata</h2><p>Scegli dieci carte: il Nascente e almeno quattro altri Figli dell’Orizzonte. Le ricompense ti attendono in riserva.</p></div><div><strong>{draftDeck.length}/10 carte · Lega {deckTotalLeague(draftDeck, run.nascente)}/30</strong><button className="cs-primary" disabled={!!run.currentNode} onClick={() => { if (dispatch({type: 'SET_DECK', deck: draftDeck})) {playUiConfirm(); setTab('map');} }}>Salva armata</button></div></div>
          <div className="cs-card-roster">{[...new Set([...run.deck, ...run.warehouse])].map((id, i) => <label key={id} style={{'--cs-order': i}} className={draftDeck.includes(id) ? 'selected' : ''}>
            <input aria-label={lookup(id).name} type="checkbox" checked={draftDeck.includes(id)} disabled={id === NASCENTE_ID || !!run.currentNode} onChange={e => { playUiClick(); setDraftDeck(e.target.checked ? [...draftDeck, id] : draftDeck.filter(n => n !== id)); }}/>
            <div className="cs-roster-card"><CardReworkP4Scaled agent={lookup(id)} width={176}/></div><span>{id === NASCENTE_ID ? 'Il tuo Nascente' : draftDeck.includes(id) ? 'Schierato nell’armata' : 'In riserva'}</span>
          </label>)}</div>
        </div>}
        {tab === 'map' && <footer className="cs-party">
          <button className="cs-hero-summary" onClick={openDeck}><img src={heroArt(nascente)} alt=""/><div><span className="cs-kicker">IL TUO NASCENTE</span><strong>{nascente.power} POT <i> / </i>{nascente.damage} DAN <i> · </i> L{nascente.league}</strong><small>{nascente.description}</small></div></button>
          <button className="cs-party-deck" onClick={openDeck} aria-label="Gestisci le carte dell’armata"><span className="cs-deck-fan" aria-hidden="true">{run.deck.filter(id => id !== NASCENTE_ID).slice(0, 5).map((id, i) => <img key={id} src={`${import.meta.env.BASE_URL}card-images/agents/${id}.webp`} alt="" style={{'--fan-index': i}}/>)}</span><span><strong>Armata dell’Orizzonte</strong><small>{run.deck.length} carte · Lega {league}/30 · {run.warehouse.length} in riserva</small></span><b>→</b></button>
        </footer>}
      </div>
      {receipt && <CampaignDialog title={receipt.title} onClose={() => setReceipt(null)}>
        <div className="cs-acquired"><div className="cs-acquired-card"><CardReworkP4Scaled agent={receipt.card} width={230}/></div><div><p className="cs-kicker">SCELTA CONFERMATA</p><h3>{receipt.label}</h3><p>{receipt.detail}</p><button className="cs-primary" onClick={() => setReceipt(null)}>Continua il cammino</button></div></div>
      </CampaignDialog>}
      {departure && <CampaignDeparture mission={departure.mission} onReady={enterDuel}/>}
      {inspectEnemy && <CampaignDialog title={mission.enemy.army} onClose={() => setInspectEnemy(false)}>
        <div className="cs-enemy-brief"><div><p className="cs-kicker">EMINENZA</p><h3>{eminence?.name}</h3><p>{eminence?.static.text}</p></div><p>{mission.signatureCardId ? `Carta firma garantita in mano: ${campaignEnemyCard(mission.signatureCardId).name}.` : 'La mano nemica contiene cinque carte di questa armata.'} PV, FC e Presenza ripartono dai valori iniziali a ogni incontro.</p></div>
        <div className="cs-enemy-roster">{mission.enemy.deck.map(id => <div key={id}><CardReworkP4Scaled agent={campaignEnemyCard(id)} width={176}/></div>)}</div>
      </CampaignDialog>}
    </CampaignScene>
  );
}
