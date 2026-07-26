/**
 * Hash stabile dello stato strategico pubblico (niente Focus privati).
 * @param {object} state
 * @param {number} [depth]
 */
export function publicStateHash(state, depth = null) {
  const conquered = Object.keys(state.conqueredFields || {})
    .sort()
    .map((k) => `${k}:${state.conqueredFields[k]?.winner || state.conqueredFields[k]}`)
    .join(',');
  const aiCards = (state.aiRemainingCardIds || []).slice().sort().join(',');
  const playerCards = (state.playerRemainingCardIds || []).slice().sort().join(',');
  const parts = [
    state.roundNumber,
    state.initiativeSide,
    state.lastWinner ?? '',
    state.aiHP,
    state.playerHP,
    state.aiFocus,
    state.playerFocus,
    aiCards,
    playerCards,
    conquered,
    state.playerToxin ? 1 : 0,
    state.aiToxin ? 1 : 0,
  ];
  if (depth != null) parts.push(`d${depth}`);
  return parts.join('|');
}
