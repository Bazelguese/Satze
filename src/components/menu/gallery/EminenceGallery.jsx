// Galleria Eminenze — Compendium stile Persona: elenco delle Eminenze a sinistra,
// carta Arena (EminenceTarotCard) con ingresso reale + ritratto e abilità a destra.

import React, { useLayoutEffect, useMemo, useState } from 'react';
import { EMINENCES, EMINENCE_IDS_BY_ARMY_ORDER } from '../../../data/eminences.js';
import { getEminenceArtUrl } from '../../../data/eminenceArt.js';
import { getEminenceArtFrame } from '../../../data/eminenceArtFrames.js';
import {
  EMINENZA_DEFAULTS,
  entryLayerStyle,
  useEminenzaEntry,
} from '../../../lib/eminenzaEntry.js';
import { EminenceTarotCard } from '../../eminenceLab/EminenceTarotCard.jsx';
import {
  GalleryPersonaShell,
  PersonaList,
  PersonaNamePlate,
  PersonaStatBurst,
  armyAccent,
  armyBgUrl,
  armyGlyph,
  armyMotto,
  wrapIndex,
} from './GalleryPersonaShell.jsx';
import '../../eminenceLab/eminenceArtLab.css';

const CARD_NATIVE_W = 340;
const CARD_NATIVE_H = 588;
const STAGE_SCALE = 0.84;
const STAGE_CARD_W = Math.round(CARD_NATIVE_W * STAGE_SCALE);
const STAGE_CARD_H = Math.round(CARD_NATIVE_H * STAGE_SCALE);

const ALL_EMINENCES = EMINENCE_IDS_BY_ARMY_ORDER.map((id) => EMINENCES[id]);

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
  alternativeCount,
  fieldCount,
  eminenceCount = ALL_EMINENCES.length,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = ALL_EMINENCES.length;
  const eminence = ALL_EMINENCES[activeIndex] || null;
  const accent = armyAccent(eminence?.army, '#f5f3eb');

  const listItems = useMemo(() => ALL_EMINENCES.map((e, i) => ({
    key: e.id,
    number: String(i + 1).padStart(2, '0'),
    title: e.name,
    sub: e.army,
    meta: `P${e.initialPresence ?? 0}`,
    accent: armyAccent(e.army),
    glyph: armyGlyph(e.army),
  })), []);

  const prev = () => setActiveIndex((i) => wrapIndex(i, -1, total));
  const next = () => setActiveIndex((i) => wrapIndex(i, 1, total));

  return (
    <>
      <GalleryPersonaShell
        accent={accent}
        section="EMINENZE"
        eyebrow="ARCHIVIO DI GUERRA"
        title={eminence?.army}
        motto={armyMotto(eminence?.army)}
        watermark="EMINENZE"
        bgImage={armyBgUrl(eminence?.army)}
        counterLabel={`${totalCards} EMINENZE`}
        counterCurrent={activeIndex + 1}
        counterTotal={total}
        onBack={onBack}
        galleryTab={galleryTab}
        onGalleryTabChange={onGalleryTabChange}
        agentCount={agentCount}
        alternativeCount={alternativeCount}
        fieldCount={fieldCount}
        eminenceCount={eminenceCount}
        onPrev={prev}
        onNext={next}
        onRailPrev={prev}
        onRailNext={next}
        hints={[
          { keys: ['↑', '↓'], label: 'EMINENZA' },
          { keys: ['Q', 'E'], label: 'SEZIONE' },
          { keys: ['ESC'], label: 'MENU' },
        ]}
        list={<PersonaList items={listItems} activeIndex={activeIndex} onSelect={setActiveIndex} />}
        stage={eminence && <EminenceStage key={eminence.id} eminence={eminence} />}
      />
      <EminenceGalleryStyles />
    </>
  );
}

