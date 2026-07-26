// ============================================
// Azione congiunta Campo + carta + Focus
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng } from './aiConstants.js';
import { getLegalFieldIndexes } from './legalFields.js';
import { chooseAIIndependentAction } from './chooseAIAction.js';

/**
 * Sceglie { fieldIndex, card, focus } come unica decisione.
 * Se il Campo è già fissato, riduce a carta+Focus sul Campo corrente.
 *
 * @param {object} context — information set
 * @param {string} [difficulty]
 * @param {{ rng?: Function, cache?: Map, profile?: object }} [options]
 */
export function chooseJointAIAction(context, difficulty, options = {}) {
  const profile =
    options.profile || getAIProfile(difficulty || context.difficulty || 'medium');
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();

  const legalFields =
    context.currentFieldIndex != null
      ? [context.currentFieldIndex]
      : getLegalFieldIndexes(context);

  if (!legalFields.length) {
    // Campo già obbligatorio ma assente: fallback carta/focus
    return chooseAIIndependentAction(context, profile.id, { ...options, profile, rng, cache });
  }

  const candidates = [];

  for (const fieldIndex of legalFields) {
    const fieldContext = {
      ...context,
      currentFieldIndex: fieldIndex,
      field: context.battlefields[fieldIndex],
    };

    const leanProfile =
      legalFields.length > 1
        ? {
            ...profile,
            ownActionLimitWhenFirst: Math.min(profile.ownActionLimitWhenFirst || 10, 8),
            opponentScenarioCount: Math.min(profile.opponentScenarioCount || 4, 4),
            ownVariantsPerCard: Math.min(profile.ownVariantsPerCard || 3, 3),
            selectionMode: 'best',
          }
        : { ...profile, selectionMode: profile.selectionMode };

    const decision = chooseAIIndependentAction(fieldContext, leanProfile.id, {
      ...options,
      profile: leanProfile,
      rng: () => 0, // valutazione deterministica per campo; RNG solo sulla scelta finale
      cache,
      includeStrategicProjection: true,
    });

    if (!decision?.card) continue;

    candidates.push({
      fieldIndex,
      card: decision.card,
      cardId: decision.cardId,
      focus: decision.focus,
      score: decision.score,
      debug: decision.debug,
      decision,
    });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // Casualità profilo solo tra candidati vicini
  let chosen = best;
  if (profile.selectionMode === 'weighted-top' && candidates.length > 1) {
    const window = profile.scoreWindow || 550;
    const pool = candidates.filter((c) => best.score - c.score <= window).slice(0, 3);
    const weights = [0.6, 0.27, 0.13];
    let roll = rng() * pool.reduce((s, _, i) => s + (weights[i] ?? 0.05), 0);
    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights[i] ?? 0.05;
      if (roll <= 0) {
        chosen = pool[i];
        break;
      }
    }
  } else if (profile.selectionMode === 'top-band-random' && candidates.length > 1) {
    const pool = candidates.filter((c) => best.score - c.score <= (profile.scoreWindow || 1600));
    const band = pool.slice(0, Math.max(1, Math.ceil(pool.length * (profile.topBandRatio || 0.4))));
    chosen = band[Math.floor(rng() * band.length)] || best;
  }

  return {
    fieldIndex: chosen.fieldIndex,
    card: chosen.card,
    cardId: chosen.cardId,
    focus: chosen.focus,
    score: chosen.score,
    debug: {
      ...(chosen.debug || {}),
      jointAction: true,
      jointCandidates: candidates.slice(0, 8).map((c) => ({
        fieldIndex: c.fieldIndex,
        cardId: c.cardId,
        focus: c.focus,
        score: Number(c.score?.toFixed?.(1) ?? c.score),
      })),
    },
  };
}
