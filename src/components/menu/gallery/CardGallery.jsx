// Galleria agenti — Compendium stile Persona: lista inclinata a sinistra,
// carta grande (CardReworkP4 baked-tilt o faccia alternativa) + ritratto a destra.

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ALL_AGENTS } from '../../../data/cards.js';
import { CONCORDIA_ARMY, CONCORDIA_CARDS } from '../../../campaign/data/concordia.js';
import { firstActCard } from '../../../campaign/data/firstAct.js';
import { getCardDisplayLabels } from '../../../data/cardArchetypes.js';
import { CardPointerTiltStyles } from '../../cards/CardPointerTilt.jsx';
import { GalleryBakedTiltCard } from './GalleryBakedTiltCard.jsx';
import { CardTagsRow } from '../../cards/CardTagBadges.jsx';
import { getAgentThumbUrl, getCardImageUrl } from '../../../data/images.js';
import { getCardSprite } from '../../../utils/cardUtils.js';
import { useCosmicHeavyContentReady } from '../../cosmic/ScreenTransition.jsx';
import { ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from '../../cards/EldritchCardFace.jsx';
import { AltArtCardFace } from '../../cards/AltArtCardFace.jsx';
import { hasLayeredAltArt } from '../../cardFaceLab/cardFaceLabData.js';
import { useEldritchFacePreference } from '../../../hooks/useEldritchFacePreference.js';
import {
  GalleryPersonaShell,
  PersonaRail,
  PersonaList,
  PersonaNamePlate,
  PersonaStatBurst,
  armyAccent,
  armyBgUrl,
  armyGlyph,
  armyMotto,
  wrapIndex,
} from './GalleryPersonaShell.jsx';

const DEFAULT_GALLERY_ARMY = "Figli dell'Orizzonte";
/** Armate solo campagna / non selezionabili nel deckbuilder. */
export const ENEMY_GALLERY_ARMIES = [CONCORDIA_ARMY];
const CARD_NATIVE_W = 230;
const CARD_NATIVE_H = 330;
const STAGE_SCALE = 1.5;
const STAGE_CARD_W = Math.round(CARD_NATIVE_W * STAGE_SCALE);
const STAGE_CARD_H = Math.round(CARD_NATIVE_H * STAGE_SCALE);
/** Eldritch: stessa larghezza della P4; altezza = cornice. */
const STAGE_ELD_H = Math.round((STAGE_CARD_W * ELDRITCH_FRAME_H) / ELDRITCH_FRAME_W);
/** Zona tilt attorno alla carta (cursore anche fuori dal bordo). */
const STAGE_HIT_PAD = 56;

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
/** Agenti con kit Eldritch (tab Alternative). */
export const GALLERY_ALTERNATIVE_AGENTS = GALLERY_AGENTS.filter((a) => hasLayeredAltArt(a.id));
export const GALLERY_ALTERNATIVE_COUNT = GALLERY_ALTERNATIVE_AGENTS.length;

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
const ALT_PLAYABLE_ARMIES = armyList(
  GALLERY_ALTERNATIVE_AGENTS.filter((a) => !ENEMY_GALLERY_ARMIES.includes(a.army)),
);
const ALT_ENEMY_ARMIES = ENEMY_GALLERY_ARMIES.filter((army) =>
  GALLERY_ALTERNATIVE_AGENTS.some((a) => a.army === army),
);
const DEFAULT_ALT_GALLERY_ARMY = ALT_PLAYABLE_ARMIES[0] || DEFAULT_GALLERY_ARMY;

function agentArtUrls(agent) {
  const sprite = getCardSprite(agent);
  const full = getCardImageUrl(sprite?.type, sprite?.agentId);
  const thumb = sprite?.agentId != null ? getAgentThumbUrl(sprite.agentId) : null;
  return { full, thumb: thumb || full };
}

function powerDescription(agent) {
  if (!agent?.description) return null;
  return agent.description.replace(/^Potere:\s*/i, '');
}

export default function CardGallery({
  onBack,
  totalCards,
  galleryTab,
  onGalleryTabChange,
  agentCount = GALLERY_AGENT_COUNT,
  alternativeCount = GALLERY_ALTERNATIVE_COUNT,
  fieldCount,
  eminenceCount,
  /** Tab Alternative: solo kit Eldritch, sempre faccia layered. */
  alternativeOnly = false,
  /** Warm-up / boot: niente facce alt (evita layered Arcana/Eldritch pesanti). */
  preferStandardFaces = false,
}) {
  const agentPool = alternativeOnly ? GALLERY_ALTERNATIVE_AGENTS : GALLERY_AGENTS;
  const playableArmies = alternativeOnly ? ALT_PLAYABLE_ARMIES : PLAYABLE_ARMIES;
  const enemyArmies = alternativeOnly ? ALT_ENEMY_ARMIES : ENEMY_ARMIES;
  const allArmies = useMemo(() => [...playableArmies, ...enemyArmies], [playableArmies, enemyArmies]);
  const resolvedTotal = totalCards ?? (alternativeOnly ? GALLERY_ALTERNATIVE_COUNT : GALLERY_AGENT_COUNT);
  const [filterState, setFilter] = useState(
    alternativeOnly ? DEFAULT_ALT_GALLERY_ARMY : DEFAULT_GALLERY_ARMY,
  );
  // Agenti ↔ Alternative riusano l'istanza: l'armata può non esistere nell'altro pool.
  const filter = allArmies.includes(filterState) ? filterState : allArmies[0];
  const [activeIndex, setActiveIndex] = useState(0);
  const heavyOk = useCosmicHeavyContentReady();

  const shown = useMemo(
    () => agentPool.filter((a) => a.army === filter),
    [agentPool, filter],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filter, alternativeOnly]);

  const index = Math.min(activeIndex, Math.max(0, shown.length - 1));
  const agent = shown[index] || null;
  const accent = armyAccent(filter, '#f5f3eb');

  const forceEldritch = alternativeOnly && !preferStandardFaces;

  const railItems = useMemo(() => allArmies.map((army) => ({
    id: army,
    label: army,
    glyph: armyGlyph(army),
    accent: armyAccent(army),
    count: agentPool.filter((a) => a.army === army).length,
    group: enemyArmies.includes(army) ? 'enemy' : 'playable',
  })), [allArmies, agentPool, enemyArmies]);

  const listItems = useMemo(() => shown.map((a) => ({
    key: a.id,
    number: `№${String(a.id).padStart(3, '0')}`,
    title: a.name,
    sub: `Lega ${a.league}`,
    meta: `${a.power ?? '–'} / ${a.damage ?? '–'}`,
    accent: armyAccent(a.army),
    thumb: agentArtUrls(a).thumb,
  })), [shown]);

  const changeArmy = useCallback((delta) => {
    const i = allArmies.indexOf(filter);
    setFilter(allArmies[wrapIndex(i, delta, allArmies.length)]);
  }, [allArmies, filter]);

  return (
    <>
      <GalleryPersonaShell
        accent={accent}
        section={alternativeOnly ? 'ALTERNATIVE' : 'AGENTI'}
        eyebrow={alternativeOnly ? 'STILI ALTERNATIVI' : 'ARCHIVIO DI GUERRA'}
        title={filter}
        motto={armyMotto(filter)}
        watermark={alternativeOnly ? 'ALTER' : 'AGENTI'}
        bgImage={armyBgUrl(filter)}
        counterLabel={`${String(shown.length).padStart(2, '0')} DI ${resolvedTotal}`}
        counterCurrent={shown.length ? index + 1 : 0}
        counterTotal={shown.length}
        onBack={onBack}
        galleryTab={galleryTab}
        onGalleryTabChange={onGalleryTabChange}
        agentCount={agentCount}
        alternativeCount={alternativeCount}
        fieldCount={fieldCount}
        eminenceCount={eminenceCount}
        onPrev={() => setActiveIndex(wrapIndex(index, -1, shown.length))}
        onNext={() => setActiveIndex(wrapIndex(index, 1, shown.length))}
        onRailPrev={() => changeArmy(-1)}
        onRailNext={() => changeArmy(1)}
        hints={[
          { keys: ['↑', '↓'], label: 'AGENTE' },
          { keys: ['←', '→'], label: 'ARMATA' },
          { keys: ['Q', 'E'], label: 'SEZIONE' },
          { keys: ['ESC'], label: 'MENU' },
        ]}
        rail={(
          <PersonaRail
            items={railItems}
            activeId={filter}
            onSelect={setFilter}
            groupLabels={{ enemy: 'NEMICI' }}
          />
        )}
        list={<PersonaList items={listItems} activeIndex={index} onSelect={setActiveIndex} />}
        stage={agent && (
          <AgentStage
            key={agent.id}
            agent={agent}
            heavyOk={heavyOk}
            forceEldritch={forceEldritch}
            forceStandard={preferStandardFaces}
          />
        )}
      />
      <CardPointerTiltStyles />
      <CardGalleryStyles />
    </>
  );
}

