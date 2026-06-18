import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameViewport } from '../GameViewport';
import { DuelClashAuroraSequence } from '../battle/DuelClashAuroraSequence';
import { ARMY_SETS } from '../../data/cards';
import { ALL_BATTLEFIELDS } from '../../data';
import { getDuelVisualConfig } from '../../config/duelVisualConfigStore.js';
import { buildPhaseAdvanceDelaysMs, DUEL_PHASE_META } from '../../config/duelVisualTimeline.js';

function buildBattleResult(playerAssault, enemyAssault, playerFc, enemyFc, winner) {
  const playerAgent = { ...ARMY_SETS["Figli dell'Orizzonte"][2], army: "Figli dell'Orizzonte" };
  const enemyAgent = { ...ARMY_SETS.Kethran[0], army: 'Kethran' };
  return {
    field: ALL_BATTLEFIELDS[0],
    playerAgent,
    enemyAgent,
    playerPower: playerAgent.power,
    enemyPower: enemyAgent.power,
    playerDamage: playerAgent.damage,
    enemyDamage: enemyAgent.damage,
    playerAssault,
    enemyAssault,
    playerFocusUsed: playerFc,
    enemyFocusUsed: enemyFc,
    damageDealt: winner === 'player' ? playerAgent.damage : winner === 'enemy' ? enemyAgent.damage : 0,
    winner,
    playerHasBonus: false,
    enemyHasBonus: false,
    playerBonusBlocked: false,
    enemyBonusBlocked: false,
  };
}

export function DuelClashToolPage({ onClose }) {
  const [playerAssault, setPlayerAssault] = useState(14);
  const [enemyAssault, setEnemyAssault] = useState(11);
  const [playerFc, setPlayerFc] = useState(6);
  const [enemyFc, setEnemyFc] = useState(5);
  const [winner, setWinner] = useState('player');
  const [duelPhase, setDuelPhase] = useState(0);
  const [variant, setVariant] = useState('v1');
  const [isTimelineRunning, setIsTimelineRunning] = useState(false);
  const timersRef = useRef([]);

  const battleResult = useMemo(
    () => buildBattleResult(playerAssault, enemyAssault, playerFc, enemyFc, winner),
    [playerAssault, enemyAssault, playerFc, enemyFc, winner]
  );

  const clearTimelineTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsTimelineRunning(false);
  }, []);

  const replayClash = useCallback(() => {
    clearTimelineTimers();
    setDuelPhase(3);
    const id = window.setTimeout(() => setDuelPhase(4), 40);
    timersRef.current.push(id);
  }, [clearTimelineTimers]);

  const replayFullTimeline = useCallback(() => {
    clearTimelineTimers();
    setIsTimelineRunning(true);
    setDuelPhase(0);

    const vfx = getDuelVisualConfig();
    const delays = buildPhaseAdvanceDelaysMs(vfx, battleResult.playerFocusUsed, battleResult.enemyFocusUsed, battleResult);
    let elapsed = 0;
    for (let phase = 0; phase <= 5; phase += 1) {
      elapsed += delays[phase] || 0;
      const nextPhase = phase + 1;
      const id = window.setTimeout(() => {
        setDuelPhase(nextPhase);
        if (nextPhase >= 6) setIsTimelineRunning(false);
      }, elapsed);
      timersRef.current.push(id);
    }
  }, [battleResult, clearTimelineTimers]);

  useEffect(() => () => clearTimelineTimers(), [clearTimelineTimers]);

  const phaseMeta = DUEL_PHASE_META.find((p) => p.id === duelPhase);

  return (
    <ToolPageShell
      title="Duel Clash Tool"
      subtitle="Tool esterno per rifinire insieme la sequenza clash reale (stesso componente del gioco)."
      onClose={onClose}
    >
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <label className="text-xs text-slate-400">
          VA Player
          <input type="number" className="ml-1 w-20 satze-tool-input" value={playerAssault} onChange={(e) => setPlayerAssault(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs text-slate-400">
          VA Enemy
          <input type="number" className="ml-1 w-20 satze-tool-input" value={enemyAssault} onChange={(e) => setEnemyAssault(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs text-slate-400">
          FC Player
          <input type="number" min={0} max={14} className="ml-1 w-20 satze-tool-input" value={playerFc} onChange={(e) => setPlayerFc(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs text-slate-400">
          FC Enemy
          <input type="number" min={0} max={14} className="ml-1 w-20 satze-tool-input" value={enemyFc} onChange={(e) => setEnemyFc(Number(e.target.value) || 0)} />
        </label>
        <label className="text-xs text-slate-400">
          Winner
          <select className="ml-1 satze-tool-input" value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="draw">Draw</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Variant
          <select className="ml-1 satze-tool-input" value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="v1">V1 Base</option>
            <option value="v2">V2 Orbit Sparks</option>
            <option value="v3">V3 Tactical Clash</option>
            <option value="n1">N1 (Nuova) = V1</option>
            <option value="n2">N2 Focus Coin Orbit</option>
            <option value="n3">N3 Focus Coin Stream</option>
            <option value="n4">N4 Focus Coin Burst</option>
            <option value="n5">N5 Focus Coin Orbit Collapse</option>
          </select>
        </label>
        <button type="button" className="satze-tool-btn-primary" onClick={replayClash}>
          Replay Clash
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={replayFullTimeline}>
          Replay Fasi 0→6
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={clearTimelineTimers}>
          Stop Timeline
        </button>
      </div>

      <div className="mb-3 text-xs text-slate-400">
        Fase attuale: <span className="text-slate-200">{duelPhase}</span>
        {phaseMeta ? <span className="ml-2 text-slate-300">({phaseMeta.label})</span> : null}
        {isTimelineRunning ? <span className="ml-2 text-emerald-300">• timeline in esecuzione</span> : null}
      </div>

      <GameViewport>
        <div className="relative bg-black" style={{ width: '1920px', height: '1080px', minWidth: '1920px', minHeight: '1080px', margin: '0 auto' }}>
          <DuelClashAuroraSequence battleResult={battleResult} duelPhase={duelPhase} variant={variant} />
        </div>
      </GameViewport>
    </ToolPageShell>
  );
}

