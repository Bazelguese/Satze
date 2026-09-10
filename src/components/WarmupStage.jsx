import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_AGENTS, ARMY_COLORS, ARMY_SETS } from '../data';
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../data/battlefields';
import { EMINENCES, EMINENCE_IDS_BY_ARMY_ORDER } from '../data/eminences.js';
import { getEminenceArtUrl } from '../data/eminenceArt';
import { resolveFieldThumbUrl } from '../utils/preloadAssets';
import {
  DROP_PLACE_FX,
  CLICK_PLACE_FX,
  PLACE_FX_STYLES,
  placeFxStyleClass,
} from '../utils/placeFxPreference';
import { pickDistinctCardBackPair } from '../utils/cardBackPicker';
import { CardReworkP4, CardBack } from './cards';
import { MenuAgentRain } from './menu/MenuAgentRain';
import { BattlefieldReveal } from './gallery/BattlefieldRevealAnimations';
import { EminenceTarotCard } from './eminenceLab/EminenceTarotCard';
import CardGallery from './menu/gallery/CardGallery';
import EminenceGallery from './menu/gallery/EminenceGallery';
import ArmySelectCinematic from './menu/cosmic/ArmySelectCinematic';
import { DeckConfirmTransition } from './menu/cosmic/DeckConfirmTransition';

import './cosmic/cosmic-transitions.css';
import './eminenceLab/eminenceArtLab.css';
import './shared/curvedParallaxImage.css';

const REVEAL_TYPES = [
  'swirl', 'frammenti', 'sipario', 'hud', 'onda', 'morsi',
  'occhio', 'sciame', 'rivolta', 'cerchi', 'artigli', 'ring',
];

const PLACE_WARMUP = [
  ...DROP_PLACE_FX.map((fx) => ({ play: `play-${fx}`, wrap: `fx-${fx}` })),
  ...CLICK_PLACE_FX.map((fx) => ({ play: `play-${fx}`, wrap: `fx-${fx}` })),
];

/**
 * Solo ciò che il boot deve riscaldare (menu / gallerie / transizioni).
 * Esclusi: campi full-res (duel load), catalogo builder (builder load),
 * GalleryCinematic full-res, DeckSelect / shuffle pesanti.
 */
const SCREEN_SCHEDULE = [
  { id: 'cardGallery', ms: 900 },
  { id: 'eminenceGallery', ms: 700 },
  { id: 'armySelect', ms: 700 },
  { id: 'transitions', ms: 800 },
];

const WARMUP_MS = 3600;
const WARMUP_HARD_CAP_MS = 5200;

const noop = () => {};

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/**
 * Warm-up menu: denso ma con hard-cap e senza asset già in carico altrove.
 */
