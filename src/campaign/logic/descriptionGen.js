// ============================================
// Generatore della description del Nascente
// Template + glossario: nessuna stringa hardcoded per combinazione.
// Formato del pool (cards.js):
//   "Potere: Turbo: +2 POT"
//   "Potere: Imboscata: 3 Danni dir."
//   "Potere: Vendetta: +2 FC"
//   "Potere: Invasione: -3 POT nem. (min 2)"
// ============================================

import { TRIGGER_NAMES } from '../../data/triggers.js';

/** Template di testo per ciascun effetto della matrice 4×4. */
const EFFECT_TEMPLATES = {
  power: (v) => `+${v} POT`,
  directDamage: (v) => `${v} Danni dir.`,
  focusCoin: (v) => `+${v} FC`,
  enemyPower: (v, min) => `-${v} POT nem. (min ${min})`,
};

/**
 * Produce la description della carta evolutiva.
 * @param {{trigger: string|null, effect: string|null, value: number}} n
 * @param {number} [enemyPowerMin=2]
 * @returns {string} description nel formato del pool; stringa vuota se nuda
 */
export function generateNascenteDescription(n, enemyPowerMin = 2) {
  if (!n.trigger || !n.effect) return '';
  const triggerLabel = TRIGGER_NAMES[n.trigger];
  const template = EFFECT_TEMPLATES[n.effect];
  if (!triggerLabel || !template) return '';
  return `Potere: ${triggerLabel}: ${template(n.value, enemyPowerMin)}`;
}
