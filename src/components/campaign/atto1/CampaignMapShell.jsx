/**
 * CampaignMapShell — schermata completa della Campagna Atto I:
 * HUD superiore, fondale planetario, nodi + slot Faglia, collegamenti SVG,
 * pannello missione laterale, legenda, pan e zoom.
 * Conversione React di `campaign-map/CampaignMapShell.dc.html` (pacchetto 2).
 *
 * Le demo hardcoded del specimen sono state rimosse: topologia e stato
 * arrivano dalle props (coordinate normalizzate {id,x,y} + lista di coppie).
 *
 * Props principali:
 * - hud: props per <HudBar /> (senza compact, gestito qui)
 * - positions: [{ id, x, y }] con x/y normalizzati 0..1
 * - links: [[idA, idB], …]
 * - nodes: { [id]: { kind:'node'|'rift'|'riftSlot', …props MapNode/Rift } }
 * - selectedId, onSelectNode(id)
 * - panel: props per <MissionPanel /> oppure null
 * - tools: [{ glyph, label, tip, onClick }]
 * - logText, compact, showPanel
 */

import React, { useRef, useState, useCallback } from 'react';
import HudBar from './HudBar.jsx';
import MapNode from './MapNode.jsx';
import Rift from './Rift.jsx';
import MissionPanel from './MissionPanel.jsx';

const W = 1000;
const H = 620;

// Stili archi per stato (dal specimen): [colore, spessore, tratteggio, opacità]
const EDGE_COLORS = {
  controlled: ['#58d9dc', 2.4, 'none', 1],
  available: ['#cfccc2', 1.8, 'none', 0.85],
  selected: ['#f5f3ec', 2.6, 'none', 1],
  threatened: ['#c2473f', 2.2, 'none', 0.95],
  occupied: ['#c2473f', 1.8, '5 5', 0.8],
  blocked: ['#c9a23e', 1.8, '5 5', 0.8],
  completed: ['#4a9e78', 2, 'none', 0.85],
  locked: ['#4a4a50', 1.4, '3 4', 0.55],
  hidden: ['#3a3a40', 1.2, '1 5', 0.32],
};

const EDGE_RANK = ['hidden', 'locked', 'occupied', 'blocked', 'available', 'completed', 'threatened', 'controlled', 'selected'];

const LEGEND = [
  { col: '#58d9dc', label: 'Controllato' },
  { col: '#cfccc2', label: 'Disponibile' },
  { col: '#c2473f', label: 'Minacciato · occupato' },
  { col: '#c9a23e', label: 'Sospeso' },
  { col: '#a78bfa', label: 'Faglia' },
  { col: '#4a4a50', label: 'Non scoperto' },
];

const ctrlBtn = {
  fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--fg1)',
  background: 'rgba(10,9,8,.86)', border: '1px solid rgba(201,162,62,.3)', cursor: 'pointer',
};

