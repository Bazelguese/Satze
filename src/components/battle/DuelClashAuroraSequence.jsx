import React from 'react';
import { GameCard } from '../cards/GameCard';
import { Icon } from '../ui/Icon';
import { ARMY_BONUSES } from '../../data/armies.js';
import { getDuelVisualDisplay, modifiedStatOrNull } from './duelVisualDisplay.js';
import {
  computeDynamicClashVfx,
  DUEL_PHASE4_MIN_MS,
  DUEL_VISUAL_DEFAULTS,
} from '../../config/duelVisualConfig.js';
import {
  getDuelAgentBaseScale,
  getDuelAgentCenterY,
  getEnemyClashAnchorX,
  getPlayerClashAnchorX,
  getScaledClashStartOffset,
} from '../../config/duelClashLayout.js';
import { getFocusCoinGlowColor } from '../../utils/focusCoinGlow';
import { DUEL_ACCENTS, getArmyAccent } from '../../theme/duelAccents.js';
import { PerfectFocusStamp } from './PerfectFocusStamp.jsx';
import { getPerfectFocusSide } from '../../game/duel/perfectFocusBet.js';
import { getFieldSetupFlags } from '../../game/battlefieldEffects.js';
import { resolveAbilityForDisplay, resolveArmyBonusForDisplay } from '../../game/cardTextDisplay.js';

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function fieldAbilityDisplay(battleResult, isPlayer) {
  const mods = getFieldSetupFlags(battleResult?.field);
  const ability = isPlayer ? battleResult?.playerAgent?.ability : battleResult?.enemyAgent?.ability;
  const card = isPlayer ? battleResult?.playerAgent : battleResult?.enemyAgent;
  const isFirst = isPlayer
    ? battleResult?.isPlayerFirst !== false
    : battleResult?.isPlayerFirst === false;
  return resolveAbilityForDisplay(ability, {
    fieldMods: mods,
    isFirst,
    card,
    triggerRules: battleResult?.eminenceTriggerRules || null,
  });
}

