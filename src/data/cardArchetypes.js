// ============================================
// SISTEMA ARCHETIPI SATZE v3.3
// Fonte: Documentazione/SISTEMA_ARCHETIPI_v3.md
// Archetipo [/ Secondario] · Rapporto col Focus [· Scalante]
// ============================================

import { ARMY_SETS } from './cards.js';

export const ARCHETYPES = [
  'Campione',
  'Assaltatore',
  'Soffocatore',
  'Sabotatore',
  'Carnefice',
  'Guardiano',
  'Catalizzatore',
  'Colosso',
];

export const FOCUS_RELATIONS = [
  'Vorace',
  'Predatore',
  'Indifferente',
  'Prodigo',
];

export const ARCHETYPE_SET = new Set(ARCHETYPES);
export const FOCUS_RELATION_SET = new Set(FOCUS_RELATIONS);

/** Archetipi per cui il badge Focus è rilevante in UI (varia). */
export const FOCUS_VISIBLE_ARCHETYPES = new Set([
  'Campione',
  'Assaltatore',
  'Soffocatore',
]);

/** Tooltip / glossario breve — contributo al piano di gioco */
export const ARCHETYPE_DESCRIPTIONS = {
  Campione: 'Vince lo scontro corrente potenziando o preservando la propria efficacia combattiva.',
  Assaltatore: 'Trasforma la vittoria in una conseguenza più pesante sui PV nemici.',
  Soffocatore: "Riduce la capacità numerica dell'avversario di vincere lo scontro.",
  Sabotatore: 'Interviene sul livello delle abilità: blocca o copia Poteri e Bonus, mai i numeri.',
  Carnefice: 'Sottrae PV senza dipendere interamente dal DAN normale dello scontro.',
  Guardiano: 'Protegge i PV o riduce le conseguenze della sconfitta.',
  Catalizzatore: 'Genera o recupera risorse (FC) che alimentano le giocate successive.',
  Colosso: 'Il Potere è un costo puro: il beneficio acquistato è il corpo della carta.',
};

/** Tooltip — rapporto del Potere coi Focus Coin */
export const FOCUS_DESCRIPTIONS = {
  Vorace: 'Il rendimento cresce con i FC che investi tu. Per esprimersi vuole essere finanziata.',
  Predatore: "Il rendimento cresce con i FC dell'avversario. Punisce la puntata alta altrui.",
  Indifferente: 'Il rendimento non cambia in base ai FC di nessuno.',
  Prodigo: 'Genera o restituisce Focus Coin.',
};

export const SCALANTE_DESCRIPTION =
  'Aumenta il proprio valore con il progresso della partita (Attrizione o Escalation). Al turno 1 vale solo il corpo.';

export const LABEL_TOOLTIPS = {
  ...ARCHETYPE_DESCRIPTIONS,
  ...FOCUS_DESCRIPTIONS,
  Scalante: SCALANTE_DESCRIPTION,
};

// Mediane POT/DAN per Lega — congelate (v3.3). Non ricalcolare a ogni espansione.
const MEDIAN = {
  2: [3, 2],
  3: [4, 2],
  4: [5, 3],
  5: [5.5, 3.5],
};

const MAP_EFFECT = {
  copyDamage: 'Assaltatore',
  damage: 'Assaltatore',
  powerAndDamage: 'Assaltatore',
  assaultValue: 'Campione',
  copyPower: 'Campione',
  immune: 'Campione',
  power: 'Campione',
  directDamage: 'Carnefice',
  toxin: 'Carnefice',
  focusCoin: 'Catalizzatore',
  selfDamage: 'Colosso',
  enemyDamage: 'Guardiano',
  heal: 'Guardiano',
  imponiDamage: 'Guardiano',
  blockAbility: 'Sabotatore',
  blockBonus: 'Sabotatore',
  copyAbility: 'Sabotatore',
  copyBonus: 'Sabotatore',
  inversion: 'Sabotatore',
  enemyAssault: 'Soffocatore',
  enemyPower: 'Soffocatore',
  enemyPowerAndDamage: 'Soffocatore',
  imponiPower: 'Soffocatore',
};

const MAP_STAT = {
  power: 'Campione',
  assaultValue: 'Campione',
  damage: 'Assaltatore',
  powerAndDamage: 'Assaltatore',
  directDamage: 'Carnefice',
};

const MAP_ECONOMY = {
  copyPower: 'Vorace',
  power: 'Vorace',
  powerAndDamage: 'Vorace',
  enemyPower: 'Predatore',
  enemyPowerAndDamage: 'Predatore',
  imponiPower: 'Predatore',
  focusCoin: 'Prodigo',
};

const SCALING = new Set(['attrition', 'escalation']);

/**
 * Override espliciti dell'archetipo primario (eccezioni al MAP_EFFECT).
 * Vor-Em: corpo è il contributo reale; Imponi DAN resta sul testo ma non guida la classe.
 */
const ARCHETYPE_PRIMARY_OVERRIDES = {
  1006: 'Colosso', // Vor-Em, colui che può sapere
};

let cardByIdCache = null;

function getCardById(cardId) {
  if (!cardByIdCache) {
    cardByIdCache = new Map();
    for (const cards of Object.values(ARMY_SETS)) {
      for (const card of cards) {
        cardByIdCache.set(card.id, card);
      }
    }
  }
  return cardByIdCache.get(cardId) ?? null;
}

function abilityOf(card) {
  return card?.ability || null;
}

function derivationKey(ability) {
  if (!ability?.effect) return null;
  return SCALING.has(ability.effect) ? ability.stat : ability.effect;
}

