// ============================================
// Pre-ranking e shortlist bilanciata (senza simulazione duello)
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import { getOrdinaryFocusCap } from './focusBudget.js';
import { estimateFutureCardValue } from './scoreAIAction.js';

/**
 * Pre-ranking senza power×focus dominante e senza Focus privato.
 */
export function lightRankAction(action, context, side = 'ai') {
  const card = action.card;
  const focus = action.focus || 1;
  const budget = getOrdinaryFocusCap(context, side === 'ai' ? 'ai' : 'player', {
    ordinaryFocusBuffer: 2,
    earlyPoolShareCap: 0.4,
    standardFocusBuffer: 1,
  });

  let score = 0;
  score += estimateFutureCardValue(card, context) * 0.55;
  score += (card.power || 0) * 1.1 + (card.damage || 0) * 1.4;

  const trigger = card.ability?.trigger;
  if (trigger === 'intervention' && context.isPlayerFirst && side === 'ai') score += 10;
  if (trigger === 'imboscata' && !context.isPlayerFirst && side === 'ai') score += 10;
  if (trigger === 'overdrive') {
    const od = getFieldModifiers(context.field).overdriveThreshold || 5;
    if (focus === od) score += 8;
    else if (Math.abs(focus - od) === 1) score += 3;
  }

  const std = budget.standardFocus || budget.fairShare;
  const dist = Math.abs(focus - std);
  score += Math.max(0, 8 - dist * 2);
  if (focus > budget.ordinaryCap) score -= (focus - budget.ordinaryCap) * 6;
  if ((context.roundNumber || 1) <= 2 && focus > budget.fairShare + 2) {
    score -= (focus - budget.fairShare) * 3;
  }

  if ((context.player.hp || 0) <= (card.damage || 0)) score += 14;
  if ((context.enemyFieldsConquered || 0) >= 2 && side === 'ai') score += 10;
  if ((context.playerFieldsConquered || 0) >= 2 && side === 'ai') score += 8;

  return score;
}

function exactFocusSearchActive(actions) {
  return actions.some((action) => action?.meta?.exactFocusSearch === true);
}

/**
 * Shortlist bilanciata. Quando è attiva la ricerca Focus esatta, conserva ogni
 * puntata legale: in quel contesto la potatura anticipata renderebbe inutile
 * l'enumerazione completa.
 */
export function buildBalancedShortlist(actions, context, profile) {
  if (exactFocusSearchActive(actions)) {
    return [...actions].sort((a, b) => {
      const cardDiff = String(a.cardId).localeCompare(String(b.cardId));
      return cardDiff || a.focus - b.focus;
    });
  }

  const perCard = profile.ownVariantsPerCard || 3;
  const globalLimit = profile.ownActionLimitWhenFirst || 12;

  const byCard = new Map();
  for (const action of actions) {
    const id = action.cardId;
    if (!byCard.has(id)) byCard.set(id, []);
    byCard.get(id).push(action);
  }

  const shortlist = [];
  for (const [, list] of byCard) {
    const ranked = list
      .map((action) => ({ action, pre: lightRankAction(action, context, 'ai') }))
      .sort((a, b) => b.pre - a.pre);

    const budget = getOrdinaryFocusCap(context, 'ai', profile);
    const picks = [];
    const takeNear = (target) => {
      const hit = ranked.find(
        (r) => !picks.includes(r) && Math.abs(r.action.focus - target) <= 1
      );
      if (hit) picks.push(hit);
    };
    takeNear(1);
    takeNear(budget.fairShare);
    takeNear(budget.standardFocus);
    takeNear(budget.ordinaryCap);

    for (const r of ranked) {
      if (picks.length >= perCard) break;
      if (!picks.includes(r)) picks.push(r);
    }

    shortlist.push(...picks.slice(0, perCard).map((p) => p.action));
  }

  if (shortlist.length <= globalLimit) return shortlist;

  const rankedAll = shortlist
    .map((action) => ({ action, pre: lightRankAction(action, context, 'ai') }))
    .sort((a, b) => b.pre - a.pre);

  const kept = [];
  const seenCard = new Set();
  for (const entry of rankedAll) {
    if (!seenCard.has(entry.action.cardId)) {
      kept.push(entry.action);
      seenCard.add(entry.action.cardId);
    }
  }
  for (const entry of rankedAll) {
    if (kept.length >= globalLimit) break;
    if (!kept.includes(entry.action)) kept.push(entry.action);
  }
  return kept.slice(0, globalLimit);
}
