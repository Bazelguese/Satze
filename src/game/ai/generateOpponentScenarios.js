// ============================================
// Scenari avversari con Focus nascosti
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
import { AI_MIN_FOCUS } from './aiConstants.js';
import { getAvailableCards, getLegalFocusRange } from './generateAIActions.js';
import { estimateStandardFocus, getFairShare } from './focusBudget.js';

function clampFocus(value, minFocus, maxFocus) {
  return Math.max(minFocus, Math.min(maxFocus, Math.round(value)));
}

/**
 * Valori Focus rappresentativi per una carta avversaria (non include il max di default).
 */
export function generateOpponentFocusValues({
  context,
  card,
  profile,
  allowMax = false,
}) {
  const { minFocus, maxFocus, pool } = getLegalFocusRange(context, 'player');
  const cards = getAvailableCards(context.player.hand, context.player.usedCardIds);
  const cardsRemaining = cards.length;
  const fairShare = getFairShare(pool, cardsRemaining);
  const standard = estimateStandardFocus({
    focusPool: pool,
    cardsRemaining,
    profile,
  });
  const economical = Math.max(minFocus, fairShare);
  const pressure = clampFocus(standard + 1, minFocus, maxFocus);
  const fieldMods = getFieldModifiers(context.field);
  const odThreshold = fieldMods.overdriveThreshold || 5;

  const values = [minFocus, economical, standard, pressure];

  if (card?.ability?.trigger === 'overdrive' || fieldMods.overdriveExtraPowerAndDamage) {
    values.push(odThreshold);
  }

  const round = context.roundNumber || 1;
  const high = clampFocus(Math.ceil((standard + maxFocus) / 2), minFocus, maxFocus);
  values.push(high);

  const mayIncludeMax =
    allowMax ||
    profile?.allowMaxFocusScenario === true ||
    cardsRemaining <= 1 ||
    round >= 5 ||
    fieldMods.winnerByFocusNotVa === true ||
    (context.playerFieldsConquered || 0) >= 2 ||
    (context.enemyFieldsConquered || 0) >= 2;

  if (mayIncludeMax) {
    values.push(maxFocus);
  }

  const unique = [...new Set(values.map((v) => clampFocus(v, minFocus, maxFocus)))]
    .filter((v) => v >= minFocus && v <= maxFocus)
    .sort((a, b) => a - b);

  return unique;
}

function bandForFocus(focus, { economical, standard, pressure, high }) {
  if (focus <= economical) return 'economical';
  if (focus <= standard) return 'standard';
  if (focus <= pressure) return 'pressure';
  return 'high';
}

/**
 * Genera scenari { card, focus, probability, band }.
 */
export function generateOpponentScenarios(context, profile) {
  const visible = context.player?.visibleCard ?? null;
  const cards = visible
    ? [visible]
    : getAvailableCards(context.player.hand, context.player.usedCardIds);

  if (!cards.length) return [];

  const { minFocus, maxFocus, pool } = getLegalFocusRange(context, 'player');
  const cardsRemaining = getAvailableCards(context.player.hand, context.player.usedCardIds).length;
  const fairShare = getFairShare(pool, cardsRemaining);
  const standard = estimateStandardFocus({ focusPool: pool, cardsRemaining, profile });
  const economical = Math.max(minFocus, fairShare);
  const pressure = clampFocus(standard + 1, minFocus, maxFocus);
  const high = clampFocus(Math.ceil((standard + maxFocus) / 2), minFocus, maxFocus);
  const bands = { economical, standard, pressure, high };

  const weights = profile.opponentScenarioWeights || {
    economical: 0.2,
    standard: 0.45,
    pressure: 0.25,
    high: 0.1,
  };

  const raw = [];
  for (const card of cards) {
    const focuses = generateOpponentFocusValues({ context, card, profile });
    for (const focus of focuses) {
      const band = bandForFocus(focus, bands);
      const weight = weights[band] ?? 0;
      if (weight <= 0) continue;
      raw.push({
        card,
        cardId: card.id,
        focus,
        band,
        weight,
      });
    }
  }

  // Limita al conteggio profilo, bilanciando bande
  const limit = profile.opponentScenarioCount || 4;
  if (raw.length <= limit) {
    return normalizeScenarioProbabilities(raw);
  }

  // Priorità: standard → pressure → economical → high; una per carta quando possibile
  const byCard = new Map();
  for (const s of raw) {
    if (!byCard.has(s.cardId)) byCard.set(s.cardId, []);
    byCard.get(s.cardId).push(s);
  }

  const selected = [];
  const bandOrder = ['standard', 'economical', 'pressure', 'high'];
  for (const [, list] of byCard) {
    for (const band of bandOrder) {
      const hit = list.find((s) => s.band === band);
      if (hit && !selected.some((x) => x.cardId === hit.cardId && x.focus === hit.focus)) {
        selected.push(hit);
      }
      if (selected.length >= limit) break;
    }
    if (selected.length >= limit) break;
  }

  // Completa se serve
  for (const s of raw) {
    if (selected.length >= limit) break;
    if (!selected.some((x) => x.cardId === s.cardId && x.focus === s.focus)) {
      selected.push(s);
    }
  }

  return normalizeScenarioProbabilities(selected.slice(0, limit));
}

function normalizeScenarioProbabilities(scenarios) {
  const total = scenarios.reduce((sum, s) => sum + (s.weight || 0), 0) || 1;
  return scenarios.map((s) => ({
    ...s,
    probability: (s.weight || 0) / total,
  }));
}
