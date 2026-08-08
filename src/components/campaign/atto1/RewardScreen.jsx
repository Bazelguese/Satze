/**
 * RewardScreen + CardRewardChoice + ResourceReward — schermata ricompense Atto I.
 * Conversione React di `campaign-reward/*.dc.html` (pacchetto 2).
 * In React `cards` e `resources` sono array di oggetti (le stringhe ";;" restano supportate).
 */

import React from 'react';

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

const RARITY = {
  comune: ['#9a988f', 'Comune'],
  rara: ['#58d9dc', 'Rara'],
  epica: ['#a78bfa', 'Epica'],
  leggendaria: ['#e6c778', 'Leggendaria'],
};

const RESOURCE_KINDS = {
  pv: { glyph: '◈', col: '#58d9dc', label: 'Punti Vita', desc: 'Aumenta i PV base' },
  focus: { glyph: '◉', col: '#6a8cff', label: 'Focus Coin', desc: 'Aumenta i FC base' },
  army: { glyph: '⛨', col: '#c9a23e', label: 'Capacità esercito', desc: 'Slot Agente aggiuntivo' },
  nascente: { glyph: '✶', col: '#a78bfa', label: 'Nascente', desc: 'Potenziamento del Nascente' },
  modifier: { glyph: '∞', col: '#e6c778', label: 'Modificatore', desc: 'Effetto persistente' },
  info: { glyph: '◇', col: '#9a988f', label: 'Informazione', desc: 'Rivela un tratto della mappa' },
  battlefield: { glyph: '⬢', col: '#e256c9', label: 'Campo di battaglia', desc: 'Sblocca un nuovo Campo' },
};

function pickKey(cb, disabled) {
  return (e) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (cb) cb();
    }
  };
}

