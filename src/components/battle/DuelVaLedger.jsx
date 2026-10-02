/**
 * Scheda VA laterale (stile portale): fuori dalla carta, a sinistra per l'avversario e a
 * destra per te, in coordinate di scena (1920×1080) come nel mockup. POT, × FC con i segmenti che si accendono quando le monete atterrano,
 * modificatori colorati per fonte che entrano nel totale in fase 3, VA finale.
 * Si nasconde durante lo zoom dello scontro e torna con l'esito (barrato chi perde).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildPhaseAdvanceDelaysMs, computePhase3DurationMs } from '../../config/duelVisualTimeline.js';
import { DUEL_VISUAL_DEFAULTS } from '../../config/duelVisualConfig.js';
import { buildDuelVaLedgerRows, duelVaLedgerAt } from '../../game/duel/duelVaLedger.js';
import { getDuelVisualDisplay } from './duelVisualDisplay.js';

/** Quota della fase 4 dopo cui l'esito è deciso e la scheda torna. */
const DECIDED_RATIO = 0.78;
/** Volo del modificatore verso il totale, prima che entri nel conto (ms). */
const FLY_MS = 380;
/** Ritardo d'ingresso di un modificatore nello step in cui scatta: il fascio parte a 60 ms e dura 480. */
const MOD_ARRIVE_DELAY_MS = 540;

function fmt(v) {
  return String(v).replace('-', '−');
}

function signed(v) {
  return v > 0 ? `+${v}` : fmt(v);
}

