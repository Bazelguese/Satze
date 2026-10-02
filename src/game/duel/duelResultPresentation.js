// Sequenza del risultato del duello per PV, FC e Tossina (solo presentazione).
// Stessa regia per tutte e tre: una raffica per fonte (−1 → −2 …, +1 → +2 · fonte),
// numero che rotola, proiettile dalla fonte al pannello. I valori finali sono quelli del
// motore (battleResult) e, per la Tossina di fine turno, di applyToxin come su «Continua».
//
//   effetti (fase 1)   PV dei Poteri, FC aggiunte dai Poteri, Tossina applicata — nel loro passo
//   dopo lo scontro    DAN dello scontro → PV di fine duello → FC aggiunte → Tossine applicate
//                      a fine duello → danno della Tossina,
//                      ognuno dopo un respiro dal precedente

import { applyToxin } from '../toxinLogic.js';
import {
  HP_PROJECTILE_FLIGHT_MS,
  HP_PROJECTILE_GAP_MS,
  HP_SOURCE_STAGGER_MS,
  toInt,
  engineSide,
  originOf,
  sourceLabel,
  abilityStepOf,
  buildDuelHpStepBursts,
  hpAfterDuelSteps,
  scheduleDuelHpEvents,
} from './duelHpPresentation.js';

/** Respiro tra un gruppo di raffiche dopo lo scontro e il successivo (ms). */
export const RESULT_GROUP_BEAT_MS = 450;

const SIDES = ['player', 'enemy'];

function fcEvents(br) {
  return (Array.isArray(br?.events) ? br.events : []).filter(
    (e) => e && e.type === 'resourceChange' && e.stat === 'FC' && toInt(e.after) > toInt(e.before)
  );
}

/** Step degli effetti a cui appartiene un evento con fonte Potere, o -1. */
function stepOfAbility(br, e) {
  if (e.revealAt !== 'abilityFx' || e.source?.kind !== 'ability') return -1;
  const owner = engineSide(e.source.ownerSide);
  return owner ? abilityStepOf(br, owner) : -1;
}

function group(list) {
  const map = new Map();
  list.forEach((x) => {
    const cur = map.get(x.key);
    if (cur) cur.amount += x.amount;
    else map.set(x.key, { ...x });
  });
  return [...map.values()].filter((x) => x.amount > 0);
}

/**
 * Effetti dei passi (fase 1): PV dei Poteri, FC aggiunte dai Poteri, Tossina applicata.
 * @returns {Array<{ stepIndex: number, stat: 'PV'|'FC'|'TOX', side: 'player'|'enemy', kind: 'hit'|'heal'|'gain'|'tox',
 *   amount: number, label: string|null, origin: object, key: string, toxin?: object }>}
 */
export function buildDuelStepEffects(br) {
  if (!br) return [];
  const out = buildDuelHpStepBursts(br).map((b) => ({ ...b, stat: 'PV', key: `pv:${b.key}` }));
  const fc = [];
  fcEvents(br).forEach((e) => {
    const step = stepOfAbility(br, e);
    const side = engineSide(e.target?.side);
    if (step < 0 || !side) return;
    const label = sourceLabel(e.source, br);
    fc.push({ stepIndex: step, stat: 'FC', side, kind: 'gain', amount: toInt(e.after) - toInt(e.before), label, origin: originOf(e.source), key: `fc:${step}:${side}:${label || ''}` });
  });
  out.push(...group(fc));
  (Array.isArray(br.events) ? br.events : []).forEach((e) => {
    if (!e || e.type !== 'info' || e.infoCode !== 'toxinApplied') return;
    const step = stepOfAbility(br, e);
    const side = engineSide(e.target?.side);
    if (step < 0 || !side) return;
    const toxin = (side === 'player' ? br.playerToxinActivated : br.enemyToxinActivated)
      || { value: toInt(e.data?.value), minHealth: toInt(e.data?.minHealth), source: e.source?.name };
    out.push({ stepIndex: step, stat: 'TOX', side, kind: 'tox', amount: toInt(e.data?.value, 1), label: sourceLabel(e.source, br), origin: originOf(e.source), key: `tox:${step}:${side}`, toxin });
  });
  return out;
}

