// ============================================
// Corpi UI duello in fase risultato (carte + FC + VA + danno vincitore)
// Duello ufficiale: Codice/satze.jsx — anteprima: DuelVfxSimulator / Duel VFX Lab.
// ============================================

import React from 'react';
import { GameCard } from '../cards/GameCard';
import { Icon } from '../ui/Icon';
import { computePhase3DurationMs } from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';
import { ARMY_BONUSES } from '../../data/armies.js';

/** Armata con bonus in dati ma regola mazzo non soddisfatta (non trigger, non copia, non blocco). */
function duelBonusBaseInactive(agent, hasBonus, bonusNotTriggered, bonusBlocked, bonusCopied) {
  if (!agent?.army || !ARMY_BONUSES[agent.army]) return false;
  if (bonusCopied || bonusBlocked) return false;
  return !hasBonus && !bonusNotTriggered;
}

/** Poteri/bonus post-scontro (stesso trattamento di `duelPostBattle.js`). */
function isPostDuelDeferredHighlightTrigger(trigger) {
  return trigger === 'conquest' || trigger === 'lastWish';
}

const VA_LAYER_EFFECTS = new Set(['assaultValue', 'enemyAssault']);

function getAbilityHighlightStartPhase(ability) {
  if (!ability) return 1;
  if (isPostDuelDeferredHighlightTrigger(ability.trigger)) return 5;
  if (VA_LAYER_EFFECTS.has(ability.effect)) return 3;
  return 1;
}

function getBonusHighlightStartPhase(bonusDef) {
  if (!bonusDef) return 1;
  if (isPostDuelDeferredHighlightTrigger(bonusDef.trigger)) return 5;
  const effects = Array.isArray(bonusDef.effects) ? bonusDef.effects : [];
  if (effects.length > 0 && effects.every((eff) => VA_LAYER_EFFECTS.has(eff.effect))) return 3;
  return 1;
}

/** Evidenziazione POT rispettando il timing dell'effetto. */
function abilityHighlightForDuelPhase(duelPhase, abilityTriggered, ability) {
  if (!abilityTriggered) return false;
  return duelPhase >= getAbilityHighlightStartPhase(ability);
}

/** Evidenziazione BON rispettando il timing degli effetti bonus. */
function bonusHighlightForDuelPhase(duelPhase, hasBonus, bonusBlocked, bonusDef) {
  if (!hasBonus || bonusBlocked) return false;
  return duelPhase >= getBonusHighlightStartPhase(bonusDef);
}

