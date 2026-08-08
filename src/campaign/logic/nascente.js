// ============================================
// IL NASCENTE — carta evolutiva della campagna
// Spec: SPEC_PROTOTIPO_CAMPAGNA_CURSOR §4
//
// La carta vive nello stato della run (id riservato 9001) e viene
// assemblata al volo: NON esiste in cards.js e non deve entrarci.
// Lega e stadio visivo sono SEMPRE derivati, mai memorizzati come verità.
// ============================================

import { generateNascenteDescription } from './descriptionGen.js';

/** ID riservato della carta evolutiva: non esiste in cards.js. */
export const NASCENTE_ID = 9001;

/** Moltiplicatore di spendibilità del trigger (matrice 4×4). */
export const MS = { turbo: 0.85, imboscata: 0.90, vendetta: 0.80, invasione: 0.75 };

/** FC-per-punto dell'effetto (matrice 4×4). */
export const FCPT = { power: 0.50, directDamage: 0.50, focusCoin: 0.70, enemyPower: 0.40 };

/** Cap del valore effetto (dal pool). */
export const CAP = { power: 4, directDamage: 4, focusCoin: 3, enemyPower: 4 };

/** Soglie di Lega sul valore complessivo. */
export const SOGLIE = { 2: 2.90, 3: 4.35, 4: 5.80, 5: 7.25 };

/** Cap assoluti delle statistiche (dal pool). */
export const STAT_CAPS = { power: 7, damage: 6 };

export const MATRIX_TRIGGERS = Object.keys(MS);
export const MATRIX_EFFECTS = Object.keys(FCPT);

/**
 * Stato iniziale del Nascente: L2 nudo (2 POT / 2 DAN, nessun potere).
 * @param {{power?: number, damage?: number}} [startStats]
 */
export function createNascente(startStats = {}) {
  return {
    trigger: null,
    effect: null,
    value: 0,
    power: startStats.power ?? 2,
    damage: startStats.damage ?? 2,
  };
}

/** Valore complessivo della carta (corpo + abilità pesata). */
export function valore(n) {
  return (
    n.power * 0.5 +
    n.damage * 0.35 +
    (n.trigger ? n.value * FCPT[n.effect] * MS[n.trigger] : 0)
  );
}

/** Lega derivata dal valore. Mai memorizzarla nello stato. */
export function lega(n) {
  const v = valore(n);
  for (const L of [2, 3, 4, 5]) {
    if (v <= SOGLIE[L]) return L;
  }
  return 5;
}

/** 0=L2 arco · 1=L3 spada · 2=L4 spadone · 3=L5 alato */
export function stadioVisivo(n) {
  return lega(n) - 2;
}

/** Costo FC dell'abilità corrente (0 se nuda). */
export function fcCost(n) {
  return n.trigger ? n.value * FCPT[n.effect] : 0;
}

/**
 * Acquisizione: imposta trigger+effect dalla matrice, valore 1.
 * @returns nuovo stato Nascente
 */
export function acquire(n, trigger, effect, value = 1) {
  if (!MATRIX_TRIGGERS.includes(trigger)) {
    throw new Error(`Nascente: trigger "${trigger}" fuori dalla matrice 4×4`);
  }
  if (!MATRIX_EFFECTS.includes(effect)) {
    throw new Error(`Nascente: effetto "${effect}" fuori dalla matrice 4×4`);
  }
  return { ...n, trigger, effect, value };
}

/**
 * Potenziamento effetto: value += amount, mai oltre CAP[effect].
 * @returns nuovo stato Nascente
 */
export function upgradeEffect(n, amount = 1) {
  if (!n.trigger) return n;
  const next = Math.min(n.value + amount, CAP[n.effect]);
  return { ...n, value: next };
}

/**
 * Potenziamento statistiche, con cap assoluti POT ≤7, DAN ≤6.
 * @returns nuovo stato Nascente
 */
export function upgradeStats(n, { power = 0, damage = 0 } = {}) {
  return {
    ...n,
    power: Math.min(n.power + power, STAT_CAPS.power),
    damage: Math.min(n.damage + damage, STAT_CAPS.damage),
  };
}

/**
 * Cambio: sostituisce trigger O effect mantenendo l'altro.
 * Cambiando effetto, il valore si converte al gradino di costo FC pari o
 * immediatamente inferiore nell'effetto di destinazione: un cambio non
 * aumenta MAI il valore in FC. Se nessun gradino è convertibile (nemmeno 1),
 * il cambio non è ammesso e la funzione restituisce null.
 * @returns nuovo stato Nascente, oppure null se il cambio non è ammesso
 */
export function change(n, { trigger = null, effect = null } = {}) {
  if (!n.trigger) return null;
  if (trigger && effect) throw new Error('Nascente: il cambio sostituisce trigger O effect, non entrambi');
  if (trigger) {
    if (!MATRIX_TRIGGERS.includes(trigger)) return null;
    return { ...n, trigger };
  }
  if (effect) {
    if (!MATRIX_EFFECTS.includes(effect)) return null;
    const budget = fcCost(n);
    let converted = 0;
    for (let v = Math.min(CAP[effect], 9); v >= 1; v--) {
      if (v * FCPT[effect] <= budget + 1e-9) { converted = v; break; }
    }
    if (converted < 1) return null;
    return { ...n, effect, value: converted };
  }
  return null;
}

/** Valore minimo residuo per l'effetto enemyPower (formato pool: "min n"). */
const ENEMY_POWER_MIN = 2;

/**
 * Assembla la carta reale passata al duello. Formato identico alle carte
 * di cards.js; `ability: null` finché il Nascente è nudo (estensione motore 1).
 * @param {Object} n - stato Nascente
 * @param {{name?: string, army?: string, icon?: string}} [opts]
 */
export function assembleNascenteCard(n, opts = {}) {
  const ability = n.trigger
    ? n.effect === 'enemyPower'
      ? { trigger: n.trigger, effect: n.effect, value: -n.value, minPower: ENEMY_POWER_MIN }
      : { trigger: n.trigger, effect: n.effect, value: n.value }
    : null;
  return {
    id: NASCENTE_ID,
    name: opts.name ?? 'Il Nascente',
    league: lega(n),
    power: n.power,
    damage: n.damage,
    icon: opts.icon ?? 'sparkle',
    army: opts.army ?? "Figli dell'Orizzonte",
    ability,
    description: generateNascenteDescription(n),
    flavour: 'Non è ancora ciò che sarà. Ogni scelta lo avvicina — o lo allontana — da una forma definitiva.',
    evolving: true,
  };
}
