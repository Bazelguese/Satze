/**
 * Rift — Faglia della Campagna Atto I (variante mappa e pannello).
 * Conversione React di `campaign-rift/Rift.dc.html` (pacchetto 2).
 */

import React from 'react';

const TYPE = {
  incursion: { label: 'Incursione', clip: 'polygon(50% 0,62% 20%,85% 14%,75% 38%,100% 50%,75% 62%,85% 86%,62% 80%,50% 100%,38% 80%,15% 86%,25% 62%,0 50%,25% 38%,15% 14%,38% 20%)', size: 56 },
  distortion: { label: 'Distorsione', clip: 'polygon(50% 2%,70% 12%,72% 30%,92% 40%,80% 58%,95% 78%,68% 74%,54% 96%,40% 76%,14% 84%,24% 60%,4% 46%,26% 34%,20% 12%,42% 18%)', size: 58 },
  erosion: { label: 'Erosione', clip: 'polygon(48% 4%,60% 16%,84% 10%,74% 34%,96% 46%,72% 58%,88% 82%,60% 74%,50% 96%,36% 74%,12% 82%,28% 58%,6% 46%,26% 34%,16% 10%,38% 16%)', size: 56 },
  resonance: { label: 'Risonanza', clip: 'polygon(50% 0,63% 22%,88% 15%,78% 40%,100% 50%,78% 60%,88% 85%,63% 78%,50% 100%,37% 78%,12% 85%,22% 60%,0 50%,22% 40%,12% 15%,37% 22%)', size: 58 },
  major: { label: 'Faglia Maggiore', clip: 'polygon(50% 0,62% 20%,85% 14%,75% 38%,100% 50%,75% 62%,85% 86%,62% 80%,50% 100%,38% 80%,15% 86%,25% 62%,0 50%,25% 38%,15% 14%,38% 20%)', size: 74 },
};

const STATES = {
  unstable: { label: 'Instabile', col: '#a78bfa', pulse: false, tremor: false },
  active: { label: 'Attiva', col: '#c05fb8', pulse: true, tremor: false },
  grave: { label: 'Grave', col: '#e256c9', pulse: true, tremor: false },
  critical: { label: 'Critica', col: '#c2473f', pulse: true, tremor: true },
  collapsed: { label: 'Collassata', col: '#6d6b64', pulse: false, tremor: false, spent: true },
  closed: { label: 'Chiusa', col: '#4a4a50', pulse: false, tremor: false, spent: true },
};

const ARMY = {
  orizzonte: ['#a78bfa', "Figli dell'Orizzonte"],
  kethran: ['#fbbf24', 'Kethran'],
  corte: ['#f43f5e', 'Corte Rossa'],
  calibri: ['#94a3b8', 'Calibri Pesanti'],
  orathai: ['#2dd4bf', 'Orathai'],
  mounthborn: ['#a3e635', 'Mounthborn'],
  ratti: ['#10b981', 'Ratti'],
  khemet: ['#22d3ee', 'Khemet'],
};

function keyFn(cb) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cb) cb();
    }
  };
}

