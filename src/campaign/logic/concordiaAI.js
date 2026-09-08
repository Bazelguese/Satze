import { CONCORDIA_EMINENCE_ID } from '../data/concordia.js';
import { getLegalAbilityIds } from '../../game/eminence/eminenceState.js';
import { selectEminenceAbility } from '../../game/eminence/eminenceRound.js';
// Only own remaining cards and public initiative/round state; no player secret choice.
export function selectConcordiaAbility(
  state,
  { hand, usedCards, choosesSecond, roundNumber },
) {
  const side = state?.enemy;
  if (
    side?.eminenceId !== CONCORDIA_EMINENCE_ID ||
    side.selectedAbilityId ||
    side.blockedThisRound
  )
    return state;
  const legal = getLegalAbilityIds(
    side.eminenceId,
    side.selectionCheckpointPresence,
    side.persistent,
  );
  const reactive = hand
    .filter(
      (c) =>
        !usedCards.some((u) => (typeof u === 'object' ? u.id : u) === c.id),
    )
    .some((c) => ['intervention', 'resistenza'].includes(c.ability?.trigger));
  const id = legal.includes('concordia_sortita')
    ? 'concordia_sortita'
    : legal.includes('concordia_seconda') &&
        !choosesSecond &&
        reactive &&
        roundNumber >= 4
      ? 'concordia_seconda'
      : 'concordia_porte';
  return selectEminenceAbility(state, 'enemy', id).matchState;
}
