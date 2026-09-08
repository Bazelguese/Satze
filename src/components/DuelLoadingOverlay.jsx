import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ARMY_COLORS, ARMY_GIFS } from '../data';
import { getEminence, getEminenceForArmy } from '../data/eminences.js';
import { getEminenceArtUrl } from '../data/eminenceArt';
import { getCardImageUrl } from '../data/images';
import { getCardSprite } from '../utils/cardUtils';
import { getBattlefieldAnimationType } from '../data/battlefields';
import {
  preloadBattlefieldImages,
  resolvePublicAssetUrl,
  resolveFieldThumbUrl,
} from '../utils/preloadAssets';
import {
  DROP_PLACE_FX,
  CLICK_PLACE_FX,
  PLACE_FX_STYLES,
  placeFxStyleClass,
} from '../utils/placeFxPreference';
import { CardReworkP4, CardBack, GameCard } from './cards';
import { BattlefieldReveal } from './gallery/BattlefieldRevealAnimations';
import { EminenzaZone } from './eminence/EminenzaZone';
import { EminenceMarkFlight } from './eminence/EminenceMarkFlight';
import { DuelClashAuroraSequence } from './battle/DuelClashAuroraSequence';
import './cosmic/cosmic-transitions.css';
import './eminenceLab/eminenceArtLab.css';

const WARMUP_MS = 3800;

const PLACE_WARMUP = [
  ...DROP_PLACE_FX.map((fx) => ({ fx, play: `play-${fx}`, wrap: `fx-${fx}` })),
  ...CLICK_PLACE_FX.map((fx) => ({ fx, play: `play-${fx}`, wrap: `fx-${fx}` })),
];

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

function describeEminence(id) {
  const em = getEminence(id);
  if (!em) return null;
  return {
    id: em.id,
    name: em.name,
    army: em.army,
    static: em.static,
    artUrl: getEminenceArtUrl(em),
    accent: ARMY_COLORS[em.army]?.accent || '#c9e238',
  };
}

/**
 * Loading + warm-up dedicati all'ingresso in duello:
 * campi, carte, place-fx agenti, clash, Eminenze (ingresso + announce + mark flight).
 */
