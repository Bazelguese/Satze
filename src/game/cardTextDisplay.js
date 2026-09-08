/**
 * Vista testo carta per UI: unica regola per ogni sostituzione di trigger/effetto/valore.
 * Non muta i dati di gioco — solo ciò che viene stampato su Potere / Bonus.
 */

import { TRIGGER_NAMES } from '../data/triggers.js';
import {
  applyMinFloorReductionToAbility,
  applyMinFloorReductionToEffectText,
  getFieldSetupFlags,
} from './battlefieldEffects.js';
import { resolveFieldArmyBonuses } from './battlefieldDeepEffects.js';
import { applyArmyBonusOverlay, formatArmyBonusDescription } from './eminence/eminenceDuelBinding.js';

const COPY_IMPONI_SWAP = {
  copyPower: 'imponiPower',
  imponiPower: 'copyPower',
  copyDamage: 'imponiDamage',
  imponiDamage: 'copyDamage',
};

const IMBOSCATA_INTERVENTO_SWAP = {
  imboscata: 'intervention',
  intervention: 'imboscata',
};

const TURBO_ULTIMA_SWAP = {
  turbo: 'ultimaChance',
  ultimaChance: 'turbo',
};

/** Sostituzioni trigger persistenti da entrambi i lati Eminenza. */
export function collectPersistentTriggerReplacements(matchState) {
  const merged = {};
  if (!matchState) return merged;
  for (const side of ['player', 'enemy']) {
    Object.assign(merged, matchState[side]?.persistent?.triggerReplacementsByCardId || {});
  }
  return merged;
}

/**
 * Overlay trigger per display: temporanei (duello) + persistenti (Debito, …).
 * Accetta già un triggerRules di bundle, oppure solo matchState.
 */
export function buildDisplayTriggerRules({ triggerRules = null, matchState = null } = {}) {
  const persistent = {
    ...(collectPersistentTriggerReplacements(matchState) || {}),
    ...(triggerRules?.persistentReplacementsByCardId || {}),
  };
  return {
    replacementsByCardId: { ...(triggerRules?.replacementsByCardId || {}) },
    persistentReplacementsByCardId: persistent,
  };
}

function eminenceReplacementTrigger(cardId, triggerRules) {
  if (cardId == null || !triggerRules) return null;
  const temporary = triggerRules.replacementsByCardId?.[cardId];
  const persistent = triggerRules.persistentReplacementsByCardId?.[cardId];
  return temporary?.trigger ?? persistent?.trigger ?? null;
}

function scaleNumericValue(value, factor) {
  if (value == null || factor === 1) return value;
  return value * factor;
}

function applyValueScalesToAbility(ability, fieldMods = {}) {
  if (!ability) return ability;
  let next = ability;
  let changed = false;

  const conquestFactor = fieldMods.conquestDouble && ability.trigger === 'conquest' ? 2 : 1;
  // Ultimo Desiderio ×2: in risoluzione l'effetto si applica due volte → in UI mostriamo valore ×2.
  const lastWishFactor = fieldMods.lastWishDouble && ability.trigger === 'lastWish' ? 2 : 1;
  const valueFactor = conquestFactor * lastWishFactor;

  if (valueFactor !== 1 && ability.value != null) {
    next = { ...next, value: scaleNumericValue(ability.value, valueFactor) };
    changed = true;
  }

  if (Array.isArray(ability.effects) && ability.effects.length) {
    const scaledEffects = ability.effects.map((entry) => {
      if (!entry || entry.value == null) return entry;
      const entryTrigger = entry.trigger ?? ability.trigger;
      const f =
        (fieldMods.conquestDouble && entryTrigger === 'conquest' ? 2 : 1) *
        (fieldMods.lastWishDouble && entryTrigger === 'lastWish' ? 2 : 1);
      if (f === 1) return entry;
      return { ...entry, value: scaleNumericValue(entry.value, f) };
    });
    if (scaledEffects.some((e, i) => e !== ability.effects[i])) {
      next = { ...next, effects: scaledEffects };
      changed = true;
    }
  }

  if (fieldMods.directDamageBonus && (next.effect === 'directDamage' || next.effects?.some((e) => e?.effect === 'directDamage'))) {
    if (next.effect === 'directDamage' && next.value != null) {
      next = { ...next, value: next.value + fieldMods.directDamageBonus };
      changed = true;
    }
    if (Array.isArray(next.effects)) {
      next = {
        ...next,
        effects: next.effects.map((entry) =>
          entry?.effect === 'directDamage' && entry.value != null
            ? { ...entry, value: entry.value + fieldMods.directDamageBonus }
            : entry
        ),
      };
      changed = true;
    }
  }

  return changed ? next : ability;
}

