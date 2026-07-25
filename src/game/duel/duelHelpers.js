// ============================================
// Helper per computeDuelResolution
// ============================================

import { checkTrigger, isPostBattleTrigger } from '../triggerLogic.js';
import { ALL_AGENTS } from '../../data/cards.js';

function defaultLookupCardById(id) {
  return ALL_AGENTS.find((card) => card.id === id) ?? null;
}

export function countConqueredFields(conqueredFields, playerHand, enemyHand) {
  const playerFieldsConquered = Object.values(conqueredFields || {}).filter(
    (f) =>
      (typeof f === 'object' && f?.winner === 'player') ||
      (typeof f === 'string' && playerHand?.some((c) => c.army === f))
  ).length;
  const enemyFieldsConquered = Object.values(conqueredFields || {}).filter(
    (f) =>
      (typeof f === 'object' && f?.winner === 'enemy') ||
      (typeof f === 'string' && enemyHand?.some((c) => c.army === f))
  ).length;
  return { playerFieldsConquered, enemyFieldsConquered };
}

export function checkImmunity(agent, hasBonus, armyBonus, context) {
  if (hasBonus && armyBonus && armyBonus.effects) {
    const bonusTrigger = armyBonus.trigger;
    const bonusTriggerSatisfied = bonusTrigger ? checkTrigger(bonusTrigger, context) : true;
    if (bonusTriggerSatisfied) {
      for (const eff of armyBonus.effects) {
        if (eff.effect === 'immune') return true;
      }
    }
  }
  if (agent.ability && agent.ability.effect === 'immune') {
    const abilityTrigger = agent.ability.trigger;
    const abilityTriggerSatisfied = abilityTrigger ? checkTrigger(abilityTrigger, context) : true;
    if (abilityTriggerSatisfied) return true;
  }
  return false;
}

export function canTriggerAbility(trigger, ctx, triggersIgnored) {
  return triggersIgnored ? true : checkTrigger(trigger, ctx);
}

/**
 * Trigger carta/bonus risolvibile in blocco ③ (pre-VA).
 * Campi trigger: ignorano la condizione ma applicano lo stesso effetto subito (via checkTrigger + fieldModifiers).
 * Crocevia (triggersIgnored): tutti i trigger, inclusi Conquista/UD, solo in ③ — non si ripetono in ⑤.
 */
export function canTriggerPreBattle(trigger, ctx, { triggersIgnored = false, resolveTrigger = checkTrigger } = {}) {
  if (triggersIgnored) return true;
  if (trigger && isPostBattleTrigger(trigger)) return false;
  return resolveTrigger(trigger, ctx);
}

/** Normalizza una voce di usedCards (id numerico o oggetto carta). */
export function resolveUsedCardId(entry) {
  if (entry == null) return null;
  if (typeof entry === 'object') return entry.id ?? null;
  return entry;
}

/**
 * Chiave esito duello scoped per lato: evita che player e IA con lo stesso cardId
 * condividano winner/loser (es. entrambi Morto che Vola).
 * @param {'player'|'enemy'} side
 * @param {number|string} cardId
 */
export function battleOutcomeKey(side, cardId) {
  if (side == null || cardId == null) return null;
  return `${side}:${cardId}`;
}

/**
 * Carte giocate prima dell'agente corrente (base Attrizione).
 * `usedCards` può essere un array di id o di oggetti carta.
 */
export function countAttritionPriorCards(usedCards, currentAgentId) {
  const ids = (usedCards || []).map(resolveUsedCardId).filter((id) => id != null);
  const currentIncluded = currentAgentId != null && ids.includes(currentAgentId);
  return Math.max(0, ids.length - (currentIncluded ? 1 : 0));
}

/**
 * Quante carte della stessa Lega dell'agente corrente erano nella mano iniziale
 * (inclusa la carta giocata). Per Rinforzi serve almeno 1 oltre a quella giocata.
 * `usedCards` può essere un array di id o di oggetti carta.
 */
export function countInitialLeagueCards(usedCards, currentHand, selectedAgent, lookupCardById = defaultLookupCardById) {
  if (selectedAgent?.league == null) return 0;

  const handById = new Map();
  [...(currentHand || []), selectedAgent].filter(Boolean).forEach((card) => {
    if (card?.id != null) handById.set(card.id, card);
  });

  const resolveCard = (entry) => {
    if (entry == null) return null;
    if (typeof entry === 'object' && entry.league != null && entry.id != null) return entry;
    const id = resolveUsedCardId(entry);
    if (id == null) return null;
    return handById.get(id) ?? lookupCardById?.(id) ?? null;
  };

  const byId = new Map();
  [...(usedCards || []), ...(currentHand || []), selectedAgent]
    .filter(Boolean)
    .forEach((entry) => {
      const card = resolveCard(entry);
      if (card?.id != null) byId.set(card.id, card);
    });

  let count = 0;
  byId.forEach((card) => {
    if (card.league === selectedAgent.league) count += 1;
  });
  return count;
}
