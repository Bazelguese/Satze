/**
 * Composizione duello di sistema (Schermata di gioco).
 * Fonte: Codice/satze.jsx — pannelli agente + cinema + DuelResult* + Aurora.
 *
 * Enter path (come useBattle.resolveBattle):
 * 1) mode=battle → pannelli vuoti, non zoomati
 * 2) mode=result + battleResult → spawn DuelResult* (card-enter) + zoom
 */
import React from 'react';
import { DuelResultEnemyResultBody, DuelResultPlayerResultBody } from './DuelResultDuelBodies';
import { DuelClashAuroraSequence } from './DuelClashAuroraSequence';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';

const noopAbility = () => null;
const noopHover = () => {};

/**
 * @param {'battle'|'result'} [props.mode]
 */
export function ProductionDuelStage({
  mode = 'result',
  battleResult = null,
  duelPhase = 0,
  duelEffectStep = 1,
  duelVfx,
  vfxProfile,
  isZoomed = false,
  playerFocusCoinsShown = 0,
  enemyFocusCoinsShown = 0,
  playerCardGlow = 0,
  enemyCardGlow = 0,
  showClashAnimation = false,
  getFocusCoinGlowColor,
  getAbilityCurrentValue = noopAbility,
  onCardHover = noopHover,
  galleryCardLayout,
  auroraVariant = 'n5',
  enemyLabel = 'Il Nemico',
  playerLabel = "L'eroe",
}) {
  const vfx = duelVfx || DUEL_VISUAL_DEFAULTS;
  const zoomMs = vfx.zoomTransitionMs ?? DUEL_VISUAL_DEFAULTS.zoomTransitionMs;
  const zoomDelay = vfx.zoomDelayMs ?? DUEL_VISUAL_DEFAULTS.zoomDelayMs;
  const isResult = mode === 'result' && Boolean(battleResult);
  const showBodies = isResult && (duelPhase < 4 || !vfxProfile?.clashVfxEnabled);
  const showAurora = isResult && duelPhase >= 4 && vfxProfile?.clashVfxEnabled;

  return (
    <>
      {isResult && (
        <>
          <div className="absolute top-0 left-0 w-full bg-black cinema-bar-top pointer-events-none" style={{ zIndex: 15 }} />
          <div className="absolute bottom-0 left-0 w-full bg-black cinema-bar-bottom pointer-events-none" style={{ zIndex: 15 }} />
        </>
      )}

      {/* Zona Nemico — sinistra (offset identici a satze.jsx) */}
      <div
        className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out"
        style={{
          top: '50%',
          left: '50%',
          transform: isZoomed ? 'translate(-450px, -50%) scale(1.05)' : 'translate(-380px, -50%)',
          width: '240px',
          height: '400px',
          zIndex: 5,
          overflow: 'visible',
          transitionProperty: 'transform, border-color, background-color, box-shadow',
          transitionDuration: `${zoomMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${zoomDelay}ms` : '0ms',
        }}
      >
        {!isResult && (
          <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
            {enemyLabel}
          </div>
        )}
        {showBodies && (
          <DuelResultEnemyResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={duelEffectStep}
            duelVfx={vfx}
            showClashAnimation={showClashAnimation}
            enemyFocusCoinsShown={enemyFocusCoinsShown}
            enemyCardGlow={enemyCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={onCardHover}
            particleSeed={battleResult.enemyAgent?.id ?? 1}
          />
        )}
      </div>

      {/* Zona Player — destra */}
      <div
        className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out"
        style={{
          top: '50%',
          left: '50%',
          transform: isZoomed ? 'translate(210px, -50%) scale(1.05)' : 'translate(140px, -50%)',
          width: '240px',
          height: '400px',
          zIndex: 5,
          overflow: 'visible',
          transitionProperty: 'transform, border-color, background-color, box-shadow',
          transitionDuration: `${zoomMs}ms`,
          transitionTimingFunction: 'ease-in-out',
          transitionDelay: isZoomed ? `${zoomDelay}ms` : '0ms',
        }}
      >
        {!isResult && (
          <div className="text-blue-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
            {playerLabel}
          </div>
        )}
        {showBodies && (
          <DuelResultPlayerResultBody
            battleResult={battleResult}
            duelPhase={duelPhase}
            duelEffectStep={duelEffectStep}
            duelVfx={vfx}
            showClashAnimation={showClashAnimation}
            playerFocusCoinsShown={playerFocusCoinsShown}
            playerCardGlow={playerCardGlow}
            getFocusCoinGlowColor={getFocusCoinGlowColor}
            galleryCardLayout={galleryCardLayout}
            getAbilityCurrentValue={getAbilityCurrentValue}
            onCardHover={onCardHover}
            particleSeed={battleResult.playerAgent?.id ?? 2}
          />
        )}
      </div>

      {showAurora && (
        <DuelClashAuroraSequence
          battleResult={battleResult}
          duelPhase={duelPhase}
          duelEffectStep={duelEffectStep}
          variant={auroraVariant}
          galleryCardLayout={galleryCardLayout}
          getAbilityCurrentValue={getAbilityCurrentValue}
          isZoomed={isZoomed}
        />
      )}
    </>
  );
}