function applyValueScalesToBonus(bonus, fieldMods = {}) {
  if (!bonus) return bonus;
  const effects = Array.isArray(bonus.effects) && bonus.effects.length
    ? bonus.effects
    : bonus.effect
      ? [bonus]
      : [];
  if (!effects.length) {
    if (fieldMods.minFloorReduction) {
      const description = applyMinFloorReductionToEffectText(bonus.description, fieldMods.minFloorReduction);
      return description !== bonus.description ? { ...bonus, description } : bonus;
    }
    return bonus;
  }

  let changed = false;
  const nextEffects = effects.map((entry) => {
    if (!entry) return entry;
    let e = entry;
    const entryTrigger = entry.trigger ?? bonus.trigger;
    const conquestFactor = fieldMods.conquestDouble && entryTrigger === 'conquest' ? 2 : 1;
    const lastWishFactor = fieldMods.lastWishDouble && entryTrigger === 'lastWish' ? 2 : 1;
    const factor = conquestFactor * lastWishFactor;
    if (factor !== 1 && e.value != null) {
      e = { ...e, value: scaleNumericValue(e.value, factor) };
      changed = true;
    }
    if (fieldMods.directDamageBonus && e.effect === 'directDamage' && e.value != null) {
      e = { ...e, value: e.value + fieldMods.directDamageBonus };
      changed = true;
    }
    if (fieldMods.minFloorReduction) {
      const adj = (n) => (n != null ? Math.max(1, n - fieldMods.minFloorReduction) : n);
      if (e.minPower != null || e.minDamage != null || e.minAssault != null || e.minHealth != null) {
        e = {
          ...e,
          ...(e.minPower != null ? { minPower: adj(e.minPower) } : {}),
          ...(e.minDamage != null ? { minDamage: adj(e.minDamage) } : {}),
          ...(e.minAssault != null ? { minAssault: adj(e.minAssault) } : {}),
          ...(e.minHealth != null ? { minHealth: adj(e.minHealth) } : {}),
        };
        changed = true;
      }
    }
    return e;
  });

  if (!changed && !fieldMods.minFloorReduction) return bonus;

  const next = {
    ...bonus,
    effects: nextEffects,
  };
  // Se il bonus era in forma piatta (effect/value sulla root), allinea anche la root.
  if (!Array.isArray(bonus.effects) && bonus.effect && nextEffects[0]) {
    Object.assign(next, nextEffects[0]);
  }
  next.description = formatArmyBonusDescription(next);
  return next;
}

/**
 * Potere effettivo da stampare.
 *
 * Ordine (allineato al motore):
 * 1. overlay abilità Eminenza (COMPOSE / patch)
 * 2. sostituzione trigger Eminenza (REPLACE_TRIGGER), salvo Circuito
 * 3. sostituzioni / swap campo (Circuito, trigger invertiti, Copia↔Imponi)
 * 4. scale valori (Conquista×2, Ultimo Desiderio×2, +DAN dir. campo)
 * 5. min floor
 *
 * @param {object|null|undefined} ability
 * @param {object} [opts]
 */
