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
export function bindCheckTriggerToOverlay(triggerRules, checkTrigger = baseCheckTrigger) {
  if (!hasActiveTriggerRules(triggerRules)) return checkTrigger;

  return function checkTriggerWithOverlay(trigger, context) {
    return resolveTriggerState({
      originalTrigger: trigger,
      context,
      side: context?.duelSide === SIDES.ENEMY ? SIDES.ENEMY : SIDES.PLAYER,
      triggerRules,
      checkTrigger,
    }).satisfied;
  };
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

/** Somma dei delta PV richiesti dal bundle per un lato. */
export function readHpDelta(bundle, side) {
  return (bundle?.hpDeltas || [])
    .filter((entry) => entry.side === side)
    .reduce((total, entry) => total + (entry.amount || 0), 0);
}
