// ============================================
// Pianificatore strategico IA derivato dalla mano
// ============================================

import { getFieldModifiers } from '../battlefieldEffects.js';

const CONTROL_EFFECTS = new Set([
  'enemyPower',
  'enemyDamage',
  'enemyAssault',
  'blockAbility',
  'blockBonus',
  'copyPower',
  'copyDamage',
  'imponiPower',
  'imposePower',
  'swapPowerDamage',
]);

const POST_BATTLE_TRIGGERS = new Set(['conquest', 'lastWish']);

function usedIdSet(entries) {
  const out = new Set();
  for (const entry of entries || []) {
    const id = typeof entry === 'object' && entry != null ? entry.id : entry;
    if (id != null) out.add(id);
  }
  return out;
}

function remainingCards(source, side) {
  if (source?._refs) {
    const hand = side === 'ai' ? source._refs.aiHand : source._refs.playerHand;
    const ids = new Set(
      side === 'ai'
        ? source.aiRemainingCardIds || []
        : source.playerRemainingCardIds || []
    );
    return (hand || []).filter((card) => card && ids.has(card.id));
  }

  const sideState = side === 'ai' ? source?.ai : source?.player;
  const used = usedIdSet(sideState?.usedCardIds);
  return (sideState?.hand || []).filter(
    (card) => card && card.id != null && !used.has(card.id)
  );
}

function fullHand(source, side) {
  if (source?._refs) {
    return side === 'ai' ? source._refs.aiHand || [] : source._refs.playerHand || [];
  }
  return side === 'ai' ? source?.ai?.hand || [] : source?.player?.hand || [];
}

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function perspective(source, side = 'ai', action = null) {
  const strategic = Boolean(source?._refs);
  const actorIsAi = side === 'ai';

  const aiHP = strategic ? numeric(source.aiHP) : numeric(source?.ai?.hp);
  const playerHP = strategic ? numeric(source.playerHP) : numeric(source?.player?.hp);
  const aiFocus = strategic
    ? numeric(source.aiFocus)
    : numeric(source?.ai?.focusPool ?? source?.ai?.focus);
  const playerFocus = strategic
    ? numeric(source.playerFocus)
    : numeric(source?.player?.focusPool ?? source?.player?.focus);
  const aiFields = numeric(source?.enemyFieldsConquered);
  const playerFields = numeric(source?.playerFieldsConquered);
  const playerFirst = source?.initiativeSide
    ? source.initiativeSide === 'player'
    : source?.isPlayerFirst !== false;

  const actorUsed = strategic
    ? actorIsAi
      ? source.aiUsedCardIds || []
      : source.playerUsedCardIds || []
    : actorIsAi
      ? source?.ai?.usedCardIds || []
      : source?.player?.usedCardIds || [];
  const opponentUsed = strategic
    ? actorIsAi
      ? source.playerUsedCardIds || []
      : source.aiUsedCardIds || []
    : actorIsAi
      ? source?.player?.usedCardIds || []
      : source?.ai?.usedCardIds || [];

  const field = strategic
    ? source.currentFieldIndex != null
      ? source._refs?.battlefields?.[source.currentFieldIndex] || null
      : null
    : source?.field || null;

  return {
    side,
    round: Math.max(1, numeric(source?.roundNumber, 1)),
    actorHP: actorIsAi ? aiHP : playerHP,
    opponentHP: actorIsAi ? playerHP : aiHP,
    actorFocus: actorIsAi ? aiFocus : playerFocus,
    opponentFocus: actorIsAi ? playerFocus : aiFocus,
    actorFields: actorIsAi ? aiFields : playerFields,
    opponentFields: actorIsAi ? playerFields : aiFields,
    actorIsFirst: actorIsAi ? !playerFirst : playerFirst,
    actorWonPrevious:
      source?.lastWinner === (actorIsAi ? 'enemy' : 'player'),
    actorLostPrevious:
      source?.lastWinner === (actorIsAi ? 'player' : 'enemy'),
    actorUsedCount: usedIdSet(actorUsed).size,
    opponentUsedCount: usedIdSet(opponentUsed).size,
    actorRemainingCount: remainingCards(source, side).length,
    opponentRemainingCount: remainingCards(source, actorIsAi ? 'player' : 'ai').length,
    focusInvested: numeric(action?.focus, 0),
    field,
    fieldModifiers: getFieldModifiers(field),
    action,
  };
}

