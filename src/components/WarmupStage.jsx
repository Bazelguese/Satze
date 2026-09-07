import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_AGENTS, ARMY_COLORS } from '../data';
import { EMINENCES } from '../data/eminences.js';
import { getEminenceArtUrl } from '../data/eminenceArt';
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../data/battlefields';
import { resolveFieldThumbUrl } from '../utils/preloadAssets';
import { CardReworkP4, CardBack } from './cards';
import { MenuAgentRain } from './menu/MenuAgentRain';
import { BattlefieldReveal } from './gallery/BattlefieldRevealAnimations';
import { EminenceTarotCard } from './eminenceLab/EminenceTarotCard';
import { pickDistinctCardBackPair } from '../utils/cardBackPicker';

import './cosmic/cosmic-transitions.css';
import './eminenceLab/eminenceArtLab.css';
import './shared/curvedParallaxImage.css';

const REVEAL_TYPES = [
  'swirl', 'frammenti', 'sipario', 'hud', 'onda', 'morsi',
  'occhio', 'sciame', 'rivolta', 'cerchi', 'artigli', 'ring',
];

const WARMUP_MS = 3200;

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function waitHostImages(host) {
  if (!host) return;
  const imgs = [...host.querySelectorAll('img')];
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? img.decode?.().catch(() => {}) || Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener('load', () => {
                img.decode?.().then(resolve).catch(resolve);
              }, { once: true });
              img.addEventListener('error', resolve, { once: true });
            })
    )
  );
}

/**
 * Stage densissimo sotto la LoadingScreen: monta gli stessi pezzi grafici
 * che hitchano al primo uso (pioggia 3D, carte, reveal, foil Eminenza, duello CSS)
 * per forzare compile shader / layer GPU / decode prima del gameplay.
 */
