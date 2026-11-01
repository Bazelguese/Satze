// Galleria agenti — Compendium stile Persona: lista inclinata a sinistra,
// carta grande (CardReworkP4 baked-tilt o faccia alternativa) + ritratto a destra.

import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScreenState } from '../../screenCache/ScreenCache.jsx';
import { ALL_AGENTS } from '../../../data/cards.js';
import { CONCORDIA_ARMY, CONCORDIA_CARDS } from '../../../campaign/data/concordia.js';
import { firstActCard } from '../../../campaign/data/firstAct.js';
import { getCardDisplayLabels, LABEL_TOOLTIPS } from '../../../data/cardArchetypes.js';
import { CardPointerTiltStyles } from '../../cards/CardPointerTilt.jsx';
import { GalleryBakedTiltCard } from './GalleryBakedTiltCard.jsx';
import { getAgentThumbUrl, getCardImageUrl } from '../../../data/images.js';
import { getCardSprite } from '../../../utils/cardUtils.js';
import { useCosmicHeavyContentReady } from '../../cosmic/ScreenTransition.jsx';
import { ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from '../../cards/EldritchCardFace.jsx';
import { AltArtCardFace } from '../../cards/AltArtCardFace.jsx';
import { getLayeredAltArt, hasLayeredAltArt } from '../../cardFaceLab/cardFaceLabData.js';
import { useEldritchFacePreference } from '../../../hooks/useEldritchFacePreference.js';
import {
  GalleryPersonaShell,
  PersonaRail,
  PersonaList,
  PersonaNamePlate,
  armyAccent,
  armyBgUrl,
  armyGlyph,
  armyIconUrl,
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

/** Sfondo + soggetto del kit alternativo, con la stessa composizione della carta a livelli. */
function altPortraitLayers(agentId) {
  const kit = getLayeredAltArt(agentId);
  if (!kit?.background || !kit?.subject) return null;
  const c = kit.composition || {};
  const arcana = kit.style === 'arcana';
  const bgScale = arcana ? (c.backgroundScale ?? 1) * 1.03 : (c.backgroundScale ?? 1.07);
  const subjectScale = c.subjectScale ?? (arcana ? 1 : 1.025);
  return {
    arcana,
    background: kit.background,
    subject: kit.subject,
    bgTransform: `translate(0%, ${c.backgroundYPercent || 0}%) scale(${bgScale})`,
    subjectTransform: `translate(${c.subjectXPercent || 0}%, ${c.subjectYPercent || 0}%) scale(${subjectScale})`,
  };
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
  // a ogni rientro dalla cache delle schermate si riparte dall'armata e dalla carta iniziali
  const [filterState, setFilter] = useScreenState(
    alternativeOnly ? DEFAULT_ALT_GALLERY_ARMY : DEFAULT_GALLERY_ARMY,
  );
  // Agenti ↔ Alternative riusano l'istanza: l'armata può non esistere nell'altro pool.
  const filter = allArmies.includes(filterState) ? filterState : allArmies[0];
  const [activeIndex, setActiveIndex] = useScreenState(0);
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
    icon: armyIconUrl(army),
    glyph: armyGlyph(army),
    accent: armyAccent(army),
    count: agentPool.filter((a) => a.army === army).length,
    group: enemyArmies.includes(army) ? 'enemy' : 'playable',
  })), [allArmies, agentPool, enemyArmies]);

  const listItems = useMemo(() => shown.map((a) => ({
    key: a.id,
    number: `№${String(a.id).padStart(3, '0')}`,
    title: a.name,
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
  const stageRef = useRef(null);
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
  const altPortrait = displayEldritch ? altPortraitLayers(agent.id) : null;
  const matchFaceLabel = showEldritch ? altLabel : 'Standard';
  const faceHint = forceEldritch
    ? `Qui vedi sempre ${altLabel} · in partita: ${matchFaceLabel}`
    : 'Scelta salvata per mazzo e duelli';
  // Standard e alternativa occupano lo stesso riquadro (carta + zona tilt): niente salti al cambio.
  const cardBox = {
    width: STAGE_CARD_W,
    height: displayEldritch && heavyOk ? STAGE_ELD_H : STAGE_CARD_H,
    padding: STAGE_HIT_PAD,
    boxSizing: 'content-box',
  };

  return (
    <div className="cgp-stage" ref={stageRef} style={{ '--accent': accent }}>
      <div
        key={altPortrait ? 'alt' : 'std'}
        className={`cgp-portrait${altPortrait ? ' cgp-portrait--alt' : ''}`}
        aria-hidden="true"
      >
        {altPortrait ? (
          <div className="cgp-portrait-alt">
            <img
              className={`cgp-portrait-alt-bg${altPortrait.arcana ? ' is-oversize' : ''}`}
              src={altPortrait.background}
              alt=""
              decoding="async"
              style={{ transform: altPortrait.bgTransform }}
            />
            <img
              src={altPortrait.subject}
              alt=""
              decoding="async"
              style={{ transform: altPortrait.subjectTransform }}
            />
          </div>
        ) : (
          artUrl && <img src={artUrl} alt="" decoding="async" />
        )}
        <div className="cgp-portrait-tone" />
      </div>

      <div className="cgp-head gp-anim-swipe">
        <PersonaNamePlate
          number={`№ ${String(agent.id).padStart(3, '0')}`}
          name={agent.name}
          sub={agent.army}
        />
      </div>

      <div className="cgp-card-slot">
        <div className="cgp-card-slam">
          {/* Stessa misura della carta: il contenitore include il padding hit del tilt. */}
          <div
            className="cgp-card-back"
            aria-hidden="true"
            style={{ left: STAGE_HIT_PAD, top: STAGE_HIT_PAD, width: cardBox.width, height: cardBox.height }}
          />
          {!heavyOk ? (
            <div style={cardBox}>
              <div className="cgp-card-ph" style={{ width: '100%', height: '100%' }} />
            </div>
          ) : displayEldritch ? (
            <div className="cgp-eldritch" style={cardBox}>
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
          <div className="cgp-face-switch" role="radiogroup" aria-label="Versione della carta usata in partita">
            <div className="cgp-face-label"><span>Versione in partita</span></div>
            <button
              type="button"
              role="radio"
              aria-checked={faceMode === 'standard'}
              className={`cgp-face-btn ${faceMode === 'standard' ? 'on' : ''}`}
              onClick={() => setPreference('standard')}
            >
              <span>Standard</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={faceMode === 'eldritch'}
              className={`cgp-face-btn ${faceMode === 'eldritch' ? 'on' : ''}`}
              onClick={() => setPreference('eldritch')}
            >
              <span>{altLabel}</span>
            </button>
            <div className="cgp-face-hint">{faceHint}</div>
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
        <GalleryArchetypeTags cardId={agent.id} stageRef={stageRef} />
        {agent.flavour && (
          <div className="gp-panel cgp-flavour gp-anim-swipe d3">
            <p>{agent.flavour.startsWith('«') ? agent.flavour : <>&ldquo;{agent.flavour}&rdquo;</>}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const TAG_KIND_LABEL = {
  archetype: 'ARCHETIPO',
  secondary: 'SECONDARIO',
  focus: 'FOCUS',
  scaling: 'SCALANTE',
};

/**
 * Chip archetipo / secondario / focus / scalante in stile Persona.
 * Il tooltip vive nello stage (non nel pannello info scrollabile) per non essere tagliato
 * e per scalare insieme al canvas.
 */
function GalleryArchetypeTags({ cardId, stageRef }) {
  const [tip, setTip] = useState(null);
  const labels = getCardDisplayLabels(cardId);
  if (!labels.length) return null;

  const show = (el, label) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = stage.offsetWidth ? s.width / stage.offsetWidth : 1;
    setTip({
      label,
      x: (r.left + r.width / 2 - s.left) / k,
      y: (r.top - s.top) / k,
    });
  };
  const hide = () => setTip(null);

  return (
    <div className="cgp-tags gp-anim-swipe d2">
      {labels.map((label) => (
        <span
          key={`${label.kind}-${label.text}`}
          className={`cgp-tag cgp-tag--${label.kind}`}
          tabIndex={0}
          aria-label={`${TAG_KIND_LABEL[label.kind] || ''} ${label.text}`}
          onMouseEnter={(e) => show(e.currentTarget, label)}
          onMouseLeave={hide}
          onFocus={(e) => show(e.currentTarget, label)}
          onBlur={hide}
        >
          <span className="cgp-tag-in"><span>{label.text}</span></span>
        </span>
      ))}
      {tip && stageRef.current && createPortal(
        <div className="cgp-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
          <div className="cgp-tip-plate">
            <div className="cgp-tip-head">
              <span className="cgp-tip-kind">{TAG_KIND_LABEL[tip.label.kind] || ''}</span>
              <span className="cgp-tip-name">{tip.label.text}</span>
            </div>
            <p className="cgp-tip-body">{tip.label.title || LABEL_TOOLTIPS[tip.label.text] || tip.label.text}</p>
          </div>
        </div>,
        stageRef.current,
      )}
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
      /* Arte alternativa: riquadro 23:33 in "cover" (come object-position 50% 18%). */
      .cgp-portrait--alt { container-type: size; }
      .cgp-portrait-alt {
        position: absolute; left: 50%; top: 18%;
        width: max(100cqw, calc(100cqh * 1104 / 1584)); aspect-ratio: 1104 / 1584;
        transform: translate(-50%, -18%);
      }
      .cgp-portrait-alt img {
        object-fit: fill; object-position: 50% 50%; transform-origin: center center;
        image-rendering: auto;
      }
      .cgp-portrait-alt img.is-oversize { inset: -4%; width: 108%; height: 108%; }
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
      .cgp-face-label { width: 100%; display: flex; justify-content: center; margin-bottom: 2px; }
      .cgp-face-label > span {
        background: #f5f3eb; color: #050507; padding: 2px 12px;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
        transform: skewX(-14deg); box-shadow: 3px 3px 0 var(--accent);
      }
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
      .cgp-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; padding: 4px 0 6px 10px; }
      .cgp-tag {
        --c: var(--accent);
        flex: none; cursor: help; outline: none;
        transform: skewX(-14deg); transition: transform .18s cubic-bezier(.3,1.6,.5,1);
      }
      .cgp-tag--focus { --c: #67e8f9; }
      .cgp-tag--scaling { --c: #c084fc; }
      .cgp-tag-in {
        display: inline-flex; align-items: center; height: 36px; padding: 0 18px;
        background: rgba(5,5,7,0.92); color: rgba(245,243,235,0.85);
        border-left: 4px solid var(--c);
        font-weight: 700; font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;
        transition: background .15s, color .15s, box-shadow .15s;
      }
      .cgp-tag-in > span { display: inline-block; transform: skewX(14deg); }
      .cgp-tag--archetype .cgp-tag-in {
        background: #f5f3eb; color: #050507; border-left-color: #050507;
        box-shadow: 4px 4px 0 var(--accent);
      }
      .cgp-tag--secondary .cgp-tag-in > span::before { content: '/ '; opacity: 0.55; }
      .cgp-tag:hover, .cgp-tag:focus-visible { transform: skewX(-14deg) translateY(-3px) rotate(-2deg); }
      .cgp-tag:hover .cgp-tag-in, .cgp-tag:focus-visible .cgp-tag-in { color: #f5f3eb; background: #1c1c22; }
      .cgp-tag--archetype:hover .cgp-tag-in, .cgp-tag--archetype:focus-visible .cgp-tag-in {
        color: #050507; background: #f5f3eb; box-shadow: 7px 7px 0 var(--accent);
      }

      .cgp-tip {
        position: absolute; z-index: 40; pointer-events: none;
        width: max-content; max-width: 380px;
        transform: translate(-50%, calc(-100% - 16px));
        filter: drop-shadow(7px 7px 0 var(--accent)) drop-shadow(0 10px 18px rgba(0,0,0,0.6));
        animation: cgp-tip-in .18s cubic-bezier(.2,1.3,.4,1) both;
      }
      @keyframes cgp-tip-in { from { opacity: 0; transform: translate(-50%, calc(-100% - 4px)) rotate(3deg); } }
      .cgp-tip-plate {
        background: #f5f3eb; color: #050507; padding: 12px 24px 14px 20px;
        clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        transform: rotate(-2deg);
      }
      .cgp-tip-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
      .cgp-tip-kind {
        background: #050507; color: #f5f3eb; font-weight: 700; font-size: 11px; letter-spacing: 0.24em;
        padding: 2px 9px; transform: skewX(-14deg);
      }
      .cgp-tip-name { font-weight: 700; font-style: italic; font-size: 20px; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1; }
      .cgp-tip-body { margin: 0; font-weight: 600; font-size: 15px; line-height: 1.35; }
      .cgp-flavour p {
        margin: 0; font-size: 15px; line-height: 1.55; font-style: italic;
        color: rgba(245,243,235,0.88); white-space: pre-line;
      }
    `}</style>
  );
}
