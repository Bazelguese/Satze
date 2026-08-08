// ============================================
// Corpi UI duello in fase risultato (carte + FC + VA + danno vincitore)
// Duello ufficiale: Codice/satze.jsx — anteprima: DuelVfxSimulator / Duel VFX Lab.
// ============================================

import React from 'react';
import { GameCard } from '../cards/GameCard';
import { Icon } from '../ui/Icon';
import { computePhase3DurationMs, countDuelPhase3SubSteps } from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS, computeDynamicClashVfx } from '../../config/duelVisualConfig.js';
import { ARMY_BONUSES } from '../../data/armies.js';
import {
  getDuelVisualDisplay,
  getDuelFocusPhasePower,
  modifiedStatOrNull,
  buildVaModProgressionLines,
} from './duelVisualDisplay.js';
import { DUEL_CLASH_START_OFFSET_PX } from '../../config/duelClashLayout.js';
import { DUEL_ACCENTS } from '../../theme/duelAccents.js';
import { getVfxQualityProfile } from '../../settings/vfxQualityProfile.js';
import { PerfectFocusStamp } from './PerfectFocusStamp.jsx';
import { getPerfectFocusSide } from '../../game/duel/perfectFocusBet.js';

/** Armata con bonus in dati ma regola mazzo non soddisfatta (non trigger, non copia, non blocco). */
function duelBonusBaseInactive(agent, hasBonus, bonusNotTriggered, bonusBlocked, bonusCopied) {
  if (!agent?.army || !ARMY_BONUSES[agent.army]) return false;
  if (bonusCopied || bonusBlocked) return false;
  return !hasBonus && !bonusNotTriggered;
}

/** Particelle VA: offset fissi da seed per evitare salti a ogni render (es. VFX Lab). */
function vaParticleOffsets(seed, count = 8) {
  const out = [];
  let s = seed >>> 0;
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const x = ((s % 200) - 100) / 100 * 50;
    s = (s * 1103515245 + 12345) >>> 0;
    const y = ((s % 200) - 100) / 100 * 50;
    out.push({ x, y });
  }
  return out;
}

const DEFAULT_DYNAMIC_CLASH = { clashSpeed: 1, intensity: 1, gap: 0, totalFc: 0 };

function getDuelClashKey(battleResult) {
  if (!battleResult) return 'none';
  return [
    battleResult.playerAssault ?? 0,
    battleResult.enemyAssault ?? 0,
    battleResult.playerFocusUsed ?? 0,
    battleResult.enemyFocusUsed ?? 0,
    battleResult.winner ?? 'draw',
  ].join('|');
}

/**
 * Congela i valori dinamici del clash quando il duello entra in fase 4.
 * Evita ricalcoli ad ogni render durante la stessa animazione.
 */
function useClashDynamicSnapshot(battleResult, duelPhase) {
  const snapshotRef = React.useRef({ key: 'none', value: DEFAULT_DYNAMIC_CLASH });
  if (duelPhase >= 4 && battleResult) {
    const key = getDuelClashKey(battleResult);
    if (snapshotRef.current.key !== key) {
      snapshotRef.current = { key, value: computeDynamicClashVfx(battleResult) };
    }
  }
  return snapshotRef.current.value;
}

function normalizeClashDyn(dyn) {
  const clashSpeed = Number.isFinite(dyn?.clashSpeed) && dyn.clashSpeed > 0 ? dyn.clashSpeed : 1;
  const baseIntensity = Number.isFinite(dyn?.intensity) && dyn.intensity > 0 ? dyn.intensity : 1;
  const mul = getVfxQualityProfile().clashIntensityMul;
  const intensity = baseIntensity * (Number.isFinite(mul) ? mul : 1);
  return { clashSpeed, intensity };
}

