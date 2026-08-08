/**
 * MissionPanel — pannello missione della Campagna Atto I.
 * Conversione React di `campaign-mission/MissionPanel.dc.html` (pacchetto 2).
 * `rewards` e `prereqs` accettano array (preferito in React) o stringa "a;b;c" / "nome|1; …".
 */

import React from 'react';

const STATES = {
  disponibile: { accent: '#58d9dc', banner: null },
  bloccata: { accent: '#6d6b64', banner: { icon: '🔒', text: 'Prerequisiti mancanti — missione non ancora accessibile.' }, disabled: true },
  selezionata: { accent: '#f5f3ec', banner: null },
  urgente: { accent: '#e7a849', banner: { icon: '⚠', text: "Urgente — l'occasione svanisce a breve.", anim: true } },
  faglia: { accent: '#c2473f', banner: { icon: '⟁', text: 'Faglia critica — Collasso imminente.' } },
  finale: { accent: '#d4af37', banner: { icon: '✶', text: "Conquistare il Faro del Primo Sole concluderà l'Atto. Le attività non completate verranno abbandonate." }, final: true },
  riconquista: { accent: '#c9a23e', banner: { icon: '↺', text: 'Riconquista — il nodo è tornato in mano nemica.' } },
  difesa: { accent: '#c2473f', banner: { icon: '◎', text: 'Difesa della Testa di ponte — respingi il contrattacco.' } },
  completata: { accent: '#4a9e78', banner: { icon: '✓', text: 'Missione completata.' }, done: true },
};

const ARMY = {
  orizzonte: ['#a78bfa', "Figli dell'Orizzonte"],
  kethran: ['#fbbf24', 'Kethran'],
  corte: ['#f43f5e', 'Corte Rossa'],
  calibri: ['#94a3b8', 'Calibri Pesanti'],
  orathai: ['#2dd4bf', 'Orathai'],
  khemet: ['#22d3ee', 'Khemet'],
  mounthborn: ['#a3e635', 'Mounthborn'],
  ratti: ['#10b981', 'Ratti'],
  nascente: ['#a78bfa', 'Nascente'],
};

const NODE_TYPES = { bridgehead: 'Testa di ponte', enclave: 'Enclave', strategic: 'Nodo strategico', stronghold: 'Roccaforte', event: 'Evento', rift: 'Faglia' };

function toList(value) {
  if (Array.isArray(value)) return value;
  return (value || '').split(';').map((s) => s.trim()).filter(Boolean);
}

function toPrereqs(value) {
  if (Array.isArray(value)) return value; // [{label, met}]
  return toList(value).map((row) => {
    const [label, met] = row.split('|');
    return { label: (label || '').trim(), met: (met || '').trim() === '1' };
  });
}

