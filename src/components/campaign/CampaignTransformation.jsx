import React, { useEffect, useRef, useState } from 'react';
import { CardReworkP4Scaled } from '../cards/CardReworkP4.jsx';
import { CampaignSigil } from './CampaignScenery.jsx';
import { useCampaignMotion } from './CampaignScene.jsx';

/** Presentation only: the caller already saved the single random outcome. */
export function CampaignTransformation({ source, result, onComplete }) {
  const { enabled } = useCampaignMotion();
  const [revealed,setRevealed] = useState(!enabled);
  const skip = useRef(null);
  useEffect(()=>{ skip.current?.focus(); },[]);
  useEffect(()=>{
    if (!enabled) { setRevealed(true); return; }
    const timer = setTimeout(()=>setRevealed(true),2400);
    return ()=>clearTimeout(timer);
  },[enabled]);
  return <div className={`cs-transformation ${revealed ? 'is-revealed' : 'is-changing'}`} role="group" aria-label="Trasformazione in corso">
    <div className="cs-transformation-halo" aria-hidden="true"><CampaignSigil kind="sun"/></div>
    <div className="cs-transformation-rings" aria-hidden="true"><i/><i/><i/></div>
    <p className="cs-kicker">{revealed?'UN NUOVO FIGLIO DELL’ORIZZONTE':'LA VECCHIA FORMA SI DISSOLVE'}</p>
    <div className="cs-transformation-stage">
      {!revealed && <div className="cs-transformation-source" aria-hidden="true"><CardReworkP4Scaled agent={source} width={260}/></div>}
      <div className="cs-transformation-result" aria-hidden={!revealed}><CardReworkP4Scaled agent={result} width={260}/></div>
      <div className="cs-transformation-flare" aria-hidden="true"/>
    </div>
    <div className="cs-transformation-caption" aria-live="polite"><h3>{revealed?result.name:'Il passaggio'}</h3><p>{revealed?`${result.power} POT · ${result.damage} DAN · Lega ${result.league}`:'La tua armata accoglie una nuova identità.'}</p></div>
    <button ref={skip} className="cs-primary" onClick={revealed?onComplete:()=>setRevealed(true)}>{revealed?'Continua':'Salta animazione'}</button>
  </div>;
}
