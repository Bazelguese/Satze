import React from 'react';
import { getNascenteStageImageUrl, nascenteStageFromLeague } from '../../data/images.js';
import '../../styles/campaign/campaign-scene.css';

const BASE = import.meta.env.BASE_URL;
export const campaignArt = `${BASE}campaign/concordia-vallo.webp`;
export const actScenery = [54, 51, 53].map(id => `${BASE}campi_bg/campo-${id}.webp`);
export const heroArt = card => getNascenteStageImageUrl(nascenteStageFromLeague(card.league));
export const encounterKinds = { battle: 'Battaglia', elite: 'Élite', special: 'Incontro speciale', boss: 'Boss' };

/** Small UI heraldry, deliberately separate from card artwork. */
export function CampaignSigil({ kind = 'battle', ...props }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}>
    {kind === 'boss' ? <><path d="M9 15l7 7 8-13 8 13 7-7-4 22H13Z"/><path d="M14 31h20M24 18v10"/><circle cx="24" cy="39" r="2"/></>
      : kind === 'special' ? <><path d="M24 5l5 14 14 5-14 5-5 14-5-14-14-5 14-5Z"/><circle cx="24" cy="24" r="5"/></>
      : kind === 'elite' ? <><path d="M24 5L9 12v14c0 8 15 17 15 17s15-9 15-17V12Z"/><path d="M17 16l14 17M31 16L17 33M14 30l6 6m8 0 6-6"/></>
      : kind === 'sun' ? <><circle cx="24" cy="24" r="10"/><path d="M24 2v8m0 28v8M2 24h8m28 0h8M8 8l6 6m20 20 6 6M8 40l6-6m20-20 6-6"/></>
      : <><path d="M10 7l5 2 23 28-3 3L10 12ZM38 7l-5 2L10 37l3 3 25-28Z"/><path d="M7 29l12 12m22-12L29 41"/></>}
  </svg>;
}

export function CampaignBackdrop({ actIndex = 0 }) {
  return <div className="cs-backdrop" aria-hidden="true">
    <img key={actIndex} src={actScenery[actIndex]} alt="" />
    <div className="cs-mist"/><div className="cs-grain"/>
  </div>;
}

const positions = [[12, 76], [29, 55], [45, 38], [62, 55], [76, 35], [87, 15]];
export function CampaignMap({ act, run, selectedId, onSelect }) {
  const points = act.stages.flatMap((stage, index) => stage.alternatives.map((mission, branch) => ({
    mission, index, x: positions[index][0], y: branch ? 76 : positions[index][1],
  })));
  const links = points.flatMap(point => points.filter(next => next.index === point.index + 1).map(next => ({ from: point, to: next })));
  return <div className="cs-map" role="region" aria-label="Percorso dell’atto">
    <span className="cs-map-caption">LE TERRE DELLA CONCORDIA</span>
    <svg className="cs-map-trails" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      {links.map(({from, to}) => {
        const traveled = run.history.some(h => h.missionId === from.mission.id && h.result === 'player') &&
          (run.history.some(h => h.missionId === to.mission.id && h.result === 'player') ||
            (to.index === run.stageIndex && !run.outcome));
        return <path key={`${from.mission.id}-${to.mission.id}`} className={traveled ? 'traveled' : ''}
          d={`M${from.x * 10} ${from.y * 6} C${(from.x + 8) * 10} ${from.y * 6},${(to.x - 8) * 10} ${to.y * 6},${to.x * 10} ${to.y * 6}`}/>;
      })}
    </svg>
    {points.map(({ mission, index, x, y }) => {
      const won = run.history.some(h => h.missionId === mission.id && h.result === 'player');
      const available = index === run.stageIndex && !run.outcome;
      return <button key={mission.id} style={{ left: `${x}%`, top: `${y}%` }}
        className={`cs-map-node cs-kind-${mission.kind} ${won ? 'is-won' : ''} ${available ? 'is-current' : 'is-locked'}`}
        disabled={!available} aria-pressed={available && selectedId === mission.id}
        aria-label={`${mission.title} · ${encounterKinds[mission.kind]} · ${won ? 'superato' : available ? 'disponibile' : 'non disponibile'}`}
        onClick={() => onSelect(mission.id)}>
        <span className="cs-node-medallion"><CampaignSigil kind={mission.kind}/><span className="cs-node-number">{won ? '✓' : index + 1}</span></span>
        <span className="cs-node-name">{mission.kind === 'special' ? mission.enemy.army : mission.title}</span>
        <small>{won ? 'Superato' : encounterKinds[mission.kind]}</small>
      </button>;
    })}
    <div className="cs-map-legend"><span>✦ Il tuo cammino</span><span>Una via al bivio · ricongiungimento prima dell’élite</span></div>
  </div>;
}