function initialLeagueCount(source, side, card) {
  if (!card) return 0;
  return fullHand(source, side).filter((entry) => entry?.league === card.league).length;
}

function forcedTriggerState(trigger, p) {
  const mods = p.fieldModifiers || {};
  if (trigger === 'glory' && mods.gloriaAlwaysActive) return true;
  if (trigger === 'vendetta' && mods.vendettaAlwaysActive) return true;
  if (trigger === 'reckoning' && mods.reckoningAlwaysActive) return true;
  if (trigger === 'rimonta' && mods.rimontaAlwaysActive) return true;
  if (trigger === 'magnanimous' && mods.magnanimoAlwaysActive) return true;
  if (trigger === 'invasione' && mods.invasioneAlwaysActive) return true;
  if (trigger === 'resistenza' && mods.resistenzaAlwaysActive) return true;
  if (trigger === 'turbo' && mods.turboAlwaysActive) return true;
  if (trigger === 'imboscata' && mods.imboscataAlwaysActive) return true;
  if (trigger === 'intervention' && mods.interventoAlwaysActive) return true;
  return false;
}

/**
 * Valore astratto dell'effetto. Non sostituisce la simulazione: serve a capire
 * quanto sia grave consumare una carta fuori dalla propria finestra utile.
 */
export function estimateAbilityImpact(card, source = null, side = 'ai') {
  const ability = card?.ability;
  if (!ability?.effect) return 0;

  const effect = ability.effect;
  const value = Math.abs(numeric(ability.value));
  const stat = ability.stat;
  const p = source ? perspective(source, side) : null;

  switch (effect) {
    case 'directDamage':
      return 7 + value * 2.8;
    case 'heal': {
      const danger = p && p.actorHP <= 7 ? 1.45 : 1;
      return (5 + value * 2.2) * danger;
    }
    case 'focusCoin': {
      const early = !p || p.actorRemainingCount >= 3 ? 1.35 : 0.7;
      return (4 + value * 2.4) * early;
    }
    case 'power':
    case 'enemyPower':
      return 4 + value * 2.1;
    case 'damage':
    case 'enemyDamage':
      return 5 + value * 2.8;
    case 'assaultValue':
    case 'enemyAssault':
      return 4 + value * 0.85;
    case 'powerAndDamage':
      return 6 + value * 4.8;
    case 'copyPower':
      return 11;
    case 'copyDamage':
      return 13;
    case 'blockAbility':
      return 12;
    case 'blockBonus':
      return 10;
    case 'protectAbility':
    case 'protectBonus':
      return 7;
    case 'imponiPower':
    case 'imposePower':
      return 14;
    case 'attrition':
    case 'escalation': {
      const statMultiplier = stat === 'powerAndDamage' ? 2 : 1;
      const rounds = p ? Math.max(1, p.round - 1) : 2;
      return 4 + Math.max(1, value) * statMultiplier * Math.min(4, rounds) * 1.8;
    }
    case 'toxin':
      return 7 + Math.max(1, value) * 3;
    default:
      return 4 + value * 1.8;
  }
}

/**
 * Legge la finestra temporale del trigger dal punto di vista del lato indicato.
 */