export function resolveAbilityForDisplay(ability, {
  fieldMods = {},
  isFirst = true,
  card = null,
  triggerRules = null,
  abilityOverlay = null,
} = {}) {
  if (!ability && !abilityOverlay) return ability;

  let next = ability ? { ...ability } : {};
  let changed = Boolean(abilityOverlay);

  if (abilityOverlay) {
    next = { ...next, ...abilityOverlay };
  }

  const eminenceTrigger = eminenceReplacementTrigger(card?.id, triggerRules);
  const circuitActive = Boolean(fieldMods.circuitAbilityTriggers && (next.trigger || eminenceTrigger));

  if (!circuitActive && eminenceTrigger && eminenceTrigger !== next.trigger) {
    next = { ...next, trigger: eminenceTrigger };
    changed = true;
  }

  let trigger = next.trigger;
  let effect = next.effect;

  if (circuitActive && (trigger || eminenceTrigger)) {
    const circuitTrigger = isFirst ? 'sfida' : 'sopraffare';
    if (trigger !== circuitTrigger) {
      trigger = circuitTrigger;
      changed = true;
    }
  } else {
    if (fieldMods.swapImboscataIntervento && IMBOSCATA_INTERVENTO_SWAP[trigger]) {
      trigger = IMBOSCATA_INTERVENTO_SWAP[trigger];
      changed = true;
    }
    if (fieldMods.invertTurboUltimaChance && TURBO_ULTIMA_SWAP[trigger]) {
      trigger = TURBO_ULTIMA_SWAP[trigger];
      changed = true;
    }
  }

  if (fieldMods.swapCopyImponi && COPY_IMPONI_SWAP[effect]) {
    effect = COPY_IMPONI_SWAP[effect];
    changed = true;
  }

  if (changed || trigger !== ability?.trigger || effect !== ability?.effect) {
    next = { ...next, trigger, effect };
    changed = true;
  }

  const scaled = applyValueScalesToAbility(next, fieldMods);
  if (scaled !== next) {
    next = scaled;
    changed = true;
  }

  const minFloorReduction = fieldMods.minFloorReduction || 0;
  if (minFloorReduction > 0) {
    next = applyMinFloorReductionToAbility(next, minFloorReduction);
    changed = true;
  }

  return changed ? next : ability;
}

/**
 * Compat: solo flag campo (usato dai call-site già cablati).
 */
export function resolveAbilityForFieldDisplay(ability, fieldMods = {}, { isFirst = true, card = null, triggerRules = null } = {}) {
  return resolveAbilityForDisplay(ability, { fieldMods, isFirst, card, triggerRules });
}

/**
 * Bonus armata effettivo da stampare (sostituzioni campo 70/89/120, override Eminenza, ×2, min).
 */
export function resolveArmyBonusForDisplay({
  field = null,
  armyBonus = null,
  hasBonus = true,
  opponentArmyBonus = null,
  opponentHasBonus = false,
  sideState = null,
  fieldMods = null,
} = {}) {
  const mods = fieldMods || getFieldSetupFlags(field);
  const resolved = resolveFieldArmyBonuses(
    field,
    hasBonus,
    opponentHasBonus,
    armyBonus,
    opponentArmyBonus,
  );
  const overlaid = applyArmyBonusOverlay({
    hasBonus: resolved.pHasBonus,
    armyBonus: resolved.pArmyBonus,
    sideState,
  });
  let next = overlaid.armyBonus;
  if (!next) return null;

  next = applyValueScalesToBonus(next, mods);
  if (next && !next.description) {
    next = { ...next, description: formatArmyBonusDescription(next) };
  }

  // Solo se diverso dal bonus base stampato: i call-site usano effectiveArmyBonus || ARMY_BONUSES.
  if (
    !next
    || (
      armyBonus
      && next.description === armyBonus.description
      && next.trigger === armyBonus.trigger
      && JSON.stringify(next.effects || null) === JSON.stringify(armyBonus.effects || null)
    )
  ) {
    return null;
  }

  return next;
}

/** Testo compatto per Potere concesso (GRANT_POWER), senza sovrascrivere lo slot Potere. */
export function formatGrantedAbilityDisplay(granted) {
  if (!granted) return null;
  const effects = Array.isArray(granted.effects) && granted.effects.length
    ? granted.effects
    : granted.effect
      ? [granted]
      : [];
  if (!effects.length) return null;
  const body = effects
    .map((entry) => {
      if (!entry?.effect) return null;
      const v = entry.value;
      switch (entry.effect) {
        case 'power': return `+${v} POT`;
        case 'damage': return `+${v} DAN`;
        case 'powerAndDamage': return `+${v} POT, +${v} DAN`;
        case 'assaultValue': return `+${v} VA`;
        case 'focusCoin': return `+${v} FC`;
        case 'directDamage': return `${v} Danni dir.`;
        case 'heal': return `Cura ${v}`;
        case 'immune': return 'Immune';
        default: return null;
      }
    })
    .filter(Boolean)
    .join(', ');
  if (!body) return null;
  const trigger = granted.trigger ? `${TRIGGER_NAMES[granted.trigger] || granted.trigger}: ` : '';
  return `${trigger}${body}`;
}
