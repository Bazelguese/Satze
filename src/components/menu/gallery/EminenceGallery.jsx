// Galleria Eminenze — griglia consultabile con cornice Arena (EminenceTarotCard).

import React, { useEffect, useMemo, useState } from 'react';
import { ARMY_COLORS } from '../../../data/armies.js';
import { EMINENCES, EMINENCE_IDS_BY_ARMY_ORDER } from '../../../data/eminences.js';
import { getEminenceArtUrl } from '../../../data/eminenceArt.js';
import { getEminenceArtFrame } from '../../../data/eminenceArtFrames.js';
import { EminenceTarotCard } from '../../eminenceLab/EminenceTarotCard.jsx';
import GalleryTabSwitcher from './GalleryTabSwitcher.jsx';
import '../../eminenceLab/eminenceArtLab.css';

const TILE_WIDTH = 168;
const CARD_NATIVE_W = 340;
const CARD_NATIVE_H = 588;
const TILE_SCALE = TILE_WIDTH / CARD_NATIVE_W;
const TILE_PAD_X = 22;
const TILE_PAD_Y = 18;
const GRID_COLUMNS = 4;
const GRID_GAP_X = 28;
const GRID_GAP_Y = 36;
const GRID_COL_WIDTH = TILE_WIDTH + TILE_PAD_X * 2;
const LIGHTBOX_SCALE = 0.92;
const LIGHTBOX_CARD_W = Math.round(CARD_NATIVE_W * LIGHTBOX_SCALE);
const LIGHTBOX_CARD_H = Math.round(CARD_NATIVE_H * LIGHTBOX_SCALE);

const ALL_EMINENCES = EMINENCE_IDS_BY_ARMY_ORDER.map((id) => EMINENCES[id]);

function armyList(items) {
  const seen = [];
  items.forEach((e) => {
    if (!seen.includes(e.army)) seen.push(e.army);
  });
  return seen;
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export default function EminenceGallery({
  onBack,
  totalCards = ALL_EMINENCES.length,
  galleryTab,
  onGalleryTabChange,
  agentCount,
  fieldCount,
  eminenceCount = ALL_EMINENCES.length,
}) {
  const ARMIES = useMemo(() => armyList(ALL_EMINENCES), []);
  const [filter, setFilter] = useState("Figli dell'Orizzonte");
  const [active, setActive] = useState(null);

  const shown = useMemo(
    () => ALL_EMINENCES.filter((e) => e.army === filter),
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
    <div className="egl" style={{ '--accent': headAccent }}>
      <div className="egl-bg">
        <div className="egl-bg-glow" />
        <div className="egl-stars" />
        <div className="egl-diag" />
      </div>

      <div className="egl-shell">
        <header className="egl-mode-bar">
          <button type="button" className="egl-back" onClick={onBack}>
            <span className="ar">←</span>
            <span className="lbl">MENU</span>
          </button>
          {onGalleryTabChange && (
            <GalleryTabSwitcher
              activeTab={galleryTab}
              onTabChange={onGalleryTabChange}
              agentCount={agentCount}
              fieldCount={fieldCount}
              eminenceCount={eminenceCount}
            />
          )}
          <div className="egl-counter">
            <div className="ft-lbl">MOSTRATE</div>
            <div className="ft-name">
              {String(shown.length).padStart(2, '0')}
              <span className="sep">/</span>
              {totalCards}
            </div>
          </div>
        </header>

        <div className="egl-head">
          <div className="egl-eyebrow">ARCHIVIO DI GUERRA</div>
          <h1 className="egl-title">GALLERIA DELLE EMINENZE</h1>
        </div>

        <div className="egl-filters">
          {ARMIES.map((a) => (
            <button
              key={a}
              type="button"
              className={`egl-chip ${filter === a ? 'on' : ''}`}
              style={{ '--c': (ARMY_COLORS[a] || {}).accent || '#94a3b8' }}
              onClick={() => setFilter(a)}
            >
              <span className="dot" />
              <span>{a}</span>
            </button>
          ))}
        </div>

        <div className="egl-grid">
          {ALL_EMINENCES.map((eminence) => (
            <EminenceTile
              key={eminence.id}
              eminence={eminence}
              accent={(ARMY_COLORS[eminence.army] || {}).accent || '#94a3b8'}
              hidden={eminence.army !== filter}
              onClick={() => setActive(eminence)}
            />
          ))}
        </div>
      </div>

      {active && <Lightbox eminence={active} onClose={() => setActive(null)} />}

      <div className="egl-scanlines" />
      <EminenceGalleryStyles />
    </div>
  );
}

function EminenceTile({ eminence, accent, hidden, onClick }) {
  const artUrl = getEminenceArtUrl(eminence);
  const frame = getEminenceArtFrame(eminence.id);
  const staticText = eminence.static?.name || eminence.static?.text || '';

  return (
    <button
      type="button"
      className={`egl-tile${hidden ? ' egl-tile--hidden' : ''}`}
      style={{ '--accent': accent }}
      onClick={onClick}
      aria-label={eminence.name}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : 0}
    >
      <div
        className="egl-tile-scale"
        style={{
          width: TILE_WIDTH,
          height: Math.round(CARD_NATIVE_H * TILE_SCALE),
        }}
      >
        <div
          className="egl-tile-card"
          style={{
            width: CARD_NATIVE_W,
            height: CARD_NATIVE_H,
            transform: `scale(${TILE_SCALE})`,
          }}
        >
          <EminenceTarotCard
            name={eminence.name}
            army={eminence.army}
            staticText={staticText}
            presence={eminence.initialPresence ?? 0}
            artUrl={artUrl}
            accent={accent}
            life="arena"
            intensity={1}
            tiltEnabled={!hidden}
            artX={frame.artX}
            artY={frame.artY}
            artZoom={frame.zoom}
            artFocusX={frame.focusX}
            artFocusY={frame.focusY}
          />
        </div>
      </div>
    </button>
  );
}