function fieldArmyBonusDisplay(battleResult, isPlayer) {
  const stored = isPlayer
    ? battleResult?.playerEffectiveArmyBonus
    : battleResult?.enemyEffectiveArmyBonus;
  const playerBonus = ARMY_BONUSES[battleResult?.playerAgent?.army];
  const enemyBonus = ARMY_BONUSES[battleResult?.enemyAgent?.army];
  const base = stored || (isPlayer ? playerBonus : enemyBonus);
  return resolveArmyBonusForDisplay({
    field: stored ? null : battleResult?.field,
    fieldMods: getFieldSetupFlags(battleResult?.field),
    armyBonus: base,
    hasBonus: isPlayer
      ? Boolean(battleResult?.playerHasBonus ?? battleResult?.playerArmyBonusActive)
      : Boolean(battleResult?.enemyHasBonus ?? battleResult?.enemyArmyBonusActive),
    opponentArmyBonus: isPlayer ? enemyBonus : playerBonus,
    opponentHasBonus: isPlayer
      ? Boolean(battleResult?.enemyHasBonus ?? battleResult?.enemyArmyBonusActive)
      : Boolean(battleResult?.playerHasBonus ?? battleResult?.playerArmyBonusActive),
  }) || stored || null;
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const globalOrbitNowSec = () =>
  typeof performance !== 'undefined' ? performance.now() / 1000 : 0;

/**
 * Un solo rAF: aggiorna carte + overlay VFX via DOM (nessun setState per frame).
 */
function useClashAnimationLoop(durationMs, runId, onFrame) {
  const onFrameRef = React.useRef(onFrame);
  onFrameRef.current = onFrame;
  const animRef = React.useRef({ t: 0, orbitSec: globalOrbitNowSec() });

  React.useEffect(() => {
    let raf = 0;
    let start = null;
    animRef.current = { t: 0, orbitSec: globalOrbitNowSec() };
    onFrameRef.current(0, animRef.current.orbitSec);

    const tick = (ts) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      const orbitSec = ts / 1000;
      animRef.current = { t, orbitSec };
      onFrameRef.current(t, orbitSec);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, runId]);

  return { animRef };
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
    isV1Like: variant === 'v1' || variant === 'n1',
    showOrbitSparks: variant === 'v2' || isN2,
    focusFxMode: isN2 ? 'orbit' : isN3 ? 'stream' : isN4 ? 'burst' : null,
    rayCount: isN2 ? 18 : isN3 ? 12 : isN4 ? 10 : 8,
    beamWidth: isN4 ? 2.5 : isN2 ? 4.5 : 3,
    pSecondary: isN2 ? '#22d3ee' : isN3 ? '#22d3ee' : isN4 ? '#fbbf24' : null,
    eSecondary: isN2 ? '#f472b6' : isN3 ? '#fbbf24' : isN4 ? '#fb7185' : null,
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

  const eX = -scaledStartDistance + clashRush * clashTravel + aftermath * (winner === 'enemy' ? -winnerRetreat : -loserRetreat);
  const eScale = baseAgentScale * (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'enemy' ? -0.06 : 0.2));
  const eRot = aftermath * (winner === 'enemy' ? 0 : -18);

  const shake = impact * 8 * intensity;
  const sx = Math.sin(t * 220) * shake;
  const sy = Math.cos(t * 180) * shake;

  const playerVariantRot = isN2 ? Math.sin(t * 20) * 6 : isN3 ? Math.sin(t * 13) * 3 : isN4 ? Math.sin(t * 26) * 8 : 0;
  const enemyVariantRot = isN2 ? Math.cos(t * 18) * -6 : isN3 ? Math.cos(t * 12) * -3 : isN4 ? Math.cos(t * 24) * -8 : 0;
  const playerVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.sin(t * 30) * 0.02 : 1;
  const enemyVariantScale = isN2 ? 1 + smoothstep(0.2, 0.55, t) * 0.06 : isN3 ? 1 + impact * 0.08 : isN4 ? 1 + Math.cos(t * 28) * 0.02 : 1;

  const playerFocusGlow = focusColorForCount(playerFocusCount, Math.floor(orbitSec * 6) / 6);
  const enemyFocusGlow = focusColorForCount(enemyFocusCount, Math.floor(orbitSec * 6) / 6);
  const playerFocusAura = isN5
    ? clamp(winner === 'player' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;
  const enemyFocusAura = isN5
    ? clamp(winner === 'enemy' ? 1 + smoothstep(0.48, 0.82, t) * 0.9 : 1 - smoothstep(0.52, 0.92, t), 0, 2)
    : 0;

  // Niente `filter` per-frame sulle carte (drop-shadow/brightness forzano un re-raster
  // dell'intera GameCard). Glow solo via box-shadow; loser dimming via opacity.
  const playerImpactGlow =
    (impact > 0 || aftermath > 0) && winner === 'player'
      ? `0 0 ${18 + impact * 36}px ${playerArmy.color}${isN4 ? `, 0 0 ${16 + impact * 28}px #f472b6` : ''}`
      : '';
  const enemyImpactGlow =
    (impact > 0 || aftermath > 0) && winner === 'enemy'
      ? `0 0 ${18 + impact * 36}px ${enemyArmy.color}${isN4 ? `, 0 0 ${16 + impact * 28}px #fb7185` : ''}`
      : '';

  const playerFocusShadow =
    playerFocusAura > 0
      ? `0 0 ${10 + playerFocusAura * 30}px ${playerFocusGlow.main}, 0 0 ${5 + playerFocusAura * 15}px ${playerFocusGlow.secondary} inset, 0 0 ${20 + playerFocusAura * 40}px ${playerFocusGlow.main}`
      : '';
  const enemyFocusShadow =
    enemyFocusAura > 0
      ? `0 0 ${10 + enemyFocusAura * 30}px ${enemyFocusGlow.main}, 0 0 ${5 + enemyFocusAura * 15}px ${enemyFocusGlow.secondary} inset, 0 0 ${20 + enemyFocusAura * 40}px ${enemyFocusGlow.main}`
      : '';

  return {
    sx,
    sy,
    player: {
      x: pX + sx,
      y: sy,
      scale: pScale * playerVariantScale,
      rot: pRot + playerVariantRot,
      opacity: winner === 'player' ? 1 : 1 - aftermath * 0.55,
      zIndex: winner === 'player' ? 140 : 130,
      boxShadow: [playerFocusShadow, playerImpactGlow].filter(Boolean).join(', '),
    },
    enemy: {
      x: eX + sx,
      y: sy,
      scale: eScale * enemyVariantScale,
      rot: eRot + enemyVariantRot,
      opacity: winner === 'enemy' ? 1 : 1 - aftermath * 0.55,
      zIndex: winner === 'enemy' ? 140 : 130,
      boxShadow: [enemyFocusShadow, enemyImpactGlow].filter(Boolean).join(', '),
    },
  };
}

function applyCardWrapperMotion(el, sideMotion) {
  if (!el) return;
  el.style.transform = `translate(calc(-50% + ${sideMotion.x}px), calc(-50% + ${sideMotion.y}px)) scale(${sideMotion.scale}) rotate(${sideMotion.rot}deg)`;
  el.style.opacity = String(sideMotion.opacity);
  el.style.zIndex = String(sideMotion.zIndex);
  const nextShadow = sideMotion.boxShadow || 'none';
  if (el.__clashShadow !== nextShadow) {
    el.__clashShadow = nextShadow;
    el.style.boxShadow = nextShadow;
  }
  if (el.style.filter) el.style.filter = '';
  el.style.willChange = 'transform, opacity';
}

function setElOpacity(el, opacity) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
}

function bindClashEl(refs, key, el) {
  refs[key] = el;
  if (el && !el.dataset.clashBound) {
    el.dataset.clashBound = '1';
    el.style.opacity = '0';
    el.style.visibility = 'hidden';
  }
}