function useClashSequenceWindow(duelPhase, clashSpeed) {
  const [active, setActive] = React.useState(false);
  const prevPhaseRef = React.useRef(duelPhase);
  React.useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = duelPhase;
    const entered = prev < 4 && duelPhase >= 4;
    if (!entered) return undefined;
    setActive(true);
    const holdMs = Math.max(1200, Math.round(1600 / Math.max(0.1, clashSpeed)));
    const id = setTimeout(() => setActive(false), holdMs);
    return () => clearTimeout(id);
  }, [duelPhase, clashSpeed]);
  return active;
}

/** Dati VA per animazione fase 3 (con fallback se mancano campi su battleResult legacy). */
function vaPhase3Numbers(br, isPlayer) {
  const power = isPlayer ? br.playerPower : br.enemyPower;
  const focus = isPlayer ? br.playerFocusUsed : br.enemyFocusUsed;
  const mod = isPlayer ? br.playerAssaultMod ?? 0 : br.enemyAssaultMod ?? 0;
  const agent = isPlayer ? br.playerAgent : br.enemyAgent;
  const p = power ?? 0;
  const f = focus ?? 0;
  const raw =
    (isPlayer ? br.playerAssaultRaw : br.enemyAssaultRaw) ?? p * f + mod;
  const minFinal =
    (isPlayer ? br.playerAssaultMinFinal : br.enemyAssaultMinFinal) ?? agent?.power ?? 0;
  const final = isPlayer ? br.playerAssault : br.enemyAssault;
  return { power: p, focus: f, mod, raw, minFinal, final, product: p * f };
}

/** Solo mod e clamp minimo (POT×FC avviene in fase 2). */
function buildVaPhase3Lines(br, isPlayer, duelEffectStep = 1) {
  const { mod, raw, minFinal, final } = vaPhase3Numbers(br, isPlayer);
  const modLines = buildVaModProgressionLines(br, isPlayer);
  const needsFloor = raw < minFinal;
  const lines = [];

  if (modLines.length > 0) {
    const modVisible = Math.min(modLines.length, Math.max(1, duelEffectStep));
    modLines.slice(0, modVisible).forEach((line) => lines.push(line));
  } else if (mod !== 0) {
    const sign = mod > 0 ? '+' : '';
    lines.push({ key: 'mod', main: `${sign}${mod} mod VA`, sub: `= ${raw}` });
  }

  const floorAtStep = modLines.length > 0 ? modLines.length + 1 : 1;
  if (needsFloor && duelEffectStep >= floorAtStep) {
    lines.push({
      key: 'floor',
      main: `Non sotto ${minFinal}`,
      sub: `→ ${final} VA (minimo di schieramento)`,
    });
  }
  return lines;
}

/** Danno inflitto dal vincitore (`damageDealt`), sotto il VA dalla fase 5 in poi. */
function DuelWinnerDamageUnderVa({ battleResult, duelPhase, winnerSide }) {
  if (duelPhase < 5 || !battleResult) return null;
  const w = battleResult.winner;
  if (winnerSide === 'player' && w !== 'player') return null;
  if (winnerSide === 'enemy' && w !== 'enemy') return null;
  const dmg = battleResult.damageDealt;
  if (dmg == null || !Number.isFinite(Number(dmg))) return null;
  const accent = winnerSide === 'player' ? DUEL_ACCENTS.winnerPlayerGlow : DUEL_ACCENTS.winnerEnemyGlow;
  return (
    <div className="mt-3 pt-2 border-t border-white/10">
      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Danno inflitto</div>
      <div
        className="text-2xl font-black tabular-nums satze-va-number"
        style={{ color: accent, textShadow: '0 0 12px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,1)' }}
      >
        {dmg}
      </div>
    </div>
  );
}

