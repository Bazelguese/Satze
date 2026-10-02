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
  scheduleDuelHpEvents,
  displayedHpAt,
} from '../../game/duel/duelHpPresentation.js';

/** Quanto resta l'etichetta della raffica dopo l'ultimo punto, e quanto dura la sua uscita (ms). */
const BURST_HOLD_MS = 700;
const BURST_LEAVE_MS = 400;

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
export function useDuelHpPresentation({ battleResult, gamePhase, duelPhase, playerHP, enemyHP, duelVfx }) {
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

  const events = useMemo(
    () => (key && startHP ? scheduleDuelHpEvents(battleResult, startHP) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

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

  const displayHP = key && startHP ? displayedHpAt(events, startHP, elapsed < 0 ? -1 : elapsed) : null;

  const bursts = { player: null, enemy: null };
  if (key && elapsed >= 0 && elapsed !== Infinity) {
    ['player', 'enemy'].forEach((side) => {
      let cur = null;
      for (const e of events) {
        if (e.side !== side || e.t > elapsed) continue;
        cur = e;
      }
      if (!cur) return;
      const groupEnd = events.filter((e) => e.group === cur.group).reduce((m, e) => Math.max(m, e.t), 0);
      if (elapsed > groupEnd + BURST_HOLD_MS + BURST_LEAVE_MS) return;
      bursts[side] = {
        key: `${key}:${cur.group}`,
        n: cur.n,
        kind: cur.kind,
        text: burstText(cur),
        leaving: elapsed > groupEnd + BURST_HOLD_MS,
      };
    });
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