export function WarmupStage({ onComplete, onProgress }) {
  const rootRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;
  const [revealIdx, setRevealIdx] = useState(0);
  const [slamKey, setSlamKey] = useState(0);

  const agents = useMemo(() => {
    const withArt = ALL_AGENTS.filter((a) => a?.id != null).slice(0, 8);
    return withArt.length ? withArt : ALL_AGENTS.slice(0, 8);
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

  const eminenceSample = useMemo(() => {
    const em = EMINENCES.apex_sole_verde || Object.values(EMINENCES)[0];
    if (!em) return null;
    return {
      em,
      artUrl: getEminenceArtUrl(em),
      accent: ARMY_COLORS[em.army]?.accent || '#c9a227',
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealIdx((i) => i + 1);
      setSlamKey((k) => k + 1);
    }, 520);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      onProgressRef.current?.(5);
      await nextFrame();
      await nextFrame();
      onProgressRef.current?.(15);

      const host = rootRef.current;
      if (host) {
        void host.offsetHeight;
        host.querySelectorAll('*').forEach((el, i) => {
          if (i > 80) return;
          void el.offsetWidth;
        });
      }
      onProgressRef.current?.(30);

      await waitHostImages(host);
      if (cancelled) return;
      onProgressRef.current?.(55);

      const t0 = performance.now();
      while (!cancelled && performance.now() - t0 < WARMUP_MS) {
        await nextFrame();
        if (host) void host.offsetHeight;
        const p = 55 + Math.min(40, ((performance.now() - t0) / WARMUP_MS) * 40);
        onProgressRef.current?.(Math.round(p));
      }

      await waitHostImages(rootRef.current);
      if (cancelled) return;
      onProgressRef.current?.(100);
      onCompleteRef.current?.();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const reveal = fieldSamples[revealIdx % Math.max(1, fieldSamples.length)];
  const placeClass = slamKey % 2 === 0 ? 'play-slam' : 'play-rise';
  const fxClass = slamKey % 2 === 0 ? 'fx-slam' : 'fx-rise';

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
        // Quasi invisibile ma ancora composto dalla GPU (opacity 0 a volte skippa i layer)
        opacity: 0.02,
        contain: 'strict',
        background: '#05030a',
        // Canvas logico come il gioco
        transform: 'translateZ(0)',
      }}
    >
      {/* Cascata menu — stesso componente di produzione */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MenuAgentRain />
      </div>

      {/* Glow / blend / blur tipici del menu */}
      <div
        style={{
          position: 'absolute',
          left: '40%',
          top: '35%',
          width: 920,
          height: 880,
          transform: 'translate(-50%,-50%)',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(192,38,211,0.24) 0%, rgba(88,28,135,0.2) 30%, transparent 64%)',
          filter: 'blur(26px)',
          animation: 'satze-warmup-pulse-glow 1.2s ease-in-out infinite',
          color: '#c026d3',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(#c026d3 1px, transparent 1.4px)',
          backgroundSize: '8px 8px',
          mixBlendMode: 'screen',
        }}
      />

      {/* Carte vere (CardReworkP4) — first paint costoso */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 40,
          display: 'flex',
          gap: 16,
          transform: 'scale(0.55)',
          transformOrigin: 'top left',
        }}
      >
        {agents.slice(0, 4).map((agent) => (
          <CardReworkP4 key={`wu-front-${agent.id}`} agent={agent} showBonus suppressAnimations />
        ))}
        {agents.slice(0, 2).map((agent, i) => (
          <div key={`wu-back-${agent.id}`} style={{ width: 230, height: 330 }}>
            <CardBack armies={[agent.army]} backImage={backs[i % backs.length]} />
          </div>
        ))}
      </div>

      {/* Reveal campi — cicla i 12 tipi */}
      {reveal?.src ? (
        <div
          key={`reveal-${revealIdx}-${reveal.type}`}
          style={{
            position: 'absolute',
            right: 24,
            top: 24,
            width: 480,
            height: 270,
            overflow: 'hidden',
          }}
        >
          <BattlefieldReveal imageSrc={reveal.src} animationType={reveal.type} />
        </div>
      ) : null}

      {/* Eminenza tarocco + foil path */}
      {eminenceSample ? (
        <div style={{ position: 'absolute', left: 48, bottom: 24, width: 220, height: 330 }}>
          <EminenceTarotCard
            name={eminenceSample.em.name}
            army={eminenceSample.em.army}
            staticText={eminenceSample.em.static?.name || ''}
            presence={eminenceSample.em.initialPresence ?? 0}
            artUrl={eminenceSample.artUrl}
            accent={eminenceSample.accent}
            tiltEnabled={false}
            idleOrbit
          />
        </div>
      ) : null}

      {/* Transizione cosmica */}
      <div className="cosmic-stage" style={{ position: 'absolute', inset: 0 }}>
        <div className="sweep-panel sweep-panel--a" />
        <div className="sweep-panel sweep-panel--b" />
        <div className="stage-backdrop" />
        <div className="transition-opaque-plate" />
        <div className="load-text">SATZE</div>
      </div>

      {/* Place-fx duello (ingresso carta) */}
      <div
        key={`place-${slamKey}`}
        className={`${fxClass}`}
        style={{ position: 'absolute', right: 80, bottom: 40, width: 200, height: 280 }}
      >
        <div className={`place-card ${placeClass}`} style={{ width: '100%', height: '100%', background: '#1a1028' }}>
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

      {/* Round 5 / blur filter keyframes */}
      <div className="ov on r5" style={{ '--acc': '#a78bfa', position: 'absolute', inset: '20% 30%', display: 'block' }}>
        <div className="r5-ink">
          <div className="slab" />
          <div className="five">5</div>
          <div className="flash" />
          <div className="shard" style={{ top: '40%', width: '60%' }} />
        </div>
      </div>

      <style>{`
        @keyframes satze-warmup-pulse-glow {
          0%,100% { filter: drop-shadow(0 0 8px currentColor) blur(22px); }
          50% { filter: drop-shadow(0 0 18px currentColor) blur(28px); }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(stage, document.body);
}
