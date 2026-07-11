import React from 'react';
import { GameCard } from '../cards/GameCard';
import { Icon } from '../ui/Icon';
import { ARMY_COLORS } from '../../data';
import { ARMY_BONUSES } from '../../data/armies.js';
import { getDuelVisualDisplay, modifiedStatOrNull } from './duelVisualDisplay.js';
import { computeDynamicClashVfx } from '../../config/duelVisualConfig.js';
import {
  getDuelAgentBaseScale,
  getDuelAgentCenterY,
  getEnemyClashAnchorX,
  getPlayerClashAnchorX,
  getScaledClashStartOffset,
} from '../../config/duelClashLayout.js';
import { getFocusCoinGlowColor } from '../../utils/focusCoinGlow';
import { DUEL_ACCENTS, getArmyAccent } from '../../theme/duelAccents.js';

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const globalOrbitNowSec = () =>
  typeof performance !== 'undefined' ? performance.now() / 1000 : 0;

/**
 * Un solo rAF: aggiorna ref animazione + wrapper carte ogni frame a 60fps;
 * setState ogni frame per VFX sincronizzati (carte via ref DOM, senza re-render GameCard).
 */
function useClashAnimationLoop(durationMs, runId, onFrame) {
  const onFrameRef = React.useRef(onFrame);
  onFrameRef.current = onFrame;
  const animRef = React.useRef({ t: 0, orbitSec: globalOrbitNowSec() });
  const [vfxTick, setVfxTick] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    let start = null;
    animRef.current = { t: 0, orbitSec: globalOrbitNowSec() };
    setVfxTick((v) => v + 1);

    const tick = (ts) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      const orbitSec = ts / 1000;
      animRef.current = { t, orbitSec };
      onFrameRef.current(t, orbitSec);
      setVfxTick((v) => v + 1);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, runId]);

  return { animRef, vfxTick };
}

function useSequenceRun(duelPhase) {
  const [runId, setRunId] = React.useState(0);
  const [active, setActive] = React.useState(duelPhase >= 4);
  const prevRef = React.useRef(duelPhase);
  React.useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = duelPhase;
    if (prev < 4 && duelPhase >= 4) {
      setRunId((v) => v + 1);
      setActive(true);
    }
    if (duelPhase < 4) {
      setActive(false);
    }
  }, [duelPhase]);
  return { runId, active, setActive };
}

function getArmyVisual(agent, fallback) {
  const accent = getArmyAccent(agent, fallback || DUEL_ACCENTS.armyFallback);
  return {
    color: accent,
    glow: `${accent}88`,
    name: (agent?.army || 'Armata').toUpperCase(),
    key: agent?.army || 'army',
  };
}

function duelBonusBaseInactive(agent, hasBonus, bonusNotTriggered, bonusBlocked, bonusCopied) {
  if (!agent?.army || !ARMY_BONUSES[agent.army]) return false;
  if (bonusCopied || bonusBlocked) return false;
  return !hasBonus && !bonusNotTriggered;
}

function getClashAbilityCurrentValue(battleResult, isPlayer) {
  if (!battleResult) return null;
  if (isPlayer) {
    return battleResult.playerAbilityCurrentValue ?? battleResult.playerAbilityValue ?? null;
  }
  return battleResult.enemyAbilityCurrentValue ?? battleResult.enemyAbilityValue ?? null;
}

function CinemaBars({ t, intensity = 1 }) {
  const reveal = smoothstep(0, 0.12, t) - smoothstep(0.88, 1, t);
  const h = 80 * intensity * reveal;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: h,
          background: '#000',
          zIndex: 90,
          borderBottom: '1px solid rgba(56,189,248,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: h,
          background: '#000',
          zIndex: 90,
          borderTop: '1px solid rgba(56,189,248,0.15)',
        }}
      />
    </>
  );
}

function FlashOverlay({ opacity, color = '#fff' }) {
  return <div style={{ position: 'absolute', inset: 0, background: color, opacity, zIndex: 70, mixBlendMode: 'screen' }} />;
}

function Sigil({ armyVisual, size = 520 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1px solid ${armyVisual.color}`,
        boxShadow: `0 0 22px ${armyVisual.glow}`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Icon name={armyVisual.key} type="army" size={Math.round(size * 0.42)} color={armyVisual.color} />
    </div>
  );
}

function ChargeRays({
  x,
  color,
  secondaryColor = null,
  strength,
  count = 8,
  spin = 0,
  beamWidth = 3,
  fade = 1,
  offsetX = 0,
  offsetY = 0,
  centerY = '50%',
  zIndex = 120,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: `calc(${x} + ${offsetX}px)`,
        transform: `translate(-50%, calc(-50% + ${offsetY}px))`,
        pointerEvents: 'none',
        zIndex,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + strength * 0.5 + spin * (i % 2 === 0 ? 1 : -1) * 0.28;
        const len = 90 + strength * 180;
        // Inside -> outside reveal: rays start near core and expand outward.
        const dist = 70 + strength * 120;
        const x1 = Math.cos(a) * dist;
        const y1 = Math.sin(a) * dist;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: beamWidth,
              transformOrigin: '0 50%',
              transform: `rotate(${(a * 180) / Math.PI}deg)`,
              background: secondaryColor
                ? `linear-gradient(90deg, ${secondaryColor}dd, ${color}cc 45%, transparent)`
                : `linear-gradient(90deg, ${color}cc, transparent)`,
              opacity: 0.8 * fade,
              boxShadow: `0 0 10px ${color}, 0 0 16px ${secondaryColor || color}`,
            }}
          />
        );
      })}
    </div>
  );
}

function AgentAura({ x, y, scale = 1, color, mode, intensity = 1, centerY = '50%', zIndex = 128 }) {
  const size = 220 * scale;
  if (mode === 'off') return null;
  const auraOpacity = clamp(intensity, 0, 1);
  if (auraOpacity <= 0.005) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px))`,
        zIndex,
        width: size,
        height: size,
        borderRadius: '50%',
        pointerEvents: 'none',
        opacity: auraOpacity,
        background:
          mode === 'helix'
            ? `conic-gradient(from ${y.t * 260}deg, transparent 0deg, ${color}99 60deg, transparent 130deg, ${color}66 190deg, transparent 360deg)`
            : mode === 'arc'
              ? `repeating-conic-gradient(from ${y.t * 200}deg, ${color}88 0deg 10deg, transparent 10deg 24deg)`
              : `radial-gradient(circle, ${color}55 0%, ${color}22 45%, transparent 75%)`,
        boxShadow: `0 0 ${28 + intensity * 18}px ${color}`,
      }}
    />
  );
}

