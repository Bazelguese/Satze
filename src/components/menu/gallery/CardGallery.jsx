// Galleria agenti — griglia consultabile con layout ufficiale CardReworkP4 (sashNameHud).

import React, { useState, useMemo, useEffect } from 'react';
import { ARMY_COLORS } from '../../../data/armies.js';
import { ALL_AGENTS } from '../../../data/cards.js';
import { CONCORDIA_ARMY, CONCORDIA_CARDS } from '../../../campaign/data/concordia.js';
import { firstActCard } from '../../../campaign/data/firstAct.js';
import { getCardDisplayLabels } from '../../../data/cardArchetypes.js';
import { CardReworkP4, CardReworkP4Scaled } from '../../cards/CardReworkP4.jsx';
import { CardPointerTilt, CardPointerTiltStyles } from '../../cards/CardPointerTilt.jsx';
import { CardTagsRow } from '../../cards/CardTagBadges.jsx';
import { preloadCardImagesForAgents } from '../../../data/images.js';
import { getCardSprite } from '../../../utils/cardUtils.js';
import { useCosmicHeavyContentReady } from '../../cosmic/ScreenTransition.jsx';
import { EldritchCardFace, ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from '../../cards/EldritchCardFace.jsx';
import { useEldritchFacePreference } from '../../../hooks/useEldritchFacePreference.js';
import GalleryTabSwitcher from './GalleryTabSwitcher.jsx';

const DEFAULT_GALLERY_ARMY = "Figli dell'Orizzonte";
/** Armate solo campagna / non selezionabili nel deckbuilder. */
export const ENEMY_GALLERY_ARMIES = [CONCORDIA_ARMY];
/** Stessa larghezza nativa di CardReworkP4 — evita soft-downscale CSS sulla griglia. */
const TILE_WIDTH = 230;
const CARD_NATIVE_W = 230;
const CARD_NATIVE_H = 330;
/** Padding griglia (solo respiro visivo — niente tilt sulle tile). */
const TILE_PAD_X = 16;
const TILE_PAD_Y = 12;
const GRID_COLUMNS = 4;
const GRID_GAP_X = 36;
const GRID_GAP_Y = 40;
const GRID_COL_WIDTH = TILE_WIDTH + TILE_PAD_X * 2;
const LIGHTBOX_SCALE = 1.35;
const LIGHTBOX_CARD_W = Math.round(CARD_NATIVE_W * LIGHTBOX_SCALE);
const LIGHTBOX_CARD_H = Math.round(CARD_NATIVE_H * LIGHTBOX_SCALE);
/** Eldritch lightbox: stessa larghezza P4 lightbox; altezza = cornice. */
const LIGHTBOX_ELD_W = LIGHTBOX_CARD_W;
const LIGHTBOX_ELD_H = Math.round((LIGHTBOX_ELD_W * ELDRITCH_FRAME_H) / ELDRITCH_FRAME_W);
/** Zona tilt solo in lightbox (dopo click): cursore fuori dalla carta. */
const LIGHTBOX_HIT_PAD_X = 72;
const LIGHTBOX_HIT_PAD_Y = 72;
const GRID_BATCH = 10;

const CONCORDIA_GALLERY_CARDS = CONCORDIA_CARDS.map((c) => firstActCard(c.id)).filter(Boolean);

function sortAgents(agents) {
  return [...agents].sort((a, b) => {
    if (b.league !== a.league) return b.league - a.league;
    return a.id - b.id;
  });
}

const PLAYABLE_AGENTS = sortAgents(ALL_AGENTS);
const ENEMY_AGENTS = sortAgents(CONCORDIA_GALLERY_CARDS);
/** Pool completo galleria (giocabili + armate nemiche di campagna). */
export const GALLERY_AGENTS = [...PLAYABLE_AGENTS, ...ENEMY_AGENTS];
export const GALLERY_AGENT_COUNT = GALLERY_AGENTS.length;

function armyList(agents) {
  const seen = [];
  agents.forEach((a) => {
    if (!seen.includes(a.army)) seen.push(a.army);
  });
  return seen;
}

const PLAYABLE_ARMIES = armyList(PLAYABLE_AGENTS);
const ENEMY_ARMIES = ENEMY_GALLERY_ARMIES.filter((army) =>
  ENEMY_AGENTS.some((a) => a.army === army),
);

function ArmyFilterChips({ armies, filter, onSelect }) {
  return armies.map((a) => (
    <button
      key={a}
      type="button"
      className={`cgl-chip ${filter === a ? 'on' : ''}`}
      style={{ '--c': (ARMY_COLORS[a] || {}).accent || '#94a3b8' }}
      onClick={() => onSelect(a)}
    >
      <span className="dot" /><span>{a}</span>
    </button>
  ));
}

function scheduleIdleWork(fn) {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout: 120 });
  }
  return requestAnimationFrame(() => setTimeout(fn, 0));
}

