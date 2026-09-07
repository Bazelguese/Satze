import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ARMY_COLORS, ARMY_GIFS } from '../data';
import { getCardImageUrl } from '../data/images';
import { getCardSprite } from '../utils/cardUtils';
import { getBattlefieldAnimationType } from '../data/battlefields';
import {
  preloadBattlefieldImages,
  resolvePublicAssetUrl,
  resolveFieldThumbUrl,
} from '../utils/preloadAssets';
import { CardReworkP4, CardBack } from './cards';
import { BattlefieldReveal } from './gallery/BattlefieldRevealAnimations';
import './cosmic/cosmic-transitions.css';

const WARMUP_MS = 2400;

/** Solo nero + barra (niente logo / testo LoadingScreen). */
function BlackProgressBar({ progress = 0 }) {
  const p = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 'min(320px, 56vw)',
          height: 3,
          background: 'rgba(255,255,255,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${p}%`,
            background: 'rgba(245,243,235,0.92)',
            transition: 'width 0.28s ease-out',
          }}
        />
      </div>
    </div>
  );
}

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function waitHostImages(host) {
  if (!host) return;
  const imgs = [...host.querySelectorAll('img')];
  await Promise.all(
    imgs.map((img) =>
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

function preloadUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') img.decode().then(resolve).catch(resolve);
      else resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Loading + warm-up dedicati all'ingresso in duello.
 * Precarica campi full-res della partita e riscalda animazioni HTML/CSS del duello
 * (place-fx, reveal, carte mano, pannelli) prima di shuffle/selectField.
 *
 * @param {boolean} [showChrome=true] Se false, nessun UI (warm-up sotto l'iris).
 *   Se true: solo nero + barra (mai la LoadingScreen completa).
 */
export function DuelLoadingOverlay({
  battlefields = [],
  playerCards = [],
  enemyCards = [],
  playerCardBack = null,
  enemyCardBack = null,
  playerArmy = null,
  enemyArmy = null,
  showChrome = true,
  onComplete,
}) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [progress, setProgress] = useState(0);
  const [fieldIdx, setFieldIdx] = useState(0);
  const [slamKey, setSlamKey] = useState(0);
  const [warmupReady, setWarmupReady] = useState(false);

  const fields = useMemo(
    () => (Array.isArray(battlefields) ? battlefields.filter(Boolean) : []),
    [battlefields]
  );

  const handCards = useMemo(() => {
    const p = Array.isArray(playerCards) ? playerCards.slice(0, 5) : [];
    const e = Array.isArray(enemyCards) ? enemyCards.slice(0, 5) : [];
    return [...p, ...e];
  }, [playerCards, enemyCards]);

  useEffect(() => {
    if (!warmupReady) return undefined;
    const id = setInterval(() => {
      setFieldIdx((i) => i + 1);
      setSlamKey((k) => k + 1);
    }, 480);
    return () => clearInterval(id);
  }, [warmupReady]);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      setProgress(100);
      requestAnimationFrame(() => {
        setTimeout(() => onCompleteRef.current?.(), 160);
      });
    };

    const run = async () => {
      setProgress(4);

      await preloadBattlefieldImages(fields, (_l, _t, percent) => {
        if (cancelled) return;
        setProgress(Math.min(55, Math.round((percent / 100) * 55)));
      });
      if (cancelled) return;

      const extraUrls = new Set();
      for (const card of handCards) {
        const sprite = getCardSprite(card);
        const url = getCardImageUrl(sprite?.type, sprite?.agentId);
        if (url) extraUrls.add(url);
      }
      if (playerCardBack) extraUrls.add(playerCardBack);
      if (enemyCardBack) extraUrls.add(enemyCardBack);
      const armyGifP = playerArmy && ARMY_GIFS[playerArmy];
      const armyGifE = enemyArmy && ARMY_GIFS[enemyArmy];
      if (armyGifP) extraUrls.add(resolvePublicAssetUrl(armyGifP) || armyGifP);
      if (armyGifE) extraUrls.add(resolvePublicAssetUrl(armyGifE) || armyGifE);
      extraUrls.add(resolvePublicAssetUrl('/Immagini_bg/CampoLOG_bg.webp'));
      extraUrls.add(resolvePublicAssetUrl('/Immagini_bg/CampoFC_bg.webp'));
      fields.forEach((f) => {
        const full = resolvePublicAssetUrl(f?.bgImage);
        if (full) extraUrls.add(full);
      });

      const extras = [...extraUrls].filter(Boolean);
      let loaded = 0;
      const total = Math.max(1, extras.length);
      for (let i = 0; i < extras.length; i += 8) {
        const batch = extras.slice(i, i + 8);
        await Promise.all(batch.map((u) => preloadUrl(u)));
        loaded += batch.length;
        if (!cancelled) setProgress(55 + Math.round((loaded / total) * 20));
      }
      if (cancelled) return;

      setWarmupReady(true);
      await nextFrame();
      await nextFrame();
      await waitHostImages(rootRef.current);
      if (cancelled) return;
      setProgress(78);

      const host = rootRef.current;
      const t0 = performance.now();
      while (!cancelled && performance.now() - t0 < WARMUP_MS) {
        await nextFrame();
        if (host) void host.offsetHeight;
        const p = 78 + Math.min(20, ((performance.now() - t0) / WARMUP_MS) * 20);
        setProgress(Math.round(p));
      }

      await waitHostImages(rootRef.current);
      if (cancelled) return;
      finish();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [fields, handCards, playerCardBack, enemyCardBack, playerArmy, enemyArmy]);

  const activeField = fields[fieldIdx % Math.max(1, fields.length)] || null;
  const revealType = activeField
    ? getBattlefieldAnimationType(activeField.id) || 'swirl'
    : 'swirl';
  const revealSrc = activeField
    ? resolvePublicAssetUrl(activeField.bgImage) || resolveFieldThumbUrl(activeField.bgImage)
    : null;
  const placeClass = slamKey % 2 === 0 ? 'play-slam' : 'play-rise';
  const fxClass = slamKey % 2 === 0 ? 'fx-slam' : 'fx-rise';
  const playerAccent = ARMY_COLORS[playerArmy]?.accent || '#a78bfa';

  const stage = warmupReady ? (
    <div
      ref={rootRef}
      aria-hidden
      className="satze-duel-warmup-stage"
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
        ['--acc']: playerAccent,
      }}
    >
      {/* Sfondi full-res dei campi della partita */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {fields.map((field, i) => {
          const src = resolvePublicAssetUrl(field?.bgImage);
          if (!src) return null;
          return (
            <img
              key={`duel-bg-${field.id ?? i}`}
              src={src}
              alt=""
              decoding="async"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: i === fieldIdx % fields.length ? 1 : 0,
              }}
            />
          );
        })}
      </div>

      {/* Reveal animato sul campo attivo */}
      {revealSrc ? (
        <div
          key={`duel-reveal-${fieldIdx}-${revealType}`}
          style={{ position: 'absolute', right: 40, top: 40, width: 560, height: 300, overflow: 'hidden' }}
        >
          <BattlefieldReveal imageSrc={revealSrc} animationType={revealType} />
        </div>
      ) : null}

      {/* Carte mano partita */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: 32,
          display: 'flex',
          gap: 10,
          transform: 'scale(0.42)',
          transformOrigin: 'top left',
        }}
      >
        {handCards.slice(0, 6).map((agent) => (
          <CardReworkP4 key={`duel-card-${agent.id}`} agent={agent} showBonus suppressAnimations />
        ))}
        {(playerCardBack || enemyCardBack) && (
          <>
            {playerCardBack ? (
              <div style={{ width: 230, height: 330 }}>
                <CardBack armies={[playerArmy].filter(Boolean)} backImage={playerCardBack} />
              </div>
            ) : null}
            {enemyCardBack ? (
              <div style={{ width: 230, height: 330 }}>
                <CardBack armies={[enemyArmy].filter(Boolean)} backImage={enemyCardBack} />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Place-fx ingresso carta */}
      <div
        key={`duel-place-${slamKey}`}
        className={fxClass}
        style={{ position: 'absolute', left: '42%', bottom: 48, width: 220, height: 300 }}
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
        <div className="imp-row-reveal" style={{ marginTop: 10, height: 36, background: '#2a1840' }} />
        <div className="imp-victory imp-victory-reveal" style={{ marginTop: 8, height: 28, background: '#3a2050' }} />
      </div>

      {/* Round 5 / filter blur keyframes */}
      <div className="ov on r5" style={{ position: 'absolute', inset: '18% 28%', display: 'block' }}>
        <div className="r5-ink">
          <div className="slab" />
          <div className="five">5</div>
          <div className="flash" />
          <div className="shard" style={{ top: '42%', width: '55%' }} />
        </div>
      </div>

      {/* Sweep cosmico ingresso */}
      <div className="cosmic-stage" style={{ position: 'absolute', inset: 0 }}>
        <div className="sweep-panel sweep-panel--a" />
        <div className="sweep-panel sweep-panel--b" />
        <div className="stage-backdrop" />
      </div>
    </div>
  ) : null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {stage}
      {showChrome ? <BlackProgressBar progress={progress} /> : null}
    </>,
    document.body
  );
}