function FocusChargeAura({ x, y, scale = 1, glowColor, intensity = 1, centerY = '50%', zIndex = 126 }) {
  const opacity = clamp(intensity, 0, 1);
  if (!glowColor || opacity <= 0.01) return null;
  const size = 250 * scale;
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px))`,
        width: size,
        height: size,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex,
        opacity,
        background: `radial-gradient(circle, ${glowColor.main}33 0%, ${glowColor.secondary}22 44%, transparent 72%)`,
        boxShadow: `0 0 ${26 + opacity * 34}px ${glowColor.main}`,
      }}
    />
  );
}

function VaTag({ x, value, winner, t, motion, centerY = '50%' }) {
  const reveal = smoothstep(0.3, 0.55, t);
  const winPulse = winner ? 1 + Math.sin(t * 24) * 0.06 * smoothstep(0.6, 0.9, t) : 1;
  if (reveal < 0.02) return null;
  const mx = Number.isFinite(motion?.x) ? motion.x : 0;
  const my = Number.isFinite(motion?.y) ? motion.y : 0;
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${mx}px), calc(270px + ${my}px)) scale(${0.6 + reveal * 0.4 * winPulse})`,
        opacity: reveal,
        zIndex: 92,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(251, 191, 36, 0.95)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
            textShadow: '0 0 8px rgba(0,0,0,0.8)',
          }}
        >
          Valore Assalto
        </div>
        <div
          style={{
            fontSize: winner ? 36 : 32,
            fontWeight: 900,
            color: winner ? DUEL_ACCENTS.vaWinner : DUEL_ACCENTS.vaLoser,
            textShadow: winner ? `0 0 20px ${DUEL_ACCENTS.vaWinner}, 0 0 12px rgba(255,179,71,0.5), 0 2px 4px #000` : '0 2px 4px #000',
            WebkitTextStroke: '0px transparent',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function AgentOrbitSparks({ t, color, x, y, centerY = '50%', zIndex = 128 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px))`,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2 + t * 4.5;
        const r = 56 + Math.sin(t * 10 + i) * 12 + smoothstep(0.1, 0.7, t) * 105;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        const s = 3 + (i % 3);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: '50%',
              background: color,
              opacity: 0.8 * (1 - t * 0.7),
              boxShadow: `0 0 ${s * 4}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}

function AgentAfterImage({ t, x, y, rot, scale, color, centerY = '50%', zIndex = 126 }) {
  const on = smoothstep(0.2, 0.6, t) * (1 - smoothstep(0.78, 0.99, t));
  if (on <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px)) rotate(${rot}deg) scale(${scale})`,
        opacity: on,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${color}`,
            borderRadius: '0.55rem',
            transform: `translate(${(i + 1) * -8}px, ${(i + 1) * 2}px) scale(${1 - i * 0.03})`,
            opacity: on * (0.3 - i * 0.08),
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

function focusColorForCount(focusCount, t) {
  return getFocusCoinGlowColor(focusCount, 1, t * 180, {
    rainbowHueMul12: 1.2,
    rainbowHueMul13: 1.3,
    rainbowHueMul14: 1.4,
  });
}

function toSoftFill(mainColor) {
  if (typeof mainColor !== 'string') return 'rgba(234, 179, 8, 0.2)';
  if (mainColor.startsWith('rgba(')) {
    return mainColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3,0.2)');
  }
  if (mainColor.startsWith('rgb(')) {
    return mainColor.replace('rgb(', 'rgba(').replace(')', ',0.2)');
  }
  return mainColor;
}

