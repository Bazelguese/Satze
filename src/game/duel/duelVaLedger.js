// Scheda VA laterale del duello (solo presentazione): POT, × FC, modificatori VA con la
// loro fonte e totale. I numeri vengono dal motore (battleResult): gli eventi VA del log
// strutturato dicono chi ha modificato il VA, i visualSteps quando la modifica compare.

import { TRIGGER_NAMES } from '../../data/triggers.js';
import { getPreVaStepIndex } from './duelVisualSteps.js';

/** Colori delle righe: Potere, Bonus, copia, Campo, minimo di schieramento. */
export const VA_LEDGER_COLORS = Object.freeze({
  ability: '#fb923c',
  bonus: '#38bdf8',
  copied: '#86efac',
  field: '#cbd5e1',
  floor: '#94a3b8',
});

const PRE_VA_REVEAL = new Set(['deploy', 'abilityFx', 'focusFx', 'assaultFx']);

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function engineSide(battleSide) {
  if (battleSide === 'local' || battleSide === 'player') return 'player';
  if (battleSide === 'opponent' || battleSide === 'enemy') return 'enemy';
  return null;
}

function rowOf(src) {
  const copied = /copiat/i.test(String(src?.name || ''));
  if (src?.kind === 'ability') return { row: 'ability', copied };
  if (src?.kind === 'bonus') return { row: 'bonus', copied };
  if (src?.kind === 'field') return { row: 'field', copied: false };
  return { row: 'other', copied };
}

function labelOf(src, row, copied, br) {
  const owner = engineSide(src?.ownerSide);
  const isPlayer = owner === 'player';
  const agent = owner ? (isPlayer ? br.playerAgent : br.enemyAgent) : null;
  if (row === 'ability') {
    const ability = copied ? (isPlayer ? br.playerAbilityCopied : br.enemyAbilityCopied) || agent?.ability : agent?.ability;
    const name = TRIGGER_NAMES[ability?.trigger] || 'Potere';
    return `★ ${name}`;
  }
  if (row === 'bonus') {
    const copiedFrom = copied ? (isPlayer ? br.enemyAgent : br.playerAgent) : null;
    const army = copiedFrom?.army || agent?.army;
    return army ? `✠ Bonus ${army}` : '✠ Bonus';
  }
  if (row === 'field') return `◈ ${src?.name || br.field?.name || 'Campo'}`;
  return src?.name || 'Effetto';
}

/**
 * Righe fisse della scheda di un lato.
 * @param {object} br battleResult
 * @param {'player'|'enemy'} side
 * @returns {{ mods: Array<{ key: string, v: number, label: string, color: string, row: string, copied: boolean, arriveStep: number, counted?: number }>,
 *   floor: { min: number, raw: number } | null, final: number, focus: number, power: number }}
 */
