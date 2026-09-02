// ============================================
// Parametri di composizione Potere (Frammenti)
// ============================================
//
// Il catalogo dichiara quali id sono scelti. Qui si ricavano trigger/effetto
// da quelle carte, senza nomi di Eminenza.

import { ALL_AGENTS } from '../../data/cards.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';

const OVERLAY_FIELDS = ['effect', 'value', 'minPower', 'minDamage', 'minAssault', 'minHealth', 'stat'];

function minSuffix(n) {
  return n != null ? ` (min ${n})` : '';
}

function formatEffect(ability) {
  if (!ability?.effect) return '—';
  const v = ability.value;
  switch (ability.effect) {
    case 'power': return `+${v} POT`;
    case 'enemyPower': return `${v} POT nem.${minSuffix(ability.minPower)}`;
    case 'damage': return `+${v} DAN`;
    case 'enemyDamage': return `${v} DAN nem.${minSuffix(ability.minDamage)}`;
    case 'powerAndDamage': return `+${v} POT, +${v} DAN`;
    case 'assaultValue': return `+${v} VA`;
    case 'enemyAssault': return `${v} VA nem.${minSuffix(ability.minAssault)}`;
    case 'focusCoin': return `+${v} FC`;
    case 'heal': return `Cura ${v}`;
    case 'selfDamage': return `-${v} PV (a te)`;
    case 'directDamage': return `${v} Danni dir.`;
    case 'blockAbility': return 'Blocca Potere';
    case 'blockBonus': return 'Blocca Bonus';
    case 'copyPower': return 'Copia POT';
    case 'copyDamage': return 'Copia DAN';
    case 'copyAbility': return 'Copia Potere';
    case 'copyBonus': return 'Copia Bonus';
    case 'immune': return 'Immune';
    case 'imponiPower': return 'Imponi POT';
    case 'imponiDamage': return 'Imponi DAN';
    case 'toxin': return `Tossina ${v}${minSuffix(ability.minHealth)}`;
    case 'attrition':
      return ability.stat === 'powerAndDamage'
        ? `Attrizione ${v} POT, ${v} DAN`
        : `Attrizione ${v} ${ability.stat === 'power' ? 'POT' : ability.stat === 'damage' ? 'DAN' : 'STAT'}`;
    case 'escalation':
      return ability.stat === 'powerAndDamage'
        ? `Escalation ${v} POT, ${v} DAN`
        : `Escalation ${v} ${ability.stat === 'power' ? 'POT' : ability.stat === 'damage' ? 'DAN' : 'STAT'}`;
    default: return '—';
  }
}

function formatPower(ability) {
  const trigger = ability?.trigger ? `${TRIGGER_NAMES[ability.trigger] || ability.trigger}: ` : '';
  return `${trigger}${formatEffect(ability)}`;
}

export function overlayFieldsFromAbility(ability) {
  if (!ability || typeof ability !== 'object') return null;
  const overlay = {};
  for (const key of OVERLAY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(ability, key)) overlay[key] = ability[key];
  }
  return Object.keys(overlay).length ? overlay : null;
}

function uniqueIds(ids) {
  return [...new Set(ids.filter((id) => id != null))];
}

export function fragmentIdsFromParams(params) {
  if (!params || typeof params !== 'object') return [];
  if (Array.isArray(params.fragmentCardIds) && params.fragmentCardIds.length) {
    return uniqueIds(params.fragmentCardIds);
  }
  if (Array.isArray(params.fragmentCardId) && params.fragmentCardId.length) {
    return uniqueIds(params.fragmentCardId);
  }
  if (params.fragmentCardId != null) return [params.fragmentCardId];
  return uniqueIds([params.triggerFragmentId, params.effectFragmentId]);
}

function cardOf(id) {
  return ALL_AGENTS.find((agent) => agent.id === id) || null;
}

function assignComposeRoles(ids) {
  const cards = ids.map(cardOf).filter(Boolean);
  if (cards.length === 0) return { triggerCard: null, effectCard: null };
  if (cards.length === 1) return { triggerCard: cards[0], effectCard: cards[0] };
  const first = cards[0];
  const second = cards[1];
  if (first.ability?.trigger) return { triggerCard: first, effectCard: second };
  if (second.ability?.trigger) return { triggerCard: second, effectCard: first };
  return { triggerCard: first, effectCard: second };
}

/** Completa i params UI (id Frammento + componente) nei termini che il resolver già capisce. */
export function stampComposeParams(params) {
  if (!params || typeof params !== 'object') return params;
  const ids = fragmentIdsFromParams(params);
  if (!ids.length) return params;

  const next = { ...params, fragmentCardIds: ids };
  if (ids.length === 1 && next.fragmentCardId == null) next.fragmentCardId = ids[0];

  const primary = cardOf(ids[0]);
  if (next.fragmentTrigger === undefined) {
    next.fragmentTrigger = primary?.ability?.trigger ?? null;
  }

  if (ids.length >= 2) {
    const { triggerCard, effectCard } = assignComposeRoles(ids);
    next.triggerFragmentId = triggerCard?.id ?? ids[0];
    next.effectFragmentId = effectCard?.id ?? ids[1];
    next.composedTrigger = triggerCard?.ability?.trigger ?? null;
    next.composedAbility = overlayFieldsFromAbility(effectCard?.ability);
    delete next.composeComponent;
    return next;
  }

  if (next.composeComponent === 'TRIGGER') {
    next.composedTrigger = primary?.ability?.trigger ?? null;
    delete next.composedAbility;
  } else if (next.composeComponent === 'EFFECT') {
    next.composedAbility = overlayFieldsFromAbility(primary?.ability);
    delete next.composedTrigger;
  }

  return next;
}

export function describeComposedPower(params, { allowAlias = false } = {}) {
  const stamped = stampComposeParams(params);
  if (!stamped) return null;
  const ids = fragmentIdsFromParams(stamped);
  if (!ids.length) return null;

  if (ids.length >= 2 && (stamped.composedTrigger != null || stamped.composedAbility)) {
    const text = formatPower({
      trigger: stamped.composedTrigger ?? null,
      ...(stamped.composedAbility || {}),
    });
    return `Nuovo potere: ${text}`;
  }

  if (stamped.composeComponent === 'TRIGGER' && stamped.composedTrigger) {
    const trigger = TRIGGER_NAMES[stamped.composedTrigger] || stamped.composedTrigger;
    return `Nuovo potere: ${trigger} + effetto dell'Agente schierato`;
  }

  if (stamped.composeComponent === 'EFFECT' && stamped.composedAbility) {
    return `Nuovo potere: trigger dell'Agente schierato + ${formatEffect(stamped.composedAbility)}`;
  }

  if (allowAlias && stamped.fragmentTrigger) {
    const trigger = TRIGGER_NAMES[stamped.fragmentTrigger] || stamped.fragmentTrigger;
    return `Il Potere potrà scattare anche con: ${trigger}`;
  }

  return null;
}
