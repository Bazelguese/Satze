// ============================================
// Anteprima duello — stesso canvas 1920×1080 e stessi componenti del gioco
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameViewport } from '../GameViewport';
import { BattlefieldBackground, BattlefieldPanel } from '../battle';
import { DuelResultEnemyResultBody, DuelResultPlayerResultBody } from '../battle/DuelResultDuelBodies';
import { ARMY_SETS } from '../../data/cards';
import { ALL_BATTLEFIELDS } from '../../data';
import {
  buildPhaseAdvanceDelaysMs,
  DUEL_PHASE_META,
  totalAutoTimelineMs,
  computeFocusCoinAppearDelayMs,
  getNextDuelPhase,
} from '../../config/duelVisualTimeline.js';
import { getFocusCoinGlowColor as computeFocusCoinGlowColor } from '../../utils/focusCoinGlow.js';

const ARMY_A = "Figli dell'Orizzonte";
const ARMY_B = 'Kethran';

function makeMockBattle(playerFc, enemyFc, winner) {
  const playerAgent = { ...ARMY_SETS[ARMY_A][2], army: ARMY_A };
  const enemyAgent = { ...ARMY_SETS[ARMY_B][0], army: ARMY_B };
  const field = ALL_BATTLEFIELDS[0];
  const playerPower = 5;
  const enemyPower = 6;
  const playerAssaultMod = 0;
  const enemyAssaultMod = 0;
  const playerAssaultRaw = playerPower * playerFc + playerAssaultMod;
  const enemyAssaultRaw = enemyPower * enemyFc + enemyAssaultMod;
  const playerAssaultMinFinal = playerAgent.power ?? 0;
  const enemyAssaultMinFinal = enemyAgent.power ?? 0;
  const playerAssault = Math.max(playerAssaultMinFinal, playerAssaultRaw);
  const enemyAssault = Math.max(enemyAssaultMinFinal, enemyAssaultRaw);
  const playerDamage = 4;
  const enemyDamage = 3;
  const damageDealt = winner === 'player' ? playerDamage : winner === 'enemy' ? enemyDamage : 0;
  const visualSteps = [
    {
      kind: 'deploy',
      side: null,
      playerPower: playerAgent.power,
      enemyPower: enemyAgent.power,
      playerDamage: playerAgent.damage,
      enemyDamage: enemyAgent.damage,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
    {
      kind: 'power',
      side: 'player',
      playerPower,
      enemyPower,
      playerDamage,
      enemyDamage,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      highlightPlayerAbility: true,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
    {
      kind: 'bonus',
      side: 'player',
      playerPower,
      enemyPower,
      playerDamage,
      enemyDamage,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: true,
      highlightEnemyBonus: false,
    },
    {
      kind: 'preVa',
      side: null,
      playerPower,
      enemyPower,
      playerDamage,
      enemyDamage,
      playerAssaultMod,
      enemyAssaultMod,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
  ];
  return {
    field,
    playerAgent,
    enemyAgent,
    playerFocusUsed: playerFc,
    enemyFocusUsed: enemyFc,
    winner,
    playerAssault,
    enemyAssault,
    playerAssaultRaw,
    enemyAssaultRaw,
    playerAssaultMinFinal,
    enemyAssaultMinFinal,
    playerAssaultMod,
    enemyAssaultMod,
    playerPower,
    playerDamage,
    enemyPower,
    enemyDamage,
    damageDealt,
    playerHasBonus: true,
    enemyHasBonus: false,
    playerBonusBlocked: false,
    enemyBonusBlocked: false,
    playerAbilityTriggered: true,
    enemyAbilityTriggered: false,
    playerAbilityBlocked: false,
    enemyAbilityBlocked: false,
    playerAbilityCopied: false,
    enemyAbilityCopied: false,
    playerBonusCopied: false,
    enemyBonusCopied: false,
    playerAbilityNotTriggered: false,
    enemyAbilityNotTriggered: false,
    playerBonusNotTriggered: false,
    enemyBonusNotTriggered: false,
    visualSteps,
  };
}

function useStableTimeouts() {
  const ids = useRef([]);
  const clearAll = useCallback(() => {
    ids.current.forEach((id) => clearTimeout(id));
    ids.current = [];
  }, []);
  const push = useCallback((id) => {
    ids.current.push(id);
  }, []);
  return { clearAll, push };
}

const STAGE_STYLE = {
  width: '1920px',
  height: '1080px',
  minWidth: '1920px',
  minHeight: '1080px',
  maxWidth: '1920px',
  maxHeight: '1080px',
  margin: '0 auto',
  display: 'block',
};

export function DuelVfxSimulator({ vfx }) {
  const [playerFc, setPlayerFc] = useState(5);
  const [enemyFc, setEnemyFc] = useState(8);
  const [winner, setWinner] = useState('player');
  const [simPhase, setSimPhase] = useState(0);
  const [focus2Progress, setFocus2Progress] = useState(0);
  const [isZoomed, setIsZoomed] = useState(true);
  const [rainbowTime, setRainbowTime] = useState(0);
  const [playerFocusCoinsShown, setPlayerFocusCoinsShown] = useState(0);
  const [enemyFocusCoinsShown, setEnemyFocusCoinsShown] = useState(0);
  const [playerCardGlow, setPlayerCardGlow] = useState(0);
  const [enemyCardGlow, setEnemyCardGlow] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playGen = useRef(0);
  const { clearAll, push } = useStableTimeouts();

  const battle = useMemo(
    () => makeMockBattle(playerFc, enemyFc, winner),
    [playerFc, enemyFc, winner]
  );

  const delays = useMemo(
    () => buildPhaseAdvanceDelaysMs(vfx, playerFc, enemyFc, battle),
    [vfx, playerFc, enemyFc, battle]
  );

  const totalMs = useMemo(
    () => totalAutoTimelineMs(vfx, playerFc, enemyFc, battle),
    [vfx, playerFc, enemyFc, battle]
  );

  const hueMul = useMemo(
    () => ({
      rainbowHueMul12: vfx.rainbowHueMul12,
      rainbowHueMul13: vfx.rainbowHueMul13,
      rainbowHueMul14: vfx.rainbowHueMul14,
    }),
    [vfx.rainbowHueMul12, vfx.rainbowHueMul13, vfx.rainbowHueMul14]
  );

  const getFocusCoinGlowColor = useCallback(
    (focusCount, intensity) => computeFocusCoinGlowColor(focusCount, intensity, rainbowTime, hueMul),
    [rainbowTime, hueMul]
  );

  useEffect(() => {
    if (simPhase < 2) {
      setRainbowTime(0);
      return;
    }
    const id = setInterval(() => {
      setRainbowTime((t) => t + vfx.rainbowStep);
    }, vfx.rainbowIntervalMs);
    return () => clearInterval(id);
  }, [simPhase, vfx.rainbowIntervalMs, vfx.rainbowStep]);

  useEffect(() => {
    if (autoPlay) return;
    const p = playerFc;
    const e = enemyFc;
    const maxT = Math.max(p, e);
    if (simPhase < 2) {
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
      return;
    }
    if (simPhase === 2) {
      const t = Math.max(0, Math.min(1, focus2Progress / 100));
      const shownSteps = maxT <= 0 ? 0 : t >= 1 ? maxT : Math.round(t * maxT);
      const ps = Math.min(p, shownSteps);
      const es = Math.min(e, shownSteps);
      setPlayerFocusCoinsShown(ps);
      setEnemyFocusCoinsShown(es);
      setPlayerCardGlow(p ? ps / p : 0);
      setEnemyCardGlow(e ? es / e : 0);
      return;
    }
    setPlayerFocusCoinsShown(p);
    setEnemyFocusCoinsShown(e);
    setPlayerCardGlow(1);
    setEnemyCardGlow(1);
  }, [autoPlay, simPhase, focus2Progress, playerFc, enemyFc]);

  const runCoinAnimation = useCallback(
    (gen) => {
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
      const maxT = Math.max(playerFc, enemyFc);
      for (let i = 0; i < maxT; i++) {
        const id = setTimeout(() => {
          if (playGen.current !== gen) return;
          const ps = Math.min(playerFc, i + 1);
          const es = Math.min(enemyFc, i + 1);
          setPlayerFocusCoinsShown(ps);
          setEnemyFocusCoinsShown(es);
          setPlayerCardGlow(playerFc ? ps / playerFc : 0);
          setEnemyCardGlow(enemyFc ? es / enemyFc : 0);
        }, computeFocusCoinAppearDelayMs(i, maxT, vfx) / playSpeed);
        push(id);
      }
    },
    [playerFc, enemyFc, vfx, playSpeed, push]
  );

  useEffect(() => {
    if (!autoPlay) {
      clearAll();
      return;
    }
    const gen = ++playGen.current;
    setIsZoomed(true);
    setSimPhase(0);
    setFocus2Progress(0);
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);

    const step = (phase) => {
      if (playGen.current !== gen) return;
      setSimPhase(phase);
      if (phase === 2) runCoinAnimation(gen);
      if (phase >= 6) {
        setAutoPlay(false);
        return;
      }
      const ms = delays[phase] / playSpeed;
      const tid = setTimeout(() => step(getNextDuelPhase(phase, battle)), ms);
      push(tid);
    };

    const startId = setTimeout(() => step(0), 50);
    push(startId);

    return () => {
      playGen.current += 1;
      clearAll();
    };
  }, [autoPlay, delays, playSpeed, clearAll, push, runCoinAnimation, battle]);

  const segmentWidths = useMemo(() => {
    const sum = delays[0] + delays[1] + delays[2] + delays[3] + delays[4] + delays[5];
    const denom = sum > 0 ? sum : 1;
    return [0, 1, 2, 3, 4, 5].map((i) => (delays[i] / denom) * 100);
  }, [delays]);

  const summaryText = useMemo(() => {
    const lines = [
      '--- Riferimento duello (copia in chat) ---',
      `FC simulati: giocatore ${playerFc}, nemico ${enemyFc} | Vincitore anteprima: ${winner}`,
      `Tempo totale fasi 0→5: ${totalMs}ms (play ×${playSpeed})`,
      ...DUEL_PHASE_META.slice(0, 6).map((m, i) => {
        const ms = delays[i];
        const extra =
          i === 2
            ? ` (fase 2 = max(FC)×focusCoinStepMs + focusPhaseBufferMs = ${ms}ms)`
            : '';
        return `Fase ${i} ${m.label}: ${ms}ms — ${m.where}${extra}`;
      }),
      `Zoom: ${vfx.zoomTransitionMs}ms, ritardo ${vfx.zoomDelayMs}ms`,
      `Arcobaleno: ogni ${vfx.rainbowIntervalMs}ms, step ${vfx.rainbowStep}, hue ${vfx.rainbowHueMul12}/${vfx.rainbowHueMul13}/${vfx.rainbowHueMul14}`,
      `Clash Continua: ${vfx.nextRoundClashHoldMs}ms`,
      '--- Fine ---',
    ];
    return lines.join('\n');
  }, [vfx, delays, totalMs, playerFc, enemyFc, winner, playSpeed]);

  const jumpPhase = (p) => {
    playGen.current += 1;
    setAutoPlay(false);
    clearAll();
    setSimPhase(p);
    if (p < 2) {
      setFocus2Progress(0);
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
    } else if (p === 2) {
      setFocus2Progress(0);
      setPlayerFocusCoinsShown(0);
      setEnemyFocusCoinsShown(0);
      setPlayerCardGlow(0);
      setEnemyCardGlow(0);
    } else if (p > 2) {
      setPlayerFocusCoinsShown(playerFc);
      setEnemyFocusCoinsShown(enemyFc);
      setPlayerCardGlow(1);
      setEnemyCardGlow(1);
    }
  };

  const meta = DUEL_PHASE_META[simPhase] || DUEL_PHASE_META[0];
  const noopAbility = useCallback(() => null, []);
  const noopHover = useCallback(() => {}, []);

  const galleryCardLayout = 'reworkP4html';

  return (
    <div className="rounded-xl border border-amber-500/20 bg-slate-950/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Anteprima 1:1 (1920×1080)</h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Stesso riquadro del gioco con <code className="text-amber-200/80">GameViewport</code>, sfondo campo, pannello
            centrale e le stesse zone duello / carte / FC / VA del codice di partita.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-slate-400">
            FC tuo
            <input
              type="number"
              min={0}
              max={14}
              className="ml-1 w-14 rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-white text-sm"
              value={playerFc}
              onChange={(e) => setPlayerFc(Math.min(14, Math.max(0, Number(e.target.value) || 0)))}
            />
          </label>
          <label className="text-xs text-slate-400">
            FC nemico
            <input
              type="number"
              min={0}
              max={14}
              className="ml-1 w-14 rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-white text-sm"
              value={enemyFc}
              onChange={(e) => setEnemyFc(Math.min(14, Math.max(0, Number(e.target.value) || 0)))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Vincitore VA
            <select
              className="ml-1 rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-white text-sm"
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
            >
              <option value="player">Tu</option>
              <option value="enemy">Nemico</option>
              <option value="draw">Pareggio</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Vel. play
            <select
              className="ml-1 rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-white text-sm"
              value={String(playSpeed)}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
            >
              <option value="0.25">0.25×</option>
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="2">2×</option>
            </select>
          </label>
          {!autoPlay ? (
            <button
              type="button"
              onClick={() => setAutoPlay(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium"
            >
              Riproduci sequenza
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playGen.current += 1;
                setAutoPlay(false);
                clearAll();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-800/90 hover:bg-red-700 text-white text-sm"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4 bg-black/40">
        <GameViewport>
          <div className="relative overflow-visible bg-slate-950" style={STAGE_STYLE}>
            <>
              <div className="absolute top-0 left-0 w-full bg-black cinema-bar-top pointer-events-none z-[15]" />
              <div className="absolute bottom-0 left-0 w-full bg-black cinema-bar-bottom pointer-events-none z-[15]" />
            </>

            <BattlefieldBackground activeField={battle.field} />

            <BattlefieldPanel
              field={battle.field}
              gamePhase="result"
              isPlayerFirst
              isZoomed={isZoomed}
              selectedAgent={null}
              onConfirm={() => {}}
              duelPhase={simPhase}
              battleResult={battle}
              onContinue={() => {}}
              gameResult={null}
              onMenu={() => {}}
            />

            <div
              className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out ${
                isZoomed ? '' : ''
              }`}
              style={{
                top: '50%',
                left: '50%',
                transform: isZoomed ? 'translate(-450px, -50%) scale(1.05)' : 'translate(-380px, -50%)',
                width: '240px',
                height: '400px',
                zIndex: 5,
                transitionProperty: 'transform, border-color, background-color, box-shadow',
                transitionDuration: `${vfx.zoomTransitionMs}ms`,
                transitionTimingFunction: 'ease-in-out',
                transitionDelay: isZoomed ? `${vfx.zoomDelayMs}ms` : '0ms',
              }}
            >
              {simPhase < 4 ? (
                <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">Il Nemico</div>
              ) : null}
              <DuelResultEnemyResultBody
                battleResult={battle}
                duelPhase={simPhase}
                duelVfx={vfx}
                showClashAnimation={false}
                enemyFocusCoinsShown={enemyFocusCoinsShown}
                enemyCardGlow={enemyCardGlow}
                getFocusCoinGlowColor={getFocusCoinGlowColor}
                galleryCardLayout={galleryCardLayout}
                getAbilityCurrentValue={noopAbility}
                onCardHover={noopHover}
                particleSeed={battle.enemyAgent?.id ?? 1}
              />
            </div>

            <div
              className={`absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none ease-in-out ${
                isZoomed ? '' : ''
              }`}
              style={{
                top: '50%',
                left: '50%',
                transform: isZoomed ? 'translate(210px, -50%) scale(1.05)' : 'translate(140px, -50%)',
                width: '240px',
                height: '400px',
                zIndex: 5,
                transitionProperty: 'transform, border-color, background-color, box-shadow',
                transitionDuration: `${vfx.zoomTransitionMs}ms`,
                transitionTimingFunction: 'ease-in-out',
                transitionDelay: isZoomed ? `${vfx.zoomDelayMs}ms` : '0ms',
              }}
            >
              {simPhase < 4 ? (
                <div className="text-blue-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">L&apos;eroe</div>
              ) : null}
              <DuelResultPlayerResultBody
                battleResult={battle}
                duelPhase={simPhase}
                duelVfx={vfx}
                showClashAnimation={false}
                playerFocusCoinsShown={playerFocusCoinsShown}
                playerCardGlow={playerCardGlow}
                getFocusCoinGlowColor={getFocusCoinGlowColor}
                galleryCardLayout={galleryCardLayout}
                getAbilityCurrentValue={noopAbility}
                onCardHover={noopHover}
                particleSeed={battle.playerAgent?.id ?? 2}
              />
            </div>
          </div>
        </GameViewport>
      </div>

      <div className="px-4 pb-3 grid lg:grid-cols-2 gap-4 border-t border-white/10 pt-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">Fase {simPhase}: {meta.label}</div>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={simPhase}
            onChange={(e) => jumpPhase(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          {simPhase === 2 && !autoPlay && (
            <div className="mt-2">
              <div className="text-[10px] text-slate-500 mb-0.5">Progresso fase 2 (FC)</div>
              <input
                type="range"
                min={0}
                max={100}
                value={focus2Progress}
                onChange={(e) => setFocus2Progress(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          )}
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-1">Timeline (clic = salta fase)</div>
          <div className="flex h-7 rounded overflow-hidden border border-white/10">
            {segmentWidths.map((w, i) => (
              <button
                key={i}
                type="button"
                title={`${DUEL_PHASE_META[i].label} ${delays[i]}ms`}
                onClick={() => jumpPhase(i)}
                className={`h-full text-[8px] leading-tight px-0.5 ${
                  simPhase === i ? 'bg-amber-600/90 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                style={{ width: `${w}%` }}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Somma 0–5: {totalMs}ms</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-medium text-slate-400">Testo per chat</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(summaryText)}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
          >
            Copia
          </button>
        </div>
        <pre className="text-[11px] leading-relaxed text-slate-300 bg-black/40 rounded-lg p-3 max-h-40 overflow-auto border border-white/5 whitespace-pre-wrap font-mono">
          {summaryText}
        </pre>
      </div>
    </div>
  );
}
