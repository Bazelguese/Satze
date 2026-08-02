// Galleria agenti — griglia consultabile con layout ufficiale CardReworkP4 (sashNameHud).

import React, { useState, useMemo, useEffect } from 'react';
import { ARMY_COLORS } from '../../../data/armies.js';
import { ALL_AGENTS } from '../../../data/cards.js';
import { getCardDisplayLabels } from '../../../data/cardArchetypes.js';
import { CardReworkP4, CardReworkP4Scaled } from '../../cards/CardReworkP4.jsx';
import { CardTagsRow } from '../../cards/CardTagBadges.jsx';
import GalleryTabSwitcher from './GalleryTabSwitcher.jsx';

const DEFAULT_GALLERY_ARMY = "Figli dell'Orizzonte";
const TILE_WIDTH = 210;
const GRID_COLUMNS = 6;
const GRID_GAP_X = 32;
const GRID_GAP_Y = 52;
const CARD_NATIVE_W = 230;
const CARD_NATIVE_H = 330;
const LIGHTBOX_SCALE = 1.35;
const LIGHTBOX_CARD_W = Math.round(CARD_NATIVE_W * LIGHTBOX_SCALE);
const LIGHTBOX_CARD_H = Math.round(CARD_NATIVE_H * LIGHTBOX_SCALE);
const SORTED_AGENTS = [...ALL_AGENTS].sort((a, b) => {
  if (b.league !== a.league) return b.league - a.league;
  return a.id - b.id;
});

function armyList(agents) {
  const seen = [];
  agents.forEach((a) => {
    if (!seen.includes(a.army)) seen.push(a.army);
  });
  return seen;
}

export default function CardGallery({
  onBack,
  totalCards = ALL_AGENTS.length,
  galleryTab,
  onGalleryTabChange,
  agentCount = ALL_AGENTS.length,
  fieldCount,
}) {
  const ARMIES = useMemo(() => armyList(SORTED_AGENTS), []);
  const [filter, setFilter] = useState(DEFAULT_GALLERY_ARMY);
  const [active, setActive] = useState(null);

  const shown = useMemo(
    () => SORTED_AGENTS.filter((a) => a.army === filter),
    [filter],
  );
  const headAccent = (ARMY_COLORS[filter] || {}).accent || '#f5f3eb';

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <div className="cgl" style={{ '--accent': headAccent }}>
      <div className="cgl-bg">
        <div className="cgl-bg-glow" />
        <div className="cgl-stars" />
        <div className="cgl-diag" />
      </div>

      <div className="cgl-shell">
        <header className="cgl-mode-bar">
          <button type="button" className="cgl-back" onClick={onBack}>
            <span className="ar">←</span><span className="lbl">MENU</span>
          </button>
          {onGalleryTabChange && (
            <GalleryTabSwitcher
              activeTab={galleryTab}
              onTabChange={onGalleryTabChange}
              agentCount={agentCount}
              fieldCount={fieldCount}
            />
          )}
          <div className="cgl-counter">
            <div className="ft-lbl">MOSTRATE</div>
            <div className="ft-name">
              {String(shown.length).padStart(2, '0')}<span className="sep">/</span>{totalCards}
            </div>
          </div>
        </header>

        <div className="cgl-head">
          <div className="cgl-eyebrow">ARCHIVIO DI GUERRA</div>
          <h1 className="cgl-title">GALLERIA DELLE CARTE</h1>
        </div>

        <div className="cgl-filters">
          {ARMIES.map((a) => (
            <button
              key={a}
              type="button"
              className={`cgl-chip ${filter === a ? 'on' : ''}`}
              style={{ '--c': (ARMY_COLORS[a] || {}).accent || '#94a3b8' }}
              onClick={() => setFilter(a)}
            >
              <span className="dot" /><span>{a}</span>
            </button>
          ))}
        </div>

        <div className="cgl-grid">
        {shown.map((agent) => (
          <CardTile
            key={agent.id}
            agent={agent}
            accent={(ARMY_COLORS[agent.army] || {}).accent || '#94a3b8'}
            onClick={() => setActive(agent)}
          />
        ))}
        </div>
      </div>

      {active && <Lightbox agent={active} onClose={() => setActive(null)} />}

      <div className="cgl-scanlines" />
      <CardGalleryStyles />
    </div>
  );
}

