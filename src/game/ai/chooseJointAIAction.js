// ============================================
// Azione congiunta Campo + carta + Focus
// ============================================

import { getAIProfile } from './aiProfiles.js';
import { defaultRng } from './aiConstants.js';
import { getLegalFieldIndexes } from './legalFields.js';
import { chooseAIIndependentAction, chooseAIIndependentActionAsync } from './chooseAIAction.js';
import { buildStrategicState } from './strategicState.js';
import { evaluateFieldSelectionAdjustment } from './fieldStrategy.js';
import { aiYieldIfNeeded, resetAiSchedulerTicks } from './aiScheduler.js';

function resolveJointFieldIndexes(context) {
  if (context.currentFieldIndex != null) {
    return [context.currentFieldIndex];
  }
  return getLegalFieldIndexes(context);
}

function leanProfileForJoint(profile, multiField) {
  if (!multiField) {
    return { ...profile, selectionMode: profile.selectionMode };
  }
  return {
    ...profile,
    ownActionLimitWhenFirst: Math.min(profile.ownActionLimitWhenFirst || 10, 8),
    opponentScenarioCount: Math.min(profile.opponentScenarioCount || 4, 4),
    ownVariantsPerCard: Math.min(profile.ownVariantsPerCard || 3, 3),
    beamWidth: Math.min(profile.beamWidth || 12, 8),
    selectionMode: 'best',
  };
}

function packJointDecision(candidates, profile, rng, context) {
  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
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
      fieldName: context.battlefields?.[chosen.fieldIndex]?.name ?? null,
      fieldStrategy: {
        baseScore: Number(chosen.baseScore?.toFixed?.(1) ?? chosen.baseScore),
        adjustment: Number(chosen.fieldStrategy.score?.toFixed?.(1) ?? chosen.fieldStrategy.score),
        denialScore: Number(
          chosen.fieldStrategy.denialScore?.toFixed?.(1) ?? chosen.fieldStrategy.denialScore
        ),
        preservePenalty: Number(
          chosen.fieldStrategy.preservePenalty?.toFixed?.(1) ??
            chosen.fieldStrategy.preservePenalty
        ),
        playerThreat: Number(
          chosen.fieldStrategy.assessment.playerThreat?.toFixed?.(1) ??
            chosen.fieldStrategy.assessment.playerThreat
        ),
        aiOpportunity: Number(
          chosen.fieldStrategy.assessment.aiOpportunity?.toFixed?.(1) ??
            chosen.fieldStrategy.assessment.aiOpportunity
        ),
        fitReasons: chosen.fieldStrategy.fitReasons || [],
        threatCardNames: chosen.fieldStrategy.threatCardNames || [],
        opportunityCardNames: chosen.fieldStrategy.opportunityCardNames || [],
        reserveCardName: chosen.fieldStrategy.reserveCardName || null,
      },
      jointCandidates: candidates.slice(0, 8).map((c) => {
        const vsChosen = Number(chosen.score) - Number(c.score);
        let rejectWhy = 'valutato peggio complessivamente';
        if (c.fieldIndex === chosen.fieldIndex) {
          rejectWhy = null;
        } else if (
          (c.fieldStrategy?.assessment?.playerThreat || 0) + 1 <
          (chosen.fieldStrategy?.assessment?.playerThreat || 0)
        ) {
          rejectWhy = 'meno urgente da toglierti (minaccia più bassa)';
        } else if ((c.baseScore || 0) + 200 < (chosen.baseScore || 0)) {
          rejectWhy = 'con la sua carta lì vinceva meno spesso / peggio';
        } else if ((c.fieldStrategy?.reserveGap || 0) > (chosen.fieldStrategy?.reserveGap || 0) + 2) {
          rejectWhy = 'lo stava tenendo più volentieri per dopo';
        }
        return {
          fieldIndex: c.fieldIndex,
          fieldName: context.battlefields?.[c.fieldIndex]?.name ?? null,
          cardId: c.cardId,
          cardName: c.card?.name ?? null,
          focus: c.focus,
          score: Number(c.score?.toFixed?.(1) ?? c.score),
          baseScore: Number(c.baseScore?.toFixed?.(1) ?? c.baseScore),
          fieldAdjustment: Number(
            c.fieldStrategy.score?.toFixed?.(1) ?? c.fieldStrategy.score
          ),
          playerThreat: Number(
            c.fieldStrategy.assessment.playerThreat?.toFixed?.(1) ??
              c.fieldStrategy.assessment.playerThreat
          ),
          reserveGap: Number(
            c.fieldStrategy.reserveGap?.toFixed?.(1) ?? c.fieldStrategy.reserveGap
          ),
          rejectWhy: vsChosen > 0 ? rejectWhy : null,
        };
      }),
    },
  };
}