function FocusCoinToken({ x, y, size = 40, alpha = 1, glowColor, armyKey }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1px solid ${glowColor?.main || 'rgba(234, 179, 8, 0.5)'}`,
        backgroundColor: toSoftFill(glowColor?.main),
        boxShadow: `0 0 8px ${glowColor?.main || 'rgba(234,179,8,0.8)'}`,
        opacity: alpha,
        transform: 'translate(-50%, -50%)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {armyKey ? <Icon name={armyKey} type="army" size={24} /> : <Icon name="coin" type="cardIcon" size={24} />}
    </div>
  );
}

function FocusCoinFx({ x, y, t, color, armyKey, focusCount = 1, mode = 'orbit', side = 'right', winner = false, centerY = '50%', zIndex = 129, layer = 'both' }) {
  const entry = smoothstep(0.08, 0.4, t);
  const sustain = 1 - smoothstep(0.82, 1, t);
  const visible = entry * sustain;
  if (visible <= 0.01) return null;

  const coins = mode === 'burst' ? 14 : mode === 'stream' ? 12 : 10;
  const dir = side === 'right' ? -1 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px))`,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: coins }).map((_, i) => {
        if (layer === 'behind' && i % 2 !== 0) return null;
        if (layer === 'front' && i % 2 === 0) return null;
        const seed = i / coins;
        const spin = t * (mode === 'orbit' ? 6.5 : mode === 'stream' ? 4.2 : 8.6) + i * 0.7;
        const rBase = mode === 'burst' ? 42 + smoothstep(0.42, 0.7, t) * 74 : 58 + smoothstep(0.1, 0.55, t) * 36;
        const streamX = mode === 'stream' ? dir * (24 + seed * 86) * smoothstep(0.18, 0.78, t) : 0;
        const streamY = mode === 'stream' ? Math.sin(spin * 1.8 + i) * (10 + seed * 12) : 0;
        const orbitX = Math.cos(spin + seed * Math.PI * 2) * rBase;
        const orbitY = Math.sin(spin * 1.2 + seed * Math.PI * 2) * (rBase * 0.55);
        const burstKick = mode === 'burst' ? smoothstep(0.5, 0.82, t) * (i % 2 === 0 ? 1 : -1) * 18 : 0;
        const px = orbitX + streamX + burstKick;
        const py = orbitY + streamY;
        const size = mode === 'burst' ? 34 - (i % 3) * 3 : 30 - (i % 3) * 3;
        const alpha = clamp((0.3 + visible * 0.9) * (winner ? 1.08 : 0.9) * (1 - seed * 0.35), 0, 1);
        const glowColor = focusColorForCount(focusCount, t + seed * 0.1);
        return (
          <FocusCoinToken
            key={`${mode}-${i}`}
            x={px}
            y={py}
            size={size}
            alpha={alpha}
            glowColor={glowColor}
            armyKey={armyKey}
          />
        );
      })}
    </div>
  );
}