export default function CampaignMapShell(props) {
  const {
    hud = {}, positions = [], links = [], nodes = {},
    selectedId = null, onSelectNode,
    panel = null, tools = [], logText = '',
    compact = false, showPanel = true,
  } = props;

  const [view, setView] = useState({ zoom: 1, tx: 0, ty: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  const clampZoom = (z) => Math.max(0.6, Math.min(2.2, z));
  const zoomIn = useCallback(() => setView((v) => ({ ...v, zoom: clampZoom(v.zoom + 0.2) })), []);
  const zoomOut = useCallback(() => setView((v) => ({ ...v, zoom: clampZoom(v.zoom - 0.2) })), []);
  const resetView = useCallback(() => setView({ zoom: 1, tx: 0, ty: 0 }), []);
  const onWheel = useCallback((e) => {
    setView((v) => ({ ...v, zoom: clampZoom(v.zoom - e.deltaY * 0.0012) }));
  }, []);
  const onDown = useCallback((e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    setDragging(true);
  }, [view.tx, view.ty]);
  const onMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setView((v) => ({ ...v, tx: drag.tx + (e.clientX - drag.x), ty: drag.ty + (e.clientY - drag.y) }));
  }, []);
  const onUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const byId = {};
  positions.forEach((q) => { byId[q.id] = q; });

  const stateOf = (id) => nodes[id]?.state || 'hidden';

  const edges = links
    .filter(([a, b]) => byId[a] && byId[b])
    .map(([a, b]) => {
      const A = byId[a]; const B = byId[b];
      const sa = stateOf(a); const sb = stateOf(b);
      // Lo stato dell'arco è derivato dal più debole dei due nodi collegati
      const st = EDGE_RANK.indexOf(sa) < EDGE_RANK.indexOf(sb) ? sa : sb;
      const isSel = a === selectedId || b === selectedId;
      const [col, w, dash, op] = EDGE_COLORS[isSel ? 'selected' : st] || EDGE_COLORS.hidden;
      const x1 = A.x * W; const y1 = A.y * H; const x2 = B.x * W; const y2 = B.y * H;
      const cx = (x1 + x2) / 2 + (y2 - y1) * 0.12;
      const cy = (y1 + y2) / 2 - (x2 - x1) * 0.12;
      return { key: `${a}-${b}`, d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, col, w, dash, op };
    });

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', background: 'var(--bg-night)', fontFamily: 'var(--font-ui)', color: 'var(--fg1)', overflow: 'hidden' }}>
      {/* HUD */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px 8px', borderBottom: '1px solid rgba(201,162,62,.18)', overflowX: 'auto' }}>
        <HudBar compact={compact} {...hud} />
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Viewport della mappa */}
        <div
          onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', background: 'radial-gradient(ellipse 70% 55% at 50% 42%,#151d2b,#0a0c12 62%,#070709 100%)' }}
        >
          {/* Stelle */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(1px 1px at 12% 22%,rgba(245,243,236,.5),transparent),radial-gradient(1px 1px at 78% 14%,rgba(245,243,236,.35),transparent),radial-gradient(1px 1px at 34% 72%,rgba(245,243,236,.4),transparent),radial-gradient(1px 1px at 62% 58%,rgba(245,243,236,.3),transparent),radial-gradient(1px 1px at 88% 78%,rgba(245,243,236,.32),transparent),radial-gradient(1px 1px at 22% 88%,rgba(245,243,236,.28),transparent)' }} />
          {/* Pianeta */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 'min(64vh,720px)', height: 'min(64vh,720px)', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%,#232d45,#131a28 46%,#0a0d14 72%,transparent 76%)', boxShadow: 'inset -30px -20px 90px rgba(0,0,0,.75),0 0 90px rgba(43,92,255,.08)', opacity: 0.75 }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 'min(64vh,720px)', height: 'min(64vh,720px)', transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1px solid rgba(201,162,62,.1)' }} />

          {/* Stage con pan/zoom */}
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', willChange: 'transform', transform: `translate(${view.tx}px,${view.ty}px) scale(${view.zoom})` }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
              {edges.map((e) => (
                <path key={e.key} d={e.d} fill="none" stroke={e.col} strokeWidth={e.w} strokeDasharray={e.dash} strokeLinecap="round" opacity={e.op} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>

            {positions.map((q) => {
              const n = nodes[q.id];
              if (!n) return null;
              const clickable = !!onSelectNode && n.kind !== 'riftSlot' && !['hidden'].includes(n.state);
              return (
                <div
                  key={q.id}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? (e) => { e.stopPropagation(); onSelectNode(q.id); } : undefined}
                  onKeyDown={clickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectNode(q.id); }
                  } : undefined}
                  onMouseDown={clickable ? (e) => e.stopPropagation() : undefined}
                  style={{ position: 'absolute', left: `${(q.x * 100).toFixed(2)}%`, top: `${(q.y * 100).toFixed(2)}%`, transform: 'translate(-50%,-50%)', cursor: clickable ? 'pointer' : undefined }}
                >
                  {n.kind === 'rift'
                    ? <Rift variant="map" type={n.riftType} state={n.state} army={n.army} title={n.title} days={n.days} />
                    : n.kind === 'riftSlot'
                      ? <MapNode type="riftSlot" state="hidden" showLabel={false} compact={compact} />
                      : (
                        <MapNode
                          type={n.type} state={selectedId === q.id ? 'selected' : n.state}
                          title={n.title} subtitle={n.subtitle}
                          difficulty={n.difficulty} days={n.days} mode={n.mode}
                          mission={n.mission} mainPath={n.mainPath} optional={n.optional}
                          compact={compact} selected={selectedId === q.id}
                        />
                      )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'flex', flexDirection: 'column', gap: 7, padding: '11px 13px', background: 'rgba(10,9,8,.86)', border: '1px solid rgba(201,162,62,.3)', backdropFilter: 'blur(3px)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: '#c9a23e' }}>Legenda</span>
            {LEGEND.map((l) => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, flex: 'none', background: l.col, transform: 'rotate(45deg)' }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--fg2)', whiteSpace: 'nowrap' }}>{l.label}</span>
              </span>
            ))}
          </div>

          {/* Controlli zoom */}
          <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', gap: 7 }}>
            <button type="button" onClick={zoomOut} title="Riduci lo zoom" className="ca1-focus-cyan" style={{ ...ctrlBtn, width: 32, height: 32 }}>−</button>
            <button type="button" onClick={zoomIn} title="Aumenta lo zoom" className="ca1-focus-cyan" style={{ ...ctrlBtn, width: 32, height: 32 }}>+</button>
            <button type="button" onClick={resetView} title="Reimposta la vista" className="ca1-focus-cyan" style={{ ...ctrlBtn, height: 32, padding: '0 11px', fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Centra</button>
          </div>

          {/* Strumenti */}
          <div style={{ position: 'absolute', right: 14, top: 14, display: 'flex', gap: 8 }}>
            {tools.map((t) => (
              <button
                key={t.label} type="button" onClick={t.onClick} title={t.tip} className="ca1-focus-cyan"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', fontFamily: 'var(--font-ui)', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fg1)', background: 'rgba(10,9,8,.86)', border: '1px solid rgba(201,162,62,.3)', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 13, color: '#c9a23e' }}>{t.glyph}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Etichetta vista */}
          <div style={{ position: 'absolute', left: 14, top: 14, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--fg3)', background: 'rgba(10,9,8,.7)', padding: '5px 9px', border: '1px solid rgba(201,162,62,.18)' }}>
            {props.viewLabel || `zoom ${Math.round(view.zoom * 100)}%`}
          </div>
        </div>

        {/* Pannello missione */}
        {showPanel && !!panel && (
          <div style={{ flex: 'none', width: 396, padding: 14, boxSizing: 'border-box', borderLeft: '1px solid rgba(201,162,62,.18)', background: 'linear-gradient(180deg,#0d0c10,#08070a)', overflowY: 'auto' }}>
            <MissionPanel width={368} {...panel} />
            <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent-light-dim)', minHeight: 15 }}>
              {logText || 'Trascina per spostare · rotella o +/− per lo zoom.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
