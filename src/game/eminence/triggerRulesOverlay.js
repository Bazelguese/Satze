// ============================================
// EMINENZE — Overlay di regole su trigger, Poteri e Bonus
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §7
// ============================================
//
// Obiettivo esplicito della specifica: nessuna cascata di `if (eminence === '...')` dentro
// `checkTrigger`. Il motore conosce soltanto le primitive; ogni Eminenza è una configurazione
// che deposita voci in questo overlay.

import { checkTrigger as defaultCheckTrigger } from '../triggerLogic.js';
import {
  EMINENCE_PRIMITIVES as P,
  TRIGGER_SCOPES,
  SIDES,
} from './eminenceConstants.js';

/** Overlay vuoto: nessuna regola attiva. */
export function createTriggerRules() {
  return {
    // Sostituzioni valide per il solo Duello corrente. Prevalgono su quelle persistenti (§7.4).
    replacementsByCardId: {},
    // Sostituzioni che durano oltre il Duello, come il Debito della Corte Rossa.
    persistentReplacementsByCardId: {},

    aliases: [],
    forceSatisfied: [],
    forceForbidden: [],
    unblockable: [],

    custom: {},
  };
}

function cloneTriggerRules(rules) {
  return {
    replacementsByCardId: { ...rules.replacementsByCardId },
    persistentReplacementsByCardId: { ...rules.persistentReplacementsByCardId },
    aliases: [...rules.aliases],
    forceSatisfied: [...rules.forceSatisfied],
    forceForbidden: [...rules.forceForbidden],
    unblockable: [...rules.unblockable],
    custom: { ...rules.custom },
  };
}

// ------------------------------------------------------------------
// Costruzione dell'overlay a partire dalle primitive
// ------------------------------------------------------------------

function cardIdsFromParams(params) {
  if (!params) return [];
  if (Array.isArray(params.cardIds)) return params.cardIds.filter((id) => id != null);
  if (params.cardId != null) return [params.cardId];
  if (params.preyCardId != null) return [params.preyCardId];
  if (params.fragmentCardId != null) {
    return Array.isArray(params.fragmentCardId) ? params.fragmentCardId : [params.fragmentCardId];
  }
  return [];
}

function buildEntry(segment, ownerSide, source) {
  return {
    scope: segment.scope || TRIGGER_SCOPES.OWN,
    ownerSide,
    triggers: segment.triggers ? [...segment.triggers] : null,
    excludeTriggers: segment.excludeTriggers ? [...segment.excludeTriggers] : null,
    cardIds: segment.cardIds ? [...segment.cardIds] : null,
    source,
  };
}

/**
 * Deposita nell'overlay l'effetto di un singolo segmento.
 *
 * Ritorna sempre un nuovo oggetto: l'overlay è stato di round e va trattato come immutabile.
 *
 * @param {object} rules overlay corrente
 * @param {object} segment segmento dichiarato nel catalogo
 * @param {object} options
 * @param {'player'|'enemy'} options.ownerSide lato che ha attivato l'abilità
 * @param {string} options.source id abilità/statico, per tracciabilità nel log
 */
export function applyPrimitiveToTriggerRules(rules, segment, { ownerSide = SIDES.PLAYER, source = null, params = null } = {}) {
  const next = cloneTriggerRules(rules || createTriggerRules());
  const entry = buildEntry(segment, ownerSide, source ?? segment.source ?? null);

  switch (segment.primitive) {
    case P.FORCE_TRIGGER:
      next.forceSatisfied.push(entry);
      break;

    case P.FORBID_TRIGGER:
      next.forceForbidden.push(entry);
      break;

    // La soppressione della Conquista avversaria non è una categoria a sé: è un divieto
    // con ambito nemico e trigger fissato. Tenerla generica evita un ramo per Calibri.
    case P.SUPPRESS_CONQUEST:
      next.forceForbidden.push({
        ...entry,
        scope: segment.scope || TRIGGER_SCOPES.ENEMY,
        triggers: ['conquest'],
      });
      break;

    case P.UNBLOCKABLE_POWER:
      next.unblockable.push(entry);
      break;

    case P.REPLACE_TRIGGER: {
      const target = segment.persistent
        ? next.persistentReplacementsByCardId
        : next.replacementsByCardId;
      const cardIds = segment.cardIds?.length
        ? segment.cardIds
        : cardIdsFromParams(params);
      for (const cardId of cardIds) {
        target[cardId] = { trigger: segment.trigger, source: entry.source, ownerSide };
      }
      break;
    }

    case P.ALIAS_TRIGGER: {
      const map = { ...(segment.map || {}) };
      // `aliasParam` deposita l'alternativa su `*`: vale per qualunque trigger effettivo,
      // così il catalogo non deve conoscere il trigger dell'Agente al momento della scelta.
      const fromParam = segment.aliasParam ? params?.[segment.aliasParam] : null;
      if (fromParam) {
        map['*'] = [...(map['*'] || []), fromParam];
      }
      next.aliases.push({ ...entry, map });
      break;
    }

    default:
      // Le primitive non attinenti ai trigger non toccano questo overlay.
      return rules || createTriggerRules();
  }

  return next;
}

/** Applica in ordine una sequenza di segmenti già filtrati per checkpoint. */
export function buildTriggerRulesFromSegments(entries, baseRules = null) {
  let rules = baseRules ? cloneTriggerRules(baseRules) : createTriggerRules();
  for (const entry of entries || []) {
    rules = applyPrimitiveToTriggerRules(rules, entry.segment, {
      ownerSide: entry.ownerSide,
      source: entry.abilityId || entry.segment?.source || null,
    });
  }
  return rules;
}

