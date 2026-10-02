/**
 * PV a schermo durante il risultato del duello: i proiettili del vincitore tolgono
 * un punto alla volta al perdente, poi il Campo cura o ferisce. I PV veri restano
 * quelli di satze.jsx e cambiano su «Continua»; qui si anima solo la lettura.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPhaseAdvanceDelaysMs } from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';
import {
  HP_PROJECTILE_START_RATIO,
  HP_AFTERMATH_STEP_MS,
  HP_SOURCE_STAGGER_MS,
  scheduleDuelHpEvents,
  displayedHpAt,
  buildDuelHpStepBursts,
  hpAfterDuelSteps,
} from '../../game/duel/duelHpPresentation.js';

/** Quanto resta l'etichetta della raffica dopo l'ultimo punto, e quanto dura la sua uscita (ms). */
const BURST_HOLD_MS = 700;
const BURST_LEAVE_MS = 400;
/** PV degli effetti: partono quando il fascio del Potere arriva (DuelStepFx: 60 + 480 ms). */
const STEP_PV_DELAY_MS = 540;

/** Punti PV degli effetti, uno per tick, con l'istante relativo all'inizio del loro step. */
function scheduleStepTicks(stepBursts) {
  const ticks = [];
  const slotOf = new Map();
  stepBursts.forEach((b) => {
    const k = `${b.stepIndex}:${b.side}`;
    const slot = slotOf.get(k) ?? 0;
    slotOf.set(k, slot + 1);
    for (let i = 0; i < b.amount; i += 1) {
      ticks.push({
        stepIndex: b.stepIndex,
        t: STEP_PV_DELAY_MS + slot * HP_SOURCE_STAGGER_MS + i * HP_AFTERMATH_STEP_MS,
        side: b.side,
        kind: b.kind,
        step: b.kind === 'heal' ? 1 : -1,
        n: i + 1,
        label: b.label,
        group: `step-${b.key}`,
        slot,
      });
    }
  });
  return ticks;
}

function sessionKeyOf(battleResult) {
  if (!battleResult) return null;
  return [
    battleResult.playerAgent?.id,
    battleResult.enemyAgent?.id,
    battleResult.playerAssault,
    battleResult.enemyAssault,
    battleResult.winner,
    battleResult.finalPlayerHP,
    battleResult.finalEnemyHP,
  ].join('|');
}

function burstText(e) {
  const sign = e.kind === 'heal' ? '+' : '−';
  return e.label && e.cause === 'aftermath' ? `${sign}${e.n} · ${e.label}` : `${sign}${e.n}`;
}

/**
 * @returns {{ active: boolean, displayHP: { player: number, enemy: number } | null,
 *   bursts: { player: object|null, enemy: object|null }, projectiles: object|null }}
 */