export function WarmupStage({ onComplete, onProgress }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  const [revealIdx, setRevealIdx] = useState(0);
  const [slamKey, setSlamKey] = useState(0);
  const [screenId, setScreenId] = useState(SCREEN_SCHEDULE[0].id);
  const [confirmPhase, setConfirmPhase] = useState('animate');

  const agents = useMemo(() => {
    const byArmy = Object.keys(ARMY_SETS || {}).flatMap((army) => {
      const list = ARMY_SETS[army] || [];
      return list.slice(0, 1).map((c) => ({ ...c, army: c.army || army }));
    });
    if (byArmy.length) return byArmy;
    return ALL_AGENTS.filter((a) => a?.id != null).slice(0, 12);
  }, []);

  const backs = useMemo(() => {
    const pair = pickDistinctCardBackPair();
    return [pair.playerCardBack, pair.enemyCardBack].filter(Boolean);
  }, []);

  const fieldSamples = useMemo(() => {
    const list = Array.isArray(ALL_BATTLEFIELDS) ? ALL_BATTLEFIELDS : [];
    return REVEAL_TYPES.map((type) => {
      const field = list.find((f) => getBattlefieldAnimationType?.(f.id) === type) || list[0];
      return {
        type,
        src: resolveFieldThumbUrl(field?.bgImage) || field?.bgImage || null,
      };
    }).filter((x) => x.src);
  }, []);

  const eminenceSamples = useMemo(
    () =>
      EMINENCE_IDS_BY_ARMY_ORDER.map((id) => EMINENCES[id])
        .filter(Boolean)
        .slice(0, 8)
        .map((em) => ({
          em,
          artUrl: getEminenceArtUrl(em),
          accent: ARMY_COLORS[em.army]?.accent || '#c9a227',
        })),
    []
  );

  const galleryCounts = useMemo(
    () => ({
      agentCount: ALL_AGENTS.length,
      fieldCount: ALL_BATTLEFIELDS.length,
      eminenceCount: EMINENCE_IDS_BY_ARMY_ORDER.length,
    }),
    []
  );

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onProgressRef.current?.(100);
    onCompleteRef.current?.();
  };

  useEffect(() => {
    const id = setInterval(() => {
      setRevealIdx((i) => i + 1);
      setSlamKey((k) => k + 1);
    }, 400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      const step = SCREEN_SCHEDULE[i % SCREEN_SCHEDULE.length];
      setScreenId(step.id);
      timer = window.setTimeout(() => {
        i += 1;
        tick();
      }, step.ms);
    };
    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (screenId !== 'transitions') return undefined;
    setConfirmPhase('animate');
    const hold = window.setTimeout(() => setConfirmPhase('hold'), 450);
    const fade = window.setTimeout(() => setConfirmPhase('fadeOut'), 700);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(fade);
    };
  }, [screenId]);

  useEffect(() => {
    let cancelled = false;
    const hardCap = window.setTimeout(() => {
      if (!cancelled) finish();
    }, WARMUP_HARD_CAP_MS);

    const run = async () => {
      onProgressRef.current?.(10);
      await nextFrame();
      if (cancelled) return;
      onProgressRef.current?.(25);

      const host = rootRef.current;
      if (host) {
        void host.offsetHeight;
        host.querySelectorAll('*').forEach((el, i) => {
          if (i > 80) return;
          void el.offsetWidth;
        });
      }
      onProgressRef.current?.(40);

      // Non aspetta il decode di tutte le img delle gallerie (quel wait bloccava il boot).
      const t0 = performance.now();
      while (!cancelled && performance.now() - t0 < WARMUP_MS) {
        await nextFrame();
        if (host) void host.offsetHeight;
        const p = 40 + Math.min(55, ((performance.now() - t0) / WARMUP_MS) * 55);
        onProgressRef.current?.(Math.round(p));
      }

      if (cancelled) return;
      finish();
    };

    run().catch(() => {
      if (!cancelled) finish();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(hardCap);
    };
  }, []);

  const reveal = fieldSamples[revealIdx % Math.max(1, fieldSamples.length)];
  const place = PLACE_WARMUP[slamKey % PLACE_WARMUP.length];
  const styleKey = PLACE_FX_STYLES[slamKey % PLACE_FX_STYLES.length];
  const styleClass = placeFxStyleClass(styleKey);

  const screenLayer = (() => {
    if (screenId === 'cardGallery') {
      return (
        <CardGallery
          onBack={noop}
          galleryTab="agents"
          onGalleryTabChange={noop}
          {...galleryCounts}
        />
      );
    }
    if (screenId === 'eminenceGallery') {
      return (
        <EminenceGallery
          onBack={noop}
          galleryTab="eminences"
          onGalleryTabChange={noop}
          {...galleryCounts}
        />
      );
    }
    if (screenId === 'armySelect') {
      return <ArmySelectCinematic onSelect={noop} onBack={noop} />;
    }
    if (screenId === 'transitions') {
      return (
        <DeckConfirmTransition
          accent="#a78bfa"
          deckName="Warmup"
          showText
          visualPhase={confirmPhase}
          variant="duel"
        />
      );
    }
    return null;
  })();

  const stage = (
    <div
      ref={rootRef}
      aria-hidden
      className="satze-warmup-stage"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.02,
        contain: 'strict',
        background: '#05030a',
        transform: 'translateZ(0)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <MenuAgentRain />
      </div>

      <div className="satze-warmup-screens" style={{ position: 'absolute', inset: 0 }}>
        {screenLayer}
      </div>

      {/* Carte campione (compile CardReworkP4) — non tutto il catalogo builder */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          width: 860,
          transform: 'scale(0.28)',
          transformOrigin: 'top left',
        }}
      >
        {agents.map((agent) => (
          <CardReworkP4 key={`wu-front-${agent.id}`} agent={agent} showBonus suppressAnimations />
        ))}
        {agents.slice(0, 2).map((agent, i) => (
          <div key={`wu-back-${agent.id}-${i}`} style={{ width: 230, height: 330 }}>
            <CardBack armies={[agent.army]} backImage={backs[i % backs.length]} />
          </div>
        ))}
      </div>

      {/* Reveal campi — solo thumb (full-res = duel loading) */}
      {reveal?.src ? (
        <div
          key={`reveal-${revealIdx}-${reveal.type}`}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 400,
            height: 225,
            overflow: 'hidden',
          }}
        >
          <BattlefieldReveal imageSrc={reveal.src} animationType={reveal.type} />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          display: 'flex',
          gap: 6,
          transform: 'scale(0.22)',
          transformOrigin: 'bottom left',
        }}
      >
        {eminenceSamples.map((sample) => (
          <div key={`wu-em-${sample.em.id}`} style={{ width: 220, height: 330 }}>
            <EminenceTarotCard
              name={sample.em.name}
              army={sample.em.army}
              staticText={sample.em.static?.name || ''}
              presence={sample.em.initialPresence ?? 0}
              artUrl={sample.artUrl}
              accent={sample.accent}
              tiltEnabled={false}
              idleOrbit
            />
          </div>
        ))}
      </div>

      <div className="cosmic-stage" style={{ position: 'absolute', inset: 0 }}>
        <div className="sweep-panel sweep-panel--a" />
        <div className="sweep-panel sweep-panel--b" />
        <div className="stage-backdrop" />
        <div className="transition-opaque-plate" />
      </div>

      <div
        key={`place-${slamKey}`}
        className={`place-fx ${place.wrap}${styleClass}`}
        style={{ position: 'absolute', right: 56, bottom: 36, width: 200, height: 280 }}
      >
        <div className={`place-card ${place.play}`} style={{ width: '100%', height: '100%', background: '#1a1028' }}>
          <div className="place-shadow" />
          <div className="place-ring" />
          <div className="place-ring b" />
          <div className="place-flash" />
          <div className="place-echo" />
          <div className="place-echo e2" />
          <div className="place-echo e3" />
          <div className="place-edge" />
        </div>
        <div className="imp-row-reveal" style={{ marginTop: 12, height: 40, background: '#2a1840' }} />
        <div className="imp-victory imp-victory-reveal" style={{ marginTop: 8, height: 28, background: '#3a2050' }} />
      </div>

      <div className="ov on r5" style={{ '--acc': '#a78bfa', position: 'absolute', inset: '22% 32%', display: 'block' }}>
        <div className="r5-ink">
          <div className="slab" />
          <div className="five">5</div>
          <div className="flash" />
          <div className="shard" style={{ top: '40%', width: '60%' }} />
        </div>
      </div>

      <style>{`
        .satze-warmup-screens .v3c,
        .satze-warmup-screens .cgl,
        .satze-warmup-screens .egl,
        .satze-warmup-screens .dsk-cf-root {
          position: absolute !important;
          inset: 0 !important;
          z-index: 2 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(stage, document.body);
}
