/** Trasferimento decisione IA worker → main (solo id carta, non oggetti React). */

export function stripDecisionForTransfer(decision) {
  if (!decision) return null;
  const cardId = decision.cardId ?? decision.card?.id ?? null;
  const { card, decision: _nested, ...rest } = decision;
  return { ...rest, cardId };
}

export function hydrateAiDecision(stripped, context) {
  if (!stripped) return null;
  const cardId = stripped.cardId;
  let card = null;
  if (cardId != null) {
    card =
      context.ai?.hand?.find((c) => c.id === cardId) ??
      context.player?.visibleCard?.id === cardId
        ? context.player.visibleCard
        : null;
  }
  return { ...stripped, card };
}
