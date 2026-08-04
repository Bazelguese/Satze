/** Mappa nomi armata del gioco → chiavi preset SatzeDialogue.ARMY */

const ARMY_NAME_TO_KEY = {
  "Figli dell'Orizzonte": 'orizzonte',
  'Corte Rossa': 'corte',
  Kethran: 'kethran',
  'Calibri Pesanti': 'calibri',
  Orathai: 'orathai',
  "L'Enclave delle Scaglie": 'enclave',
  'Ratti della Megera': 'ratti',
  Khemet: 'khemet',
  Mounthborn: 'mounthborn',
  'Patto degli Indocili': 'patto',
  Apex: 'apex',
  Mascarada: 'mascarada',
};

/** Tutte le armate con chiave preset dialogue, ordine fisso per UI dev. */
export const ARMY_DIALOGUE_OPTIONS = [
  "Figli dell'Orizzonte",
  'Corte Rossa',
  'Kethran',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
].map((name) => ({ name, key: ARMY_NAME_TO_KEY[name] }));

export function armyNameToDialogueKey(armyName) {
  return ARMY_NAME_TO_KEY[armyName] || 'orizzonte';
}
