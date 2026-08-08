/**
 * MapNode — nodo della mappa Campagna Atto I.
 * Conversione React di `campaign-map-node/MapNode.dc.html` (pacchetto 2).
 * Ogni tipo ha una silhouette diversa: lo stato non è distinto solo dal colore.
 */

import React from 'react';

const TYPES = {
  bridgehead: { col: '#f5f3ec', clip: 'polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0 50%)', base: 72 },
  enclave: { col: '#cfccc2', clip: 'polygon(50% 0,100% 20%,100% 62%,50% 100%,0 62%,0 20%)', base: 66 },
  strategic: { col: '#2b5cff', clip: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', base: 66 },
  stronghold: { col: '#cfccc2', clip: 'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)', base: 88 },
  event: { col: '#e8189a', clip: 'none', base: 64 },
  riftSlot: { col: '#e8189a', clip: 'polygon(50% 0,62% 20%,85% 14%,75% 38%,100% 50%,75% 62%,85% 86%,62% 80%,50% 100%,38% 80%,15% 86%,25% 62%,0 50%,25% 38%,15% 14%,38% 20%)', base: 70 },
};

const STATES = {
  hidden: { label: 'Nascosto', col: '#6d6b64' },
  locked: { label: 'Bloccato', col: '#6d6b64' },
  available: { label: 'Disponibile', col: '#f5f3ec' },
  selected: { label: 'Selezionato', col: '#f5f3ec' },
  controlled: { label: 'Controllato', col: '#2b5cff' },
  threatened: { label: 'Minacciato', col: '#c2473f' },
  occupied: { label: 'Occupato', col: '#c2473f' },
  blocked: { label: 'Sospeso', col: '#c9a23e' },
  completed: { label: 'Completato', col: '#4a9e78' },
};

function TypeIcon({ type, col, size }) {
  const s = Math.round(size * 0.42);
  const svgProps = { viewBox: '0 0 24 24', width: s, height: s, fill: 'none', stroke: col, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'bridgehead') {
    return (
      <svg {...svgProps}>
        <circle cx={12} cy={5} r={2.4} /><line x1={12} y1={7.4} x2={12} y2={20} />
        <path d="M5 13 a7 7 0 0 0 14 0" /><line x1={5} y1={13} x2={5} y2={10.5} /><line x1={19} y1={13} x2={19} y2={10.5} />
      </svg>
    );
  }
  if (type === 'enclave') {
    return (
      <svg {...svgProps}>
        <path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z" /><line x1={12} y1={8} x2={12} y2={15} />
      </svg>
    );
  }
  if (type === 'strategic') {
    return (
      <svg {...svgProps}>
        <polygon points="12,3 21,12 12,21 3,12" /><circle cx={12} cy={12} r={2.6} fill={col} />
      </svg>
    );
  }
  if (type === 'stronghold') {
    return (
      <svg {...svgProps}>
        <path d="M4 20 V9 l3 -2 V5 h2 v2 l3 -2 3 2 V7 h2 v2 l3 2 v9 Z" /><line x1={4} y1={14} x2={20} y2={14} />
      </svg>
    );
  }
  if (type === 'event') {
    return (
      <svg {...svgProps}>
        <path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" />
      </svg>
    );
  }
  return (
    <svg {...svgProps}>
      <path d="M12 3 C10 8 14 10 12 12 C10 14 14 16 12 21" /><path d="M8 6 C7 9 9 11 8 13" /><path d="M16 8 C17 11 15 13 16 16" />
    </svg>
  );
}

export default function MapNode(props) {
  const type = props.type || 'enclave';
  const state = props.state || 'available';
  const compact = !!props.compact;
  const selected = !!props.selected || state === 'selected';
  const t = TYPES[type] || TYPES.enclave;
  const s = STATES[state] || STATES.available;

  let col = t.col;
  if (state === 'controlled') col = '#2b5cff';
  else if (state === 'threatened' || state === 'occupied') col = '#c2473f';
  else if (state === 'blocked') col = '#c9a23e';
  else if (state === 'completed') col = '#4a9e78';
  else if (state === 'locked' || state === 'hidden') col = '#6d6b64';

  const size = Math.round((compact ? 0.74 : 1) * t.base);
  const isRound = type === 'event';
  const dashed = state === 'locked' || state === 'hidden' || state === 'blocked' || (type === 'riftSlot' && (state === 'available' || state === 'locked'));
  const dim = state === 'hidden' || state === 'locked' || state === 'occupied';
  const opacity = state === 'hidden' ? 0.42 : dim ? 0.64 : 1;
  const anim = selected
    ? 'cmn-sel 2.4s ease-in-out infinite'
    : state === 'threatened'
      ? 'cmn-threat 1.5s ease-in-out infinite'
      : state === 'available'
        ? 'cmn-pulse 2.8s ease-in-out infinite'
        : 'none';

  const difficulty = props.difficulty || 0;
  const diffCol = difficulty >= 5 ? '#c2473f' : difficulty >= 4 ? '#e8189a' : difficulty >= 3 ? '#c9a23e' : '#2b5cff';
  const showDiff = difficulty > 0 && ['available', 'selected', 'threatened'].includes(state);

  const mode = props.mode && props.mode !== 'none' ? props.mode : null;
  const modeMap = { domination: { g: '⌖', l: 'DOM', c: '#d4af37' }, annihilation: { g: '☠', l: 'ANN', c: '#dc2626' } };
  const m = mode ? modeMap[mode] : null;
  const showMode = !!m && ['available', 'selected', 'controlled', 'threatened'].includes(state);

  const days = props.days || 0;
  let timerText = '';
  let timerCol = '#c2473f';
  if (state === 'threatened' && days) { timerText = `⚠ ${days}g`; timerCol = '#c2473f'; }
  else if ((state === 'blocked' || state === 'occupied') && days) { timerText = `⧗ ${days}g`; timerCol = '#c9a23e'; }

  const hidden = state === 'hidden';
  const showLabel = props.showLabel !== false;

  return (
    <div
      className="ca1-anim"
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', transform: selected ? 'scale(1.05)' : 'none', transition: 'transform .2s' }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            clipPath: isRound ? 'none' : t.clip,
            borderRadius: isRound ? '50%' : 0,
            background: dim ? 'rgba(16,16,18,.82)' : `radial-gradient(circle at 50% 38%, ${col}2e, #070707 74%)`,
            border: `${selected ? 2.5 : type === 'stronghold' ? 2.2 : 1.6}px ${dashed ? 'dashed' : 'solid'} ${selected ? '#f5f3ec' : col}`,
            boxShadow: selected ? '0 0 26px #f5f3ecaa,inset 0 0 14px rgba(0,0,0,.6)' : state === 'available' ? `0 0 16px ${col}88,inset 0 0 14px rgba(0,0,0,.6)` : 'inset 0 0 14px rgba(0,0,0,.6)',
            opacity,
            animation: anim,
          }}
        >
          {hidden
            ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.4, color: '#6d6b64' }}>?</span>
            : <TypeIcon type={type} col={dim ? '#9a988f' : col} size={size} />}
        </div>
        {(state === 'controlled' || state === 'completed') && (
          <div style={{ position: 'absolute', top: -6, right: -4, width: 20, height: 20, transform: 'rotate(45deg)', background: '#070707', border: `1.5px solid ${state === 'completed' ? '#4a9e78' : '#2b5cff'}`, boxShadow: `0 0 8px ${state === 'completed' ? '#4a9e78' : '#2b5cff'}` }} />
        )}
        {state === 'occupied' && (
          <div style={{ position: 'absolute', top: -6, right: -4, width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#070707', border: '1.5px solid #c2473f', boxShadow: '0 0 8px rgba(194,71,63,.53)', color: '#c2473f', fontSize: 13, lineHeight: 1 }}>✕</div>
        )}
        {!!props.mission && ['available', 'selected'].includes(state) && (
          <div style={{ position: 'absolute', top: -6, left: -4, width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#070707', border: '1.5px solid #cfccc2', color: '#cfccc2', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1 }}>!</div>
        )}
        {state === 'locked' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(7,7,7,.4)' }}>
            <svg viewBox="0 0 24 24" width={size * 0.3} height={size * 0.3} fill="none" stroke="#9a988f" strokeWidth={1.8}>
              <rect x={5} y={11} width={14} height={9} rx={1} /><path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
            </svg>
          </div>
        )}
      </div>

      {showLabel && (
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: type === 'stronghold' ? 14 : compact ? 10 : 11.5, letterSpacing: '.04em', color: dim ? '#6d6b64' : selected ? '#f5f3ec' : '#ece9e2', textShadow: '0 1px 5px #000' }}>
            {hidden ? '???' : props.title || s.label}
          </div>
          {!compact && !!props.subtitle && !hidden && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.06em', color: '#9a988f', marginTop: 1 }}>{props.subtitle}</div>
          )}
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', marginTop: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: s.col }}>{s.label}</span>
            {showMode && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: m.c }}>{m.g} {m.l}</span>}
            {!!timerText && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: timerCol, border: `1px solid ${timerCol}`, padding: '0 4px' }}>{timerText}</span>}
          </div>
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', alignItems: 'center', marginTop: 3, minHeight: 8 }}>
            {showDiff && (
              <span style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `7px solid ${i <= difficulty ? diffCol : '#262629'}` }} />
                ))}
              </span>
            )}
            {!!props.mainPath && !hidden && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f5f3ec', letterSpacing: '.1em' }}>» PRINCIPALE</span>}
            {!!props.optional && !hidden && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#9a988f', letterSpacing: '.1em' }}>◇ OPZIONALE</span>}
          </div>
        </div>
      )}
    </div>
  );
}
