/**
 * Nel motore Contesa: player=Chiamante, enemy=Contestatore.
 * Nel duello UI di sistema la destra è sempre "player" (tu).
 * Se il locale è Contestatore, ribalta i lati per lo spawn/presentazione.
 */

const PAIR_PREFIXES = [
  'player',
  'enemy',
];

function swapSideToken(side) {
  if (side === 'player') return 'enemy';
  if (side === 'enemy') return 'player';
  return side;
}

function flipVisualStep(step) {
  if (!step || typeof step !== 'object') return step;
  return {
    ...step,
    side: swapSideToken(step.side),
    playerPower: step.enemyPower,
    enemyPower: step.playerPower,
    playerDamage: step.enemyDamage,
    enemyDamage: step.playerDamage,
    playerAssaultMod: step.enemyAssaultMod,
    enemyAssaultMod: step.playerAssaultMod,
    highlightPlayerAbility: step.highlightEnemyAbility,
    highlightEnemyAbility: step.highlightPlayerAbility,
    highlightPlayerBonus: step.highlightEnemyBonus,
    highlightEnemyBonus: step.highlightPlayerBonus,
  };
}

/**
 * @param {object} battleResult
 * @returns {object}
 */
export function flipBattleResultForLocal(battleResult) {
  if (!battleResult) return battleResult;

  const out = { ...battleResult };
  const keys = Object.keys(battleResult);

  for (const key of keys) {
    if (key.startsWith('player')) {
      const rest = key.slice('player'.length);
      const enemyKey = `enemy${rest}`;
      if (Object.prototype.hasOwnProperty.call(battleResult, enemyKey)) {
        out[key] = battleResult[enemyKey];
        out[enemyKey] = battleResult[key];
      }
    }
  }

  // winner: prospettiva locale
  if (battleResult.winner === 'player') out.winner = 'enemy';
  else if (battleResult.winner === 'enemy') out.winner = 'player';

  if (Array.isArray(battleResult.visualSteps)) {
    out.visualSteps = battleResult.visualSteps.map(flipVisualStep);
  }

  // Campi non-prefissati che restano legati al lato "player" UI
  if (battleResult.finalPlayerHP != null || battleResult.finalEnemyHP != null) {
    out.finalPlayerHP = battleResult.finalEnemyHP;
    out.finalEnemyHP = battleResult.finalPlayerHP;
  }
  if (battleResult.finalPlayerFC != null || battleResult.finalEnemyFC != null) {
    out.finalPlayerFC = battleResult.finalEnemyFC;
    out.finalEnemyFC = battleResult.finalPlayerFC;
  }

  if (battleResult.perfectFocusSide === 'player') out.perfectFocusSide = 'enemy';
  else if (battleResult.perfectFocusSide === 'enemy') out.perfectFocusSide = 'player';

  // Evita doppio swap su coppie già gestite — PAIR_PREFIXES tenuto per chiarezza
  void PAIR_PREFIXES;

  return out;
}