/** FC aggiunte dopo lo scontro (Poteri e Campi di fine duello), una raffica per fonte. */
export function buildDuelFcPostBursts(br) {
  const list = [];
  fcEvents(br).forEach((e) => {
    if (stepOfAbility(br, e) >= 0) return;
    const side = engineSide(e.target?.side);
    if (!side) return;
    const label = sourceLabel(e.source, br);
    list.push({ side, kind: 'gain', amount: toInt(e.after) - toInt(e.before), label, origin: originOf(e.source), key: `fcpost:${side}:${e.source?.kind || 'x'}:${label || ''}` });
  });
  return group(list);
}

/** FC a schermo all'apertura del risultato: quelle finali meno quelle che gli effetti aggiungeranno. */
export function fcBeforeGains(br, finalFC) {
  const fc = { player: toInt(finalFC?.player), enemy: toInt(finalFC?.enemy) };
  buildDuelStepEffects(br).filter((x) => x.stat === 'FC').forEach((x) => { fc[x.side] -= x.amount; });
  buildDuelFcPostBursts(br).forEach((x) => { fc[x.side] -= x.amount; });
  return { player: Math.max(0, fc.player), enemy: Math.max(0, fc.enemy) };
}

/** Tossine attive dopo il duello (applicate ora o già attive), come le usa «Continua». */
export function toxinsAfterDuel(br, startToxin) {
  return {
    player: br?.playerToxinActivated || startToxin?.player || null,
    enemy: br?.enemyToxinActivated || startToxin?.enemy || null,
  };
}

/**
 * Sequenza dopo lo scontro (istanti relativi alla partenza dei proiettili del DAN).
 * @param {object} br battleResult
 * @param {{ startHP: { player: number, enemy: number }, startFC: { player: number, enemy: number },
 *   startToxin?: { player: object|null, enemy: object|null } }} start
 * @returns {{ events: Array<object>, toxinAppliedAt: { player: { t: number, toxin: object }|null, enemy: object|null },
 *   toxinAfterTick: { player: object|null, enemy: object|null },
 *   finalHP: { player: number, enemy: number } }}
 *   Ogni evento: { t, stat: 'PV'|'FC', side, from, to, kind, cause, n, label, group, slot, origin }.
 */