export default function MissionPanel(props) {
  const state = props.state || 'disponibile';
  const s = STATES[state] || STATES.disponibile;
  const [armyCol, defaultArmyName] = ARMY[props.faction || 'corte'] || ARMY.corte;
  const armyName = props.factionName || defaultArmyName;
  const mode = props.mode || 'domination';
  const modeMap = { domination: { g: '⌖', l: 'Dominazione', c: '#d4af37' }, annihilation: { g: '☠', l: 'Annientamento', c: '#dc2626' } };
  const m = modeMap[mode] || modeMap.domination;
  const difficulty = props.difficulty ?? 3;
  const diffCol = difficulty >= 5 ? '#c2473f' : difficulty >= 4 ? '#e8189a' : difficulty >= 3 ? '#c9a23e' : '#58d9dc';
  const rewards = toList(props.rewards ?? "Nuovo Agente L2;Espansione dell'esercito");
  const prereqs = toPrereqs(props.prereqs);
  const pvMod = props.pvMod ?? 0;
  const fcMod = props.fcMod ?? 0;
  const days = props.days ?? 2;

  const btnBg = s.done ? '#26262b' : s.accent;
  const btnFg = s.done
    ? '#9a988f'
    : ['#f5f3ec', '#58d9dc', '#d4af37', '#c9a23e', '#4a9e78'].includes(s.accent) ? '#070707' : '#f5f3ec';
  const engageLabel = s.final
    ? 'Conferma missione finale'
    : s.disabled ? 'Bloccata' : state === 'difesa' ? 'Difendi' : state === 'riconquista' ? 'Riconquista' : 'Affronta missione';

  const secondaryBtn = {
    fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
    color: 'var(--fg1)', background: 'rgba(245,243,236,.05)', border: '1.5px solid var(--accent-slate)', padding: '11px 12px', cursor: 'pointer',
  };

  return (
    <div
      className="ca1-anim"
      style={{
        width: props.width ?? 380, fontFamily: 'var(--font-ui)', position: 'relative',
        background: 'linear-gradient(178deg,#161318,#0b090c 70%)',
        border: `1.5px solid ${s.accent}`,
        boxShadow: `0 0 22px ${s.accent}44,inset 0 0 40px rgba(0,0,0,.5)`,
        clipPath: 'polygon(0 12px,12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px))',
        overflow: 'hidden',
      }}
    >
      {/* Testata */}
      <div style={{ position: 'relative', height: 132, backgroundImage: 'repeating-linear-gradient(135deg,#1b1a22,#1b1a22 9px,#141319 9px,#141319 18px)', borderBottom: `1.5px solid ${s.accent}` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(11,9,12,.1),rgba(11,9,12,.92))' }} />
        <div style={{ position: 'absolute', top: 10, left: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--fg3)', textTransform: 'uppercase' }}>
          CAMPO · {NODE_TYPES[props.nodeType || 'enclave'] || 'Enclave'}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'rgba(7,7,7,.6)', border: `1px solid ${armyCol}` }}>
          <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: armyCol }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--fg1)', textTransform: 'uppercase' }}>{armyName}</span>
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '.02em', color: 'var(--fg1)', textShadow: '0 2px 8px #000', lineHeight: 1.05 }}>
            {props.title || 'Enclave delle Ceneri'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>
            {props.subtitle || ''}
          </div>
        </div>
      </div>

      {/* Banner di stato */}
      {!!s.banner && (
        <div style={{ padding: '9px 14px', background: `${s.accent}18`, borderBottom: `1px solid ${s.accent}`, display: 'flex', alignItems: 'center', gap: 8, animation: s.banner.anim ? 'mp-urg 1.6s ease-in-out infinite' : 'none' }}>
          <span style={{ color: s.accent, fontSize: 14 }}>{s.banner.icon}</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, letterSpacing: '.02em', color: 'var(--fg1)', lineHeight: 1.35 }}>{s.banner.text}</span>
        </div>
      )}

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
        {/* Modalità · difficoltà · giorni */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: m.c, border: `1px solid ${m.c}`, padding: '2px 8px' }}>{m.g} {m.l}</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Difficoltà</span>
            <span style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `8px solid ${i <= difficulty ? diffCol : '#26262b'}` }} />
              ))}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Giorni</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: days <= 1 ? '#e88f88' : '#e6e2d8' }}>{days}</span>
          </div>
        </div>

        {/* Regole */}
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--fg2)', lineHeight: 1.5 }}>{props.rules || ''}</div>

        {/* Ricompense */}
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: '#e6c778', marginBottom: 6 }}>Ricompense</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rewards.map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#e6c778', fontSize: 11, lineHeight: 1.5 }}>◆</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--fg1)', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conseguenze */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '9px 11px', background: 'rgba(194,71,63,.08)', borderLeft: '2px solid #7a2b28' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#d76b64', marginBottom: 3 }}>Se sconfitto</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--fg1)', lineHeight: 1.4 }}>{props.defeat || 'Il nodo resta nemico · passa 1 giorno.'}</div>
          </div>
          <div style={{ flex: 1, padding: '9px 11px', background: 'rgba(201,162,62,.08)', borderLeft: '2px solid #8a6a2a' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#d4af37', marginBottom: 3 }}>Se ignorata</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--fg1)', lineHeight: 1.4 }}>{props.ignored || "L'Enclave si fortifica · +1 difficoltà."}</div>
          </div>
        </div>

        {/* Effetti PV/FC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderTop: '1px solid var(--accent-slate)', borderBottom: '1px solid var(--accent-slate)' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Effetti</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: pvMod < 0 ? '#c2473f' : pvMod > 0 ? '#4a9e78' : '#9a988f' }}>{(pvMod > 0 ? '+' : '') + pvMod} PV</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: fcMod < 0 ? '#c2473f' : fcMod > 0 ? '#4a9e78' : '#9a988f' }}>{(fcMod > 0 ? '+' : '') + fcMod} FC</span>
        </div>

        {/* Prerequisiti */}
        {prereqs.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)', marginBottom: 6 }}>Prerequisiti</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {prereqs.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'var(--font-ui)', fontSize: 11.5, color: q.met ? '#7fb8ba' : '#d76b64' }}>
                  <span style={{ color: q.met ? '#58d9dc' : undefined }}>{q.met ? '✓' : '✗'}</span>
                  {q.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {!s.done && (
            <button
              type="button" onClick={props.onEngage} disabled={!!s.disabled}
              style={{
                flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase',
                color: btnFg, background: btnBg, border: `1.5px solid ${s.accent}`, padding: '11px 12px',
                cursor: s.disabled ? 'default' : 'pointer', opacity: s.disabled ? 0.5 : 1,
                clipPath: 'polygon(0 5px,5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%)',
              }}
            >
              {engageLabel}
            </button>
          )}
          {props.onTrace && (
            <button type="button" onClick={props.onTrace} title="Traccia il percorso sulla mappa" className="ca1-focus-cyan" style={secondaryBtn}>Traccia</button>
          )}
          <button type="button" onClick={props.onBack} style={secondaryBtn}>Torna</button>
        </div>
      </div>
    </div>
  );
}