/** Snapshot overlay (stesso math del render React precedente). */
function computeClashOverlayFrame(t, orbitSec, cfg) {
  const {
    winner,
    intensity,
    isN5,
    isN2,
    isN3,
    isN4,
    isV1Like,
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

  const charge = smoothstep(0.15, 0.45, t);
  const lunge = smoothstep(0.45, 0.55, t);
  const impact = smoothstep(0.55, 0.62, t) * (1 - smoothstep(0.7, 0.9, t));
  const aftermath = smoothstep(0.65, 1, t);
  const flash = smoothstep(0.53, 0.58, t) * (1 - smoothstep(0.6, 0.72, t)) * intensity;
  const raysFade = 1 - smoothstep(0.05, 0.55, aftermath);
  const clashRush = isN5 ? smoothstep(0.22, 0.56, t) : lunge;

  const pX =
    scaledStartDistance -
    clashRush * clashTravel +
    aftermath * (winner === 'player' ? winnerRetreat : loserRetreat);
  const pScale =
    baseAgentScale *
    (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'player' ? -0.06 : 0.2));
  const pRot = aftermath * (winner === 'player' ? 0 : 18);

  const eX =
    -scaledStartDistance +
    clashRush * clashTravel +
    aftermath * (winner === 'enemy' ? -winnerRetreat : -loserRetreat);
  const eScale =
    baseAgentScale *
    (1 + clashRush * (isN5 ? 0.22 : 0.15) - aftermath * (winner === 'enemy' ? -0.06 : 0.2));
  const eRot = aftermath * (winner === 'enemy' ? 0 : -18);

  const shake = impact * 8 * intensity;
  const sx = Math.sin(t * 220) * shake;
  const sy = Math.cos(t * 180) * shake;
  const raySpin = isN2 ? t * 22 : isN3 ? t * 9 : isN4 ? t * 5 : t * 4;
  const playerVariantRot = isN2
    ? Math.sin(t * 20) * 6
    : isN3
      ? Math.sin(t * 13) * 3
      : isN4
        ? Math.sin(t * 26) * 8
        : 0;
  const enemyVariantRot = isN2
    ? Math.cos(t * 18) * -6
    : isN3
      ? Math.cos(t * 12) * -3
      : isN4
        ? Math.cos(t * 24) * -8
        : 0;
  const playerVariantScale = isN2
    ? 1 + smoothstep(0.2, 0.55, t) * 0.06
    : isN3
      ? 1 + impact * 0.08
      : isN4
        ? 1 + Math.sin(t * 30) * 0.02
        : 1;
  const enemyVariantScale = isN2
    ? 1 + smoothstep(0.2, 0.55, t) * 0.06
    : isN3
      ? 1 + impact * 0.08
      : isN4
        ? 1 + Math.cos(t * 28) * 0.02
        : 1;
  const auraTailFade = 1 - smoothstep(0.82, 1, t);
  const playerAuraIntensity = clamp((0.28 + charge * 0.62 + impact * 0.45) * auraTailFade, 0, 1);
  const enemyAuraIntensity = clamp((0.28 + charge * 0.62 + impact * 0.45) * auraTailFade, 0, 1);
  const playerFocusGlow = focusColorForCount(playerFocusCount, Math.floor(orbitSec * 6) / 6);
  const enemyFocusGlow = focusColorForCount(enemyFocusCount, Math.floor(orbitSec * 6) / 6);
  const playerFocusAura = isN5
    ? clamp(
        winner === 'player'
          ? 1 + smoothstep(0.48, 0.82, t) * 0.9
          : 1 - smoothstep(0.52, 0.92, t),
        0,
        2
      )
    : 0;
  const enemyFocusAura = isN5
    ? clamp(
        winner === 'enemy'
          ? 1 + smoothstep(0.48, 0.82, t) * 0.9
          : 1 - smoothstep(0.52, 0.92, t),
        0,
        2
      )
    : 0;

  const rayStrength = charge * (1 - lunge);
  const showRays = charge > 0 && isV1Like;
  const showImpact = impact > 0;
  const showSigil = impact > 0 || aftermath > 0;
  const sigilScale = 0.4 + (impact + aftermath * 0.5) * 1.4;
  const sigilRot = (impact + aftermath * 0.3) * 25;
  const sigilOpacity = (impact * 0.95 + aftermath * 0.35) * intensity * (1 - smoothstep(0.74, 1, t));
  const bannerReveal = smoothstep(0.65, 0.85, t);
  const bannerOpacity = aftermath > 0.1 ? smoothstep(0.65, 0.78, t) : 0;
  const sparksT = Math.min(1, lunge + impact + aftermath * 0.5);

  return {
    t,
    orbitSec,
    charge,
    lunge,
    impact,
    aftermath,
    flash,
    raysFade,
    rayStrength,
    raySpin,
    showRays,
    showImpact,
    showSigil,
    sigilScale,
    sigilRot,
    sigilOpacity,
    bannerReveal,
    bannerOpacity,
    sparksT,
    sx,
    sy,
    pX,
    eX,
    pScale,
    eScale,
    pRot,
    eRot,
    playerVariantRot,
    enemyVariantRot,
    playerVariantScale,
    enemyVariantScale,
    playerAuraIntensity,
    enemyAuraIntensity,
    playerFocusGlow,
    enemyFocusGlow,
    playerFocusAura,
    enemyFocusAura,
    playerAgentFx: isN2 ? 'helix' : isN3 ? 'arc' : isN4 ? 'pulse' : 'off',
    enemyAgentFx: isN2 ? 'helix' : isN3 ? 'arc' : isN4 ? 'pulse' : 'off',
    showPerfect: t >= 0.58,
  };
}

function applyChargeRaysDom(container, rayEls, opts) {
  if (!container) return;
  const {
    show,
    strength,
    spin,
    fade,
    offsetX,
    offsetY,
    color,
    secondaryColor,
    beamWidth,
  } = opts;
  if (!show || strength <= 0.01 || fade <= 0.01) {
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
    return;
  }
  container.style.visibility = 'visible';
  container.style.opacity = '1';
  container.style.transform = `translate(-50%, calc(-50% + ${offsetY}px))`;
  container.style.left = `calc(${opts.anchorX} + ${offsetX}px)`;
  const count = rayEls.length;
  for (let i = 0; i < count; i += 1) {
    const el = rayEls[i];
    if (!el) continue;
    const a = (i / count) * Math.PI * 2 + strength * 0.5 + spin * (i % 2 === 0 ? 1 : -1) * 0.28;
    const len = 90 + strength * 180;
    const dist = 70 + strength * 120;
    const x1 = Math.cos(a) * dist;
    const y1 = Math.sin(a) * dist;
    el.style.left = `${x1}px`;
    el.style.top = `${y1}px`;
    el.style.width = `${len}px`;
    el.style.height = `${beamWidth}px`;
    el.style.transform = `rotate(${(a * 180) / Math.PI}deg)`;
    el.style.opacity = String(0.8 * fade);
    el.style.background = secondaryColor
      ? `linear-gradient(90deg, ${secondaryColor}dd, ${color}cc 45%, transparent)`
      : `linear-gradient(90deg, ${color}cc, transparent)`;
    el.style.boxShadow = `0 0 10px ${color}, 0 0 16px ${secondaryColor || color}`;
  }
}

