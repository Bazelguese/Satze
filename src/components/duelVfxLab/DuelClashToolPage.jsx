import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameViewport } from '../GameViewport';
import { DuelClashAuroraSequence } from '../battle/DuelClashAuroraSequence';
import { SatzeDialogueLayer } from '../dialogue/SatzeDialogueLayer';
import {
  useDialogueSequencePlayback,
} from '../dialogue/useDialogueSequencePlayback';
import {
  buildDuelDialogueForPhase,
  buildDuelDialogueScript,
} from '../../dialogue/buildDuelDialogueLine.js';
import { createDialogueSession } from '../../dialogue/resolveDuelDialogueEvent.js';
import { EFFECTS, FONTS } from '../../dialogue/satzeDialogue.js';
import {
  DIALOGUE_CHAR_MS,
  DIALOGUE_DUEL_PHASE_SET,
  DIALOGUE_PHASE_START_DELAY_MS,
} from '../../dialogue/dialogueTiming.js';
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

const DIALOGUE_PHASES = DIALOGUE_DUEL_PHASE_SET;

export function DuelClashToolPage({ onClose }) {
  const [playerAssault, setPlayerAssault] = useState(14);
  const [enemyAssault, setEnemyAssault] = useState(11);
  const [playerFc, setPlayerFc] = useState(6);
  const [enemyFc, setEnemyFc] = useState(5);
  const [winner, setWinner] = useState('player');
  const [duelPhase, setDuelPhase] = useState(0);
  const [variant, setVariant] = useState('v1');
  const [isTimelineRunning, setIsTimelineRunning] = useState(false);
  const [dialoguesEnabled, setDialoguesEnabled] = useState(true);
  const [fontKey, setFontKey] = useState('');
  const [fxKey, setFxKey] = useState('');
  const [charMs, setCharMs] = useState(DIALOGUE_CHAR_MS);
  const timersRef = useRef([]);
  const dialogueRef = useRef(null);
  const lastPhaseDialogueRef = useRef(-1);
  const phaseDialogueTimerRef = useRef(null);
  const dialogueSessionRef = useRef(createDialogueSession());

  const { playLines, stop: stopDialogue } = useDialogueSequencePlayback(dialogueRef);

  const battleResult = useMemo(
    () => buildBattleResult(playerAssault, enemyAssault, playerFc, enemyFc, winner),
    [playerAssault, enemyAssault, playerFc, enemyFc, winner]
  );

  useEffect(() => {
    dialogueSessionRef.current = createDialogueSession();
    lastPhaseDialogueRef.current = -1;
  }, [battleResult]);

  const dialogueOverrides = useMemo(
    () => ({ fontKey: fontKey || undefined, fxKey: fxKey || undefined }),
    [fontKey, fxKey]
  );

  const clearTimelineTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsTimelineRunning(false);
  }, []);

  const replayClash = useCallback(() => {
    clearTimelineTimers();
    stopDialogue();
    lastPhaseDialogueRef.current = -1;
    setDuelPhase(3);
    const id = window.setTimeout(() => setDuelPhase(4), 40);
    timersRef.current.push(id);
  }, [clearTimelineTimers, stopDialogue]);

  const replayFullTimeline = useCallback(() => {
    clearTimelineTimers();
    stopDialogue();
    lastPhaseDialogueRef.current = -1;
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
  }, [battleResult, clearTimelineTimers, stopDialogue]);

  const replayDialogueScript = useCallback(() => {
    stopDialogue();
    lastPhaseDialogueRef.current = -1;
    const lines = buildDuelDialogueScript(battleResult);
    playLines(lines, dialogueOverrides);
  }, [battleResult, dialogueOverrides, playLines, stopDialogue]);

  useEffect(() => {
    if (phaseDialogueTimerRef.current != null) {
      window.clearTimeout(phaseDialogueTimerRef.current);
      phaseDialogueTimerRef.current = null;
    }

    if (!dialoguesEnabled) {
      stopDialogue();
      return undefined;
    }
    if (!DIALOGUE_PHASES.has(duelPhase)) return undefined;
    if (lastPhaseDialogueRef.current === duelPhase) return undefined;

    lastPhaseDialogueRef.current = duelPhase;
    phaseDialogueTimerRef.current = window.setTimeout(() => {
      phaseDialogueTimerRef.current = null;
      const lines = buildDuelDialogueForPhase(
        battleResult,
        duelPhase,
        true,
        dialogueSessionRef.current
      );
      if (lines.length) playLines(lines, dialogueOverrides);
    }, DIALOGUE_PHASE_START_DELAY_MS);

    return () => {
      if (phaseDialogueTimerRef.current != null) {
        window.clearTimeout(phaseDialogueTimerRef.current);
        phaseDialogueTimerRef.current = null;
      }
    };
  }, [battleResult, dialogueOverrides, dialoguesEnabled, duelPhase, playLines, stopDialogue]);

  useEffect(
    () => () => {
      clearTimelineTimers();
      stopDialogue();
    },
    [clearTimelineTimers, stopDialogue]
  );

  const phaseMeta = DUEL_PHASE_META.find((p) => p.id === duelPhase);

  return (
    <ToolPageShell
      title="Duel Clash Tool"
      subtitle="Sequenza clash reale (stesso componente del gioco) con fumetti dialogue stile Undertale ancorati alle carte."
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

      <div className="mb-4 satze-tool-panel flex flex-wrap gap-3 items-end p-4">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={dialoguesEnabled}
            onChange={(e) => setDialoguesEnabled(e.target.checked)}
          />
          Dialoghi attivi (Schieramento · Poteri e bonus · Scontro)
        </label>
        <label className="text-xs text-slate-400">
          Font
          <select className="ml-1 satze-tool-input" value={fontKey} onChange={(e) => setFontKey(e.target.value)}>
            <option value="">Auto (armata)</option>
            {Object.entries(FONTS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.family.replace(/'/g, '')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Effetto
          <select className="ml-1 satze-tool-input" value={fxKey} onChange={(e) => setFxKey(e.target.value)}>
            <option value="">Auto (armata)</option>
            {Object.entries(EFFECTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          ms/carattere
          <input
            type="number"
            min={5}
            max={120}
            className="ml-1 w-16 satze-tool-input"
            value={charMs}
            onChange={(e) => setCharMs(Math.max(5, Number(e.target.value) || 30))}
          />
        </label>
        <button type="button" className="satze-tool-btn-primary text-sm" onClick={replayDialogueScript}>
          Riproduci scambio
        </button>
        <button type="button" className="satze-tool-btn-secondary text-sm" onClick={stopDialogue}>
          Stop dialoghi
        </button>
      </div>

      <div className="mb-3 text-xs text-slate-400">
        Fase attuale: <span className="text-slate-200">{duelPhase}</span>
        {phaseMeta ? <span className="ml-2 text-slate-300">({phaseMeta.label})</span> : null}
        {isTimelineRunning ? <span className="ml-2 text-emerald-300">• timeline in esecuzione</span> : null}
        {dialoguesEnabled ? <span className="ml-2 text-amber-300">• dialogue kit attivo</span> : null}
      </div>

      <GameViewport>
        <div className="relative bg-black" style={{ width: '1920px', height: '1080px', minWidth: '1920px', minHeight: '1080px', margin: '0 auto' }}>
          <DuelClashAuroraSequence battleResult={battleResult} duelPhase={duelPhase} variant={variant} />
          <SatzeDialogueLayer ref={dialogueRef} charMs={charMs} />
        </div>
      </GameViewport>

      <p className="mt-6 text-xs leading-relaxed text-[var(--st-muted)]">
        Preset font+effetto per armata (es. Corte Rossa → Press Start 2P + Tremolio, Kethran → Jersey 10 + Pulsazione).
        I fumetti sono ancorati al centro carta via{' '}
        <code className="text-[var(--st-text)]">getDuelAgentCardCenter</code>. Clic su{' '}
        <strong className="text-[var(--st-text)]">Riproduci scambio</strong> per lo script completo indipendente dalla timeline.
      </p>
    </ToolPageShell>
  );
}