function cancelIdleWork(id) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id);
  } else {
    cancelAnimationFrame(id);
  }
}

export default function CardGallery({
  onBack,
  totalCards = GALLERY_AGENT_COUNT,
  galleryTab,
  onGalleryTabChange,
  agentCount = GALLERY_AGENT_COUNT,
  fieldCount,
  eminenceCount,
}) {
  const [filter, setFilter] = useState(DEFAULT_GALLERY_ARMY);
  const [active, setActive] = useState(null);
  const [visibleCount, setVisibleCount] = useState(GRID_BATCH);
  const heavyOk = useCosmicHeavyContentReady();

  const shown = useMemo(
    () => GALLERY_AGENTS.filter((a) => a.army === filter),
    [filter],
  );

  // Solo l'armata attiva in DOM — niente centinaia di carte hidden.
  useEffect(() => {
    setVisibleCount(GRID_BATCH);
  }, [filter]);

  useEffect(() => {
    if (!heavyOk) return undefined;
    if (visibleCount >= shown.length) return undefined;
    const idleId = scheduleIdleWork(() => {
      setVisibleCount((prev) => Math.min(shown.length, prev + GRID_BATCH));
    });
    return () => cancelIdleWork(idleId);
  }, [heavyOk, visibleCount, shown.length]);

  const gridAgents = useMemo(
    () => (heavyOk ? shown.slice(0, visibleCount) : []),
    [heavyOk, shown, visibleCount],
  );

  useEffect(() => {
    if (!heavyOk || gridAgents.length <= 0) return;
    preloadCardImagesForAgents(gridAgents, getCardSprite);
  }, [heavyOk, gridAgents]);
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
              eminenceCount={eminenceCount}
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
          <div className="cgl-filter-group" role="group" aria-label="Armate">
            <ArmyFilterChips armies={PLAYABLE_ARMIES} filter={filter} onSelect={setFilter} />
          </div>
          {ENEMY_ARMIES.length > 0 && (
            <div className="cgl-filter-group cgl-filter-group--enemy" role="group" aria-label="Armate nemiche">
              <div className="cgl-filter-label">Armate nemiche</div>
              <div className="cgl-filter-row">
                <ArmyFilterChips armies={ENEMY_ARMIES} filter={filter} onSelect={setFilter} />
              </div>
            </div>
          )}
        </div>

        <div className="cgl-grid">
          {gridAgents.map((agent) => (
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
      <CardPointerTiltStyles />
      <CardGalleryStyles />
    </div>
  );
}

function CardTile({ agent, accent, onClick }) {
  const { showEldritch } = useEldritchFacePreference(agent.id);
  return (
    <button
      type="button"
      className="cgl-tile"
      style={{ '--accent': accent }}
      onClick={onClick}
      aria-label={agent.name}
    >
      {showEldritch ? (
        <EldritchCardFace
          agent={agent}
          width={ELDRITCH_FRAME_W}
          variant="layered"
          motion={false}
        />
      ) : (
        <CardReworkP4Scaled
          agent={agent}
          width={TILE_WIDTH}
          showBonus
          suppressAnimations
        />
      )}
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
  const { hasKit, mode: faceMode, showEldritch, setPreference } = useEldritchFacePreference(agent.id);
  const cardW = showEldritch ? LIGHTBOX_ELD_W : LIGHTBOX_CARD_W;
  const cardH = showEldritch ? LIGHTBOX_ELD_H : LIGHTBOX_CARD_H;

  return (
    <div className="cgl-lb" onClick={onClose}>
      <div className="cgl-lb-inner" style={{ '--accent': accent }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cgl-lb-close" onClick={onClose} aria-label="Chiudi">✕</button>

        {hasKit && (
          <div className="cgl-lb-face-switch" role="tablist" aria-label="Versione carta">
            <button
              type="button"
              role="tab"
              aria-selected={faceMode === 'standard'}
              className={`cgl-lb-face-btn ${faceMode === 'standard' ? 'on' : ''}`}
              onClick={() => setPreference('standard')}
            >
              Standard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={faceMode === 'eldritch'}
              className={`cgl-lb-face-btn ${faceMode === 'eldritch' ? 'on' : ''}`}
              onClick={() => setPreference('eldritch')}
            >
              Eldritch
            </button>
          </div>
        )}
        {hasKit && (
          <p className="cgl-lb-face-hint">
            {showEldritch
              ? 'Versione Eldritch attiva in partita'
              : 'Scegli Eldritch per usarla in partita'}
          </p>
        )}

        <div className="cgl-lb-card-wrap">
          <div
            className="cgl-lb-card-shadow"
            style={{
              width: cardW,
              height: cardH,
              marginLeft: -Math.round(cardW / 2),
              top: showEldritch ? 12 : undefined,
            }}
            aria-hidden="true"
          />
          {showEldritch ? (
            <div className="cgl-lb-eldritch" style={{ width: cardW, height: cardH }}>
              <EldritchCardFace
                agent={agent}
                width={cardW}
                variant="layered"
                motion
                idleMotion={false}
              />
            </div>
          ) : (
            <CardPointerTilt
              shineAccent={accent}
              maxTilt={16}
              className="cgl-lb-tilt"
              style={{ width: LIGHTBOX_CARD_W, height: LIGHTBOX_CARD_H }}
              hitPadX={LIGHTBOX_HIT_PAD_X}
              hitPadY={LIGHTBOX_HIT_PAD_Y}
            >
              <div className="cgl-lb-card-scale">
                <CardReworkP4 agent={agent} showBonus />
              </div>
            </CardPointerTilt>
          )}
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
            <p className="cgl-lb-flavour">{agent.flavour.startsWith('«') ? agent.flavour : <>&ldquo;{agent.flavour}&rdquo;</>}</p>
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
        position: absolute; inset: 0;
        background: #050608; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden; isolation: isolate; z-index: 2;
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
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 10px 60px 12px;
      }
      .cgl-filter-group {
        display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
        max-width: 1400px;
      }
      .cgl-filter-group--enemy {
        flex-direction: column; align-items: center; gap: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(199, 173, 113, 0.28);
        width: min(100%, 920px);
      }
      .cgl-filter-label {
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase;
        color: #c7ad71;
      }
      .cgl-filter-row {
        display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
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
        grid-template-columns: repeat(${GRID_COLUMNS}, ${GRID_COL_WIDTH}px);
        grid-auto-rows: auto;
        column-gap: ${GRID_GAP_X}px;
        row-gap: ${GRID_GAP_Y}px;
        justify-content: center; align-content: start;
        overflow-y: auto; overflow-x: hidden;
        padding: 20px 40px 40px;
        scrollbar-gutter: stable;
      }

      .cgl-tile {
        background: none; border: none;
        padding: ${TILE_PAD_Y}px ${TILE_PAD_X}px;
        width: ${GRID_COL_WIDTH}px;
        min-height: ${CARD_NATIVE_H + TILE_PAD_Y * 2}px;
        cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
        position: relative; z-index: 1;
        overflow: visible;
        transition: transform .18s ease, filter .18s ease;
        -webkit-tap-highlight-color: transparent;
        content-visibility: auto;
        contain-intrinsic-size: auto ${CARD_NATIVE_H + TILE_PAD_Y * 2}px;
      }
      .cgl-tile:hover,
      .cgl-tile:focus-visible {
        transform: translateY(-4px);
        filter: drop-shadow(0 10px 18px rgba(0,0,0,0.45))
                drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 28%, transparent));
        z-index: 2;
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
        position: absolute; top: 0; right: 0; z-index: 50;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.3);
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace; font-size: 14px;
        width: 40px; height: 40px; cursor: pointer; transition: all .2s;
        pointer-events: auto;
      }
      .cgl-lb-close:hover { border-color: var(--accent); color: var(--accent); }
      .cgl-lb-face-switch {
        display: flex; justify-content: center; gap: 8px;
        margin: 4px 0 8px; position: relative; z-index: 5;
      }
      .cgl-lb-face-btn {
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        padding: 8px 14px; border-radius: 999px; cursor: pointer;
        color: rgba(226,232,240,0.75);
        background: rgba(0,0,0,0.45);
        border: 1px solid rgba(255,255,255,0.14);
        transition: border-color .2s, color .2s, background .2s;
      }
      .cgl-lb-face-btn:hover { color: #f8fafc; border-color: rgba(255,255,255,0.28); }
      .cgl-lb-face-btn.on {
        color: #0b0b0c; font-weight: 700;
        background: color-mix(in srgb, var(--accent) 88%, #f8fafc);
        border-color: color-mix(in srgb, var(--accent) 70%, #fff);
      }
      .cgl-lb-face-hint {
        margin: 0 0 4px;
        text-align: center;
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(226,232,240,0.55);
        position: relative;
        z-index: 2;
      }
      .cgl-lb-card-wrap {
        position: relative;
        z-index: 0;
        isolation: isolate;
        display: flex; justify-content: center;
        padding: 12px 8px ${Math.max(12, Math.round(LIGHTBOX_HIT_PAD_Y * 0.25))}px;
        margin: 0;
        perspective: 1200px;
        perspective-origin: 50% 40%;
      }
      .cgl-lb-card-shadow {
        position: absolute;
        top: ${12 + LIGHTBOX_HIT_PAD_Y}px;
        left: 50%;
        width: ${LIGHTBOX_CARD_W}px;
        height: ${LIGHTBOX_CARD_H}px;
        margin-left: -${Math.round(LIGHTBOX_CARD_W / 2)}px;
        border-radius: 16px;
        pointer-events: none;
        box-shadow:
          0 0 48px color-mix(in srgb, var(--accent) 38%, transparent),
          0 22px 34px rgba(0,0,0,0.55);
      }
      .cgl-lb-tilt { cursor: grab; flex: none; position: relative; z-index: 1; }
      .cgl-lb-tilt[data-tilt="1"] { cursor: grabbing; }
      .cgl-lb-card-scale {
        position: absolute; top: 0; left: 0;
        width: ${CARD_NATIVE_W}px; height: ${CARD_NATIVE_H}px;
        transform: scale(${LIGHTBOX_SCALE});
        transform-origin: top left;
      }
      .cgl-lb-eldritch {
        position: relative; z-index: 1;
        flex: none;
        overflow: visible;
        cursor: grab;
        /* Hit solo via .eldritch-layered__hit (cornice); niente capture sul canvas oversized. */
        pointer-events: none;
      }
      .cgl-lb-eldritch .eldritch-layered__hit {
        pointer-events: auto;
      }
      .cgl-lb-eldritch .eldritch-layered {
        max-width: none; gap: 0; width: 100%; height: 100%;
      }
      .cgl-lb-eldritch .eldritch-layered__stage {
        padding: 0; width: 100%; height: 100%;
        perspective: 1200px;
      }
      .cgl-lb-eldritch .eldritch-layered__card {
        filter: none;
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
        font-style: italic; text-align: left; white-space: pre-line;
      }
      .cgl-lb-hint {
        margin: 0; text-align: center;
        font-family: 'Share Tech Mono', monospace; font-size: 10px;
        letter-spacing: 0.12em; color: rgba(148,163,184,0.85); text-transform: uppercase;
      }

      @media (prefers-reduced-motion: reduce) {
        .cgl *, .cgl *::after, .cgl *::before { animation-duration: 0.001s !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}
