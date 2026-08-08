/**
 * StartingArmySelection + ArmySlot — schieramento iniziale dell'Atto I.
 * Conversione React di `campaign-army/*.dc.html` (pacchetto 2).
 * Il pool arriva dalle props come array di oggetti
 * `{ name, role, rarity, pot, dan, power, synergy, tag }`; lo stato dei pick è interno.
 */

import React, { useState } from 'react';
import { CardRewardChoice } from './RewardScreen.jsx';

export function ArmySlot(props) {
  const filled = !!props.name;
  const kind = props.kind || 'compagno';
  const accent = kind === 'nascente' ? '#a78bfa' : filled ? '#58d9dc' : '#5a5750';
  const removable = filled && kind !== 'nascente';

  return (
    <div
      tabIndex={0} role="button"
      onClick={props.onAction}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (props.onAction) props.onAction();
        }
      }}
      title={filled
        ? `${props.name} — L${props.level ?? 2} · POT ${props.pot ?? 2} · DAN ${props.dan ?? 2}${kind === 'nascente' ? '\nIl Nascente è obbligatorio e non può essere rimosso.' : '\nClic per rimuovere dallo schieramento'}`
        : props.emptyHint || 'Slot vuoto'}
      style={{
        position: 'relative', width: 186, boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
        background: filled ? 'linear-gradient(172deg,#17151b,#0b090c 74%)' : 'rgba(245,243,236,.02)',
        border: `1.5px ${filled ? 'solid' : 'dashed'} ${filled ? accent : '#3a3a42'}`,
        boxShadow: filled ? `0 0 16px ${accent}3a` : 'none',
        cursor: props.onAction ? 'pointer' : 'default',
        transition: 'border-color .16s,box-shadow .16s',
        clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))',
      }}
    >
      <div style={{ padding: '7px 10px', background: `${accent}16`, borderBottom: `1px solid ${filled ? accent : '#3a3a42'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: accent }}>
          {props.slotLabel || (kind === 'nascente' ? 'Nascente' : 'Compagno')}
        </span>
        {kind === 'nascente' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: '#e6c778' }}>obbligatorio</span>
        )}
      </div>
      {filled ? (
        <div>
          <div style={{ position: 'relative', height: 112, backgroundImage: props.imageSrc ? undefined : 'repeating-linear-gradient(135deg,#1d1b23,#1d1b23 8px,#16141b 8px,#16141b 16px)', background: props.imageSrc ? '#0a0810' : undefined, borderBottom: `1px solid ${accent}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {props.imageSrc ? (
              <img src={props.imageSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', color: 'var(--fg3)' }}>illustrazione</span>
            )}
            <div style={{ position: 'absolute', top: 6, right: 7, width: 22, height: 22, display: 'grid', placeItems: 'center', background: 'rgba(7,7,7,.8)', border: `1.5px solid ${accent}`, transform: 'rotate(45deg)' }}>
              <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-mono)', fontSize: 10, color: accent }}>L{props.level ?? 2}</span>
            </div>
          </div>
          <div style={{ padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--fg1)', lineHeight: 1.15 }}>{props.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: accent, marginTop: 2 }}>{props.role || 'Agente'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '3px 0', background: 'rgba(88,217,220,.07)', border: '1px solid rgba(88,217,220,.26)' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 7.5, letterSpacing: '.12em', color: 'var(--fg2)' }}>POT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#58d9dc' }}>{props.pot ?? 2}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '3px 0', background: 'rgba(194,71,63,.07)', border: '1px solid rgba(194,71,63,.26)' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 7.5, letterSpacing: '.12em', color: 'var(--fg2)' }}>DAN</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#d76b64' }}>{props.dan ?? 2}</span>
              </div>
            </div>
            {removable && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg3)', textAlign: 'center' }}>✕ rimuovi</div>}
          </div>
        </div>
      ) : (
        <div style={{ height: 196, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '0 14px', textAlign: 'center' }}>
          <span style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', border: '1.5px dashed #3a3a42', transform: 'rotate(45deg)' }}>
            <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-mono)', fontSize: 16, color: '#5a5750' }}>+</span>
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--fg2)', lineHeight: 1.4 }}>{props.emptyHint || 'Scegli una carta L2 dal pool'}</span>
        </div>
      )}
    </div>
  );
}

const DEFAULT_SYNERGIES = (tags) => [
  { text: 'Vanguardia — due Agenti offensivi aprono il duello con +1 POT.', on: tags.filter((t) => t === 'dps' || t === 'scout').length >= 2, tip: 'Richiede due carte offensive' },
  { text: 'Linea salda — un Difensore accanto a un Supporto riduce di 1 il primo DAN subito.', on: (tags.includes('tank') && tags.includes('buff')) || (tags.includes('tank') && tags.includes('focus')), tip: 'Richiede un Difensore e un Supporto' },
  { text: 'Ricognizione — con uno Scout la mappa rivela un nodo in più a inizio Atto.', on: tags.includes('scout'), tip: 'Richiede una carta con ricognizione' },
];