export function CardRewardChoice(props) {
  const [armyCol, armyName] = ARMY[props.army || 'orizzonte'] || ARMY.orizzonte;
  const [rarCol, rarityLabel] = RARITY[props.rarity || 'rara'] || RARITY.rara;
  const state = props.state || 'available';
  const disabled = state === 'disabled';
  const selected = state === 'selected';
  const accent = disabled ? '#5a5750' : rarCol;
  const name = props.cardName || props.name || '';
  const level = props.level ?? 2;
  const pot = props.pot ?? 2;
  const dan = props.dan ?? 2;
  const power = props.power || 'Nessun potere.';

  return (
    <div
      tabIndex={0} role="button" className="ca1-card-pick"
      onClick={disabled ? undefined : props.onPick}
      onKeyDown={pickKey(props.onPick, disabled)}
      title={`${name} — L${level} ${armyName} · ${rarityLabel}\nPOT ${pot} · DAN ${dan}\n${power}${props.synergy ? `\nSinergia: ${props.synergy}` : ''}`}
      style={{
        position: 'relative', width: 206, boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
        background: 'linear-gradient(172deg,#17151b,#0b090c 72%)',
        border: `1.5px solid ${selected ? accent : disabled ? '#2a2a30' : '#3a3a42'}`,
        boxShadow: selected ? `0 0 24px ${accent}66` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: selected ? 'translateY(-4px)' : 'none',
        transition: 'transform .18s,border-color .18s,box-shadow .18s',
        clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: -1, left: -1, right: -1, padding: '4px 0', background: accent, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.16em', textAlign: 'center', textTransform: 'uppercase', color: '#070707', zIndex: 2 }}>Selezionata</div>
      )}
      <div style={{ position: 'relative', height: 126, backgroundImage: 'repeating-linear-gradient(135deg,#1d1b23,#1d1b23 8px,#16141b 8px,#16141b 16px)', borderBottom: `1.5px solid ${accent}`, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', color: 'var(--fg3)' }}>illustrazione</span>
        <div style={{ position: 'absolute', top: 7, left: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 6px', background: 'rgba(7,7,7,.75)', border: `1px solid ${disabled ? '#5a5750' : armyCol}` }}>
          <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: disabled ? '#5a5750' : armyCol }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg1)' }}>{armyName}</span>
        </div>
        <div style={{ position: 'absolute', top: 7, right: 8, width: 24, height: 24, display: 'grid', placeItems: 'center', background: 'rgba(7,7,7,.8)', border: `1.5px solid ${accent}`, transform: 'rotate(45deg)' }}>
          <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-mono)', fontSize: 11, color: accent }}>{level}</span>
        </div>
      </div>
      <div style={{ padding: '12px 13px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '.01em', color: 'var(--fg1)', lineHeight: 1.15 }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: disabled ? '#5a5750' : rarCol, marginTop: 2 }}>{props.role || 'Agente'} · {rarityLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '5px 0', background: 'rgba(88,217,220,.07)', border: '1px solid rgba(88,217,220,.28)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>POT</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1, color: '#58d9dc' }}>{pot}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '5px 0', background: 'rgba(194,71,63,.07)', border: '1px solid rgba(194,71,63,.28)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>DAN</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1, color: '#d76b64' }}>{dan}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', lineHeight: 1.45, minHeight: 31 }}>{power}</div>
        {!!props.synergy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(245,243,236,.08)', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#6fce9f' }}>
            <span>⧉</span>
            {props.synergy}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResourceReward(props) {
  const kind = props.kind || 'pv';
  const k = RESOURCE_KINDS[kind] || RESOURCE_KINDS.pv;
  const state = props.state || 'available';
  const disabled = state === 'disabled';
  const selected = state === 'selected';
  const col = disabled ? '#5a5750' : k.col;
  const amount = props.amount != null && props.amount !== '' ? props.amount : '';
  const label = props.label || k.label;
  const description = props.description || k.desc;
  const tagText = props.tag || (props.permanent ? 'Permanente' : '');

  return (
    <div
      tabIndex={0} role="button"
      onClick={disabled ? undefined : props.onPick}
      onKeyDown={pickKey(props.onPick, disabled)}
      title={`${label}${amount ? ` ${amount}` : ''} — ${description}${props.permanent ? '\nEffetto permanente' : ''}`}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 158, boxSizing: 'border-box',
        padding: '16px 14px 14px', fontFamily: 'var(--font-ui)', textAlign: 'center',
        background: 'linear-gradient(172deg,rgba(245,243,236,.05),rgba(7,7,7,.4))',
        border: `1.5px solid ${selected ? col : disabled ? '#2a2a30' : '#3a3a42'}`,
        boxShadow: selected ? `0 0 18px ${col}55` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color .16s,background .16s',
        clipPath: 'polygon(0 8px,8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px))',
      }}
    >
      {selected && <span style={{ position: 'absolute', top: 6, right: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: col }}>✓</span>}
      <div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', border: `1.5px solid ${col}`, transform: 'rotate(45deg)', background: `radial-gradient(circle,${col}33,transparent 70%)` }}>
        <span style={{ transform: 'rotate(-45deg)', fontSize: 19, lineHeight: 1, color: col }}>{props.glyph || k.glyph}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, lineHeight: 1, color: col, textShadow: `0 0 10px ${col}66` }}>{amount}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, letterSpacing: '.03em', color: 'var(--fg1)', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, color: 'var(--fg2)', lineHeight: 1.4, marginTop: 3 }}>{description}</div>
      </div>
      {!!tagText && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: props.permanent ? '#e6c778' : '#9a988f', border: `1px solid ${props.permanent ? '#e6c778' : '#9a988f'}`, padding: '1px 6px' }}>{tagText}</span>
      )}
    </div>
  );
}

function parseCards(value, sel, onPick) {
  const rows = Array.isArray(value)
    ? value
    : (value || '').split(';;').map((s) => s.trim()).filter(Boolean).map((row) => {
      const f = row.split('|').map((x) => (x || '').trim());
      return { name: f[0] || '', army: f[1] || 'orizzonte', level: Number(f[2] || 2), rarity: f[3] || 'rara', pot: Number(f[4] || 2), dan: Number(f[5] || 2), power: f[6] || '', synergy: f[7] || '', role: f[8] || 'Agente' };
    });
  return rows.map((c, i) => ({
    ...c,
    cardName: c.cardName || c.name,
    state: c.state || (sel === i ? 'selected' : 'available'),
    onPick: c.onPick || (onPick ? () => onPick(i) : null),
  }));
}