function EminenceStage({ eminence }) {
  const accent = armyAccent(eminence.army);
  const artUrl = getEminenceArtUrl(eminence);
  const frame = getEminenceArtFrame(eminence.id);
  const staticText = eminence.static?.text || eminence.static?.name || '';
  const { cardRef, fxRef, play, cardArmClass, fxArmClass } = useEminenzaEntry({
    entry: EMINENZA_DEFAULTS.entry,
    army: eminence.army,
    accent,
  });
  const [entryRevealed, setEntryRevealed] = useState(false);

  useLayoutEffect(() => {
    setEntryRevealed(false);
    play();
  }, [eminence.id, play]);

  useLayoutEffect(() => {
    if (cardArmClass) setEntryRevealed(true);
  }, [cardArmClass]);

  const holdHidden = !entryRevealed && !cardArmClass;

  return (
    <div className="egp-stage" style={{ '--accent': accent }}>
      <div className="egp-portrait" aria-hidden="true">
        <img src={artUrl} alt="" decoding="async" />
        <div className="egp-portrait-tone" />
      </div>

      <div className="egp-head gp-anim-swipe">
        <PersonaNamePlate
          number="EMINENZA"
          name={eminence.name}
          sub={eminence.army}
        />
      </div>

      <div className="egp-badges gp-anim-swipe d1">
        <PersonaStatBurst label="PRESENZA" value={eminence.initialPresence ?? 0} tone="accent" />
        <div className="egp-flags">
          {eminence.implemented ? (
            <span className="egp-flag egp-flag--ok">Giocabile</span>
          ) : (
            <span className="egp-flag egp-flag--mute">Effetti in corso</span>
          )}
          {eminence.nameProvisional && <span className="egp-flag egp-flag--warn">Nome provvisorio</span>}
          {eminence.initialPresenceProvisional && <span className="egp-flag egp-flag--warn">Presenza provvisoria</span>}
        </div>
      </div>

      <div className="egp-card-slot">
        <div className="egp-card-tilt">
          <div className="egp-card-back" aria-hidden="true" />
          <div style={{ width: STAGE_CARD_W, height: STAGE_CARD_H, position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                width: CARD_NATIVE_W,
                height: CARD_NATIVE_H,
                transform: `scale(${STAGE_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="em-card-shell egp-entry-shell"
                style={{ position: 'relative', width: CARD_NATIVE_W, height: CARD_NATIVE_H }}
              >
                <div
                  ref={cardRef}
                  className={['em-card', 'egp-em-card', cardArmClass].filter(Boolean).join(' ')}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: CARD_NATIVE_W,
                    height: CARD_NATIVE_H,
                    overflow: 'hidden',
                    borderRadius: '0 0 14px 14px',
                    '--em-acc': accent,
                    ...(cardArmClass ? {} : { animation: 'none' }),
                    ...(holdHidden ? { opacity: 0 } : {}),
                  }}
                >
                  <EminenceTarotCard
                    name={eminence.name}
                    army={eminence.army}
                    staticText={eminence.static?.name || ''}
                    presence={eminence.initialPresence ?? 0}
                    artUrl={artUrl}
                    accent={accent}
                    life="tilt"
                    intensity={1}
                    tiltEnabled={!cardArmClass}
                    idleOrbit={false}
                    artX={50}
                    artY={50}
                    artZoom={frame.zoom}
                    artFocusX={frame.focusX}
                    artFocusY={frame.focusY}
                  />
                </div>
                <span
                  ref={fxRef}
                  className={['em-arm-fx', fxArmClass].filter(Boolean).join(' ')}
                  style={entryLayerStyle(CARD_NATIVE_W, CARD_NATIVE_H)}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="egp-info">
        <div className="gp-panel gp-panel--light gp-anim-swipe d1">
          <div className="gp-panel-label">
            STATICO{eminence.static?.name ? ` · ${eminence.static.name.toUpperCase()}` : ''}
          </div>
          <p className="egp-static">{staticText || 'Nessuno statico.'}</p>
        </div>
        {eminence.abilities.map((ability, i) => (
          <div key={ability.id} className={`gp-panel egp-ability gp-anim-swipe d${Math.min(3, i + 2)}`}>
            <span className={`egp-cost ${ability.presenceDelta < 0 ? 'neg' : ''}`}>{formatDelta(ability.presenceDelta)}</span>
            <div>
              <div className="egp-ability-name">
                {ability.name || ability.id}
                {ability.nameProvisional ? <span className="egp-prov"> · nome provvisorio</span> : null}
              </div>
              <p className="egp-ability-text">{ability.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EminenceGalleryStyles() {
  return (
    <style>{`
      .egp-stage { position: absolute; inset: 0; }

      .egp-portrait {
        position: absolute; top: 0; bottom: 0; left: 250px; right: -40px; overflow: hidden;
        clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%);
        animation: gp-portrait-in .5s cubic-bezier(.2,1,.3,1) both;
      }
      .egp-portrait img {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; object-position: 50% 25%;
      }
      .egp-portrait::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, #000) 1.3px, transparent 1.8px) 0 0 / 8px 8px;
        -webkit-mask-image: linear-gradient(160deg, transparent 45%, #000 85%);
        mask-image: linear-gradient(160deg, transparent 45%, #000 85%);
        opacity: 0.7;
      }
      .egp-portrait-tone {
        position: absolute; inset: 0;
        background:
          linear-gradient(to right, rgba(5,5,7,0.85) 0%, rgba(5,5,7,0.1) 40%, transparent 60%),
          linear-gradient(to top, rgba(5,5,7,0.96) 0%, rgba(5,5,7,0.55) 45%, transparent 70%);
      }

      .egp-head { position: absolute; top: 4px; right: 0; z-index: 5; max-width: 820px; display: flex; justify-content: flex-end; }

      .egp-badges {
        position: absolute; top: 150px; left: 400px; z-index: 7;
        display: flex; align-items: center; gap: 14px; transform: rotate(-6deg);
      }
      .egp-badges .gp-burst { width: 128px; height: 128px; }
      .egp-flags { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
      .egp-flag {
        font-weight: 700; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase;
        padding: 3px 12px; transform: skewX(-14deg); background: #050507; color: #f5f3eb;
      }
      .egp-flag--ok { background: var(--accent); color: #050507; }
      .egp-flag--warn { background: #fbbf24; color: #050507; }
      .egp-flag--mute { background: #2a2a32; color: #cbd5e1; }

      .egp-card-slot { position: absolute; left: 10px; top: 60px; z-index: 6; }
      .egp-card-tilt { position: relative; transform: rotate(-4deg); }
      /* Ombra piena a parte: un filter sul contenitore spegne i blend della carta Arena. */
      .egp-card-back {
        position: absolute; inset: 0; transform: translate(14px, 14px);
        background: #050507; border-radius: 0 0 12px 12px;
        box-shadow: 0 0 50px color-mix(in srgb, var(--accent) 40%, transparent);
      }
      .egp-entry-shell { overflow: visible; }
      .egp-em-card { background: transparent; perspective: 900px; transform-style: preserve-3d; }
      .egp-em-card .eminence-tarot {
        position: absolute; inset: 0; width: 100%; height: 100%;
        --et-w: ${CARD_NATIVE_W}px; --et-h: ${CARD_NATIVE_H}px;
      }

      .egp-info {
        position: absolute; left: 400px; right: 0; bottom: 0; z-index: 5;
        display: flex; flex-direction: column; gap: 10px;
        max-height: 480px; overflow-y: auto; scrollbar-width: none;
      }
      .egp-info::-webkit-scrollbar { display: none; }
      .egp-static { margin: 0; font-weight: 600; font-size: 18px; line-height: 1.35; }
      .egp-ability { display: grid; grid-template-columns: 64px 1fr; gap: 14px; align-items: start; padding: 12px 22px 12px 14px; }
      .egp-cost {
        display: grid; place-items: center; height: 48px;
        background: var(--accent); color: #050507;
        font-weight: 700; font-style: italic; font-size: 26px;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .egp-cost.neg { background: #f5f3eb; }
      .egp-ability-name { font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em; color: #f5f3eb; }
      .egp-prov { font-weight: 500; font-size: 12px; color: #fbbf24; text-transform: none; letter-spacing: 0.04em; }
      .egp-ability-text { margin: 4px 0 0; font-size: 15px; line-height: 1.45; color: rgba(245,243,235,0.85); }
    `}</style>
  );
}
