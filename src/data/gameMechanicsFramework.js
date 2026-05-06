// ============================================
// FRAMEWORK — Trigger ed effetti supportati dal motore
// ============================================
// Tabella di riferimento unica per dati (carte, bonus, artefatti) e per validazione.
// I nomi in TRIGGER_KEYS coincidono con `checkTrigger` in `src/game/triggerLogic.js`
// e con `TRIGGER_NAMES` / `TRIGGER_DESCRIPTIONS` in `src/data/triggers.js`.

import { TRIGGER_NAMES, TRIGGER_DESCRIPTIONS } from './triggers.js';

/** @readonly Trigger attesi dal motore (chiavi `ability.trigger` / `bonus.trigger`) */
export const TRIGGER_KEYS = [
  'imboscata',
  'intervention',
  'glory',
  'vendetta',
  'rimonta',
  'overdrive',
  'reckoning',
  'magnanimous',
  'lastWish',
  'conquest',
  'opportunista',
  'sfida',
  'sopraffare',
  'invasione',
  'resistenza',
  'turbo',
  'ultimaChance',
  'rinforzi',
];

/** @readonly Effetti potere/bonus gestiti da `duelApplyEffect` e affini */
export const EFFECT_KEYS = [
  'power',
  'damage',
  'enemyPower',
  'enemyDamage',
  'enemyPowerAndDamage',
  'imponiPower',
  'imponiDamage',
  'assaultValue',
  'enemyAssault',
  'copyPower',
  'copyDamage',
  'copyAbility',
  'copyBonus',
  'blockAbility',
  'blockBonus',
  'immune',
  'focusCoin',
  'heal',
  'selfDamage',
  'directDamage',
  'powerAndDamage',
  'escalation',
  'attrition',
  'inversion',
  'toxin',
];

/** Migrazione nomi trigger (solo documentazione / tooling) */
export const TRIGGER_KEY_MIGRATION = {
  turbo: 'imboscata',
  ambush: 'vendetta',
  vendetta: 'rimonta',
  turboRound: 'turbo',
};

export function isKnownTriggerKey(key) {
  return key != null && TRIGGER_KEYS.includes(key);
}

export function isKnownEffectKey(key) {
  return key != null && EFFECT_KEYS.includes(key);
}

/**
 * @param {{ trigger?: string|null, effect: string, value?: number|null, stat?: string, minDamage?: number, minPower?: number, minAssault?: number, minHealth?: number }} ability
 */
export function validateAbilityShape(ability) {
  const issues = [];
  if (!ability || typeof ability.effect !== 'string') {
    issues.push('ability.effect obbligatorio');
    return issues;
  }
  if (ability.trigger != null && ability.trigger !== '' && !isKnownTriggerKey(ability.trigger)) {
    issues.push(`trigger sconosciuto: ${ability.trigger}`);
  }
  if (!isKnownEffectKey(ability.effect)) {
    issues.push(`effect sconosciuto: ${ability.effect}`);
  }
  return issues;
}

/** Riga tabella: trigger → nome UI + condizione */
export function getTriggerFrameworkRows() {
  return TRIGGER_KEYS.map((key) => ({
    key,
    label: TRIGGER_NAMES[key] || key,
    condition: TRIGGER_DESCRIPTIONS[key] || '',
  }));
}