export function useDuelHpPresentation({ battleResult, gamePhase, duelPhase, duelEffectStep = 1, playerHP, enemyHP, duelVfx }) {
  const inResult = gamePhase === 'result' && Boolean(battleResult);
  const key = inResult ? sessionKeyOf(battleResult) : null;

  // PV di partenza: quelli dell'ultimo render prima del risultato. resolveBattle scrive già
  // i PV finali nello stato nello stesso batch che apre il risultato, quindi non vanno letti lì.
  const beforeRef = useRef({ player: playerHP, enemy: enemyHP });
  const startRef = useRef({ key: null, hp: null });
  if (!inResult) beforeRef.current = { player: playerHP, enemy: enemyHP };
  if (key && startRef.current.key !== key) startRef.current = { key, hp: { ...beforeRef.current } };
  if (!key && startRef.current.key) startRef.current = { key: null, hp: null };
  const startHP = startRef.current.hp;

  // PV degli effetti (fase 1) e PV di partenza della sequenza dopo lo scontro
  const stepTicks = useMemo(
    () => (key ? scheduleStepTicks(buildDuelHpStepBursts(battleResult)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const afterSteps = useMemo(
    () => (key && startHP ? hpAfterDuelSteps(battleResult, startHP) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const events = useMemo(
    () => (key && afterSteps ? scheduleDuelHpEvents(battleResult, afterSteps) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  // Inizio di ogni step della fase 1 (performance.now) e ridisegno sugli istanti dei tick
  const stepStartRef = useRef(new Map());
  const [, setStepTick] = useState(0);
  useEffect(() => {
    stepStartRef.current = new Map();
  }, [key]);
  useEffect(() => {
    if (!key || duelPhase !== 1 || !stepTicks.length) return undefined;
    const idx = Math.max(1, duelEffectStep || 1);
    if (stepStartRef.current.has(idx)) return undefined;
    stepStartRef.current.set(idx, performance.now());
    const mine = stepTicks.filter((x) => x.stepIndex === idx);
    if (!mine.length) return undefined;
    const marks = new Set();
    mine.forEach((x) => { marks.add(x.t); marks.add(x.t + BURST_HOLD_MS); marks.add(x.t + BURST_HOLD_MS + BURST_LEAVE_MS); });
    const ids = [...marks].map((m) => setTimeout(() => setStepTick((n) => n + 1), m + 5));
    return () => ids.forEach(clearTimeout);
  }, [key, duelPhase, duelEffectStep, stepTicks]);

  // t0 (performance.now) dei proiettili: all'85% della fase 4; «Salta» (fase 6 diretta) = tutto subito
  const [t0, setT0] = useState(null);
  const [elapsed, setElapsed] = useState(-1);
  const sawClashRef = useRef(false);
  useEffect(() => {
    setT0(null);
    setElapsed(-1);
    sawClashRef.current = false;
  }, [key]);

  useEffect(() => {
    if (!key) return undefined;
    if (duelPhase === 4 && t0 == null) {
      sawClashRef.current = true;
      const vfx = duelVfx || DUEL_VISUAL_DEFAULTS;
      const phase4 = buildPhaseAdvanceDelaysMs(vfx, battleResult.playerFocusUsed, battleResult.enemyFocusUsed, battleResult)[4];
      setT0(performance.now() + Math.round(phase4 * HP_PROJECTILE_START_RATIO));
    } else if (duelPhase >= 5 && t0 == null) {
      // fase 4 mai vista: «Salta» prima dello scontro
      if (sawClashRef.current) setT0(performance.now());
      else setElapsed(Infinity);
    } else if (duelPhase >= 6 && t0 != null && performance.now() < t0 - 50) {
      // «Salta» durante lo scontro, prima dei proiettili: PV finali subito
      setElapsed(Infinity);
    }
    return undefined;
  }, [key, duelPhase, t0, battleResult, duelVfx]);

  // Avanza il tempo solo sugli istanti degli eventi (niente re-render a ogni frame)
  useEffect(() => {
    if (!key || t0 == null || elapsed === Infinity) return undefined;
    const timers = [];
    const marks = new Set();
    events.forEach((e) => {
      marks.add(e.t);
      marks.add(e.t + BURST_HOLD_MS);
      marks.add(e.t + BURST_HOLD_MS + BURST_LEAVE_MS);
    });
    marks.add(0);
    const now = performance.now();
    marks.forEach((m) => {
      const wait = t0 + m - now;
      timers.push(setTimeout(() => setElapsed(performance.now() - t0), Math.max(0, wait)));
    });
    return () => timers.forEach(clearTimeout);
  }, [key, t0, events, elapsed === Infinity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fase 0-1: partenza + tick degli effetti già avvenuti; poi la sequenza dopo lo scontro
  const now = performance.now();
  const stepsDone = duelPhase >= 2 || elapsed === Infinity;
  const stepElapsed = (x) => {
    const st = stepStartRef.current.get(x.stepIndex);
    return st == null ? -1 : now - st;
  };
  let displayHP = null;
  if (key && startHP) {
    if (stepsDone) displayHP = displayedHpAt(events, afterSteps, elapsed < 0 ? -1 : elapsed);
    else {
      displayHP = { player: startHP.player, enemy: startHP.enemy };
      stepTicks.forEach((x) => { if (stepElapsed(x) >= x.t) displayHP[x.side] += x.step; });
    }
  }

  // Una raffica per fonte: fonti diverse convivono, ognuna al suo posto (slot) senza sovrapporsi
  const bursts = { player: [], enemy: [] };
  if (key && !stepsDone) {
    const latest = new Map();
    const groupEnd = new Map();
    stepTicks.forEach((x) => {
      const se = stepElapsed(x);
      if (se < 0) return;
      groupEnd.set(x.group, Math.max(groupEnd.get(x.group) ?? 0, x.t));
      if (se >= x.t) latest.set(x.group, { x, se });
    });
    latest.forEach(({ x, se }, group) => {
      const end = groupEnd.get(group);
      if (se > end + BURST_HOLD_MS + BURST_LEAVE_MS) return;
      bursts[x.side].push({
        key: `${key}:${group}`,
        n: x.n,
        kind: x.kind,
        text: `${x.kind === 'heal' ? '+' : '−'}${x.n}${x.label ? ` · ${x.label}` : ''}`,
        slot: x.slot,
        leaving: se > end + BURST_HOLD_MS,
      });
    });
  }
  if (key && elapsed >= 0 && elapsed !== Infinity) {
    const latest = new Map();
    const groupEnd = new Map();
    for (const e of events) {
      groupEnd.set(e.group, Math.max(groupEnd.get(e.group) ?? 0, e.t));
      if (e.t <= elapsed) latest.set(e.group, e);
    }
    latest.forEach((cur, group) => {
      const end = groupEnd.get(group);
      if (elapsed > end + BURST_HOLD_MS + BURST_LEAVE_MS) return;
      bursts[cur.side].push({
        key: `${key}:${group}`,
        n: cur.n,
        kind: cur.kind,
        text: burstText(cur),
        slot: cur.slot ?? 0,
        leaving: elapsed > end + BURST_HOLD_MS,
      });
    });
    bursts.player.sort((a, b) => a.slot - b.slot);
    bursts.enemy.sort((a, b) => a.slot - b.slot);
  }

  // oggetto stabile: il canvas dei proiettili riparte solo quando cambia davvero
  const skipped = elapsed === Infinity;
  const projectiles = useMemo(() => {
    const damage = events.filter((e) => e.cause === 'damage');
    if (!key || t0 == null || skipped || !damage.length) return null;
    return { t0, target: damage[0].side, count: damage.length, winner: battleResult.winner };
  }, [key, t0, skipped, events]); // eslint-disable-line react-hooks/exhaustive-deps

  return { active: Boolean(key), displayHP, bursts, projectiles };
}
