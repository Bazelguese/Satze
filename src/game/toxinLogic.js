// ============================================
// Tossina a fine turno (logica pura)
// Il duello è risolto in duelResolve.js (computeDuelResolution).
// ============================================

/**
 * Applica la tossina attiva a fine turno
 * @param {Object|null} playerToxin - { value, minHealth, source }
 * @param {Object|null} enemyToxin
 * @param {number} currentPlayerHP
 * @param {number} currentEnemyHP
 * @returns {{ newPlayerHP, newEnemyHP, playerToxinActive, enemyToxinActive, logs }}
 */
export const applyToxin = (playerToxin, enemyToxin, currentPlayerHP, currentEnemyHP) => {
  const logs = [];
  let newPlayerHP = currentPlayerHP;
  let newEnemyHP = currentEnemyHP;
  let playerToxinActive = playerToxin;
  let enemyToxinActive = enemyToxin;

  if (enemyToxinActive && newEnemyHP > enemyToxinActive.minHealth) {
    const before = newEnemyHP;
    newEnemyHP = Math.max(enemyToxinActive.minHealth, newEnemyHP - enemyToxinActive.value);
    logs.push(`☠️ ${enemyToxinActive.source}: Tossina infligge ${enemyToxinActive.value} danni all'IA (${before} → ${newEnemyHP} PV)`);

    if (newEnemyHP <= enemyToxinActive.minHealth) {
      logs.push(`☠️ Tossina sull'IA disattivata (sotto ${enemyToxinActive.minHealth} PV)`);
      enemyToxinActive = null;
    }
  } else if (enemyToxinActive && newEnemyHP <= enemyToxinActive.minHealth) {
    logs.push(`☠️ Tossina sull'IA disattivata (già sotto ${enemyToxinActive.minHealth} PV)`);
    enemyToxinActive = null;
  }

  if (playerToxinActive && newPlayerHP > playerToxinActive.minHealth) {
    const before = newPlayerHP;
    newPlayerHP = Math.max(playerToxinActive.minHealth, newPlayerHP - playerToxinActive.value);
    logs.push(`☠️ ${playerToxinActive.source}: Tossina infligge ${playerToxinActive.value} danni a TE (${before} → ${newPlayerHP} PV)`);

    if (newPlayerHP <= playerToxinActive.minHealth) {
      logs.push(`☠️ Tossina su TE disattivata (sotto ${playerToxinActive.minHealth} PV)`);
      playerToxinActive = null;
    }
  } else if (playerToxinActive && newPlayerHP <= playerToxinActive.minHealth) {
    logs.push(`☠️ Tossina su TE disattivata (già sotto ${playerToxinActive.minHealth} PV)`);
    playerToxinActive = null;
  }

  return {
    newPlayerHP,
    newEnemyHP,
    playerToxinActive,
    enemyToxinActive,
    logs,
  };
};
