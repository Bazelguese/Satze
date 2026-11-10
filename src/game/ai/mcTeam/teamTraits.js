// ============================================
// 2v2: personalità (tratti) ↔ profili dei posti
// ============================================
//
// Nel 2v2 locale i posti IA usano il motore a simulazione con un tratto (mcTraits.js).
// Il profilo precedente del posto (seatAI.js) resta per il ripiego, il ritmo di "pensiero"
// e le frasi del compagno; la fiducia nei consigli dipende dal tratto.

import { MC_TRAITS, getMcTrait, resolveTraitChoice } from '../mc/mcTraits.js';
import { SEAT_AI_PROFILES } from '../../multiSeat/seatAI.js';

const LEGACY_PROFILE_FOR_TRAIT = {
  neutral: 'equilibrato',
  impetuoso: 'aggressivo',
  paziente: 'prudente',
  conquistatore: 'equilibrato',
  spietato: 'aggressivo',
  avaro: 'prudente',
  temerario: 'aggressivo',
};

/** Probabilità che il compagno segua un consiglio del giocatore. */
const TRUST_FOR_TRAIT = {
  neutral: 0.7,
  impetuoso: 0.5,
  paziente: 0.8,
  conquistatore: 0.65,
  spietato: 0.5,
  avaro: 0.75,
  temerario: 0.45,
};

const TRAIT_FOR_LEGACY_PROFILE = {
  equilibrato: 'neutral',
  aggressivo: 'impetuoso',
  prudente: 'paziente',
  calcolatore: 'neutral',
  casuale: 'neutral',
};

/** Compagni proponibili nel 2v2: Neutrale e i tratti. */
export const TEAMMATE_TRAIT_IDS = Object.keys(MC_TRAITS);

export function legacyProfileForTrait(traitId) {
  return LEGACY_PROFILE_FOR_TRAIT[traitId] || 'equilibrato';
}

export function trustForTrait(traitId) {
  return TRUST_FOR_TRAIT[traitId] ?? 0.65;
}

/**
 * Tratto del compagno da una scelta del menu: un tratto, oppure un vecchio preset salvato.
 * @param {string|null|undefined} choice
 */
export function teammateTraitFromChoice(choice) {
  if (MC_TRAITS[choice]) return choice;
  if (SEAT_AI_PROFILES[choice]) return TRAIT_FOR_LEGACY_PROFILE[choice] || 'neutral';
  return 'neutral';
}

/**
 * Tratti degli avversari: la scelta del menu vale per tutti; "Casuale" estrae un tratto per
 * ciascuno.
 * @param {string|null|undefined} choice
 * @param {number} count
 * @param {() => number} rng
 */
export function opponentTraits(choice, count, rng) {
  return Array.from({ length: count }, () => resolveTraitChoice(choice, rng));
}

/** Nomi segnaposto dei posti IA per tratto: «PNG Impetuoso»; ripetuti numerati (1, 2…). */
export function npcTraitNames(traitIds) {
  const bases = traitIds.map((id) => `PNG ${getMcTrait(id).name}`);
  const total = {};
  for (const n of bases) total[n] = (total[n] || 0) + 1;
  const seen = {};
  return bases.map((n) => {
    if (total[n] === 1) return n;
    seen[n] = (seen[n] || 0) + 1;
    return `${n} ${seen[n]}`;
  });
}