export function evaluateTriggerWindow(card, source, side = 'ai', action = null) {
  const trigger = card?.ability?.trigger;
  const p = perspective(source, side, action);
  const mods = p.fieldModifiers || {};
  const impact = estimateAbilityImpact(card, source, side);

  if (!trigger) {
    return {
      trigger: null,
      ready: true,
      certainty: 1,
      urgency: 0,
      preserve: 0,
      impact,
      reason: 'sempre-attivo',
    };
  }

  if (forcedTriggerState(trigger, p)) {
    return {
      trigger,
      ready: true,
      certainty: 1,
      urgency: 0.9,
      preserve: 0,
      impact,
      reason: 'forzato-dal-campo',
    };
  }

  let ready = false;
  let certainty = 1;
  let urgency = 0.45;
  let preserve = 0.35;
  let reason = 'condizione-non-pronta';

  switch (trigger) {
    case 'turbo': {
      const inverted = mods.invertTurboUltimaChance === true;
      ready = inverted ? p.round >= 5 : p.round <= 2;
      urgency = ready ? (p.round === 2 || p.round >= 5 ? 1.45 : 1.05) : 0;
      preserve = ready ? 0 : 0.05;
      reason = ready ? 'finestra-turbo' : 'turbo-scaduto';
      break;
    }
    case 'ultimaChance': {
      const inverted = mods.invertTurboUltimaChance === true;
      ready = inverted ? p.round <= 2 : p.round >= 5;
      urgency = ready ? 1.35 : 0;
      preserve = ready ? 0 : p.round >= 4 ? 1.55 : p.round === 3 ? 1.2 : 0.85;
      reason = ready ? 'finestra-ultima-chance' : 'attendere-ultima-chance';
      break;
    }
    case 'reckoning':
      ready = p.actorUsedCount + 1 >= 3 && p.opponentUsedCount + 1 >= 3;
      urgency = ready ? 1.05 : 0;
      preserve = ready ? 0 : 1.2;
      reason = ready ? 'resa-dei-conti-pronta' : 'attendere-terza-carta';
      break;
    case 'glory':
      ready = p.actorWonPrevious;
      urgency = ready ? 1.25 : 0;
      preserve = ready ? 0 : 0.9;
      reason = ready ? 'gloria-pronta' : 'serve-vittoria-precedente';
      break;
    case 'vendetta':
      ready = p.actorLostPrevious;
      urgency = ready ? 1.3 : 0;
      preserve = ready ? 0 : 1;
      reason = ready ? 'vendetta-pronta' : 'serve-sconfitta-precedente';
      break;
    case 'overdrive': {
      const threshold = numeric(mods.overdriveThreshold, 5) || 5;
      const available = action ? p.focusInvested : p.actorFocus;
      ready = available >= threshold;
      urgency = ready ? 0.85 : 0;
      preserve = ready ? 0 : p.actorFocus >= threshold ? 0.35 : 0.75;
      reason = ready ? 'overdrive-finanziato' : 'focus-insufficiente';
      break;
    }
    case 'rimonta':
      ready = p.actorHP < p.opponentHP;
      urgency = ready ? 0.9 : 0;
      preserve = ready ? 0 : 0.55;
      reason = ready ? 'rimonta-pronta' : 'rimonta-non-attiva';
      break;
    case 'magnanimous':
      ready = p.actorHP > p.opponentHP;
      urgency = ready ? 0.75 : 0;
      preserve = ready ? 0 : 0.45;
      reason = ready ? 'magnanimo-pronto' : 'magnanimo-non-attivo';
      break;
    case 'intervention': {
      const swapped = mods.swapImboscataIntervento === true;
      ready = swapped ? p.actorIsFirst : !p.actorIsFirst;
      urgency = ready ? 1.05 : 0;
      preserve = ready ? 0 : 0.75;
      reason = ready ? 'intervento-pronto' : 'serve-giocare-secondi';
      break;
    }
    case 'imboscata': {
      const swapped = mods.swapImboscataIntervento === true;
      ready = swapped ? !p.actorIsFirst : p.actorIsFirst;
      urgency = ready ? 1.05 : 0;
      preserve = ready ? 0 : 0.75;
      reason = ready ? 'imboscata-pronta' : 'serve-giocare-primi';
      break;
    }
    case 'invasione':
      ready = p.actorFields >= 1;
      urgency = ready ? 0.7 : 0;
      preserve = ready ? 0 : 0.65;
      reason = ready ? 'invasione-pronta' : 'serve-un-campo';
      break;
    case 'resistenza':
      ready = p.opponentFields >= 1;
      urgency = ready ? 0.85 : 0;
      preserve = ready ? 0 : 0.65;
      reason = ready ? 'resistenza-pronta' : 'serve-campo-avversario';
      break;
    case 'alleato':
      ready = initialLeagueCount(source, side, card) >= 2;
      urgency = ready ? 0.55 : 0;
      preserve = 0;
      reason = ready ? 'alleato-pronto' : 'alleato-assente';
      break;
    case 'rinforzi':
      ready = initialLeagueCount(source, side, card) >= 3;
      urgency = ready ? 0.65 : 0;
      preserve = 0;
      reason = ready ? 'rinforzi-pronti' : 'rinforzi-assenti';
      break;
    case 'conquest':
    case 'lastWish':
      ready = true;
      certainty = 0.7;
      urgency = 0.65;
      preserve = 0.25;
      reason = 'dipende-dallesito';
      break;
    case 'opportunista':
    case 'sfida':
    case 'sopraffare':
      ready = true;
      certainty = 0.45;
      urgency = 0.45;
      preserve = 0.3;
      reason = 'dipende-dalla-risposta';
      break;
    default:
      ready = false;
      certainty = 0.5;
      urgency = 0;
      preserve = 0.45;
      reason = 'trigger-non-modellato';
  }

  return { trigger, ready, certainty, urgency, preserve, impact, reason };
}

