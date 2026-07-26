// ============================================
// Scelta Campo per l'IA (information set sanitizzato)
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng } from './aiConstants.js';
import { chooseAIIndependentAction } from './chooseAIAction.js';

/**
 * Indici Campo legali (rivelati e non conquistati).
 */
export function getLegalFieldIndexes(context) {
  const battlefields = context.battlefields || [];
  const conquered = context.conqueredFields || {};
  const revealed =
    context.revealedFields == null ? battlefields.length : Number(context.revealedFields);

  const indexes = [];
  for (let i = 0; i < battlefields.length; i += 1) {
    if (i in conquered) continue;
    if (i >= revealed) continue;
    indexes.push(i);
  }
  return indexes;
}

function evaluateField(context, fieldIndex, profile, options) {
  const fieldContext = {
    ...context,
    currentFieldIndex: fieldIndex,
    field: context.battlefields[fieldIndex],
  };

  const leanProfile = {
    ...profile,
    ownActionLimitWhenFirst: Math.min(profile.ownActionLimitWhenFirst || 8, 8),
    opponentScenarioCount: Math.min(profile.opponentScenarioCount || 4, 3),
    ownVariantsPerCard: Math.min(profile.ownVariantsPerCard || 3, 2),
    selectionMode: 'best',
    useDominanceFilterWhenHiddenFocus: false,
  };

  const decision = chooseAIIndependentAction(fieldContext, leanProfile.id, {
    ...options,
    profile: leanProfile,
    rng: () => 0,
  });

  return {
    fieldIndex,
    score: decision?.score ?? -Infinity,
    decision,
  };
}

/**
 * @param {object} context — information set sanitizzato
 * @param {object|string} [profileOrDifficulty]
 * @param {{ rng?: () => number }} [options]
 * @returns {number|null} fieldIndex
 */
export function chooseAIField(context, profileOrDifficulty, options = {}) {
  const profile =
    typeof profileOrDifficulty === 'string' || profileOrDifficulty == null
      ? getAIProfile(profileOrDifficulty || context.difficulty || 'medium')
      : profileOrDifficulty;

  const rng = options.rng || defaultRng;
  const legal = getLegalFieldIndexes(context);
  if (!legal.length) return null;
  if (legal.length === 1) return legal[0];

  if (profile.id === 'easy') {
    const evaluated = legal.map((fieldIndex) => evaluateField(context, fieldIndex, profile, options));
    evaluated.sort((a, b) => b.score - a.score);
    const best = evaluated[0]?.score ?? 0;
    const pool = evaluated.filter((e) => best - e.score <= 2500);
    const band = pool.length ? pool : evaluated;
    const weights = band.map((item, index) => ({
      item: item.fieldIndex,
      weight: Math.max(1, band.length - index),
    }));
    let roll = rng() * weights.reduce((s, w) => s + w.weight, 0);
    for (const entry of weights) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return band[0].fieldIndex;
  }

  const evaluated = legal.map((fieldIndex) => evaluateField(context, fieldIndex, profile, options));
  evaluated.sort((a, b) => b.score - a.score);

  if (profile.id === 'medium') {
    const top = evaluated.slice(0, Math.min(3, evaluated.length));
    const weights = [0.55, 0.3, 0.15];
    const entries = top.map((item, index) => ({
      item: item.fieldIndex,
      weight: weights[index] ?? 0.05,
    }));
    let roll = rng() * entries.reduce((s, w) => s + w.weight, 0);
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return top[0].fieldIndex;
  }

  return evaluated[0].fieldIndex;
}
