// ============================================
// Modificatori persistenti di slot (Maledizioni e analoghi)
// ============================================
//
// Appartengono allo slot di battaglia, non alla carta Campo. Restano se il Campo
// viene sostituito, colpiscono entrambi i lati e non sono effetti del Campo.

import { SIDES } from './eminenceConstants.js';

const BOTH_SIDES = [SIDES.PLAYER, SIDES.ENEMY];

export function cloneSlotCurses(slotCurses) {
  const source = slotCurses && typeof slotCurses === 'object' ? slotCurses : {};
  const cloned = {};
  for (const [slot, list] of Object.entries(source)) {
    cloned[slot] = Array.isArray(list) ? list.map((entry) => ({ ...entry, deltas: { ...(entry.deltas || {}) } })) : [];
  }
  return cloned;
}

export function appendSlotCurse(slotCurses, slot, curse) {
  if (slot == null || !curse) return slotCurses || {};
  const key = String(slot);
  const next = cloneSlotCurses(slotCurses);
  next[key] = [...(next[key] || []), {
    deltas: { ...(curse.deltas || {}) },
    leagueScaled: Boolean(curse.leagueScaled),
    source: curse.source ?? null,
  }];
  return next;
}

export function mergeSlotCurseCounts(...maps) {
  const counts = {};
  for (const map of maps) {
    for (const [slot, list] of Object.entries(map || {})) {
      counts[slot] = (counts[slot] || 0) + (Array.isArray(list) ? list.length : 0);
    }
  }
  return counts;
}

export function collectSlotCurses(matchState, slot) {
  if (slot == null) return [];
  const key = String(slot);
  const collected = [];
  for (const side of BOTH_SIDES) {
    const list = matchState?.[side]?.persistent?.slotCurses?.[key];
    if (Array.isArray(list)) collected.push(...list);
  }
  return collected;
}

export function slotCurseStatDelta(curse, league = 0) {
  const deltas = curse?.deltas || {};
  const assault = (deltas.assaultValue || 0) + (curse?.leagueScaled ? -Math.max(0, league) : 0);
  return {
    power: deltas.power || 0,
    damage: deltas.damage || 0,
    assaultValue: assault,
  };
}

export function createEmptySlotCurseStatDeltas() {
  return {
    player: { power: 0, damage: 0, assaultMod: 0 },
    enemy: { power: 0, damage: 0, assaultMod: 0 },
  };
}

/** Applica le maledizioni dello slot al duello, dopo il velo Campo. */
export function applySlotCursesToDuel(duel, curses, leagues = {}, slotCurseStatDeltas = null) {
  if (!duel || !Array.isArray(curses) || !curses.length) return duel;
  for (const curse of curses) {
    const player = slotCurseStatDelta(curse, leagues.player || 0);
    const enemy = slotCurseStatDelta(curse, leagues.enemy || 0);
    duel.pPower += player.power;
    duel.pDamage += player.damage;
    duel.pAssaultMod += player.assaultValue;
    duel.ePower += enemy.power;
    duel.eDamage += enemy.damage;
    duel.eAssaultMod += enemy.assaultValue;
    if (slotCurseStatDeltas) {
      slotCurseStatDeltas.player.power += player.power;
      slotCurseStatDeltas.player.damage += player.damage;
      slotCurseStatDeltas.player.assaultMod += player.assaultValue;
      slotCurseStatDeltas.enemy.power += enemy.power;
      slotCurseStatDeltas.enemy.damage += enemy.damage;
      slotCurseStatDeltas.enemy.assaultMod += enemy.assaultValue;
    }
  }
  return duel;
}
