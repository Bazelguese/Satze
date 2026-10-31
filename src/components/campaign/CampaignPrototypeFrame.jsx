// ============================================================
// CampaignPrototypeFrame.jsx — la campagna verso Cael nel gioco
// ============================================================
// La schermata di campagna è il prototipo in prototipi/campagna-cael, aperto
// in un frame sullo stesso slot di salvataggio (?slot=N). Il prototipo
// gestisce mappa, tappe, eventi, premi ed esercito; quando si entra in uno
// scontro chiede al gioco il duello vero, e a duello finito il gioco lo
// riapre: dal salvataggio riparte dal premio o dalla squadra successiva.
// Messaggi dal frame: { source: 'satze-campaign', type: 'ready' | 'duel' | 'menu' }.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { loadCampaignRun } from '../../campaign/state/persistence.js';
import { firstActRunNode } from '../../campaign/state/firstActState.js';

const FRAME_SRC = `${import.meta.env.BASE_URL}prototipi/campagna-cael/index.html`;

/** La missione per il duello, come la costruiva l'hub della campagna (FirstActHub). */
function missionFromRun(run) {
  const active = run?.active;
  if (!active) return null;
  const node = firstActRunNode(run, active.nodeId);
  if (!node) return null;
  return {
    ...node,
    enemy: { army: node.army, deck: node.roster },
    campaignAttempt: active.id,
    campaignPhase: active.phase,
  };
}

export function CampaignPrototypeFrame({ campaignSaveSlot = 0, onStartMission, onBack }) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const handlers = useRef({});
  handlers.current = { onStartMission, onBack };

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const msg = e.data;
      if (!msg || msg.source !== 'satze-campaign') return;
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'menu') handlers.current.onBack?.();
      else if (msg.type === 'duel') {
        try {
          const run = loadCampaignRun(campaignSaveSlot);
          const mission = missionFromRun(run);
          if (!mission) throw new Error('Nessuno scontro in corso nel salvataggio.');
          handlers.current.onStartMission?.(mission, run);
        } catch (err) {
          setError(err.message || 'Impossibile avviare lo scontro.');
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [campaignSaveSlot]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <iframe
        ref={frameRef}
        title="Campagna · il cammino verso Cael"
        src={`${FRAME_SRC}?slot=${campaignSaveSlot}`}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0,
          // nero finché la pagina non è pronta: niente pagina bianca o a metà
          opacity: ready ? 1 : 0, transition: 'opacity .5s ease',
        }}
        onLoad={() => frameRef.current?.contentWindow?.focus()}
      />
      {error ? (
        <div role="alert" style={{ position: 'absolute', left: 40, bottom: 40, padding: '12px 20px', background: '#ef4444', color: '#050507', fontWeight: 700 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default CampaignPrototypeFrame;
