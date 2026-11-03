import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Motion, applyPan } from './CampaignScene.jsx';
import { getNascenteStageImageUrl, nascenteStageFromLeague } from '../../data/images.js';
import '../../styles/campaign/campaign-scene.css';
import { campaignMapLayout } from './campaignMapLayout.js';

const BASE = import.meta.env.BASE_URL;
export const campaignArt = `${BASE}campaign/concordia-vallo.webp`;
export const actScenery = [54, 51, 53].map(id => `${BASE}campi_bg/campo-${id}.webp`);
export const heroArt = card => getNascenteStageImageUrl(nascenteStageFromLeague(card.league));
export const encounterKinds = { battle: 'Battaglia', elite: 'Élite', special: 'Incontro speciale', boss: 'Boss', event: 'Domanda', faglia: 'Faglia' };

export function CampaignArt({ src, onLoad, ...props }) {
  const image=useRef(null), [ready,setReady]=useState(null);
  useEffect(()=>{if(image.current?.complete && image.current.naturalWidth) setReady(src);},[src]);
  return <img {...props} ref={image} src={src} data-art-ready={ready===src} onLoad={e=>{setReady(src);onLoad?.(e);}}/>;
}

/** Small UI heraldry, deliberately separate from card artwork. */
export function CampaignSigil({ kind = 'battle', ...props }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}>
    {kind === 'boss' ? <><path d="M9 15l7 7 8-13 8 13 7-7-4 22H13Z"/><path d="M14 31h20M24 18v10"/><circle cx="24" cy="39" r="2"/></>
      : ['special', 'event', 'faglia'].includes(kind) ? <><path d="M24 5l5 14 14 5-14 5-5 14-5-14-14-5 14-5Z"/><circle cx="24" cy="24" r="5"/></>
      : kind === 'elite' ? <><path d="M24 5L9 12v14c0 8 15 17 15 17s15-9 15-17V12Z"/><path d="M17 16l14 17M31 16L17 33M14 30l6 6m8 0 6-6"/></>
      : kind === 'sun' ? <><circle cx="24" cy="24" r="10"/><path d="M24 2v8m0 28v8M2 24h8m28 0h8M8 8l6 6m20 20 6 6M8 40l6-6m20-20 6-6"/></>
      : <><path d="M10 7l5 2 23 28-3 3L10 12ZM38 7l-5 2L10 37l3 3 25-28Z"/><path d="M7 29l12 12m22-12L29 41"/></>}
  </svg>;
}

/**
 * Nebbia dello sfondo. In CSS è un gradiente con filter: blur(16px) animato in transform e
 * opacity: il compositor rifà la sfocatura su tutta l'area a ogni frame. Qui la stessa nebbia
 * (stesso gradiente e stesso blur letti dagli stili calcolati) viene disegnata una volta sola,
 * già sfocata, in un'immagine SVG; l'elemento conserva la sua animazione. Differenza misurata:
 * al massimo 1/255 per canale. Finché l'immagine non è pronta resta la nebbia CSS.
 */
function BakedMist() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let size = '';
    let source = null;
    const bake = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      if (!source) {
        el.classList.remove('is-baked');
        const cs = getComputedStyle(el);
        const blur = /blur\(([\d.]+)px\)/.exec(cs.filter);
        if (!blur || cs.backgroundImage === 'none') return;
        source = { image: cs.backgroundImage, sigma: parseFloat(blur[1]) };
      }
      if (`${w}x${h}` === size) return;
      size = `${w}x${h}`;
      const pad = Math.ceil(source.sigma * 3); // oltre 3σ la sfocatura è sotto 1/255
      const W = w + pad * 2, H = h + pad * 2;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">`
        + `<div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute;left:${pad}px;top:${pad}px;width:${w}px;height:${h}px;background-image:${source.image.replace(/"/g, "'")};filter:blur(${source.sigma}px)"></div>`
        + '</foreignObject></svg>';
      el.style.setProperty('--cs-mist-pad', `${pad}px`);
      el.style.setProperty('--cs-mist-image', `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`);
      el.classList.add('is-baked');
    };
    bake();
    const ro = new ResizeObserver(bake);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="cs-mist"/>;
}

