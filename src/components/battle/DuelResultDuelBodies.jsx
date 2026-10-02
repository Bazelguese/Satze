// ============================================
// Corpi UI duello in fase risultato (carte + FC; il VA è nella scheda laterale DuelVaLedger)
// Duello ufficiale: Codice/satze.jsx — anteprima: DuelVfxSimulator / Duel VFX Lab.
// ============================================

import React, { useSyncExternalStore } from 'react';
import { GameCard } from '../cards/GameCard';
import { Icon } from '../ui/Icon';
import { ARMY_BONUSES } from '../../data/armies.js';
import {
  getDuelVisualDisplay,
  modifiedStatOrNull,
} from './duelVisualDisplay.js';
import { DUEL_CLASH_START_OFFSET_PX } from '../../config/duelClashLayout.js';
import { PerfectFocusStamp } from './PerfectFocusStamp.jsx';
import { getPerfectFocusSide } from '../../game/duel/perfectFocusBet.js';
import { getFieldSetupFlags } from '../../game/battlefieldEffects.js';
import { resolveAbilityForDisplay, resolveArmyBonusForDisplay } from '../../game/cardTextDisplay.js';
import { subscribeRainbowGlow, getRainbowGlowEpoch } from '../../utils/rainbowGlowClock.js';

/** Re-render locale quando gira il clock arcobaleno (senza toccare il root Satze). */
function useRainbowGlowTick() {
  return useSyncExternalStore(subscribeRainbowGlow, getRainbowGlowEpoch, () => 0);
}

/** Armata con bonus in dati ma regola mazzo non soddisfatta (non trigger, non copia, non blocco). */
function duelBonusBaseInactive(agent, hasBonus, bonusNotTriggered, bonusBlocked, bonusCopied) {
  if (!agent?.army || !ARMY_BONUSES[agent.army]) return false;
  if (bonusCopied || bonusBlocked) return false;
  return !hasBonus && !bonusNotTriggered;
}

function fieldAbilityDisplay(battleResult, isPlayer) {
  const field = battleResult?.field;
  const mods = getFieldSetupFlags(field);
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
  // Se il Bonus è già quello risolto dal Duello (70/89/120/Eminenza), non riapplicare lo swap campo:
  // passa field=null e applica solo scale display (×2, min floor, …).
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
  keepThroughClash = false,
}) {
  // keepThroughClash: overlap Aurora / clash senza VFX — evita sparizione anticipata FC.
  const isActive =
    focusUsed > 0 &&
    duelPhase >= 2 &&
    (keepThroughClash ? duelPhase < 5 : duelPhase < 4);
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
  cinemaHideAgent = false,
  keepOrbitThroughClash = false,
}) {
  useRainbowGlowTick();
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
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
          {!cinemaHideAgent && (
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
            effectiveArmyBonus={fieldArmyBonusDisplay(battleResult, false)}
            effectiveAbility={fieldAbilityDisplay(battleResult, false)}
            abilityNotTriggered={display.showEnemyAbilityNotTriggered}
            bonusNotTriggered={display.showEnemyBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: false })}
          />
          )}
          {!cinemaHideAgent && <PerfectFocusStamp active={showPerfect} side="enemy" />}
          <FocusCoinOrbitCountRing
            duelPhase={duelPhase}
            focusUsed={battleResult.enemyFocusUsed}
            coinsShown={enemyFocusCoinsShown}
            cardGlow={enemyCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            armyName={battleResult.enemyAgent?.army}
            direction={1}
            keepThroughClash={keepOrbitThroughClash}
          />
        </div>
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
  cinemaHideAgent = false,
  keepOrbitThroughClash = false,
}) {
  useRainbowGlowTick();
  const display = getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep);
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
          {!cinemaHideAgent && (
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
            effectiveArmyBonus={fieldArmyBonusDisplay(battleResult, true)}
            effectiveAbility={fieldAbilityDisplay(battleResult, true)}
            abilityNotTriggered={display.showPlayerAbilityNotTriggered}
            bonusNotTriggered={display.showPlayerBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: true })}
          />
          )}
          {!cinemaHideAgent && <PerfectFocusStamp active={showPerfect} side="player" />}
          <FocusCoinOrbitCountRing
            duelPhase={duelPhase}
            focusUsed={battleResult.playerFocusUsed}
            coinsShown={playerFocusCoinsShown}
            cardGlow={playerCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            armyName={battleResult.playerAgent?.army}
            direction={-1}
            keepThroughClash={keepOrbitThroughClash}
          />
        </div>
      </div>

    </div>
  );
}
