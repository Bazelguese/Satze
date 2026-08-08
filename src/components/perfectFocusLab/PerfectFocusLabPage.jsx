// ============================================
// Perfect Focus Lab — anteprima stamp PERFECT
// Accesso: ?perfectFocusLab=1  |  menu → STRUMENTI DEV
// ============================================

import React, { useCallback, useMemo, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameViewport } from '../GameViewport';
import { GameCard } from '../cards/GameCard';
import { PerfectFocusStamp } from '../battle/PerfectFocusStamp';
import { DuelClashAuroraSequence } from '../battle/DuelClashAuroraSequence';
import { ARMY_SETS } from '../../data/cards';
import { ALL_BATTLEFIELDS } from '../../data';
import {
  getPerfectFocusSide,
  isPerfectFocusBet,
} from '../../game/duel/perfectFocusBet.js';

function pickAgents() {
  const playerAgent = {
    ...ARMY_SETS["Figli dell'Orizzonte"][2],
    army: "Figli dell'Orizzonte",
  };
  const enemyAgent = { ...ARMY_SETS.Kethran[0], army: 'Kethran' };
  return { playerAgent, enemyAgent };
}

/**
 * Scenario VA classico: POT 3 vs 3, nemico 2 FC → VA 6.
 * Player con 3 FC batte esattamente (VA 9); con 4 overbetta.
 */
function buildScenario({ playerFc, enemyFc, winner, forcePerfectSide }) {
  const { playerAgent, enemyAgent } = pickAgents();
  const pPower = playerAgent.power;
  const ePower = enemyAgent.power;
  const playerAssaultRaw = pPower * playerFc;
  const enemyAssaultRaw = ePower * enemyFc;
  const playerAssault = Math.max(pPower, playerAssaultRaw);
  const enemyAssault = Math.max(ePower, enemyAssaultRaw);

  const result = {
    field: ALL_BATTLEFIELDS[0],
    playerAgent,
    enemyAgent,
    playerPower: pPower,
    enemyPower: ePower,
    playerPowerAfterEffects: pPower,
    enemyPowerAfterEffects: ePower,
    playerDamage: playerAgent.damage,
    enemyDamage: enemyAgent.damage,
    playerAssault,
    enemyAssault,
    playerAssaultRaw,
    enemyAssaultRaw,
    playerAssaultMinFinal: pPower,
    enemyAssaultMinFinal: ePower,
    playerFocusUsed: playerFc,
    enemyFocusUsed: enemyFc,
    damageDealt: winner === 'player' ? playerAgent.damage : enemyAgent.damage,
    winner,
    isPlayerFirst: true,
    playerHasBonus: false,
    enemyHasBonus: false,
    playerBonusBlocked: false,
    enemyBonusBlocked: false,
  };

  if (forcePerfectSide) {
    result.perfectFocusSide = forcePerfectSide;
  } else {
    result.perfectFocusSide = getPerfectFocusSide(result);
  }
  return result;
}

function AgentPreview({ agent, side, showPerfect, stampKey }) {
  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--st-muted)]">
        {side === 'player' ? 'Player' : 'IA'}
      </div>
      <div
        className="relative inline-flex rounded-xl bg-[#080a10] p-3 border border-[var(--st-border)]"
        style={{ minHeight: 360, overflow: 'visible' }}
      >
        <GameCard agent={agent} disabled />
        <PerfectFocusStamp
          key={`${side}-${stampKey}-${showPerfect ? 'on' : 'off'}`}
          active={showPerfect}
          side={side}
        />
      </div>
    </div>
  );
}