function applyImpactRingsDom(outer, inner, impact) {
  if (!outer || !inner) return;
  if (impact <= 0) {
    setElOpacity(outer, 0);
    setElOpacity(inner, 0);
    return;
  }
  const ow = 120 + impact * 1500;
  const iw = 70 + impact * 1000;
  outer.style.width = `${ow}px`;
  outer.style.height = `${ow}px`;
  outer.style.border = `${4 - impact * 3}px solid rgba(79,209,197,${0.9 - impact * 0.8})`;
  outer.style.boxShadow = `0 0 ${80 * impact}px rgba(79,209,197,0.8), inset 0 0 ${60 * impact}px rgba(251,191,36,0.6)`;
  setElOpacity(outer, 1);
  inner.style.width = `${iw}px`;
  inner.style.height = `${iw}px`;
  inner.style.border = `${3 - impact * 2.5}px solid rgba(251,179,71,${0.8 - impact * 0.7})`;
  setElOpacity(inner, 1);
}

function applyAgentAuraDom(el, opts) {
  if (!el) return;
  const { mode, intensity, offsetX, offsetY, scale, color, t } = opts;
  const auraOpacity = clamp(intensity, 0, 1);
  if (mode === 'off' || auraOpacity <= 0.005) {
    setElOpacity(el, 0);
    return;
  }
  const size = 220 * scale;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  el.style.background =
    mode === 'helix'
      ? `conic-gradient(from ${t * 260}deg, transparent 0deg, ${color}99 60deg, transparent 130deg, ${color}66 190deg, transparent 360deg)`
      : mode === 'arc'
        ? `repeating-conic-gradient(from ${t * 200}deg, ${color}88 0deg 10deg, transparent 10deg 24deg)`
        : `radial-gradient(circle, ${color}55 0%, ${color}22 45%, transparent 75%)`;
  el.style.boxShadow = `0 0 ${28 + intensity * 18}px ${color}`;
  setElOpacity(el, auraOpacity);
}

function applyFocusChargeAuraDom(el, opts) {
  if (!el) return;
  const { glowColor, intensity, offsetX, offsetY, scale } = opts;
  const opacity = clamp(intensity, 0, 1);
  if (!glowColor || opacity <= 0.01) {
    setElOpacity(el, 0);
    return;
  }
  const size = 250 * scale;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  el.style.background = `radial-gradient(circle, ${glowColor.main}33 0%, ${glowColor.secondary}22 44%, transparent 72%)`;
  el.style.boxShadow = `0 0 ${26 + opacity * 34}px ${glowColor.main}`;
  setElOpacity(el, opacity);
}

function applyFocusCoinTokenDom(el, x, y, size, alpha, glowColor) {
  if (!el) return;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.opacity = String(alpha);
  el.style.visibility = alpha <= 0.01 ? 'hidden' : 'visible';
  if (glowColor?.main) {
    el.style.border = `1px solid ${glowColor.main}`;
    el.style.backgroundColor = toSoftFill(glowColor.main);
    el.style.boxShadow = `0 0 8px ${glowColor.main}`;
  }
}

function applyFocusCoinOrbitCollapseDom(container, coinEls, crestEl, opts) {
  if (!container) return;
  const { t, orbitSec, focusCount, side, armyVisual, offsetX, offsetY } = opts;
  const count = Math.min(coinEls.length, clamp(Math.round(Number(focusCount) || 0), 0, 14));
  if (count <= 0) {
    setElOpacity(container, 0);
    return;
  }
  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  setElOpacity(container, 1);
  const orbitSpeed = 1.4 + count * 0.22;
  const direction = side === 'right' ? -1 : 1;
  for (let i = 0; i < coinEls.length; i += 1) {
    const el = coinEls[i];
    if (!el) continue;
    if (i >= count) {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      continue;
    }
    const collapse = smoothstep(0.37, 0.445, t);
    const vanish = smoothstep(0.44, 0.52, t);
    const slot = i / Math.max(1, count);
    const angle =
      (-Math.PI / 2 + orbitSec * orbitSpeed * direction + slot * Math.PI * 2) * (1 + collapse * 0.35);
    const ringBreath = 1 + Math.sin(t * 4) * 0.025;
    const orbitRadius = 240 * ringBreath * (1 - collapse) + 2;
    const centerPull = smoothstep(0.395, 0.445, t);
    const px = Math.cos(angle) * orbitRadius * (1 - centerPull);
    const py = Math.sin(angle) * orbitRadius * (1 - centerPull);
    const size = 40 * (1 - collapse * 0.25);
    const alpha = (1 - vanish) * 0.9;
    const glowColor = focusColorForCount(count, t);
    applyFocusCoinTokenDom(el, px, py, size, alpha, glowColor);
  }
  if (crestEl && armyVisual) {
    const crestOpacity = smoothstep(0.38, 0.44, t) * (1 - smoothstep(0.5, 0.58, t)) * 0.5;
    crestEl.style.transform = `translate(-50%, -50%) scale(${0.72 + smoothstep(0.39, 0.45, t) * 0.35})`;
    crestEl.style.filter = `drop-shadow(0 0 10px ${armyVisual.color}) drop-shadow(0 0 22px ${armyVisual.color})`;
    setElOpacity(crestEl, crestOpacity);
  }
}

