// ============================================
// Valutazione strategica dei Campi
// ============================================

import {
  getFieldModifiers,
  getFieldSetupFlags,
} from '../battlefieldEffects.js';
import {
  evaluateCardPlan,
  estimateAbilityImpact,
} from './strategyPlanner.js';
import { findCardInState } from './strategicState.js';

const POWER_EFFECTS = new Set(['power', 'enemyPower', 'powerAndDamage']);
const DAMAGE_EFFECTS = new Set(['damage', 'enemyDamage', 'powerAndDamage']);
const MODIFIER_EFFECTS = new Set([
  'power',
  'enemyPower',
  'damage',
  'enemyDamage',
  'powerAndDamage',
  'assaultValue',
  'enemyAssault',
]);

function fieldFor(state, fieldIndex) {
  return state?._refs?.battlefields?.[fieldIndex] || null;
}

function remainingCards(state, side) {
  const ids = new Set(
    side === 'ai'
      ? state?.aiRemainingCardIds || []
      : state?.playerRemainingCardIds || []
  );
  return [...ids]
    .map((id) => findCardInState(state, side, id))
    .filter(Boolean);
}

function sideChoosesFieldState(state, fieldIndex, side) {
  return {
    ...state,
    currentFieldIndex: fieldIndex,
    initiativeSide: side,
    isPlayerFirst: side === 'player',
  };
}

function neutralFieldState(state, side) {
  return {
    ...state,
    currentFieldIndex: null,
    initiativeSide: side,
    isPlayerFirst: side === 'player',
  };
}

function fieldSuppressionPenalty(card, flags, impact) {
  const effect = card?.ability?.effect;
  if (!effect) return 0;

  let penalty = 0;
  if (flags.directDamageDisabled && effect === 'directDamage') {
    penalty += impact * 1.1;
  }
  if (flags.modifiersDisabled && MODIFIER_EFFECTS.has(effect)) {
    penalty += impact;
  }
  if (flags.positivePowerModifiersDisabled && POWER_EFFECTS.has(effect)) {
    penalty += impact * 0.85;
  }
  if (flags.positiveDamageModifiersDisabled && DAMAGE_EFFECTS.has(effect)) {
    penalty += impact * 0.9;
  }
  if (flags.forceBothImmune && effect !== 'focusCoin') {
    penalty += impact * 0.55;
  }
  return penalty;
}

/**
 * Quanto un Campo migliora o peggiora una singola carta rispetto a un Campo neutro.
 * Il lato è valutato assumendo che sia lui a scegliere il Campo e quindi giochi per primo.
 */
export function evaluateCardFieldFit(state, fieldIndex, side, card) {
  const field = fieldFor(state, fieldIndex);
  if (!field || !card) {
    return { score: -1e9, cardId: card?.id ?? null, reasons: ['campo-o-carta-assente'] };
  }

  const fieldState = sideChoosesFieldState(state, fieldIndex, side);
  const neutralState = neutralFieldState(state, side);
  const fieldPlan = evaluateCardPlan(card, fieldState, side);
  const neutralPlan = evaluateCardPlan(card, neutralState, side);
  const flags = getFieldSetupFlags(field);
  const mods = getFieldModifiers(field);
  const impact = estimateAbilityImpact(card, fieldState, side);
  const trigger = card.ability?.trigger;
  const effect = card.ability?.effect;
  const reasons = [];

  let score = 0;

  const fieldForcesAllTriggers = flags.allTriggersAlwaysActive || flags.triggersIgnored;
  const fieldReady = fieldForcesAllTriggers ? true : fieldPlan.window.ready;
  const neutralReady = neutralPlan.window.ready;

  if (trigger && fieldReady && !neutralReady) {
    score += impact * (0.85 + fieldPlan.window.certainty * 0.35);
    reasons.push('attiva-trigger-spento');
  } else if (trigger && !fieldReady && neutralReady) {
    score -= impact * 0.8;
    reasons.push('spegne-trigger-attivo');
  }

  if (trigger === 'overdrive') {
    if (Number(mods.overdriveThreshold) === 4) {
      score += impact * 0.55;
      reasons.push('soglia-overdrive-ridotta');
    }
    if (mods.overdriveExtraPowerAndDamage) {
      score += impact * 0.65;
      reasons.push('bonus-overdrive-campo');
    }
  }

  if (field.tema && card.army && field.tema === card.army) {
    score += 10;
    reasons.push('tema-armata');
  }

  if (field.category === 'values') {
    score += (Number(card.power) || 0) * 0.8 + (Number(card.damage) || 0) * 0.7;
    reasons.push('campo-valori');
  }
  if (field.category === 'trigger' && trigger) {
    score += Math.min(10, impact * 0.35);
    reasons.push('campo-trigger');
  }
  if (field.category === 'focus' && effect === 'focusCoin') {
    score += Math.min(9, impact * 0.4);
    reasons.push('campo-focus');
  }

  if (flags.winnerByFocusNotVa) {
    const focus = side === 'ai' ? Number(state.aiFocus) || 0 : Number(state.playerFocus) || 0;
    const cards = Math.max(1, remainingCards(state, side).length);
    score += Math.min(12, (focus / cards) * 2.2);
    reasons.push('vittoria-per-focus');
  }
  if (flags.winnerByFinalPowerThenVa) {
    score += (Number(card.power) || 0) * 1.5;
    reasons.push('vittoria-per-potenza');
  }
  if (flags.winnerByFinalDamageThenVa) {
    score += (Number(card.damage) || 0) * 1.8;
    reasons.push('vittoria-per-danno');
  }
  if (flags.imposeDamageFromPower) {
    score += ((Number(card.power) || 0) - (Number(card.damage) || 0)) * 1.2;
    reasons.push('danno-da-potenza');
  }

  if (flags.maxPower != null && Number(card.power) > flags.maxPower) {
    score -= (Number(card.power) - flags.maxPower) * 2.2;
    reasons.push('potenza-tagliata');
  }
  if (flags.maxFinalPower != null && Number(card.power) > flags.maxFinalPower) {
    score -= (Number(card.power) - flags.maxFinalPower) * 1.5;
    reasons.push('potenza-finale-tagliata');
  }
  if (flags.maxDamage != null && Number(card.damage) > flags.maxDamage) {
    score -= (Number(card.damage) - flags.maxDamage) * 2.5;
    reasons.push('danno-tagliato');
  }

  const suppression = fieldSuppressionPenalty(card, flags, impact);
  if (suppression > 0) {
    score -= suppression;
    reasons.push('potere-limitato-dal-campo');
  }

  return {
    score,
    cardId: card.id,
    impact,
    reasons,
  };
}