export function DuelLoadingOverlay({
  battlefields = [],
  playerCards = [],
  enemyCards = [],
  playerCardBack = null,
  enemyCardBack = null,
  playerArmy = null,
  enemyArmy = null,
  eminenceMatchState = null,
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
  const [clashPhase, setClashPhase] = useState(0);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [markFlight, setMarkFlight] = useState(null);

  const fields = useMemo(
    () => (Array.isArray(battlefields) ? battlefields.filter(Boolean) : []),
    [battlefields]
  );

  const handCards = useMemo(() => {
    const p = Array.isArray(playerCards) ? playerCards.slice(0, 5) : [];
    const e = Array.isArray(enemyCards) ? enemyCards.slice(0, 5) : [];
    return [...p, ...e];
  }, [playerCards, enemyCards]);

  const playerEminence = useMemo(() => {
    const fromMatch = describeEminence(eminenceMatchState?.player?.eminenceId);
    if (fromMatch) return fromMatch;
    const byArmy = getEminenceForArmy(playerArmy);
    return byArmy ? describeEminence(byArmy.id) : null;
  }, [eminenceMatchState?.player?.eminenceId, playerArmy]);
  const enemyEminence = useMemo(() => {
    const fromMatch = describeEminence(eminenceMatchState?.enemy?.eminenceId);
    if (fromMatch) return fromMatch;
    const byArmy = getEminenceForArmy(enemyArmy);
    return byArmy ? describeEminence(byArmy.id) : null;
  }, [eminenceMatchState?.enemy?.eminenceId, enemyArmy]);

  const clashResult = useMemo(() => {
    const playerAgent = playerCards?.[0] || handCards[0];
    const enemyAgent = enemyCards?.[0] || handCards[1] || handCards[0];
    if (!playerAgent || !enemyAgent) return null;
    return {
      playerAgent,
      enemyAgent,
      winner: 'player',
      playerAssault: 12,
      enemyAssault: 9,
      damageDealt: 3,
      playerFocusUsed: 2,
      enemyFocusUsed: 1,
      playerPower: playerAgent.power,
      enemyPower: enemyAgent.power,
      playerDamage: playerAgent.damage,
      enemyDamage: enemyAgent.damage,
    };
  }, [playerCards, enemyCards, handCards]);

  useEffect(() => {
    if (!warmupReady) return undefined;
    const id = setInterval(() => {
      setFieldIdx((i) => i + 1);
      setSlamKey((k) => k + 1);
    }, 420);
    return () => clearInterval(id);
  }, [warmupReady]);

  useEffect(() => {
    if (!warmupReady) return undefined;
    setClashPhase(0);
    const arm = window.setTimeout(() => setClashPhase(4), 120);
    const announceOn = window.setTimeout(() => setShowAnnounce(true), 500);
    const announceOff = window.setTimeout(() => setShowAnnounce(false), 1600);
    const flightOn = window.setTimeout(() => {
      setMarkFlight({
        id: `warmup-flight-${Date.now()}`,
        kind: 'prey',
        accent: playerEminence?.accent || '#c9e238',
        from: { type: 'announce', side: 'player' },
        to: { type: 'card', side: 'player' },
      });
    }, 700);
    const flightOff = window.setTimeout(() => setMarkFlight(null), 2200);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(announceOn);
      window.clearTimeout(announceOff);
      window.clearTimeout(flightOn);
      window.clearTimeout(flightOff);
    };
  }, [warmupReady, playerEminence?.accent]);

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
      setProgress(3);

      await preloadBattlefieldImages(fields, (_l, _t, percent) => {
        if (cancelled) return;
        setProgress(Math.min(40, Math.round((percent / 100) * 40)));
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
      if (playerEminence?.artUrl) extraUrls.add(playerEminence.artUrl);
      if (enemyEminence?.artUrl) extraUrls.add(enemyEminence.artUrl);
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
        if (!cancelled) setProgress(40 + Math.round((loaded / total) * 20));
      }
      if (cancelled) return;

      setWarmupReady(true);
      await nextFrame();
      await nextFrame();
      await waitHostImages(rootRef.current);
      if (cancelled) return;
      setProgress(68);

      const host = rootRef.current;
      const t0 = performance.now();
      while (!cancelled && performance.now() - t0 < WARMUP_MS) {
        await nextFrame();
        if (host) void host.offsetHeight;
        const p = 68 + Math.min(30, ((performance.now() - t0) / WARMUP_MS) * 30);
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
  }, [
    fields,
    handCards,
    playerCardBack,
    enemyCardBack,
    playerArmy,
    enemyArmy,
    playerEminence?.artUrl,
    enemyEminence?.artUrl,
  ]);

  const activeField = fields[fieldIdx % Math.max(1, fields.length)] || null;
  const revealType = activeField
    ? getBattlefieldAnimationType(activeField.id) || 'swirl'
    : 'swirl';
  const revealSrc = activeField
    ? resolvePublicAssetUrl(activeField.bgImage) || resolveFieldThumbUrl(activeField.bgImage)
    : null;

  const place = PLACE_WARMUP[slamKey % PLACE_WARMUP.length];
  const styleKey = PLACE_FX_STYLES[slamKey % PLACE_FX_STYLES.length];
  const styleClass = placeFxStyleClass(styleKey);
  const playerAccent = playerEminence?.accent || ARMY_COLORS[playerArmy]?.accent || '#a78bfa';

  const warmupAnnounce = showAnnounce && playerEminence
    ? {
        id: 'duel-warmup-announce',
        kind: 'setup',
        side: 'player',
        name: playerEminence.static?.name || playerEminence.name,
        sourceName: playerEminence.name,
        text: playerEminence.static?.text || 'Preparazione Scontro',
        phaseLabel: 'Preparazione',
        phaseDetail: null,
      }
    : null;

  const stage = warmupReady ? (
    <div
      ref={rootRef}
      aria-hidden
      className="satze-duel-warmup-stage satze-scene dep-2 mov-1 sty-a"
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
      {/* Sfondi full-res */}
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

      {revealSrc ? (
        <div
          key={`duel-reveal-${fieldIdx}-${revealType}`}
          style={{ position: 'absolute', right: 24, top: 24, width: 520, height: 280, overflow: 'hidden' }}
        >
          <BattlefieldReveal imageSrc={revealSrc} animationType={revealType} />
        </div>
      ) : null}

      {/* Carte mano */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          top: 24,
          display: 'flex',
          gap: 8,
          transform: 'scale(0.38)',
          transformOrigin: 'top left',
        }}
      >
        {handCards.slice(0, 6).map((agent) => (
          <CardReworkP4 key={`duel-card-${agent.id}`} agent={agent} showBonus suppressAnimations />
        ))}
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
      </div>

      {/* Tutti i place-fx agenti + stili */}
      <div
        key={`duel-place-${slamKey}`}
        className={`place-fx ${place.wrap}${styleClass}`}
        data-field-agent="player"
        style={{ position: 'absolute', left: '38%', bottom: 40, width: 200, height: 280 }}
      >
        <div className={`place-card ${place.play}`} style={{ width: '100%', height: '100%' }}>
          {handCards[0] ? (
            <GameCard agent={handCards[0]} showBonus />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#1a1028' }} />
          )}
          <div className="place-shadow" />
          <div className="place-ring" />
          <div className="place-ring b" />
          <div className="place-flash" />
          <div className="place-echo" />
          <div className="place-echo e2" />
          <div className="place-echo e3" />
          <div className="place-edge" />
        </div>
        <div className="imp-row-reveal" style={{ marginTop: 8, height: 32, background: '#2a1840' }} />
        <div className="imp-victory imp-victory-reveal" style={{ marginTop: 6, height: 24, background: '#3a2050' }} />
      </div>

      <div
        data-field-agent="enemy"
        style={{ position: 'absolute', right: '12%', top: 120, width: 160, height: 220, opacity: 0.5 }}
      >
        <div className="place-card" style={{ width: '100%', height: '100%', background: '#1a1028' }} />
      </div>

      {/* Clash Aurora */}
      {clashResult && clashPhase >= 4 ? (
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.55)', transformOrigin: 'center center' }}>
          <DuelClashAuroraSequence
            key={`clash-${warmupReady}-${clashPhase}`}
            battleResult={clashResult}
            duelPhase={clashPhase}
            duelEffectStep={1}
            variant="v1"
            isZoomed
          />
        </div>
      ) : null}

      {/* Zone Eminenza (ingresso carta + announce) */}
      {playerEminence ? (
        <div
          data-side="player"
          style={{ position: 'absolute', left: 40, bottom: 40, width: 280, height: 420, transform: 'scale(0.72)', transformOrigin: 'bottom left' }}
        >
          <EminenzaZone
            side="player"
            eminence={playerEminence}
            presence={eminenceMatchState?.player?.presence ?? 3}
            accent={playerEminence.accent}
            announce={warmupAnnounce}
            hideRail
            announceAutoDismiss={false}
          />
        </div>
      ) : null}
      {enemyEminence ? (
        <div
          data-side="enemy"
          style={{ position: 'absolute', right: 40, bottom: 40, width: 280, height: 420, transform: 'scale(0.72)', transformOrigin: 'bottom right' }}
        >
          <EminenzaZone
            side="enemy"
            eminence={enemyEminence}
            presence={eminenceMatchState?.enemy?.presence ?? 3}
            accent={enemyEminence.accent}
            hideRail
            announceAutoDismiss={false}
          />
        </div>
      ) : null}

      {/* Ancore mark-flight */}
      <div data-em-hp="player" style={{ position: 'absolute', left: 200, top: 80, width: 24, height: 24 }} />
      <div data-em-hp="enemy" style={{ position: 'absolute', right: 200, top: 80, width: 24, height: 24 }} />
      <div data-field-slot="0" style={{ position: 'absolute', left: '50%', top: '45%', width: 40, height: 40 }} />

      {markFlight ? (
        <EminenceMarkFlight flight={markFlight} onComplete={() => setMarkFlight(null)} />
      ) : null}

      {/* Round 5 / filter blur */}
      <div className="ov on r5" style={{ position: 'absolute', inset: '22% 30%', display: 'block' }}>
        <div className="r5-ink">
          <div className="slab" />
          <div className="five">5</div>
          <div className="flash" />
          <div className="shard" style={{ top: '42%', width: '55%' }} />
        </div>
      </div>

      {/* Sweep cosmico */}
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