function applyFocusCoinFxDom(container, coinEls, opts) {
  if (!container) return;
  const { t, offsetX, offsetY, mode, side, winner, layer, focusCount } = opts;
  const entry = smoothstep(0.08, 0.4, t);
  const sustain = 1 - smoothstep(0.82, 1, t);
  const visible = entry * sustain;
  if (visible <= 0.01) {
    setElOpacity(container, 0);
    return;
  }
  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  setElOpacity(container, 1);
  const coins = mode === 'burst' ? 14 : mode === 'stream' ? 12 : 10;
  const dir = side === 'right' ? -1 : 1;
  for (let i = 0; i < coinEls.length; i += 1) {
    const el = coinEls[i];
    if (!el) continue;
    if (i >= coins || (layer === 'behind' && i % 2 !== 0) || (layer === 'front' && i % 2 === 0)) {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      continue;
    }
    const seed = i / coins;
    const spin = t * (mode === 'orbit' ? 6.5 : mode === 'stream' ? 4.2 : 8.6) + i * 0.7;
    const rBase =
      mode === 'burst' ? 42 + smoothstep(0.42, 0.7, t) * 74 : 58 + smoothstep(0.1, 0.55, t) * 36;
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
    applyFocusCoinTokenDom(el, px, py, size, alpha, glowColor);
  }
}

function applyOrbitSparksDom(container, sparkEls, opts) {
  if (!container) return;
  const { t, offsetX, offsetY, color } = opts;
  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  setElOpacity(container, 1);
  for (let i = 0; i < sparkEls.length; i += 1) {
    const el = sparkEls[i];
    if (!el) continue;
    const a = (i / 18) * Math.PI * 2 + t * 4.5;
    const r = 56 + Math.sin(t * 10 + i) * 12 + smoothstep(0.1, 0.7, t) * 105;
    const s = 3 + (i % 3);
    el.style.left = `${Math.cos(a) * r}px`;
    el.style.top = `${Math.sin(a) * r}px`;
    el.style.width = `${s}px`;
    el.style.height = `${s}px`;
    el.style.opacity = String(0.8 * (1 - t * 0.7));
    el.style.boxShadow = `0 0 ${s * 4}px ${color}`;
    el.style.background = color;
  }
}

