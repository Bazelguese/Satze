/**
 * Edge — collegamento fra nodi della mappa Campagna Atto I.
 * Conversione React di `campaign-edge/Edge.dc.html` (pacchetto 2).
 * `EDGE_STYLES` è esportato per il disegno diretto in SVG dentro CampaignMapShell.
 */

import React from 'react';

export const EDGE_STYLES = {
  open: { col: '#cfccc2', sw: 2, dash: 'none', op: 0.92, label: 'Aperto', node: '#8a8880' },
  controlled: { col: '#58d9dc', sw: 2.8, dash: 'none', op: 1, label: 'Controllato', node: '#58d9dc' },
  locked: { col: '#4a4a50', sw: 1.6, dash: '3 4', op: 0.6, label: 'Bloccato', node: '#4a4a50' },
  blocked: { col: '#c2473f', sw: 2.2, dash: '5 5', op: 0.9, label: 'Interdetto', node: '#7a4a48', mid: '✕' },
  hidden: { col: '#3a3a40', sw: 1.4, dash: '1 5', op: 0.4, label: 'Non scoperto', node: '#2a2a30' },
  threatened: { col: '#c2473f', sw: 2.4, dash: 'none', op: 1, label: 'Minacciato', node: '#c2473f', flow: true },
  selected: { col: '#f5f3ec', sw: 2.8, dash: 'none', op: 1, label: 'Selezionato', node: '#f5f3ec', flow: true, glow: true },
  riftBlocked: { col: '#a78bfa', sw: 2.6, dash: '4 4', op: 0.95, label: 'Alterato', node: '#a78bfa', mid: '⟁' },
};

function arrow(px, py, dx, dy) {
  // chevron a (px,py) orientato lungo (dx,dy)
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len; const uy = dy / len;
  const nx = -uy; const ny = ux; const s = 6; const b = 4;
  const l1x = px - ux * s + nx * b; const l1y = py - uy * s + ny * b;
  const l2x = px - ux * s - nx * b; const l2y = py - uy * s - ny * b;
  return `${l1x.toFixed(1)},${l1y.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} ${l2x.toFixed(1)},${l2y.toFixed(1)}`;
}

/**
 * Segmento di collegamento fra due punti dentro un SVG esistente.
 * Usato da CampaignMapShell: <svg>…<EdgePath a={{x,y}} b={{x,y}} state="open" />…</svg>
 */
export function EdgePath({ a, b, state = 'open', note, onSelect }) {
  const s = EDGE_STYLES[state] || EDGE_STYLES.open;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const d = `M${a.x} ${a.y} L ${b.x} ${b.y}`;
  return (
    <g className="ca1-anim">
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: onSelect ? 'pointer' : 'default' }} onClick={onSelect}>
        {note ? <title>{note}</title> : null}
      </path>
      <path d={d} fill="none" stroke={s.col} strokeWidth={s.sw} strokeDasharray={s.dash} strokeLinecap="round" opacity={s.op} vectorEffect="non-scaling-stroke" />
      {s.flow && (
        <path d={d} fill="none" stroke={s.col} strokeWidth={s.sw} strokeDasharray="4 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ animation: 'cq-flow 1s linear infinite' }} />
      )}
      {s.mid && (
        <>
          <circle cx={mx} cy={my} r={9} fill="#0b0a08" stroke={s.col} strokeWidth={1.5} />
          <text x={mx} y={my + 3} textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize={9} fill={s.col}>{s.mid}</text>
        </>
      )}
    </g>
  );
}

/** Componente specimen autonomo (banco di prova / gallery). */
export default function Edge(props) {
  const state = props.state || 'open';
  const curved = !!props.curved;
  const s = EDGE_STYLES[state] || EDGE_STYLES.open;
  const A = { x: 16, y: 46 };
  const B = { x: 104, y: 18 };
  const mx = (A.x + B.x) / 2 + (curved ? 4 : 0);
  const my = (A.y + B.y) / 2 + (curved ? 14 : 0);
  const d = curved ? `M${A.x} ${A.y} Q ${mx} ${my + 6} ${B.x} ${B.y}` : `M${A.x} ${A.y} L ${B.x} ${B.y}`;
  const dxB = B.x - mx; const dyB = B.y - my; const dxA = A.x - mx; const dyA = A.y - my;

  return (
    <div className="ca1-anim" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)' }}>
      <svg viewBox="0 0 120 64" width={props.w || 132} height={props.h || 84} style={{ overflow: 'visible' }}>
        <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }} onClick={props.onSelect} />
        <path d={d} fill="none" stroke={s.col} strokeWidth={s.sw} strokeDasharray={s.dash} strokeLinecap="round" opacity={s.op} vectorEffect="non-scaling-stroke" />
        {s.flow && (
          <path d={d} fill="none" stroke={s.col} strokeWidth={s.sw} strokeDasharray="4 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ animation: 'cq-flow 1s linear infinite' }} />
        )}
        {!!props.bidir && (
          <>
            <polyline points={arrow(B.x, B.y, dxB, dyB)} fill="none" stroke={s.col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={s.op} />
            <polyline points={arrow(A.x, A.y, dxA, dyA)} fill="none" stroke={s.col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={s.op} />
          </>
        )}
        {s.mid && (
          <>
            <circle cx={mx} cy={my} r={9} fill="#0b0a08" stroke={s.col} strokeWidth={1.5} />
            <text x={mx} y={my + 3} textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize={9} fill={s.col}>{s.mid}</text>
          </>
        )}
        <circle cx={16} cy={46} r={4.5} fill="#0e0e0f" stroke={s.node} strokeWidth={1.6} opacity={s.op} />
        <circle cx={104} cy={18} r={4.5} fill="#0e0e0f" stroke={s.node} strokeWidth={1.6} opacity={s.op} />
      </svg>
      {props.showLabel !== false && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: s.col }}>{s.label}</div>
          {!!props.note && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--fg3)', marginTop: 1 }}>{props.note}</div>}
        </div>
      )}
    </div>
  );
}
