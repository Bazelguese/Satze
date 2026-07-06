// Snapshot stat e highlight per animazione duello (ordine motore: iniziativa, poteri, bonus, post-duello).

function sideAbilityHighlight(side) {
  return side === 'player'
    ? { highlightPlayerAbility: true, highlightEnemyAbility: false }
    : { highlightPlayerAbility: false, highlightEnemyAbility: true };
}

function sideBonusHighlight(side) {
  return side === 'player'
    ? { highlightPlayerBonus: true, highlightEnemyBonus: false }
    : { highlightPlayerBonus: false, highlightEnemyBonus: true };
}

function readStats(state) {
  return {
    playerPower: state.pPower,
    enemyPower: state.ePower,
    playerDamage: state.pDamage,
    enemyDamage: state.eDamage,
    playerAssaultMod: state.pAssaultMod ?? 0,
    enemyAssaultMod: state.eAssaultMod ?? 0,
  };
}

function noHighlights() {
  return {
    highlightPlayerAbility: false,
    highlightEnemyAbility: false,
    highlightPlayerBonus: false,
    highlightEnemyBonus: false,
  };
}

const POST_KINDS = new Set(['postPower', 'postBonus', 'postPowerBlocked']);

/**
 * @param {object} pAgent
 * @param {object} eAgent
 */
export function createDuelVisualRecorder(pAgent, eAgent) {
  const steps = [
    {
      kind: 'deploy',
      side: null,
      playerPower: pAgent.power,
      enemyPower: eAgent.power,
      playerDamage: pAgent.damage,
      enemyDamage: eAgent.damage,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      ...noHighlights(),
    },
  ];

  function push(kind, side, state, highlights) {
    steps.push({
      kind,
      side: side ?? null,
      ...readStats(state),
      ...noHighlights(),
      ...highlights,
    });
  }

  return {
    steps,
    readStats: (state) => readStats(state),
    /** Stat da campo prima dei poteri (se diverse dallo schieramento). */
    pushFieldSetup(state) {
      push('fieldSetup', null, state, noHighlights());
    },
    pushBlock(side, state) {
      push('block', side, state, sideAbilityHighlight(side));
    },
    pushInversion(side, state) {
      push('inversion', side, state, sideAbilityHighlight(side));
    },
    pushPower(side, state) {
      push('power', side, state, sideAbilityHighlight(side));
    },
    pushPowerBlocked(side, state) {
      push('powerBlocked', side, state, sideAbilityHighlight(side));
    },
    pushBonus(side, state) {
      push('bonus', side, state, sideBonusHighlight(side));
    },
    pushField(state) {
      push('field', null, state, noHighlights());
    },
    pushCopyAbility(side, state) {
      push('copyAbility', side, state, noHighlights());
    },
    pushCopyBonus(side, state) {
      push('copyBonus', side, state, sideBonusHighlight(side));
    },
    /** Congela stat pre-VA (dopo poteri/bonus/overdrive campo). */
    pushPreVa(state) {
      push('preVa', null, state, noHighlights());
    },
    pushPostPower(side, state) {
      push('postPower', side, state, sideAbilityHighlight(side));
    },
    pushPostPowerBlocked(side, state) {
      push('postPowerBlocked', side, state, sideAbilityHighlight(side));
    },
    pushPostBonus(side, state) {
      push('postBonus', side, state, sideBonusHighlight(side));
    },
    /** Allinea mod VA iniziali (es. da setup campo) allo step deploy. */
    syncDeployAssaultMods(state) {
      const stats = readStats(state);
      steps[0].playerAssaultMod = stats.playerAssaultMod;
      steps[0].enemyAssaultMod = stats.enemyAssaultMod;
    },
  };
}

export function getPreVaStepIndex(visualSteps) {
  if (!visualSteps?.length) return -1;
  return visualSteps.findIndex((s) => s.kind === 'preVa');
}

export function getPostStepsStartIndex(visualSteps) {
  const preVa = getPreVaStepIndex(visualSteps);
  if (preVa < 0) return visualSteps?.length ?? 0;
  return preVa + 1;
}

/** Step pre-VA (ultimo effetto applicato prima del calcolo VA). */
export function getPreVaVisualStep(visualSteps) {
  if (!visualSteps?.length) return null;
  const preVaIdx = getPreVaStepIndex(visualSteps);
  if (preVaIdx >= 0) return visualSteps[preVaIdx];
  return visualSteps[visualSteps.length - 1];
}

/** Numero di step animati in fase 1 (escluso deploy, fino a preVa). */
export function countDuelEffectSteps(visualSteps) {
  if (!visualSteps?.length) return 0;
  const preVaIdx = getPreVaStepIndex(visualSteps);
  const end = preVaIdx >= 0 ? preVaIdx : visualSteps.length;
  return Math.max(0, end - 1);
}

/** Numero di step animati in fase 5 (post-duello, dopo preVa). */
export function countDuelPostEffectSteps(visualSteps) {
  if (!visualSteps?.length) return 0;
  const start = getPostStepsStartIndex(visualSteps);
  const preVaIdx = getPreVaStepIndex(visualSteps);
  if (preVaIdx < 0) return 0;
  return Math.max(0, visualSteps.length - start);
}

/**
 * Delta incrementali mod VA da step pre-duello (fino a preVa).
 * @returns {{ delta: number, cumulative: number, stepIndex: number }[]}
 */
export function extractAssaultModDeltas(visualSteps, isPlayer) {
  if (!visualSteps?.length) return [];
  const key = isPlayer ? 'playerAssaultMod' : 'enemyAssaultMod';
  const end = getPreVaStepIndex(visualSteps);
  const lastIdx = end >= 0 ? end : visualSteps.length - 1;
  const deltas = [];
  let prev = visualSteps[0]?.[key] ?? 0;
  for (let i = 1; i <= lastIdx; i += 1) {
    const cur = visualSteps[i]?.[key] ?? prev;
    if (cur !== prev) {
      deltas.push({ delta: cur - prev, cumulative: cur, stepIndex: i });
      prev = cur;
    }
  }
  return deltas;
}

export function isPostDuelVisualKind(kind) {
  return POST_KINDS.has(kind);
}

/** Righe incrementali mod VA per un lato (fino a preVa). */
export function buildAssaultModProgression(visualSteps, isPlayer, focusUsed) {
  if (!visualSteps?.length) return [];
  const key = isPlayer ? 'playerAssaultMod' : 'enemyAssaultMod';
  const powerKey = isPlayer ? 'playerPower' : 'enemyPower';
  const preVaIdx = getPreVaStepIndex(visualSteps);
  const end = preVaIdx >= 0 ? preVaIdx : visualSteps.length - 1;
  const lines = [];
  let prev = visualSteps[0]?.[key] ?? 0;
  for (let i = 1; i <= end; i += 1) {
    const cur = visualSteps[i]?.[key] ?? prev;
    if (cur !== prev) {
      const delta = cur - prev;
      const power = visualSteps[i]?.[powerKey] ?? visualSteps[end]?.[powerKey] ?? 0;
      const sign = delta > 0 ? '+' : '';
      lines.push({
        key: `mod-${i}`,
        main: `${sign}${delta} mod VA`,
        sub: `= ${power * focusUsed + cur}`,
        cumulative: cur,
      });
      prev = cur;
    }
  }
  return lines;
}

export function countAssaultModProgressionLines(visualSteps, isPlayer) {
  return buildAssaultModProgression(visualSteps, isPlayer, 0).length;
}