export default function StartingArmySelection({
  pool = [],
  nascente = { name: 'Nascente', role: 'Protagonista', level: 2, pot: 2, dan: 2 },
  companionSlots = 2,
  pv = 10,
  fc = 10,
  synergiesFor = DEFAULT_SYNERGIES,
  onConfirm,
}) {
  const [picks, setPicks] = useState([]);
  const [log, setLog] = useState('');

  const toggle = (i) => {
    const at = picks.indexOf(i);
    if (at >= 0) {
      setPicks(picks.filter((p) => p !== i));
      setLog(`▸ ${pool[i].name} rimossa`);
      return;
    }
    if (picks.length >= companionSlots) {
      setLog('▸ Slot pieni — rimuovi un compagno per cambiarlo');
      return;
    }
    setPicks([...picks, i]);
    setLog(`▸ ${pool[i].name} schierata`);
  };

  const remove = (slot) => {
    if (picks.length > slot) {
      const removed = picks[slot];
      setPicks(picks.filter((_, idx) => idx !== slot));
      setLog(`▸ ${pool[removed].name} rimossa`);
    }
  };

  const poolItems = pool.map((c, i) => ({
    ...c,
    cardName: c.name,
    army: c.army || 'orizzonte',
    level: c.level ?? 2,
    state: picks.includes(i) ? 'selected' : picks.length >= companionSlots ? 'disabled' : 'available',
    onPick: () => toggle(i),
  }));
  const slots = Array.from({ length: companionSlots }, (_, s) => (picks.length > s ? pool[picks[s]] : null));
  const tags = picks.map((i) => pool[i].tag).filter(Boolean);
  const synergies = synergiesFor(tags).map((s) => ({ ...s, off: !s.on }));
  const complete = picks.length === companionSlots;

  return (
    <div style={{ height: '100%', minHeight: '100%', background: 'radial-gradient(ellipse 70% 46% at 50% 0%,rgba(167,139,250,.08),transparent 62%),var(--bg-night)', fontFamily: 'var(--font-ui)', color: 'var(--fg1)', padding: '34px 40px 56px', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.24em', color: 'var(--accent-magenta)', marginBottom: 6 }}>SATZE · CAMPAGNA</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '.1em', textTransform: 'uppercase' }}>Esercito Iniziale</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--fg2)', marginTop: 8, maxWidth: 740, lineHeight: 1.55 }}>
          Prima di toccare la mappa il giocatore schiera tre carte: il <b style={{ color: '#a78bfa' }}>Nascente</b>, obbligatorio, e {companionSlots} compagni L2 dei Figli dell'Orizzonte. Le riserve partono da {pv} PV e {fc} Focus Coin.
        </div>

        <div style={{ marginTop: 26, display: 'flex', gap: 26, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Pool */}
          <div style={{ flex: 1, minWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Pool · Figli dell'Orizzonte L2</span>
              <span style={{ flex: 1, height: 1, background: 'var(--accent-slate)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg3)' }}>{picks.length} / {companionSlots} compagni scelti</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              {poolItems.map((c, i) => <CardRewardChoice key={i} {...c} />)}
            </div>
          </div>

          {/* Schieramento — largo abbastanza da tenere due slot per riga:
              così il pannello resta sotto i 1080px e la conferma è visibile */}
          <div style={{ width: 448, flex: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: '18px 20px 20px', background: 'linear-gradient(178deg,#17141d,#0a0810 74%)', border: '1.5px solid #a78bfa', boxShadow: 'inset 0 0 50px rgba(0,0,0,.6),0 0 24px rgba(167,139,250,.2)', clipPath: 'polygon(0 12px,12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px))' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: '#a78bfa' }}>Schieramento</div>
              <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <ArmySlot kind="nascente" slotLabel="Nascente" name={nascente.name} role={nascente.role} level={nascente.level} pot={nascente.pot} dan={nascente.dan} imageSrc={nascente.imageSrc} />
                {slots.map((s, i) => (
                  <ArmySlot
                    key={i} kind="compagno" slotLabel={`Compagno ${['I', 'II', 'III'][i] || i + 1}`}
                    name={s ? s.name : ''} role={s ? s.role : ''} level={2} pot={s ? s.pot : 2} dan={s ? s.dan : 2}
                    emptyHint="Scegli una carta L2 dal pool"
                    onAction={s ? () => remove(i) : undefined}
                  />
                ))}
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '9px 0', background: 'rgba(88,217,220,.07)', border: '1px solid rgba(88,217,220,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Punti Vita</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, lineHeight: 1, color: '#58d9dc' }}>{pv}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '9px 0', background: 'rgba(106,140,255,.07)', border: '1px solid rgba(106,140,255,.3)' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)' }}>Focus Coin</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, lineHeight: 1, color: '#6a8cff' }}>{fc}</span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)', marginBottom: 7 }}>Sinergie</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {synergies.map((s, i) => (
                    <div
                      key={i} title={s.tip}
                      style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 9px', background: s.on ? 'rgba(74,158,120,.1)' : 'rgba(245,243,236,.02)', borderLeft: `2px solid ${s.on ? '#3a6b54' : '#2a2a30'}` }}
                    >
                      <span style={{ color: s.on ? '#6fce9f' : '#5a5750', fontSize: 10, lineHeight: 1.5 }}>{s.on ? '⧉' : '◇'}</span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: s.on ? '#cfe6da' : '#6d6b64', lineHeight: 1.4 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid var(--accent-slate)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent-light-dim)' }}>
                  {complete ? 'Schieramento pronto' : `Servono ${companionSlots} compagni`}
                </span>
                <button
                  type="button" disabled={!complete}
                  onClick={() => { if (onConfirm) onConfirm(picks.map((i) => pool[i])); }}
                  style={{
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase',
                    color: '#070707', background: '#a78bfa', border: '1.5px solid #a78bfa', padding: '11px 20px',
                    cursor: complete ? 'pointer' : 'default', opacity: complete ? 1 : 0.45,
                    clipPath: 'polygon(0 5px,5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%)',
                  }}
                >
                  Conferma schieramento
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-light-dim)', minHeight: 16 }}>
              {log || 'Clic su una carta del pool per schierarla; clic su uno slot per rimuoverla.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