export function CampaignBackdrop({ actIndex = 0 }) {
  const ref = useRef(null);
  const motion = useContext(Motion);
  // parallasse corrente della scena, prima del primo paint (poi la aggiorna CampaignScene)
  useLayoutEffect(() => { if (ref.current && motion?.pan) applyPan(ref.current, motion.pan.current); }, [motion]);
  return <div ref={ref} className="cs-backdrop" data-act={actIndex + 1} aria-hidden="true">
    <CampaignArt key={actIndex} src={actScenery[actIndex]} alt="" />
    <BakedMist/><div className="cs-grain"/>
    <div className="cs-embers">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{
      left: `${(i * 37 + 11) % 100}%`, top: `${(i * 19 + 7) % 100}%`,
      '--cs-drift': `${(i % 3 - 1) * 35}px`, '--cs-duration': `${8 + i % 7}s`,
      animationDelay: `${-i * 1.3}s`,
    }}/>)}</div>
  </div>;
}

const positions = [[12, 76], [29, 55], [45, 38], [62, 55], [76, 35], [87, 15]];
export function CampaignMap({ act, run, selectedId, onSelect, stageOffset = 0, availableIds, interactionLocked = false, continuous = false, legend = "Una via al bivio · ricongiungimento prima dell’élite" }) {
  if (continuous) return <ContinuousCampaignMap {...{act,run,selectedId,onSelect,availableIds,interactionLocked,legend}}/>;
  const points = act.stages.flatMap((stage, index) => stage.alternatives.map((mission, branch) => ({
    mission, index: index + stageOffset, x: continuous ? (80 + index * 160) / Math.max(960, act.stages.length * 160) * 100 : positions[index][0], y: stage.alternatives.length > 1 ? (branch ? 76 : continuous ? 35 : Math.min(45, positions[index % 6][1])) : positions[index % 6][1],
  })));
  const links = points.flatMap(point => points.filter(next => next.index === point.index + 1).map(next => ({ from: point, to: next })));
  const selected = points.find(point => point.mission.id === selectedId);
  return <div className={`cs-map${continuous ? ' cs-map-continuous' : ''}`} style={continuous ? {width:Math.max(960, act.stages.length * 160)} : undefined} role="region" aria-label="Percorso dell’atto">
    <span className="cs-map-caption">LE TERRE DELLA CONCORDIA</span>
    <svg className="cs-map-trails" viewBox={`0 0 ${continuous ? Math.max(960, act.stages.length * 160) : 1000} 600`} preserveAspectRatio="none" aria-hidden="true">
      {links.map(({from, to}) => {
        const traveled = run.history.some(h => h.missionId === from.mission.id && h.result === 'player') &&
          (run.history.some(h => h.missionId === to.mission.id && h.result === 'player') ||
            (to.index === run.stageIndex && !run.outcome));
        const approaching = to.mission.id === selectedId && to.index === run.stageIndex &&
          run.history.some(h => h.missionId === from.mission.id && h.result === 'player');
        return <path key={`${from.mission.id}-${to.mission.id}`} className={`${traveled ? 'traveled' : ''} ${approaching ? 'approaching' : ''}`}
          d={(() => { const scale = continuous ? Math.max(960, act.stages.length * 160)/100 : 10; const bend = continuous ? 60 : 80; return `M${from.x * scale} ${from.y * 6} C${from.x * scale + bend} ${from.y * 6},${to.x * scale - bend} ${to.y * 6},${to.x * scale} ${to.y * 6}`; })()}/>;
      })}
    </svg>
    {points.map(({ mission, index, x, y }) => {
      const won = run.history.some(h => h.missionId === mission.id && h.result === 'player');
      const available = index === run.stageIndex && !run.outcome && (!availableIds || availableIds.includes(mission.id));
      const hasEvent = run.definition.events.some(event => event.missionId === mission.id);
      return <button key={mission.id} style={{ left: `${x}%`, top: `${y}%` }}
        className={`cs-map-node cs-kind-${mission.kind} ${won ? 'is-won' : ''} ${available ? 'is-current' : 'is-locked'}`}
        disabled={!available || interactionLocked} aria-pressed={available && selectedId === mission.id}
        aria-label={`${mission.title} · ${encounterKinds[mission.kind]} · ${won ? 'superato' : available ? 'disponibile' : 'non disponibile'}`}
        onClick={() => onSelect(mission.id)}>
        <span className="cs-node-medallion"><CampaignSigil kind={mission.kind}/><span className="cs-node-number">{won ? '✓' : index + 1}</span></span>
        <span className="cs-node-name">{mission.kind === 'special' ? mission.enemy.army : mission.title}</span>
        <small>{won ? 'Superato' : encounterKinds[mission.kind]}</small>
        {hasEvent && <span className="cs-node-event" aria-label="Evento dopo la vittoria" title="Evento dopo la vittoria">✦</span>}
      </button>;
    })}
    {selected && !run.outcome && <span className="cs-traveler" aria-hidden="true" style={{ left: `${selected.x}%`, top: `${selected.y}%` }}>✧</span>}
    <div className="cs-map-legend"><span>✦ Il tuo cammino</span><span>{legend}</span></div>
  </div>;
}