/** Particelle VA: offset fissi da seed per evitare salti a ogni render (es. VFX Lab). */
function vaParticleOffsets(seed) {
  const out = [];
  let s = seed >>> 0;
  for (let i = 0; i < 8; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const x = ((s % 200) - 100) / 100 * 50;
    s = (s * 1103515245 + 12345) >>> 0;
    const y = ((s % 200) - 100) / 100 * 50;
    out.push({ x, y });
  }
  return out;
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
function buildVaPhase3Lines(br, isPlayer) {
  const { mod, raw, minFinal, final } = vaPhase3Numbers(br, isPlayer);
  const lines = [];
  if (mod !== 0) {
    const sign = mod > 0 ? '+' : '';
    lines.push({ key: 'mod', main: `${sign}${mod} mod VA`, sub: `= ${raw}` });
  }
  if (raw < minFinal) {
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
  const accent = winnerSide === 'player' ? '#7dd3fc' : '#5eead4';
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

function DuelVaPhase3Breakdown({ battleResult, isPlayer, duelPhase, phaseMs3 }) {
  const lines = React.useMemo(
    () => (battleResult ? buildVaPhase3Lines(battleResult, isPlayer) : []),
    [battleResult, isPlayer]
  );
  const duelStamp = isPlayer
    ? `${battleResult?.playerAssault ?? ''}-${battleResult?.playerAssaultRaw ?? ''}`
    : `${battleResult?.enemyAssault ?? ''}-${battleResult?.enemyAssaultRaw ?? ''}`;
  const visible = useVaPhase3LineReveal(duelPhase, phaseMs3, lines.length, duelStamp);

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

export function DuelResultEnemyResultBody({
  battleResult,
  duelPhase,
  duelVfx,
  showClashAnimation,
  enemyFocusCoinsShown,
  enemyCardGlow,
  getFocusCoinGlowColor,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  particleSeed = 1,
}) {
  const particles = React.useMemo(() => vaParticleOffsets(particleSeed), [particleSeed]);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="relative flex items-center">
        {battleResult.enemyFocusUsed > 0 && (
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 z-10">
            <div className="flex flex-col items-center gap-1.5" style={{ width: '48px' }}>
              {Array.from({ length: battleResult.enemyFocusUsed }).map((_, index) => {
                const isVisible =
                  enemyFocusCoinsShown > index || enemyFocusCoinsShown >= battleResult.enemyFocusUsed;
                const coinIntensity = enemyCardGlow;
                const glowColor = getFocusCoinGlowColor(battleResult.enemyFocusUsed, coinIntensity);
                return (
                  <div
                    key={index}
                    className={`${isVisible && duelPhase === 2 ? 'animate-focus-coin' : ''} rounded-full border flex items-center justify-center`}
                    style={{
                      animationDelay:
                        isVisible && duelPhase === 2 ? `${index * duelVfx.focusCoinStepMs}ms` : '0ms',
                      width: '40px',
                      height: '40px',
                      opacity: isVisible ? 1 : 0,
                      backgroundColor: glowColor
                        ? `${glowColor.main.replace('1)', '0.2)')}`
                        : 'rgba(234, 179, 8, 0.2)',
                      borderColor: glowColor ? glowColor.main : 'rgba(234, 179, 8, 0.5)',
                      transition: 'background-color 0.5s ease-out, border-color 0.5s ease-out, opacity 0.3s ease-out',
                    }}
                  >
                    {battleResult.enemyAgent?.army ? (
                      <Icon name={battleResult.enemyAgent.army} type="army" size={24} />
                    ) : (
                      <Icon name="coin" type="cardIcon" size={24} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={`relative ${duelPhase >= 0 ? 'animate-card-enter-left' : 'opacity-0'} ${
            showClashAnimation && battleResult
              ? battleResult.winner === 'enemy'
                ? 'animate-clash-winner-left'
                : 'animate-clash-loser-left'
              : ''
          }`}
          style={{
            marginTop: '0',
            ...(duelPhase >= 2 && battleResult && enemyCardGlow > 0
              ? (() => {
                  const glowColor = getFocusCoinGlowColor(battleResult.enemyFocusUsed, enemyCardGlow);
                  if (!glowColor) return {};
                  return {
                    boxShadow: `0 0 ${10 + enemyCardGlow * 30}px ${glowColor.main}, 
                                 0 0 ${5 + enemyCardGlow * 15}px ${glowColor.secondary} inset,
                                 0 0 ${20 + enemyCardGlow * 40}px ${glowColor.main}`,
                    border: `${1 + (enemyCardGlow >= 1 ? 3 : enemyCardGlow * 2)}px solid ${glowColor.main}`,
                    transition: 'box-shadow 0.3s ease-out, border 0.3s ease-out',
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
                      border: `3px solid ${glowColor.main}`,
                      transition: 'box-shadow 0.3s ease-out, border 0.3s ease-out',
                      borderRadius: '0.75rem',
                    };
                  })()
                : {}),
          }}
        >
          <GameCard
            cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
            agent={battleResult.enemyAgent}
            showBonus={battleResult.enemyHasBonus && !battleResult.enemyBonusBlocked}
            bonusBaseInactive={duelBonusBaseInactive(
              battleResult.enemyAgent,
              battleResult.enemyHasBonus,
              battleResult.enemyBonusNotTriggered,
              battleResult.enemyBonusBlocked,
              battleResult.enemyBonusCopied
            )}
            modifiedPower={battleResult.enemyPower}
            modifiedDamage={battleResult.enemyDamage}
            abilityCurrentValue={getAbilityCurrentValue(battleResult.enemyAgent, false)}
            abilityBlocked={battleResult.enemyAbilityBlocked}
            bonusBlocked={battleResult.enemyBonusBlocked}
            showOperators={duelPhase >= 1}
            highlightAbility={abilityHighlightForDuelPhase(
              duelPhase,
              battleResult.enemyAbilityTriggered,
              battleResult.enemyAbilityCopied || battleResult.enemyAgent?.ability
            )}
            highlightBonus={bonusHighlightForDuelPhase(
              duelPhase,
              battleResult.enemyHasBonus,
              battleResult.enemyBonusBlocked,
              battleResult.enemyBonusCopied || (battleResult.enemyAgent?.army ? ARMY_BONUSES[battleResult.enemyAgent.army] : null)
            )}
            copiedAbility={battleResult.enemyAbilityCopied}
            copiedBonus={battleResult.enemyBonusCopied}
            abilityNotTriggered={battleResult.enemyAbilityNotTriggered}
            bonusNotTriggered={battleResult.enemyBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: false })}
          />
        </div>
      </div>

      <div className="absolute top-full w-full" style={{ top: '100%', marginTop: '12px' }}>
        {duelPhase === 2 && battleResult && (
          <DuelVaPhase2LiveBlock
            power={battleResult.enemyPower}
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
            {duelPhase === 4 && battleResult.winner === 'enemy' && (
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((off, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-explosion-particles"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: i % 3 === 0 ? '#4FD1C5' : i % 3 === 1 ? '#FFB347' : '#a78bfa',
                      '--particle-x': `${off.x}px`,
                      '--particle-y': `${off.y}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-amber-400/95 text-sm font-bold uppercase tracking-widest mb-2">Valore Assalto</div>
            <div
              className={`text-4xl font-black value-transition satze-va-number ${
                battleResult.winner === 'enemy' ? 'animate-victory-explosion' : 'text-slate-500'
              } ${duelPhase === 4 ? 'animate-clash' : ''}`}
              style={{
                ...(battleResult.winner === 'enemy' ? { color: '#4FD1C5' } : {}),
                ...(duelPhase === 4 && battleResult.winner === 'enemy'
                  ? {
                      textShadow:
                        '1px 1px 0 rgba(0,0,0,0.95), -1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 0 0 25px rgba(79, 209, 197, 0.9), 0 0 15px rgba(255, 179, 71, 0.5)',
                      filter: 'brightness(1.2)',
                    }
                  : {}),
              }}
            >
              {battleResult.enemyAssault}
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
  duelVfx,
  showClashAnimation,
  playerFocusCoinsShown,
  playerCardGlow,
  getFocusCoinGlowColor,
  galleryCardLayout,
  getAbilityCurrentValue,
  onCardHover,
  particleSeed = 2,
}) {
  const particles = React.useMemo(() => vaParticleOffsets(particleSeed), [particleSeed]);

  return (
    <div className="relative w-full h-full flex flex-col items-center pointer-events-auto">
      <div className="relative flex items-center">
        <div
          className={`relative ${duelPhase >= 0 ? 'animate-card-enter-right' : 'opacity-0'} ${
            showClashAnimation && battleResult
              ? battleResult.winner === 'player'
                ? 'animate-clash-winner-right'
                : 'animate-clash-loser-right'
              : ''
          }`}
          style={{
            marginTop: '0',
            ...(duelPhase >= 2 && battleResult && playerCardGlow > 0
              ? (() => {
                  const glowColor = getFocusCoinGlowColor(battleResult.playerFocusUsed, playerCardGlow);
                  if (!glowColor) return {};
                  return {
                    boxShadow: `0 0 ${10 + playerCardGlow * 30}px ${glowColor.main}, 
                                 0 0 ${5 + playerCardGlow * 15}px ${glowColor.secondary} inset,
                                 0 0 ${20 + playerCardGlow * 40}px ${glowColor.main}`,
                    border: `${1 + (playerCardGlow >= 1 ? 3 : playerCardGlow * 2)}px solid ${glowColor.main}`,
                    transition: 'box-shadow 0.3s ease-out, border 0.3s ease-out',
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
                      border: `3px solid ${glowColor.main}`,
                      transition: 'box-shadow 0.3s ease-out, border 0.3s ease-out',
                      borderRadius: '0.75rem',
                    };
                  })()
                : {}),
          }}
        >
          <GameCard
            cardLayout={galleryCardLayout === 'reworkP4html' ? 'reworkP4' : galleryCardLayout}
            agent={battleResult.playerAgent}
            showBonus={battleResult.playerHasBonus && !battleResult.playerBonusBlocked}
            bonusBaseInactive={duelBonusBaseInactive(
              battleResult.playerAgent,
              battleResult.playerHasBonus,
              battleResult.playerBonusNotTriggered,
              battleResult.playerBonusBlocked,
              battleResult.playerBonusCopied
            )}
            modifiedPower={battleResult.playerPower}
            modifiedDamage={battleResult.playerDamage}
            abilityCurrentValue={getAbilityCurrentValue(battleResult.playerAgent, true)}
            abilityBlocked={battleResult.playerAbilityBlocked}
            bonusBlocked={battleResult.playerBonusBlocked}
            showOperators={duelPhase >= 1}
            highlightAbility={abilityHighlightForDuelPhase(
              duelPhase,
              battleResult.playerAbilityTriggered,
              battleResult.playerAbilityCopied || battleResult.playerAgent?.ability
            )}
            highlightBonus={bonusHighlightForDuelPhase(
              duelPhase,
              battleResult.playerHasBonus,
              battleResult.playerBonusBlocked,
              battleResult.playerBonusCopied || (battleResult.playerAgent?.army ? ARMY_BONUSES[battleResult.playerAgent.army] : null)
            )}
            copiedAbility={battleResult.playerAbilityCopied}
            copiedBonus={battleResult.playerBonusCopied}
            abilityNotTriggered={battleResult.playerAbilityNotTriggered}
            bonusNotTriggered={battleResult.playerBonusNotTriggered}
            onHover={(data) => onCardHover({ ...data, isPlayer: true })}
          />
        </div>

        {battleResult.playerFocusUsed > 0 && (
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 z-10">
            <div className="flex flex-col items-center gap-1.5" style={{ width: '48px' }}>
              {Array.from({ length: battleResult.playerFocusUsed }).map((_, index) => {
                const isVisible =
                  playerFocusCoinsShown > index || playerFocusCoinsShown >= battleResult.playerFocusUsed;
                const coinIntensity = playerCardGlow;
                const glowColor = getFocusCoinGlowColor(battleResult.playerFocusUsed, coinIntensity);
                return (
                  <div
                    key={index}
                    className={`${isVisible && duelPhase === 2 ? 'animate-focus-coin' : ''} rounded-full border flex items-center justify-center`}
                    style={{
                      animationDelay:
                        isVisible && duelPhase === 2 ? `${index * duelVfx.focusCoinStepMs}ms` : '0ms',
                      width: '40px',
                      height: '40px',
                      opacity: isVisible ? 1 : 0,
                      backgroundColor: glowColor
                        ? `${glowColor.main.replace('1)', '0.2)')}`
                        : 'rgba(234, 179, 8, 0.2)',
                      borderColor: glowColor ? glowColor.main : 'rgba(234, 179, 8, 0.5)',
                      transition: 'background-color 0.5s ease-out, border-color 0.5s ease-out, opacity 0.3s ease-out',
                    }}
                  >
                    {battleResult.playerAgent?.army ? (
                      <Icon name={battleResult.playerAgent.army} type="army" size={24} />
                    ) : (
                      <Icon name="coin" type="cardIcon" size={24} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-full w-full" style={{ top: '100%', marginTop: '12px' }}>
        {duelPhase === 2 && battleResult && (
          <DuelVaPhase2LiveBlock
            power={battleResult.playerPower}
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
            {duelPhase === 4 && battleResult.winner === 'player' && (
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((off, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-explosion-particles"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: i % 3 === 0 ? '#4FD1C5' : i % 3 === 1 ? '#FFB347' : '#a78bfa',
                      '--particle-x': `${off.x}px`,
                      '--particle-y': `${off.y}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-amber-400/95 text-sm font-bold uppercase tracking-widest mb-2">Valore Assalto</div>
            <div
              className={`text-4xl font-black value-transition satze-va-number ${
                battleResult.winner === 'player' ? 'animate-victory-explosion' : 'text-slate-500'
              } ${duelPhase === 4 ? 'animate-clash' : ''}`}
              style={{
                ...(battleResult.winner === 'player' ? { color: '#4FD1C5' } : {}),
                ...(duelPhase === 4 && battleResult.winner === 'player'
                  ? {
                      textShadow:
                        '1px 1px 0 rgba(0,0,0,0.95), -1px -1px 0 rgba(0,0,0,0.95), 1px -1px 0 rgba(0,0,0,0.95), -1px 1px 0 rgba(0,0,0,0.95), 0 0 25px rgba(79, 209, 197, 0.9), 0 0 15px rgba(255, 179, 71, 0.5)',
                      filter: 'brightness(1.2)',
                    }
                  : {}),
              }}
            >
              {battleResult.playerAssault}
            </div>
            <DuelWinnerDamageUnderVa battleResult={battleResult} duelPhase={duelPhase} winnerSide="player" />
          </div>
        )}
      </div>
    </div>
  );
}