/** Archetipo primario dal Potere stampato (bonus armata escluso). */
export function getArchetype(card) {
  if (!card) return null;
  if (card.id != null && ARCHETYPE_PRIMARY_OVERRIDES[card.id]) {
    return ARCHETYPE_PRIMARY_OVERRIDES[card.id];
  }
  const ability = abilityOf(card);
  if (!ability?.effect) return null;
  if (SCALING.has(ability.effect)) {
    return MAP_STAT[ability.stat] || null;
  }
  return MAP_EFFECT[ability.effect] || null;
}

/** Rapporto col Focus: Vorace / Predatore / Indifferente / Prodigo. */
export function getEconomy(card) {
  const ability = abilityOf(card);
  const key = derivationKey(ability);
  if (!key) return null;
  return MAP_ECONOMY[key] ?? 'Indifferente';
}

/** Alias esplicito per UI/filtri. */
export function getFocusRelation(card) {
  return getEconomy(card);
}

export function isScaling(card) {
  const ability = abilityOf(card);
  return Boolean(ability && SCALING.has(ability.effect));
}

/**
 * Archetipo secondario (flag opzionale).
 * a) effetto a doppia componente
 * b) corpo notevole vs mediana di Lega (soglia -1 per Colosso)
 */
export function getSecondaryArchetype(card) {
  if (!card) return null;
  const primary = getArchetype(card);
  if (!primary) return null;

  const ability = abilityOf(card);
  const key = derivationKey(ability);
  const medians = MEDIAN[card.league];
  if (!medians) return null;
  const [medPow, medDam] = medians;

  if (key === 'powerAndDamage') return 'Campione';
  if (key === 'enemyPowerAndDamage') return 'Guardiano';

  const delta = primary === 'Colosso' ? 1 : 2;
  const bigPow = card.power >= medPow + delta;
  const bigDam = card.damage >= medDam + delta;

  if (primary === 'Colosso' && bigPow && bigDam) {
    // Parità: vince Campione (POT decide se il DAN arriva)
    return (card.power - medPow) >= (card.damage - medDam) ? 'Campione' : 'Assaltatore';
  }
  if (bigDam && !['Assaltatore', 'Carnefice'].includes(primary)) return 'Assaltatore';
  if (bigPow && primary !== 'Campione') return 'Campione';
  return null;
}

export function getCardClassification(card) {
  if (!card) {
    return {
      archetype: null,
      secondary: null,
      focus: null,
      scaling: false,
    };
  }
  return {
    archetype: getArchetype(card),
    secondary: getSecondaryArchetype(card),
    focus: getFocusRelation(card),
    scaling: isScaling(card),
  };
}

export function getCardClassificationById(cardId) {
  return getCardClassification(getCardById(cardId));
}

/** True se il badge Focus va mostrato sulla carta (solo dove varia). */
export function shouldShowFocusBadge(archetype) {
  return FOCUS_VISIBLE_ARCHETYPES.has(archetype);
}

/**
 * Etichette per UI sulla carta (gerarchia doc §9).
 * Archetipo obbligatorio; secondario; Focus solo se rilevante; Scalante.
 */
export function getCardDisplayLabels(cardOrId) {
  const card = typeof cardOrId === 'object' && cardOrId != null
    ? cardOrId
    : getCardById(cardOrId);
  const { archetype, secondary, focus, scaling } = getCardClassification(card);
  const labels = [];
  if (archetype) {
    labels.push({
      text: archetype,
      kind: 'archetype',
      title: ARCHETYPE_DESCRIPTIONS[archetype],
    });
  }
  if (secondary) {
    labels.push({
      text: secondary,
      kind: 'secondary',
      title: ARCHETYPE_DESCRIPTIONS[secondary],
    });
  }
  if (focus && shouldShowFocusBadge(archetype)) {
    labels.push({
      text: focus,
      kind: 'focus',
      title: FOCUS_DESCRIPTIONS[focus],
    });
  }
  if (scaling) {
    labels.push({
      text: 'Scalante',
      kind: 'scaling',
      title: SCALANTE_DESCRIPTION,
    });
  }
  return labels;
}

/**
 * Lista piatta per ricerca/filtri compat: include sempre focus e scalante nei dati.
 * Per UI preferire getCardDisplayLabels.
 */
export function getCardLabels(cardOrId) {
  const card = typeof cardOrId === 'object' && cardOrId != null
    ? cardOrId
    : getCardById(cardOrId);
  const { archetype, secondary, focus, scaling } = getCardClassification(card);
  const labels = [];
  if (archetype) labels.push(archetype);
  if (secondary) labels.push(secondary);
  if (focus) labels.push(focus);
  if (scaling) labels.push('Scalante');
  return labels;
}

export function isArchetypeLabel(label) {
  return ARCHETYPE_SET.has(label);
}

export function isFocusLabel(label) {
  return FOCUS_RELATION_SET.has(label);
}

/** Badge prominente = Archetipo primario. */
export function shouldShowAsArchetype(label) {
  return isArchetypeLabel(label);
}

// --- Compat v3.0 (profilo operativo abbandonato) ---

/** @deprecated Usare getFocusRelation / isScaling */
export function getProfile(card) {
  if (isScaling(card)) return 'Scalante';
  return getFocusRelation(card);
}

export const PROFILES = FOCUS_RELATIONS;
export const PROFILE_SET = FOCUS_RELATION_SET;
export const PROFILE_DESCRIPTIONS = FOCUS_DESCRIPTIONS;
export const isProfileLabel = isFocusLabel;
