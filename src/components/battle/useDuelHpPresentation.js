/**
 * PV, FC e Tossina a schermo durante il risultato del duello. Stessa regia per tutti:
 * una raffica per fonte (−1 → −2 …, +1 → +2 · fonte), numero che rotola, proiettile dalla
 * fonte al pannello. Negli effetti (fase 1) ogni cambiamento cade nel passo del suo Potere;
 * dopo lo scontro: DAN → PV di fine duello → FC aggiunte → danno della Tossina.
 * I valori veri restano quelli di satze.jsx (PV e Tossina cambiano su «Continua»); qui si
 * anima solo la lettura, e arriva agli stessi numeri.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPhaseAdvanceDelaysMs } from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';
import {
  HP_PROJECTILE_START_RATIO,
  HP_PROJECTILE_FLIGHT_MS,
  HP_PROJECTILE_GAP_MS,
  HP_AFTERMATH_STEP_MS,
  HP_SOURCE_STAGGER_MS,
  hpAfterDuelSteps,
} from '../../game/duel/duelHpPresentation.js';
import {
  buildDuelStepEffects,
  fcBeforeGains,
  scheduleDuelResultEvents,
  displayedStatAt,
} from '../../game/duel/duelResultPresentation.js';

/** Quanto resta l'etichetta della raffica dopo l'ultimo punto, e quanto dura la sua uscita (ms). */
const BURST_HOLD_MS = 700;
const BURST_LEAVE_MS = 400;
/** Cure degli effetti: partono quando il fascio del Potere arriva (DuelStepFx: 60 + 480 ms). */
const STEP_PV_DELAY_MS = 540;
/** Danni, FC e Tossina degli effetti: il proiettile parte poco dopo l'inizio dello step. */
const STEP_HIT_LAUNCH_MS = 200;

