import { calcInitialBonuses } from '../../utils/onlineMatch.js';
import { ARENA_CONTESA } from './arenaContesaConstants.js';

/**
 * Dopo uno scontro: marca agente usato e, se restano sostituzioni, pesca dalla Riserva.
 * @param {object} player
 * @param {number} agentId
 */
export function applyAgentUseAndReserve(player, agentId) {
  const usedIds = player.usedIds.includes(agentId)
    ? player.usedIds
    : [...player.usedIds, agentId];

  let hand = player.hand.map((c) => ({ ...c }));
  let reserve = player.reserve.map((c) => ({ ...c }));
  let substitutionsDone = player.substitutionsDone;

  const canSubstitute =
    substitutionsDone < ARENA_CONTESA.reserveSize && reserve.length > 0;

  if (canSubstitute) {
    const idx = hand.findIndex((c) => c.id === agentId);
    if (idx >= 0) {
      const [incoming] = reserve.splice(0, 1);
      hand[idx] = incoming;
      substitutionsDone += 1;
    }
  }

  const armyBonuses = calcInitialBonuses(hand);

  return {
    ...player,
    hand,
    reserve,
    usedIds,
    substitutionsDone,
    armyBonuses,
  };
}
