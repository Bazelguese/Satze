// ============================================
// Corpi UI duello in fase risultato (carte e bagliore della conta FC; monete: DuelFocusStage; VA: DuelVaLedger)
// Duello ufficiale: Codice/satze.jsx — anteprima: DuelVfxSimulator / Duel VFX Lab.
// ============================================

import React, { useSyncExternalStore } from 'react';
import { GameCard } from '../cards/GameCard';
import { ARMY_BONUSES } from '../../data/armies.js';
import {
  getDuelVisualDisplay,
  modifiedStatOrNull,
} from './duelVisualDisplay.js';
import { DUEL_CLASH_START_OFFSET_PX } from '../../config/duelClashLayout.js';
import { getArmyAccent } from '../../theme/duelAccents.js';
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

/** Bagliore della carta durante la conta FC, nel colore dell'armata. */
function hexAlpha(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(245,243,236,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

function focusGlowStyle(duelPhase, glow, accent) {
  const g = Math.max(0, Math.min(1, Number(glow) || 0));
  if (duelPhase < 2 || g <= 0) return {};
  const main = hexAlpha(accent, 0.55 + 0.45 * g);
  return {
    boxShadow: `0 0 ${10 + g * 30}px ${main}, 0 0 ${5 + g * 15}px ${hexAlpha(accent, 0.5)} inset, 0 0 ${20 + g * 40}px ${main}`,
    transition: 'box-shadow 0.3s ease-out',
    borderRadius: '0.75rem',
  };
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
  enemyCardGlow = 0,
  /** Bagliore della conta FC (0-1) e colore dell'armata; senza colore si usa quello dell'Agente. */
  focusGlow = null,
  focusAccent = null,
  /** Overdrive acceso sulla carta (effetto del gioco), dalla moneta che lo attiva a fine duello. */
  overdrive = false,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  cinemaHideAgent = false,
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
          data-duel-card="enemy"
          className={`relative inline-flex ${duelPhase >= 0 ? 'animate-card-enter-left' : 'opacity-0'}`}
          style={{
            marginTop: '0',
            left: `${-DUEL_CLASH_START_OFFSET_PX}px`,
            ...initiativePulseStyle(display.pulseEnemySide),
            ...focusGlowStyle(duelPhase, focusGlow ?? enemyCardGlow, focusAccent || getArmyAccent(battleResult.enemyAgent)),
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
            footerSweep
            overdrivePreview={overdrive}
            onHover={(data) => onCardHover({ ...data, isPlayer: false })}
          />
          )}
          {!cinemaHideAgent && <PerfectFocusStamp active={showPerfect} side="enemy" />}
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
  playerCardGlow = 0,
  /** Bagliore della conta FC (0-1) e colore dell'armata; senza colore si usa quello dell'Agente. */
  focusGlow = null,
  focusAccent = null,
  /** Overdrive acceso sulla carta (effetto del gioco), dalla moneta che lo attiva a fine duello. */
  overdrive = false,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  cinemaHideAgent = false,
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
          data-duel-card="player"
          className={`relative inline-flex ${duelPhase >= 0 ? 'animate-card-enter-right' : 'opacity-0'}`}
          style={{
            marginTop: '0',
            left: `${DUEL_CLASH_START_OFFSET_PX}px`,
            ...initiativePulseStyle(display.pulsePlayerSide),
            ...focusGlowStyle(duelPhase, focusGlow ?? playerCardGlow, focusAccent || getArmyAccent(battleResult.playerAgent)),
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
            footerSweep
            overdrivePreview={overdrive}
            onHover={(data) => onCardHover({ ...data, isPlayer: true })}
          />
          )}
          {!cinemaHideAgent && <PerfectFocusStamp active={showPerfect} side="player" />}
        </div>
      </div>

    </div>
  );
}