export function inferCardRoles(card, source, side = 'ai', action = null) {
  const ability = card?.ability || {};
  const effect = ability.effect;
  const window = evaluateTriggerWindow(card, source, side, action);
  const p = perspective(source, side, action);
  const direct = effect === 'directDamage' ? Math.abs(numeric(ability.value)) : 0;
  const potentialDamage = Math.max(0, numeric(card?.damage)) + direct;

  return {
    opener:
      ability.trigger === 'turbo' ||
      (effect === 'focusCoin' && p.actorRemainingCount >= 3),
    payoff: Boolean(ability.trigger && window.impact >= 9),
    finisher: potentialDamage >= Math.max(4, p.opponentHP),
    economy: effect === 'focusCoin',
    control: CONTROL_EFFECTS.has(effect),
    defender:
      effect === 'enemyDamage' ||
      effect === 'heal' ||
      effect === 'blockAbility' ||
      numeric(card?.power) >= 5,
    sacrifice:
      window.impact <= 4 && numeric(card?.damage) <= 2 && numeric(card?.power) <= 3,
  };
}

export function evaluateCardPlan(card, source, side = 'ai', action = null) {
  const p = perspective(source, side, action);
  const window = evaluateTriggerWindow(card, source, side, action);
  const roles = inferCardRoles(card, source, side, action);

  const base =
    numeric(card?.power) * 1.15 +
    numeric(card?.damage) * 1.45 +
    numeric(card?.league) * 0.2;

  let timingValue = 0;
  if (window.ready) {
    timingValue += window.impact * window.certainty * (0.5 + window.urgency * 0.55);
  } else {
    timingValue += window.impact * window.preserve * 0.7;
  }

  if (roles.economy && p.actorRemainingCount >= 3) timingValue += 3;
  if (roles.finisher) timingValue += 7;
  if (roles.defender && p.opponentFields >= 2) timingValue += 5;
  if (roles.sacrifice) timingValue -= 2;

  return {
    card,
    base,
    value: base + window.impact + timingValue,
    timingValue,
    window,
    roles,
  };
}

function readinessScore(plan) {
  if (!plan?.window?.trigger) return 0;
  if (plan.window.ready) {
    return plan.window.impact * plan.window.certainty * (0.45 + plan.window.urgency);
  }
  return -plan.window.impact * plan.window.preserve;
}

/**
 * Punteggio usato nel pre-ranking: evita di consumare payoff spenti e riconosce
 * le carte la cui finestra sta per chiudersi.
 */
