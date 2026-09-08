// ============================================
// EMINENZE — Risoluzione schema params (scelta / IA)
// ============================================

import { PARAM_SOURCES } from './eminenceConstants.js';
import { ALL_AGENTS } from '../../data/cards.js';

export const SCHEMA_LIMITS_KEY = '__limits';

export function paramLimits(schema, key) {
  return schema?.[SCHEMA_LIMITS_KEY]?.[key] || { min: 1, max: 1 };
}

function idsFromParam(value) {
  if (Array.isArray(value)) return value.filter((id) => id != null);
  if (value != null) return [value];
  return [];
}

function agentHasTrigger(cardId) {
  return Boolean(ALL_AGENTS.find((agent) => agent.id === cardId)?.ability?.trigger);
}

function resolveSlotIndexes(paramContext) {
  const slots = paramContext?.slots;
  if (Array.isArray(slots) && slots.length) {
    return slots.filter((slot) => !slot.conquered).map((slot) => slot.index);
  }
  const count = Math.max(1, paramContext?.slotCount || 5);
  return Array.from({ length: count }, (_, index) => index);
}

/**
 * True quando i params scelti coprono lo schema risolto.
 * Una lista dinamica vuota non è «pronta»: senza bersagli l'abilità non si conferma.
 */
export function selectionParamsReady(schema, params) {
  if (!schema) return true;
  const fragmentIds = idsFromParam(params?.fragmentCardId);
  return Object.keys(schema).every((key) => {
    if (key === SCHEMA_LIMITS_KEY) return true;
    const values = schema[key];
    if (!Array.isArray(values)) return true;
    if (values.length === 0) return false;
    if (key === 'fragmentCardId') {
      const { min, max } = paramLimits(schema, key);
      return fragmentIds.length >= min && fragmentIds.length <= max;
    }
    if (key === 'composeComponent') {
      if (fragmentIds.length >= 2) return true;
      return params?.composeComponent != null;
    }
    return params?.[key] != null;
  });
}

/** False se uno slot dinamico obbligatorio non ha candidati utilizzabili. */
export function schemaTargetsAvailable(schema, catalogSchema = null) {
  if (!schema) return true;
  return Object.keys(schema).every((key) => {
    if (key === SCHEMA_LIMITS_KEY) return true;
    if (key === 'composeComponent') return true;
    // CONFIRMED_AGENTS si riempie solo a Agenti lockati: non blocca la scelta.
    if (catalogSchema?.[key]?.source === PARAM_SOURCES.CONFIRMED_AGENTS) return true;
    const values = schema[key];
    if (!Array.isArray(values)) return true;
    if (key === 'fragmentCardId') {
      const { min } = paramLimits(schema, key);
      return values.length >= min;
    }
    return values.length > 0;
  });
}

/** Prima scelta legale per ogni chiave dello schema risolto (stub IA). */
export function pickDefaultSelectionParams(schema) {
  if (!schema) return null;
  const params = {};
  for (const key of Object.keys(schema)) {
    if (key === SCHEMA_LIMITS_KEY) continue;
    const values = schema[key];
    if (!Array.isArray(values) || !values.length) continue;
    if (key === 'fragmentCardId') {
      const { min } = paramLimits(schema, key);
      params[key] = min > 1 ? values.slice(0, min) : values[0];
      continue;
    }
    if (key === 'composeComponent') continue;
    params[key] = values[0];
  }
  return Object.keys(params).length ? params : null;
}

export function resolveParamsSchema(schema, persistent, paramContext = null) {
  if (!schema) return null;

  const resolved = {};
  for (const [key, spec] of Object.entries(schema)) {
    if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.OWN_FRAGMENTS) {
      const ids = [...(persistent?.fragmentCardIds || [])];
      resolved[key] = spec.requireTrigger ? ids.filter(agentHasTrigger) : ids;
      if (spec.min != null || spec.max != null) {
        resolved[SCHEMA_LIMITS_KEY] = {
          ...(resolved[SCHEMA_LIMITS_KEY] || {}),
          [key]: { min: spec.min ?? 1, max: spec.max ?? 1 },
        };
      }
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.ENEMY_UNDEPLOYED) {
      const alreadyPrey = new Set(persistent?.preyCardIds || []);
      resolved[key] = (paramContext?.enemyUndeployedCardIds || []).filter((id) => !alreadyPrey.has(id));
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.OWN_UNDEPLOYED) {
      resolved[key] = [...(paramContext?.ownUndeployedCardIds || [])];
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.UNDEPLOYED_AGENTS) {
      const already = new Set(Object.keys(persistent?.debitoByCardId || {}).map(Number));
      const own = paramContext?.ownUndeployedCardIds || [];
      const enemy = paramContext?.enemyUndeployedCardIds || [];
      resolved[key] = [...own, ...enemy].filter((id) => !already.has(id));
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.CONFIRMED_AGENTS) {
      resolved[key] = (paramContext?.confirmedAgents || []).map((entry) => (
        entry && typeof entry === 'object' ? entry.id : entry
      )).filter((id) => id != null);
    } else if (spec && typeof spec === 'object' && !Array.isArray(spec) && spec.source === PARAM_SOURCES.BATTLEFIELD_SLOTS) {
      resolved[key] = resolveSlotIndexes(paramContext);
    } else {
      resolved[key] = spec;
    }
  }
  return resolved;
}