function applyAfterImageDom(container, ghostEls, opts) {
  if (!container) return;
  const { t, offsetX, offsetY, rot, scale, color } = opts;
  const on = smoothstep(0.2, 0.6, t) * (1 - smoothstep(0.78, 0.99, t));
  if (on <= 0.01) {
    setElOpacity(container, 0);
    return;
  }
  container.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${rot}deg) scale(${scale})`;
  setElOpacity(container, on);
  for (let i = 0; i < ghostEls.length; i += 1) {
    const el = ghostEls[i];
    if (!el) continue;
    el.style.border = `1px solid ${color}`;
    el.style.transform = `translate(${(i + 1) * -8}px, ${(i + 1) * 2}px) scale(${1 - i * 0.03})`;
    el.style.opacity = String(on * (0.3 - i * 0.08));
    el.style.boxShadow = `0 0 10px ${color}`;
  }
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
  showPerfectPlayer = false,
  showPerfectEnemy = false,
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
          willChange: 'transform, opacity',
          pointerEvents: 'none',
          overflow: 'visible',
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
          effectiveArmyBonus={fieldArmyBonusDisplay(battleResult, true)}
          effectiveAbility={fieldAbilityDisplay(battleResult, true)}
          abilityNotTriggered={display.showPlayerAbilityNotTriggered}
          bonusNotTriggered={display.showPlayerBonusNotTriggered}
          suppressAnimations
        />
        <PerfectFocusStamp active={showPerfectPlayer} side="player" compact holdMs={1500} />
      </div>
      <div
        ref={enemyWrapRef}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: enemyClashAnchor,
          display: 'inline-flex',
          borderRadius: '0.75rem',
          willChange: 'transform, opacity',
          pointerEvents: 'none',
          overflow: 'visible',
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
          effectiveArmyBonus={fieldArmyBonusDisplay(battleResult, false)}
          effectiveAbility={fieldAbilityDisplay(battleResult, false)}
          abilityNotTriggered={display.showEnemyAbilityNotTriggered}
          bonusNotTriggered={display.showEnemyBonusNotTriggered}
          suppressAnimations
        />
        <PerfectFocusStamp active={showPerfectEnemy} side="enemy" compact holdMs={1500} />
      </div>
    </>
  );
});

function RayShell({ count, centerY, anchorX, zIndex, containerRef, raysRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: centerY,
        left: anchorX,
        pointerEvents: 'none',
        zIndex,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            raysRef.current[i] = el;
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 90,
            height: 3,
            transformOrigin: '0 50%',
          }}
        />
      ))}
    </div>
  );
}

function CoinLayerShell({ count, centerY, anchorX, zIndex, armyKey, containerRef, coinsRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: centerY,
        left: anchorX,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            coinsRef.current[i] = el;
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 40,
            height: 40,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {armyKey ? <Icon name={armyKey} type="army" size={24} /> : <Icon name="coin" type="cardIcon" size={24} />}
        </div>
      ))}
    </div>
  );
}

function OrbitCollapseShell({ count, centerY, anchorX, armyVisual, containerRef, coinsRef, crestRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: centerY,
        left: anchorX,
        zIndex: 180,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            coinsRef.current[i] = el;
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 40,
            height: 40,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {armyVisual?.key ? (
            <Icon name={armyVisual.key} type="army" size={24} />
          ) : (
            <Icon name="coin" type="cardIcon" size={24} />
          )}
        </div>
      ))}
      {armyVisual && (
        <div
          ref={crestRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 182,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        >
          <Icon name={armyVisual.key} type="army" size={128} color={armyVisual.color} />
        </div>
      )}
    </div>
  );
}

function SparkShell({ centerY, anchorX, containerRef, sparksRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: centerY,
        left: anchorX,
        zIndex: 128,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            sparksRef.current[i] = el;
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 3,
            height: 3,
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}

function AfterImageShell({ centerY, anchorX, containerRef, ghostsRef }) {
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: centerY,
        left: anchorX,
        zIndex: 126,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            ghostsRef.current[i] = el;
          }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '0.55rem',
          }}
        />
      ))}
    </div>
  );
}

export function DuelClashAuroraSequence({
  battleResult,
  duelPhase,
  duelEffectStep = 1,
  variant = 'v1',
  galleryCardLayout,
  getAbilityCurrentValue,
  isZoomed = true,
}) {
  const { runId, active } = useSequenceRun(duelPhase);
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
  const dyn = React.useMemo(() => computeDynamicClashVfx(battleResult), [battleResult]);
  const speed = Number.isFinite(dyn?.clashSpeed) && dyn.clashSpeed > 0 ? dyn.clashSpeed : 1;
  const intensity = Number.isFinite(dyn?.intensity) && dyn.intensity > 0 ? dyn.intensity : 1;
  const durationMs = Math.max(
    DUEL_PHASE4_MIN_MS,
    Math.round(DUEL_VISUAL_DEFAULTS.phaseMs4 / speed)
  );

  const playerWrapRef = React.useRef(null);
  const enemyWrapRef = React.useRef(null);
  const motionCfgRef = React.useRef(null);
  const overlayRefs = React.useRef(null);
  const perfectArmedRef = React.useRef(false);
  const [perfectShown, setPerfectShown] = React.useState(false);

  if (!overlayRefs.current) {
    overlayRefs.current = {
      flash: null,
      impactOuter: null,
      impactInner: null,
      sigil: null,
      banner: null,
      playerAura: null,
      enemyAura: null,
      playerFocusAura: null,
      enemyFocusAura: null,
      playerRays: null,
      enemyRays: null,
      playerRayEls: [],
      enemyRayEls: [],
      playerSparks: null,
      enemySparks: null,
      playerSparkEls: [],
      enemySparkEls: [],
      playerAfter: null,
      enemyAfter: null,
      playerGhostEls: [],
      enemyGhostEls: [],
      pCoinBehind: null,
      eCoinBehind: null,
      pCoinFront: null,
      eCoinFront: null,
      pCoinBehindEls: [],
      eCoinBehindEls: [],
      pCoinFrontEls: [],
      eCoinFrontEls: [],
      pOrbit: null,
      eOrbit: null,
      pOrbitEls: [],
      eOrbitEls: [],
      pCrest: null,
      eCrest: null,
    };
  }
  const refs = overlayRefs.current;

  const paintFrame = React.useCallback((t, orbitSec) => {
    const cfg = motionCfgRef.current;
    if (!cfg) return;
    const motion = computeCardMotion(t, orbitSec, cfg);
    applyCardWrapperMotion(playerWrapRef.current, motion.player);
    applyCardWrapperMotion(enemyWrapRef.current, motion.enemy);

    const frame = computeClashOverlayFrame(t, orbitSec, cfg);
    const {
      playerClashAnchor,
      enemyClashAnchor,
      playerArmy,
      enemyArmy,
      beamWidth,
      pSecondary,
      eSecondary,
      isN5,
      showOrbitSparks,
      focusFxMode,
      playerFocusCount,
      enemyFocusCount,
      winner,
    } = cfg;

    applyChargeRaysDom(refs.playerRays, refs.playerRayEls, {
      show: frame.showRays,
      strength: frame.rayStrength,
      spin: frame.raySpin,
      fade: frame.raysFade,
      offsetX: frame.pX + frame.sx,
      offsetY: frame.sy,
      color: playerArmy.color,
      secondaryColor: pSecondary,
      beamWidth,
      anchorX: playerClashAnchor,
    });
    applyChargeRaysDom(refs.enemyRays, refs.enemyRayEls, {
      show: frame.showRays,
      strength: frame.rayStrength,
      spin: -frame.raySpin,
      fade: frame.raysFade,
      offsetX: frame.eX + frame.sx,
      offsetY: frame.sy,
      color: enemyArmy.color,
      secondaryColor: eSecondary,
      beamWidth,
      anchorX: enemyClashAnchor,
    });

    applyImpactRingsDom(refs.impactOuter, refs.impactInner, frame.impact);

    if (showOrbitSparks) {
      applyOrbitSparksDom(refs.playerSparks, refs.playerSparkEls, {
        t: frame.sparksT,
        offsetX: frame.pX + frame.sx,
        offsetY: frame.sy,
        color: playerArmy.color,
      });
      applyOrbitSparksDom(refs.enemySparks, refs.enemySparkEls, {
        t: frame.sparksT,
        offsetX: frame.eX + frame.sx,
        offsetY: frame.sy,
        color: enemyArmy.color,
      });
      applyAfterImageDom(refs.playerAfter, refs.playerGhostEls, {
        t: frame.t,
        offsetX: frame.pX + frame.sx,
        offsetY: frame.sy,
        rot: frame.pRot + frame.playerVariantRot,
        scale: frame.pScale * frame.playerVariantScale,
        color: playerArmy.color,
      });
      applyAfterImageDom(refs.enemyAfter, refs.enemyGhostEls, {
        t: frame.t,
        offsetX: frame.eX + frame.sx,
        offsetY: frame.sy,
        rot: frame.eRot + frame.enemyVariantRot,
        scale: frame.eScale * frame.enemyVariantScale,
        color: enemyArmy.color,
      });
    }

    if (focusFxMode) {
      const commonP = {
        t: frame.t,
        offsetX: frame.pX + frame.sx,
        offsetY: frame.sy,
        mode: focusFxMode,
        side: 'right',
        winner: winner === 'player',
        focusCount: playerFocusCount,
      };
      const commonE = {
        t: frame.t,
        offsetX: frame.eX + frame.sx,
        offsetY: frame.sy,
        mode: focusFxMode,
        side: 'left',
        winner: winner === 'enemy',
        focusCount: enemyFocusCount,
      };
      applyFocusCoinFxDom(refs.pCoinBehind, refs.pCoinBehindEls, { ...commonP, layer: 'behind' });
      applyFocusCoinFxDom(refs.eCoinBehind, refs.eCoinBehindEls, { ...commonE, layer: 'behind' });
      applyFocusCoinFxDom(refs.pCoinFront, refs.pCoinFrontEls, { ...commonP, layer: 'front' });
      applyFocusCoinFxDom(refs.eCoinFront, refs.eCoinFrontEls, { ...commonE, layer: 'front' });
    }

    if (refs.sigil) {
      if (!frame.showSigil) {
        setElOpacity(refs.sigil, 0);
      } else {
        refs.sigil.style.transform = `translate(-50%, -50%) scale(${frame.sigilScale}) rotate(${frame.sigilRot}deg)`;
        setElOpacity(refs.sigil, frame.sigilOpacity);
      }
    }

    applyAgentAuraDom(refs.playerAura, {
      mode: frame.playerAgentFx,
      intensity: frame.playerAuraIntensity,
      offsetX: frame.pX + frame.sx,
      offsetY: frame.sy,
      scale: frame.pScale,
      color: playerArmy.color,
      t: frame.t,
    });
    applyAgentAuraDom(refs.enemyAura, {
      mode: frame.enemyAgentFx,
      intensity: frame.enemyAuraIntensity,
      offsetX: frame.eX + frame.sx,
      offsetY: frame.sy,
      scale: frame.eScale,
      color: enemyArmy.color,
      t: frame.t,
    });
    applyFocusChargeAuraDom(refs.playerFocusAura, {
      glowColor: frame.playerFocusGlow,
      intensity: Math.max(0, frame.playerFocusAura - 1),
      offsetX: frame.pX + frame.sx,
      offsetY: frame.sy,
      scale: frame.pScale,
    });
    applyFocusChargeAuraDom(refs.enemyFocusAura, {
      glowColor: frame.enemyFocusGlow,
      intensity: Math.max(0, frame.enemyFocusAura - 1),
      offsetX: frame.eX + frame.sx,
      offsetY: frame.sy,
      scale: frame.eScale,
    });

    if (isN5) {
      applyFocusCoinOrbitCollapseDom(refs.pOrbit, refs.pOrbitEls, refs.pCrest, {
        t: frame.t,
        orbitSec: frame.orbitSec,
        focusCount: battleResult?.playerFocusUsed,
        side: 'right',
        armyVisual: playerArmy,
        offsetX: frame.pX + frame.sx,
        offsetY: frame.sy,
      });
      applyFocusCoinOrbitCollapseDom(refs.eOrbit, refs.eOrbitEls, refs.eCrest, {
        t: frame.t,
        orbitSec: frame.orbitSec,
        focusCount: battleResult?.enemyFocusUsed,
        side: 'left',
        armyVisual: enemyArmy,
        offsetX: frame.eX + frame.sx,
        offsetY: frame.sy,
      });
    }

    if (refs.flash) {
      refs.flash.style.opacity = String(frame.flash * 0.7);
      refs.flash.style.visibility = frame.flash > 0.01 ? 'visible' : 'hidden';
    }

    if (refs.banner) {
      if (frame.bannerOpacity <= 0.01) {
        setElOpacity(refs.banner, 0);
      } else {
        refs.banner.style.transform = `translateX(-50%) scale(${frame.bannerReveal})`;
        setElOpacity(refs.banner, frame.bannerOpacity);
      }
    }

    if (frame.showPerfect && !perfectArmedRef.current) {
      perfectArmedRef.current = true;
      setPerfectShown(true);
    }

    if (t >= 1) {
      if (playerWrapRef.current) playerWrapRef.current.style.willChange = 'auto';
      if (enemyWrapRef.current) enemyWrapRef.current.style.willChange = 'auto';
    }
  }, [battleResult, refs]);

  const { animRef } = useClashAnimationLoop(durationMs, runId, paintFrame);

  React.useEffect(() => {
    perfectArmedRef.current = false;
    setPerfectShown(false);
  }, [runId]);

  React.useLayoutEffect(() => {
    if (!active || !battleResult || !motionCfgRef.current) return;
    const { t, orbitSec } = animRef.current;
    paintFrame(t, orbitSec);
  }, [active, runId, battleResult, paintFrame, animRef]);

  if (!battleResult || !active) return null;

  const winner = battleResult.winner;
  const perfectFocusSide =
    battleResult.perfectFocusSide ?? getPerfectFocusSide(battleResult);
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

  const cfg = motionCfgRef.current;
  const isN5 = cfg.isN5;
  const isV1Like = cfg.isV1Like;
  const showOrbitSparks = cfg.showOrbitSparks;
  const focusFxMode = cfg.focusFxMode;
  const rayCount = cfg.rayCount;
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

  const playerClashAnchor = cfg.playerClashAnchor;
  const enemyClashAnchor = cfg.enemyClashAnchor;
  const agentCenterY = cfg.agentCenterY;
  const focusCoinSlots = focusFxMode === 'burst' ? 14 : focusFxMode === 'stream' ? 12 : 10;
  const orbitSlots = clamp(
    Math.max(
      Math.round(Number(battleResult.playerFocusUsed) || 0),
      Math.round(Number(battleResult.enemyFocusUsed) || 0),
      1
    ),
    1,
    14
  );

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
      {isV1Like && (
        <>
          <RayShell
            count={rayCount}
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            zIndex={120}
            containerRef={(el) => {
              refs.playerRays = el;
            }}
            raysRef={{ current: refs.playerRayEls }}
          />
          <RayShell
            count={rayCount}
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            zIndex={120}
            containerRef={(el) => {
              refs.enemyRays = el;
            }}
            raysRef={{ current: refs.enemyRayEls }}
          />
        </>
      )}

      <div
        ref={(el) => {
          bindClashEl(refs, 'impactOuter', el);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 120,
          height: 120,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
        }}
      />
      <div
        ref={(el) => {
          bindClashEl(refs, 'impactInner', el);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 70,
          height: 70,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
        }}
      />

      {showOrbitSparks && (
        <>
          <SparkShell
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            containerRef={(el) => {
              refs.playerSparks = el;
            }}
            sparksRef={{ current: refs.playerSparkEls }}
          />
          <SparkShell
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            containerRef={(el) => {
              refs.enemySparks = el;
            }}
            sparksRef={{ current: refs.enemySparkEls }}
          />
          <AfterImageShell
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            containerRef={(el) => {
              refs.playerAfter = el;
            }}
            ghostsRef={{ current: refs.playerGhostEls }}
          />
          <AfterImageShell
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            containerRef={(el) => {
              refs.enemyAfter = el;
            }}
            ghostsRef={{ current: refs.enemyGhostEls }}
          />
        </>
      )}

      {focusFxMode && (
        <>
          <CoinLayerShell
            count={focusCoinSlots}
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            zIndex={126}
            armyKey={null}
            containerRef={(el) => {
              refs.pCoinBehind = el;
            }}
            coinsRef={{ current: refs.pCoinBehindEls }}
          />
          <CoinLayerShell
            count={focusCoinSlots}
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            zIndex={126}
            armyKey={null}
            containerRef={(el) => {
              refs.eCoinBehind = el;
            }}
            coinsRef={{ current: refs.eCoinBehindEls }}
          />
          <CoinLayerShell
            count={focusCoinSlots}
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            zIndex={142}
            armyKey={null}
            containerRef={(el) => {
              refs.pCoinFront = el;
            }}
            coinsRef={{ current: refs.pCoinFrontEls }}
          />
          <CoinLayerShell
            count={focusCoinSlots}
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            zIndex={142}
            armyKey={null}
            containerRef={(el) => {
              refs.eCoinFront = el;
            }}
            coinsRef={{ current: refs.eCoinFrontEls }}
          />
        </>
      )}

      <div
        ref={(el) => {
          bindClashEl(refs, 'sigil', el);
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
        }}
      >
        <Sigil armyVisual={winArmy} size={520} />
      </div>

      <div
        ref={(el) => {
          bindClashEl(refs, 'playerAura', el);
        }}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: playerClashAnchor,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 128,
        }}
      />
      <div
        ref={(el) => {
          bindClashEl(refs, 'enemyAura', el);
        }}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: enemyClashAnchor,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 128,
        }}
      />
      <div
        ref={(el) => {
          bindClashEl(refs, 'playerFocusAura', el);
        }}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: playerClashAnchor,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 125,
        }}
      />
      <div
        ref={(el) => {
          bindClashEl(refs, 'enemyFocusAura', el);
        }}
        style={{
          position: 'absolute',
          top: agentCenterY,
          left: enemyClashAnchor,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 125,
        }}
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
        showPerfectPlayer={perfectShown && perfectFocusSide === 'player'}
        showPerfectEnemy={perfectShown && perfectFocusSide === 'enemy'}
      />

      {isN5 && (
        <>
          <OrbitCollapseShell
            count={orbitSlots}
            centerY={agentCenterY}
            anchorX={playerClashAnchor}
            armyVisual={playerArmy}
            containerRef={(el) => {
              refs.pOrbit = el;
            }}
            coinsRef={{ current: refs.pOrbitEls }}
            crestRef={(el) => {
              refs.pCrest = el;
            }}
          />
          <OrbitCollapseShell
            count={orbitSlots}
            centerY={agentCenterY}
            anchorX={enemyClashAnchor}
            armyVisual={enemyArmy}
            containerRef={(el) => {
              refs.eOrbit = el;
            }}
            coinsRef={{ current: refs.eOrbitEls }}
            crestRef={(el) => {
              refs.eCrest = el;
            }}
          />
        </>
      )}


      <div
        ref={(el) => {
          bindClashEl(refs, 'flash', el);
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#fff',
          zIndex: 70,
          mixBlendMode: 'screen',
        }}
      />

      <div
        ref={(el) => {
          bindClashEl(refs, 'banner', el);
        }}
        style={{
          position: 'absolute',
          top: 110,
          left: '50%',
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
            textShadow: `0 0 24px ${
              winner === 'player' ? DUEL_ACCENTS.victoryGold : DUEL_ACCENTS.defeatBlood
            }, 0 0 48px ${winArmy.color}, 0 4px 12px #000`,
            WebkitTextStroke: '1.5px rgba(0,0,0,0.8)',
          }}
        >
          {winner === 'player' ? 'Trionfo' : 'Sconfitta'}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'Share Tech Mono',
            fontSize: 14,
            color: '#fff',
            letterSpacing: '0.22em',
            textShadow: '0 0 8px #000',
          }}
        >
          {(
            (winner === 'player' ? battleResult.playerAgent?.name : battleResult.enemyAgent?.name) ||
            ''
          ).toUpperCase()}{' '}
          · VA {winner === 'player' ? battleResult.playerAssault : battleResult.enemyAssault} → −
          {battleResult.damageDealt} PV
        </div>
      </div>
    </div>
  );
}

