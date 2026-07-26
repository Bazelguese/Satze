// ============================================
// Scenari avversari con Focus nascosti
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';
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

function pickPreferredScenario(list, bandOrder) {
  for (const band of bandOrder) {
    const hit = list.find((s) => s.band === band);
    if (hit) return hit;
  }
  return list[0] || null;
}

/**
 * Genera scenari { card, focus, probability, band }.
 * Passata 1: almeno uno scenario per carta (ordine stabile per id, non per mano).
 * Passata 2: varianti Focus aggiuntive fino al budget.
 */
export function generateOpponentScenarios(context, profile) {
  const visible = context.player?.visibleCard ?? null;
  const available = visible
    ? [visible]
    : getAvailableCards(context.player.hand, context.player.usedCardIds);

  if (!available.length) return [];

  // Non privilegiare l'ordine della mano: ordine stabile per id
  const cards = [...available].sort((a, b) => {
    const idA = a?.id ?? 0;
    const idB = b?.id ?? 0;
    return idA - idB;
  });

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

  const byCard = new Map();
  for (const card of cards) {
    const focuses = generateOpponentFocusValues({ context, card, profile });
    const list = [];
    for (const focus of focuses) {
      const band = bandForFocus(focus, bands);
      const weight = weights[band] ?? 0;
      if (weight <= 0) continue;
      list.push({
        card,
        cardId: card.id,
        focus,
        band,
        weight,
      });
    }
    // Se i pesi azzerano tutto (es. Facile senza pressure/high), tieni almeno economical/standard
    if (!list.length) {
      const fallbackFocus = clampFocus(standard, minFocus, maxFocus);
      list.push({
        card,
        cardId: card.id,
        focus: fallbackFocus,
        band: 'standard',
        weight: 1,
      });
    }
    byCard.set(card.id, list);
  }

  const bandOrder = ['standard', 'economical', 'pressure', 'high'];
  const selected = [];
  const seen = new Set();

  // Passata 1: copertura completa delle carte
  for (const card of cards) {
    const list = byCard.get(card.id) || [];
    const pick = pickPreferredScenario(list, bandOrder);
    if (!pick) continue;
    const key = `${pick.cardId}:${pick.focus}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(pick);
  }

  // Passata 2: varianti Focus aggiuntive (budget ≥ max(limit, nCarte))
  const limit = Math.max(profile.opponentScenarioCount || 4, cards.length);
  const extras = [];
  for (const card of cards) {
    const list = byCard.get(card.id) || [];
    for (const band of bandOrder) {
      for (const s of list) {
        if (s.band !== band) continue;
        const key = `${s.cardId}:${s.focus}`;
        if (seen.has(key)) continue;
        extras.push(s);
      }
    }
  }

  for (const s of extras) {
    if (selected.length >= limit) break;
    const key = `${s.cardId}:${s.focus}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(s);
  }

  return normalizeScenarioProbabilities(selected);
}

/**
 * Probabilità a due livelli:
 * - prior uniforme sulla carta (aggiungere Focus non aumenta P(carta));
 * - distribuzione Focus normalizzata dentro la carta.
 */
export function normalizeScenarioProbabilities(scenarios) {
  if (!scenarios?.length) return [];

  const byCard = new Map();
  for (const s of scenarios) {
    const id = s.cardId ?? s.card?.id;
    if (id == null) continue;
    if (!byCard.has(id)) byCard.set(id, []);
    byCard.get(id).push(s);
  }

  const nCards = Math.max(1, byCard.size);
  const cardPrior = 1 / nCards;
  const out = [];

  for (const [, list] of byCard) {
    const weightSum = list.reduce((sum, s) => sum + (s.weight || 0), 0) || 1;
    for (const s of list) {
      const focusShare = (s.weight || 0) / weightSum;
      out.push({
        ...s,
        cardPrior,
        focusShare,
        probability: cardPrior * focusShare,
      });
    }
  }

  return out;
}