function Lightbox({ eminence, onClose }) {
  const accent = (ARMY_COLORS[eminence.army] || {}).accent || '#94a3b8';
  const artUrl = getEminenceArtUrl(eminence);
  const frame = getEminenceArtFrame(eminence.id);
  const staticText = eminence.static?.text || eminence.static?.name || '';

  return (
    <div className="egl-lb" onClick={onClose}>
      <div className="egl-lb-inner" style={{ '--accent': accent }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="egl-lb-close" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>

        <div className="egl-lb-card-wrap">
          <div
            className="egl-lb-card-scale"
            style={{ width: LIGHTBOX_CARD_W, height: LIGHTBOX_CARD_H }}
          >
            <div
              style={{
                width: CARD_NATIVE_W,
                height: CARD_NATIVE_H,
                transform: `scale(${LIGHTBOX_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <EminenceTarotCard
                name={eminence.name}
                army={eminence.army}
                staticText={eminence.static?.name || ''}
                presence={eminence.initialPresence ?? 0}
                artUrl={artUrl}
                accent={accent}
                life="arena"
                intensity={1.05}
                tiltEnabled
                artX={frame.artX}
                artY={frame.artY}
                artZoom={frame.zoom}
                artFocusX={frame.focusX}
                artFocusY={frame.focusY}
              />
            </div>
          </div>
        </div>

        <div className="egl-lb-details">
          <div className="egl-lb-meta">
            <span className="egl-lb-badge">Eminenza</span>
            {eminence.nameProvisional ? (
              <span className="egl-lb-badge egl-lb-badge--warn">Nome provvisorio</span>
            ) : null}
            {!eminence.implemented ? (
              <span className="egl-lb-badge egl-lb-badge--mute">Dati galleria · effetti in corso</span>
            ) : (
              <span className="egl-lb-badge egl-lb-badge--ok">Giocabile</span>
            )}
            <span className="egl-lb-presence">
              Presenza iniziale <strong>{eminence.initialPresence ?? 0}</strong>
              {eminence.initialPresenceProvisional ? ' (provvisoria)' : ''}
            </span>
          </div>

          {staticText ? (
            <p className="egl-lb-static">
              <span className="egl-lb-label">
                Statico{eminence.static?.name ? ` — ${eminence.static.name}` : ''}:{' '}
              </span>
              {staticText}
            </p>
          ) : (
            <p className="egl-lb-static egl-lb-static--empty">Nessuno statico.</p>
          )}

          <ul className="egl-lb-abilities">
            {eminence.abilities.map((ability) => (
              <li key={ability.id}>
                <span className="egl-lb-cost">{formatDelta(ability.presenceDelta)}</span>
                <div>
                  <div className="egl-lb-ability-name">
                    {ability.name || ability.id}
                    {ability.nameProvisional ? ' · nome provvisorio' : ''}
                  </div>
                  <p className="egl-lb-ability-text">{ability.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="egl-lb-hint">Clicca fuori o premi Esc per chiudere</p>
      </div>
    </div>
  );
}

function EminenceGalleryStyles() {
  return (
    <style>{`
      .egl {
        position: absolute; inset: 0;
        background: #050608; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden; isolation: isolate; z-index: 2;
        display: flex; flex-direction: column;
      }
      .egl * { box-sizing: border-box; }
      .egl-shell {
        position: relative; z-index: 4;
        display: flex; flex-direction: column;
        flex: 1; min-height: 0; overflow: hidden;
      }
      .egl-bg { position: absolute; inset: 0; z-index: 0; }
      .egl-bg-glow {
        position: absolute; inset: 0;
        background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 10%, #16161a) 0%, #0b0b0c 62%);
        transition: background .5s;
      }
      .egl-stars {
        position: absolute; inset: 0; opacity: 0.4;
        background-image:
          radial-gradient(1px 1px at 18% 22%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 64% 14%, rgba(255,255,255,0.6), transparent 100%),
          radial-gradient(1.5px 1.5px at 88% 38%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 12% 78%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 92%, rgba(255,255,255,0.7), transparent 100%);
      }
      .egl-diag {
        position: absolute; inset: 0; opacity: 0.035;
        background-image: repeating-linear-gradient(115deg, var(--accent) 0 1px, transparent 1px 22px);
        pointer-events: none;
      }
      .egl-scanlines {
        position: absolute; inset: 0; z-index: 3; pointer-events: none;
        background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.035) 2px 3px);
        opacity: 0.35;
      }

      .egl-mode-bar {
        flex: none; z-index: 12;
        padding: 14px 48px 0;
        display: grid; grid-template-columns: 180px 1fr 180px; align-items: center; gap: 16px;
      }
      .egl-mode-bar .gallery-mode-switch { justify-self: center; }
      .egl-head {
        flex: none; z-index: 10;
        text-align: center; padding: 8px 48px 4px; pointer-events: none;
      }
      .egl-back {
        display: inline-flex; align-items: center; gap: 10px; justify-self: start;
        background: rgba(5,6,8,0.65); border: 1.5px solid rgba(245,243,236,0.3);
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
        padding: 11px 18px; cursor: pointer; transition: all .2s;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .egl-back:hover { border-color: var(--accent); color: var(--accent); }
      .egl-back .ar { font-size: 15px; }
      .egl-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.38em; color: var(--accent); }
      .egl-title {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 28px; letter-spacing: 0.2em;
        margin: 6px 0 0; text-shadow: 0 4px 24px rgba(0,0,0,0.9);
      }
      .egl-counter { text-align: right; justify-self: end; }
      .egl-counter .ft-lbl { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.28em; color: #94a3b8; }
      .egl-counter .ft-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 18px; letter-spacing: 0.08em; color: var(--accent); margin-top: 2px; }
      .egl-counter .ft-name .sep { color: rgba(255,255,255,0.3); margin: 0 4px; font-weight: 400; }

      .egl-filters {
        flex: none; z-index: 9;
        display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
        padding: 10px 60px 12px;
      }
      .egl-chip {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.75); font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        padding: 8px 14px; cursor: pointer; transition: all .18s;
      }
      .egl-chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 8px var(--c); flex: none; }
      .egl-chip:hover { border-color: var(--c); color: #f5f3eb; }
      .egl-chip.on { border-color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); box-shadow: 0 0 14px color-mix(in srgb, var(--c) 30%, transparent); }

      .egl-grid {
        position: relative; flex: 1; min-height: 0; z-index: 4;
        display: grid;
        grid-template-columns: repeat(${GRID_COLUMNS}, ${GRID_COL_WIDTH}px);
        grid-auto-rows: auto;
        column-gap: ${GRID_GAP_X}px;
        row-gap: ${GRID_GAP_Y}px;
        justify-content: center; align-content: start;
        overflow-y: auto; overflow-x: hidden;
        padding: 20px 40px 40px;
        scrollbar-gutter: stable;
      }

      .egl-tile {
        background: none; border: none;
        padding: ${TILE_PAD_Y}px ${TILE_PAD_X}px;
        cursor: pointer; display: flex; flex-direction: column; align-items: center;
        position: relative; z-index: 1;
        overflow: visible;
        -webkit-tap-highlight-color: transparent;
      }
      .egl-tile--hidden { display: none; }
      .egl-tile:hover, .egl-tile:focus-visible { z-index: 5; }
      .egl-tile-scale { position: relative; overflow: visible; }
      .egl-tile-card {
        position: absolute; top: 0; left: 0;
        transform-origin: top left;
        pointer-events: none;
      }
      .egl-tile-card .eminence-tarot { pointer-events: auto; }

      .egl-lb {
        position: absolute; inset: 0; z-index: 100;
        background: rgba(3,4,6,0.9); backdrop-filter: blur(8px);
        display: flex; align-items: flex-start; justify-content: center;
        animation: egl-lb-in .2s ease;
        overflow-y: auto; padding: 40px 32px 56px;
      }
      @keyframes egl-lb-in { from { opacity: 0; } }
      .egl-lb-inner {
        position: relative;
        width: min(92vw, 980px);
        margin: auto 0;
        display: flex; flex-direction: column; align-items: stretch;
        gap: 36px;
      }
      .egl-lb-close {
        position: absolute; top: 0; right: 0; z-index: 2;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.3);
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace; font-size: 14px;
        width: 40px; height: 40px; cursor: pointer; transition: all .2s;
      }
      .egl-lb-close:hover { border-color: var(--accent); color: var(--accent); }
      .egl-lb-card-wrap {
        display: flex; justify-content: center;
        padding-top: 12px;
      }
      .egl-lb-card-scale { position: relative; flex: none; }
      .egl-lb-details {
        max-width: 760px; width: 100%; margin: 0 auto;
        padding: 28px 28px 32px;
        background: rgba(0,0,0,0.52);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(6px);
        display: flex; flex-direction: column; gap: 22px;
      }
      .egl-lb-meta {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      }
      .egl-lb-badge {
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        padding: 5px 9px;
        border: 1px solid rgba(255,255,255,0.18);
        color: rgba(245,243,236,0.85);
      }
      .egl-lb-badge--warn { border-color: rgba(251,191,36,0.45); color: #fbbf24; }
      .egl-lb-badge--mute { border-color: rgba(148,163,184,0.35); color: #94a3b8; }
      .egl-lb-badge--ok { border-color: color-mix(in srgb, var(--accent) 55%, transparent); color: var(--accent); }
      .egl-lb-presence {
        margin-left: auto;
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.08em; color: #cbd5e1;
      }
      .egl-lb-presence strong { color: var(--accent); font-size: 14px; }
      .egl-lb-static {
        margin: 0; color: #f8fafc; font-size: 15px; line-height: 1.55;
      }
      .egl-lb-static--empty { color: #94a3b8; font-style: italic; }
      .egl-lb-label { color: #fbbf24; font-weight: 800; letter-spacing: 0.04em; }
      .egl-lb-abilities {
        list-style: none; margin: 0; padding: 0;
        display: flex; flex-direction: column; gap: 14px;
      }
      .egl-lb-abilities li {
        display: grid; grid-template-columns: 52px 1fr; gap: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .egl-lb-cost {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 18px;
        color: var(--accent); text-align: center; padding-top: 2px;
      }
      .egl-lb-ability-name {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px;
        letter-spacing: 0.06em; color: #f5f3eb; margin-bottom: 4px;
      }
      .egl-lb-ability-text {
        margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.55;
      }
      .egl-lb-hint {
        margin: 0; text-align: center;
        font-family: 'Share Tech Mono', monospace; font-size: 10px;
        letter-spacing: 0.12em; color: rgba(148,163,184,0.85); text-transform: uppercase;
      }

      @media (prefers-reduced-motion: reduce) {
        .egl *, .egl *::after, .egl *::before { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}