/** Fase 2: POT in evidenza; risultato parziale = POT × FC già assegnate (0, poi +1 moneta alla volta). */
function DuelVaPhase2LiveBlock({ power, focusUsed, coinsShown }) {
  const p = power ?? 0;
  const f = focusUsed ?? 0;
  const shown = Math.min(Math.max(0, coinsShown), f);
  const interimVa = f <= 0 ? 0 : p * shown;
  let formulaLine;
  if (f <= 0) {
    formulaLine = `${p} × 0 = 0`;
  } else if (shown === 0) {
    formulaLine = `${p} × 0 = 0 · +${p} per ogni FC`;
  } else {
    formulaLine = `${p} × ${shown}${shown < f ? ` (di ${f} FC)` : ''} = ${interimVa}`;
  }

  return (
    <div className="text-center">
      <div className="text-amber-400/85 text-xs font-bold uppercase tracking-widest mb-1.5">× Focus coin</div>
      <div className="text-slate-400 text-[11px] leading-snug mb-1">VA base (POT)</div>
      <div className="text-slate-100 text-lg font-bold tabular-nums leading-none mb-1">{p}</div>
      <div className="text-slate-400 text-xs tabular-nums mb-1">
        FC {shown}/{f}
      </div>
      <div className="text-teal-300/95 text-xl font-black tabular-nums leading-tight transition-[color,transform] duration-300 ease-out">
        {interimVa}
      </div>
      <div className="text-slate-500 text-[11px] tabular-nums mt-1 leading-snug">{formulaLine}</div>
    </div>
  );
}

