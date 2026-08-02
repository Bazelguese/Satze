// Range FC spendibili (giocatore + IA): mai oltre il pool.
// Minimo garantito: 1 FC per ogni agente ancora da giocare.

export const MIN_FOCUS_INVESTMENT = 1;

/**
 * Riserva: 1 FC per ogni carta ancora da giocare dopo quella corrente.
 * @param {number} availableCardCount
 */
export function getReservedFocus(availableCardCount) {
  return Math.max(0, (availableCardCount || 0) - 1);
}

/**
 * Max FC spendibili da un pool con riserva dura.
 * Con N agenti ancora da giocare serve almeno 1 FC per ciascuno:
 * reserved = N - 1 (per i turni futuri), quindi max attuale = pool - reserved.
 * Se pool < N → max 0 (non si può investire legalmente).
 *
 * Esempio: 3 agenti, 3 FC → reserved 2 → max 1.
 * Esempio: 5 agenti, 18 FC → reserved 4 → max 14.
 *
 * @param {number} pool
 * @param {number} reserved
 */
export function computeLegalMaxFocus(pool, reserved) {
  const safePool = Math.max(0, Number(pool) || 0);
  const safeReserved = Math.max(0, Number(reserved) || 0);
  return Math.max(0, safePool - safeReserved);
}

/**
 * Minimo FC che un lato deve sempre mantenere: 1 per agente ancora da giocare.
 * @param {number} agentsRemaining
 */
export function minGuaranteedFocus(agentsRemaining) {
  return Math.max(0, Number(agentsRemaining) || 0);
}

/**
 * Agenti ancora giocabili in mano (id non in used).
 * @param {Array} hand
 * @param {Array} usedCardIds
 */
export function countAvailableAgents(hand, usedCardIds) {
  const used = new Set();
  for (const entry of usedCardIds || []) {
    if (entry == null) continue;
    used.add(typeof entry === 'object' ? entry.id : entry);
  }
  return (hand || []).filter((card) => card && card.id != null && !used.has(card.id)).length;
}

/**
 * Agenti restanti DOPO aver giocato `playedAgentId` in questo duello.
 * @param {Array} hand
 * @param {Array} usedCardIds
 * @param {number|string|null} playedAgentId
 */
export function countAgentsRemainingAfterPlay(hand, usedCardIds, playedAgentId) {
  const used = new Set();
  for (const entry of usedCardIds || []) {
    if (entry == null) continue;
    used.add(typeof entry === 'object' ? entry.id : entry);
  }
  if (playedAgentId != null) used.add(playedAgentId);
  return (hand || []).filter((card) => card && card.id != null && !used.has(card.id)).length;
}

/**
 * Applica sottrazione investimento e pavimento del minimo garantito.
 * @param {number} focusBeforeSpend
 * @param {number} invested
 * @param {number} agentsRemainingAfter
 */
export function applyFocusSpendWithGuarantee(focusBeforeSpend, invested, agentsRemainingAfter) {
  const afterSpend = Math.max(0, (Number(focusBeforeSpend) || 0) - (Number(invested) || 0));
  return Math.max(minGuaranteedFocus(agentsRemainingAfter), afterSpend);
}