function AgentStage({ agent, heavyOk, forceEldritch = false, forceStandard = false }) {
  const accent = armyAccent(agent.army);
  const powerBody = powerDescription(agent);
  const hasTags = getCardDisplayLabels(agent.id).length > 0;
  const { full: artUrl } = agentArtUrls(agent);
  const {
    hasKit,
    mode: faceMode,
    showEldritch,
    styleLabel,
    setPreference,
  } = useEldritchFacePreference(agent.id);
  const altLabel = styleLabel || 'Eldritch';
  const displayEldritch = !forceStandard && (forceEldritch || showEldritch);

  return (
    <div className="cgp-stage" style={{ '--accent': accent }}>
      <div className="cgp-portrait" aria-hidden="true">
        {artUrl && <img src={artUrl} alt="" decoding="async" />}
        <div className="cgp-portrait-tone" />
      </div>

      <div className="cgp-head gp-anim-swipe">
        <PersonaNamePlate
          number={`№ ${String(agent.id).padStart(3, '0')}`}
          name={agent.name}
          sub={agent.army}
        />
      </div>

      <div className="cgp-stats">
        <div className="gp-anim-swipe d1"><PersonaStatBurst label="POT" value={agent.power} tone="light" /></div>
        <div className="gp-anim-swipe d2"><PersonaStatBurst label="DAN" value={agent.damage} tone="accent" /></div>
        <div className="gp-anim-swipe d3"><PersonaStatBurst label="LEGA" value={agent.league} tone="dark" /></div>
      </div>

      <div className="cgp-card-slot">
        <div className="cgp-card-slam">
          {/* Stessa misura della carta: il contenitore include il padding hit del tilt. */}
          <div
            className="cgp-card-back"
            aria-hidden="true"
            style={displayEldritch || !heavyOk
              ? { left: 0, top: 0, width: STAGE_CARD_W, height: displayEldritch ? STAGE_ELD_H : STAGE_CARD_H }
              : { left: STAGE_HIT_PAD, top: STAGE_HIT_PAD, width: STAGE_CARD_W, height: STAGE_CARD_H }}
          />
          {!heavyOk ? (
            <div className="cgp-card-ph" style={{ width: STAGE_CARD_W, height: STAGE_CARD_H }} />
          ) : displayEldritch ? (
            <div className="cgp-eldritch" style={{ width: STAGE_CARD_W, height: STAGE_ELD_H }}>
              <AltArtCardFace
                agent={agent}
                width={STAGE_CARD_W}
                variant="layered"
                motion
                idleMotion={false}
                parallaxOnly
                performance="gallery"
              />
            </div>
          ) : (
            <GalleryBakedTiltCard
              agent={agent}
              accent={accent}
              width={STAGE_CARD_W}
              height={STAGE_CARD_H}
              nativeW={CARD_NATIVE_W}
              nativeH={CARD_NATIVE_H}
              scale={STAGE_SCALE}
              maxTilt={16}
              hitPadX={STAGE_HIT_PAD}
              hitPadY={STAGE_HIT_PAD}
              className="cgp-tilt"
            />
          )}
        </div>

        {hasKit && !forceStandard && (
          <div className="cgp-face-switch" role="tablist" aria-label="Versione carta">
            <button
              type="button"
              role="tab"
              aria-selected={faceMode === 'standard'}
              className={`cgp-face-btn ${faceMode === 'standard' ? 'on' : ''}`}
              onClick={() => setPreference('standard')}
            >
              <span>Standard</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={faceMode === 'eldritch'}
              className={`cgp-face-btn ${faceMode === 'eldritch' ? 'on' : ''}`}
              onClick={() => setPreference('eldritch')}
            >
              <span>{altLabel}</span>
            </button>
            <div className="cgp-face-hint">
              {showEldritch ? `In partita: ${altLabel}` : 'In partita: Standard'}
            </div>
          </div>
        )}
      </div>

      <div className="cgp-info">
        {powerBody && (
          <div className="gp-panel gp-panel--light gp-anim-swipe d1">
            <div className="gp-panel-label">POTERE</div>
            <p className="cgp-power">{powerBody}</p>
          </div>
        )}
        {hasTags && (
          <div className="cgp-tags gp-anim-swipe d2">
            <CardTagsRow cardId={agent.id} compact={false} />
          </div>
        )}
        {agent.flavour && (
          <div className="gp-panel cgp-flavour gp-anim-swipe d3">
            <p>{agent.flavour.startsWith('«') ? agent.flavour : <>&ldquo;{agent.flavour}&rdquo;</>}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardGalleryStyles() {
  return (
    <style>{`
      .cgp-stage { position: absolute; inset: 0; }

      .cgp-portrait {
        position: absolute; top: 0; bottom: 0; left: 250px; right: -40px; overflow: hidden;
        clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%);
        animation: gp-portrait-in .5s cubic-bezier(.2,1,.3,1) both;
      }
      .cgp-portrait img {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; object-position: 50% 18%;
        filter: saturate(1.1) contrast(1.05);
        image-rendering: pixelated;
      }
      .cgp-portrait::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, #000) 1.3px, transparent 1.8px) 0 0 / 8px 8px;
        -webkit-mask-image: linear-gradient(160deg, transparent 45%, #000 85%);
        mask-image: linear-gradient(160deg, transparent 45%, #000 85%);
        opacity: 0.7;
      }
      .cgp-portrait-tone {
        position: absolute; inset: 0;
        background:
          linear-gradient(to right, rgba(5,5,7,0.85) 0%, rgba(5,5,7,0.1) 40%, transparent 60%),
          linear-gradient(to top, rgba(5,5,7,0.96) 0%, rgba(5,5,7,0.55) 38%, transparent 62%);
      }

      .cgp-head { position: absolute; top: 4px; right: 0; z-index: 5; max-width: 820px; display: flex; justify-content: flex-end; }
      .cgp-head .gp-nameplate-name { font-size: 42px; }

      .cgp-stats {
        position: absolute; top: 150px; left: 440px; z-index: 7;
        display: flex; gap: 2px; transform: rotate(-6deg);
      }
      .gp-burst--light .gp-burst-shape { background: #f5f3eb; }

      .cgp-card-slot {
        position: absolute; left: 0; top: 70px; z-index: 6;
        display: flex; flex-direction: column; align-items: center; gap: 22px;
      }
      .cgp-card-slam {
        position: relative; perspective: 1200px;
        transform: rotate(-4deg);
        animation: gp-slam .5s cubic-bezier(.2,.9,.25,1) both;
      }
      /* Ombra piena a parte: un filter sul contenitore appiattisce tilt 3D e blend delle facce alt. */
      .cgp-card-back {
        position: absolute; transform: translate(14px, 14px);
        background: #050507; border-radius: 0 0 14px 14px;
        box-shadow: 0 0 50px color-mix(in srgb, var(--accent) 40%, transparent);
      }
      .cgp-card-ph { background: #111; }
      .cgp-tilt { cursor: grab; position: relative; }
      .cgp-tilt[data-tilt="1"] { cursor: grabbing; }
      /* Usata da GalleryBakedTiltCard prima del bake (DOM live scalato). */
      .cgl-lb-card-scale { position: absolute; top: 0; left: 0; transform-origin: top left; }
      .cgp-eldritch { position: relative; overflow: visible; cursor: grab; pointer-events: none; }
      .cgp-eldritch .eldritch-layered__hit,
      .cgp-eldritch .arcana-layered__hit { pointer-events: auto; }
      .cgp-eldritch .eldritch-layered,
      .cgp-eldritch .arcana-layered { max-width: none; gap: 0; width: 100%; height: 100%; }
      .cgp-eldritch .eldritch-layered__stage,
      .cgp-eldritch .arcana-layered__stage {
        padding: 0; width: 100%; height: 100%; perspective: 1200px;
        --eld-stage-pad: 0px; --arcana-stage-pad: 0px;
      }
      .cgp-eldritch .eldritch-layered__card,
      .cgp-eldritch .arcana-layered__card { filter: none; width: 100%; height: 100%; aspect-ratio: auto; }

      .cgp-face-switch { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; transform: rotate(-2deg); max-width: 380px; }
      .cgp-face-btn {
        border: 0; cursor: pointer; padding: 8px 18px; transform: skewX(-14deg);
        background: #050507; color: rgba(245,243,235,0.7);
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase;
        transition: background .15s, color .15s, transform .15s;
      }
      .cgp-face-btn > span { display: inline-block; transform: skewX(14deg); }
      .cgp-face-btn:hover:not(.on) { color: #f5f3eb; transform: skewX(-14deg) translateY(-2px); }
      .cgp-face-btn.on { background: var(--accent); color: #050507; box-shadow: 4px 4px 0 #f5f3eb; }
      .cgp-face-hint {
        width: 100%; text-align: center; margin-top: 2px;
        font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        color: rgba(245,243,235,0.7);
      }

      .cgp-info {
        position: absolute; left: 420px; right: 0; bottom: 0; z-index: 5;
        display: flex; flex-direction: column; gap: 14px;
        max-height: 450px; overflow-y: auto; scrollbar-width: none;
      }
      .cgp-info::-webkit-scrollbar { display: none; }
      .cgp-power { margin: 0; font-weight: 600; font-size: 21px; line-height: 1.3; }
      .cgp-tags { padding-left: 6px; }
      .cgp-tags > div { justify-content: flex-start !important; }
      .cgp-flavour p {
        margin: 0; font-size: 15px; line-height: 1.55; font-style: italic;
        color: rgba(245,243,235,0.88); white-space: pre-line;
      }
    `}</style>
  );
}