export function scoreImmediateCardPlan(action, source, side = 'ai', profile = null) {
  const cards = remainingCards(source, side);
  const chosen = evaluateCardPlan(action?.card, source, side, action);
  const allPlans = cards.map((card) =>
    evaluateCardPlan(card, source, side, card.id === action?.card?.id ? action : null)
  );

  const bestUrgent = allPlans.reduce((best, plan) => {
    const score = plan.window.ready
      ? plan.window.impact * plan.window.certainty * plan.window.urgency
      : 0;
    return score > best ? score : best;
  }, 0);
  const chosenUrgent = chosen.window.ready
    ? chosen.window.impact * chosen.window.certainty * chosen.window.urgency
    : 0;

  const planningWeight = profile?.futurePlanningWeight ?? 0.7;
  let score = readinessScore(chosen) * 0.8;

  if (bestUrgent > chosenUrgent + 4) {
    score -= (bestUrgent - chosenUrgent) * 0.65;
  }
  if (chosen.roles.opener && chosen.window.ready) score += 5;
  if (chosen.roles.economy && chosen.window.ready) score += 4;
  // Non premiare il fodder di payoff fuori finestra (es. Ultima Chance in R1)
  if (!chosen.window.ready && (chosen.window.preserve || 0) >= 0.75) {
    score -= chosen.window.impact * chosen.window.preserve * 0.55;
  }

  return {
    score: score * planningWeight,
    chosen,
    bestUrgent,
    chosenUrgent,
  };
}

function setupChainValue(cards, source, side, trigger) {
  let total = 0;
  for (const card of cards) {
    if (card?.ability?.trigger !== trigger) continue;
    total += estimateAbilityImpact(card, source, side);
  }
  return total;
}

/**
 * Valuta la qualità strategica delle mani residue nello stato proiettato.
 */
export function evaluateRemainingHandPlan(state, profile = {}) {
  const futureWeight = profile.futurePlanningWeight ?? 0.7;
  const aiCards = remainingCards(state, 'ai');
  const playerCards = remainingCards(state, 'player');
  const aiPlans = aiCards.map((card) => evaluateCardPlan(card, state, 'ai'));
  const playerPlans = playerCards.map((card) => evaluateCardPlan(card, state, 'player'));

  const aiValue = aiPlans.reduce((sum, plan) => sum + plan.value, 0);
  const playerValue = playerPlans.reduce((sum, plan) => sum + plan.value, 0);

  let triggerScore = 0;
  for (const plan of aiPlans) triggerScore += readinessScore(plan) * 18;
  for (const plan of playerPlans) triggerScore -= readinessScore(plan) * 14;

  // La sconfitta prepara Vendetta e dà iniziativa/Imboscata; la vittoria prepara
  // Gloria e normalmente lascia l'IA seconda, quindi Intervento.
  const aiPerspective = perspective(state, 'ai');
  let initiativeScore = 0;
  if (aiPerspective.actorLostPrevious) {
    initiativeScore += setupChainValue(aiCards, state, 'ai', 'vendetta') * 16;
  }
  if (aiPerspective.actorWonPrevious) {
    initiativeScore += setupChainValue(aiCards, state, 'ai', 'glory') * 15;
  }
  if (aiPerspective.actorIsFirst) {
    initiativeScore += setupChainValue(aiCards, state, 'ai', 'imboscata') * 10;
  } else {
    initiativeScore += setupChainValue(aiCards, state, 'ai', 'intervention') * 10;
  }

  // Sinergia Focus: le carte economiche valgono di più se resta un payoff Overdrive.
  const economy = aiCards.filter((card) => card?.ability?.effect === 'focusCoin').length;
  const overdriveImpact = setupChainValue(aiCards, state, 'ai', 'overdrive');
  const synergyScore = economy > 0 && overdriveImpact > 0 ? economy * overdriveImpact * 6 : 0;

  return {
    handScore: (aiValue - playerValue * 0.85) * 4.5 * futureWeight,
    triggerScore: triggerScore * futureWeight,
    initiativeScore: initiativeScore * futureWeight,
    synergyScore: synergyScore * futureWeight,
    aiPlans,
    playerPlans,
  };
}

export function isOutcomeDependentTrigger(card) {
  return POST_BATTLE_TRIGGERS.has(card?.ability?.trigger);
}