function ContinuousCampaignMap({ act, run, selectedId, onSelect, availableIds, interactionLocked, legend }) {
  const { points, links, width, height } = campaignMapLayout(act.stages);
  const won = id => run.history.some(h => h.missionId === id && h.result === 'player');
  const selected = points.find(p => p.id === selectedId);
  return <div className="cs-map cs-map-continuous" style={{width,height}} role="region" aria-label="Percorso dell’atto">
    <span className="cs-map-caption">LE TERRE DELLA CONCORDIA</span>
    <svg className="cs-map-trails" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {links.map(({from,to,routeId,optional,d}) => {
        const index = from.index;
        const skipped = routeId?.startsWith('skip-') && run.stageIndex > index && !won(routeId.slice(5));
        const traveled = routeId ? won(routeId) || skipped : run.stageIndex > index || !!run.outcome;
        const approaching = routeId === selectedId && index === run.stageIndex;
        return <path key={`${from.id}-${to.id}`} data-from={from.id} data-to={to.id} data-route={routeId}
          className={`${traveled ? 'traveled' : ''} ${approaching ? 'approaching' : ''} ${optional ? 'optional' : ''}`} d={d}/>;
      })}
    </svg>
    {points.map(({mission,index,x,y}) => {
      const available = index === run.stageIndex && !run.outcome && (!availableIds || availableIds.includes(mission.id));
      const completed = won(mission.id), passed = index < run.stageIndex && !completed;
      return <button key={mission.id} style={{left:x,top:y}} data-node-id={mission.id}
        className={`cs-map-node cs-kind-${mission.kind} ${completed ? 'is-won' : ''} ${passed ? 'is-bypassed' : ''} ${available ? 'is-current' : 'is-locked'}`}
        disabled={!available || interactionLocked} aria-pressed={available && selectedId === mission.id}
        aria-label={`${mission.title} · ${encounterKinds[mission.kind]} · ${completed ? 'superato' : available ? 'disponibile' : 'non disponibile'}`}
        onClick={()=>onSelect(mission.id)}>
        <span className="cs-node-medallion"><CampaignSigil kind={mission.kind}/><span className="cs-node-number">{completed ? '✓' : index+1}</span></span>
        <span className="cs-node-name">{mission.title}</span>
        <small>{completed ? 'Superato' : passed ? 'Non percorso' : mission.optional ? 'Faglia opzionale' : encounterKinds[mission.kind]}</small>
      </button>;
    })}
    {selected && !run.outcome && <span className="cs-traveler" aria-hidden="true" style={{left:selected.x,top:selected.y}}>✧</span>}
    <div className="cs-map-legend"><span>✦ Il tuo cammino</span><span>{legend} · Le deviazioni si ricongiungono alla via principale</span></div>
  </div>;
}