function topPotential(entries) {
  if (!entries.length) return 0;
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return (
    Math.max(0, sorted[0]?.score || 0) +
    Math.max(0, sorted[1]?.score || 0) * 0.35 +
    Math.max(0, sorted[2]?.score || 0) * 0.15
  );
}

/**
 * Valuta il Campo come risorsa futura per entrambe le mani.
 */
export function evaluateFieldControl(state, fieldIndex) {
  const field = fieldFor(state, fieldIndex);
  if (!field) {
    return {
      fieldIndex,
      aiOpportunity: -1e9,
      playerThreat: 1e9,
      netControl: -1e9,
      aiFits: [],
      playerFits: [],
    };
  }

  const aiFits = remainingCards(state, 'ai').map((card) =>
    evaluateCardFieldFit(state, fieldIndex, 'ai', card)
  );
  const playerFits = remainingCards(state, 'player').map((card) =>
    evaluateCardFieldFit(state, fieldIndex, 'player', card)
  );

  const aiOpportunity = topPotential(aiFits);
  const playerThreat = topPotential(playerFits);

  return {
    fieldIndex,
    fieldId: field.id ?? null,
    aiOpportunity,
    playerThreat,
    netControl: aiOpportunity - playerThreat,
    aiBestFit: Math.max(0, ...aiFits.map((entry) => entry.score)),
    playerBestFit: Math.max(0, ...playerFits.map((entry) => entry.score)),
    aiFits: aiFits.sort((a, b) => b.score - a.score),
    playerFits: playerFits.sort((a, b) => b.score - a.score),
  };
}

/**
 * Pesi Campo: devono poter rivaleggiare con i punteggi duello (ordine ~10^3),
 * altrimenti in classic l'IA ignora sinergie/denial e diventa più debole che in Bare Hands.
 */
const FIELD_WEIGHTS = {
  easy: { denial: 10, use: 4, preserve: 6, scale: 1.25 },
  medium: { denial: 48, use: 12, preserve: 26, scale: 2.1 },
  hard: { denial: 75, use: 16, preserve: 36, scale: 2.75 },
};

/**
 * Correzione al punteggio dell'azione congiunta Campo+carta+Focus.
 * Premia la rimozione di un Campo molto utile all'avversario e penalizza lo
 * spreco di un Campo che una propria carta futura sfrutterebbe molto meglio.
 */
export function evaluateFieldSelectionAdjustment(
  state,
  fieldIndex,
  chosenCard,
  profile = {}
) {
  const assessment = evaluateFieldControl(state, fieldIndex);
  const currentFit = evaluateCardFieldFit(
    state,
    fieldIndex,
    'ai',
    chosenCard
  );
  const weights = FIELD_WEIGHTS[profile.id] || FIELD_WEIGHTS.medium;
  const reserveGap = Math.max(0, assessment.aiBestFit - Math.max(0, currentFit.score));
  const territorialUrgency =
    (state.playerFieldsConquered || 0) >= 2
      ? 1.45
      : (state.playerFieldsConquered || 0) >= 1
        ? 1.15
        : 1;

  // Se il Campo aiuta molto più il giocatore di noi, denial conta di più.
  const threatSkew =
    assessment.playerThreat > assessment.aiOpportunity + 4 ? 1.25 : 1;

  const denialScore =
    assessment.playerThreat * weights.denial * territorialUrgency * threatSkew;
  const useScore = Math.max(0, currentFit.score) * weights.use;
  const preservePenalty = reserveGap * weights.preserve;
  const raw = denialScore + useScore - preservePenalty;
  const scale = weights.scale || 1;

  const threatCardNames = (assessment.playerFits || [])
    .filter((f) => f.score > 0)
    .slice(0, 2)
    .map((f) => findCardInState(state, 'player', f.cardId)?.name)
    .filter(Boolean);

  const opportunityCardNames = (assessment.aiFits || [])
    .filter((f) => f.score > 0)
    .slice(0, 2)
    .map((f) => findCardInState(state, 'ai', f.cardId)?.name)
    .filter(Boolean);

  const bestReserve =
    (assessment.aiFits || []).find(
      (f) => f.cardId !== chosenCard?.id && f.score > Math.max(0, currentFit.score) + 0.5
    ) || null;
  const reserveCardName = bestReserve
    ? findCardInState(state, 'ai', bestReserve.cardId)?.name || null
    : null;

  return {
    score: raw * scale,
    denialScore: denialScore * scale,
    useScore: useScore * scale,
    preservePenalty: preservePenalty * scale,
    reserveGap,
    currentFit,
    assessment,
    fitReasons: currentFit.reasons || [],
    threatCardNames,
    opportunityCardNames,
    reserveCardName,
  };
}