function CardTile({ agent, accent, onClick }) {
  return (
    <button
      type="button"
      className="cgl-tile"
      style={{ '--accent': accent }}
      onClick={onClick}
      aria-label={agent.name}
    >
      <div className="cgl-tile-card">
        <CardReworkP4Scaled agent={agent} width={TILE_WIDTH} />
      </div>
    </button>
  );
}

function powerDescription(agent) {
  if (!agent?.description) return null;
  return agent.description.replace(/^Potere:\s*/i, '');
}

function Lightbox({ agent, onClose }) {
  const accent = (ARMY_COLORS[agent.army] || {}).accent || '#94a3b8';
  const powerBody = powerDescription(agent);
  const tags = getCardDisplayLabels(agent.id);

  return (
    <div className="cgl-lb" onClick={onClose}>
      <div className="cgl-lb-inner" style={{ '--accent': accent }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cgl-lb-close" onClick={onClose} aria-label="Chiudi">✕</button>

        <div className="cgl-lb-card-wrap">
          <div
            className="cgl-lb-card-scale-host"
            style={{ width: LIGHTBOX_CARD_W, height: LIGHTBOX_CARD_H }}
          >
            <div className="cgl-lb-card-scale">
              <CardReworkP4 agent={agent} showBonus />
            </div>
          </div>
        </div>

        <div className="cgl-lb-details">
          {powerBody && (
            <p className="cgl-lb-power">
              <span className="cgl-lb-power-label">Potere: </span>
              {powerBody}
            </p>
          )}

          {tags.length > 0 && (
            <div className="cgl-lb-tags">
              <CardTagsRow cardId={agent.id} compact={false} splitRoleRows />
            </div>
          )}

          {agent.flavour && (
            <p className="cgl-lb-flavour">&ldquo;{agent.flavour}&rdquo;</p>
          )}
        </div>

        <p className="cgl-lb-hint">Clicca fuori o premi Esc per chiudere</p>
      </div>
    </div>
  );
}

function CardGalleryStyles() {
  return (
    <style>{`
      .cgl {
        position: fixed; inset: 0;
        background: #050608; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden; isolation: isolate; z-index: 1000;
        display: flex; flex-direction: column;
      }
      .cgl * { box-sizing: border-box; }
      .cgl-shell {
        position: relative; z-index: 4;
        display: flex; flex-direction: column;
        flex: 1; min-height: 0; overflow: hidden;
      }

      .cgl-bg { position: absolute; inset: 0; z-index: 0; }
      .cgl-bg-glow {
        position: absolute; inset: 0;
        background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 10%, #16161a) 0%, #0b0b0c 62%);
        transition: background .5s;
      }
      .cgl-stars {
        position: absolute; inset: 0; opacity: 0.4;
        background-image:
          radial-gradient(1px 1px at 18% 22%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 64% 14%, rgba(255,255,255,0.6), transparent 100%),
          radial-gradient(1.5px 1.5px at 88% 38%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 12% 78%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 92%, rgba(255,255,255,0.7), transparent 100%);
      }
      .cgl-diag {
        position: absolute; inset: 0; opacity: 0.035;
        background-image: repeating-linear-gradient(115deg, var(--accent) 0 1px, transparent 1px 22px);
        pointer-events: none;
      }

      .cgl-mode-bar {
        flex: none; z-index: 12;
        padding: 14px 48px 0;
        display: grid; grid-template-columns: 180px 1fr 180px; align-items: center; gap: 16px;
      }
      .cgl-mode-bar .gallery-mode-switch { justify-self: center; }
      .cgl-head {
        flex: none; z-index: 10;
        text-align: center; padding: 8px 48px 4px; pointer-events: none;
      }
      .cgl-back {
        display: inline-flex; align-items: center; gap: 10px; justify-self: start;
        background: rgba(5,6,8,0.65); border: 1.5px solid rgba(245,243,236,0.3);
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
        padding: 11px 18px; cursor: pointer; transition: all .2s;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .cgl-back:hover { border-color: var(--accent); color: var(--accent); }
      .cgl-back .ar { font-size: 15px; }
      .cgl-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.38em; color: var(--accent); transition: color .3s; }
      .cgl-title {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 28px; letter-spacing: 0.2em;
        margin: 6px 0 0; text-shadow: 0 4px 24px rgba(0,0,0,0.9);
      }
      .cgl-counter { text-align: right; justify-self: end; }
      .cgl-counter .ft-lbl { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.28em; color: #94a3b8; }
      .cgl-counter .ft-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 18px; letter-spacing: 0.08em; color: var(--accent); margin-top: 2px; }
      .cgl-counter .ft-name .sep { color: rgba(255,255,255,0.3); margin: 0 4px; font-weight: 400; }

      .cgl-filters {
        flex: none; z-index: 9;
        display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
        padding: 10px 60px 12px;
      }
      .cgl-chip {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.75); font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        padding: 8px 14px; cursor: pointer; transition: all .18s;
      }
      .cgl-chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 8px var(--c); flex: none; }
      .cgl-chip:hover { border-color: var(--c); color: #f5f3eb; }
      .cgl-chip.on { border-color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); box-shadow: 0 0 14px color-mix(in srgb, var(--c) 30%, transparent); }

      .cgl-grid {
        position: relative; flex: 1; min-height: 0; z-index: 4;
        display: grid;
        grid-template-columns: repeat(${GRID_COLUMNS}, ${TILE_WIDTH}px);
        grid-auto-rows: auto;
        column-gap: ${GRID_GAP_X}px;
        row-gap: ${GRID_GAP_Y}px;
        justify-content: center; align-content: start;
        overflow-y: auto; overflow-x: hidden;
        padding: 16px 32px 36px;
        scrollbar-gutter: stable;
      }

      .cgl-tile {
        background: none; border: none; padding: 12px 6px 8px;
        cursor: pointer; display: flex; flex-direction: column; align-items: center;
        position: relative; z-index: 1;
        transition: transform .2s ease, z-index 0s;
      }
      .cgl-tile:hover {
        z-index: 5;
        transform: translateY(-6px);
      }
      .cgl-tile-card {
        border-radius: 0 0 14px 14px;
        transition: box-shadow .2s ease, filter .2s ease;
      }
      .cgl-tile:hover .cgl-tile-card {
        filter: drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 55%, transparent));
      }

      .cgl-lb {
        position: absolute; inset: 0; z-index: 100;
        background: rgba(3,4,6,0.9); backdrop-filter: blur(8px);
        display: flex; align-items: flex-start; justify-content: center;
        animation: cgl-lb-in .2s ease;
        overflow-y: auto; padding: 40px 32px 56px;
      }
      @keyframes cgl-lb-in { from { opacity: 0; } }
      .cgl-lb-inner {
        position: relative;
        width: min(92vw, 960px);
        margin: auto 0;
        display: flex; flex-direction: column; align-items: stretch;
        gap: 40px;
      }
      .cgl-lb-close {
        position: absolute; top: 0; right: 0; z-index: 2;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.3);
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace; font-size: 14px;
        width: 40px; height: 40px; cursor: pointer; transition: all .2s;
      }
      .cgl-lb-close:hover { border-color: var(--accent); color: var(--accent); }
      .cgl-lb-card-wrap {
        display: flex; justify-content: center;
        padding-top: 12px;
        margin: 0;
      }
      .cgl-lb-card-scale-host {
        position: relative; flex: none; overflow: visible;
      }
      .cgl-lb-card-scale {
        position: absolute; top: 0; left: 0;
        width: ${CARD_NATIVE_W}px; height: ${CARD_NATIVE_H}px;
        transform: scale(${LIGHTBOX_SCALE});
        transform-origin: top left;
        filter: drop-shadow(0 0 48px color-mix(in srgb, var(--accent) 38%, transparent));
      }
      .cgl-lb-details {
        max-width: 720px; width: 100%; margin: 0 auto;
        padding: 32px 28px 36px;
        background: rgba(0,0,0,0.52);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(6px);
        display: flex; flex-direction: column; gap: 28px;
      }
      .cgl-lb-power {
        margin: 0;
        color: #f8fafc; font-size: 16px; line-height: 1.6;
      }
      .cgl-lb-power-label {
        color: #fbbf24; font-weight: 800; letter-spacing: 0.04em;
      }
      .cgl-lb-tags { margin: 0; }
      .cgl-lb-flavour {
        margin: 0; padding-top: 28px;
        border-top: 1px solid rgba(255,255,255,0.12);
        color: rgba(203,213,225,0.92); font-size: 14px; line-height: 1.65;
        font-style: italic; text-align: left;
      }
      .cgl-lb-hint {
        margin: 0; text-align: center;
        font-family: 'Share Tech Mono', monospace; font-size: 10px;
        letter-spacing: 0.12em; color: rgba(148,163,184,0.85); text-transform: uppercase;
      }

      @media (prefers-reduced-motion: reduce) {
        .cgl *, .cgl *::after, .cgl *::before { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
        .cgl-tile:hover { transform: none; }
      }
    `}</style>
  );
}
