// ============================================
// Debug developer opzionale per decisioni IA
// ============================================

export function isAIDebugEnabled() {
  try {
    return (
      typeof import.meta !== 'undefined' &&
      import.meta.env?.DEV &&
      typeof window !== 'undefined' &&
      window.__SATZE_AI_DEBUG__ === true
    );
  } catch {
    return false;
  }
}

export function buildAIDebugPayload({ difficulty, selected, candidates, context }) {
  if (!selected) {
    return {
      difficulty,
      selected: null,
      reasons: ['nessuna mossa legale'],
      candidates: [],
    };
  }

  const reasons = [];
  const sim = selected.simulation;
  if (selected.isTerminalWin) reasons.push('chiude la partita');
  if (sim?.terminalStatus === 'ai_win_hp') reasons.push('letale');
  if (sim?.terminalStatus === 'ai_win_fields') reasons.push('terzo Campo');
  if (sim?.winner === 'enemy') reasons.push('vince il Campo');
  if (sim?.winner === 'player') reasons.push('sconfitta strategica possibile');
  if (sim?.aiAbilityTriggered) reasons.push('abilità attiva');
  if (selected.dominated) reasons.push('dominata');
  reasons.push(`Focus ${selected.action.focus}`);

  return {
    difficulty,
    roundNumber: context?.roundNumber,
    isPlayerFirst: context?.isPlayerFirst,
    selected: {
      cardId: selected.action.cardId,
      cardName: selected.action.card?.name,
      focus: selected.action.focus,
      fieldIndex: selected.action.fieldIndex,
      score: selected.score,
    },
    reasons,
    candidates: (candidates || []).slice(0, 24).map((c) => ({
      cardId: c.action.cardId,
      cardName: c.action.card?.name,
      focus: c.action.focus,
      score: Number(c.score?.toFixed?.(1) ?? c.score),
      winner: c.simulation?.winner,
      aiHpAfter: c.simulation?.aiHpAfter,
      playerHpAfter: c.simulation?.playerHpAfter,
      aiFocusAfter: c.simulation?.aiFocusAfter,
      playerFocusAfter: c.simulation?.playerFocusAfter,
      dominated: !!c.dominated,
      terminalStatus: c.simulation?.terminalStatus,
    })),
  };
}

export function logAIDebug(debug) {
  if (!debug) return;
  console.info('[SATZE AI]', debug.selected, debug.reasons);
  if (debug.candidates?.length && typeof console.table === 'function') {
    console.table(debug.candidates.slice(0, 10));
  }
}