/** Punti degli effetti, uno per tick, con l'istante relativo all'inizio del loro step. */
function scheduleStepTicks(effects) {
  const ticks = [];
  const slotOf = new Map();
  effects.forEach((b) => {
    // PV e Tossina condividono le etichette sotto i PV; le FC hanno le loro
    const lane = b.stat === 'FC' ? 'FC' : 'PV';
    const k = `${b.stepIndex}:${b.side}:${lane}`;
    const slot = slotOf.get(k) ?? 0;
    slotOf.set(k, slot + 1);
    const count = b.stat === 'TOX' ? 1 : b.amount;
    const flies = b.kind !== 'heal';
    for (let i = 0; i < count; i += 1) {
      ticks.push({
        stepIndex: b.stepIndex,
        stat: b.stat,
        t: flies
          ? STEP_HIT_LAUNCH_MS + slot * HP_SOURCE_STAGGER_MS + HP_PROJECTILE_FLIGHT_MS + i * HP_PROJECTILE_GAP_MS
          : STEP_PV_DELAY_MS + slot * HP_SOURCE_STAGGER_MS + i * HP_AFTERMATH_STEP_MS,
        origin: flies ? b.origin : null,
        side: b.side,
        kind: b.kind,
        step: b.kind === 'hit' ? -1 : 1,
        n: i + 1,
        label: b.label,
        toxin: b.toxin || null,
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
  if (e.kind === 'tox') return `Tossina ${e.toxin?.value ?? ''}${e.label ? ` · ${e.label}` : ''}`;
  const sign = e.kind === 'hit' ? '−' : '+';
  const labelled = e.stat === 'FC' || e.cause !== 'damage';
  return e.label && labelled ? `${sign}${e.n} · ${e.label}` : `${sign}${e.n}`;
}

function burstOf(key, group, e, elapsed, end) {
  return {
    key: `${key}:${group}`,
    n: e.n,
    kind: e.kind,
    text: burstText(e),
    slot: e.slot ?? 0,
    leaving: elapsed > end + BURST_HOLD_MS,
  };
}

/**
 * @returns {{ active: boolean,
 *   displayHP: { player: number, enemy: number } | null,
 *   displayFC: { player: number, enemy: number } | null,
 *   displayToxin: { player: object|null, enemy: object|null } | null,
 *   bursts: { player: object[], enemy: object[] }, fcBursts: { player: object[], enemy: object[] },
 *   projectiles: Array<{ key: string, launch: number, origin: object, target: 'player'|'enemy', stat: 'PV'|'FC' }>|null }}
 */
export function useDuelHpPresentation({
  battleResult, gamePhase, duelPhase, duelEffectStep = 1,
  playerHP, enemyHP, playerToxin = null, enemyToxin = null, duelVfx,
}) {
  const inResult = gamePhase === 'result' && Boolean(battleResult);
  const key = inResult ? sessionKeyOf(battleResult) : null;

  // Partenza: PV e Tossina dell'ultimo render prima del risultato (resolveBattle scrive già i PV
  // finali nello stesso batch che apre il risultato); FC finali meno quelle che gli effetti aggiungono
  // (le FC investite restano tolte subito, come prima).
  const beforeRef = useRef({ hp: { player: playerHP, enemy: enemyHP }, toxin: { player: playerToxin, enemy: enemyToxin } });
  const startRef = useRef({ key: null });
  if (!inResult) beforeRef.current = { hp: { player: playerHP, enemy: enemyHP }, toxin: { player: playerToxin, enemy: enemyToxin } };
  if (key && startRef.current.key !== key) {
    startRef.current = {
      key,
      hp: { ...beforeRef.current.hp },
      toxin: { ...beforeRef.current.toxin },
      fc: fcBeforeGains(battleResult, { player: battleResult.finalPlayerFC, enemy: battleResult.finalEnemyFC }),
    };
  }
  if (!key && startRef.current.key) startRef.current = { key: null };
  const { hp: startHP, fc: startFC, toxin: startToxin } = startRef.current;

  const stepTicks = useMemo(
    () => (key ? scheduleStepTicks(buildDuelStepEffects(battleResult)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const plan = useMemo(() => {
    if (!key || !startHP) return null;
    const afterHP = hpAfterDuelSteps(battleResult, startHP);
    const afterFC = { ...startFC };
    stepTicks.forEach((x) => { if (x.stat === 'FC') afterFC[x.side] += 1; });
    const res = scheduleDuelResultEvents(battleResult, { startHP, startFC, startToxin });
    const toxinTickAt = { player: null, enemy: null };
    res.events.forEach((e) => { if (e.cause === 'toxin' && toxinTickAt[e.side] == null) toxinTickAt[e.side] = e.t; });
    // Tossina dopo gli effetti: quella di partenza, o quella applicata da un Potere nel suo passo
    const toxinAfterSteps = { ...startToxin };
    stepTicks.forEach((x) => { if (x.stat === 'TOX') toxinAfterSteps[x.side] = x.toxin; });
    return { afterHP, afterFC, events: res.events, toxinAfterTick: res.toxinAfterTick, toxinTickAt, toxinAppliedAt: res.toxinAppliedAt, toxinAfterSteps };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const events = plan?.events || [];

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
    // ridisegna subito: i proiettili dello step partono prima del primo punto
    setStepTick((n) => n + 1);
    const marks = new Set();
    mine.forEach((x) => { marks.add(x.t); marks.add(x.t + BURST_HOLD_MS); marks.add(x.t + BURST_HOLD_MS + BURST_LEAVE_MS); });
    const ids = [...marks].map((m) => setTimeout(() => setStepTick((n) => n + 1), m + 5));
    return () => ids.forEach(clearTimeout);
  }, [key, duelPhase, duelEffectStep, stepTicks]);

  // t0 (performance.now) dei proiettili del DAN, verso la fine della fase 4; «Salta» = tutto subito
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
      // «Salta» durante lo scontro, prima dei proiettili: valori finali subito
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

  const now = performance.now();
  const stepsDone = duelPhase >= 2 || elapsed === Infinity;
  const stepElapsed = (x) => {
    const st = stepStartRef.current.get(x.stepIndex);
    return st == null ? -1 : now - st;
  };
  const el = elapsed < 0 ? -1 : elapsed;

  let displayHP = null;
  let displayFC = null;
  let displayToxin = null;
  if (key && plan) {
    if (stepsDone) {
      displayHP = displayedStatAt(events, 'PV', plan.afterHP, el);
      displayFC = displayedStatAt(events, 'FC', plan.afterFC, el);
      displayToxin = {};
      ['player', 'enemy'].forEach((side) => {
        const tickAt = plan.toxinTickAt[side];
        const applied = plan.toxinAppliedAt[side];
        if (tickAt != null && el >= tickAt) displayToxin[side] = plan.toxinAfterTick[side];
        else if (applied && el >= applied.t) displayToxin[side] = applied.toxin;
        else displayToxin[side] = plan.toxinAfterSteps[side];
      });
      // «Salta»: lo stato dopo il danno di fine turno, anche senza danno
      if (elapsed === Infinity) displayToxin = { ...plan.toxinAfterTick };
    } else {
      displayHP = { ...startHP };
      displayFC = { ...startFC };
      displayToxin = { ...startToxin };
      stepTicks.forEach((x) => {
        if (stepElapsed(x) < x.t) return;
        if (x.stat === 'PV') displayHP[x.side] += x.step;
        else if (x.stat === 'FC') displayFC[x.side] += 1;
        else if (x.stat === 'TOX') displayToxin[x.side] = x.toxin;
      });
    }
  }

  // Una raffica per fonte: fonti diverse convivono, ognuna al suo posto (slot) senza sovrapporsi.
  // Le raffiche di FC vanno accanto alla cella FC, quelle di PV e Tossina sotto i PV.
  const bursts = { player: [], enemy: [] };
  const fcBursts = { player: [], enemy: [] };
  const push = (b, stat, side) => (stat === 'FC' ? fcBursts : bursts)[side].push(b);
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
      push(burstOf(key, group, { ...x, cause: 'step' }, se, end), x.stat, x.side);
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
      push(burstOf(key, group, cur, elapsed, end), cur.stat, cur.side);
    });
  }
  [bursts, fcBursts].forEach((b) => { b.player.sort((x, y) => x.slot - y.slot); b.enemy.sort((x, y) => x.slot - y.slot); });

  // Proiettili: uno per ogni colpo, FC aggiunta o Tossina, dalla sua fonte al pannello.
  // Partono un volo prima dell'istante in cui il numero cambia.
  const skipped = elapsed === Infinity;
  const shots = [];
  if (key && !skipped) {
    if (t0 != null) {
      events.forEach((e, i) => {
        if (e.origin && e.kind !== 'heal') shots.push({ key: `m${i}`, launch: t0 + e.t - HP_PROJECTILE_FLIGHT_MS, origin: e.origin, target: e.side, stat: e.stat });
      });
    }
    stepTicks.forEach((x, i) => {
      const st = stepStartRef.current.get(x.stepIndex);
      if (x.origin && st != null) shots.push({ key: `s${i}`, launch: st + x.t - HP_PROJECTILE_FLIGHT_MS, origin: x.origin, target: x.side, stat: x.stat === 'FC' ? 'FC' : 'PV' });
    });
  }
  const shotsKey = shots.map((x) => `${x.key}@${Math.round(x.launch)}`).join('|');
  // oggetto stabile: il canvas dei proiettili riparte solo quando cambia davvero
  const projectiles = useMemo(() => (shots.length ? shots : null), [shotsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { active: Boolean(key), displayHP, displayFC, displayToxin, bursts, fcBursts, projectiles };
}