export function scheduleDuelResultEvents(br, { startHP, startFC, startToxin = null }) {
  const afterSteps = hpAfterDuelSteps(br, startHP);
  const events = scheduleDuelHpEvents(br, afterSteps).map((e) => ({ ...e, stat: 'PV' }));
  let tEnd = events.length ? Math.max(...events.map((e) => e.t)) : 0;

  // FC aggiunte a fine duello: dopo le raffiche di PV, con il loro proiettile
  const fcRun = { player: toInt(startFC?.player), enemy: toInt(startFC?.enemy) };
  buildDuelStepEffects(br).filter((x) => x.stat === 'FC').forEach((x) => { fcRun[x.side] += x.amount; });
  const fcPost = buildDuelFcPostBursts(br);
  if (fcPost.length) {
    const t0 = tEnd + RESULT_GROUP_BEAT_MS;
    const slot = { player: 0, enemy: 0 };
    const fcTicks = [];
    fcPost.forEach((b) => {
      const sl = slot[b.side]++;
      for (let i = 0; i < b.amount; i += 1) {
        fcTicks.push({ t: t0 + sl * HP_SOURCE_STAGGER_MS + HP_PROJECTILE_FLIGHT_MS + i * HP_PROJECTILE_GAP_MS, stat: 'FC', side: b.side, kind: 'gain', cause: 'aftermath', n: i + 1, total: b.amount, label: b.label, group: `fc-${b.key}`, slot: sl, origin: b.origin });
      }
    });
    fcTicks.sort((a, b) => a.t - b.t).forEach((e) => {
      const from = fcRun[e.side];
      fcRun[e.side] = from + 1;
      events.push({ ...e, from, to: from + 1 });
    });
    tEnd = Math.max(tEnd, ...fcTicks.map((e) => e.t));
  }

  // Tossine applicate a fine duello (es. Bonus «Conquista: Tossina»): proiettile dalla carta di chi
  // la applica, il segno compare all'impatto
  const toxinAppliedAt = { player: null, enemy: null };
  const postTox = (Array.isArray(br.events) ? br.events : []).filter(
    (e) => e && e.type === 'info' && e.infoCode === 'toxinApplied' && stepOfAbility(br, e) < 0 && engineSide(e.target?.side)
  );
  if (postTox.length) {
    const t0 = tEnd + RESULT_GROUP_BEAT_MS;
    const usedSlots = { player: 0, enemy: 0 };
    events.filter((e) => e.stat === 'PV').forEach((e) => { usedSlots[e.side] = Math.max(usedSlots[e.side], (e.slot ?? 0) + 1); });
    postTox.forEach((e, i) => {
      const side = engineSide(e.target.side);
      const toxin = (side === 'player' ? br.playerToxinActivated : br.enemyToxinActivated)
        || { value: toInt(e.data?.value), minHealth: toInt(e.data?.minHealth), source: e.source?.name };
      const t = t0 + i * HP_SOURCE_STAGGER_MS + HP_PROJECTILE_FLIGHT_MS;
      events.push({ t, stat: 'TOX', side, kind: 'tox', cause: 'toxinApplied', n: 1, total: 1, label: sourceLabel(e.source, br), group: `toxapply-${side}-${i}`, slot: usedSlots[side], origin: originOf(e.source), toxin });
      toxinAppliedAt[side] = { t, toxin };
      tEnd = Math.max(tEnd, t);
    });
  }

  // Tossina di fine turno sui PV finali del motore (stessa funzione di «Continua»)
  const finalHP = { player: toInt(br.finalPlayerHP, afterSteps.player), enemy: toInt(br.finalEnemyHP, afterSteps.enemy) };
  const tox = toxinsAfterDuel(br, startToxin);
  const res = applyToxin(tox.player, tox.enemy, finalHP.player, finalHP.enemy);
  const dmg = { player: finalHP.player - res.newPlayerHP, enemy: finalHP.enemy - res.newEnemyHP };
  if (dmg.player > 0 || dmg.enemy > 0) {
    const t0 = tEnd + RESULT_GROUP_BEAT_MS;
    // il numero della raffica di Tossina va sotto le altre raffiche di PV dello stesso lato
    const usedSlots = { player: 0, enemy: 0 };
    events.filter((e) => e.stat === 'PV').forEach((e) => { usedSlots[e.side] = Math.max(usedSlots[e.side], (e.slot ?? 0) + 1); });
    SIDES.forEach((side) => {
      let hp = finalHP[side];
      for (let i = 0; i < dmg[side]; i += 1) {
        events.push({ t: t0 + HP_PROJECTILE_FLIGHT_MS + i * HP_PROJECTILE_GAP_MS, stat: 'PV', side, kind: 'hit', cause: 'toxin', n: i + 1, total: dmg[side], label: 'Tossina', group: `toxin-${side}`, slot: usedSlots[side], origin: { toxin: side }, from: hp, to: hp - 1 });
        hp -= 1;
      }
    });
  }
  events.sort((a, b) => a.t - b.t);
  return {
    events,
    toxinAppliedAt,
    toxinAfterTick: { player: res.playerToxinActive, enemy: res.enemyToxinActive },
    finalHP: { player: res.newPlayerHP, enemy: res.newEnemyHP },
  };
}

/** Valore a schermo di una statistica dopo gli eventi già avvenuti all'istante `elapsedMs`. */
export function displayedStatAt(events, stat, start, elapsedMs) {
  const v = { player: toInt(start?.player), enemy: toInt(start?.enemy) };
  for (const e of events) {
    if (e.t > elapsedMs) break;
    if (e.stat === stat) v[e.side] = e.to;
  }
  return v;
}