function pickIndependentSync(fieldContext, leanProfile, options) {
  return chooseAIIndependentAction(fieldContext, leanProfile.id, {
    ...options,
    profile: leanProfile,
    rng: () => 0,
    includeStrategicProjection: true,
  });
}

async function pickIndependentAsync(fieldContext, leanProfile, options, multiField) {
  await aiYieldIfNeeded({ force: multiField });
  return chooseAIIndependentActionAsync(fieldContext, leanProfile.id, {
    ...options,
    profile: leanProfile,
    rng: () => 0,
    includeStrategicProjection: true,
  });
}

function buildJointCandidatesSync(context, profile, options) {
  const legalFields = resolveJointFieldIndexes(context);
  if (!legalFields.length) {
    return { emptyLegal: true, candidates: [] };
  }

  const strategicRoot = buildStrategicState(context);
  const multiField = legalFields.length > 1;
  const candidates = [];

  for (const fieldIndex of legalFields) {
    const fieldContext = {
      ...context,
      currentFieldIndex: fieldIndex,
      field: context.battlefields[fieldIndex],
    };
    const leanProfile = leanProfileForJoint(profile, multiField);
    const decision = pickIndependentSync(fieldContext, leanProfile, options);
    if (!decision?.card) continue;

    const fieldStrategy = evaluateFieldSelectionAdjustment(
      strategicRoot,
      fieldIndex,
      decision.card,
      profile
    );
    const baseScore = Number(decision.score) || 0;

    candidates.push({
      fieldIndex,
      card: decision.card,
      cardId: decision.cardId,
      focus: decision.focus,
      score: baseScore + fieldStrategy.score,
      baseScore,
      fieldStrategy,
      debug: decision.debug,
      decision,
    });
  }

  return { emptyLegal: false, candidates };
}

async function buildJointCandidatesAsync(context, profile, options) {
  const legalFields = resolveJointFieldIndexes(context);
  if (!legalFields.length) {
    return { emptyLegal: true, candidates: [] };
  }

  const strategicRoot = buildStrategicState(context);
  const multiField = legalFields.length > 1;
  const candidates = [];

  for (const fieldIndex of legalFields) {
    const fieldContext = {
      ...context,
      currentFieldIndex: fieldIndex,
      field: context.battlefields[fieldIndex],
    };
    const leanProfile = leanProfileForJoint(profile, multiField);
    const decision = await pickIndependentAsync(fieldContext, leanProfile, options, multiField);
    if (!decision?.card) continue;

    const fieldStrategy = evaluateFieldSelectionAdjustment(
      strategicRoot,
      fieldIndex,
      decision.card,
      profile
    );
    const baseScore = Number(decision.score) || 0;

    candidates.push({
      fieldIndex,
      card: decision.card,
      cardId: decision.cardId,
      focus: decision.focus,
      score: baseScore + fieldStrategy.score,
      baseScore,
      fieldStrategy,
      debug: decision.debug,
      decision,
    });
  }

  return { emptyLegal: false, candidates };
}

/**
 * Sceglie { fieldIndex, card, focus } come unica decisione.
 */
export function chooseJointAIAction(context, difficulty, options = {}) {
  const profile =
    options.profile || getAIProfile(difficulty || context.difficulty || 'medium');
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();
  const opts = { ...options, profile, rng, cache };

  const { emptyLegal, candidates } = buildJointCandidatesSync(context, profile, opts);
  if (emptyLegal) {
    return chooseAIIndependentAction(context, profile.id, opts);
  }
  return packJointDecision(candidates, profile, rng, context);
}

export async function chooseJointAIActionAsync(context, difficulty, options = {}) {
  resetAiSchedulerTicks();
  const profile =
    options.profile || getAIProfile(difficulty || context.difficulty || 'medium');
  const rng = options.rng || defaultRng;
  const cache = options.cache || new Map();
  const opts = { ...options, profile, rng, cache };

  const { emptyLegal, candidates } = await buildJointCandidatesAsync(context, profile, opts);
  if (emptyLegal) {
    return chooseAIIndependentActionAsync(context, profile.id, opts);
  }
  return packJointDecision(candidates, profile, rng, context);
}
