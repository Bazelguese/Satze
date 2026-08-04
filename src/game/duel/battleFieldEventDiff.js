/**
 * Emit structured events from field setup / aftermath by observing value diffs.
 * Does not change game rules; only records already-applied results.
 */

import {
  BATTLE_PHASES,
  BATTLE_REVEAL_AT,
  BATTLE_STATS,
  emitFieldRule,
  emitResourceChange,
  emitStatChange,
  fieldSource,
  makeAgentTarget,
  makePlayerTarget,
} from './battleEventEmit.js';

function hasEmitter(log) {
  return log && typeof log.emit === 'function';
}

function emitAgentStatDiff(log, field, agent, engineSide, stat, before, after, revealAt = BATTLE_REVEAL_AT.abilityFx) {
  if (before === after) return;
  emitStatChange(log, {
    phase: BATTLE_PHASES.effects,
    revealAt,
    source: fieldSource(field),
    target: makeAgentTarget(engineSide, agent),
    stat,
    before,
    after,
  });
}

function emitPlayerResourceDiff(log, field, engineSide, stat, before, after) {
  if (before === after) return;
  emitResourceChange(log, {
    phase: BATTLE_PHASES.post,
    revealAt: BATTLE_REVEAL_AT.postFx,
    source: fieldSource(field),
    target: makePlayerTarget(engineSide),
    stat,
    before,
    after,
  });
}

/** Snapshot of duel mutable stats relevant to field setup. */
export function snapshotDuelFieldStats(duel) {
  return {
    pPower: duel.pPower,
    ePower: duel.ePower,
    pDamage: duel.pDamage,
    eDamage: duel.eDamage,
    pFocusUsed: duel.pFocusUsed,
    eFocusUsed: duel.eFocusUsed,
    pAssaultMod: duel.pAssaultMod,
    eAssaultMod: duel.eAssaultMod,
    pImmune: duel.pImmune,
    eImmune: duel.eImmune,
  };
}

/**
 * After applyDuelFieldSetup, emit atomic stat/resource/rule events from diffs + flags.
 */
export function emitDuelFieldSetupEvents(log, field, pAgent, eAgent, before, after, flags = {}) {
  if (!hasEmitter(log) || !field) return;

  const src = fieldSource(field);

  emitAgentStatDiff(log, field, pAgent, 'player', BATTLE_STATS.POT, before.pPower, after.pPower);
  emitAgentStatDiff(log, field, eAgent, 'enemy', BATTLE_STATS.POT, before.ePower, after.ePower);
  emitAgentStatDiff(log, field, pAgent, 'player', BATTLE_STATS.DAN, before.pDamage, after.pDamage);
  emitAgentStatDiff(log, field, eAgent, 'enemy', BATTLE_STATS.DAN, before.eDamage, after.eDamage);
  emitAgentStatDiff(log, field, pAgent, 'player', BATTLE_STATS.VA, before.pAssaultMod, after.pAssaultMod);
  emitAgentStatDiff(log, field, eAgent, 'enemy', BATTLE_STATS.VA, before.eAssaultMod, after.eAssaultMod);

  // FC invested capped by field (affects focus used this duel)
  if (before.pFocusUsed !== after.pFocusUsed) {
    emitStatChange(log, {
      phase: BATTLE_PHASES.focus,
      revealAt: BATTLE_REVEAL_AT.focusFx,
      source: src,
      target: makePlayerTarget('player'),
      stat: BATTLE_STATS.FC,
      before: before.pFocusUsed,
      after: after.pFocusUsed,
    });
  }
  if (before.eFocusUsed !== after.eFocusUsed) {
    emitStatChange(log, {
      phase: BATTLE_PHASES.focus,
      revealAt: BATTLE_REVEAL_AT.focusFx,
      source: src,
      target: makePlayerTarget('enemy'),
      stat: BATTLE_STATS.FC,
      before: before.eFocusUsed,
      after: after.eFocusUsed,
    });
  }

  const rules = [];
  if (flags.immuneDisabled) rules.push({ ruleCode: 'immuneDisabled', params: null });
  if (flags.forceBothImmune) rules.push({ ruleCode: 'forceBothImmune', params: null });
  if (flags.blockDisabled) rules.push({ ruleCode: 'blockDisabled', params: null });
  if (flags.copyDisabled) rules.push({ ruleCode: 'copyDisabled', params: null });
  if (flags.directDamageDisabled) rules.push({ ruleCode: 'directDamageDisabled', params: null });
  if (flags.modifiersDisabled) rules.push({ ruleCode: 'modifiersDisabled', params: null });
  if (flags.maxDamage != null) rules.push({ ruleCode: 'maxDamage', params: { maxDamage: flags.maxDamage } });
  if (flags.maxFC != null) rules.push({ ruleCode: 'maxFC', params: { maxFC: flags.maxFC } });
  if (flags.maxFCByLeague) rules.push({ ruleCode: 'maxFCByLeague', params: null });
  if (flags.triggersIgnored) rules.push({ ruleCode: 'triggersIgnored', params: null });
  if (flags.conquestDouble) rules.push({ ruleCode: 'conquestDouble', params: null });
  if (flags.lastWishDouble) rules.push({ ruleCode: 'lastWishDouble', params: null });
  if (flags.focusHalvedInVa) rules.push({ ruleCode: 'focusHalvedInVa', params: null });
  if (flags.winnerByFocusNotVa) rules.push({ ruleCode: 'winnerByFocusNotVa', params: null });
  if (flags.winnerByFinalPowerThenVa) rules.push({ ruleCode: 'winnerByFinalPowerThenVa', params: null });
  if (flags.winnerByFinalDamageThenVa) rules.push({ ruleCode: 'winnerByFinalDamageThenVa', params: null });
  if (flags.vaModifiersDouble) rules.push({ ruleCode: 'vaModifiersDouble', params: null });
  if (flags.positivePowerModifiersDisabled) {
    rules.push({ ruleCode: 'positivePowerModifiersDisabled', params: null });
  }
  if (flags.positiveDamageModifiersDisabled) {
    rules.push({ ruleCode: 'positiveDamageModifiersDisabled', params: null });
  }
  if (flags.clampPowerDamageToBasePlusMinus2) {
    rules.push({ ruleCode: 'clampPowerDamageToBasePlusMinus2', params: null });
  }
  if (flags.maxFinalPower != null) {
    rules.push({ ruleCode: 'maxFinalPower', params: { maxFinalPower: flags.maxFinalPower } });
  }

  for (const rule of rules) {
    emitFieldRule(log, {
      phase: BATTLE_PHASES.effects,
      revealAt: BATTLE_REVEAL_AT.abilityFx,
      source: src,
      ruleCode: rule.ruleCode,
      params: rule.params,
    });
  }
}

export function emitAftermathResourceEvents(log, field, before, after) {
  if (!hasEmitter(log) || !field) return;
  emitPlayerResourceDiff(log, field, 'player', BATTLE_STATS.PV, before.pHP, after.pHP);
  emitPlayerResourceDiff(log, field, 'enemy', BATTLE_STATS.PV, before.eHP, after.eHP);
  emitPlayerResourceDiff(log, field, 'player', BATTLE_STATS.FC, before.pFC, after.pFC);
  emitPlayerResourceDiff(log, field, 'enemy', BATTLE_STATS.FC, before.eFC, after.eFC);
}
