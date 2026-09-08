import React, { useEffect, useRef } from 'react';
import { CampaignSigil, campaignArt, encounterKinds } from './CampaignScenery.jsx';

/** Short, skippable presentation; the duel is still owned by useGameFlow. */
export function CampaignDeparture({ mission, onReady }) {
  const sent = useRef(false), button = useRef(null), ready = useRef(onReady);
  ready.current = onReady;
  const enter = () => {
    if (sent.current) return;
    sent.current = true;
    ready.current();
  };
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let off = false;
    try { off = localStorage.getItem('satze_campaign_motion_v1') === 'off'; } catch { /* Default motion. */ }
    const timer = setTimeout(enter, reduced || off ? 0 : 650);
    return () => { clearTimeout(timer); previous?.focus(); };
  }, []);
  return <div className="cs-departure" role="dialog" aria-modal="true" aria-label="Ingresso nell’incontro"
    onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); } }}>
    <img src={mission.kind === 'special' ? `${import.meta.env.BASE_URL}card-images/agents/${mission.enemy.deck[0]}.webp` : campaignArt} alt=""/>
    <div><CampaignSigil kind={mission.kind}/><p className="cs-kicker">{encounterKinds[mission.kind]} · {mission.enemy.army}</p><h2>{mission.title}</h2><p>Il Nascente avanza.</p><button ref={button} onClick={enter}>Entra subito</button></div>
  </div>;
}
