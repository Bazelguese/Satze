// Stato visivo carte duello da battleResult + fase UI (stat progressive, highlight per step).

import { ARMY_BONUSES } from '../../data/armies.js';
import {
  getPreVaStepIndex,
  getPostStepsStartIndex,
  buildAssaultModProgression,
  countAssaultModProgressionLines,
} from '../../game/duel/duelVisualSteps.js';

const POST_DUEL_TRIGGERS = new Set(['conquest', 'lastWish']);

function fallbackSteps(battleResult) {
  if (!battleResult?.playerAgent || !battleResult?.enemyAgent) return [];
  const p = battleResult.playerAgent;
  const e = battleResult.enemyAgent;
  const preVa = {
    kind: 'preVa',
    side: null,
    playerPower: battleResult.playerPowerAfterEffects ?? battleResult.playerPower,
    enemyPower: battleResult.enemyPowerAfterEffects ?? battleResult.enemyPower,
    playerDamage: battleResult.playerDamage,
    enemyDamage: battleResult.enemyDamage,
    playerAssaultMod: battleResult.playerAssaultMod ?? 0,
    enemyAssaultMod: battleResult.enemyAssaultMod ?? 0,
    highlightPlayerAbility: false,
    highlightEnemyAbility: false,
    highlightPlayerBonus: false,
    highlightEnemyBonus: false,
  };
  return [
    {
      kind: 'deploy',
      side: null,
      playerPower: p.power,
      enemyPower: e.power,
      playerDamage: p.damage,
      enemyDamage: e.damage,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
    {
      kind: 'fallback',
      side: null,
      playerPower: preVa.playerPower,
      enemyPower: preVa.enemyPower,
      playerDamage: preVa.playerDamage,
      enemyDamage: preVa.enemyDamage,
      playerAssaultMod: preVa.playerAssaultMod,
      enemyAssaultMod: preVa.enemyAssaultMod,
      highlightPlayerAbility: Boolean(battleResult.playerAbilityTriggered),
      highlightEnemyAbility: Boolean(battleResult.enemyAbilityTriggered),
      highlightPlayerBonus: Boolean(battleResult.playerHasBonus && !battleResult.playerBonusBlocked),
      highlightEnemyBonus: Boolean(battleResult.enemyHasBonus && !battleResult.enemyBonusBlocked),
    },
    preVa,
  ];
}

function resolveStepIndex(duelPhase, duelEffectStep, steps) {
  if (steps.length <= 0) return 0;
  const preVaIdx = getPreVaStepIndex(steps);
  const postStart = getPostStepsStartIndex(steps);
  const hasPreVa = preVaIdx >= 0;
  const preVaOrLast = hasPreVa ? preVaIdx : steps.length - 1;
  const postCount = hasPreVa ? steps.length - postStart : 0;

  if (duelPhase <= 0) return 0;
  if (duelPhase === 1) {
    const maxIdx = hasPreVa ? preVaIdx - 1 : steps.length - 1;
    return Math.min(Math.max(1, duelEffectStep), Math.max(1, maxIdx));
  }
  if (duelPhase >= 2 && duelPhase <= 4) return preVaOrLast;
  if (duelPhase === 5 && postCount > 0) {
    return Math.min(postStart + Math.max(1, duelEffectStep) - 1, steps.length - 1);
  }
  if (duelPhase >= 5) return steps.length - 1;
  return preVaOrLast;
}

function findFirstCopyStep(steps, kind, side) {
  for (let i = 1; i < steps.length; i += 1) {
    if (steps[i].kind === kind && steps[i].side === side) return i;
  }
  return -1;
}

function findFirstAbilityTriggerStep(steps, isPlayer, { postOnly = false, preOnly = false } = {}) {
  const preVaIdx = getPreVaStepIndex(steps);
  const postStart = getPostStepsStartIndex(steps);
  for (let i = 1; i < steps.length; i += 1) {
    if (preOnly && preVaIdx >= 0 && i >= preVaIdx) break;
    if (postOnly && preVaIdx >= 0 && i < postStart) continue;
    if (steps[i].kind === 'copyAbility') continue;
    const lit = isPlayer ? steps[i].highlightPlayerAbility : steps[i].highlightEnemyAbility;
    if (lit) return i;
  }
  return -1;
}

function findFirstBonusTriggerStep(steps, isPlayer, { postOnly = false, preOnly = false } = {}) {
  const preVaIdx = getPreVaStepIndex(steps);
  const postStart = getPostStepsStartIndex(steps);
  for (let i = 1; i < steps.length; i += 1) {
    if (preOnly && preVaIdx >= 0 && i >= preVaIdx) break;
    if (postOnly && preVaIdx >= 0 && i < postStart) continue;
    if (steps[i].kind === 'copyBonus') continue;
    const lit = isPlayer ? steps[i].highlightPlayerBonus : steps[i].highlightEnemyBonus;
    if (lit) return i;
  }
  return -1;
}

function findFirstStep(steps, predicate) {
  for (let i = 1; i < steps.length; i += 1) {
    if (predicate(steps[i], i)) return i;
  }
  return -1;
}

/** Step in cui il potere risulta bloccato (animazione vittima). */
function findAbilityBlockedRevealStep(steps, isPlayer) {
  const victimSide = isPlayer ? 'player' : 'enemy';
  const powerBlocked = findFirstStep(
    steps,
    (s) =>
      (s.kind === 'powerBlocked' || s.kind === 'postPowerBlocked') && s.side === victimSide
  );
  if (powerBlocked >= 0) return powerBlocked;

  const blockerSide = isPlayer ? 'enemy' : 'player';
  return findFirstStep(steps, (s) => s.kind === 'block' && s.side === blockerSide);
}

/** Step in cui il bonus armata risulta bloccato (prescan blockBonus). */
function findBonusBlockedRevealStep(steps, isPlayer) {
  const blockerSide = isPlayer ? 'enemy' : 'player';
  return findFirstStep(steps, (s) => s.kind === 'block' && s.side === blockerSide);
}

function timelineFlagVisible(duelPhase, stepIndex, revealStep, isSet) {
  if (!isSet) return false;
  if (duelPhase >= 2) return true;
  if (duelPhase < 1) return false;
  if (revealStep < 0) return false;
  return stepIndex >= revealStep;
}

/** Ultimo step pre-VA in cui il layer (potere/bonus) di un lato è stato valutato. */
function findLayerEvaluationStep(steps, isPlayer, layer) {
  const side = isPlayer ? 'player' : 'enemy';
  const preVaIdx = getPreVaStepIndex(steps);
  const end = preVaIdx >= 0 ? preVaIdx : steps.length - 1;
  const abilityKinds = new Set(['power', 'powerBlocked', 'inversion', 'copyAbility', 'block']);
  const bonusKinds = new Set(['bonus', 'copyBonus']);

  if (layer === 'ability') {
    const direct = findFirstStep(
      steps,
      (s) => s.side === side && abilityKinds.has(s.kind)
    );
    if (direct >= 0) return direct;

    let lastAnyAbility = -1;
    for (let i = 1; i <= end; i += 1) {
      if (abilityKinds.has(steps[i].kind)) lastAnyAbility = i;
    }
    if (lastAnyAbility >= 0) return lastAnyAbility;

    const firstBonus = findFirstStep(steps, (s) => bonusKinds.has(s.kind));
    if (firstBonus >= 0) return Math.max(1, firstBonus - 1);
    return Math.max(1, end);
  }

  const direct = findFirstStep(
    steps,
    (s) => s.side === side && bonusKinds.has(s.kind)
  );
  if (direct >= 0) return direct;
  return Math.max(1, end);
}

function findBlockedAbilityHighlightStep(steps, isPlayer) {
  const victimSide = isPlayer ? 'player' : 'enemy';
  return findFirstStep(
    steps,
    (s) =>
      (s.kind === 'powerBlocked' || s.kind === 'postPowerBlocked') && s.side === victimSide
  );
}

function blockedVisibleAtStep(duelPhase, stepIndex, revealStep, isBlocked) {
  return timelineFlagVisible(duelPhase, stepIndex, revealStep, isBlocked);
}

function copiedContentVisible(steps, stepIndex, copyStepIdx, hasCopied) {
  if (!hasCopied) return false;
  if (copyStepIdx < 0) return stepIndex >= 1;
  return stepIndex >= copyStepIdx;
}

function isPostDuelAbility(ability) {
  return Boolean(ability?.trigger && POST_DUEL_TRIGGERS.has(ability.trigger));
}

function isPostDuelBonus(bonusDef) {
  return Boolean(bonusDef?.trigger && POST_DUEL_TRIGGERS.has(bonusDef.trigger));
}

/**
 * @returns {{
 *   playerPower: number,
 *   enemyPower: number,
 *   playerDamage: number,
 *   enemyDamage: number,
 *   activeSide: 'player'|'enemy'|null,
 *   highlightPlayerAbility: boolean,
 *   highlightEnemyAbility: boolean,
 *   highlightPlayerBonus: boolean,
 *   highlightEnemyBonus: boolean,
 *   showOperators: boolean,
 * }}
 */
export function getDuelVisualDisplay(battleResult, duelPhase, duelEffectStep = 1) {
  const steps = battleResult?.visualSteps?.length
    ? battleResult.visualSteps
    : fallbackSteps(battleResult);
  const stepIndex = resolveStepIndex(duelPhase, duelEffectStep, steps);
  const step = steps[stepIndex] ?? steps[0];
  const preVaIdx = getPreVaStepIndex(steps);
  const postStart = getPostStepsStartIndex(steps);
  const postCount = preVaIdx >= 0 ? steps.length - postStart : 0;

  const atFinalPostStep =
    duelPhase >= 5 && (postCount === 0 || stepIndex >= steps.length - 1);
  const useFinalStats = duelPhase >= 5 && atFinalPostStep;

  const playerPower = useFinalStats ? battleResult.playerPower : step.playerPower;
  const enemyPower = useFinalStats ? battleResult.enemyPower : step.enemyPower;
  const playerDamage = useFinalStats ? battleResult.playerDamage : step.playerDamage;
  const enemyDamage = useFinalStats ? battleResult.enemyDamage : step.enemyDamage;

  const playerAbility = battleResult.playerAbilityCopied || battleResult.playerAgent?.ability;
  const enemyAbility = battleResult.enemyAbilityCopied || battleResult.enemyAgent?.ability;
  const playerBonusDef =
    battleResult.playerBonusCopied ||
    (battleResult.playerAgent?.army ? ARMY_BONUSES[battleResult.playerAgent.army] : null);
  const enemyBonusDef =
    battleResult.enemyBonusCopied ||
    (battleResult.enemyAgent?.army ? ARMY_BONUSES[battleResult.enemyAgent.army] : null);

  const playerAbilityFirstPre = findFirstAbilityTriggerStep(steps, true, { preOnly: true });
  const enemyAbilityFirstPre = findFirstAbilityTriggerStep(steps, false, { preOnly: true });
  const playerBonusFirstPre = findFirstBonusTriggerStep(steps, true, { preOnly: true });
  const enemyBonusFirstPre = findFirstBonusTriggerStep(steps, false, { preOnly: true });
  const playerAbilityFirstPost = findFirstAbilityTriggerStep(steps, true, { postOnly: true });
  const enemyAbilityFirstPost = findFirstAbilityTriggerStep(steps, false, { postOnly: true });
  const playerBonusFirstPost = findFirstBonusTriggerStep(steps, true, { postOnly: true });
  const enemyBonusFirstPost = findFirstBonusTriggerStep(steps, false, { postOnly: true });

  const playerCopyAbilityStep = findFirstCopyStep(steps, 'copyAbility', 'player');
  const enemyCopyAbilityStep = findFirstCopyStep(steps, 'copyAbility', 'enemy');
  const playerCopyBonusStep = findFirstCopyStep(steps, 'copyBonus', 'player');
  const enemyCopyBonusStep = findFirstCopyStep(steps, 'copyBonus', 'enemy');

  const playerAbilityBlockedReveal = findAbilityBlockedRevealStep(steps, true);
  const enemyAbilityBlockedReveal = findAbilityBlockedRevealStep(steps, false);
  const playerBonusBlockedReveal = findBonusBlockedRevealStep(steps, true);
  const enemyBonusBlockedReveal = findBonusBlockedRevealStep(steps, false);
  const playerAbilityEvalStep = findLayerEvaluationStep(steps, true, 'ability');
  const enemyAbilityEvalStep = findLayerEvaluationStep(steps, false, 'ability');
  const playerBonusEvalStep = findLayerEvaluationStep(steps, true, 'bonus');
  const enemyBonusEvalStep = findLayerEvaluationStep(steps, false, 'bonus');

  const pastStep = stepIndex;

  const showPlayerAbilityBlocked = blockedVisibleAtStep(
    duelPhase,
    pastStep,
    playerAbilityBlockedReveal,
    Boolean(battleResult.playerAbilityBlocked)
  );
  const showEnemyAbilityBlocked = blockedVisibleAtStep(
    duelPhase,
    pastStep,
    enemyAbilityBlockedReveal,
    Boolean(battleResult.enemyAbilityBlocked)
  );
  const showPlayerBonusBlocked = blockedVisibleAtStep(
    duelPhase,
    pastStep,
    playerBonusBlockedReveal,
    Boolean(battleResult.playerBonusBlocked)
  );
  const showEnemyBonusBlocked = blockedVisibleAtStep(
    duelPhase,
    pastStep,
    enemyBonusBlockedReveal,
    Boolean(battleResult.enemyBonusBlocked)
  );

  function copiedPostLayerLit(isPlayer, kind) {
    const first =
      kind === 'ability'
        ? isPlayer
          ? playerAbilityFirstPost
          : enemyAbilityFirstPost
        : isPlayer
          ? playerBonusFirstPost
          : enemyBonusFirstPost;
    if (first < 0 || duelPhase < 5 || pastStep < first) return false;
    const stepAtFirst = steps[first];
    if (!stepAtFirst) return false;
    return kind === 'ability'
      ? isPlayer
        ? Boolean(stepAtFirst.highlightPlayerAbility)
        : Boolean(stepAtFirst.highlightEnemyAbility)
      : isPlayer
        ? Boolean(stepAtFirst.highlightPlayerBonus)
        : Boolean(stepAtFirst.highlightEnemyBonus);
  }

  function copiedLayerLit(isPlayer, kind) {
    const copiedAbility = isPlayer ? battleResult.playerAbilityCopied : battleResult.enemyAbilityCopied;
    const copiedBonus = isPlayer ? battleResult.playerBonusCopied : battleResult.enemyBonusCopied;
    const copied = kind === 'ability' ? copiedAbility : copiedBonus;
    const copyStep =
      kind === 'ability'
        ? isPlayer
          ? playerCopyAbilityStep
          : enemyCopyAbilityStep
        : isPlayer
          ? playerCopyBonusStep
          : enemyCopyBonusStep;
    if (!copied || !copiedContentVisible(steps, stepIndex, copyStep, true)) return null;

    const isPostDuel =
      kind === 'ability' ? isPostDuelAbility(copied) : isPostDuelBonus(copied);
    if (isPostDuel) return copiedPostLayerLit(isPlayer, kind);

    const notTriggered =
      kind === 'ability'
        ? isPlayer
          ? battleResult.playerCopiedAbilityNotTriggered
          : battleResult.enemyCopiedAbilityNotTriggered
        : isPlayer
          ? battleResult.playerCopiedBonusNotTriggered
          : battleResult.enemyCopiedBonusNotTriggered;
    if (notTriggered) return false;
    if (duelPhase < 1 || pastStep < copyStep) return false;

    const first =
      kind === 'ability'
        ? isPlayer
          ? playerAbilityFirstPre
          : enemyAbilityFirstPre
        : isPlayer
          ? playerBonusFirstPre
          : enemyBonusFirstPre;
    if (first < 0) return true;
    return pastStep >= first;
  }

  function copiedContentInactiveDisplay(isPlayer, kind) {
    const copiedAbility = isPlayer ? battleResult.playerAbilityCopied : battleResult.enemyAbilityCopied;
    const copiedBonus = isPlayer ? battleResult.playerBonusCopied : battleResult.enemyBonusCopied;
    const copied = kind === 'ability' ? copiedAbility : copiedBonus;
    const copyStep =
      kind === 'ability'
        ? isPlayer
          ? playerCopyAbilityStep
          : enemyCopyAbilityStep
        : isPlayer
          ? playerCopyBonusStep
          : enemyCopyBonusStep;
    if (!copied || !copiedContentVisible(steps, stepIndex, copyStep, true)) return false;

    const isPostDuel =
      kind === 'ability' ? isPostDuelAbility(copied) : isPostDuelBonus(copied);
    if (isPostDuel) {
      if (duelPhase < 5) return false;
      return !copiedPostLayerLit(isPlayer, kind);
    }

    const notTriggered =
      kind === 'ability'
        ? isPlayer
          ? battleResult.playerCopiedAbilityNotTriggered
          : battleResult.enemyCopiedAbilityNotTriggered
        : isPlayer
          ? battleResult.playerCopiedBonusNotTriggered
          : battleResult.enemyCopiedBonusNotTriggered;
    return Boolean(notTriggered);
  }

  function abilityLit(isPlayer) {
    const copiedLit = copiedLayerLit(isPlayer, 'ability');
    if (copiedLit !== null) return copiedLit;

    const blockedFinal = isPlayer
      ? battleResult.playerAbilityBlocked
      : battleResult.enemyAbilityBlocked;
    const blockedVisible = isPlayer ? showPlayerAbilityBlocked : showEnemyAbilityBlocked;

    if (blockedFinal && blockedVisible) {
      const blockedStep = findBlockedAbilityHighlightStep(steps, isPlayer);
      if (blockedStep >= 0 && duelPhase >= 1 && pastStep >= blockedStep) return true;
      return false;
    }
    if (blockedFinal && !blockedVisible) return false;

    const triggered = isPlayer
      ? battleResult.playerAbilityTriggered
      : battleResult.enemyAbilityTriggered;
    if (!triggered) return false;
    const ability = isPlayer ? playerAbility : enemyAbility;
    if (isPostDuelAbility(ability)) {
      if (duelPhase < 5) return false;
      const first = isPlayer ? playerAbilityFirstPost : enemyAbilityFirstPost;
      if (first < 0) return duelPhase >= 5 && postCount === 0;
      return pastStep >= first;
    }
    if (duelPhase < 1) return false;
    const first = isPlayer ? playerAbilityFirstPre : enemyAbilityFirstPre;
    if (first < 0) return duelPhase >= 1;
    return pastStep >= first;
  }

  function bonusLit(isPlayer) {
    const copiedLit = copiedLayerLit(isPlayer, 'bonus');
    if (copiedLit !== null) return copiedLit;

    const hasBonus = isPlayer ? battleResult.playerHasBonus : battleResult.enemyHasBonus;
    if (!hasBonus) return false;

    const blockedVisible = isPlayer ? showPlayerBonusBlocked : showEnemyBonusBlocked;
    const blockedFinal = isPlayer
      ? battleResult.playerBonusBlocked
      : battleResult.enemyBonusBlocked;
    if (blockedFinal && blockedVisible) return false;
    if (blockedFinal && !blockedVisible) return false;

    const bonusDef = isPlayer ? playerBonusDef : enemyBonusDef;
    if (isPostDuelBonus(bonusDef)) {
      if (duelPhase < 5) return false;
      const first = isPlayer ? playerBonusFirstPost : enemyBonusFirstPost;
      if (first < 0) return duelPhase >= 5 && postCount === 0;
      return pastStep >= first;
    }
    if (duelPhase < 1) return false;
    const first = isPlayer ? playerBonusFirstPre : enemyBonusFirstPre;
    if (first < 0) return duelPhase >= 1;
    return pastStep >= first;
  }

  function bonusActiveVisible(isPlayer) {
    const hasBonus = isPlayer
      ? (battleResult.playerArmyBonusActive ?? battleResult.playerHasBonus)
      : (battleResult.enemyArmyBonusActive ?? battleResult.enemyHasBonus);
    if (!hasBonus) return false;
    const blockedVisible = isPlayer ? showPlayerBonusBlocked : showEnemyBonusBlocked;
    if (blockedVisible) return false;
    const notTriggered = isPlayer
      ? battleResult.playerBonusNotTriggered
      : battleResult.enemyBonusNotTriggered;
    if (notTriggered) return false;
    const evalStep = isPlayer ? playerBonusEvalStep : enemyBonusEvalStep;
    return timelineFlagVisible(duelPhase, pastStep, evalStep, true);
  }

  const activeSide =
    duelPhase === 1 || (duelPhase === 5 && postCount > 0) ? step.side ?? null : null;

  return {
    playerPower,
    enemyPower,
    playerDamage,
    enemyDamage,
    activeSide,
    highlightPlayerAbility: abilityLit(true),
    highlightEnemyAbility: abilityLit(false),
    highlightPlayerBonus: bonusLit(true),
    highlightEnemyBonus: bonusLit(false),
    showOperators: duelPhase >= 1,
    pulsePlayerSide: (duelPhase === 1 || duelPhase === 5) && step.side === 'player',
    pulseEnemySide: (duelPhase === 1 || duelPhase === 5) && step.side === 'enemy',
    visualStepKind: step.kind ?? null,
    visualStepIndex: stepIndex,
    copyPlayerAbilityAnim: step.kind === 'copyAbility' && step.side === 'player',
    copyEnemyAbilityAnim: step.kind === 'copyAbility' && step.side === 'enemy',
    copyPlayerBonusAnim: step.kind === 'copyBonus' && step.side === 'player',
    copyEnemyBonusAnim: step.kind === 'copyBonus' && step.side === 'enemy',
    showPlayerCopiedAbility: copiedContentVisible(
      steps,
      stepIndex,
      playerCopyAbilityStep,
      Boolean(battleResult.playerAbilityCopied)
    ),
    showEnemyCopiedAbility: copiedContentVisible(
      steps,
      stepIndex,
      enemyCopyAbilityStep,
      Boolean(battleResult.enemyAbilityCopied)
    ),
    showPlayerCopiedAbilityNotTriggered: copiedContentInactiveDisplay(true, 'ability'),
    showEnemyCopiedAbilityNotTriggered: copiedContentInactiveDisplay(false, 'ability'),
    showPlayerCopiedBonus: copiedContentVisible(
      steps,
      stepIndex,
      playerCopyBonusStep,
      Boolean(battleResult.playerBonusCopied)
    ),
    showEnemyCopiedBonus: copiedContentVisible(
      steps,
      stepIndex,
      enemyCopyBonusStep,
      Boolean(battleResult.enemyBonusCopied)
    ),
    showPlayerCopiedBonusNotTriggered: copiedContentInactiveDisplay(true, 'bonus'),
    showEnemyCopiedBonusNotTriggered: copiedContentInactiveDisplay(false, 'bonus'),
    showPlayerAbilityBlocked,
    showEnemyAbilityBlocked,
    showPlayerBonusBlocked,
    showEnemyBonusBlocked,
    showPlayerAbilityNotTriggered: timelineFlagVisible(
      duelPhase,
      pastStep,
      playerAbilityEvalStep,
      Boolean(battleResult.playerAbilityNotTriggered)
    ),
    showEnemyAbilityNotTriggered: timelineFlagVisible(
      duelPhase,
      pastStep,
      enemyAbilityEvalStep,
      Boolean(battleResult.enemyAbilityNotTriggered)
    ),
    showPlayerBonusNotTriggered: timelineFlagVisible(
      duelPhase,
      pastStep,
      playerBonusEvalStep,
      Boolean(battleResult.playerBonusNotTriggered)
    ),
    showEnemyBonusNotTriggered: timelineFlagVisible(
      duelPhase,
      pastStep,
      enemyBonusEvalStep,
      Boolean(battleResult.enemyBonusNotTriggered)
    ),
    showPlayerBonusActive: bonusActiveVisible(true),
    showEnemyBonusActive: bonusActiveVisible(false),
    showPlayerAbilityValue: abilityLit(true) || showPlayerAbilityBlocked || duelPhase >= 2,
    showEnemyAbilityValue: abilityLit(false) || showEnemyAbilityBlocked || duelPhase >= 2,
  };
}

/** POT mostrato nel blocco POT×FC (post-effetti pre-VA). */
export function getDuelFocusPhasePower(battleResult, isPlayer) {
  const preVaStep = getPreVaVisualStepFromResult(battleResult);
  if (preVaStep) {
    return isPlayer ? preVaStep.playerPower : preVaStep.enemyPower;
  }
  return isPlayer
    ? (battleResult?.playerPowerAfterEffects ?? battleResult?.playerPower)
    : (battleResult?.enemyPowerAfterEffects ?? battleResult?.enemyPower);
}

function getPreVaVisualStepFromResult(battleResult) {
  const steps = battleResult?.visualSteps;
  if (!steps?.length) return null;
  const idx = getPreVaStepIndex(steps);
  if (idx >= 0) return steps[idx];
  return steps[steps.length - 1];
}

export function modifiedStatOrNull(base, current) {
  if (current == null || base == null) return null;
  return current !== base ? current : null;
}

/** Righe mod VA incrementali per fase 3 (da visualSteps). */
export function buildVaModProgressionLines(battleResult, isPlayer) {
  if (!battleResult?.visualSteps?.length) return [];
  const focus = isPlayer ? battleResult.playerFocusUsed ?? 0 : battleResult.enemyFocusUsed ?? 0;
  return buildAssaultModProgression(battleResult.visualSteps, isPlayer, focus);
}

export function countVaPhase3ModLines(battleResult, isPlayer) {
  return countAssaultModProgressionLines(battleResult?.visualSteps, isPlayer);
}