export function buildDuelVaLedgerRows(br, side) {
  const isPlayer = side === 'player';
  const out = { mods: [], floor: null, final: 0, focus: 0, power: 0 };
  if (!br) return out;
  const key = isPlayer ? 'playerAssaultMod' : 'enemyAssaultMod';
  const steps = Array.isArray(br.visualSteps) ? br.visualSteps : [];
  const preVa = getPreVaStepIndex(steps);
  const lastPre = preVa >= 0 ? preVa : steps.length - 1;

  const events = (Array.isArray(br.events) ? br.events : []).filter(
    (e) => e && (e.type === 'statChange' || e.type === 'resourceChange') && e.stat === 'VA' && e.phase !== 'post'
      && PRE_VA_REVEAL.has(e.revealAt ?? 'abilityFx') && engineSide(e.target?.side) === side
  );

  // La riga compare allo step visivo in cui il mod cumulativo del lato raggiunge il suo valore
  let running = 0;
  let minStep = 0;
  events.forEach((e, i) => {
    const v = toInt(e.after) - toInt(e.before);
    if (!v) return;
    running += v;
    let arriveStep = lastPre >= 0 ? lastPre : 0;
    for (let s = minStep; s <= lastPre; s += 1) {
      if (toInt(steps[s]?.[key]) === running) { arriveStep = s; break; }
    }
    minStep = arriveStep;
    const { row, copied } = rowOf(e.source);
    out.mods.push({
      key: `va-${i}`,
      v,
      label: labelOf(e.source, row, copied, br),
      color: copied ? VA_LEDGER_COLORS.copied : VA_LEDGER_COLORS[row] || VA_LEDGER_COLORS.field,
      row,
      copied,
      arriveStep,
    });
  });

  // Mod dichiarato dal motore ma senza evento: una riga generica, per far tornare i conti
  const declared = toInt(isPlayer ? br.playerAssaultMod : br.enemyAssaultMod);
  if (declared !== running) {
    out.mods.push({ key: 'va-rest', v: declared - running, label: 'Modificatori', color: VA_LEDGER_COLORS.field, row: 'other', copied: false, arriveStep: lastPre >= 0 ? lastPre : 0 });
  }

  const calc = (Array.isArray(br.events) ? br.events : []).find(
    (e) => e && e.type === 'assaultCalculation' && engineSide(e.target?.side) === side
  );
  const power = toInt(
    calc?.basePower ?? (preVa >= 0 ? steps[preVa]?.[isPlayer ? 'playerPower' : 'enemyPower'] : (isPlayer ? br.playerPowerAfterEffects ?? br.playerPower : br.enemyPowerAfterEffects ?? br.enemyPower))
  );
  const focus = toInt(isPlayer ? br.playerFocusUsed : br.enemyFocusUsed);
  // FC che contano nel VA (Campi «FC ÷2», «max N FC»): prima riga del Calcolo, poi i modificatori
  const counted = calc?.focus != null ? toInt(calc.focus) : focus;
  if (counted !== focus) {
    out.mods.unshift({
      key: 'va-focus',
      v: power * (counted - focus),
      label: `◈ ${br.field?.name || 'Campo'} · FC ${counted}/${focus}`,
      color: VA_LEDGER_COLORS.field,
      row: 'focus',
      copied: false,
      arriveStep: Infinity,
      counted,
    });
  }
  const raw = toInt(isPlayer ? br.playerAssaultRaw : br.enemyAssaultRaw, power * focus + declared);
  const agent = isPlayer ? br.playerAgent : br.enemyAgent;
  const min = toInt(isPlayer ? br.playerAssaultMinFinal : br.enemyAssaultMinFinal, toInt(agent?.power));
  const final = toInt(isPlayer ? br.playerAssault : br.enemyAssault, Math.max(raw, min));
  if (raw < min) out.floor = { min, raw };
  out.final = final;
  out.focus = focus;
  out.power = power;
  return out;
}

/**
 * Stato della scheda in un momento del duello.
 * @param {ReturnType<typeof buildDuelVaLedgerRows>} rows
 * @param {{ duelPhase: number, duelEffectStep: number, coinsShown: number, resolved: number, stepPower: number|null }} at
 *   `resolved`: quante righe (mod + minimo) sono già entrate nel totale durante la fase 3.
 */
export function duelVaLedgerAt(rows, { duelPhase, duelEffectStep = 1, coinsShown = 0, resolved = 0, stepPower = null }) {
  const phase = toInt(duelPhase, 0);
  const visibleStep = phase <= 0 ? 0 : phase === 1 ? Math.max(1, toInt(duelEffectStep, 1)) : Infinity;
  const total = rows.mods.length + (rows.floor ? 1 : 0);
  const done = phase >= 4 ? total : phase === 3 ? Math.min(total, Math.max(0, resolved)) : 0;
  const pot = phase < 2 && stepPower != null ? toInt(stepPower) : rows.power;

  // la riga degli FC contati (arriveStep Infinity) compare solo al Calcolo
  const mods = rows.mods.map((m, i) => ({ ...m, arrived: m.arriveStep === Infinity ? phase >= 3 : m.arriveStep <= visibleStep, on: i < done }));
  const focusRow = mods.find((m) => m.row === 'focus');
  let shown = phase < 2 ? null : phase === 2 ? Math.min(rows.focus, Math.max(0, toInt(coinsShown))) : rows.focus;
  if (focusRow?.on) shown = focusRow.counted;
  const floor = rows.floor ? { ...rows.floor, arrived: phase >= 3 && done >= rows.mods.length, on: done >= total } : null;

  let va = null;
  if (phase >= 4) va = rows.final;
  else if (shown != null) {
    va = pot * (phase === 3 ? rows.focus : shown);
    if (phase === 3) {
      mods.forEach((m) => { if (m.on) va += m.v; });
      if (floor?.on) va = Math.max(va, rows.floor.min);
    }
  }
  return { pot, fc: shown, fcTotal: rows.focus, fcCounted: focusRow?.on ? focusRow.counted : null, mods, floor, va, resolvedCount: done, rowCount: total };
}