function toSoftFill(mainColor, alpha = 0.2) {
  if (typeof mainColor !== 'string') return `rgba(234, 179, 8, ${alpha})`;
  if (mainColor.startsWith('rgba(')) {
    return mainColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${alpha})`);
  }
  if (mainColor.startsWith('rgb(')) {
    return mainColor.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  }
  return mainColor;
}

function FocusCoinOrbitCountRing({
  duelPhase,
  focusUsed,
  coinsShown,
  cardGlow,
  getFocusCoinGlowColor,
  armyName,
  direction = 1,
}) {
  const isActive = duelPhase >= 2 && duelPhase < 4 && focusUsed > 0;
  const shownCount = Math.max(0, Math.min(focusUsed, coinsShown));
  const isRendered = isActive && shownCount > 0;
  // Rotazione via CSS: stessa velocità del vecchio clock rAF (rad/s -> periodo)
  const spinSpeed = 1.4 + focusUsed * 0.22;
  const periodSec = (Math.PI * 2) / spinSpeed;
  // Ancora la rotazione all'orologio globale (performance.now, stessa origine
  // dei timestamp rAF usati dalla sequenza clash): il delay negativo fa partire
  // l'animazione CSS dall'angolo `globalSec * spinSpeed`, così la posizione è
  // continua sia tra le fasi 2-3 sia nel passaggio allo scontro (fase 4), che
  // calcola le monete con la stessa formula sull'orologio globale.
  // Catturato nel momento in cui l'anello appare davvero (non alla prima render,
  // quando è ancora nascosto) e azzerato quando scompare.
  const anchorRef = React.useRef(null);
  if (!isRendered) {
    anchorRef.current = null;
  } else if (anchorRef.current == null) {
    anchorRef.current = -((performance.now() / 1000) % periodSec);
  }
  if (!isRendered) return null;
  const shown = shownCount;
  const anchorDelaySec = anchorRef.current;
  const glowColor = getFocusCoinGlowColor(focusUsed, cardGlow);
  const radius = 240;
  const ringAnim = direction >= 0 ? 'satze-orbit-spin-cw' : 'satze-orbit-spin-ccw';
  const coinAnim = direction >= 0 ? 'satze-orbit-spin-ccw' : 'satze-orbit-spin-cw';

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: `${ringAnim} ${periodSec}s linear infinite`,
          animationDelay: `${anchorDelaySec}s`,
        }}
      >
        {Array.from({ length: focusUsed }).map((_, index) => {
          // Le monete sono tutte montate da subito (rivelate via opacity):
          // così le animazioni CSS di anello e contro-rotazioni partono
          // insieme e restano sincronizzate.
          const isVisible = index < shown;
          const slot = index / Math.max(1, focusUsed);
          const angleDeg = -90 + slot * 360;
          return (
            <div
              key={`phase2-ring-${index}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '40px',
                height: '40px',
                margin: '-20px 0 0 -20px',
                transform: `rotate(${angleDeg}deg) translate(${radius}px) rotate(${-angleDeg}deg)`,
                opacity: isVisible ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: `1px solid ${glowColor?.main || 'rgba(234, 179, 8, 0.5)'}`,
                  backgroundColor: toSoftFill(glowColor?.main, 0.2),
                  boxShadow: `0 0 10px ${glowColor?.main || 'rgba(234, 179, 8, 0.8)'}`,
                  display: 'grid',
                  placeItems: 'center',
                  // Contro-rotazione: l'icona resta dritta mentre l'anello gira
                  animation: `${coinAnim} ${periodSec}s linear infinite`,
                  animationDelay: `${anchorDelaySec}s`,
                }}
              >
                {armyName ? <Icon name={armyName} type="army" size={24} /> : <Icon name="coin" type="cardIcon" size={24} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useVaPhase3LineReveal(duelPhase, phaseMs3, lineCount, duelStamp) {
  const [visible, setVisible] = React.useState(0);
  React.useEffect(() => {
    if (duelPhase !== 3 || lineCount <= 0) {
      setVisible(0);
      return;
    }
    setVisible(0);
    const ms = phaseMs3 ?? 2000;
    const stepMs = Math.max(160, Math.floor(ms / Math.max(lineCount, 1)));
    const ids = [];
    for (let i = 0; i < lineCount; i++) {
      ids.push(setTimeout(() => setVisible(i + 1), i * stepMs));
    }
    return () => ids.forEach(clearTimeout);
  }, [duelPhase, phaseMs3, lineCount, duelStamp]);
  return visible;
}

function DuelVaPhase3Breakdown({ battleResult, isPlayer, duelPhase, phaseMs3, duelEffectStep = 1 }) {
  const phase3SubSteps = React.useMemo(
    () => (battleResult ? countDuelPhase3SubSteps(battleResult) : 0),
    [battleResult]
  );
  const lines = React.useMemo(
    () =>
      battleResult
        ? buildVaPhase3Lines(
            battleResult,
            isPlayer,
            phase3SubSteps > 1 ? duelEffectStep : 999
          )
        : [],
    [battleResult, isPlayer, duelEffectStep, phase3SubSteps]
  );
  const duelStamp = isPlayer
    ? `${battleResult?.playerAssault ?? ''}-${battleResult?.playerAssaultRaw ?? ''}`
    : `${battleResult?.enemyAssault ?? ''}-${battleResult?.enemyAssaultRaw ?? ''}`;
  const timedVisible = useVaPhase3LineReveal(duelPhase, phaseMs3, lines.length, duelStamp);
  const visible = phase3SubSteps > 1 ? lines.length : timedVisible;

  if (duelPhase !== 3 || !battleResult || lines.length === 0) return null;

  return (
    <div className="text-center">
      <div className="text-amber-400/85 text-xs font-bold uppercase tracking-widest mb-2">Aggiustamenti VA</div>
      <div className="flex flex-col gap-1.5 items-stretch text-left max-w-[200px] mx-auto">
        {lines.map((line, i) => (
          <div
            key={line.key}
            className={`transition-all duration-200 ${
              i < visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
          >
            <div className="text-slate-100 text-sm font-semibold tabular-nums leading-snug">{line.main}</div>
            {line.sub ? (
              <div className="text-slate-400 text-xs tabular-nums leading-snug pl-0.5">{line.sub}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function initiativePulseStyle(pulse) {
  if (!pulse) return {};
  return {
    boxShadow: '0 0 24px rgba(251, 191, 36, 0.55), 0 0 8px rgba(251, 191, 36, 0.35) inset',
    borderRadius: '0.75rem',
    transition: 'box-shadow 0.45s ease-out',
  };
}

export function DuelResultEnemyResultBody({
  battleResult,
  duelPhase,
  duelEffectStep = 1,
  duelVfx,
  enemyFocusCoinsShown,
  enemyCardGlow,
  getFocusCoinGlowColor,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  particleSeed = 1,
}) {
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
  const focusPower = getDuelFocusPhasePower(battleResult, false);
  const dyn = normalizeClashDyn(useClashDynamicSnapshot(battleResult, duelPhase));
  const clashMs = Math.round(1400 / Math.max(0.1, dyn.clashSpeed));
  const victoryMs = Math.round(1500 / Math.max(0.1, dyn.clashSpeed));
  const particlesMs = Math.round(1000 / Math.max(0.1, dyn.clashSpeed));
  const clashSequenceActive = useClashSequenceWindow(duelPhase, dyn.clashSpeed);
  const particleCount = dyn.intensity <= 0 ? 0 : Math.max(1, Math.round(8 * dyn.intensity));
  const particles = React.useMemo(
    () => (particleCount > 0 ? vaParticleOffsets(particleSeed, particleCount) : []),
    [particleSeed, particleCount]
  );
  const showPerfect =
    duelPhase >= 4 &&
    (battleResult.perfectFocusSide ?? getPerfectFocusSide(battleResult)) === 'enemy';

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="relative flex items-center">
        <div
          className={`relative inline-flex ${duelPhase >= 0 ? 'animate-card-enter-left' : 'opacity-0'}`}
          style={{
            marginTop: '0',
            left: `${-DUEL_CLASH_START_OFFSET_PX}px`,
            ...initiativePulseStyle(display.pulseEnemySide),
            ...(duelPhase >= 2 && battleResult && enemyCardGlow > 0
              ? (() => {
                  const glowColor = getFocusCoinGlowColor(battleResult.enemyFocusUsed, enemyCardGlow);
                  if (!glowColor) return {};
                  return {
                    boxShadow: `0 0 ${10 + enemyCardGlow * 30}px ${glowColor.main}, 
                                 0 0 ${5 + enemyCardGlow * 15}px ${glowColor.secondary} inset,
                                 0 0 ${20 + enemyCardGlow * 40}px ${glowColor.main}`,
                    transition: 'box-shadow 0.3s ease-out',
                    borderRadius: '0.75rem',
                  };
                })()
              : duelPhase > 2 && battleResult && enemyCardGlow >= 1
                ? (() => {
                    const glowColor = getFocusCoinGlowColor(battleResult.enemyFocusUsed, 1);
                    if (!glowColor) return {};
                    return {
                      boxShadow: `0 0 ${40}px ${glowColor.main}, 
                                 0 0 ${20}px ${glowColor.secondary} inset,
                                 0 0 ${60}px ${glowColor.main}`,
                      transition: 'box-shadow 0.3s ease-out',
                      borderRadius: '0.75rem',
                    };
                  })()
                : {}),
          }}
        >
          <GameCard
            cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
            agent={battleResult.enemyAgent}
            showBonus={display.showEnemyBonusActive}
            bonusBaseInactive={duelBonusBaseInactive(
              battleResult.enemyAgent,
              battleResult.enemyArmyBonusActive ?? battleResult.enemyHasBonus,
              display.showEnemyBonusNotTriggered,
              display.showEnemyBonusBlocked,
              display.showEnemyCopiedBonus ? battleResult.enemyBonusCopied : null
            )}
            modifiedPower={modifiedStatOrNull(battleResult.enemyAgent?.power, display.enemyPower)}
            modifiedDamage={modifiedStatOrNull(battleResult.enemyAgent?.damage, display.enemyDamage)}
            abilityCurrentValue={
              display.showEnemyAbilityValue
                ? getAbilityCurrentValue(battleResult.enemyAgent, false)
                : null
            }
            abilityBlocked={display.showEnemyAbilityBlocked}
            bonusBlocked={display.showEnemyBonusBlocked}
            showOperators={display.showOperators}
            highlightAbility={display.highlightEnemyAbility}
            highlightBonus={display.highlightEnemyBonus}
            visualStepKind={display.visualStepKind}
            visualStepIndex={display.visualStepIndex}
            copyAbilityAnim={display.copyEnemyAbilityAnim}
            copyBonusAnim={display.copyEnemyBonusAnim}
            copiedAbility={
              display.showEnemyCopiedAbility ? battleResult.enemyAbilityCopied : null
            }
            copiedAbilityNotTriggered={display.showEnemyCopiedAbilityNotTriggered}
            copiedBonus={display.showEnemyCopiedBonus ? battleResult.enemyBonusCopied : null}
            copiedBonusNotTriggered={display.showEnemyCopiedBonusNotTriggered}
            abilityNotTriggered={display.showEnemyAbilityNotTriggered}
            bonusNotTriggered={display.showEnemyBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: false })}
          />
          <PerfectFocusStamp active={showPerfect} side="enemy" />
          <FocusCoinOrbitCountRing
            duelPhase={duelPhase}
            focusUsed={battleResult.enemyFocusUsed}
            coinsShown={enemyFocusCoinsShown}
            cardGlow={enemyCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            armyName={battleResult.enemyAgent?.army}
            direction={1}
          />
        </div>
      </div>

      <div className="absolute top-full w-full" style={{ top: '100%', marginTop: '12px', transform: `translateX(${-DUEL_CLASH_START_OFFSET_PX}px)` }}>
        {duelPhase === 2 && battleResult && (
          <DuelVaPhase2LiveBlock
            power={focusPower}
            focusUsed={battleResult.enemyFocusUsed}
            coinsShown={enemyFocusCoinsShown}
          />
        )}
        {duelPhase === 3 && battleResult && (
          <DuelVaPhase3Breakdown
            battleResult={battleResult}
            isPlayer={false}
            duelPhase={duelPhase}
            phaseMs3={computePhase3DurationMs({ ...DUEL_VISUAL_DEFAULTS, ...(duelVfx || {}) }, battleResult)}
          />
        )}
        {duelPhase >= 4 && (
          <div
            className={`text-center transition-all duration-300 group relative ${
              duelPhase >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
            data-clash-container
          >
            {clashSequenceActive && battleResult.winner === 'enemy' && (
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((off, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-explosion-particles"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: i % 3 === 0 ? DUEL_ACCENTS.sparkTeal : i % 3 === 1 ? DUEL_ACCENTS.sparkAmber : DUEL_ACCENTS.sparkViolet,
                      '--particle-x': `${off.x}px`,
                      '--particle-y': `${off.y}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${particlesMs}ms`,
                      transform: `scale(${Math.min(1.9, 0.8 + dyn.intensity * 0.45)})`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-amber-400/95 text-sm font-bold uppercase tracking-widest mb-2">Valore Assalto</div>
            <div
              className={`text-4xl font-black value-transition satze-va-number ${
                battleResult.winner === 'enemy' ? '' : 'text-slate-500'
              } ${clashSequenceActive ? 'animate-clash' : ''}`}
              style={{
                animationDuration: clashSequenceActive ? `${clashMs}ms` : undefined,
                ...(battleResult.winner === 'enemy' ? { color: DUEL_ACCENTS.vaWinner } : {}),
                ...(clashSequenceActive && battleResult.winner === 'enemy'
                  ? {
                      textShadow:
                        `1px 1px 0 rgba(0,0,0,0.95), -1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 0 0 ${25 * dyn.intensity}px rgba(79, 209, 197, 0.9), 0 0 ${15 * dyn.intensity}px rgba(255, 179, 71, 0.5)`,
                      filter: 'brightness(1.2)',
                    }
                  : {}),
              }}
            >
              <span
                className={clashSequenceActive && battleResult.winner === 'enemy' ? 'inline-block animate-victory-explosion' : 'inline-block'}
                style={{
                  animationDuration:
                    clashSequenceActive && battleResult.winner === 'enemy' ? `${victoryMs}ms` : undefined,
                }}
              >
                {battleResult.enemyAssault}
              </span>
            </div>
            <DuelWinnerDamageUnderVa battleResult={battleResult} duelPhase={duelPhase} winnerSide="enemy" />
          </div>
        )}
      </div>
    </div>
  );
}

export function DuelResultPlayerResultBody({
  battleResult,
  duelPhase,
  duelEffectStep = 1,
  duelVfx,
  playerFocusCoinsShown,
  playerCardGlow,
  getFocusCoinGlowColor,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  particleSeed = 2,
}) {
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
  const focusPower = getDuelFocusPhasePower(battleResult, true);
  const dyn = normalizeClashDyn(useClashDynamicSnapshot(battleResult, duelPhase));
  const clashMs = Math.round(1400 / Math.max(0.1, dyn.clashSpeed));
  const victoryMs = Math.round(1500 / Math.max(0.1, dyn.clashSpeed));
  const particlesMs = Math.round(1000 / Math.max(0.1, dyn.clashSpeed));
  const clashSequenceActive = useClashSequenceWindow(duelPhase, dyn.clashSpeed);
  const particleCount = dyn.intensity <= 0 ? 0 : Math.max(1, Math.round(8 * dyn.intensity));
  const particles = React.useMemo(
    () => (particleCount > 0 ? vaParticleOffsets(particleSeed, particleCount) : []),
    [particleSeed, particleCount]
  );
  const showPerfect =
    duelPhase >= 4 &&
    (battleResult.perfectFocusSide ?? getPerfectFocusSide(battleResult)) === 'player';

  return (
    <div className="relative w-full h-full flex flex-col items-center pointer-events-auto">
      <div className="relative flex items-center">
        <div
          className={`relative inline-flex ${duelPhase >= 0 ? 'animate-card-enter-right' : 'opacity-0'}`}
          style={{
            marginTop: '0',
            left: `${DUEL_CLASH_START_OFFSET_PX}px`,
            ...initiativePulseStyle(display.pulsePlayerSide),
            ...(duelPhase >= 2 && battleResult && playerCardGlow > 0
              ? (() => {
                  const glowColor = getFocusCoinGlowColor(battleResult.playerFocusUsed, playerCardGlow);
                  if (!glowColor) return {};
                  return {
                    boxShadow: `0 0 ${10 + playerCardGlow * 30}px ${glowColor.main}, 
                                 0 0 ${5 + playerCardGlow * 15}px ${glowColor.secondary} inset,
                                 0 0 ${20 + playerCardGlow * 40}px ${glowColor.main}`,
                    transition: 'box-shadow 0.3s ease-out',
                    borderRadius: '0.75rem',
                  };
                })()
              : duelPhase > 2 && battleResult && playerCardGlow >= 1
                ? (() => {
                    const glowColor = getFocusCoinGlowColor(battleResult.playerFocusUsed, 1);
                    if (!glowColor) return {};
                    return {
                      boxShadow: `0 0 ${40}px ${glowColor.main}, 
                                 0 0 ${20}px ${glowColor.secondary} inset,
                                 0 0 ${60}px ${glowColor.main}`,
                      transition: 'box-shadow 0.3s ease-out',
                      borderRadius: '0.75rem',
                    };
                  })()
                : {}),
          }}
        >
          <GameCard
            cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
            agent={battleResult.playerAgent}
            showBonus={display.showPlayerBonusActive}
            bonusBaseInactive={duelBonusBaseInactive(
              battleResult.playerAgent,
              battleResult.playerArmyBonusActive ?? battleResult.playerHasBonus,
              display.showPlayerBonusNotTriggered,
              display.showPlayerBonusBlocked,
              display.showPlayerCopiedBonus ? battleResult.playerBonusCopied : null
            )}
            modifiedPower={modifiedStatOrNull(battleResult.playerAgent?.power, display.playerPower)}
            modifiedDamage={modifiedStatOrNull(battleResult.playerAgent?.damage, display.playerDamage)}
            abilityCurrentValue={
              display.showPlayerAbilityValue
                ? getAbilityCurrentValue(battleResult.playerAgent, true)
                : null
            }
            abilityBlocked={display.showPlayerAbilityBlocked}
            bonusBlocked={display.showPlayerBonusBlocked}
            showOperators={display.showOperators}
            highlightAbility={display.highlightPlayerAbility}
            highlightBonus={display.highlightPlayerBonus}
            visualStepKind={display.visualStepKind}
            visualStepIndex={display.visualStepIndex}
            copyAbilityAnim={display.copyPlayerAbilityAnim}
            copyBonusAnim={display.copyPlayerBonusAnim}
            copiedAbility={
              display.showPlayerCopiedAbility ? battleResult.playerAbilityCopied : null
            }
            copiedAbilityNotTriggered={display.showPlayerCopiedAbilityNotTriggered}
            copiedBonus={display.showPlayerCopiedBonus ? battleResult.playerBonusCopied : null}
            copiedBonusNotTriggered={display.showPlayerCopiedBonusNotTriggered}
            abilityNotTriggered={display.showPlayerAbilityNotTriggered}
            bonusNotTriggered={display.showPlayerBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: true })}
          />
          <PerfectFocusStamp active={showPerfect} side="player" />
          <FocusCoinOrbitCountRing
            duelPhase={duelPhase}
            focusUsed={battleResult.playerFocusUsed}
            coinsShown={playerFocusCoinsShown}
            cardGlow={playerCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            armyName={battleResult.playerAgent?.army}
            direction={-1}
          />
        </div>
      </div>

      <div className="absolute top-full w-full" style={{ top: '100%', marginTop: '12px', transform: `translateX(${DUEL_CLASH_START_OFFSET_PX}px)` }}>
        {duelPhase === 2 && battleResult && (
          <DuelVaPhase2LiveBlock
            power={focusPower}
            focusUsed={battleResult.playerFocusUsed}
            coinsShown={playerFocusCoinsShown}
          />
        )}
        {duelPhase === 3 && battleResult && (
          <DuelVaPhase3Breakdown
            battleResult={battleResult}
            isPlayer
            duelPhase={duelPhase}
            phaseMs3={computePhase3DurationMs({ ...DUEL_VISUAL_DEFAULTS, ...(duelVfx || {}) }, battleResult)}
          />
        )}
        {duelPhase >= 4 && (
          <div
            className={`text-center transition-all duration-300 group relative ${
              duelPhase >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
            data-clash-container
          >
            {clashSequenceActive && battleResult.winner === 'player' && (
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((off, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-explosion-particles"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: i % 3 === 0 ? DUEL_ACCENTS.sparkTeal : i % 3 === 1 ? DUEL_ACCENTS.sparkAmber : DUEL_ACCENTS.sparkViolet,
                      '--particle-x': `${off.x}px`,
                      '--particle-y': `${off.y}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${particlesMs}ms`,
                      transform: `scale(${Math.min(1.9, 0.8 + dyn.intensity * 0.45)})`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-amber-400/95 text-sm font-bold uppercase tracking-widest mb-2">Valore Assalto</div>
            <div
              className={`text-4xl font-black value-transition satze-va-number ${
                battleResult.winner === 'player' ? '' : 'text-slate-500'
              } ${clashSequenceActive ? 'animate-clash' : ''}`}
              style={{
                animationDuration: clashSequenceActive ? `${clashMs}ms` : undefined,
                ...(battleResult.winner === 'player' ? { color: DUEL_ACCENTS.vaWinner } : {}),
                ...(clashSequenceActive && battleResult.winner === 'player'
                  ? {
                      textShadow:
                        `1px 1px 0 rgba(0,0,0,0.95), -1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 0 0 ${25 * dyn.intensity}px rgba(79, 209, 197, 0.9), 0 0 ${15 * dyn.intensity}px rgba(255, 179, 71, 0.5)`,
                      filter: 'brightness(1.2)',
                    }
                  : {}),
              }}
            >
              <span
                className={clashSequenceActive && battleResult.winner === 'player' ? 'inline-block animate-victory-explosion' : 'inline-block'}
                style={{
                  animationDuration:
                    clashSequenceActive && battleResult.winner === 'player' ? `${victoryMs}ms` : undefined,
                }}
              >
                {battleResult.playerAssault}
              </span>
            </div>
            <DuelWinnerDamageUnderVa battleResult={battleResult} duelPhase={duelPhase} winnerSide="player" />
          </div>
        )}
      </div>
    </div>
  );
}