function FocusCoinOrbitCollapseFx({
  x,
  y,
  t,
  orbitSec = 0,
  focusCount = 0,
  side = 'right',
  armyVisual,
  centerY = '50%',
  zIndexFront = 180,
}) {
  const count = clamp(Math.round(Number(focusCount) || 0), 0, 14);
  if (count <= 0) return null;

  const palette = focusColorForCount(count, t);
  const orbitSpeed = 1.4 + count * 0.22; // More FC -> faster spin.

  return (
    <div
      style={{
        position: 'absolute',
        top: centerY,
        left: x,
        transform: `translate(calc(-50% + ${y.x}px), calc(-50% + ${y.y}px))`,
        zIndex: zIndexFront,
        pointerEvents: 'none',
      }}
    >
      {(() => {
        const blast = smoothstep(0.41, 0.45, t) * (1 - smoothstep(0.49, 0.56, t));
        if (blast <= 0.01) return null;
        return (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 80 + blast * 420,
                height: 80 + blast * 420,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `${2.5 - blast * 1.6}px solid ${palette.main}`,
                opacity: 0.9 - blast * 0.6,
                boxShadow: `0 0 ${18 + blast * 28}px ${palette.main}, inset 0 0 ${14 + blast * 24}px ${palette.secondary}`,
                zIndex: zIndexFront + 3,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 48 + blast * 180,
                height: 48 + blast * 180,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${palette.main}cc 0%, ${palette.secondary}66 38%, transparent 72%)`,
                opacity: 0.7 - blast * 0.5,
                zIndex: zIndexFront + 4,
              }}
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2 + t * 12;
              const d = 30 + blast * 130;
              return (
                <div
                  key={`coin-blast-spark-${i}`}
                  style={{
                    position: 'absolute',
                    left: Math.cos(a) * d,
                    top: Math.sin(a) * d,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: palette.main,
                    boxShadow: `0 0 10px ${palette.main}`,
                    opacity: 0.85 - blast * 0.5,
                    zIndex: zIndexFront + 5,
                  }}
                />
              );
            })}
          </>
        );
      })()}
      {Array.from({ length: count }).map((_, i) => {
        // Collapse completes just BEFORE lunge starts (~0.45).
        const collapse = smoothstep(0.37, 0.445, t);
        const vanish = smoothstep(0.44, 0.52, t);
        // Stable slot per coin: no angular jitter during accumulation.
        const slot = i / Math.max(1, count);
        const direction = side === 'right' ? -1 : 1;
        const angle = (-Math.PI / 2 + orbitSec * orbitSpeed * direction + slot * Math.PI * 2) * (1 + collapse * 0.35);
        // Strictly uniform ring during buildup: same radius for all coins.
        const ringBreath = 1 + Math.sin(t * 4) * 0.025;
        const orbitRadius = 240 * ringBreath * (1 - collapse) + 2;
        const orbitCenterX = 0;
        const orbitCenterY = 0;
        const centerPull = smoothstep(0.395, 0.445, t);
        const px = (orbitCenterX + Math.cos(angle) * orbitRadius) * (1 - centerPull);
        const py = (orbitCenterY + Math.sin(angle) * orbitRadius) * (1 - centerPull);
        const size = 40;
        const alpha = (1 - vanish) * 0.9;
        const glowColor = focusColorForCount(count, t);

        return (
          <FocusCoinToken
            key={`orbit-collapse-${i}`}
            x={px}
            y={py}
            size={size * (1 - collapse * 0.25)}
            alpha={alpha}
            glowColor={glowColor}
            armyKey={armyVisual?.key}
          />
        );
      })}
      {armyVisual && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(-50%, -50%) scale(${0.72 + smoothstep(0.39, 0.45, t) * 0.35})`,
            opacity: smoothstep(0.38, 0.44, t) * (1 - smoothstep(0.5, 0.58, t)) * 0.5,
            zIndex: zIndexFront + 2,
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 10px ${armyVisual.color}) drop-shadow(0 0 22px ${armyVisual.color})`,
            mixBlendMode: 'screen',
          }}
        >
          <Icon name={armyVisual.key} type="army" size={128} color={armyVisual.color} />
        </div>
      )}
    </div>
  );
}

function buildClashMotionConfig({
  battleResult,
  winner,
  intensity,
  variant,
  isZoomed,
  playerArmy,
  enemyArmy,
}) {
  const isN5 = variant === 'n5';
  const isN2 = variant === 'n2';
  const isN3 = variant === 'n3';
  const isN4 = variant === 'n4';
  const baseAgentScale = getDuelAgentBaseScale(isZoomed);
  const scaledStartDistance = getScaledClashStartOffset(isZoomed);
  const clashTravel = isN5 ? scaledStartDistance : 90;
  const winnerRetreat = scaledStartDistance * 0.5;
  const loserRetreat = scaledStartDistance;
  const playerClashAnchor = getPlayerClashAnchorX(isZoomed);
  const enemyClashAnchor = getEnemyClashAnchorX(isZoomed);
  const agentCenterY = getDuelAgentCenterY(isZoomed);

  return {
    winner,
    intensity,
    isN5,
    isN2,
    isN3,
    isN4,
    baseAgentScale,
    scaledStartDistance,
    clashTravel,
    winnerRetreat,
    loserRetreat,
    playerClashAnchor,
    enemyClashAnchor,
    agentCenterY,
    playerArmy,
    enemyArmy,
    playerFocusCount: battleResult.playerFocusUsed || 1,
    enemyFocusCount: battleResult.enemyFocusUsed || 1,
  };
}

function computeCardMotion(t, orbitSec, cfg) {
  const {
    winner,
    intensity,
    isN5,
    isN2,
    isN3,
    isN4,
    baseAgentScale,
    scaledStartDistance,
    clashTravel,
    winnerRetreat,
    loserRetreat,
    playerArmy,
    enemyArmy,
    playerFocusCount,
    enemyFocusCount,
  } = cfg;

  const lunge = smoothstep(0.45, 0.55, t);
  const impact = smoothstep(0.55, 0.62, t) * (1 - smoothstep(0.7, 0.9, t));
  const aftermath = smoothstep(0.65, 1, t);
  const clashRush = isN5 ? smoothstep(0.22, 0.56, t) : lunge;

  const pX = scaledStartDistance - clashRush * clashTravel + aftermath * (winner === 'player' ? winnerRetreat : loserRetreat);
  const pScale = baseAgentScale * (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'player' ? -0.06 : 0.2));
  const pRot = aftermath * (winner === 'player' ? 0 : 18);
  const pOpacity = winner === 'player' ? 1 : 1 - aftermath * 0.3;

  const eX = -scaledStartDistance + clashRush * clashTravel + aftermath * (winner === 'enemy' ? -winnerRetreat : -loserRetreat);
  const eScale = baseAgentScale * (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'enemy' ? -0.06 : 0.2));
  const eRot = aftermath * (winner === 'enemy' ? 0 : -18);
  const eOpacity = winner === 'enemy' ? 1 : 1 - aftermath * 0.3;

  const shake = impact * 8 * intensity;
  const sx = Math.sin(t * 220) * shake;
  const sy = Math.cos(t * 180) * shake;

  const playerVariantRot = isN2 ? Math.sin(t * 20) * 6 : isN3 ? Math.sin(t * 13) * 3 : isN4 ? Math.sin(t * 26) * 8 : 0;
  const enemyVariantRot = isN2 ? Math.cos(t * 18) * -6 : isN3 ? Math.cos(t * 12) * -3 : isN4 ? Math.cos(t * 24) * -8 : 0;
  const playerVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.sin(t * 30) * 0.02 : 1;
  const enemyVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.cos(t * 28) * 0.02 : 1;

  const playerFocusGlow = focusColorForCount(playerFocusCount, orbitSec);
  const enemyFocusGlow = focusColorForCount(enemyFocusCount, orbitSec);
  const playerFocusAura = isN5
    ? clamp(winner === 'player' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;
  const enemyFocusAura = isN5
    ? clamp(winner === 'enemy' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;

  const playerFilter =
    impact > 0 || aftermath > 0
      ? winner === 'player'
        ? `drop-shadow(0 0 ${20 + impact * 40}px ${playerArmy.color})${isN4 ? ` drop-shadow(0 0 ${20 + impact * 36}px #f472b6)` : ''}`
        : `brightness(${1 - aftermath * 0.45}) grayscale(${aftermath * 0.6})${isN3 ? ` hue-rotate(${-aftermath * 32}deg)` : ''}`
      : '';
  const enemyFilter =
    impact > 0 || aftermath > 0
      ? winner === 'enemy'
        ? `drop-shadow(0 0 ${20 + impact * 40}px ${enemyArmy.color})${isN4 ? ` drop-shadow(0 0 ${20 + impact * 36}px #fb7185)` : ''}`
        : `brightness(${1 - aftermath * 0.45}) grayscale(${aftermath * 0.6})${isN3 ? ` hue-rotate(${aftermath * 32}deg)` : ''}`
      : '';

  return {
    sx,
    sy,
    player: {
      x: pX + sx,
      y: sy,
      scale: pScale * playerVariantScale,
      rot: pRot + playerVariantRot,
      opacity: pOpacity,
      zIndex: winner === 'player' ? 140 : 130,
      boxShadow:
        playerFocusAura > 0
          ? `0 0 ${10 + playerFocusAura * 30}px ${playerFocusGlow.main}, 0 0 ${5 + playerFocusAura * 15}px ${playerFocusGlow.secondary} inset, 0 0 ${20 + playerFocusAura * 40}px ${playerFocusGlow.main}`
          : '',
      filter: playerFilter,
    },
    enemy: {
      x: eX + sx,
      y: sy,
      scale: eScale * enemyVariantScale,
      rot: eRot + enemyVariantRot,
      opacity: eOpacity,
      zIndex: winner === 'enemy' ? 140 : 130,
      boxShadow:
        enemyFocusAura > 0
          ? `0 0 ${10 + enemyFocusAura * 30}px ${enemyFocusGlow.main}, 0 0 ${5 + enemyFocusAura * 15}px ${enemyFocusGlow.secondary} inset, 0 0 ${20 + enemyFocusAura * 40}px ${enemyFocusGlow.main}`
          : '',
      filter: enemyFilter,
    },
  };
}

function applyCardWrapperMotion(el, sideMotion) {
  if (!el) return;
  el.style.transform = `translate(calc(-50% + ${sideMotion.x}px), calc(-50% + ${sideMotion.y}px)) scale(${sideMotion.scale}) rotate(${sideMotion.rot}deg)`;
  el.style.opacity = String(sideMotion.opacity);
  el.style.zIndex = String(sideMotion.zIndex);
  el.style.boxShadow = sideMotion.boxShadow;
  el.style.filter = sideMotion.filter;
}

const ClashCardAgents = React.memo(function ClashCardAgents({
  battleResult,
  display,
  cardLayout,
  playerAbilityCurrentValue,
  enemyAbilityCurrentValue,
  agentCenterY,
  playerClashAnchor,
  enemyClashAnchor,
  playerWrapRef,
  enemyWrapRef,
}) {
  return (
    <>
      <div
        ref={playerWrapRef}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: playerClashAnchor,
          display: 'inline-flex',
          borderRadius: '0.75rem',
          willChange: 'transform, opacity, filter',
          pointerEvents: 'none',
        }}
      >
        <GameCard
          cardLayout={cardLayout}
          agent={battleResult.playerAgent}
          modifiedPower={modifiedStatOrNull(battleResult.playerAgent?.power, display.playerPower)}
          modifiedDamage={modifiedStatOrNull(battleResult.playerAgent?.damage, display.playerDamage)}
          showOperators={display.showOperators}
          showBonus={display.showPlayerBonusActive}
          bonusBaseInactive={duelBonusBaseInactive(
            battleResult.playerAgent,
            battleResult.playerArmyBonusActive ?? battleResult.playerHasBonus,
            display.showPlayerBonusNotTriggered,
            display.showPlayerBonusBlocked,
            display.showPlayerCopiedBonus ? battleResult.playerBonusCopied : null
          )}
          abilityCurrentValue={playerAbilityCurrentValue}
          abilityBlocked={display.showPlayerAbilityBlocked}
          bonusBlocked={display.showPlayerBonusBlocked}
          highlightAbility={display.highlightPlayerAbility}
          highlightBonus={display.highlightPlayerBonus}
          visualStepKind={display.visualStepKind}
          visualStepIndex={display.visualStepIndex}
          copiedAbility={display.showPlayerCopiedAbility ? battleResult.playerAbilityCopied : null}
          copiedAbilityNotTriggered={display.showPlayerCopiedAbilityNotTriggered}
          copiedBonus={display.showPlayerCopiedBonus ? battleResult.playerBonusCopied : null}
          copiedBonusNotTriggered={display.showPlayerCopiedBonusNotTriggered}
          abilityNotTriggered={display.showPlayerAbilityNotTriggered}
          bonusNotTriggered={display.showPlayerBonusNotTriggered}
          suppressAnimations
        />
      </div>
      <div
        ref={enemyWrapRef}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: enemyClashAnchor,
          display: 'inline-flex',
          borderRadius: '0.75rem',
          willChange: 'transform, opacity, filter',
          pointerEvents: 'none',
        }}
      >
        <GameCard
          cardLayout={cardLayout}
          agent={battleResult.enemyAgent}
          modifiedPower={modifiedStatOrNull(battleResult.enemyAgent?.power, display.enemyPower)}
          modifiedDamage={modifiedStatOrNull(battleResult.enemyAgent?.damage, display.enemyDamage)}
          showOperators={display.showOperators}
          showBonus={display.showEnemyBonusActive}
          bonusBaseInactive={duelBonusBaseInactive(
            battleResult.enemyAgent,
            battleResult.enemyArmyBonusActive ?? battleResult.enemyHasBonus,
            display.showEnemyBonusNotTriggered,
            display.showEnemyBonusBlocked,
            display.showEnemyCopiedBonus ? battleResult.enemyBonusCopied : null
          )}
          abilityCurrentValue={enemyAbilityCurrentValue}
          abilityBlocked={display.showEnemyAbilityBlocked}
          bonusBlocked={display.showEnemyBonusBlocked}
          highlightAbility={display.highlightEnemyAbility}
          highlightBonus={display.highlightEnemyBonus}
          visualStepKind={display.visualStepKind}
          visualStepIndex={display.visualStepIndex}
          copiedAbility={display.showEnemyCopiedAbility ? battleResult.enemyAbilityCopied : null}
          copiedAbilityNotTriggered={display.showEnemyCopiedAbilityNotTriggered}
          copiedBonus={display.showEnemyCopiedBonus ? battleResult.enemyBonusCopied : null}
          copiedBonusNotTriggered={display.showEnemyCopiedBonusNotTriggered}
          abilityNotTriggered={display.showEnemyAbilityNotTriggered}
          bonusNotTriggered={display.showEnemyBonusNotTriggered}
          suppressAnimations
        />
      </div>
    </>
  );
});

export function DuelClashAuroraSequence({ battleResult, duelPhase, duelEffectStep = 1, variant = 'v1', galleryCardLayout, getAbilityCurrentValue, isZoomed = true }) {
  const { runId, active } = useSequenceRun(duelPhase);
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
  const isN5 = variant === 'n5';
  const dyn = React.useMemo(() => computeDynamicClashVfx(battleResult), [battleResult]);
  const speed = Number.isFinite(dyn?.clashSpeed) && dyn.clashSpeed > 0 ? dyn.clashSpeed : 1;
  const intensity = Number.isFinite(dyn?.intensity) && dyn.intensity > 0 ? dyn.intensity : 1;
  const durationMs = (isN5 ? 3800 : 3000) / speed;

  const playerWrapRef = React.useRef(null);
  const enemyWrapRef = React.useRef(null);
  const motionCfgRef = React.useRef(null);

  const { animRef, vfxTick } = useClashAnimationLoop(durationMs, runId, (t, orbitSec) => {
    const cfg = motionCfgRef.current;
    if (!cfg) return;
    const motion = computeCardMotion(t, orbitSec, cfg);
    applyCardWrapperMotion(playerWrapRef.current, motion.player);
    applyCardWrapperMotion(enemyWrapRef.current, motion.enemy);
  });
  void vfxTick;

  React.useLayoutEffect(() => {
    if (!active || !battleResult) return;
    const cfg = motionCfgRef.current;
    if (!cfg) return;
    const { t: frameT, orbitSec: frameOrbit } = animRef.current;
    const motion = computeCardMotion(frameT, frameOrbit, cfg);
    applyCardWrapperMotion(playerWrapRef.current, motion.player);
    applyCardWrapperMotion(enemyWrapRef.current, motion.enemy);
  });

  if (!battleResult || !active) return null;

  const winner = battleResult.winner;
  const playerArmy = getArmyVisual(battleResult.playerAgent, '#a78bfa');
  const enemyArmy = getArmyVisual(battleResult.enemyAgent, '#fbbf24');
  const winArmy = winner === 'player' ? playerArmy : enemyArmy;

  motionCfgRef.current = buildClashMotionConfig({
    battleResult,
    winner,
    intensity,
    variant,
    isZoomed,
    playerArmy,
    enemyArmy,
  });

  const t = animRef.current.t;
  const orbitSec = animRef.current.orbitSec;

  const charge = smoothstep(0.15, 0.45, t);
  const lunge = smoothstep(0.45, 0.55, t);
  const impact = smoothstep(0.55, 0.62, t) * (1 - smoothstep(0.7, 0.9, t));
  const aftermath = smoothstep(0.65, 1, t);
  const flash = smoothstep(0.53, 0.58, t) * (1 - smoothstep(0.6, 0.72, t)) * intensity;
  // Fade rays out when loser starts falling (aftermath begins).
  const raysFade = 1 - smoothstep(0.05, 0.55, aftermath);
  const isV1Like = variant === 'v1' || variant === 'n1';
  const isN2 = variant === 'n2';
  const isN3 = variant === 'n3';
  const isN4 = variant === 'n4';
  const baseAgentScale = getDuelAgentBaseScale(isZoomed);
  const clashRush = isN5 ? smoothstep(0.22, 0.56, t) : lunge;
  const scaledStartDistance = getScaledClashStartOffset(isZoomed);
  const clashTravel = isN5 ? scaledStartDistance : 90;
  const winnerRetreat = scaledStartDistance * 0.5;
  const loserRetreat = scaledStartDistance;

  // Mirror of ClashV1_AuroraCharge positions: player fixed on right, enemy on left.
  const pStartOffset = scaledStartDistance;
  const eStartOffset = -scaledStartDistance;
  const pX = pStartOffset - clashRush * clashTravel + aftermath * (winner === 'player' ? winnerRetreat : loserRetreat);
  const pScale = baseAgentScale * (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'player' ? -0.06 : 0.2));
  const pRot = aftermath * (winner === 'player' ? 0 : 18);
  const pOpacity = winner === 'player' ? 1 : 1 - aftermath * 0.3;

  const eX = eStartOffset + clashRush * clashTravel + aftermath * (winner === 'enemy' ? -winnerRetreat : -loserRetreat);
  const eScale = baseAgentScale * (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'enemy' ? -0.06 : 0.2));
  const eRot = aftermath * (winner === 'enemy' ? 0 : -18);
  const eOpacity = winner === 'enemy' ? 1 : 1 - aftermath * 0.3;

  const shake = impact * 8 * intensity;
  const sx = Math.sin(t * 220) * shake;
  const sy = Math.cos(t * 180) * shake;
  const raySpin = isN2 ? t * 22 : isN3 ? t * 9 : isN4 ? t * 5 : t * 4;
  const rayCount = isN2 ? 18 : isN3 ? 12 : isN4 ? 10 : 8;
  const beamWidth = isN4 ? 2.5 : isN2 ? 4.5 : 3;
  const pSecondary = isN2 ? '#22d3ee' : isN3 ? '#22d3ee' : isN4 ? '#fbbf24' : null;
  const eSecondary = isN2 ? '#f472b6' : isN3 ? '#fbbf24' : isN4 ? '#fb7185' : null;
  const playerAgentFx = isN2 ? 'helix' : isN3 ? 'arc' : isN4 ? 'pulse' : 'off';
  const enemyAgentFx = isN2 ? 'helix' : isN3 ? 'arc' : isN4 ? 'pulse' : 'off';
  const playerVariantRot = isN2 ? Math.sin(t * 20) * 6 : isN3 ? Math.sin(t * 13) * 3 : isN4 ? Math.sin(t * 26) * 8 : 0;
  const enemyVariantRot = isN2 ? Math.cos(t * 18) * -6 : isN3 ? Math.cos(t * 12) * -3 : isN4 ? Math.cos(t * 24) * -8 : 0;
  const playerVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.sin(t * 30) * 0.02 : 1;
  const enemyVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.cos(t * 28) * 0.02 : 1;
  const auraTailFade = 1 - smoothstep(0.82, 1, t);
  const playerAuraIntensity = clamp((0.28 + charge * 0.62 + impact * 0.45) * auraTailFade, 0, 1);
  const enemyAuraIntensity = clamp((0.28 + charge * 0.62 + impact * 0.45) * auraTailFade, 0, 1);
  const playerFocusGlow = focusColorForCount(battleResult.playerFocusUsed || 1, orbitSec);
  const enemyFocusGlow = focusColorForCount(battleResult.enemyFocusUsed || 1, orbitSec);
  const playerFocusAura = isN5
    ? clamp(winner === 'player' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;
  const enemyFocusAura = isN5
    ? clamp(winner === 'enemy' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;
  const cardLayout = galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout;
  const playerAbilityCurrentValue =
    typeof getAbilityCurrentValue === 'function'
      ? display.showPlayerAbilityValue
        ? getAbilityCurrentValue(battleResult.playerAgent, true)
        : null
      : display.showPlayerAbilityValue
        ? getClashAbilityCurrentValue(battleResult, true)
        : null;
  const enemyAbilityCurrentValue =
    typeof getAbilityCurrentValue === 'function'
      ? display.showEnemyAbilityValue
        ? getAbilityCurrentValue(battleResult.enemyAgent, false)
        : null
      : display.showEnemyAbilityValue
        ? getClashAbilityCurrentValue(battleResult, false)
        : null;
  const playerClashAnchor = getPlayerClashAnchorX(isZoomed);
  const enemyClashAnchor = getEnemyClashAnchorX(isZoomed);
  const agentCenterY = getDuelAgentCenterY(isZoomed);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 58,
        pointerEvents: 'none',
        overflow: 'hidden',
        contain: 'layout paint style',
      }}
    >
      {charge > 0 && !isN2 && !isN3 && !isN4 && !isN5 && (
        <>
          <ChargeRays
            x={playerClashAnchor}
            color={playerArmy.color}
            secondaryColor={pSecondary}
            strength={charge * (1 - lunge)}
            count={rayCount}
            spin={raySpin}
            beamWidth={beamWidth}
            fade={raysFade}
            offsetX={pX + sx}
            offsetY={sy}
            centerY={agentCenterY}
          />
          <ChargeRays
            x={enemyClashAnchor}
            color={enemyArmy.color}
            secondaryColor={eSecondary}
            strength={charge * (1 - lunge)}
            count={rayCount}
            spin={-raySpin}
            beamWidth={beamWidth}
            fade={raysFade}
            offsetX={eX + sx}
            offsetY={sy}
            centerY={agentCenterY}
          />
        </>
      )}

      {impact > 0 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 120 + impact * 1500,
              height: 120 + impact * 1500,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `${4 - impact * 3}px solid rgba(79,209,197,${0.9 - impact * 0.8})`,
              boxShadow: `0 0 ${80 * impact}px rgba(79,209,197,0.8), inset 0 0 ${60 * impact}px rgba(251,191,36,0.6)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 70 + impact * 1000,
              height: 70 + impact * 1000,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `${3 - impact * 2.5}px solid rgba(251,179,71,${0.8 - impact * 0.7})`,
            }}
          />
        </>
      )}

      {(variant === 'v2' || isN2) && (
        <>
          <AgentOrbitSparks t={Math.min(1, lunge + impact + aftermath * 0.5)} color={playerArmy.color} x={playerClashAnchor} y={{ x: pX + sx, y: sy }} centerY={agentCenterY} />
          <AgentOrbitSparks t={Math.min(1, lunge + impact + aftermath * 0.5)} color={enemyArmy.color} x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} centerY={agentCenterY} />
          <AgentAfterImage t={t} x={playerClashAnchor} y={{ x: pX + sx, y: sy }} rot={pRot + playerVariantRot} scale={pScale * playerVariantScale} color={playerArmy.color} centerY={agentCenterY} />
          <AgentAfterImage t={t} x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} rot={eRot + enemyVariantRot} scale={eScale * enemyVariantScale} color={enemyArmy.color} centerY={agentCenterY} />
        </>
      )}
      {isN2 && (
        <>
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="orbit" side="right" winner={winner === 'player'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="orbit" side="left" winner={winner === 'enemy'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="orbit" side="right" winner={winner === 'player'} zIndex={142} layer="front" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="orbit" side="left" winner={winner === 'enemy'} zIndex={142} layer="front" centerY={agentCenterY} />
        </>
      )}
      {isN3 && (
        <>
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="stream" side="right" winner={winner === 'player'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="stream" side="left" winner={winner === 'enemy'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="stream" side="right" winner={winner === 'player'} zIndex={142} layer="front" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="stream" side="left" winner={winner === 'enemy'} zIndex={142} layer="front" centerY={agentCenterY} />
        </>
      )}
      {isN4 && (
        <>
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="burst" side="right" winner={winner === 'player'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="burst" side="left" winner={winner === 'enemy'} zIndex={126} layer="behind" centerY={agentCenterY} />
          <FocusCoinFx x={playerClashAnchor} y={{ x: pX + sx, y: sy }} t={t} color={playerArmy.color} mode="burst" side="right" winner={winner === 'player'} zIndex={142} layer="front" centerY={agentCenterY} />
          <FocusCoinFx x={enemyClashAnchor} y={{ x: eX + sx, y: sy }} t={t} color={enemyArmy.color} mode="burst" side="left" winner={winner === 'enemy'} zIndex={142} layer="front" centerY={agentCenterY} />
        </>
      )}
      {(impact > 0 || aftermath > 0) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${0.4 + (impact + aftermath * 0.5) * 1.4}) rotate(${(impact + aftermath * 0.3) * 25}deg)`,
            opacity: (impact * 0.95 + aftermath * 0.35) * intensity * (1 - smoothstep(0.74, 1, t)),
          }}
        >
          <Sigil armyVisual={winArmy} size={520} />
        </div>
      )}

      <AgentAura
        x={playerClashAnchor}
        y={{ x: pX + sx, y: sy, t }}
        scale={pScale}
        color={playerArmy.color}
        mode={playerAgentFx}
        intensity={playerAuraIntensity}
        centerY={agentCenterY}
      />
      <AgentAura
        x={enemyClashAnchor}
        y={{ x: eX + sx, y: sy, t }}
        scale={eScale}
        color={enemyArmy.color}
        mode={enemyAgentFx}
        intensity={enemyAuraIntensity}
        centerY={agentCenterY}
      />
      <FocusChargeAura
        x={playerClashAnchor}
        y={{ x: pX + sx, y: sy }}
        scale={pScale}
        glowColor={playerFocusGlow}
        intensity={Math.max(0, playerFocusAura - 1)}
        zIndex={125}
        centerY={agentCenterY}
      />
      <FocusChargeAura
        x={enemyClashAnchor}
        y={{ x: eX + sx, y: sy }}
        scale={eScale}
        glowColor={enemyFocusGlow}
        intensity={Math.max(0, enemyFocusAura - 1)}
        zIndex={125}
        centerY={agentCenterY}
      />

      <ClashCardAgents
        battleResult={battleResult}
        display={display}
        cardLayout={cardLayout}
        playerAbilityCurrentValue={playerAbilityCurrentValue}
        enemyAbilityCurrentValue={enemyAbilityCurrentValue}
        agentCenterY={agentCenterY}
        playerClashAnchor={playerClashAnchor}
        enemyClashAnchor={enemyClashAnchor}
        playerWrapRef={playerWrapRef}
        enemyWrapRef={enemyWrapRef}
      />

      {isN5 && (
        <>
          <FocusCoinOrbitCollapseFx
            x={playerClashAnchor}
            y={{ x: pX + sx, y: sy }}
            t={t}
            orbitSec={orbitSec}
            focusCount={battleResult.playerFocusUsed}
            side="right"
            armyVisual={playerArmy}
            centerY={agentCenterY}
          />
          <FocusCoinOrbitCollapseFx
            x={enemyClashAnchor}
            y={{ x: eX + sx, y: sy }}
            t={t}
            orbitSec={orbitSec}
            focusCount={battleResult.enemyFocusUsed}
            side="left"
            armyVisual={enemyArmy}
            centerY={agentCenterY}
          />
        </>
      )}

      <VaTag x={playerClashAnchor} value={battleResult.playerAssault} winner={winner === 'player'} t={t} motion={{ x: pX + sx, y: sy }} centerY={agentCenterY} />
      <VaTag x={enemyClashAnchor} value={battleResult.enemyAssault} winner={winner === 'enemy'} t={t} motion={{ x: eX + sx, y: sy }} centerY={agentCenterY} />

      <FlashOverlay opacity={flash * 0.7} />

      {aftermath > 0.1 && (
        <div
          style={{
            position: 'absolute',
            top: 110,
            left: '50%',
            transform: `translateX(-50%) scale(${smoothstep(0.65, 0.85, t)})`,
            opacity: smoothstep(0.65, 0.78, t),
            zIndex: 70,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Chakra Petch',
              fontSize: 46,
              fontWeight: 800,
              color: winner === 'player' ? DUEL_ACCENTS.victoryGold : DUEL_ACCENTS.defeatBlood,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              textShadow: `0 0 24px ${winner === 'player' ? DUEL_ACCENTS.victoryGold : DUEL_ACCENTS.defeatBlood}, 0 0 48px ${winArmy.color}, 0 4px 12px #000`,
              WebkitTextStroke: '1.5px rgba(0,0,0,0.8)',
            }}
          >
            {winner === 'player' ? 'Trionfo' : 'Sconfitta'}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'Share Tech Mono', fontSize: 14, color: '#fff', letterSpacing: '0.22em', textShadow: '0 0 8px #000' }}>
            {(winner === 'player' ? battleResult.playerAgent?.name : battleResult.enemyAgent?.name || '').toUpperCase()} · VA {winner === 'player' ? battleResult.playerAssault : battleResult.enemyAssault} → −{battleResult.damageDealt} PV
          </div>
        </div>
      )}
    </div>
  );
}

