// ============================================
// Caratteristiche di una mossa per la politica addestrata
// ============================================
//
// Numeri economici da calcolare (niente risoluzione del duello), dal punto di vista di chi
// decide (lato `enemy`). La politica addestrata li combina con pesi imparati in autogioco
// (scripts/ai-train-policy.mjs). Se cambia l'elenco, i pesi vanno riaddestrati:
// MC_FEATURE_NAMES fa parte del file dei pesi e viene controllato al caricamento.

import { availableCards, legalFocusRange } from '../../sim/headlessMatch.js';
import { countConqueredFields } from '../../duel/duelHelpers.js';

export const MC_FEATURE_NAMES = [
  'bias',
  'power',
  'damage',
  'league',
  'hasAbility',
  'abilityReady',
  'abilityWasted',
  'directDamageReady',
  'focusRatio',
  'focusRatioSq',
  'focusShareOfPool',
  'lastCard',
  'strengthRank',
  'respond',
  'respondMargin',
  'respondWins',
  'respondAssault',
  'respondStopsDamage',
  'leadPower',
  'leadFocusRatio',
  'hpDiffXFocus',
  'lethal',
  'fieldDiffXPower',
  'roundXFocus',
  'threatXFocus',
  'lowHpXFocus',
];

function clip(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function strength(card) {
  return (card?.power || 0) * 1.2 + (card?.damage || 0);
}

/**
 * Condizione del Potere soddisfatta adesso (approssimazione economica di checkTrigger).
 * 1 = sì, 0 = no, 0.5 = dipende da cose non ancora note (esito, risposta avversaria).
 */
export function cheapTriggerReady(card, view, ctx) {
  const trigger = card?.ability?.trigger;
  if (!trigger) return 1;
  switch (trigger) {
    case 'imboscata':
      return ctx.isFirst ? 1 : 0;
    case 'intervention':
      return ctx.isFirst ? 0 : 1;
    case 'glory':
      return view.lastWinner === 'enemy' ? 1 : 0;
    case 'vendetta':
      return view.lastWinner === 'player' ? 1 : 0;
    case 'reckoning':
      return ctx.ownUsed >= 2 && ctx.oppUsed >= 2 ? 1 : 0;
    case 'alleato':
      return ctx.sameLeague(card) >= 2 ? 1 : 0;
    case 'rinforzi':
      return ctx.sameLeague(card) >= 3 ? 1 : 0;
    case 'resistenza':
      return ctx.oppFields >= 1 ? 1 : 0;
    case 'invasione':
      return ctx.ownFields >= 1 ? 1 : 0;
    case 'rimonta':
      return view.enemyHP < view.playerHP ? 1 : 0;
    case 'magnanimous':
      return view.enemyHP > view.playerHP ? 1 : 0;
    case 'turbo':
      return ctx.round <= 2 ? 1 : 0;
    case 'ultimaChance':
      return ctx.round >= 5 ? 1 : 0;
    case 'sfida':
      return ctx.visible ? ((card.league || 0) < (ctx.visible.league || 0) ? 1 : 0) : 0.5;
    case 'sopraffare':
      return ctx.visible ? ((card.league || 0) > (ctx.visible.league || 0) ? 1 : 0) : 0.5;
    case 'debt':
      return 1;
    default:
      // overdrive dipende dai FC (vedi sotto); conquest, lastWish, opportunista: dall'esito.
      return 0.5;
  }
}

/** Contesto condiviso fra le mosse di una stessa decisione. */
export function buildFeatureContext(view) {
  const cards = availableCards(view, 'enemy');
  const { pool, maxFocus, cardsRemaining } = legalFocusRange(view, 'enemy');
  const fair = Math.max(1, Math.round(pool / Math.max(1, cardsRemaining)));
  const { playerFieldsConquered, enemyFieldsConquered } = countConqueredFields(
    view.conqueredFields,
    view.playerHand,
    view.enemyHand
  );
  const visible = view.selectedAgent || null;
  const oppPool = legalFocusRange(view, 'player');
  const oppFair = Math.max(1, Math.round(oppPool.pool / Math.max(1, oppPool.cardsRemaining)));
  const ranked = [...cards].sort((a, b) => strength(b) - strength(a));
  const leagueCount = new Map();
  for (const c of view.enemyHand || []) leagueCount.set(c.league, (leagueCount.get(c.league) || 0) + 1);
  return {
    cards,
    pool: Math.max(1, pool),
    maxFocus,
    remaining: cardsRemaining,
    fair,
    round: Math.max(1, Number(view.roundNumber) || 1),
    isFirst: view.isPlayerFirst === false,
    ownFields: enemyFieldsConquered,
    oppFields: playerFieldsConquered,
    ownUsed: (view.enemyUsedCards || []).length,
    oppUsed: (view.playerUsedCards || []).length,
    visible,
    visibleAssault: visible ? (visible.power || 0) * oppFair : 0,
    rankOf: (card) => ranked.findIndex((c) => c.id === card.id),
    sameLeague: (card) => leagueCount.get(card.league) || 0,
  };
}

/**
 * @param {object} view
 * @param {object} card
 * @param {number} focus
 * @param {ReturnType<typeof buildFeatureContext>} ctx
 * @returns {number[]} nell'ordine di MC_FEATURE_NAMES
 */
export function moveFeatures(view, card, focus, ctx) {
  const power = card.power || 0;
  const damage = card.damage || 0;
  const hasAbility = card.ability?.trigger ? 1 : 0;
  let ready = cheapTriggerReady(card, view, ctx);
  if (card.ability?.trigger === 'overdrive') ready = focus >= 5 ? 1 : 0;
  const focusRatio = focus / ctx.fair;
  const respond = ctx.visible ? 1 : 0;
  const assault = power * focus;
  const margin = respond
    ? clip((assault - ctx.visibleAssault) / Math.max(1, ctx.visibleAssault), -1, 1)
    : 0;
  const wins = respond && assault > ctx.visibleAssault ? 1 : 0;
  const rank = ctx.remaining > 1 ? ctx.rankOf(card) / (ctx.remaining - 1) : 0;
  const hpDiff = ((Number(view.enemyHP) || 0) - (Number(view.playerHP) || 0)) / 25;
  const lethal = damage >= (Number(view.playerHP) || 0) ? 1 : 0;
  return [
    1,
    power / 6,
    damage / 6,
    (card.league || 0) / 5,
    hasAbility,
    hasAbility * ready,
    hasAbility * (1 - ready),
    card.ability?.effect === 'directDamage' ? ready : 0,
    focusRatio,
    focusRatio * focusRatio,
    focus / ctx.pool,
    ctx.remaining <= 1 ? 1 : 0,
    rank,
    respond,
    margin,
    wins,
    respond ? ctx.visibleAssault / 30 : 0,
    respond ? wins * ((ctx.visible.damage || 0) / 6) : 0,
    respond ? 0 : power / 6,
    respond ? 0 : focusRatio,
    hpDiff * focusRatio,
    lethal,
    ((ctx.ownFields - ctx.oppFields) / 3) * (power / 6),
    (ctx.round / 5) * focusRatio,
    ctx.oppFields >= 2 ? focusRatio : 0,
    (Number(view.enemyHP) || 0) <= 8 ? focusRatio : 0,
  ];
}

export function dot(weights, features) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) sum += (weights[i] || 0) * features[i];
  return sum;
}