/**
 * A fine Duello le sostituzioni temporanee decadono e quelle persistenti tornano in vigore.
 */
export function expireDuelReplacements(rules) {
  if (!rules) return createTriggerRules();
  return { ...cloneTriggerRules(rules), replacementsByCardId: {} };
}

// ------------------------------------------------------------------
// Matching
// ------------------------------------------------------------------

function scopeMatches(entry, side) {
  switch (entry.scope) {
    case TRIGGER_SCOPES.GLOBAL:
      return true;
    case TRIGGER_SCOPES.OWN:
      return side === entry.ownerSide;
    case TRIGGER_SCOPES.ENEMY:
      return side !== entry.ownerSide;
    default:
      return false;
  }
}

function entryMatches(entry, { side, effectiveTrigger, card }) {
  if (!scopeMatches(entry, side)) return false;
  if (entry.triggers && !entry.triggers.includes(effectiveTrigger)) return false;
  if (entry.excludeTriggers && entry.excludeTriggers.includes(effectiveTrigger)) return false;
  if (entry.cardIds && !entry.cardIds.includes(card?.id)) return false;
  return true;
}

function findMatch(entries, params) {
  return (entries || []).find((entry) => entryMatches(entry, params)) || null;
}

// ------------------------------------------------------------------
// Resolver
// ------------------------------------------------------------------

/**
 * Risolve lo stato completo di un trigger applicando la grammatica canonica (§7.3):
 *
 *   1. sostituzione del trigger → determina quale trigger possiede il Potere;
 *   2. modifiche normali alla condizione, incluse quelle di Campo e gli alias;
 *   3. force / forbid, con `FORBID` prevalente su `FORCE` in conflitto diretto;
 *   4. disattivazione globale del Potere/Bonus;
 *   5. blocco normale, superabile da "non può essere bloccato".
 *
 * Trigger soddisfatto non significa Potere risolto: `satisfied` e `resolves` sono distinti.
 * "Non può essere bloccato" supera il Blocca normale ma non la disattivazione globale.
 *
 * @returns {{
 *   originalTrigger: string|null, effectiveTrigger: string|null,
 *   naturalSatisfied: boolean, satisfied: boolean,
 *   forced: boolean, forbidden: boolean,
 *   disabled: boolean, blocked: boolean, unblockable: boolean,
 *   resolves: boolean, source: string|null
 * }}
 */
export function resolveTriggerState({
  originalTrigger,
  context,
  card = null,
  side = SIDES.PLAYER,
  triggerRules = null,
  powerDisabled = false,
  powerBlocked = false,
  checkTrigger = defaultCheckTrigger,
}) {
  const rules = triggerRules || createTriggerRules();

  // --- 1. Sostituzione -----------------------------------------------------
  const temporary = rules.replacementsByCardId[card?.id];
  const persistent = rules.persistentReplacementsByCardId[card?.id];
  const replacement = temporary || persistent || null;
  const effectiveTrigger = replacement ? replacement.trigger : originalTrigger;

  const match = { side, effectiveTrigger, card };

  // --- 2. Condizione naturale + alias --------------------------------------
  // Un alias aggiunge una condizione alternativa valida: non cambia il trigger posseduto
  // dal Potere né il timing della sua sorgente. `*` vale per qualunque trigger effettivo.
  let naturalSatisfied = checkTrigger(effectiveTrigger, context);
  let aliasUsed = false;

  const alias = findMatch(rules.aliases, match);
  if (!naturalSatisfied && alias) {
    const alternatives = [
      ...(alias.map?.[effectiveTrigger] || []),
      ...(alias.map?.['*'] || []),
    ];
    aliasUsed = alternatives.some((alternative) => checkTrigger(alternative, context));
    if (aliasUsed) naturalSatisfied = true;
  }

  // --- 3. Force / Forbid ---------------------------------------------------
  const forbidEntry = findMatch(rules.forceForbidden, match);
  const forceEntry = findMatch(rules.forceSatisfied, match);

  const forbidden = Boolean(forbidEntry);
  // FORBID prevale su FORCE in conflitto diretto.
  const forced = Boolean(forceEntry) && !forbidden;

  let satisfied = naturalSatisfied;
  if (forced) satisfied = true;
  if (forbidden) satisfied = false;

  // --- 4. Disattivazione globale -------------------------------------------
  const disabled = Boolean(powerDisabled);

  // --- 5. Blocco normale ---------------------------------------------------
  const unblockableEntry = findMatch(rules.unblockable, match);
  const unblockable = Boolean(unblockableEntry);
  // "Non può essere bloccato" supera il Blocca normale, ma non la disattivazione globale.
  const blocked = Boolean(powerBlocked) && !unblockable;

  const source =
    forbidEntry?.source
    ?? forceEntry?.source
    ?? replacement?.source
    ?? alias?.source
    ?? unblockableEntry?.source
    ?? null;

  return {
    originalTrigger: originalTrigger ?? null,
    effectiveTrigger: effectiveTrigger ?? null,
    naturalSatisfied,
    aliasUsed,
    satisfied,
    forced,
    forbidden,
    disabled,
    blocked,
    unblockable,
    resolves: satisfied && !disabled && !blocked,
    source,
  };
}

/**
 * Requisito di attivazione naturalmente soddisfatto, prima di force/forbid e di qualunque
 * Blocca successivo. È la lettura di cui ha bisogno Orathai per il conteggio 0/1/2 (§12.6).
 */
export function resolveActivationRequirement(params) {
  const state = resolveTriggerState(params);
  return { effectiveTrigger: state.effectiveTrigger, naturalSatisfied: state.naturalSatisfied };
}