export default function Rift(props) {
  const variant = props.variant || 'map';
  const type = props.type || 'incursion';
  const state = props.state || 'active';
  const t = TYPE[type] || TYPE.incursion;
  const s = STATES[state] || STATES.active;
  const armyKey = props.army || 'kethran';
  const [armyCol, armyName] = ARMY[armyKey] || ARMY.kethran;
  const days = props.days ?? 0;
  const daysMax = props.daysMax ?? 5;
  const spent = !!s.spent;
  const opacity = spent ? 0.5 : 1;
  const size = t.size;
  const segArr = Array.from({ length: daysMax }, (_, i) => i < days);
  const timerCol = state === 'critical' ? '#c2473f' : state === 'grave' ? '#e256c9' : s.col;
  const halo = spent ? 'rgba(0,0,0,0)' : `${s.col}44`;
  const glow = spent ? 'rgba(0,0,0,.3)' : `${s.col}88`;
  const fill = spent ? '#141416' : `${armyCol}22`;
  const pulseAnim = !spent && s.pulse ? 'rt-pulse 1.7s ease-in-out infinite' : 'none';
  const coreAnim = !spent ? 'rt-corefx 2.4s ease-in-out infinite' : 'none';
  const tremorAnim = s.tremor ? 'rt-tremor .2s linear infinite' : 'none';

  const title = props.title || 'La Torre di Babele';
  const tip = `${title} — ${t.label} · ${s.label}${days > 0 && !spent ? ` · Collasso fra ${days}g` : ''}\nArmata: ${armyName}`;

  if (variant === 'map') {
    return (
      <div
        tabIndex={0} role="button" className="ca1-anim ca1-focus-violet"
        onClick={props.onSelect} onKeyDown={keyFn(props.onSelect)} title={tip}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', cursor: 'pointer', animation: tremorAnim }}
      >
        <div style={{ position: 'relative', width: size, height: size }}>
          <div style={{ position: 'absolute', inset: -9, borderRadius: '50%', background: `radial-gradient(circle,${halo},transparent 68%)`, animation: pulseAnim }} />
          <div style={{ position: 'absolute', inset: 0, clipPath: t.clip, background: `radial-gradient(circle at 50% 45%,${fill},#070707 72%)`, border: `2px solid ${s.col}`, boxShadow: `0 0 16px ${glow},inset 0 0 12px #000`, opacity, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: '34%', height: '34%', borderRadius: '50%', background: `radial-gradient(circle,${s.col},transparent 70%)`, animation: coreAnim }} />
          </div>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, transform: 'rotate(45deg)', background: '#070707', border: `1.5px solid ${armyCol}`, boxShadow: `0 0 6px ${armyCol}` }} />
        </div>
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 11, color: s.col, textShadow: '0 1px 5px #000' }}>{title}</div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, textTransform: 'uppercase', color: s.col }}>Faglia · {s.label}</span>
            {days > 0 && !spent && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: timerCol, border: `1px solid ${timerCol}`, padding: '0 4px' }}>⏣ {days}g</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // variant === 'panel'
  const collapseEffect = spent
    ? state === 'collapsed' ? "Residuo spento — l'anomalia si è richiusa." : 'Faglia sigillata.'
    : props.collapseEffect || "Distorce il collegamento e libera un'Armata maggiore.";

  return (
    <div
      className="ca1-anim"
      style={{
        width: 340, fontFamily: 'var(--font-ui)', position: 'relative',
        background: `linear-gradient(168deg,#181020,#0b0810 68%),radial-gradient(ellipse 80% 60% at 20% 0%,${halo},transparent 70%)`,
        border: `1.5px solid ${s.col}`,
        boxShadow: `0 0 22px ${glow},inset 0 0 40px rgba(0,0,0,.55)`,
        padding: '16px 18px',
        clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))',
        animation: tremorAnim,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 10, height: 10, transform: 'rotate(45deg)', background: armyCol, boxShadow: `0 0 8px ${armyCol}`, flex: 'none' }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg1)' }}>{armyName}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: s.col, border: `1px solid ${s.col}`, padding: '2px 7px' }}>{s.label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: 20, letterSpacing: '.02em', color: 'var(--fg1)', marginTop: 10, textShadow: '0 2px 8px #000' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: s.col, marginTop: 2 }}>{t.label}</div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)' }}>{spent ? 'Stato' : 'Collasso'}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: timerCol }}>{spent ? s.label : days > 0 ? `fra ${days} g` : 'imminente'}</span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {segArr.map((on, i) => (
            <span key={i} style={{ flex: 1, height: 6, background: on ? timerCol : '#26262b', boxShadow: on ? `0 0 6px ${timerCol}` : 'none' }} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)', width: 70, flex: 'none', paddingTop: 2 }}>Missione</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--fg1)', lineHeight: 1.4 }}>{props.mission || 'Chiudi la Faglia prima del Collasso.'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)', width: 70, flex: 'none', paddingTop: 2 }}>Ricompensa</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: '#e6c778', lineHeight: 1.4 }}>{props.reward || 'Frammento di Direttiva'}</span>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(194,71,63,.08)', borderLeft: `2px solid ${s.col}` }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: s.col, marginBottom: 3 }}>Effetto del Collasso</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)', lineHeight: 1.45 }}>{collapseEffect}</div>
      </div>

      {!!props.blockedNote && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#e88f88' }}>
          <span>⛒</span>
          {props.blockedNote}
        </div>
      )}
    </div>
  );
}
