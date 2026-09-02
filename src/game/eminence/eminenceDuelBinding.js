// ============================================
// EMINENZE — Innesto del bundle nella pipeline del Duello
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §7, §10.2
// ============================================
//
// `duelResolve` passa `checkTrigger` per iniezione a tutti i sotto-moduli. È il punto in cui
// l'overlay entra in gioco senza che nessuno di quei moduli sappia delle Eminenze: qui si
// costruisce un `checkTrigger` che rispetta le regole depositate, altrove resta quello puro.

import { checkTrigger as baseCheckTrigger } from '../triggerLogic.js';
import { resolveTriggerState } from './triggerRulesOverlay.js';
import { SIDES } from './eminenceConstants.js';

/** Vero se l'overlay contiene almeno una regola capace di cambiare un esito. */
export function hasActiveTriggerRules(rules) {
  if (!rules) return false;
  return (
    rules.forceSatisfied.length > 0
    || rules.forceForbidden.length > 0
    || rules.aliases.length > 0
    || rules.unblockable.length > 0
    || Object.keys(rules.replacementsByCardId).length > 0
    || Object.keys(rules.persistentReplacementsByCardId).length > 0
  );
}

/**
 * `checkTrigger` consapevole dell'overlay, con la stessa firma di quello puro.
 *
 * Il lato si legge da `context.duelSide`, non dall'identità dell'oggetto: la pipeline crea
 * copie dei contesti per la fase post-Duello, e con il confronto per riferimento i trigger
 * post-battaglia dell'avversario finirebbero valutati come propri.
 *
 * Senza regole attive restituisce la funzione originale, così una partita senza Eminenze
 * percorre esattamente il codice di prima.
 */
export function bindCheckTriggerToOverlay(triggerRules, checkTrigger = baseCheckTrigger, trace = null) {
  if (!hasActiveTriggerRules(triggerRules)) return checkTrigger;

  return function checkTriggerWithOverlay(trigger, context) {
    const resolved = resolveTriggerState({
      originalTrigger: trigger,
      context,
      card: context?.card ?? null,
      side: context?.duelSide === SIDES.ENEMY ? SIDES.ENEMY : SIDES.PLAYER,
      triggerRules,
      checkTrigger,
    });
    if (trace?.aliasUsedBySide && resolved.aliasUsed) {
      const side = context?.duelSide === SIDES.ENEMY ? SIDES.ENEMY : SIDES.PLAYER;
      trace.aliasUsedBySide[side] = true;
    }
    return resolved.satisfied;
  };
}

/**
 * Applica un overlay di Potere depositato dal bundle: trigger e/o effetto temporanei
 * per il Duello corrente, senza mutare la carta nel mazzo.
 */
export function applyAbilityOverlay(agent, bundle) {
  if (!agent) return agent;
  const overlay = bundle?.abilityOverlays?.[agent.id];
  if (!overlay) return agent;

  const ability = { ...(agent.ability || {}) };
  for (const [key, value] of Object.entries(overlay)) {
    ability[key] = value;
  }
  return { ...agent, ability };
}

/**
 * Delta di statistica che il bundle impone al lato indicato, normalizzati.
 * Il bundle può arrivare da uno stato serializzato, quindi non si assume la forma completa.
 */
export function readStatDeltas(bundle, side) {
  const deltas = bundle?.statDeltas?.[side];
  return {
    power: deltas?.power || 0,
    damage: deltas?.damage || 0,
    assaultValue: deltas?.assaultValue || 0,
    league: deltas?.league || 0,
  };
}

/** FC temporanei concessi al lato in questo Duello. */
export function readTemporaryFocus(bundle, side) {
  return Math.max(0, bundle?.temporaryFocus?.[side] || 0);
}

/** Vero se il bundle chiede a quel lato di ignorare il Campo. */
export function ignoresField(bundle, side) {
  return Boolean(bundle?.ignoreFieldSides?.includes(side));
}

/** Esito del Potere per i checkpoint post-Duello (Rito, Devozione). */
export function powerResolutionFromDuel({ battleResult, playerAgent, enemyAgent } = {}) {
  const playerResolved = Boolean(battleResult?.playerAbilityTriggered) && !battleResult?.playerAbilityBlocked;
  const enemyResolved = Boolean(battleResult?.enemyAbilityTriggered) && !battleResult?.enemyAbilityBlocked;
  return {
    powerResolvedBySide: {
      [SIDES.PLAYER]: playerResolved,
      [SIDES.ENEMY]: enemyResolved,
    },
    activatedTriggerBySide: {
      [SIDES.PLAYER]: playerResolved ? (playerAgent?.ability?.trigger ?? null) : null,
      [SIDES.ENEMY]: enemyResolved ? (enemyAgent?.ability?.trigger ?? null) : null,
    },
  };
}
export function readHpDelta(bundle, side) {
  return (bundle?.hpDeltas || [])
    .filter((entry) => entry.side === side)
    .reduce((total, entry) => total + (entry.amount || 0), 0);
}

/**
 * Toglie dal bundle i delta PV già riscossi (HUD), così il Duello non li ribatte.
 */
export function consumeHpDeltas(bundle, bySide = {}) {
  if (!bundle) return bundle;
  const rest = {
    [SIDES.PLAYER]: bySide[SIDES.PLAYER] || bySide.player || 0,
    [SIDES.ENEMY]: bySide[SIDES.ENEMY] || bySide.enemy || 0,
  };
  if (!rest[SIDES.PLAYER] && !rest[SIDES.ENEMY]) return bundle;
  const hpDeltas = [];
  for (const entry of bundle.hpDeltas || []) {
    const leftover = rest[entry.side] || 0;
    if (!leftover || !entry.amount || Math.sign(entry.amount) !== Math.sign(leftover)) {
      hpDeltas.push(entry);
      continue;
    }
    if (Math.abs(leftover) >= Math.abs(entry.amount)) {
      rest[entry.side] = leftover - entry.amount;
      continue;
    }
    hpDeltas.push({ ...entry, amount: entry.amount - leftover });
    rest[entry.side] = 0;
  }
  return { ...bundle, hpDeltas };
}

/** Applica overlay sul Bonus d'Armata: forzato, soppresso, non bloccabile. */
export function applyArmyBonusOverlay({ hasBonus, armyBonus, bonusBlocked = false, sideState = null } = {}) {
  const overlay = sideState || {};
  let nextHas = hasBonus;
  let nextBonus = armyBonus;
  let nextBlocked = bonusBlocked;
  if (overlay.suppressed) nextHas = false;
  if (overlay.forcedActive) {
    nextHas = true;
    if (nextBonus) nextBonus = { ...nextBonus, trigger: null };
  }
  if (overlay.unblockable) nextBlocked = false;
  return { hasBonus: nextHas, armyBonus: nextBonus, bonusBlocked: nextBlocked };
}