function parseResources(value, sel, onPick) {
  const rows = Array.isArray(value)
    ? value
    : (value || '').split(';;').map((s) => s.trim()).filter(Boolean).map((row) => {
      const f = row.split('|').map((x) => (x || '').trim());
      return { kind: f[0] || 'pv', amount: f[1] || '', label: f[2] || '', description: f[3] || '', permanent: f[4] === '1', tag: f[5] || '' };
    });
  return rows.map((r, i) => ({
    ...r,
    state: r.state || (sel === i ? 'selected' : 'available'),
    onPick: r.onPick || (onPick ? () => onPick(i) : null),
  }));
}

export default function RewardScreen(props) {
  const variant = props.variant || 'carte';
  const V = { carte: '#c9a23e', risorse: '#58d9dc', misto: '#a78bfa', riepilogo: '#4a9e78' };
  const accent = V[variant] || V.carte;
  const selectedCard = props.selectedCard ?? -1;
  const selectedResource = props.selectedResource ?? -1;
  const cards = parseCards(props.cards, selectedCard, props.onSelectCard);
  const resources = parseResources(props.resources, selectedResource, props.onSelectResource);
  const needsPick = props.requireSelection !== false;
  const picked = (cards.length ? selectedCard >= 0 : true) && (resources.length && props.resourceIsChoice ? selectedResource >= 0 : true);
  const confirmDisabled = needsPick && !picked;

  return (
    <div
      className="ca1-anim"
      style={{
        width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-ui)', position: 'relative',
        background: `linear-gradient(178deg,#16131a,#0a0809 72%),radial-gradient(ellipse 70% 46% at 50% 0%,${accent}22,transparent 68%)`,
        border: `1.5px solid ${accent}`,
        boxShadow: `inset 0 0 70px rgba(0,0,0,.6),0 0 30px ${accent}38`,
        padding: '26px 30px 28px',
        clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,162,62,.55),transparent)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: accent }}>{props.eyebrow || ''}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--fg1)', marginTop: 6, textShadow: '0 2px 12px #000' }}>{props.title || 'Bottino di guerra'}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)', marginTop: 7, lineHeight: 1.5, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>{props.subtitle || ''}</div>
      </div>

      {cards.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg2)' }}>{props.cardsLabel || 'Scegli una carta'}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--accent-slate)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg3)' }}>1 di {cards.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cards.map((c, i) => <CardRewardChoice key={i} {...c} />)}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg2)' }}>{props.resourcesLabel || (props.resourceIsChoice ? 'Scegli un potenziamento' : 'Ottieni inoltre')}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--accent-slate)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg3)' }}>{props.resourceIsChoice ? `1 di ${resources.length}` : 'automatico'}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {resources.map((r, i) => <ResourceReward key={i} {...r} />)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 16, borderTop: '1px solid var(--accent-slate)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: confirmDisabled ? '#d76b64' : '#9a988f' }}>
          {confirmDisabled ? 'Seleziona una ricompensa per continuare.' : props.note || ''}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {!!props.skipLabel && (
            <button
              type="button" onClick={props.onSkip}
              style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg2)', background: 'transparent', border: '1.5px solid var(--accent-slate)', padding: '11px 18px', cursor: 'pointer' }}
            >
              {props.skipLabel}
            </button>
          )}
          <button
            type="button" onClick={props.onConfirm} disabled={confirmDisabled}
            style={{
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase',
              color: '#070707', background: accent, border: `1.5px solid ${accent}`, padding: '11px 26px',
              cursor: confirmDisabled ? 'default' : 'pointer', opacity: confirmDisabled ? 0.45 : 1,
              clipPath: 'polygon(0 5px,5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%)',
            }}
          >
            {props.confirmLabel || 'Conferma e prosegui'}
          </button>
        </div>
      </div>
    </div>
  );
}