export function PerfectFocusLabPage({ onClose }) {
  const [playerFc, setPlayerFc] = useState(3);
  const [enemyFc, setEnemyFc] = useState(2);
  const [winner, setWinner] = useState('player');
  const [forcePerfect, setForcePerfect] = useState(true);
  const [forceSide, setForceSide] = useState('player');
  const [stampKey, setStampKey] = useState(0);
  const [duelPhase, setDuelPhase] = useState(4);
  const [clashKey, setClashKey] = useState(0);

  const battleResult = useMemo(
    () =>
      buildScenario({
        playerFc,
        enemyFc,
        winner,
        forcePerfectSide: forcePerfect ? forceSide : null,
      }),
    [playerFc, enemyFc, winner, forcePerfect, forceSide]
  );

  const detectedSide = useMemo(() => getPerfectFocusSide({
    ...battleResult,
    perfectFocusSide: undefined,
  }), [battleResult]);

  const replayStamp = useCallback(() => {
    setStampKey((k) => k + 1);
  }, []);

  const replayClash = useCallback(() => {
    setDuelPhase(3);
    setClashKey((k) => k + 1);
    window.setTimeout(() => setDuelPhase(4), 40);
  }, []);

  const applyExactPreset = useCallback(() => {
    setPlayerFc(3);
    setEnemyFc(2);
    setWinner('player');
    setForcePerfect(false);
    setStampKey((k) => k + 1);
    replayClash();
  }, [replayClash]);

  const applyOverbetPreset = useCallback(() => {
    setPlayerFc(4);
    setEnemyFc(2);
    setWinner('player');
    setForcePerfect(false);
    setStampKey((k) => k + 1);
    replayClash();
  }, [replayClash]);

  const subtitle = (
    <>
      Anteprima dello stamp <strong className="text-[var(--st-text)]">PERFECT</strong> quando la
      scommessa FC è esattamente il minimo per vincere. Usa i preset o forza lo stamp su un lato.
    </>
  );

  return (
    <ToolPageShell
      title="Perfect Focus Lab"
      subtitle={subtitle}
      onClose={onClose}
      closeLabel="← Gioco"
    >
      <div className="mb-5 flex flex-wrap gap-3 items-end p-4 rounded border border-[var(--st-border)] bg-[var(--st-well)]">
        <label className="text-xs text-[var(--st-muted)]">
          FC Player
          <input
            type="number"
            min={1}
            max={14}
            className="ml-1 w-16 satze-tool-input"
            value={playerFc}
            onChange={(e) => setPlayerFc(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label className="text-xs text-[var(--st-muted)]">
          FC Enemy
          <input
            type="number"
            min={1}
            max={14}
            className="ml-1 w-16 satze-tool-input"
            value={enemyFc}
            onChange={(e) => setEnemyFc(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <label className="text-xs text-[var(--st-muted)]">
          Winner
          <select
            className="ml-1 satze-tool-input"
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
          >
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-[var(--st-muted)] pb-1">
          <input
            type="checkbox"
            checked={forcePerfect}
            onChange={(e) => setForcePerfect(e.target.checked)}
          />
          Forza PERFECT
        </label>
        {forcePerfect && (
          <label className="text-xs text-[var(--st-muted)]">
            Lato
            <select
              className="ml-1 satze-tool-input"
              value={forceSide}
              onChange={(e) => setForceSide(e.target.value)}
            >
              <option value="player">Player</option>
              <option value="enemy">IA</option>
            </select>
          </label>
        )}
        <button type="button" className="satze-tool-btn-primary text-sm" onClick={replayStamp}>
          Replay stamp
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={replayClash}>
          Replay clash
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={applyExactPreset}>
          Preset esatto (3 vs 2)
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={applyOverbetPreset}>
          Preset overbet (4 vs 2)
        </button>
      </div>

      <div className="mb-4 text-xs text-[var(--st-muted)] flex flex-wrap gap-4">
        <span>
          Detection reale:{' '}
          <strong className="text-[var(--st-text)]">
            {detectedSide ? detectedSide.toUpperCase() : 'nessuno'}
          </strong>
        </span>
        <span>
          Stamp attivo:{' '}
          <strong className="text-amber-400/90">
            {battleResult.perfectFocusSide
              ? battleResult.perfectFocusSide.toUpperCase()
              : 'nessuno'}
          </strong>
        </span>
        <span>
          Player perfect?{' '}
          {isPerfectFocusBet({ ...battleResult, perfectFocusSide: undefined }, 'player')
            ? 'sì'
            : 'no'}
        </span>
        <span>
          IA perfect?{' '}
          {isPerfectFocusBet({ ...battleResult, perfectFocusSide: undefined }, 'enemy')
            ? 'sì'
            : 'no'}
        </span>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-10">
        <AgentPreview
          agent={battleResult.playerAgent}
          side="player"
          showPerfect={battleResult.perfectFocusSide === 'player'}
          stampKey={stampKey}
        />
        <AgentPreview
          agent={battleResult.enemyAgent}
          side="enemy"
          showPerfect={battleResult.perfectFocusSide === 'enemy'}
          stampKey={stampKey}
        />
      </div>

      <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[var(--st-muted)]">
        Clash Aurora (come in partita)
      </div>
      <GameViewport>
        <div
          key={clashKey}
          className="relative bg-black"
          style={{
            width: '1920px',
            height: '1080px',
            minWidth: '1920px',
            minHeight: '1080px',
            margin: '0 auto',
          }}
        >
          <DuelClashAuroraSequence
            battleResult={battleResult}
            duelPhase={duelPhase}
            variant="n5"
          />
        </div>
      </GameViewport>

      <p className="mt-6 text-xs leading-relaxed text-[var(--st-muted)]">
        In partita lo stamp esce solo sul vincitore con scommessa minima. Qui puoi forzarlo per
        iterare l&apos;animazione, oppure usare i preset per verificare la detection (
        <code className="text-[var(--st-text)]">perfectFocusBet.js</code>).
      </p>
    </ToolPageShell>
  );
}

export default PerfectFocusLabPage;
