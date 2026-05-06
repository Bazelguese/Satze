// ============================================
// LOGICA CAMPI DI BATTAGLIA
// ============================================

import { ALL_BATTLEFIELDS } from '../data';
import { shuffleArray } from '../utils/shuffle';

/**
 * Seleziona i campi di battaglia usando una funzione di mescolamento iniettata
 * (random locale, RNG deterministico per multiplayer, test).
 *
 * @param {string} mode - 'classic' | 'bareHands'
 * @param {Array} allBattlefields - Pool di definizioni campo
 * @param {(arr: Array) => Array} shuffle - deve restituire una copia mescolata
 * @returns {Array}
 */
export const pickBattlefieldsWithShuffle = (mode, allBattlefields, shuffle) => {
  if (mode === 'bareHands') {
    const neutralFields = allBattlefields.filter((b) => b.category === 'neutral');
    return shuffle(neutralFields);
  }

  const classicFields = allBattlefields.filter((b) => b.category !== 'neutral');
  const turn1Fields = classicFields.filter((b) => b.minTurn === 1);
  const turn2Fields = classicFields.filter((b) => b.minTurn >= 2);

  const shuffledT1 = shuffle(turn1Fields);
  const shuffledT2 = shuffle(turn2Fields);
  const selected = [];
  selected.push(shuffledT1.shift());

  const remaining = shuffle([...shuffledT1, ...shuffledT2]);
  selected.push(...remaining.slice(0, 4));

  return selected;
};

/**
 * Seleziona i campi di battaglia per la partita (RNG globale Math.random via shuffleArray).
 *
 * @param {string} mode - Modalità di gioco ('classic' | 'bareHands')
 * @param {Array} [allBattlefields=ALL_BATTLEFIELDS] - Pool (es. da satze.jsx)
 * @returns {Array} - Array di 5 campi selezionati
 */
export const selectBattlefields = (mode = 'classic', allBattlefields = ALL_BATTLEFIELDS) =>
  pickBattlefieldsWithShuffle(mode, allBattlefields, shuffleArray);

/**
 * Estrae i modificatori di un campo di battaglia
 * @param {Object} field - Campo di battaglia
 * @returns {Object} - Modificatori del campo
 */
export const getFieldModifiers = (field) => {
  if (!field) return {};
  
  const modifiers = {};
  
  // Trigger sempre attivi
  if (field.effect.includes('Gloria e Vendetta sempre attivi')) {
    modifiers.gloriaAlwaysActive = true;
    modifiers.vendettaAlwaysActive = true;
  }
  if (field.effect.includes('Rimonta sempre attiva')) {
    modifiers.rimontaAlwaysActive = true;
  }
  if (field.effect.includes('Imboscata sempre attiva')) {
    modifiers.imboscataAlwaysActive = true;
  }
  if (field.effect.includes('Intervento sempre attivo')) {
    modifiers.interventoAlwaysActive = true;
  }
  if (field.effect.includes('Magnanimo si attiva sempre')) {
    modifiers.magnanimoAlwaysActive = true;
  }
  if (field.effect.includes('Poteri si attivano senza trigger')) {
    modifiers.allTriggersAlwaysActive = true;
  }
  
  // Overdrive threshold modificato
  if (field.effect.includes('Overdrive si attiva con 4 FC')) {
    modifiers.overdriveThreshold = 4;
  }
  
  return modifiers;
};