export function DuelVaLedger({
  battleResult,
  side,
  duelPhase,
  duelEffectStep = 1,
  coinsShown = 0,
  duelVfx,
  accentColor,
  kicker,
  hidden = false,
}) {
  const isPlayer = side === 'player';
  const vfx = useMemo(() => ({ ...DUEL_VISUAL_DEFAULTS, ...(duelVfx || {}) }), [duelVfx]);
  const rows = useMemo(() => buildDuelVaLedgerRows(battleResult, side), [battleResult, side]);
  const rowCount = rows.mods.length + (rows.floor ? 1 : 0);

  // Fase 3: le righe entrano nel totale una alla volta, distribuite sulla durata della fase
  const [resolved, setResolved] = useState(0);
  const [flying, setFlying] = useState(-1);
  useEffect(() => {
    setResolved(0);
    setFlying(-1);
    if (duelPhase !== 3 || rowCount === 0) return undefined;
    const dur = computePhase3DurationMs(vfx, battleResult);
    const step = dur / (rowCount + 1);
    const ids = [];
    for (let i = 0; i < rowCount; i += 1) {
      const at = Math.round((i + 1) * step);
      ids.push(setTimeout(() => setFlying(i), Math.max(0, at - Math.min(FLY_MS, step * 0.8))));
      ids.push(setTimeout(() => { setResolved(i + 1); setFlying(-1); }, at));
    }
    return () => ids.forEach(clearTimeout);
  }, [duelPhase, rowCount, battleResult, vfx]);

  // Fase 4: nascosta durante lo zoom, torna quando l'esito è deciso
  const [decided, setDecided] = useState(false);
  useEffect(() => {
    if (duelPhase < 4) { setDecided(false); return undefined; }
    if (duelPhase >= 5) { setDecided(true); return undefined; }
    const phase4 = buildPhaseAdvanceDelaysMs(vfx, battleResult?.playerFocusUsed, battleResult?.enemyFocusUsed, battleResult)[4];
    const id = setTimeout(() => setDecided(true), Math.round(phase4 * DECIDED_RATIO));
    return () => clearTimeout(id);
  }, [duelPhase, battleResult, vfx]);

  // POT durante gli effetti (fase 1): quello dello step visivo corrente, come sulla carta
  const stepPower = duelPhase < 2 && battleResult
    ? getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep)?.[isPlayer ? 'playerPower' : 'enemyPower'] ?? null
    : null;
  const st = duelVaLedgerAt(rows, { duelPhase, duelEffectStep, coinsShown, resolved, stepPower });

  // Volo del modificatore: dalla sua riga al totale
  const bodyRef = useRef(null);
  const [fly, setFly] = useState(null);
  useLayoutEffect(() => {
    if (flying < 0 || !bodyRef.current) { setFly(null); return; }
    const body = bodyRef.current;
    const row = body.querySelector(`[data-ledger-row="${flying}"]`);
    const total = body.querySelector('[data-ledger-total]');
    if (!row || !total) { setFly(null); return; }
    const isFloor = flying >= rows.mods.length;
    const m = isFloor ? null : rows.mods[flying];
    setFly({
      key: `${flying}`,
      text: isFloor ? `≥${rows.floor.min}` : signed(m.v),
      color: isFloor ? '#cbd5e1' : m.color,
      y0: row.offsetTop,
      y1: total.offsetTop + 6,
    });
  }, [flying, rows]);

  if (!battleResult) return null;
  const winner = battleResult.winner;
  const outcome = decided && (winner === 'player' || winner === 'enemy') ? (winner === side ? 'win' : 'lose') : null;
  const zoomHidden = duelPhase === 4 && !decided;
  const initiativeFirst = isPlayer ? battleResult.isPlayerFirst !== false : battleResult.isPlayerFirst === false;
  const agent = isPlayer ? battleResult.playerAgent : battleResult.enemyAgent;
  // segmenti: uno per moneta atterrata; quelli che il Campo non conta restano spenti
  const landed = st.fcCounted != null ? st.fcTotal : st.fc ?? 0;
  const pips = Array.from({ length: st.fcTotal }, (_, i) => (i < landed ? (st.fcCounted != null && i >= st.fcCounted ? 'off' : 'on') : null));

  return (
    <div
      className={[
        'satze-va-ledger',
        `satze-va-ledger--${side}`,
        hidden || zoomHidden ? 'is-hidden' : '',
        outcome ? `is-${outcome}` : '',
      ].join(' ')}
      style={{ '--acc': accentColor || (isPlayer ? '#38bdf8' : '#f87171') }}
      data-va-ledger={side}
      aria-hidden={hidden || zoomHidden}
    >
      <div className="satze-va-ledger__shell">
        <div className="satze-va-ledger__head">
          <i className="satze-va-ledger__node" />
          <div className="satze-va-ledger__id">
            <span className="satze-va-ledger__kick">{kicker || (isPlayer ? 'Tu' : 'IA')}</span>
            <span className="satze-va-ledger__name" title={agent?.name}>{String(agent?.name || '').split(',')[0]}</span>
          </div>
          <span className="satze-va-ledger__ini">{initiativeFirst ? '1°' : '2°'}</span>
        </div>
        <div className="satze-va-ledger__ticks" />
        <div className="satze-va-ledger__body" ref={bodyRef}>
          <div className="satze-va-ledger__row">
            <span>POT</span>
            <b key={`pot-${st.pot}`} className="satze-va-ledger__pop">{st.pot}</b>
          </div>
          <div className="satze-va-ledger__row">
            <span>
              × FC
              <span className="satze-va-ledger__pips">
                {pips.map((p, i) => (p ? <i key={i} className={p === 'off' ? 'is-off' : undefined} /> : null))}
              </span>
            </span>
            <b key={`fc-${st.fc}`} data-ledger-fc className={st.fc == null ? 'is-empty' : 'satze-va-ledger__pop'}>{st.fc == null ? '—' : st.fc}</b>
          </div>
          {st.mods.map((m, i) => (m.arrived ? (
            <div
              key={m.key}
              data-ledger-row={i}
              className={`satze-va-ledger__mod${m.on ? ' is-on' : ''}`}
              // arriva quando il fascio dalla carta la raggiunge (DuelStepFx)
              style={{ '--sc': m.color, animationDelay: duelPhase === 1 && m.arriveStep === duelEffectStep ? `${MOD_ARRIVE_DELAY_MS}ms` : undefined }}
            >
              <b>{signed(m.v)}</b>
              <div>{m.label}</div>
            </div>
          ) : null))}
          {st.floor?.arrived ? (
            <div
              data-ledger-row={rows.mods.length}
              className={`satze-va-ledger__mod satze-va-ledger__mod--floor${st.floor.on ? ' is-on' : ''}`}
              style={{ '--sc': '#cbd5e1' }}
            >
              <b>≥{st.floor.min}</b>
              <div>Minimo di schieramento</div>
            </div>
          ) : null}
          <div className="satze-va-ledger__rule" />
          <div className="satze-va-ledger__total" data-ledger-total>
            <span>VA</span>
            <b key={`va-${st.va}-${outcome || ''}`} className={st.va == null ? 'is-empty' : 'satze-va-ledger__pop'}>
              {st.va == null ? '—' : st.va}
            </b>
            <i className="satze-va-ledger__strike" />
          </div>
          {fly ? (
            <div
              key={fly.key}
              className="satze-va-ledger__fly"
              style={{ color: fly.color, '--fly-y0': `${fly.y0}px`, '--fly-y1': `${fly.y1}px`, animationDuration: `${FLY_MS}ms` }}
            >
              {fly.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DuelVaLedger;
