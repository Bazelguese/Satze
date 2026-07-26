// ============================================
// Debug developer opzionale per decisioni IA
// ============================================

import { INFORMATION_POLICY } from './aiConstants.js';

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

export function buildAIDebugPayload({ difficulty, selected, candidates, context, extras = {} }) {
  if (!selected) {
    return {
      difficulty,
      informationPolicy: INFORMATION_POLICY,
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
  if (selected.exceptionReason) reasons.push(`eccezione:${selected.exceptionReason}`);
  reasons.push(`Focus ${selected.action.focus}`);
  reasons.push('Focus giocatore nascosto');

  return {
    difficulty,
    informationPolicy: INFORMATION_POLICY,
    roundNumber: context?.roundNumber,
    isPlayerFirst: context?.isPlayerFirst,
    visiblePlayerCardId: context?.player?.visibleCard?.id ?? null,
    fairShare: extras.fairShare ?? selected.budget?.fairShare,
    ordinaryCap: extras.ordinaryCap ?? selected.budget?.ordinaryCap,
    searchDepth: extras.searchDepth ?? selected.searchDepth ?? 0,
    searchNodes: extras.searchNodes ?? 0,
    searchCacheHits: extras.searchCacheHits ?? 0,
    exception: selected.exceptionReason || null,
    expectedScore: selected.expectedScore,
    lowerPercentileScore: selected.lowerPercentileScore,
    overinvestmentPenalty: selected.overinvestmentPenalty,
    winProbability: selected.winProbability,
    scenarios: extras.scenarios || [],
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
      expectedScore: Number(c.expectedScore?.toFixed?.(1) ?? c.expectedScore),
      overinvestmentPenalty: Number(c.overinvestmentPenalty?.toFixed?.(1) ?? c.overinvestmentPenalty),
      exception: c.exceptionReason || null,
      winner: c.simulation?.winner,
      aiHpAfter: c.simulation?.aiHpAfter,
      playerHpAfter: c.simulation?.playerHpAfter,
      aiFocusAfter: c.simulation?.aiFocusAfter,
      playerFocusAfter: c.simulation?.playerFocusAfter,
      terminalStatus: c.simulation?.terminalStatus,
    })),
  };
}

export function logAIDebug(debug) {
  if (!debug) return;
  console.info(
    '[SATZE AI]',
    {
      card: debug.selected?.cardName,
      focus: debug.selected?.focus,
      fairShare: debug.fairShare,
      ordinaryCap: debug.ordinaryCap,
      exception: debug.exception,
      expectedScore: debug.expectedScore,
      lowerPercentileScore: debug.lowerPercentileScore,
      overinvestmentPenalty: debug.overinvestmentPenalty,
      winProbability: debug.winProbability,
      informationPolicy: debug.informationPolicy,
    },
    debug.reasons
  );
  if (debug.candidates?.length && typeof console.table === 'function') {
    console.table(debug.candidates.slice(0, 10));
  }
}
